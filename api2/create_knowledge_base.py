import os
import zipfile
import gzip
import shutil
import base64
import pandas as pd
from fastapi import FastAPI, HTTPException

# Import the image embedder from your embeddings file.
from embeddings import NIfTIToEmbedding

# Define file/folder paths
DATA_ZIP = "./data/cropped.zip"
EXTRACTED_FOLDER = "./data/collapsed"
CLINICAL_CSV = "./data/hvsmr_clinical.csv"  # adjust path if needed

# Instantiate the image embedder (uses the provided 3D CNN + transformer architecture)
image_embedder = NIfTIToEmbedding()

# --- VESPA CLIENT PLACEHOLDER ---
# Replace this with your actual vespa_app instance.
# class DummyVespaApp:
#     def feed_data_point(self, schema: str, doc_id: str, document: dict):
#         # Here you would feed the document to Vespa.
#         # For debugging we print the doc_id and a summary.
#         print(f"Feeding document {doc_id} into schema {schema} with keys: {list(document.keys())}")
#
# vespa_app = DummyVespaApp()

# --- UTILITY FUNCTIONS ---

def decompress_zip():
    """Extract the zip file to EXTRACTED_FOLDER if not already done."""
    if not os.path.exists(EXTRACTED_FOLDER):
        os.makedirs(EXTRACTED_FOLDER, exist_ok=True)
        with zipfile.ZipFile(DATA_ZIP, 'r') as zip_ref:
            zip_ref.extractall(EXTRACTED_FOLDER)
        print("Zip file extracted.")

