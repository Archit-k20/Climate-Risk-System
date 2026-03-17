import torch
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

from transformers import ViTForImageClassification
from torchvision import transforms

MODEL_PATH = "ml/models/vit_eurosat.pth"

def main():

    device = torch.device("cpu")

    model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=10,
        ignore_mismatched_sizes=True
    )

    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))

    model.to(device)
    model.eval()

    image_path = "ml/data/raw/eurosat/EuroSAT/SeaLake/SeaLake_1.jpg"

    transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.ToTensor()
    ])

    image = Image.open(image_path).convert("RGB")

    input_tensor = transform(image).unsqueeze(0)

    input_tensor.requires_grad_()

    outputs = model(pixel_values=input_tensor)

    pred = outputs.logits.argmax()

    outputs.logits[0, pred].backward()

    saliency = input_tensor.grad.abs()

    saliency, _ = torch.max(saliency, dim=1)

    saliency = saliency.squeeze().detach().numpy()

    plt.subplot(1,2,1)
    plt.title("Original Image")
    plt.imshow(image)

    plt.subplot(1,2,2)
    plt.title("Saliency Map")
    plt.imshow(saliency, cmap="hot")

    plt.show()


if __name__ == "__main__":
    main()