import torch
import torch.nn as nn
from torchvision import models
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.metrics import accuracy_score

from ml.datasets.eurosat_dataset import get_dataloaders

DATA_DIR = "ml/data/raw/eurosat/EuroSAT"
MODEL_PATH = "ml/models/resnet_eurosat.pth"


def main():

    device = torch.device("cpu")

    print("Loading dataset...")

    train_loader, test_loader, classes = get_dataloaders(DATA_DIR)

    print("Classes:", classes)

    print("Loading trained ResNet model...")

    model = models.resnet18()

    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, len(classes))

    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))

    model = model.to(device)
    model.eval()

    y_true = []
    y_pred = []

    print("Running evaluation...")

    with torch.no_grad():

        for images, labels in test_loader:

            images = images.to(device)

            outputs = model(images)

            _, predicted = torch.max(outputs, 1)

            y_true.extend(labels.numpy())
            y_pred.extend(predicted.cpu().numpy())

    print("\nAccuracy:")
    print(accuracy_score(y_true, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=classes))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_true, y_pred))


if __name__ == "__main__":
    main()