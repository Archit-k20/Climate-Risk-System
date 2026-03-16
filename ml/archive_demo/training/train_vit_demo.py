import torch
from torch.utils.data import DataLoader
from torchvision import transforms
from ml.models.vit_demo import ViTDemo
from ml.datasets.bhuvan_dataset import BhuvanDemoDataset
from pathlib import Path

DEVICE = "cpu"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

dataset = BhuvanDemoDataset(
    images_dir="ml/data/processed/bhuvan/images",
    transform=transform
)

loader = DataLoader(dataset, batch_size=2, shuffle=True)

model = ViTDemo(num_classes=1).to(DEVICE)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
criterion = torch.nn.BCEWithLogitsLoss()

model.train()
for epoch in range(1):
    for images, labels in loader:
        images = images.to(DEVICE)
        labels = labels.unsqueeze(1).to(DEVICE)

        logits, _ = model(images)
        loss = criterion(logits, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch+1} completed")

Path("ml/checkpoints").mkdir(exist_ok=True)
torch.save(model.state_dict(), "ml/checkpoints/vit_demo.pt")
print("Demo ViT model saved.")
