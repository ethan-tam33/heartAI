# app/main.py

from fastapi import FastAPI, Query
from typing import List, Optional
from vespa.query import Vespa
from pydantic import BaseModel

app = FastAPI()

# Connect to Vespa
vespa_app = Vespa(url="http://localhost", port=8080)

class QueryRequest(BaseModel):
    query_text: str

@app.post("/search")
def search_documents(req: QueryRequest):
    """
    Given a query text, generate an embedding, and search for nearest docs in Vespa.
    """
    from app.embeddings import generate_embedding
    query_vec = generate_embedding(req.query_text)

    # We'll use Vespa's ANN search on 'embedding' field.
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
