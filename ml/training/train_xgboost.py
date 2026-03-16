import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import joblib

DATA_PATH = "data/processed/features.csv"

def main():

    print("Loading feature dataset...")

    df = pd.read_csv(DATA_PATH)

    X = df.drop(columns=["image", "label"])
    y = df["label"]

    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded
    )

    print("Training XGBoost model...")

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="multi:softprob",
        eval_metric="mlogloss"
    )

    model.fit(X_train, y_train)

    print("Model training complete")

    preds = model.predict(X_test)

    print("\nClassification Report\n")
    print(classification_report(y_test, preds))

    print("Saving model...")

    joblib.dump(model, "models/xgboost_eurosat.pkl")
    joblib.dump(encoder, "models/label_encoder.pkl")

    print("Model saved successfully")


if __name__ == "__main__":
    main()