# TalentMatch — Project Audit

> Audit Date: 2026-11-09 | Auditor: Antigravity AI

---

## 1. Repository Structure

```
Job_Recommendation_Sys/
├── backend/
│   ├── app/
│   │   ├── api/          auth, users, candidates, jobs, resumes, applications, matching
│   │   ├── core/         config, database, security, dependencies
│   │   ├── models/       __init__.py (single file: 7 models)
│   │   ├── schemas/      application, auth, candidate, job, matching
│   │   ├── services/     auth_service, application_service, matching_service, resume_service
│   │   │   └── ml/       matching_engine, preprocessing, skill_extractor
│   │   └── main.py
│   ├── migrations/
│   ├── storage/resumes/
│   ├── tests/            6 test files
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   auth/ProtectedRoute   (candidate/, common/, layout/, recruiter/ all EMPTY)
│       ├── context/      AuthContext
│       ├── pages/
│       │   ├── CandidateDashboard, RecruiterDashboard, Login, Register
│       │   ├── candidate/  JobListings, JobDetails, MyApplications
│       │   └── recruiter/  JobManagement
│       ├── services/     api, authService, applicationService, dashboardService, jobService
│       ├── theme/        theme.ts
│       └── App.tsx
├── ml_engine/            (standalone – not used by backend)
├── infrastructure/       (EMPTY)
├── .env.example          (MISSING)
└── alembic.ini
```

---

## 2. Fully Implemented Features ✅

### Backend
- PostgreSQL + SQLAlchemy ORM (7 models: User, CandidateProfile, RecruiterProfile, Resume, Job, Application, MatchResult)
- Alembic migrations
- User registration with Argon2 hashing + profile auto-creation
- User login with JWT (HS256) tokens, 30-min expiry
- Role-based authorization (`require_role()`)
- Candidate profile GET/PATCH
- Resume upload: file-type validation, magic-byte check, text extraction (PDF via PyMuPDF, DOCX via python-docx)
- Resume list, activate, delete with path traversal protection
- Job CRUD: create, list, update, deactivate, browse (with filters: search, location, employment_type, skill, experience_max)
- Application submission with active-resume check and DB-level duplicate prevention (UniqueConstraint)
- GET `/applications/my-applications` with matching score join
- GET `/applications/received` for recruiters
- PATCH `/applications/{id}/status` with ownership check and Literal type validation
- ML hybrid matching: TF-IDF (0.25) + Sentence Transformer semantic (0.45) + Skill overlap (0.30)
- Skill extraction with vocabulary + alias resolution
- Text preprocessing preserving C++, C#, .NET, Node.js
- Match result persistence with upsert logic
- Match history and ranked candidates endpoints
- Dashboard statistics for both roles
- Backend test suite (security, ML unit, matching API, resume API)

### Frontend
- Auth context with sessionStorage token management
- Protected routes with role guards
- Register page (email, password, role, full_name)
- Login page
- Candidate Dashboard (stats cards, profile overview, navigation)
- Recruiter Dashboard (stats cards, feature descriptions)
- Job Listings (search, filter by location/type/skill, pagination, job cards)
- Job Details (apply now, duplicate check, error states)
- My Applications (status badges, match score progress bar, refresh)
- Job Management (create, edit, deactivate, reactivate jobs)
- API services for auth, jobs, applications, dashboard

---

## 3. Identified Bugs 🐛

