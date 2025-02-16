# main.py
from fastapi import FastAPI, HTTPException, Query
import pandas as pd
import os
from sentence_transformers import SentenceTransformer
from vespa.application import Vespa
import requests
from dotenv import load_dotenv

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
                "embedding": embedding_vector,
               # "image_embedding":  "ghgfhdhd"
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
        "yql": "select * from sources * where ([{\"targetNumHits\": 10}]nearestNeighbor(image_embedding, query_embedding));",
        "query": query,
        "ranking": "default",
        "hits": 10,
        "ranking.features.query(query_embedding)": query_embedding
    }
    result = vespa_app.query(query=query_body)

    #call perplexity
    return result

@app.get("/search2", summary="Search clinical data via embedding similarity")


@app.get("/getAllData", summary="Get all data given the input NII")
def get_all_data(nii_path: str):
    # final api call
    return

def perplexity_call(vespa_output: dict):
    """
    Takes in vespa_output, a dictionary where each key is a column in the dataset and each value is the corr. value. This function then calls Perplexity Sonar, which generates a diagnosis using vespa_output.

    Returns two strings:
    1. Text response containing diagnosis, explanation, and additional relevant information
    2. Links to cited sources, formatted so that the text string can be printed as a list.
    """
    # json parse
    ############################################################################################
    ############################################################################################
    ############################################################################################
    ########### TO DO: MAY NEED TO CHANGE CSV CONSTRUCTION DEPENDING ON VESPA OUTPUT ###########
    ############################################################################################
    ############################################################################################
    ############################################################################################
    csv_line = ""
    for key in vespa_output.keys():
        csv_line += str(key) + ": " + str(vespa_output[key]) + ", "
    csv_line = csv_line[:-2]

    # call perplexity
    load_dotenv()
    url = "https://api.perplexity.ai/chat/completions"
    auth_token = os.getenv("PERPLEXITY_API_KEY")

    payload = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "system",
                "content": "You are a doctor's assistant specializing in cardiovascular diseases. Your job is to diagnose cardiovascular diseases, such as congenital heart diseases, vascular anomalies, or surgical procedures related to cardiovascular conditions. You also will explain your diagnosis, including the supporting evidence for your diagnosis, then suggest treatment options and preventions. If you are uncertain, you should also take care to explain alternate diagnoses and their supporting evidence, as well as the potential causes and their supporting evidence. You should also specify any potential health complications that the patient may be at risk for due to your diagnosis. Explain risk factors, if any. If additional information about the patient would be helpful, please specify what information is needed, what tests could be administered to gather the relevant data, and what additional conclusions could be drawn with more information. Be sure to reference specific elements of the input, explain its meaning, and why it applies to the diagnosis so that the doctor and patient can both gain valuable information and make informed decisions from your explanation. All medical terms should be briefly explained in layman's terms, including relevant input labels and values."# Format your response as if you were writing a memo to a doctor. Only output your response, do not output your thinking before the final output."
            },
            {
                "role": "user",
                "content": "Here is some information about the patient: " + csv_line
            }
        ],
        "max_tokens": None,
        "temperature": 0.2,
        "top_p": 0.9,
        "search_domain_filter": None,
        "return_images": False,
        "return_related_questions": False,
        "search_recency_filter": None,#"<string>",
        "top_k": 0,
        "stream": False,
        "presence_penalty": 0,
        "frequency_penalty": 1,
        "response_format": None
    }
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

    response = requests.request("POST", url, json=payload, headers=headers)
    # print(response.text)
    response_json = response.json()
    response_text = response_json["choices"][0]["message"]["content"]
    response_links_unprocessed = response_json["citations"]

    response_links = ""

    counter = 1
    for link in response_links_unprocessed:
        response_links += str(counter) + ". " + link + "\n"
        counter += 1
    response_links = response_links[:-1]

    # print(response_json["choices"][0]["message"]["content"]) # actual chat response
    # print(response_json["citations"]) # links to citations

    return response_text, response_links

def nii_to_suggestion():
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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
