# app/embeddings.py

from sentence_transformers import SentenceTransformer

# Example model; pick any suitable HF model (e.g. 'all-MiniLM-L6-v2', 'distilbert-base-uncased', etc.)
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def generate_embedding(text: str):
    """
    Returns a list (or np.array) representing the embedding for the given text.
    """
    embedding = model.encode(text)
    return embedding.tolist()
