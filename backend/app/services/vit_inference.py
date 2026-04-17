import torch
import numpy as np
from transformers import ViTImageProcessor, ViTForImageClassification

MODEL_NAME = "google/vit-base-patch16-224"


processor = ViTImageProcessor.from_pretrained(MODEL_NAME)
model = ViTForImageClassification.from_pretrained(MODEL_NAME)
model.eval()


def run_vit_inference(image_array: np.ndarray) -> float:
    """
    Takes a preprocessed image (224x224x3, normalized)
    Returns a confidence score between 0 and 1
    """


    inputs = processor(
        images=image_array,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=1)

    score = probabilities.max().item()
    return float(score)

def extract_vit_embedding(image_array: np.ndarray) -> np.ndarray:
    inputs = processor(images=image_array, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs, output_hidden_states=True)
        last_hidden = outputs.hidden_states[-1]  


    embedding = last_hidden[:, 0, :].squeeze(0).cpu().numpy()
    return embedding.astype(np.float32)
