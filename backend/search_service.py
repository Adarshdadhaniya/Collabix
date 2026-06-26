# backend/search_service.py

import re
import json
import ollama
import math
import requests
import os
from backend.llm_config import OLLAMA_CONFIG
from backend.prompts import get_role_selection_prompt

# AI Service URL running locally
AI_SERVICE_URL = "http://127.0.0.1:8000"

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two lists of floats."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    normA = math.sqrt(sum(a * a for a in vec1))
    normB = math.sqrt(sum(b * b for b in vec2))
    
    if normA == 0 or normB == 0:
        return 0.0
    return dot_product / (normA * normB)

def get_embedding(text):
    """Call the local embed endpoint to get a vector."""
    try:
        response = requests.post(f"{AI_SERVICE_URL}/embed", json={"texts": [text]})
        response.raise_for_status()
        return response.json().get("embeddings", [[]])[0]
    except Exception as e:
        print(f"Error fetching embedding: {e}")
        return []

def search_group_members(role_query, students):
    """
    RAG-based search function using Cosine Similarity.
    """
    print(f"\n{'='*50}\n🔍 AI SEMANTIC SEARCH INITIATED\n{'='*50}")
    print(f"Role Requested: {role_query}")
    print(f"Total Eligible Students Received: {len(students)}")
    
    try:
        # 1. Load roles dictionary
        roles_path = os.path.join(os.path.dirname(__file__), 'roles_dictionary.json')
        with open(roles_path, 'r', encoding='utf-8') as f:
            roles_dict = json.load(f)
            
        role_keys = list(roles_dict.keys())
        
        # 2. Get LLM to select Top 2 keys
        prompt = get_role_selection_prompt(role_query, role_keys)
        
        print("\n🤖 CALLING OLLAMA TO SELECT ROLE KEYS...")
        response = ollama.generate(
            model=OLLAMA_CONFIG["model"],
            prompt=prompt,
            stream=False,
            options={
                "temperature": 0.1,
                "num_predict": 512
            }
        )
        
        results_text = response['response'].strip()
        print(f"LLM Raw Output:\n{results_text}")
        
        # Parse JSON keys safely
        json_match = re.search(r'\[.*\]', results_text, re.DOTALL)
        if json_match:
            results_text = json_match.group(0)
            
        selected_keys = json.loads(results_text)
        print(f"✅ Selected Keys: {selected_keys}")
        
        # 3. Build Role Target Text
        combined_text_parts = []
        for key in selected_keys:
            if key in roles_dict:
                r = roles_dict[key]
                combined_text_parts.append(
                    f"Domain: {r.get('primary_domain', '')}\n"
                    f"Strongest Skill: {r.get('strongest_skill', '')}\n"
                    f"Programming Languages: {r.get('programming_languages', '')}\n"
                    f"Frameworks: {r.get('frameworks', '')}\n"
                    f"Databases: {r.get('databases', '')}\n"
                    f"Tools: {r.get('tools', '')}\n"
                    f"Interests: {r.get('technical_interests', '')}\n"
                    f"Summary: {r.get('technical_summary', '')}"
                )
                
        target_role_text = "\n\n".join(combined_text_parts)
        
        if not target_role_text:
            print("⚠️ No valid keys selected or matched in dictionary. Falling back to query text.")
            target_role_text = role_query
            
        # 4. Generate Target Embedding
        print("\n🔢 Generating Role Target Embedding...")
        target_embedding = get_embedding(target_role_text)
        
        if not target_embedding:
            print("❌ Failed to generate target embedding. Aborting.")
            return []
            
        # 5. Calculate Similarity for all students
        scored_students = []
        for student in students:
            student_emb = student.get('skillEmbedding', [])
            score = cosine_similarity(target_embedding, student_emb)
            
            # Map back to UI format
            # We skip 'score_breakdown' as per user request to drop detailed reasoning
            scored_students.append({
                "id": str(student.get('_id')),
                "name": student.get('user', {}).get('name', 'Unknown'),
                "match_score": float(score) * 10,  # Scale to 0-10 so UI's * 10 works (0-100%)
                "reason": f"Matched via Semantic Search to core role skills ({', '.join(selected_keys)}).",
                "strengths": ["Matched via embeddings"],
                "gaps": []
            })
            
        # 6. Sort and slice
        scored_students.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        
        print("\n🧮 TOP MATCHES:")
        for idx, res in enumerate(scored_students[:5]):
            print(f"{idx+1}. {res.get('name')} | Similarity: {res.get('match_score'):.2f}/10")
            
        total_scored = len(scored_students)
        limit = max(3, math.ceil(total_scored * 0.05))
        final_results = scored_students[:limit]
        
        print(f"\n✅ SUCCESSFUL MATCHES: Returning top {len(final_results)} students.")
        print(f"{'='*50}\n")
        
        return final_results
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error on Key Selection: {e}")
        return []
    except Exception as e:
        print(f"❌ Error during Search: {e}")
        return []
