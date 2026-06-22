# backend/llm_config.py

OLLAMA_CONFIG = {
    "model": "llama3",
    "temperature": 0.15,      # ✅ Low randomness for consistent scoring
    "top_p": 0.85,            # ✅ Controls diversity
    "top_k": 40,              # ✅ Sampling parameter
    "num_predict": 1024,      # ✅ Max output tokens
    "repeat_penalty": 1.2,    # ✅ Avoid repetition
    "num_ctx": 4096,          # ✅ Context window
    "num_thread": 8,          # ✅ CPU threads (adjust to your CPU)
}

# For consistency in scoring
OLLAMA_OPTIONS = {
    "temperature": 0.15,
    "num_predict": 1024,
    "top_p": 0.85
}

def call_ollama(prompt):
    import ollama
    
    response = ollama.generate(
        model=OLLAMA_CONFIG["model"],
        prompt=prompt,
        stream=False,
        options=OLLAMA_OPTIONS
    )
    
    return response['response']
