from pathlib import Path
from docx import Document

from app.services.resume_service import extract_resume_text


def test_docx_extraction():
    test_file = Path("backend/tests/sample_resume.docx")

    document = Document()
    document.add_paragraph("Arman Shikalgar")
    document.add_paragraph("Python Developer")
    document.add_paragraph("Skills: Python, SQL, FastAPI")

    document.save(test_file)

    extracted_text = extract_resume_text(str(test_file))

    assert "Arman Shikalgar" in extracted_text
    assert "Python Developer" in extracted_text
    assert "FastAPI" in extracted_text

    test_file.unlink()

    print("DOCX extraction test passed!")


if __name__ == "__main__":
    test_docx_extraction()