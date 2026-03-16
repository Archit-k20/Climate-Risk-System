import os
import cv2
import pandas as pd
import numpy as np
from tqdm import tqdm
from skimage.feature import graycomatrix, graycoprops

DATASET_PATH = "data/raw/eurosat/EuroSAT"
OUTPUT_FILE = "data/processed/features.csv"


def extract_texture_features(gray_img):
    glcm = graycomatrix(gray_img, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)

    contrast = graycoprops(glcm, 'contrast')[0, 0]
    homogeneity = graycoprops(glcm, 'homogeneity')[0, 0]
    energy = graycoprops(glcm, 'energy')[0, 0]

    return contrast, homogeneity, energy


def extract_features(image_path):

    img = cv2.imread(image_path)

    img = cv2.resize(img, (64, 64))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    red_mean = np.mean(img[:, :, 2])
    green_mean = np.mean(img[:, :, 1])
    blue_mean = np.mean(img[:, :, 0])

    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges > 0) / edges.size

    contrast, homogeneity, energy = extract_texture_features(gray)

    return [
        red_mean,
        green_mean,
        blue_mean,
        edge_density,
        contrast,
        homogeneity,
        energy
    ]


def main():

    rows = []

    classes = os.listdir(DATASET_PATH)

    for label in classes:

        class_path = os.path.join(DATASET_PATH, label)

        if not os.path.isdir(class_path):
            continue

        for image in tqdm(os.listdir(class_path)):

            image_path = os.path.join(class_path, image)

            features = extract_features(image_path)

            rows.append([
                image,
                *features,
                label
            ])

    columns = [
        "image",
        "red_mean",
        "green_mean",
        "blue_mean",
        "edge_density",
        "texture_contrast",
        "texture_homogeneity",
        "texture_energy",
        "label"
    ]

    df = pd.DataFrame(rows, columns=columns)

    df.to_csv(OUTPUT_FILE, index=False)

    print("Feature extraction complete")
    print("Saved to:", OUTPUT_FILE)
    print("Total samples:", len(df))


if __name__ == "__main__":
    main()