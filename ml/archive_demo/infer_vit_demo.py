import torch
from torchvision import transforms
from PIL import Image
from ml.models.vit_demo import ViTDemo
from ml.risk.risk_interpreter import (
    normalize_risk_score,
    categorize_risk,
    generate_explanation
)

DEVICE = "cpu"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def run_inference(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0)

    model = ViTDemo(num_classes=1).to(DEVICE)
    model.load_state_dict(
        torch.load("ml/checkpoints/vit_demo.pt", map_location=DEVICE)
    )
    model.eval()

    with torch.no_grad():
        logits, embedding = model(image)
        logit = logits.item()

    score = normalize_risk_score(logit)
    level = categorize_risk(score)
    explanation = generate_explanation(level, score)

    print("Inference Result")
    print("----------------")
    print(f"Risk Score: {score}")
    print(f"Risk Level: {level}")
    print(f"Explanation: {explanation}")

if __name__ == "__main__":
    # Example image (use any processed or uploaded image)
    run_inference(r"ml\data\processed\bhuvan\images\test_Test_1.jpg")
# ml\inference\testing_images\test_Test_1.jpg