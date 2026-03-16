import torch
import joblib
import numpy as np
import random

from transformers import ViTForImageClassification
from torchvision import transforms
from PIL import Image

# Paths
XGB_MODEL_PATH = "ml/models/xgboost_eurosat.pkl"
LABEL_ENCODER_PATH = "ml/models/label_encoder.pkl"
RESNET_MODEL_PATH = "ml/models/resnet_eurosat.pth"
VIT_MODEL_PATH = "ml/models/vit_eurosat.pth"

IMAGE_SIZE_RESNET = 224
IMAGE_SIZE_VIT = 224


# ---------- Load Models ----------

print("Loading XGBoost model...")
xgb_model = joblib.load(XGB_MODEL_PATH)

print("Loading label encoder...")
label_encoder = joblib.load(LABEL_ENCODER_PATH)

from torchvision import models
import torch.nn as nn

print("Loading ResNet model...")

resnet = models.resnet18()

num_features = resnet.fc.in_features
resnet.fc = nn.Linear(num_features, len(label_encoder.classes_))

resnet.load_state_dict(torch.load(RESNET_MODEL_PATH, map_location="cpu"))

resnet.eval()

print("Loading ViT model...")
vit = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=len(label_encoder.classes_),
    ignore_mismatched_sizes=True
)

vit.load_state_dict(torch.load(VIT_MODEL_PATH, map_location="cpu"))
vit.eval()


# ---------- Image Transform ----------

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


# ---------- Feature Extraction (same as earlier) ----------

def extract_features(image):

    img = np.array(image)

    red_mean = img[:, :, 0].mean()
    green_mean = img[:, :, 1].mean()
    blue_mean = img[:, :, 2].mean()

    edge_density = np.mean(np.abs(np.gradient(img[:, :, 0])))

    texture_contrast = np.std(img)
    texture_homogeneity = np.mean(img)
    texture_energy = np.sum(img ** 2) / img.size

    return np.array([
        red_mean,
        green_mean,
        blue_mean,
        edge_density,
        texture_contrast,
        texture_homogeneity,
        texture_energy
    ]).reshape(1, -1)


# ---------- Individual Predictions ----------

def predict_xgboost(image):

    features = extract_features(image)

    pred = xgb_model.predict(features)

    return label_encoder.inverse_transform(pred)[0]


def predict_resnet(image):

    img = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = resnet(img)

    pred = torch.argmax(outputs, dim=1).item()

    return label_encoder.classes_[pred]


def predict_vit(image):

    img = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = vit(pixel_values=img)

    pred = torch.argmax(outputs.logits, dim=1).item()

    return label_encoder.classes_[pred]


# ---------- Ensemble Voting ----------

def ensemble_predict(image_path):

    image = Image.open(image_path).convert("RGB")

    pred_xgb = predict_xgboost(image)
    pred_resnet = predict_resnet(image)
    pred_vit = predict_vit(image)

    print("XGBoost prediction:", pred_xgb)
    print("ResNet prediction:", pred_resnet)
    print("ViT prediction:", pred_vit)

    votes = [pred_xgb, pred_resnet, pred_vit]

    final_prediction = max(set(votes), key=votes.count)

    print("\nFinal Ensemble Prediction:", final_prediction)

    return final_prediction


# ---------- Test Run ----------

if __name__ == "__main__":
    for i in range(8):
        count = random.choice(range(1, 100))
        test_image = f"ml/data/raw/eurosat/EuroSAT/Highway/Highway_{count}.jpg"
        ensemble_predict(test_image)