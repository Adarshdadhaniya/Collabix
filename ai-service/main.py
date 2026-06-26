from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import pdfplumber
import requests
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

class SearchRequest(BaseModel):
    role: str
    students: list[dict]

@app.post("/search")
def ai_search(request: SearchRequest):
    try:
        from backend.search_service import search_group_members
        results = search_group_members(request.role, request.students)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EvaluateRequest(BaseModel):
    project_data: dict
    members: list[dict]

@app.post("/evaluate-team")
def evaluate_team(request: EvaluateRequest):
    try:
        import ollama
        import re
        from backend.llm_config import OLLAMA_CONFIG
        from backend.prompts import get_group_evaluation_prompt, format_member_for_evaluation
        
        member_details = "\n---\n".join([format_member_for_evaluation(m) for m in request.members])
        prompt = get_group_evaluation_prompt(request.project_data, member_details)
        
        response = ollama.generate(
            model=OLLAMA_CONFIG["model"],
            prompt=prompt,
            stream=False,
            options={
                "temperature": 0.2,
                "num_predict": 4096,
                "top_p": 0.85
            }
        )
        
        results_text = response['response'].strip()
        
        # Extract JSON using regex
        json_match = re.search(r'\{.*\}', results_text, re.DOTALL)
        if json_match:
            results_text = json_match.group(0)
            
        evaluation = json.loads(results_text)
        return {"evaluation": evaluation}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
