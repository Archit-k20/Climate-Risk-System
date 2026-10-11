import io
from datetime import timedelta
from PIL import Image as PILImage
import pytest
from sqlalchemy import select
from app.models.image import Image
from app.models.risk import RiskScore
from app.models.analysis import Analysis
from app.services.analysis_service import (
    reserve,
    execute_analysis,
    archived_reports,
    expire_stale,
    now,
)
from ml.ensemble.combine_models import (
    ModelUnavailable,
    resolve_votes,
    validate_artifacts,
)

PREFIX = "/api/v1/images"


def picture(fmt="PNG"):
    output = io.BytesIO()
    PILImage.new("RGB", (8, 8), (20, 100, 40)).save(output, format=fmt)
    return output.getvalue()


def upload(client, data=None, mime="image/png"):
    return client.post(
        PREFIX + "/upload",
        files={"file": ("sample.png", data if data is not None else picture(), mime)},
    )


def predictor(_):
    return resolve_votes({"xgboost": "Forest", "resnet": "Forest", "vit": "Forest"})


def narrator(_):
    return {
        "text": "## Executive Summary\nOriginal text preserved.\n## Potential Impacts\nSource content.\n## Actionable Mitigation Strategies\n- Review locally.",
        "source": "template",
        "reason": "No key configured.",
    }


@pytest.mark.parametrize("fmt,mime", [("PNG", "image/png"), ("JPEG", "image/jpeg")])
def test_supported_uploads(client, fmt, mime):
    response = upload(client, picture(fmt), mime)
    assert response.status_code == 200
    assert "file_path" not in response.json()
    assert client.get(f"{PREFIX}/{response.json()['id']}/file").content == picture(fmt)


@pytest.mark.parametrize(
    "data,mime,status",
    [
        (b"bad", "image/png", 400),
        (picture("TIFF"), "image/tiff", 415),
        (picture("TIFF"), "image/png", 400),
        (picture(), "image/jpeg", 400),
    ],
)
def test_invalid_uploads(client, data, mime, status):
    assert upload(client, data, mime).status_code == status


def test_size_boundaries(client):
    png = picture()
    data = png + b"0" * (5 * 1024 * 1024 - len(png))
    assert upload(client, data).status_code == 200
    assert upload(client, data + b"0").status_code == 413


def test_uploads_do_not_count_as_completed(client):
    upload(client)
    assert client.get(PREFIX + "/stats/summary").json() == {
        "total_analyzed": 0,
        "active_high_risk_zones": 0,
        "average_risk_score": None,
        "reports_generated": 0,
    }
    assert client.get(PREFIX + "/reports/full").json() == []
    assert client.get(PREFIX + "/stats/distribution").json()["total"] == 0


def test_result_is_durable_identical_and_idempotent(client, db):
    image_id = upload(client).json()["id"]
    record, fresh = reserve(db, image_id)
    assert fresh
    again, fresh = reserve(db, image_id)
    assert not fresh and record.id == again.id
    result = execute_analysis(db, record.id, record.task_id, predictor, narrator)
    assert result["score"] == 22 and result["model_agreement"] == 3
    assert result["narrative"] == narrator(None)["text"]
    assert (
        execute_analysis(
            db,
            record.id,
            record.task_id,
            lambda _: pytest.fail("Must not run twice"),
            narrator,
        )
        == result
    )
    archived = client.get(PREFIX + "/reports/full").json()[0]
    for field in [
        "score",
        "narrative",
        "risk_type",
        "land_class",
        "narrative_source",
        "model_votes",
    ]:
        assert archived[field] == result[field]
    status = client.get(PREFIX + f"/tasks/{record.task_id}").json()
    assert status["status"] == "completed" and status["result"]["score"] == 22
    assert db.query(Analysis).count() == 1
    assert client.get(PREFIX + "/stats/summary").json()["total_analyzed"] == 1


def test_inconclusive_does_not_assign_risk(client, db):
    record, _ = reserve(db, upload(client).json()["id"])
    result = execute_analysis(
        db,
        record.id,
        record.task_id,
        lambda _: resolve_votes({"a": "Forest", "b": "River", "c": "Industrial"}),
        lambda _: pytest.fail("No invented report"),
    )
    assert (
        result["status"] == "inconclusive"
        and result["score"] is None
        and result["land_class"] is None
    )
    assert client.get(PREFIX + "/stats/summary").json()["total_analyzed"] == 0


