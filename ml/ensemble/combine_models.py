"""Validated, deterministic land-cover inference. No simulated predictions."""

from collections import Counter
from functools import lru_cache
from pathlib import Path
import hashlib
import json
import os

MODEL_DIR = Path(
    os.getenv("MODEL_DIR", str(Path(__file__).resolve().parents[1] / "models"))
)
REQUIRED = (
    "xgboost_eurosat.pkl",
    "label_encoder.pkl",
    "resnet_eurosat.pth",
    "vit_eurosat.pth",
)
PREPROCESSING = "eurosat-rgb224-imagenet-xgb64-canny-glcm-v1"


class ModelUnavailable(RuntimeError):
    pass


def validate_artifacts(directory=MODEL_DIR):
    manifest_path = directory / "manifest.json"
    if not manifest_path.is_file():
        raise ModelUnavailable(
            "Verified model metadata is missing. Follow docs/model-artifacts.md; predictions are disabled."
        )
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("preprocessing") != PREPROCESSING or not manifest.get(
        "training_metadata_verified"
    ):
        raise ModelUnavailable(
            "Model preprocessing compatibility has not been verified."
        )
    labels = manifest.get("labels")
    if not isinstance(labels, list) or len(labels) != 10 or len(set(labels)) != 10:
        raise ModelUnavailable("Model label metadata is invalid.")
    for name in REQUIRED:
        path = directory / name
        if not path.is_file() or path.stat().st_size < 256:
            raise ModelUnavailable(
                f"Missing model binary: {name}. Retrieve Git LFS objects."
            )
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if manifest.get("sha256", {}).get(name) != digest:
            raise ModelUnavailable(f"Model checksum mismatch: {name}")
    return manifest


@lru_cache(maxsize=1)
def load_models():
    try:
        metadata = validate_artifacts()
        import torch
        import joblib
        from torchvision import models
        from transformers import ViTConfig, ViTForImageClassification
        from ml.datasets.eurosat_dataset import inference_transform

        encoder = joblib.load(MODEL_DIR / "label_encoder.pkl")
        if list(encoder.classes_) != metadata["labels"]:
            raise ModelUnavailable("Encoder labels do not match model metadata.")
        xgb = joblib.load(MODEL_DIR / "xgboost_eurosat.pkl")
        if xgb.n_features_in_ != 7:
            raise ModelUnavailable("XGBoost feature count is incompatible.")
        resnet = models.resnet18(weights=None)
        resnet.fc = torch.nn.Linear(resnet.fc.in_features, len(encoder.classes_))
        resnet.load_state_dict(
            torch.load(
                MODEL_DIR / "resnet_eurosat.pth", map_location="cpu", weights_only=True
            )
        )
        vit = ViTForImageClassification(ViTConfig(num_labels=len(encoder.classes_)))
        vit.load_state_dict(
            torch.load(
                MODEL_DIR / "vit_eurosat.pth", map_location="cpu", weights_only=True
            )
        )
        resnet.eval()
        vit.eval()
        return xgb, encoder, resnet, vit, inference_transform(), metadata
    except ModelUnavailable:
        raise
    except Exception as exc:
        raise ModelUnavailable(
            f"Model loading failed ({type(exc).__name__}); predictions are disabled."
        ) from exc


def resolve_votes(votes):
    if len(votes) != 3:
        raise ValueError("All three model predictions are required")
    winner, count = Counter(votes.values()).most_common(1)[0]
    if count < 2:
        return {
            "status": "inconclusive",
            "model_votes": votes,
            "model_agreement": count,
            "description": "The three models disagree. No risk classification or index was assigned.",
        }
    from ml.risk.risk_engine import get_risk_assessment

    result = get_risk_assessment(winner)
    if result.get("risk_level") not in {"Low", "Medium", "High"}:
        raise ModelUnavailable("Unrecognized land-cover label")
    return {
        **result,
        "status": "completed",
        "model_votes": votes,
        "model_agreement": count,
    }


def ensemble_predict(image_path):
    import torch
    from PIL import Image
    from ml.features.extract_features import extract_features

    xgb, encoder, resnet, vit, transform, metadata = load_models()
    with Image.open(image_path) as source:
        image = source.convert("RGB")
    import numpy as np

    xgb_label = str(
        encoder.inverse_transform(
            xgb.predict(np.asarray(extract_features(image_path)).reshape(1, -1))
        )[0]
    )
    tensor = transform(image).unsqueeze(0)
    with torch.inference_mode():
        resnet_label = str(encoder.classes_[resnet(tensor).argmax(1).item()])
        vit_label = str(
            encoder.classes_[vit(pixel_values=tensor).logits.argmax(1).item()]
        )
    return {
        **resolve_votes(
            {"xgboost": xgb_label, "resnet": resnet_label, "vit": vit_label}
        ),
        "model_version": metadata.get("version", PREPROCESSING),
    }
