from pathlib import Path

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_file(filename: str, file_size: int):

    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Only PDF and DOCX files are allowed")

    if file_size <= 0:
        raise ValueError("Empty files are not allowed")

    if file_size > MAX_FILE_SIZE:
        raise ValueError("File size must not exceed 5 MB")

    return True