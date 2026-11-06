import re

# Initial technical skills vocabulary
SKILL_VOCABULARY = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C++",
    "C#",
    "SQL",
    "HTML",
    "CSS",
    "React",
    "Angular",
    "Node.js",
    "FastAPI",
    "Flask",
    "Django",
    "REST API",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Generative AI",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Matplotlib",
    "Power BI",
    "Tableau",
    "Excel",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "Git",
    "GitHub",
    "Linux",
    "Statistics",
    "Data Analysis",
    "Data Engineering",
    "Apache Spark",
    "Hadoop",
    "LangChain",
    "OpenAI",
    "Hugging Face"
]

SKILL_ALIASES = {
    "PostgreSQL": ["Postgres"],
    "JavaScript": ["JS"],
    "TypeScript": ["TS"],
    "Machine Learning": ["ML"],
    "Natural Language Processing": ["NLP"],
    "Scikit-learn": ["Sklearn"],
    "Node.js": ["NodeJS"],
    "REST API": ["REST APIs", "RESTful API", "RESTful APIs"],
}

def extract_skills(text: str) -> list[str]:
    """
    Extract technical skills and normalize aliases
    to canonical skill names.
    """

    if not text:
        return []

    extracted_skills = []

    for skill in SKILL_VOCABULARY:
        terms = [skill] + SKILL_ALIASES.get(skill, [])

        for term in terms:
            pattern = (
                r"(?<!\w)"
                + re.escape(term)
                + r"s?(?!\w)"
            )

            if re.search(pattern, text, re.IGNORECASE):
                extracted_skills.append(skill)
                break

    return sorted(set(extracted_skills), key=str.lower)


def extract_job_skills(
    job_description: str,
    required_skills: list[str] | None = None
) -> list[str]:
    """
    Extract skills from job description and combine
    them with explicitly required skills.
    """

    description_skills = extract_skills(job_description)

    explicit_skills = extract_skills(
        " ".join(required_skills or [])
    )

    return sorted(
        set(description_skills + explicit_skills),
        key=str.lower
    )