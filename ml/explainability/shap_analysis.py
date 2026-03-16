import joblib
import shap
import numpy as np
import matplotlib.pyplot as plt

from ml.features.extract_features import extract_features

MODEL_PATH = "ml/models/xgboost_eurosat.pkl"

def main():

    print("Loading XGBoost model...")
    model = joblib.load(MODEL_PATH)

    print("Initializing SHAP explainer...")
    explainer = shap.TreeExplainer(model.get_booster())

    image_path = "ml/archive_demo/SeaLake_1.jpg"

    print("Extracting features...")
    features = extract_features(image_path)

    features = np.array(features).reshape(1, -1)

    shap_values = explainer.shap_values(features)

    print("\nFeature Importance:")

    feature_names = [
        "red_mean",
        "green_mean",
        "blue_mean",
        "edge_density",
        "texture_contrast",
        "texture_homogeneity",
        "texture_energy"
    ]

    for name, value in zip(feature_names, shap_values[0]):

        print(f"{name}: {value:.4f}")

    shap.force_plot(
        explainer.expected_value,
        shap_values,
        features,
        feature_names=feature_names,
        matplotlib=True
    )

    plt.show()


if __name__ == "__main__