# main.py
from fastapi import FastAPI, HTTPException, Query
import pandas as pd
import os
from sentence_transformers import SentenceTransformer
from vespa.application import Vespa
import requests
from dotenv import load_dotenv
from embeddings import NIfTIToEmbedding
from smart_diagnosis import sMaRTDiagnosis
from create_knowledge_base import ingest_data_from_zip

import base64
app = FastAPI(title="Vespa Embeddings/RAG FastAPI Demo")

# Initialize Vespa client – assumes Vespa is running at localhost:8080
vespa_app = Vespa(url="http://localhost", port=8080)

# Load embedding model (this may take a moment on first run)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Path to the CSV dataset
DATA_FILE = "./data/hvsmr_clinical.csv"

# for eahc image create doc, embeding plus 

def generate_clinical_info(row: pd.Series) -> str:
    """
    Combine selected fields from 
    
    # 59 docs
    #embeddings + data e Pat and Age) if not needed.
    Adjust as necessary.
    """
    fields = []
    # For example, include all columns except Pat and Age in the clinical_info string.
    for col, val in row.items():
        if col not in ["Pat", "Age"] and pd.notnull(val) and str(val).strip() != "":
            fields.append(f"{col}: {val}")
    return ", ".join(fields)


@app.post("/ingest", summary="Ingest CSV data into Vespa")
def ingest_data():
    """
    Ingest CSV data into Vespa.
    """
    
    # if not os.path.exists(DATA_FILE):
    #     raise HTTPException(status_code=404, detail="Data file not found")
    # try:
    #     df = pd.read_csv(DATA_FILE)
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    # read "clinica_data.sd" as string
    #  = ""
    # with open("clinica_data.sd", "r") as f:
    #     clin_sd_str = f.read()
    # Iterate over each row, compute embedding, and index document
    # for index, row in df.iterrows():
    #     clinical_info = generate_clinical_info(row)
    #     embedding_vector = model.encode(clinical_info).tolist()

    #     doc_id = f"clinical_{index}"
    #     document = {
    #             "pat": row["Pat"],
    #             "age": int(row["Age"]),
    #             "category": row["Category"],
    #             "clinical_info": clinical_info,
    #             "embedding": embedding_vector,
    #            # "image_embedding":  "ghgfhdhd"
    #         }
        
    #     # Index the document into Vespa under the document type "clinical_data"
    #     vespa_app.feed_data_point("clinical_data", doc_id, document)
    
    return ingest_data_from_zip(vespa_app, model)


@app.get("/search", summary="Search clinical data via embedding similarity")
def search(query: str = Query(..., description="Search query text")):
    # Compute embedding for the query text
    # query_embedding = model.encode(query).tolist()
    with open("/Users/socratesj.osorio/Development/heartAI/api2/mesh1.nii", "rb") as nifti_file:
        base64_nifti = base64.b64encode(nifti_file.read()).decode('utf-8')
    embedder = NIfTIToEmbedding()
    heart_embedding = embedder.load_nifti_from_base64(base64_nifti)
    # print(heart_embedding.shape)
    # query_embedding = embedder(query)

    # Build the Vespa query using a nearestNeighbor function on the "embedding" field
    query_body = {
        "yql": "select * from sources * where ([{\"targetNumHits\": 10}]nearestNeighbor(image_embedding, query_embedding));",
        "query": query,
        "ranking": "default",
        "hits": 10,
        "ranking.features.query(query_embedding)": heart_embedding
    }
    result = vespa_app.query(query=query_body)

    #call perplexity
    return result

def vespa_search(embeddings):

    # Build the Vespa query using a nearestNeighbor function on the "embedding" field
    query_body = {
        "yql": "select * from sources * where ([{\"targetNumHits\": 10}]nearestNeighbor(image_embedding, query_embedding));",
        "query": query,
        "ranking": "default",
        "hits": 10,
        "ranking.features.query(query_embedding)": query_embedding
    }
    
# should receive a nii file in base 64
def nii_to_suggestion(nii_gz):
    # SETUP:
    # start app
    # call david's stuff to get nii model
    # embed that
    # store embeddings in vespa pass it vespa search()
    # wait for user input

    # ON USER INPUT:
    # call david stuff to get nii model
    # embed that
    # call vespa search 
    # pass output to perplexity
    # return ai explanation
    # {
    #     "explanation": str
    #     "links": str
    #     "confidence_level":
    #     "most_similar_nii" (stretch) as base64
    #     "perplexity": float
    # }

    # gets passed sample.nii (user's file) as a base64, returns base64 too
    compacted_nii = nerf_conversion(nii_gz)

    # creates embeddings from nii
    embedder = NIfTIToEmbedding()
    embeddings = embedder.load_nifti_from_base64(compacted_nii)

    # calls vespa search
    vespa_output = vespa_search(embeddings)

    # calls perplexity
    response, links = sMaRTDiagnosis(vespa_output)

    return {"explanation": response, "links": links}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
