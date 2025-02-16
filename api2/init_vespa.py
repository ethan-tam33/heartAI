import os
import zipfile
import gzip
import shutil
import re
import pandas as pd

from fastapi import FastAPI, HTTPException
from sentence_transformers import SentenceTransformer
from vespa.application import Vespa  # make sure the Vespa client library is installed
from embeddings import NIfTIToEmbedding  # our image embedder

app = FastAPI()


def camel_to_snake(name: str) -> str:
    """
    Convert CamelCase or mixedCase to snake_case.
    Example: "MildModerateDilation" -> "mild_moderate_dilation"
    """
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def generate_clinical_info(row: pd.Series) -> str:
    """
    Generate a descriptive string by concatenating all clinical features
    from a CSV row.
    """
    info = []
    for key, value in row.items():
        val = str(value) if pd.notnull(value) else "N/A"
        info.append(f"{key}: {val}")
    return ", ".join(info)


def decompress_data():
    """
    Unzip the archive and decompress all .nii.gz files.
    The decompressed files will be available in ./data/collapsed.
    """
    zip_path = "./data/cropped.zip"
    collapsed_dir = "./data/collapsed"
    if not os.path.exists(collapsed_dir):
        os.makedirs(collapsed_dir)

    # Extract the zip archive
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(collapsed_dir)

    # Decompress every .nii.gz file into its corresponding .nii file
    for file in os.listdir(collapsed_dir):
        if file.endswith(".nii.gz"):
            file_path = os.path.join(collapsed_dir, file)
            out_path = os.path.join(collapsed_dir, file[:-3])  # remove ".gz"
            with gzip.open(file_path, 'rb') as f_in:
                with open(out_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            # Optionally remove the original .nii.gz file:
            # os.remove(file_path)


@app.post("/ingest", summary="Ingest CSV and image data into Vespa")
def ingest_data():
    collapsed_dir = "./data/collapsed"
    # Check if the expected decompressed image exists; if not, decompress.
    test_file = os.path.join(collapsed_dir, "pat0_cropped.nii")
    if not os.path.exists(test_file):
        decompress_data()

    # Load the clinical CSV data.
    csv_path = "./data/hvsrmr_clinical.csv"
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found")
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")

    # Initialize embedding models:
    # -- Text embedder: we use a SentenceTransformer that outputs a 384-dim embedding.
    text_embedder = SentenceTransformer('all-MiniLM-L6-v2')
    # -- Image embedder: our custom 3D CNN+Transformer from embeddings.py (outputs 512-dim embedding).
    image_embedder = NIfTIToEmbedding()

    # Initialize the Vespa client (adjust the URL as needed)
    vespa_app = Vespa(url="http://localhost:8080")

    for index, row in df.iterrows():
        # Build a clinical information string containing every feature.
        clinical_info = generate_clinical_info(row)
        # Compute the text embedding (384 dimensions)
        text_embedding = text_embedder.encode(clinical_info).tolist()

        # Determine the corresponding image file path using the "Pat" column.
        pat_id = str(row["Pat"])
        image_file = os.path.join(collapsed_dir, f"pat{pat_id}_cropped.nii")
        if not os.path.exists(image_file):
            print(f"Warning: Image file {image_file} not found. Skipping this record.")
            continue

        try:
            image_embedding_np = image_embedder(image_file)
            # Ensure the embedding is a 1D vector
            if image_embedding_np.ndim == 2:
                image_embedding_np = image_embedding_np[0]
            image_embedding = image_embedding_np.tolist()
        except Exception as e:
            print(f"Error computing image embedding for {image_file}: {e}")
            image_embedding = [0.0] * 512  # fallback zero vector

        # Convert the CSV row to a dictionary with snake_case keys
        doc = {}
        for key, value in row.items():
            key_snake = camel_to_snake(key)
            if key == "Age" and pd.notnull(value):
                doc[key_snake] = int(value)
            else:
                doc[key_snake] = str(value) if pd.notnull(value) else ""
        # Add our generated fields
        doc["clinical_info"] = clinical_info
        doc["embedding"] = text_embedding
        doc["image_embedding"] = image_embedding

        # Create a unique document id. (Using "Pat" ensures the CSV row matches the image.)
        doc_id = f"clinical_{pat_id}"
        # Feed the document into Vespa (document type "clinical_data")
        vespa_app.feed_data_point("clinical_data", doc_id, doc)

    return {"message": "Data ingested successfully", "num_docs": len(df)}
ingest_data()