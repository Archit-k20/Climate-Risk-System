import pandas as pd
import joblib

from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split


DATA_PATH = "ml/data/processed/features.csv"
MODEL_PATH = "ml/models/xgboost_eurosat.pkl"
ENCODER_PATH = "ml/models/label_encoder.pkl"


def main():

    print("Loading dataset...")

    df = pd.read_csv(DATA_PATH)

    X = df.drop(columns=["image", "label"])
    y = df["label"]

    print("Loading label encoder...")

    label_encoder = joblib.load(ENCODER_PATH)

    y_encoded = label_encoder.transform(y)

    print("Splitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded
    )

    print("Loading trained model...")

    model = joblib.load(MODEL_PATH)

    print("Running predictions...")

    preds = model.predict(X_test)

    print("\nModel Accuracy:")
    print(accuracy_score(y_test, preds))

    print("\nClassification Report:")
    print(classification_report(y_test, preds, target_names=label_encoder.classes_))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, preds))


if __name__ == "__main__":
    main()