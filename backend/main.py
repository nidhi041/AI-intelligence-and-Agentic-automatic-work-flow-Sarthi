"""
AI Candidate Intelligence & Agentic Hiring Assistant
FastAPI Backend — main entry point. AI provider: Google Gemini.
"""

import json
import os
import sys
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import ValidationError

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from models.schemas import (
    CandidateEvaluation,
    CandidateProfile,
    EvaluateRequest,
    QARequest,
    QAResponse,
)
from services import activity_log as log_svc
from services import ai_service, email_service, gap_analyzer, parser, pdf_service

# --------------------------------------------------------------------------- #
#  App setup
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="AI Candidate Intelligence",
    description="AI-powered resume analysis, recruiter Q&A and automated hiring evaluation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(__file__).parent / "outputs"
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# In-memory current candidate (session state)
_current_candidate: Optional[CandidateProfile] = None


def _get_candidate() -> CandidateProfile:
    global _current_candidate
    if _current_candidate is None:
        raise HTTPException(status_code=400, detail="No candidate loaded. Upload a resume first.")
    return _current_candidate


# --------------------------------------------------------------------------- #
#  Routes
# --------------------------------------------------------------------------- #

@app.get("/")
def root():
    return {
        "name": "AI Candidate Intelligence",
        "version": "1.0.0",
        "demo_mode": ai_service.is_demo_mode(),
        "ai_mode": ai_service.get_ai_mode(),
        "status": "running",
    }


@app.get("/candidate")
def get_candidate():
    """Return the currently loaded candidate profile with gap analysis."""
    candidate = _get_candidate()
    gaps = gap_analyzer.detect_gaps(candidate)
    total_exp = gap_analyzer.calculate_total_experience_months(candidate)

    return {
        "candidate": candidate.model_dump(),
        "employment_gaps": [g.model_dump() for g in gaps],
        "total_experience_years": total_exp,
        "demo_mode": ai_service.is_demo_mode(),
    }


