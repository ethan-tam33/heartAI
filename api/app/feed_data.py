# app/feed_data.py

import pandas as pd
from vespa.package import ApplicationPackage, Field, Document, Schema
from vespa.deployment import VespaDocker
from vespa.query import Vespa
from app.embeddings import generate_embedding
import json

def feed_data():
    # Load the CSV
    df = pd.read_csv("./data/hvsmr_clinical.csv")

    # Create a local Python representation of your schema. 
    # Alternatively, if you prefer, you can rely purely on JSON + CLI.
    app_package = ApplicationPackage(
        name="hvsmr",
        schema=Schema(
            name="hvsmr",
            document=Document(
                fields=[
                    Field(name="id", type="string", indexing=["attribute", "summary"]),
                    Field(name="category", type="string", indexing=["attribute", "summary"]),
                    Field(name="age", type="int", indexing=["attribute", "summary"]),
                    Field(name="features_text", type="string", indexing=["summary"]),
                    Field(name="embedding", type="tensor<float>(x[384])", indexing=["attribute"])
                ]
            )
        )
    )

    # Start or connect to your Vespa Docker container
    vespa_docker = VespaDocker(vespa_home="/home/vespa")  # adjust if needed
    vespa_docker.deploy(app_package)

    # Connect to the app
    vespa_app = Vespa(url="http://localhost", port=8080)

    # Feed each row
    for idx, row in df.iterrows():
        # Build a simple text representation from your columns. 
        # e.g. "VSD present, Mild Dilation, Age=10, etc."
        # For demonstration, we’ll just join columns that have 'X' or numeric:
        features_list = []
        for col in df.columns:
            if pd.notna(row[col]) and str(row[col]) == "X":
                features_list.append(col)
            elif col in ["Pat", "Age", "Category"]:
                features_list.append(f"{col}={row[col]}")

        text_for_embedding = " ".join(features_list)
        vector = generate_embedding(text_for_embedding)  # dimension must match your schema

        # Build doc
        doc_id = f"id-hvsmr-{idx}"
        doc_data = {
            "id": doc_id,
            "fields": {
                "id": doc_id,
                "category": str(row["Category"]),
                "age": int(row["Age"]),
                "features_text": text_for_embedding,
                "embedding": vector
            }
        }

        # Feed document
        vespa_app.feed_data_point(schema="hvsmr", data_id=doc_id, fields=doc_data["fields"])

    print("Data feed complete!")

if __name__ == "__main__":
    feed_data()
