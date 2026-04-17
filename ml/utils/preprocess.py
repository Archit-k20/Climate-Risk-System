from pathlib import Path
from PIL import Image
import csv

TARGET_SIZE = (224, 224)

def preprocess_images(input_dirs, output_dir, labels_csv):
    output_dir.mkdir(parents=True, exist_ok=True)

    rows = []

    for split_name, img_dir in input_dirs.items():
        for img_path in img_dir.glob("*.*"):
            try:
                img = Image.open(img_path).convert("RGB")
                img = img.resize(TARGET_SIZE)

                out_name = f"{split_name}_{img_path.stem}.jpg"
                out_path = output_dir / out_name
                img.save(out_path, "JPEG", quality=90)

                rows.append([out_name, "land_cover"])
            except Exception:
                continue

    with open(labels_csv, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["image", "label"])
        writer.writerows(rows)
