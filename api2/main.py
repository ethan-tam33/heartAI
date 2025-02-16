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

import base64
app = FastAPI(title="Vespa Embeddings/RAG FastAPI Demo")

# Initialize Vespa client – assumes Vespa is running at localhost:8080
vespa_app = Vespa(url="http://localhost", port=8080)
# vespa_app = Vespa(url="https://e7032d12.d1f1f075.z.vespa-app.cloud/", port=8080)

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


# @app.get("/search", summary="Search clinical data via embedding similarity")
# def search(query: str = Query(..., description="Search query text")):
#     # Compute embedding for the query text
#     # query_embedding = model.encode(query).tolist()
#     with open("/Users/socratesj.osorio/Development/heartAI/api2/mesh1.nii", "rb") as nifti_file:
#         base64_nifti = base64.b64encode(nifti_file.read()).decode('utf-8')

#     heart_embedding = NIfTIToEmbedding().embedding_from_base64(base64_nifti)
#     # query_embedding = embedder(query)

#     # Build the Vespa query using a nearestNeighbor function on the "embedding" field
#     # query_body = {
#     #     "yql": "select * from sources * where ([{\"targetNumHits\": 10}]nearestNeighbor(image_embedding, query_embedding));",
#     #     "query": query,
#     #     "ranking": "default",
#     #     "hits": 10,
#     #     "ranking.features.query(query_embedding)": heart_embedding
#     # }
#     query_body = {
#         # "yql": "select * from clinical_data * where (nearestNeighbor(image_embedding, query_embedding));",
#         # "yql": "select * from clinical_data * where (\{targetHits\:1\}nearestNeighbor(image_embedding, query_image));",
#         "yql": "where ({targetHits\:10, distanceThreshold:0.5}nearestNeighbor(image_embedding, query_vec)) limit 10",
#         "query": query,
#         "ranking": "default",
#         "hits": 10,
#         "ranking.features.query(query_embedding)": heart_embedding
#     }
#     result = vespa_app.query(query=query_body)

#     #call perplexity
#     return result

# @app.get("/search", summary="Search clinical data via embedding similarity")
# def search(query: str = Query(..., description="Search query text")):
#     """
#     Return NN search hits from clinical_data, given a new query embedding.
#     """

#     # Here you would compute or load the query embedding. 
#     # For example, from a base64-encoded NIfTI file:
#     with open("/Users/socratesj.osorio/Development/heartAI/api2/mesh1.nii", "rb") as nifti_file:
#         base64_nifti = base64.b64encode(nifti_file.read()).decode("utf-8")

#     # Convert that NIfTI to a 512-d embedding:
#     heart_embedding = NIfTIToEmbedding().embedding_from_base64(base64_nifti).tolist()

#     # Build the query request body. The important parts are:
#     #  1) A valid YQL string that does "select ... from clinical_data where nearestNeighbor(...)"
#     #  2) The 'ranking.profile'
#     #  3) The 'ranking.features.query(query_vec)' which matches the second param of nearestNeighbor
#     query_body = {
#         "yql": (
#             "select * from clinical_data "
#             "where ({targetHits:10, distanceThreshold:0.5}nearestNeighbor(image_embedding, query_vec)) "
#             "limit 10"
#         ),
#         # If you still want to pass the user text as "query", you can do so, 
#         # though it won’t affect the NN operator. 
#         "query": query,

#         # Use the default rank profile that does first-phase: closeness(image_embedding)
#         "ranking.profile": "default",

#         # Show up to 10 hits
#         "hits": 10,

#         # Supply the actual embedding vector as a query feature
#         "ranking.features.query(query_vec)": heart_embedding
#     }

#     # Execute the query against your Vespa app
#     result = vespa_app.query(body=query_body)

#     return result

@app.get("/search", summary="Search clinical data via embedding similarity")
def search(query: str = Query(..., description="Search query text")):
    """
    Return NN search hits from clinical_data, given a new query embedding.
    """

    # 1. Load/compute your embedding.
    with open("/Users/socratesj.osorio/Development/heartAI/api2/mesh1.nii", "rb") as nifti_file:
        base64_nifti = base64.b64encode(nifti_file.read()).decode("utf-8")

    # 2. Convert NIfTI → 512-d embedding (as a Python list, not NumPy array).
    heart_embedding = NIfTIToEmbedding().embedding_from_base64(base64_nifti).tolist()

    # 3. Build the query body with proper YQL syntax (no stray backslashes).
    query_body = {
        "yql": (
            "select * from clinical_data "
            "where ({targetHits:1}nearestNeighbor(image_embedding, query_vec)) "
            "limit 10"
        ),
        # "query": query,  # optional if you want to pass user text
        "ranking.profile": "default",
        "hits": 10,
        "ranking.features.query(query_vec)": heart_embedding
    }

    # 4. Execute the query
    result = vespa_app.query(body=query_body)
    # result is in the same format
    # make it return the relevance score of the firs entry, 
    # it should also return pat and data
    # return it as a tuple 
    #{"json":{"root":{"id":"toplevel","relevance":1.0,"fields":{"totalCount":1},"coverage":{"coverage":100,"documents":59,"full":true,"nodes":1,"results":1,"resultsFull":1},"children":[{"id":"id:clinical_data:clinical_data::clinical_28","relevance":0.3974822457097264,"source":"clinical_data","fields":{"sddocname":"clinical_data","documentid":"id:clinical_data:clinical_data::clinical_28","pat":"28","data":"28,2,severe,,,X,X,,,X,,,,,,X,,,,,,,,,,,X,,,,,X,,,X,","image_embedding":{"type":"tensor<float>(d[512])","values":[-1.0244548320770264e-08,-1.862645149230957e-09]}}}]}},"status_code":200,"url":"http://localhost:8080/search/","operation_type":"query","_request_body":null}
    
    return result
