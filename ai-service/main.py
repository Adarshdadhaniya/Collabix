from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import pdfplumber
import requests
import json
import os

app = FastAPI()

# Load the model locally (it will download on first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    texts: list[str]

@app.get("/health")
def health_check():
    return {"status": "AI Service is running"}

@app.post("/embed")
def generate_embeddings(request: EmbedRequest):
    try:
        embeddings = model.encode(request.texts)
        # Convert numpy arrays to lists for JSON serialization
        embeddings_list = [emb.tolist() for emb in embeddings]
        return {"embeddings": embeddings_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting PDF text: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF")

    # Call local Ollama LLM
    # Assuming llama3 is pulled, or you can configure this via env vars
    OLLAMA_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

    prompt = f"""
    Extract the following information from the resume text below and return it strictly as a JSON object. 
    Keys should be exactly: 
    "skills" (array of strings),
    "interests" (array of strings),
    "github" (string URL or empty string),
    "linkedin" (string URL or empty string),
    "cgpa" (number or null),
    "year" (number or null),
    "department" (string or empty string).

    Resume Text:
    {text}
    """

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    try:
        response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Ollama returns the generated response in the "response" field
        parsed_json = json.loads(data.get("response", "{}"))
        return parsed_json
    except Exception as e:
        # Fallback if Ollama fails or is not running
        raise HTTPException(status_code=500, detail=f"Error calling Ollama: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
