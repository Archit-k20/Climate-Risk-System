import torch
from torchvision import transforms
from PIL import Image
from pathlib import Path
from ml.models.vit_demo import ViTDemo

DEVICE = "cpu"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

model = ViTDemo(num_classes=1).to(DEVICE)
model.load_state_dict(
    torch.load("ml/checkpoints/vit_demo.pt", map_location=DEVICE)
)
model.eval()

logits = []

images = list(Path("ml/data/processed/bhuvan/images").glob("*.jpg"))[:20]

with torch.no_grad():
    for img_path in images:
        img = Image.open(img_path).convert("RGB")
        img = transform(img).unsqueeze(0).to(DEVICE)
        logit, _ = model(img)
        logits.append(logit.item())
        print(f"{img_path.name}: {logit.item():.4f}")

print("\nSummary:")
print(f"Min logit: {min(logits):.4f}")
print(f"Max logit: {max(logits):.4f}")
