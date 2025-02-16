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

# --- INITIALIZE MODELS ---
# Dummy clinical embedding model – replace with your actual model (it must provide .encode(text))
class DummyClinicalModel:
    def encode(self, text: str):
        # Returns a 384-dimensional vector (here all zeros for illustration)
        return [0.0] * 384

clinical_model = DummyClinicalModel()

# Instantiate the image embedder (uses the provided 3D CNN + transformer architecture)
image_embedder = NIfTIToEmbedding()

# Dummy function to generate a clinical info string from a CSV row.
def generate_clinical_info(row_dict: dict) -> str:
    # For example, concatenate all non-empty clinical features.
    info_parts = [f"{k}: {v}" for k, v in row_dict.items() if v not in [None, "", float("nan")]]
    return " ".join(info_parts)

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
                        output_filename = filename[:-3]  # remove the .gz extension
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
    
    # --- CSV Header Mapping ---
    csv_to_schema_mapping = {
        "Pat": "pat",
        "Age": "age",
        "Category": "category",
        "Normal": "normal",
        "MildModerateDilation": "mild_moderate_dilation",
        "VSD": "vsd",
        "ASD": "asd",
        "DORV": "dorv",
        "DLoopTGA": "d_loop_tga",
        "ArterialSwitch": "arterial_switch",
        "BilateralSVC": "bilateral_svc",
        "SevereDilation": "severe_dilation",
        "TortuousVessels": "tortuous_vessels",
        "Dextrocardia": "dextrocardia",
        "Mesocardia": "mesocardia",
        "InvertedVentricles": "inverted_ventricles",
        "InvertedAtria": "inverted_atria",
        "LeftCentralIVC": "left_central_ivc",
        "LeftCentralSVC": "left_central_svc",
        "LLoopTGA": "l_loop_tga",
        "AtrialSwitch": "atrial_switch",
        "Rastelli": "rastelli",
        "SingleVentricle": "single_ventricle",
        "DILV": "dilv",
        "DIDORV": "didorv",
        "CommonAtrium": "common_atrium",
        "Glenn": "glenn",
        "Fontan": "fontan",
        "Heterotaxy": "heterotaxy",
        "SuperoinferiorVentricles": "superoinferior_ventricles",
        "PAAtresiaOrMPAStump": "pa_atresia_or_mpa_stump",
        "PABanding": "pabanding",
        "AOPAAnastamosis": "aopa_anastamosis",
        "Marfan": "marfan",
        "CMRArtifactAO": "cmr_artifact_ao",
        "CMRArtifactPA": "cmr_artifact_pa",
    }
    
    # 4. Iterate over each patient (row) in the CSV.
    num_docs = 0
    for index, row in df.iterrows():
        # Convert the CSV row to a dictionary using the mapping.
        row_dict = {}
        for csv_key, value in row.items():
            schema_key = csv_to_schema_mapping.get(csv_key.strip(), csv_key.strip().lower())
            if pd.isna(value):
                value = ""
            if schema_key == "age" and value != "":
                try:
                    value = int(value)
                except ValueError:
                    value = 0
            row_dict[schema_key] = value

        # Make sure we have a patient identifier string.
        pat_id = str(row_dict.get("pat", index))
        row_dict["pat"] = pat_id

        # 5. Generate the clinical info string and compute the clinical embedding.
        clinical_info = generate_clinical_info(row_dict)
        clinical_embedding = clinical_model.encode(clinical_info)
        
        # 6. Compute the image embedding.
        # Here we choose the "cropped" image. The decompressed file should be in:
        # "./data/collapsed/cropped/pat{pat}_cropped.nii"
        image_path = os.path.join(EXTRACTED_FOLDER, "cropped", f"pat{pat_id}_cropped.nii")
        if not os.path.exists(image_path):
            print(f"Warning: Image file not found for patient {pat_id} at {image_path}. Skipping.")
            continue
        try:
            # image_embedder returns a numpy array of shape (512,)
            image_embedding = image_embedder(image_path).tolist()
        except Exception as e:
            print(f"Error processing image for patient {pat_id}: {e}")
            continue
        
        # 7. Build the document including every clinical field plus the embeddings.
        document = row_dict.copy()
        document["clinical_info"] = clinical_info
        document["embedding"] = clinical_embedding
        document["image_embedding"] = image_embedding
        
        # 8. Feed the document to Vespa using a unique document id.
        doc_id = f"clinical_{pat_id}"
        try:
            vespa_app.feed_data_point("clinical_data", doc_id, document)
            num_docs += 1
        except Exception as e:
            print(f"Error feeding data point for patient {pat_id}: {e}")
            continue
    
    return {"message": "Data ingested successfully", "num_docs": num_docs}
