import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models
from ml.datasets.eurosat_dataset import get_dataloaders

DATA_DIR = "ml/data/raw/eurosat/EuroSAT"
MODEL_PATH = "ml/models/resnet_eurosat.pth"


def main():

    device = torch.device("cpu")

    print("Loading dataset...")

    train_loader, test_loader, classes = get_dataloaders(DATA_DIR)

    print("Classes:", classes)

    print("Loading ResNet model...")

    model = models.resnet18(pretrained=True)

    # Freeze feature extractor layers
    for param in model.parameters():
        param.requires_grad = False

    # Replace classification head
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, len(classes))

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0001)

    epochs = 5  # small for CPU training

    print("Starting training...")

    for epoch in range(epochs):

        model.train()
        running_loss = 0

        for images, labels in train_loader:

            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            outputs = model(images)

            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        print(f"Epoch {epoch+1}/{epochs} Loss: {running_loss:.4f}")

    print("Training complete")

    torch.save(model.state_dict(), MODEL_PATH)

    print("Model saved to:", MODEL_PATH)


if __name__ == "__main__":
    main()