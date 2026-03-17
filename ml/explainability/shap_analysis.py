import joblib
import shap
import numpy as np
import matplotlib.pyplot as plt

from ml.features.extract_features import extract_features

MODEL_PATH = "ml/models/xgboost_eurosat.pkl"

def main():

    print("Loading XGBoost model...")
    model = joblib.load(MODEL_PATH)

    # Example image
    image_path = "ml/data/raw/eurosat/EuroSAT/SeaLake/SeaLake_1.jpg"

    print("Extracting features...")
    features = extract_features(image_path)
    features = np.array(features).reshape(1, -1)

    # ---- SHAP Fix ----
    # create a small background dataset
    background = np.random.normal(size=(50, features.shape[1]))

    print("Initializing SHAP explainer...")
    explainer = shap.Explainer(model.predict_proba, background)

    print("Computing SHAP values...")
    shap_values = explainer(features)

    feature_names = [
        "red_mean",
        "green_mean",
        "blue_mean",
        "edge_density",
        "texture_contrast",
        "texture_homogeneity",
        "texture_energy"
    ]

    print("\nFeature Contributions:")
    # get predicted class
    pred_class = model.predict(features)[0]

    print("\nPredicted class index:", pred_class)
    print("\nFeature Contributions:")

    for name, value in zip(feature_names, shap_values.values[0][:, pred_class]):
        print(f"{name}: {float(value):.4f}")

    print("Generating SHAP plot...")

    shap.plots.waterfall(
        shap.Explanation(
            values=shap_values.values[0][:, pred_class],
            base_values=shap_values.base_values[0][pred_class],
            data=features[0],
            feature_names=feature_names
        )
    )

    plt.show()


if __name__ == "__main__":
    main()