from pathlib import Path
from PIL import Image
import numpy as np

TARGET_SIZE = (224, 224)  

def load_and_preprocess_image(image_path: str) -> np.ndarray:
    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError("Image file not found")

    try:
        image = Image.open(path).convert("RGB")
    except Exception as e:
        raise ValueError("Unable to open image") from e

    
    image = image.resize(TARGET_SIZE)

    
    image_array = np.array(image, dtype=np.float32)

    
    image_array /= 255.0

    return image_array
