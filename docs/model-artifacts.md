# Model compatibility and honest failure states

The inference runtime requires **both genuine binaries and verified training metadata**. No metadata has been invented for the archived checkpoints. A fresh checkout may contain Git LFS pointer files; these are not usable models.

1. Install Git LFS from its official distribution, then run `git lfs install` and `git lfs pull --include="ml/models/*"` in this repository.
2. Recover the original training configuration. Verify the label order, seven XGBoost features, input dimensions, normalization, ResNet18 architecture and ViT base configuration against each checkpoint. This repository's dataset loader is evidence of the intended transform, not proof of how the archived weights were trained.
3. Create an ignored `ml/models/manifest.json` **only after compatibility is established**:

```json
{
  "version": "your-verified-checkpoint-version",
  "training_metadata_verified": true,
  "preprocessing": "eurosat-rgb224-imagenet-xgb64-canny-glcm-v1",
  "labels": ["AnnualCrop", "Forest", "HerbaceousVegetation", "Highway", "Industrial", "Pasture", "PermanentCrop", "Residential", "River", "SeaLake"],
  "sha256": {
    "label_encoder.pkl": "verified-sha256",
    "resnet_eurosat.pth": "verified-sha256",
    "vit_eurosat.pth": "verified-sha256",
    "xgboost_eurosat.pkl": "verified-sha256"
  }
}
```

The label list must equal the recovered encoder's exact class order. Do not simply copy this example or set the verification flag to bypass missing evidence. Compare SHA-256 digests with the repository's trusted LFS OIDs. Load only trusted pickle/joblib artifacts.

Inference reuses `ml/features/extract_features.py` (64px RGB means, grayscale Canny density and GLCM contrast/homogeneity/energy) and the shared dataset transform (224px RGB, ImageNet normalization). The ViT configuration is created locally; startup does not download an unrelated pretrained model. State dictionaries load strictly with `weights_only=True`.

A missing manifest, pointer file, checksum mismatch, incompatible encoder, or failed model load makes the model unavailable. A three-way ensemble disagreement is inconclusive and produces no risk score. Otherwise the original rule mapping returns a **heuristic** Low/Medium/High index of 22/55/82; agreement is reported separately as a count out of three.

This validates file and runtime compatibility, **not scientific accuracy or calibration**. No retraining, new dataset, or accuracy benchmark is included in this UI/workflow repair.
