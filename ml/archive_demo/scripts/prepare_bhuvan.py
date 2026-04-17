from pathlib import Path
from ml.utils.preprocess import preprocess_images

RAW_BASE = Path("ml/data/raw/bhuvan")
OUT_IMAGES = Path("ml/data/processed/bhuvan/images")
LABELS = Path("ml/data/processed/bhuvan/labels.csv")

input_dirs = {
    "train": RAW_BASE / "train_image",
    "test": RAW_BASE / "test_image"
}

preprocess_images(input_dirs, OUT_IMAGES, LABELS)
print("Bhuvan preprocessing completed successfully.")
