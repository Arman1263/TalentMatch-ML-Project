from fastapi import FastAPI

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
    return {
        "status": "healthy"
    }