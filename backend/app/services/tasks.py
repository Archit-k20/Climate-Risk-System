import sys
from pathlib import Path
import eventlet

eventlet.monkey_patch()

root_path = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(root_path))

from app.core.celery_app import celery_app
from ml.ensemble.combine_models import ensemble_predict
from app.services.llm_agent import generate_mitigation_report

# Risk level to numeric score mapping.
# These midpoint values match what the frontend adapter uses,
# so the gauge and the database are always in agreement.
RISK_LEVEL_TO_SCORE = {
    'Low':    22.0,
    'Medium': 55.0,
    'High':   82.0,
}

@celery_app.task(bind=True, name="analyze_image_task")
def analyze_image_task(self, file_path_str: str, image_id: int = 0, filename: str = ""):
    try:
        # ── Run the ML ensemble pipeline ──────────────────────────────────────
        risk_info = ensemble_predict(file_path_str)

        # ── Generate the LLM mitigation report ───────────────────────────────
        dynamic_report = generate_mitigation_report(risk_info)
        risk_info["dynamic_report"] = dynamic_report

        # ── Save risk score to database ───────────────────────────────────────
        # This is the critical step that was missing before.
        # We save the score here inside the task because this is where
        # the async analysis actually runs — the HTTP endpoint just
        # dispatches the task and returns immediately without waiting
        # for the result, so it can't be responsible for saving the score.
        if image_id:
            try:
                from app.db.session import SessionLocal
                from app.models.image import Image  # noqa: F401
                from app.models.risk import RiskScore

                db = SessionLocal()

                risk_level = risk_info.get('risk_level', 'Low')
                risk_type  = risk_info.get('risk_type', 'Unknown')
                land_class = risk_info.get('land_class', 'Unknown')
                score      = RISK_LEVEL_TO_SCORE.get(risk_level, 50.0)

                existing = db.query(RiskScore).filter(
                    RiskScore.image_id == image_id
                ).first()

                if not existing:
                    risk_score_record = RiskScore(
                        image_id=image_id,
                        score=score,
                        risk_level=risk_level,
                        risk_type=risk_type,
                        land_class=land_class,
                    )
                    db.add(risk_score_record)
                    db.commit()
                    print(f'[Task] Saved {land_class} → {risk_level} (score {score}) for image {image_id}')
                else:
                    # Update existing record with the latest analysis result
                    existing.score      = score
                    existing.risk_level = risk_level
                    existing.risk_type  = risk_type
                    existing.land_class = land_class
                    db.commit()
                    print(f'[Task] Updated score for image {image_id}')

                db.close()

            except Exception as db_error:
                print(f'[Task] Warning: Could not save risk score: {db_error}')

        # ── Emit a real-time WebSocket event ──────────────────────────────────
        try:
            import socketio as sio_client

            external_sio = sio_client.SimpleClient()
            external_sio.connect('http://127.0.0.1:8000')

            risk_level = risk_info.get('risk_level', 'Low')
            risk_type  = risk_info.get('risk_type', 'Unknown')

            external_sio.emit('analysis_complete', {
                'image_id':   image_id,
                'filename':   filename or Path(file_path_str).name,
                'risk_score': RISK_LEVEL_TO_SCORE.get(risk_level, 50),
                'risk_level': risk_level.lower(),
                'risk_type':  risk_type,
                'confidence': 85,
                'analyzed_at': str(Path(file_path_str).stat().st_mtime),
            })

            external_sio.disconnect()
            print(f'[Task] Emitted analysis_complete for image {image_id}')

        except Exception as emit_error:
            print(f'[Task] Socket.io emit failed (non-fatal): {emit_error}')

        return risk_info

    except Exception as exc:
        self.retry(exc=exc, max_retries=3, countdown=5)