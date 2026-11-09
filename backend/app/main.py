from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.resumes import router as resumes_router
from app.api.candidates import router as candidates_router
from app.api.jobs import router as jobs_router
from app.api.applications import router as applications_router
from app.api.matching import router as matching_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TalentMatch API",
    description="AI-powered Resume and Job Matching Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(matching_router)