def test_failure_is_recorded_and_retry_reuses_record(client, db):
    record, _ = reserve(db, upload(client).json()["id"])
    old_task = record.task_id

    def broken(_):
        raise ModelUnavailable("Missing weights")

    with pytest.raises(ModelUnavailable):
        execute_analysis(db, record.id, record.task_id, broken, narrator)
    assert client.get(PREFIX + f"/tasks/{old_task}").json()["status"] == "failed"
    again, fresh = reserve(db, record.image_id)
    assert fresh and again.id == record.id and again.task_id != old_task
    assert db.query(Analysis).count() == 1


def test_database_failure_cannot_return_success(client, db, monkeypatch):
    record, _ = reserve(db, upload(client).json()["id"])
    commit = db.commit
    calls = 0

    def fail_result_commit():
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("database unavailable")
        commit()

    monkeypatch.setattr(db, "commit", fail_result_commit)
    with pytest.raises(RuntimeError, match="database unavailable"):
        execute_analysis(db, record.id, record.task_id, predictor, narrator)
    assert db.get(Analysis, record.id).status == "failed"
    assert db.get(Analysis, record.id).score is None


def test_queue_failure_is_not_success(client, monkeypatch):
    from app.services.tasks import analyze_image_task

    def unavailable(*args, **kwargs):
        raise RuntimeError("Queue offline")

    monkeypatch.setattr(analyze_image_task, "apply_async", unavailable)
    image_id = upload(client).json()["id"]
    assert client.post(PREFIX + f"/{image_id}/analyze-async").status_code == 503
    assert client.get(PREFIX + "/reports/full").json() == []


def test_legacy_is_deduplicated_without_filling_gaps(client, db):
    image_id = upload(client).json()["id"]
    db.add_all(
        [
            RiskScore(image_id=image_id, score=44),
            RiskScore(image_id=image_id, score=71, risk_type="Pollution Risk"),
        ]
    )
    db.commit()
    records = archived_reports(db)
    assert len(records) == 1 and records[0]["score"] == 71
    assert records[0]["risk_type"] == "Pollution Risk"
    assert (
        records[0]["risk_level"] is None
        and records[0]["location"] is None
        and records[0]["narrative"] is None
    )
    assert db.query(RiskScore).count() == 2
    assert client.get(PREFIX + "/stats/summary").json()["total_analyzed"] == 0


def test_timeout_and_old_worker_cannot_overwrite_retry(client, db):
    record, _ = reserve(db, upload(client).json()["id"])
    old_task = record.task_id
    record.created_at = now() - timedelta(hours=1)
    db.commit()
    assert expire_stale(db, record).status == "failed"
    record, _ = reserve(db, record.image_id)
    assert (
        execute_analysis(
            db, record.id, old_task, lambda _: pytest.fail("Stale task"), narrator
        )["status"]
        == "queued"
    )


def test_missing_metadata_fails_closed(tmp_path):
    with pytest.raises(ModelUnavailable, match="metadata is missing"):
        validate_artifacts(tmp_path)


@pytest.mark.parametrize(
    "votes,level",
    [
        ({"a": "River", "b": "River", "c": "Forest"}, "High"),
        ({"a": "Forest", "b": "Forest", "c": "Forest"}, "Low"),
    ],
)
def test_votes_are_repeatable(votes, level):
    results = [resolve_votes(votes) for _ in range(10)]
    assert all(r == results[0] for r in results)
    assert results[0]["risk_level"] == level


def test_shared_training_transform_and_feature_definition(tmp_path):
    import numpy as np
    from ml.datasets.eurosat_dataset import inference_transform
    from ml.features.extract_features import extract_features

    source = tmp_path / "sample.png"
    source.write_bytes(picture())
    result = extract_features(str(source))
    assert len(result) == 7 and result[:3] == [20, 100, 40]
    assert result[3] == 0 and result[4] == 0 and result[5] == 1
    tensor = inference_transform()(PILImage.open(source).convert("RGB"))
    assert tuple(tensor.shape) == (3, 224, 224)
    assert abs(float(tensor[0, 0, 0]) - (20 / 255 - 0.485) / 0.229) < 1e-5