@app.get("/demo")
def load_demo():
    """Load the built-in sample resume for demo purposes."""
    global _current_candidate
    try:
        _current_candidate = parser.load_sample_resume()
        gaps = gap_analyzer.detect_gaps(_current_candidate)
        total_exp = gap_analyzer.calculate_total_experience_months(_current_candidate)

        log_svc.clear_log()
        log_svc.add_event("upload", "Demo resume loaded", f"Candidate: {_current_candidate.name}")
        log_svc.add_event("parse", "Resume parsed successfully")
        log_svc.add_event("profile", f"Candidate profile created for {_current_candidate.name}")

        return {
            "message": "Demo resume loaded successfully.",
            "candidate": _current_candidate.model_dump(),
            "employment_gaps": [g.model_dump() for g in gaps],
            "total_experience_years": total_exp,
            "demo_mode": ai_service.is_demo_mode(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a candidate resume (JSON or TXT)."""
    global _current_candidate

    allowed_extensions = {".json", ".txt"}
    ext = Path(file.filename or "").suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: '{ext}'. Accepted formats: JSON, TXT.",
        )

    # Save uploaded file
    save_path = UPLOAD_DIR / (file.filename or "resume.json")
    content = await file.read()

    if not content.strip():
        raise HTTPException(status_code=400, detail="Resume contains no usable information.")

    with open(save_path, "wb") as f:
        f.write(content)

    # Parse
    try:
        _current_candidate = parser.parse_resume(str(save_path))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

    gaps = gap_analyzer.detect_gaps(_current_candidate)
    total_exp = gap_analyzer.calculate_total_experience_months(_current_candidate)

    log_svc.clear_log()
    log_svc.add_event("upload", f"Resume uploaded: {file.filename}")
    log_svc.add_event("parse", "Resume parsed successfully")
    log_svc.add_event("profile", f"Candidate profile created for {_current_candidate.name}")

    return {
        "message": "Resume uploaded and parsed successfully.",
        "candidate": _current_candidate.model_dump(),
        "employment_gaps": [g.model_dump() for g in gaps],
        "total_experience_years": total_exp,
        "demo_mode": ai_service.is_demo_mode(),
    }


@app.post("/ask")
def ask(request: QARequest):
    """Answer a natural-language question grounded to the loaded resume."""
    candidate = _get_candidate()

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        response = ai_service.ask_question(request.question, candidate)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    log_svc.add_event("qa", f"Recruiter asked: \"{request.question}\"")
    log_svc.add_event("ai_answer", "AI answered with resume evidence", response.answer[:100])

    return response.model_dump()


@app.post("/evaluate")
def evaluate(request: EvaluateRequest):
    """Run the agentic evaluation workflow and return a validated evaluation."""
    candidate = _get_candidate()

    log_svc.add_event("agent_start", "AI Hiring Agent started", f"Target role: {request.target_role}")

    try:
        # Step 1-3: Already done by parser and gap_analyzer
        log_svc.add_event("agent_step", "Candidate information extracted")
        log_svc.add_event("agent_step", "Experience calculated")

        gaps = gap_analyzer.detect_gaps(candidate)
        log_svc.add_event("agent_step", f"Employment gaps identified: {len(gaps)} gap(s)")

        # Step 4-6: AI evaluation
        evaluation = ai_service.generate_evaluation(candidate, request.target_role)
        log_svc.add_event("agent_step", "Skills mapped to target role")
        log_svc.add_event("agent_eval", "Hiring evaluation generated")

        return {
            "evaluation": evaluation.model_dump(),
            "demo_mode": ai_service.is_demo_mode(),
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@app.post("/evaluate-and-dispatch")
def evaluate_and_dispatch(request: EvaluateRequest):
    """
    Full agentic workflow:
    Evaluate → Validate → Generate PDF → Simulate HR dispatch.
    """
    candidate = _get_candidate()

    log_svc.add_event("agent_start", "AI Hiring Agent started (full dispatch)", f"Target: {request.target_role}")

    try:
        # Evaluation
        log_svc.add_event("agent_step", "Extracting candidate information")
        log_svc.add_event("agent_step", "Validating extracted information")
        log_svc.add_event("agent_step", "Calculating documented experience")

        gaps = gap_analyzer.detect_gaps(candidate)
        log_svc.add_event("agent_step", f"Employment gaps identified ({len(gaps)} found)")

        evaluation = ai_service.generate_evaluation(candidate, request.target_role)
        log_svc.add_event("agent_step", "Role-relevant skills identified")
        log_svc.add_event("agent_eval", "Structured hiring evaluation generated")
        log_svc.add_event("agent_step", "Evaluation validated against schema")

        # PDF
        pdf_filename = pdf_service.generate_evaluation_pdf(evaluation)
        log_svc.add_event("pdf", f"PDF generated: {pdf_filename}")

        # Mock dispatch
        dispatch = email_service.simulate_dispatch(evaluation, pdf_filename)
        log_svc.add_event("dispatch", f"Mock HR dispatch completed → {dispatch['recipient']}")

        return {
            "evaluation": evaluation.model_dump(),
            "pdf_file": pdf_filename,
            "dispatch": dispatch,
            "demo_mode": ai_service.is_demo_mode(),
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow failed: {str(e)}")


@app.get("/download/{filename}")
def download_file(filename: str):
    """Download a generated file (PDF or JSON)."""
    # Security: only allow specific filenames from outputs dir
    allowed = {"candidate_evaluation.pdf", "candidate_evaluation.json"}
    if filename not in allowed:
        raise HTTPException(status_code=400, detail="File not available for download.")

    filepath = OUTPUT_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"{filename} has not been generated yet.")

    media_type = "application/pdf" if filename.endswith(".pdf") else "application/json"
    return FileResponse(str(filepath), media_type=media_type, filename=filename)


@app.post("/save-json")
def save_evaluation_json(request: EvaluateRequest):
    """Generate evaluation and save as JSON for download."""
    candidate = _get_candidate()
    try:
        evaluation = ai_service.generate_evaluation(candidate, request.target_role)
        json_path = OUTPUT_DIR / "candidate_evaluation.json"
        with open(json_path, "w") as f:
            json.dump(evaluation.model_dump(), f, indent=2)
        return {"message": "JSON saved.", "filename": "candidate_evaluation.json"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/activity")
def get_activity():
    """Return the activity log."""
    return {"events": log_svc.get_log()}


@app.get("/status")
def get_status():
    """Return system status including AI provider mode."""
    return {
        "demo_mode": ai_service.is_demo_mode(),
        "ai_mode": ai_service.get_ai_mode(),
        "candidate_loaded": _current_candidate is not None,
        "candidate_name": _current_candidate.name if _current_candidate else None,
    }
