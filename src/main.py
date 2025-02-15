from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from vespa.application import Vespa
from vespa.package import ApplicationPackage, Schema, Document, Field
from vespa.deployment import VespaCloud
import os
from typings import MedicalRecord
from typing import List

app = FastAPI()

# Initialize Vespa client
vespa_app = Vespa(url="http://localhost", port=8000)

# Replace with your tenant name from the Vespa Cloud Console
tenant_name = "ethantam33"
# Replace with your application name (does not need to exist yet)
application = "heartaivespa"

torch_embed_size = 128
#euclidean, angular, dotproduct, prenormalized-angular, hamming, geodegrees
distance_metric = "dotproduct"

print(f"Embedding size: {torch_embed_size}")
print(f"Distance metric: {distance_metric}")

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
                distance_metric=f"{distance_metric}",
            ),
            Field(name="Normal", type="bool", indexing=["summary"]),
            Field(name="MildModerateDilation", type="bool", indexing=["summary"]),
            Field(name="VSD", type="bool", indexing=["summary"]),
            Field(name="ASD", type="bool", indexing=["summary"]),
            Field(name="DORV", type="bool", indexing=["summary"]),
            Field(name="DLoopTGA", type="bool", indexing=["summary"]),
            Field(name="ArterialSwitch", type="bool", indexing=["summary"]),
            Field(name="BilateralSVC", type="bool", indexing=["summary"]),
            Field(name="SevereDilation", type="bool", indexing=["summary"]),
            Field(name="TortuousVessels", type="bool", indexing=["summary"]),
            Field(name="Dextrocardia", type="bool", indexing=["summary"]),
            Field(name="Mesocardia", type="bool", indexing=["summary"]),
            Field(name="InvertedVentricles", type="bool", indexing=["summary"]),
            Field(name="InvertedAtria", type="bool", indexing=["summary"]),
            Field(name="LeftCentralIVC", type="bool", indexing=["summary"]),
            Field(name="LeftCentralSVC", type="bool", indexing=["summary"]),
            Field(name="LLoopTGA", type="bool", indexing=["summary"]),
            Field(name="AtrialSwitch", type="bool", indexing=["summary"]),
            Field(name="Rastelli", type="bool", indexing=["summary"]),
            Field(name="SingleVentricle", type="bool", indexing=["summary"]),
            Field(name="DILV", type="bool", indexing=["summary"]),
            Field(name="DIDORV", type="bool", indexing=["summary"]),
            Field(name="CommonAtrium", type="bool", indexing=["summary"]),
            Field(name="Glenn", type="bool", indexing=["summary"]),
            Field(name="Fontan", type="bool", indexing=["summary"]),
            Field(name="Heterotaxy", type="bool", indexing=["summary"]),
            Field(name="SuperoinferiorVentricles", type="bool", indexing=["summary"]),
            Field(name="PAAtresiaOrMPAStump", type="bool", indexing=["summary"]),
            Field(name="PABanding", type="bool", indexing=["summary"]),
            Field(name="AOPAAnastamosis", type="bool", indexing=["summary"]),
            Field(name="Marfan", type="bool", indexing=["summary"]),
            Field(name="CMRArtifactAO", type="bool", indexing=["summary"]),
            Field(name="CMRArtifactPA", type="bool", indexing=["summary"])
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

# deploy!
from vespa.deployment import VespaDocker
vespa_container = VespaDocker()
vespa_connection = vespa_container.deploy(application_package=package)

@app.post("/insert_records/")
async def insert_records(records: List[MedicalRecord]):
    print("Inserting records...")
    print(records)
    responses = []
    try:
        with vespa_app.syncio() as sync_app:
            for record in records:
                print("data_id: ", str(record.Pat))
                print("dict: ", record.dict)
                response = sync_app.feed_data_point(
                    schema="medical_records",
                    data_id=str(record.Pat),  # Unique identifier
                    fields=record.dict()
                )
                print(response.json())
                print("byeee")
                responses.append(response.json())
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/query/")
async def query_vespa(embedding: List[float], top_k: int = 5):
    if len(embedding) != torch_embed_size:
        raise HTTPException(status_code=400, detail=f"Embedding size must be {torch_embed_size}")

    query_body = {
        "yql": 'select * from sources medical_records where {targetHits:%d} nearestNeighbor(heart_embedding, query_embedding)' % top_k,
        "input.query(query_embedding)": {
            "value": embedding
        }
    }

    response = vespa_app.query(body=query_body)
    return response.json()