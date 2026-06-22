# backend/prompts.py

ROLE_MATCHING_PROMPT = """You are an expert recruiter matching students to team roles.

ROLE NEEDED: {role}

SCORING CRITERIA (Total: 10 points):
- Exact skill matches: 3 points per skill
- Related/transferable skills: 1.5 points each
- Depth (years of experience/projects): 2 points
- Project complexity: 1.5 points
- Soft skills alignment: 1 point

AVAILABLE STUDENTS:
{students_data}

INSTRUCTIONS:
1. Analyze each student's skills against the role
2. Apply scoring criteria strictly
3. Score only within 1-10 range
4. Provide specific reasoning mentioning actual skills
5. Return ONLY valid JSON (no markdown, no explanation)

RESPONSE FORMAT (JSON array):
[
  {{
    "id": "student_id",
    "name": "Full Name",
    "match_score": 8.5,
    "score_breakdown": {{
      "exact_matches": 3,
      "transferable_skills": 2.5,
      "depth": 2,
      "project_complexity": 1,
      "soft_skills": 0.5
    }},
    "reason": "Has React, TypeScript, REST API experience. Built 3 production projects.",
    "strengths": ["React expertise", "API integration"],
    "gaps": ["No GraphQL experience"]
  }}
]"""

def get_search_prompt(role, students_data):
    return ROLE_MATCHING_PROMPT.format(
        role=role,
        students_data=students_data
    )
