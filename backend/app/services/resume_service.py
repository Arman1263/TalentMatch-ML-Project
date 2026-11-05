import pymupdf
from docx import Document
from pathlib import Path


def extract_pdf_text(file_path: str) -> str:
    text = []

    with pymupdf.open(file_path) as pdf:
        for page in pdf:
            text.append(page.get_text())

    return "\n".join(text).strip()


def extract_docx_text(file_path: str) -> str:
    document = Document(file_path)

    paragraphs = [
        paragraph.text
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ]

    return "\n".join(paragraphs).strip()


def extract_resume_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        text = extract_pdf_text(file_path)

    elif extension == ".docx":
        text = extract_docx_text(file_path)

    else:
        raise ValueError("Unsupported resume format")

    if not text:
        raise ValueError("No readable text found in resume")

    return text