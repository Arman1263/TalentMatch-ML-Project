
from functools import lru_cache

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

from app.services.ml.preprocessing import clean_text
from app.services.ml.skill_extractor import extract_skills, extract_job_skills


@lru_cache(maxsize=1)
def get_semantic_model() -> SentenceTransformer:
    """
    Load the Sentence Transformer model only when first needed.
    Reuse the cached model for subsequent requests.
    """
    return SentenceTransformer("all-MiniLM-L6-v2")


def calculate_skills_match(
    resume_skills: list[str],
    required_skills: list[str]
) -> dict:

    resume_map = {
        skill.lower(): skill for skill in resume_skills
    }

    required_map = {
        skill.lower(): skill for skill in required_skills
    }

    matched = sorted(
        [resume_map[key] for key in resume_map.keys() & required_map.keys()],
        key=str.lower
    )

    missing = sorted(
        [required_map[key] for key in required_map.keys() - resume_map.keys()],
        key=str.lower
    )

    score = (
        len(matched) / len(required_map) * 100
        if required_map else 0
    )

    return {
        "score": round(score, 2),
        "matched_skills": matched,
        "missing_skills": missing
    }


def calculate_tfidf_similarity(
    resume_text: str,
    job_description: str
) -> float:
    """
    Calculate text similarity using TF-IDF and cosine similarity.
    """

    if not resume_text.strip() or not job_description.strip():
        return 0.0

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english"
    )

    try:
        vectors = vectorizer.fit_transform([
            resume_text,
            job_description
        ])

        similarity = cosine_similarity(
            vectors[0:1],
            vectors[1:2]
        )[0][0]

        return round(float(similarity * 100), 2)

    except ValueError:
        return 0.0


def calculate_semantic_similarity(
    resume_text: str,
    job_description: str
) -> float:
    """
    Calculate semantic similarity using Sentence Transformers.
    """

    if not resume_text.strip() or not job_description.strip():
        return 0.0

    model = get_semantic_model()

    embeddings = model.encode(
        [resume_text, job_description],
        normalize_embeddings=True
    )

    similarity = float(embeddings[0] @ embeddings[1])

    # Convert cosine similarity to a 0-100 scale
    score = max(0.0, min(100.0, similarity * 100))

    return round(score, 2)


def calculate_hybrid_score(
    tfidf_score: float,
    semantic_score: float,
    skills_score: float
) -> float:
    """
    Calculate the weighted hybrid matching score.
    """

    hybrid_score = (
        (tfidf_score * 0.25)
        + (semantic_score * 0.45)
        + (skills_score * 0.30)
    )

    return round(hybrid_score, 2)


def match_resume_to_job(
    resume_text: str,
    job_description: str,
    required_skills: list[str]
) -> dict:
    """
    Complete hybrid resume-to-job matching pipeline
    with automatic resume skill extraction.
    """

    cleaned_resume = clean_text(resume_text)
    cleaned_job = clean_text(job_description)

    resume_skills = extract_skills(resume_text)
    job_skills = extract_job_skills(job_description, required_skills)

    tfidf_score = calculate_tfidf_similarity(
        cleaned_resume,
        cleaned_job
    )

    semantic_score = calculate_semantic_similarity(
        cleaned_resume,
        cleaned_job
    )

    skills_result = calculate_skills_match(
        resume_skills,
        job_skills
    )

    hybrid_score = calculate_hybrid_score(
        tfidf_score,
        semantic_score,
        skills_result["score"]
    )

    return {
        "matching_score": hybrid_score,
        "tfidf_score": tfidf_score,
        "semantic_score": semantic_score,
        "skills_score": skills_result["score"],
        "resume_skills": resume_skills,
        "matched_skills": skills_result["matched_skills"],
        "missing_skills": skills_result["missing_skills"]
    }
