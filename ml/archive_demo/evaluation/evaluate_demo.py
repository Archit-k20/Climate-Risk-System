import torch
from torchvision import transforms
from PIL import Image
from pathlib import Path
from ml.models.vit_demo import ViTDemo
import torch.nn.functional as F

DEVICE = "cpu"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def load_image(path):
    img = Image.open(path).convert("RGB")
    return transform(img).unsqueeze(0)

def cosine_sim(a, b):
    return F.cosine_similarity(a, b).item()

def main():
    model = ViTDemo(num_classes=1).to(DEVICE)
    model.load_state_dict(torch.load("ml/checkpoints/vit_demo.pt", map_location=DEVICE))
    model.eval()

    images = list(Path("ml/data/processed/bhuvan/images").glob("*.jpg"))[:3]

    embeddings = []
    for img_path in images:
        x = load_image(img_path).to(DEVICE)
        _, emb = model(x)
        embeddings.append((img_path.name, emb.detach()))

    print("Embedding similarity check:\n")

    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            sim = cosine_sim(embeddings[i][1], embeddings[j][1])
            print(
                f"{embeddings[i][0]} vs {embeddings[j][0]} -> similarity: {sim:.4f}"
            )

if __name__ == "__main__":
    main()
