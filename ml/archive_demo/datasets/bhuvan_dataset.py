from torch.utils.data import Dataset
from PIL import Image
from pathlib import Path

class BhuvanDemoDataset(Dataset):
    def __init__(self, images_dir, transform=None):
        self.images = list(Path(images_dir).glob("*.jpg"))
        self.transform = transform

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        label = 1.0  
        return image, label
