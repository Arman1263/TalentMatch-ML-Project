import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models import User, Resume
from app.services.resume_service import extract_resume_text
from app.utils.file_validation import validate_file


router = APIRouter(prefix="/resumes", tags=["Resumes"])

STORAGE_DIR = Path(__file__).resolve().parents[2] / "storage" / "resumes"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    file_path = None

    try:
        contents = await file.read(5 * 1024 * 1024 + 1)

        validate_file(file.filename or "", len(contents))

        # Verify actual file signature, not just extension.
        extension = Path(file.filename or "").suffix.lower()

        if extension == ".pdf" and not contents.startswith(b"%PDF-"):
            raise ValueError("Invalid PDF file")

        if extension == ".docx" and not contents.startswith(b"PK"):
            raise ValueError("Invalid DOCX file")

        candidate = current_user.candidate_profile

        if not candidate:
            raise HTTPException(400, "Candidate profile not found")

        filename = f"{uuid.uuid4()}{extension}"
        file_path = STORAGE_DIR / filename

        file_path.write_bytes(contents)

        extracted_text = extract_resume_text(str(file_path))

        # Make the newly uploaded resume active
        db.query(Resume).filter(
            Resume.candidate_id == candidate.id
        ).update(
            {Resume.is_active: False},
            synchronize_session=False
        )

        resume = Resume(
            candidate_id=candidate.id,
            file_name=file.filename,
            file_path=str(file_path),
            extracted_text=extracted_text
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        return {
            "message": "Resume uploaded successfully",
            "resume_id": str(resume.id),
            "file_name": resume.file_name,
            "extracted_text_length": len(extracted_text)
        }

    except ValueError as error:
        db.rollback()
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(400, str(error))

    except Exception:
        db.rollback()
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(500, "Resume upload failed")

    finally:
        await file.close()