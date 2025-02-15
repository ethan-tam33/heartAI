# main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from vespa.application import Vespa
from vespa.package import ApplicationPackage, Schema, Document, Field
from vespa.deployment import VespaCloud
import os
from typings import MedicalRecord
from typing import List

app = FastAPI()

# IMPORTANT: Change the port so you’re not conflicting with the FastAPI port.
vespa_app = Vespa(url="http://localhost", port=8080)

tenant_name = "socrates"
application = "heartaivespa"

torch_embed_size = 128
distance_metric = "dotproduct"  # Or "euclidean", but make it consistent below.

schema = Schema(
    name="medical_records",
    document=Document(
        fields=[
            Field(name="Pat", type="int", indexing=["summary"]),
            Field(name="Age", type="int", indexing=["summary"]),
            Field(name="Category", type="string", indexing=["index", "summary"]),
            Field(
                name="heart_embedding",
                type=f"tensor<float>(x[{torch_embed_size}])",
                indexing=["index"],
                attribute=True,
                distance_metric="dotproduct"  # match distance_metric above!
            ),
            # ... rest of your boolean fields ...
        ]
    )
)

package = ApplicationPackage(
    name=application,
    schema=[schema]
)

vespa_cloud = VespaCloud(
    tenant=tenant_name,
    application=application,
    application_package=package,
    key_content=os.getenv("VESPA_TEAM_API_KEY")
)

@app.post("/insert_records/")
async def insert_records(records: List[MedicalRecord]):
    print("Inserting records...")
    print(records)
    responses = []
    try:
        # If you want to use vespa_app.syncio, do so here.
        with vespa_app.syncio() as sync_app:
            for record in records:
                print("ayooo")
                response = sync_app.feed_data_point(
                    schema="medical_records",
                    data_id=str(record.Pat),
                    fields=record.dict()
                )
                print("byeee")
                responses.append(response.json())
        # CRITICAL: Return at the end so FastAPI can finish the request
        return {"message": "Records inserted successfully", "responses": responses}
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query/")
async def query_vespa(embedding: List[float], top_k: int = 5):
    if len(embedding) != torch_embed_size:
        raise HTTPException(
            status_code=400,
            detail=f"Embedding size must be {torch_embed_size}"
        )

    query_body = {
        "yql": "select * from sources medical_records "
               f"where {{targetHits:{top_k}}} nearestNeighbor(heart_embedding, query_embedding)",
        "input.query(query_embedding)": {
            "value": embedding
        }
    }
    response = vespa_app.query(body=query_body)
    return response.json()
