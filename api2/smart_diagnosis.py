# main.py
from fastapi import FastAPI, HTTPException, Query
import pandas as pd
import os
from sentence_transformers import SentenceTransformer
from vespa.application import Vespa
import requests
from dotenv import load_dotenv
from embeddings import NIfTIToEmbedding

def sMaRTDiagnosis(vespa_output: dict):
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

# if __name__ == "__main__":
#     # Example usage
#     vespa_output = {"heart_rate": 85, "blood_pressure": "120/80", "chest_pain": True}
#     diagnosis_text, diagnosis_links = sMaRTDiagnosis(vespa_output)
#     print("Diagnosis:")
#     print(diagnosis_text)
#     print("\nLinks:")
#     print(diagnosis_links)