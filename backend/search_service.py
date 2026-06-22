# backend/search_service.py

import json
import ollama
from database import Student
from llm_config import OLLAMA_CONFIG, get_search_prompt

def search_group_members(role, num_results=5):
    """
    Main search function with optimized LLM
    """
    try:
        # Step 1: Get all students from MongoDB
        students = list(Student.objects.all())
        
        # Step 2: Prepare enriched data for LLM
        students_data = format_students_for_llm(students)
        
        # Step 3: Generate optimized prompt
        prompt = get_search_prompt(role, students_data)
        
        # Step 4: Call Ollama with tuned parameters
        response = ollama.generate(
            model=OLLAMA_CONFIG["model"],
            prompt=prompt,
            stream=False,
            options={
                "temperature": 0.15,
                "num_predict": 1024,
                "top_p": 0.85
            }
        )
        
        # Step 5: Parse response
        results_text = response['response'].strip()
        
        # Remove markdown if present
        if "```json" in results_text:
            results_text = results_text.split("```json")[1].split("```")[0]
        
        results = json.loads(results_text)
        
        # Step 6: Verify and enrich results
        verified_results = verify_results(results, students)
        
        return verified_results[:num_results]
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {e}")
        print(f"Raw response: {response['response']}")
        return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []


def format_students_for_llm(students):
    """
    Format enriched student data for LLM
    """
    formatted = []
    
    for student in students:
        formatted.append({
            "id": str(student._id),
            "name": student.name,
            "skills": {
                "languages": [
                    f"{lang.get('name')} ({lang.get('proficiency')}, {lang.get('years_of_experience')}y)"
                    for lang in student.skills.get('programming_languages', [])
                ],
                "frameworks": [
                    f"{fw.get('name')} ({fw.get('proficiency')})"
                    for fw in student.skills.get('frameworks', [])
                ],
                "databases": [
                    db.get('name') for db in student.skills.get('databases', [])
                ],
                "tools": [
                    tool.get('name') for tool in student.skills.get('tools', [])
                ],
                "soft_skills": [
                    skill.get('name') for skill in student.skills.get('soft_skills', [])
                ],
                "domains": student.skills.get('domains', [])
            },
            "projects": [
                {
                    "title": p.get('title'),
                    "tech": p.get('technologies'),
                    "impact": p.get('impact')
                }
                for p in student.projects[:2]  # Top 2 projects
            ],
            "experience": {
                "years": student.experience_summary.get('total_years'),
                "strongest": student.experience_summary.get('strongest_skill'),
                "domain": student.experience_summary.get('primary_domain')
            }
        })
    
    return json.dumps(formatted, indent=2)


def verify_results(results, students):
    """
    Verify LLM didn't hallucinate
    """
    student_map = {str(s._id): s for s in students}
    verified = []
    
    for result in results:
        if result.get('id') in student_map:
            verified.append(result)
    
    return verified