def decompress_nii_files():
    """
    Recursively search for .nii.gz files in EXTRACTED_FOLDER,
    decompress them (remove the .gz), and move them to the appropriate subfolder.
    """
    # Define target directories for each file type:
    targets = {
        "cropped_seg_endpoints.nii.gz": os.path.join(EXTRACTED_FOLDER, "cropped_seg_endpoints"),
        "cropped_seg.nii.gz": os.path.join(EXTRACTED_FOLDER, "cropped_seg"),
        "cropped.nii.gz": os.path.join(EXTRACTED_FOLDER, "cropped"),
    }
    # Create target directories if they don't exist.
    for target_dir in targets.values():
        os.makedirs(target_dir, exist_ok=True)

    # Walk recursively through EXTRACTED_FOLDER
    for root, _, files in os.walk(EXTRACTED_FOLDER):
        for filename in files:
            if filename.endswith(".nii.gz"):
                for pattern, target_folder in targets.items():
                    if pattern in filename:
                        output_filename = filename[:-3]  # remove ".gz" extension
                        output_path = os.path.join(target_folder, output_filename)
                        # Only decompress if the .nii file does not exist already.
                        if not os.path.exists(output_path):
                            file_path = os.path.join(root, filename)
                            try:
                                with gzip.open(file_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
                                    shutil.copyfileobj(f_in, f_out)
                                print(f"Decompressed {filename} to {output_path}")
                            except Exception as e:
                                print(f"Error decompressing {file_path}: {e}")
                        break  # Found the matching pattern, no need to check others.

# --- THE FASTAPI ENDPOINT ---

# def ingest_data_from_zip(vespa_app, model):
#     # 1. Ensure the zipped data exists and decompress it.
#     if not os.path.exists(DATA_ZIP):
#         raise HTTPException(status_code=404, detail="Zip data file not found")
#     try:
#         decompress_zip()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error decompressing zip: {str(e)}")

#     # 2. Decompress all .nii.gz files into .nii files in their respective folders.
#     try:
#         decompress_nii_files()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error decompressing NIfTI files: {str(e)}")

#     # 3. Load the clinical CSV file.
#     if not os.path.exists(CLINICAL_CSV):
#         raise HTTPException(status_code=404, detail="Clinical CSV file not found")
#     try:
#         df = pd.read_csv(CLINICAL_CSV)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")

#     # 4. Iterate over each patient (row) in the CSV.
#     num_docs = 0
#     for index, row in df.iterrows():

#         # Make sure we have a patient identifier (string).
#         # If "Pat" column doesn't exist, we fallback to row index.
#         if "Pat" in df.columns:
#             pat_id = str(row["Pat"])
#         else:
#             pat_id = str(index)

#         # Convert the row to a single comma-separated string
#         # ignoring NaNs by replacing them with an empty string.
#         row_values = []
#         for val in row:
#             if pd.isna(val):
#                 row_values.append("")
#             else:
#                 row_values.append(str(val))
#         clinical_string = ",".join(row_values)

#         # 5. Compute the image embedding (using the decompressed "cropped" file).
#         #    Example path: "./data/collapsed/cropped/pat{pat}_cropped.nii"
#         image_path = os.path.join(EXTRACTED_FOLDER, "cropped", f"pat{pat_id}_cropped.nii")
#         if not os.path.exists(image_path):
#             print(f"Warning: Image file not found for patient {pat_id} at {image_path}. Skipping.")
#             continue

#         try:
#             # image_embedder returns a numpy array of shape (512,).
#             # GOLDEN
#             image_embedding = image_embedder(image_path).flatten().tolist()
#         except Exception as e:
#             print(f"Error processing image for patient {pat_id}: {e}")
#             continue

#         # 6. Construct the document
#         document = {
#             "pat": pat_id,
#             "data": clinical_string,          # The entire CSV row as a single string
#             # "image_embedding": image_embedding
#             "image_embedding": image_embedding
#         }
#         # print("Document:", document)
#         print("feeding document", pat_id, "with embedding", len(image_embedding))
#         # 7. Feed the document to Vespa using a unique document id.
#         doc_id = f"clinical_{pat_id}"
#         try:
#             vespa_app.feed_data_point("clinical_data", doc_id, document)
#             num_docs += 1
#         except Exception as e:
#             print(f"Error feeding data point for patient {pat_id}: {e}")

#     return {"message": "Data ingested successfully", "num_docs": num_docs}
def ingest_data_from_zip(vespa_app, model):
    # 1. Ensure the zipped data exists and decompress it.
    if not os.path.exists(DATA_ZIP):
        raise HTTPException(status_code=404, detail="Zip data file not found")
    try:
        decompress_zip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decompressing zip: {str(e)}")

    # 2. Decompress all .nii.gz files into .nii files in their respective folders.
    try:
        decompress_nii_files()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decompressing NIfTI files: {str(e)}")

    # 3. Load the clinical CSV file.
    if not os.path.exists(CLINICAL_CSV):
        raise HTTPException(status_code=404, detail="Clinical CSV file not found")
    try:
        df = pd.read_csv(CLINICAL_CSV)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")

    # 4. Iterate over each patient (row) in the CSV.
    num_docs = 0
    for index, row in df.iterrows():
        # Make sure we have a patient identifier (string).
        pat_id = str(row["Pat"]) if "Pat" in df.columns else str(index)

        # Convert row to a single comma-separated string, ignoring NaNs.
        row_values = ["" if pd.isna(val) else str(val) for val in row]
        clinical_string = ",".join(row_values)

        # 5. Compute the image embedding using the decompressed ".nii" file.
        image_path = os.path.join(EXTRACTED_FOLDER, "cropped", f"pat{pat_id}_cropped.nii")
        if not os.path.exists(image_path):
            print(f"Warning: Image file not found for patient {pat_id} at {image_path}. Skipping.")
            continue

        try:
            # image_embedder returns a numpy array of shape (512,).
            embedding_list = image_embedder(image_path).flatten().tolist()
        except Exception as e:
            print(f"Error processing image for patient {pat_id}: {e}")
            continue

        # 6. Construct the document. Notice we embed the image_embedding
        #    in the "type/values" format that Vespa expects for a
        #    tensor<float>(d[512]) field:
        doc_fields = {
            "pat": pat_id,
            "data": clinical_string,
            "image_embedding": {
                "type": "tensor<float>(d[512])",
                "values": embedding_list
            }
        }

        # 7. Feed the document to Vespa using a unique doc_id.
        doc_id = f"clinical_{pat_id}"
        print(f"Feeding document: {doc_id} (embedding length = {len(embedding_list)})")

        try:
            vespa_app.feed_data_point("clinical_data", doc_id, doc_fields)
            num_docs += 1
        except Exception as e:
            print(f"Error feeding data point for patient {pat_id}: {e}")

    return {"message": "Data ingested successfully", "num_docs": num_docs}