# TODO: make it receive an nii embeding and return the important featueres specifided below:
#    # result is in the same format
    # make it return the relevance score of the firs entry, 
    # it should also return pat and data
    # return it as a tuple (relevance, pat, data) like this
def search_from_embedding(embedding):
    """
    Return NN search hits from clinical_data, given a new query embedding.
    """

    # 1. Load/compute your embedding.
    with open("/Users/socratesj.osorio/Development/heartAI/api2/mesh1.nii", "rb") as nifti_file:
        base64_nifti = base64.b64encode(nifti_file.read()).decode("utf-8")

    # 2. Convert NIfTI → 512-d embedding (as a Python list, not NumPy array).
    heart_embedding = NIfTIToEmbedding().embedding_from_base64(base64_nifti).tolist()

    # 3. Build the query body with proper YQL syntax (no stray backslashes).
    query_body = {
        "yql": (
            "select * from clinical_data "
            "where ({targetHits:1}nearestNeighbor(image_embedding, query_vec)) "
            "limit 10"
        ),
        # "query": query,  # optional if you want to pass user text
        "ranking.profile": "default",
        "hits": 10,
        "ranking.features.query(query_vec)": heart_embedding
    }

    # 4. Execute the query
    result = vespa_app.query(body=query_body)
    # result is in the same format
    # make it return the relevance score of the firs entry, 
    # it should also return pat and data
    # return it as a tuple 
    #{"json":{"root":{"id":"toplevel","relevance":1.0,"fields":{"totalCount":1},"coverage":{"coverage":100,"documents":59,"full":true,"nodes":1,"results":1,"resultsFull":1},"children":[{"id":"id:clinical_data:clinical_data::clinical_28","relevance":0.3974822457097264,"source":"clinical_data","fields":{"sddocname":"clinical_data","documentid":"id:clinical_data:clinical_data::clinical_28","pat":"28","data":"28,2,severe,,,X,X,,,X,,,,,,X,,,,,,,,,,,X,,,,,X,,,X,","image_embedding":{"type":"tensor<float>(d[512])","values":[-1.0244548320770264e-08,-1.862645149230957e-09]}}}]}},"status_code":200,"url":"http://localhost:8080/search/","operation_type":"query","_request_body":null}
    
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


# @app.post("/upload")
# def get_all_data(nii_path: str):
#     # final api call
#     print("OMGGGGG")
#     res = {
#         "labels": ["Congenital Heart Defect", "Ventricular Septal Defect"],
#         "imageUrl": nii_path,
#         "confidence": 0.92,
#         "explanation": "This is the explanation",
#         "severity": "Moderate",
#     }
#     return res

#TODO:  should receive a nii file in base 64 string AND return a json specifed below
@app.post("/upload")
def nii_to_suggestion(nii):
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
    pass

    # assume this gets passed sample.nii (user's file) as a base64, returns base64 too
    compacted_nii = nerf_conversion(nii_gz)

    # creates embeddings from nii
    embedder = NIfTIToEmbedding()
    embeddings = embedder.load_nifti_from_base64(compacted_nii).tolist()

    # calls vespa search, from here you will get the confidence and labels as well, 
    vespa_output = search_from_embedding(embeddings)

    # calls perplexity, TODO: make sure to pass the string called data from vespa
    response, links = sMaRTDiagnosis(vespa_output)
    # TODO: Instead of whatd below, it sohuld be like
    #     res = {
#         "labels": ["Congenital Heart Defect", "Ventricular Septal Defect"],
#         "niiBase64": nii_bytes,   # get this from the compated_nii made into base64
#         "confidence": 0.92, # from vespa_output
#         "explanation": "This is the explanation", # from smartdiagnosis
#          "links": {
                # 0: 1, 
                # 1: 0.8
                # 2: 0.6
            # }
#         "severity": "Moderate",
#     }
# based on what we get from calling vespa and the diagnosis
# TODO: FIX THIS BASED ON ABOVE
    return {}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
