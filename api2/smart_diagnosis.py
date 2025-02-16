# app/smart_diagnosis.py

import os
import requests
from dotenv import load_dotenv

def sMaRTDiagnosis(vespa_output: str):
    """
    Takes in a string containing relevant doc data from Vespa.
    Calls Perplexity "sonar-pro" API with that data to generate a diagnosis.
    Returns:
      1) response_text: A string containing diagnosis & explanation 
         with bracket references [1], [2], ...
      2) response_links_unprocessed: A list of citations for the bracket references
    """
    # If you have not done so, load your .env containing PERPLEXITY_API_KEY
    load_dotenv()
    url = "https://api.perplexity.ai/chat/completions"
    auth_token = os.getenv("PERPLEXITY_API_KEY")
    keys_str = "Pat,Age,Category,Normal,MildModerateDilation,VSD,ASD,DORV,DLoopTGA,ArterialSwitch,BilateralSVC,SevereDilation,TortuousVessels,Dextrocardia,Mesocardia,InvertedVentricles,InvertedAtria,LeftCentralIVC,LeftCentralSVC,LLoopTGA,AtrialSwitch,Rastelli,SingleVentricle,DILV,DIDORV,CommonAtrium,Glenn,Fontan,Heterotaxy,SuperoinferiorVentricles,PAAtresiaOrMPAStump,PABanding,AOPAAnastamosis,Marfan,CMRArtifactAO,CMRArtifactPA"
    keys = keys_str.split(",")
    vals = vespa_output.split(",")
    csv_line = ""
    first_diagnosis = ""
    for i in range(len(keys)):
        if vals[i] == "X" and first_diagnosis == "":
            first_diagnosis = keys[i]
        csv_line += str(keys[i]) + ": " + ("YES" if vals[i] == "X" else "NO") + ","
    print(csv_line)
    payload = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a doctor's assistant specializing in cardiovascular diseases. "
                    "Your job is to explain the diagnosis, summarize, give a short explanation given the following diseases the patient might have "
                    "and suggest possible next steps, referencing the input data. "
                    "You are going to be presented with some diseases we found the patient has more likelihood of having, which is marked with YES or NO in the input data. "
                    "Be concise and clarify medical jargon in simple terms."
                    "Don't use markup"
                )
            },
            {
                "role": "user",
                "content": f"Here is some information about the patient: {csv_line}"
            }
        ],
        "max_tokens": None,
        "temperature": 0.2,
        "top_p": 0.9,
        "search_domain_filter": None,
        "return_images": False,
        "return_related_questions": False,
        "search_recency_filter": None,
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

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        # If the Perplexity call fails, just return a fallback
        return (
            f"Could not fetch a diagnosis (HTTP {response.status_code}).",
            []
        )

    response_json = response.json()
    response_text = response_json["choices"][0]["message"]["content"]
    response_links_unprocessed = response_json.get("citations", [])

    return response_text, response_links_unprocessed, first_diagnosis
