import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

LABELS = Path("ml/data/processed/bhuvan/labels.csv")
OUT = Path("ml/data/splits/bhuvan")
OUT.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(LABELS)

train_df = df[df["image"].str.startswith("train_")]
test_df = df[df["image"].str.startswith("test_")]

val_df, test_df = train_test_split(
    test_df, test_size=0.5, random_state=42
)

train_df["image"].to_csv(OUT / "train.txt", index=False, header=False)
val_df["image"].to_csv(OUT / "val.txt", index=False, header=False)
test_df["image"].to_csv(OUT / "test.txt", index=False, header=False)

print(
    f"Train: {len(train_df)}, "
    f"Val: {len(val_df)}, "
    f"Test: {len(test_df)}"
)
