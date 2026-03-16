import torch
import torch.nn as nn
from transformers import ViTForImageClassification
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split
from sklearn.metrics import accuracy_score, classification_report
from tqdm import tqdm

DATA_DIR = "ml/data/raw/eurosat/EuroSAT"
MODEL_PATH = "ml/models/vit_eurosat.pth"


def main():

    device = torch.device("cpu")

    print("Loading dataset...")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])

    dataset = datasets.ImageFolder(
        DATA_DIR,
        transform=transform
    )

    classes = dataset.classes
    print("Classes:", classes)

    # -------- Train/Test Split --------

    train_size = int(0.8 * len(dataset))
    test_size = len(dataset) - train_size

    train_dataset, test_dataset = random_split(
        dataset,
        [train_size, test_size]
    )

    print("Train size:", len(train_dataset))
    print("Test size:", len(test_dataset))

    test_loader = DataLoader(
        test_dataset,
        batch_size=32,
        shuffle=False
    )

    # -------- Load Model --------

    print("Loading ViT model...")

    model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=len(classes),
        ignore_mismatched_sizes=True
    )

    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))

    model = model.to(device)
    model.eval()

    y_true = []
    y_pred = []

    print("Running inference...")

    with torch.no_grad():

        for images, labels in tqdm(test_loader):

            images = images.to(device)

            outputs = model(pixel_values=images)

            preds = torch.argmax(outputs.logits, dim=1)

            y_true.extend(labels.numpy())
            y_pred.extend(preds.cpu().numpy())

    print("\nAccuracy:")
    print(accuracy_score(y_true, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=classes))


if __name__ == "__main__":
    main()