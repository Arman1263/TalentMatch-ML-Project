from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.resumes import router as resumes_router
from app.api.candidates import router as candidates_router

app = FastAPI(
    title="TalentMatch API",
    description="AI-powered Resume and Job Matching Platform",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to TalentMatch API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(resumes_router)
app.include_router(candidates_router)