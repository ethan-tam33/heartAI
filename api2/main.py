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
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from typing import Any, Dict

import base64
app = FastAPI(title="Vespa Embeddings/RAG FastAPI Demo")

# Initialize Vespa client – assumes Vespa is running at localhost:8080
vespa_app = Vespa(url="http://localhost", port=8080)
# vespa_app = Vespa(url="https://e7032d12.d1f1f075.z.vespa-app.cloud/", port=8080)

# ---------------------------
#  CORS Middleware
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
#  Pydantic Models
# ---------------------------
class QueryRequest(BaseModel):
    query_text: str

class UploadRequest(BaseModel):
    nii_path: str  # base64-encoded .nii file content

# ---------------------------
#  Existing Endpoints
# ---------------------------
@app.post("/search")
def search_documents(req: QueryRequest):
    """
    Given a query text, generate an embedding, and search for nearest docs in Vespa.
    (This was from the original snippet, for textual queries.)
    """
    from app.embeddings import generate_embedding
    query_vec = generate_embedding(req.query_text)

    hits = vespa_app.query(
        body={
            "yql": "select * from sources * where ([{\"targetNumHits\":10}]nearestNeighbor(embedding, query_embedding));",
            "hits": 10,
            "input.query_embedding": query_vec,
            "ranking.features.query(query_embedding)": query_vec,
            "ranking.profile": "default"
        },
        schema="hvsmr"
    )
    return hits.json

@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

# ---------------------------
#  New "/upload" Endpoint
# ---------------------------
@app.post("/upload")
def upload_file(req: UploadRequest) -> Dict[str, Any]:
    """
    Receive a base64-encoded NIfTI file, convert it to an embedding,
    perform a Vespa ANN search, gather relevant doc data, then call
    the sMaRTDiagnosis function to get an AI-based diagnosis + links.
    Return them to the client as JSON.
    """
    base64_str = req.nii_path
    if not base64_str:
        raise HTTPException(status_code=400, detail="No NIfTI data received")

    # 1. Generate embedding from base64
    embedder = NIfTIToEmbedding()
    try:
        embedding = embedder.embedding_from_base64(base64_str).flatten().tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating embedding: {str(e)}")

    # 2. Query Vespa for nearest docs
    try:
        response = vespa_app.query(
            body={
                "yql": "select * from sources * where ([{\"targetNumHits\":3}]nearestNeighbor(image_embedding, query_vec));",
                "hits": 3,
                "input.query_vec": embedding,
                "ranking.features.query(query_vec)": embedding,
                "ranking.profile": "default"
            },
            schema="clinical_data"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vespa query error: {str(e)}")

    hits = response.json["root"].get("children", [])
    if not hits:
        # If we get no results, we still pass something to sMaRTDiagnosis
        # but let's at least let the user know.
        pass

    # 3. Gather doc data. We will just combine them into one string for sMaRTDiagnosis.
    #    For example, we might join 'data' fields from the top 3 hits.
    #    Or you can do something more advanced if you want.
    doc_strings = []
    for h in hits:
        fields = h.get("fields", {})
        doc_data = fields.get("data", "")
        doc_confidence = h.get("relevance", "")
        doc_strings.append(doc_data)
    combined_data = "\n".join(doc_strings) if doc_strings else "No data from Vespa"

    # 4. Pass to sMaRTDiagnosis to get textual diagnosis + relevant links
    diagnosis_text, diagnosis_links, first_diagnosis = sMaRTDiagnosis(combined_data)

    # 5. Return the final JSON to the client
    print(doc_confidence)
    return {
        "diagnosis_text": diagnosis_text,
        "links": diagnosis_links,
        "confidence": doc_confidence,
        "num_hits": len(hits),
        # "first_diagnosis": first_diagnosis
    }
