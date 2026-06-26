import json

GROUP_EVALUATION_PROMPT = """You are a senior technical mentor evaluating a student project group submission.
Your task is to assess the team composition against the project requirements and produce an honest, specific evaluation report.

PROJECT DETAILS:
- Title: {project_title}
- Problem Statement: {problem_statement}
- Description: {project_description}
- Tech Stack: {tech_stack}

TEAM MEMBERS ({member_count} total):
{member_details}

OUTPUT INSTRUCTIONS:
Return exactly and ONLY a valid JSON object with the following structure.
Do not include any explanation, markdown, or text outside the JSON object.

{{
  "project_title": "string",
  "verdict": "ACCEPT" | "CONDITIONAL ACCEPT" | "REJECT",
  "overall_score": integer between 1 and 100,
  "score_breakdown": {{
    "team_balance": integer between 1 and 10,
    "originality": integer between 1 and 10,
    "technical_feasibility": integer between 1 and 10,
    "problem_relevance": integer between 1 and 10
  }},
  "team_balance": {{
    "rating": "Strong" | "Adequate" | "Weak",
    "summary": "2-3 sentence assessment of whether the team's combined skills cover the technical and domain requirements of the project",
    "covered_areas": ["skill or domain", "..."],
    "gaps": ["missing skill or domain", "..."]
  }},
  "originality": {{
    "rating": "High" | "Medium" | "Low",
    "summary": "2-3 sentences on how novel or differentiated this project is and what makes it original or not"
  }},
  "strengths": [
    {{
      "title": "strength heading",
      "detail": "1-2 sentence elaboration specific to this project and team"
    }}
  ],
  "risks": [
    {{
      "title": "risk heading",
      "severity": "High" | "Medium" | "Low",
      "detail": "1-2 sentence elaboration specific to this project and team"
    }}
  ],
  "missing_skills": [
    {{
      "skill": "skill name",
      "reason": "why this skill is specifically required given the tech stack and problem"
    }}
  ],
  "mentor_recommendation": "3-5 sentence direct and constructive mentor note. Be specific to this project. State clearly what must be improved or confirmed before greenlight."
}}

EVALUATION RULES:
- Base skill gap analysis strictly on the actual tech stack requirements versus the team's stated skills.
- Strengths and risks must be specific to this project and team, not generic boilerplate.
- overall_score reflects your holistic confidence in this group successfully delivering the project.
- Be honest. A weak team or a trivial problem should score low.
- Do not return any text, explanation, or markdown outside of the JSON object.
"""


ROLE_SELECTION_PROMPT = """You are an expert technical recruiter AI.
The user has entered a search query for a specific role or skillset.
Your task is to select the TOP 2 matching roles from our predefined roles dictionary.
The match should be logical, not just text matching (e.g., "ML" -> "machine_learning_engineer", "iOS" -> "ios_developer").

USER QUERY: "{role_query}"

AVAILABLE ROLE KEYS:
{role_keys}

OUTPUT INSTRUCTIONS:
Return exactly and ONLY a JSON array containing the top 2 string keys that best match the query.
Example output format:
[
  "machine_learning_engineer",
  "data_scientist"
]

Do not include any explanation or markdown formatting outside of the JSON array.
"""

def get_role_selection_prompt(role_query, role_keys):
    """Generate the prompt to select top 2 keys from the dictionary."""
    return ROLE_SELECTION_PROMPT.format(
        role_query=role_query,
        role_keys=json.dumps(role_keys, indent=2)
    )

def get_group_evaluation_prompt(project_data, member_details):
    """Generate the prompt to evaluate a team composition against a project."""
    return GROUP_EVALUATION_PROMPT.format(
        project_title=project_data.get('projectTitle', 'Untitled'),
        problem_statement=project_data.get('problemStatement', 'None provided'),
        project_description=project_data.get('projectDescription', 'None provided'),
        tech_stack=", ".join(project_data.get('techStack', [])) if project_data.get('techStack') else 'None provided',
        member_count=len(member_details.split('---')) if member_details else 0,
        member_details=member_details
    )

def format_member_for_evaluation(student_profile):
    """Convert a student profile document to a formatted string for Team Evaluation, skipping project_count and only including project tech stacks."""
    skills = student_profile.get('skills') or {}
    
    langs = ", ".join([
        f"{l.get('name', 'Unknown')} ({l.get('proficiency', 'unknown')}, {l.get('years_of_experience', 0)}y)"
        for l in skills.get('programming_languages', [])
    ])
    
    frameworks = ", ".join([
        f"{f.get('name', 'Unknown')} ({f.get('proficiency', 'unknown')}, {f.get('years_of_experience', 0)}y)"
        for f in skills.get('frameworks', [])
    ])
    
    databases = ", ".join([
        db.get('name', 'Unknown') for db in skills.get('databases', [])
    ])
    
    tools = ", ".join([
        t.get('name', 'Unknown') for t in skills.get('tools', [])
    ])
    
    soft_skills = ", ".join([
        s.get('name', 'Unknown') for s in skills.get('soft_skills', [])
    ])
    
    projects = student_profile.get('projects') or []
    projects_str = "; ".join([
        f"Stack: {', '.join(p.get('tech_stack', []))}"
        for p in projects
    ])
    
    user_info = student_profile.get('user') or {}
    if isinstance(user_info, dict):
        student_name = user_info.get('name', student_profile.get('name', 'Unknown'))
    else:
        student_name = student_profile.get('name', 'Unknown')

    experience_summary = student_profile.get('experience_summary') or {}

    return f"""
NAME: {student_name}
PRIMARY DOMAIN: {experience_summary.get('primary_domain', 'Unknown')}
STRONGEST SKILL: {experience_summary.get('strongest_skill', 'Unknown')}
EXPERIENCE: {experience_summary.get('total_years', 0)} years

PROGRAMMING LANGUAGES: {langs or 'None'}
FRAMEWORKS: {frameworks or 'None'}
DATABASES: {databases or 'None'}
TOOLS: {tools or 'None'}
SOFT SKILLS: {soft_skills or 'None'}

PROJECT EXPERIENCE (TECH STACK ONLY): {projects_str or 'None'}
"""