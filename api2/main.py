# main.py
from fastapi import FastAPI, HTTPException, Query
import pandas as pd
import os
from sentence_transformers import SentenceTransformer
from vespa.application import Vespa

app = FastAPI(title="Vespa Embeddings/RAG FastAPI Demo")

# Initialize Vespa client – assumes Vespa is running at localhost:8080
vespa_app = Vespa(url="http://localhost", port=8080)

# Load embedding model (this may take a moment on first run)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Path to the CSV dataset
DATA_FILE = "./data/hvsmr_clinical.csv"



def generate_clinical_info(row: pd.Series) -> str:
    """
    Combine selected fields from the CSV row into a single string.
    Here we skip some fields (like Pat and Age) if not needed.
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
    if not os.path.exists(DATA_FILE):
        raise HTTPException(status_code=404, detail="Data file not found")
    try:
        df = pd.read_csv(DATA_FILE)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    # read "clinica_data.sd" as string
    #  = ""
    # with open("clinica_data.sd", "r") as f:
    #     clin_sd_str = f.read()
    # Iterate over each row, compute embedding, and index document
    for index, row in df.iterrows():
        clinical_info = generate_clinical_info(row)
        embedding_vector = model.encode(clinical_info).tolist()

        doc_id = f"clinical_{index}"
        document = {
                "pat": row["Pat"],
                "age": int(row["Age"]),
                "category": row["Category"],
                "clinical_info": clinical_info,
                "embedding": embedding_vector
            }
        
        # Index the document into Vespa under the document type "clinical_data"
        vespa_app.feed_data_point("clinical_data", doc_id, document)
    return {"message": "Data ingested successfully", "num_docs": len(df)}


@app.get("/search", summary="Search clinical data via embedding similarity")
def search(query: str = Query(..., description="Search query text")):
    # Compute embedding for the query text
    query_embedding = model.encode(query).tolist()

    # Build the Vespa query using a nearestNeighbor function on the "embedding" field
    query_body = {
        "yql": "select * from sources * where ([{\"targetNumHits\": 10}]nearestNeighbor(embedding, query_embedding));",
        "query": query,
        "ranking": "default",
        "hits": 10,
        "ranking.features.query(query_embedding)": query_embedding
    }
    result = vespa_app.query(query=query_body)
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