| # | Severity | File | Description |
|---|---|---|---|
| B1 | **Critical** | `App.tsx` | `MyApplications` route missing — page exists but `/candidate/applications` redirects to login |
| B2 | **Critical** | `application_service.py:73` | `db.rollback()` after ML failure reverts the already-committed application — user loses their application silently |
| B3 | **High** | `applications.py` router | `get_received_applications` query does not fetch `job_title`/`company_name` but `RecruiterApplicationResponse` schema has these required fields — 500 error or validation failure |
| B4 | **High** | `matching.py` router | `GET /matching/my-matches` defined after `POST /matching/{job_id}` — FastAPI tries to parse "my-matches" as UUID, returns 422 |
| B5 | **Medium** | `CandidateDashboard.tsx` | "View Applications" button links to `/candidate/applications` which has no registered route |
| B6 | **Medium** | `RecruiterDashboard.tsx` | "Quick Actions" cards have no buttons — no navigation to Manage Jobs or Applications |
| B7 | **Medium** | `applicationService.ts` | `getMyApplications()` return type is `Application[]` missing `job_title`, `company_name`, `job_location`, `matching_score` fields (backend returns them, service type doesn't) |

---

## 4. Missing Features ❌

### Frontend Pages (not built)
| Page | Route | Priority |
|---|---|---|
| Recruiter Applications Management | `/recruiter/applications` | P1 — Highest |
| Candidate Profile Management | `/candidate/profile` | P2 |
| Resume Management UI | `/candidate/resumes` | P2 |
| AI Match Results Detail | `/candidate/matches` | P2 |
| Ranked Candidates View | `/recruiter/jobs/:id/candidates` | P3 |
| Candidate Detail View | `/recruiter/candidates/:id` | P3 |

### Backend (gaps)
| Feature | Priority |
|---|---|
| `RecruiterApplicationResponse` missing `job_title`/`company_name` in query | P1 |
| Matching score not fetched in `/applications/received` | P1 |
| Recruiter profile update endpoint | P4 |

### Infrastructure
- No Dockerfile (backend/frontend)
- No docker-compose.yml
- No `.env.example`
- No GitHub Actions workflow

---

## 5. Security Assessment

| Area | Status | Notes |
|---|---|---|
| Argon2 password hashing | ✅ Secure | pwdlib recommended() |
| JWT (HS256) | ✅ Good | Expiry enforced, secret from env |
| Role enforcement | ✅ All endpoints | No bypass paths found |
| Data isolation | ✅ All queries filtered | Per-user/per-recruiter |
| File upload | ✅ Extension + magic bytes | Good |
| Path traversal | ✅ Resolved path check | Good |
| File path exposure | ✅ Not in schema | Good |
| CORS | ⚠️ Hardcoded localhost | Needs env-var for prod |
| Input validation | ✅ Pydantic + Field constraints | Good |
| SQL injection | ✅ ORM only | Good |
| Secrets | ✅ .env, not committed | Good |

---

## 6. ML System Assessment

| Component | Status | Weight |
|---|---|---|
| TF-IDF cosine similarity | ✅ | 0.25 |
| Sentence Transformer (all-MiniLM-L6-v2) | ✅ | 0.45 |
| Skill overlap score | ✅ | 0.30 |
| Skill aliases (Postgres→PostgreSQL, ML→Machine Learning) | ✅ | — |
| Score range 0-100 | ✅ Enforced | — |
| Match persistence (upsert) | ✅ | — |
| Model caching (lru_cache) | ✅ | — |
| Recommendation generation | ⚠️ Minimal ("Consider learning X") | — |
| Cross-Encoder re-ranking | ❌ Not implemented | Planned |
| Evaluation framework | ❌ Not implemented | — |
| spaCy | ❌ In requirements but unused | — |

---

## 7. Test Coverage

| File | Tests | Coverage |
|---|---|---|
| `test_security.py` | Hashing, JWT | ✅ Runs without DB |
| `test_ml.py` | Preprocessing, extraction, scoring | ✅ No DB needed |
| `test_matching_api.py` | API matching, auth, ownership | ✅ SQLite in-memory |
| `test_resume_api.py` | Resume upload API | ⚠️ Needs review |
| `test_resume_extraction.py` | PDF/DOCX extraction | ⚠️ Needs test files |
| `test_db.py` | DB connection | ❌ Requires live PostgreSQL |
| Auth/registration tests | — | ❌ Missing |
| Job CRUD tests | — | ❌ Missing |
| Application flow tests | — | ❌ Missing |

---

## 8. Prioritized Roadmap

### Milestone 1 — Critical Bug Fixes + Missing Routes (Session 1)
- Fix B1-B7 (all critical/high bugs)
- Register missing routes in App.tsx
- Add navigation to dashboards

### Milestone 2 — Recruiter Applications Management Page (Session 1-2)
- Full recruiter applications page with status management

### Milestone 3 — Candidate Profile & Resume Management (Session 2)
- Profile edit page, resume upload/management UI

### Milestone 4 — AI Match Results & Ranked Candidates (Session 2-3)
- Match history detail, ranked candidates, candidate detail views

### Milestone 5 — Extended Backend Tests (Session 3)
- Auth, job CRUD, application flow test suites

### Milestone 6 — Docker & Deployment (Session 3-4)
- Dockerfiles, docker-compose, GitHub Actions, .env.example

### Milestone 7 — Documentation (Session 4)
- Complete README, API docs

