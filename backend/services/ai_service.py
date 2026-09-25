"""
AI service layer — Google Gemini provider with automatic demo-mode fallback.
Supports GEMINI_API_KEY; falls back to deterministic mock responses when key is absent.
"""

import json
import os
import re

from models.schemas import CandidateEvaluation, CandidateProfile, QAResponse
from services.parser import profile_to_context_string

# --------------------------------------------------------------------------- #
#  System prompts  (unchanged — all hallucination-prevention rules preserved)
# --------------------------------------------------------------------------- #

QA_SYSTEM_PROMPT = """You are an AI recruitment document assistant.

Your job is to answer questions using ONLY the candidate information supplied in the resume.

Rules:
1. Never invent candidate information.
2. Never infer missing employment, education, skills, responsibilities, or achievements.
3. If information is unavailable, explicitly say: "The resume does not provide this information."
4. Distinguish documented facts from interpretations.
5. Identify employment gaps only from explicitly documented dates.
6. Never assume that an employment gap means unemployment.
7. Never invent the reason for an employment gap.
8. Never assume skill proficiency without evidence.
9. Keep answers factual and concise.
10. Do not use external knowledge about the candidate.
11. When possible, explain which resume information supports the answer.

Always respond in this exact JSON format:
{
  "answer": "<your answer here>",
  "evidence": "<direct quote or description from the resume>",
  "source": "<section of the resume e.g. Experience → CloudPeak Labs>"
}

If no evidence exists, set evidence to "No supporting information found in the supplied resume." and source to "N/A"."""

EVALUATION_SYSTEM_PROMPT = """You are a corporate hiring evaluation agent.

Generate a structured hiring evaluation using ONLY the supplied resume.

Rules:
1. Never invent information.
2. Never infer missing information.
3. Do not assume the reason for an employment gap.
4. Identify unexplained gaps explicitly.
5. Calculate experience only from documented employment periods.
6. Identify cloud experience only when supported by the resume.
7. If information is unavailable, return: "Not provided in resume."
8. Return valid JSON only — no markdown, no extra text.
9. Follow the required schema exactly.

Required JSON schema:
{
  "candidate_name": "",
  "email": "",
  "primary_skillset": [],
  "years_of_experience": 0.0,
  "relevant_experience": [],
  "cloud_experience": "",
  "employment_gaps": [],
  "red_flags": [],
  "recommended_role": "",
  "recommendation_reason": "",
  "confidence": ""
}"""


# --------------------------------------------------------------------------- #
#  Demo-mode deterministic responses (unchanged)
# --------------------------------------------------------------------------- #

DEMO_QA_RESPONSES: dict[str, dict] = {
    "cloud": {
        "answer": "Yes. The candidate has documented cloud experience with AWS EC2 and S3, as well as Docker-based deployments.",
        "evidence": "\"Deployed applications using Docker\" and \"Worked with AWS EC2 and S3\"",
        "source": "Experience → CloudPeak Labs",
    },
    "gap": {
        "answer": "Yes. There is a documented period between August 2023 and January 2025 (approximately 17 months) that is not explained in the resume. The resume does not provide this information.",
        "evidence": "TechNova Solutions end date: 2023-08. CloudPeak Labs start date: 2025-01. No employment is listed between these dates.",
        "source": "Experience section — date analysis",
    },
    "backend": {
        "answer": "The candidate has documented experience with Python, FastAPI, REST APIs, PostgreSQL, and JWT authentication.",
        "evidence": "\"Developed REST APIs using Python and FastAPI\", \"Worked with PostgreSQL\", \"Built authentication systems using JWT\"",
        "source": "Experience → TechNova Solutions",
    },
    "aws": {
        "answer": "Yes. The resume mentions AWS EC2 and S3. The candidate also holds an AWS Cloud Practitioner certification.",
        "evidence": "\"Worked with AWS EC2 and S3\" and Certifications: \"AWS Cloud Practitioner\"",
        "source": "Experience → CloudPeak Labs + Certifications",
    },
    "2023": {
        "answer": "The resume does not provide this information. There is an undocumented period between August 2023 and January 2025. The resume does not explain what the candidate was doing during this time.",
        "evidence": "No supporting information found in the supplied resume.",
        "source": "N/A",
    },
    "default": {
        "answer": "Based on the resume, the candidate is a software engineer with experience in Python, FastAPI, Docker, and AWS. For specific information not covered here, please refer to the resume.",
        "evidence": "See candidate profile and experience sections.",
        "source": "Resume — general",
    },
}

DEMO_EVALUATION = {
    "candidate_name": "Aarav Mehta",
    "email": "aarav.mehta@example.com",
    "primary_skillset": ["Python", "FastAPI", "REST APIs", "PostgreSQL", "Docker", "AWS", "GitHub Actions", "JWT", "Microservices"],
    "years_of_experience": 3.6,
    "relevant_experience": [
        "Backend Engineer at TechNova Solutions (Jul 2021 – Aug 2023): REST APIs, Python, FastAPI, PostgreSQL, JWT",
        "Platform Developer at CloudPeak Labs (Jan 2025 – Jun 2026): Microservices, Docker, AWS EC2/S3, CI/CD",
    ],
    "cloud_experience": "AWS EC2 and S3 (CloudPeak Labs). Docker-based deployments. CI/CD with GitHub Actions. AWS Cloud Practitioner certified.",
    "employment_gaps": [
        "Undocumented period: August 2023 to January 2025 (approximately 17 months). The resume does not explain this period."
    ],
    "red_flags": [
        "Employment period between August 2023 and January 2025 (approximately 17 months) is not explained in the resume. Recruiter should seek clarification."
    ],
    "recommended_role": "Backend Developer",
    "recommendation_reason": "The candidate demonstrates documented proficiency in Python, FastAPI, REST APIs, PostgreSQL, Docker, and AWS — all directly relevant to a backend developer role. Cloud and DevOps exposure adds further value.",
    "confidence": "High",
}


# --------------------------------------------------------------------------- #
#  Provider detection
# --------------------------------------------------------------------------- #

# Model preference order: primary → secondary → demo fallback
_PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
_FALLBACK_MODEL = "gemini-2.5-flash"

# Set to True at runtime when the chosen model is unavailable (404)
_force_demo_mode: bool = False


def _get_gemini_key() -> str:
    """Return the Gemini API key from environment, or empty string."""
    return os.getenv("GEMINI_API_KEY", "").strip()


def _is_demo_mode() -> bool:
    """Return True when no valid Gemini API key is configured, or model is unavailable."""
    key = _get_gemini_key()
    if not key or key.startswith("your_"):
        return True
    # Also return True if a runtime 404 forced demo mode
    return _force_demo_mode


def get_ai_mode() -> str:
    """Return a human-readable mode name for the UI."""
    return "demo" if _is_demo_mode() else "gemini"


# --------------------------------------------------------------------------- #
#  Gemini client  (google-genai SDK — current)
# --------------------------------------------------------------------------- #


def _call_gemini(system_prompt: str, user_message: str) -> str:
    """
    Call the Google Gemini API using the current google-genai SDK.
    Uses temperature=0 for deterministic, factual output.

    Retry/fallback strategy:
      1. gemini-3.8-flash  (primary; retry once on 503 temporary overload)
      2. gemini-3.7-flash  (intermediate fallback)
      3. gemini-3.5-flash  (stable fallback)
      → demo mode          (graceful last resort)
    """
    import time

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        raise RuntimeError(
            "google-genai package not installed. "
            "Run: pip install google-genai"
        )

    global _force_demo_mode

    key = _get_gemini_key()
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=key)

    # System instructions prepended to the user message (new SDK style)
    combined_contents = f"{system_prompt}\n\n{user_message}"

    # Full model fallback chain
    model_chain = [_PRIMARY_MODEL, "gemini-3.7-flash", _FALLBACK_MODEL]
    # Deduplicate while preserving order
    seen: set = set()
    ordered_chain = []
    for m in model_chain:
        if m not in seen:
            seen.add(m)
            ordered_chain.append(m)

    last_err = ""
    for idx, model_name in enumerate(ordered_chain):
        is_last = idx == len(ordered_chain) - 1
        max_attempts = 2 if idx == 0 else 1  # Retry primary once on 503
        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=combined_contents,
                    config=genai_types.GenerateContentConfig(
                        temperature=0.0,
                        response_mime_type="application/json",
                    ),
                )
                _force_demo_mode = False  # Successful — clear fallback flag
                return response.text or ""

            except Exception as e:
                err_str = str(e)
                last_err = err_str

                # 503 = temporary overload — retry after short pause
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    if attempt < max_attempts - 1:
                        time.sleep(2)
                        continue  # retry
                    # Exhausted retries for this model → try next
                    break

                # 404 = model not available for this key → try next immediately
                if ("404" in err_str
                        or "not found" in err_str.lower()
                        or "not supported" in err_str.lower()):
                    break  # skip to next model

                # Any other error — surface it directly
                raise RuntimeError(f"AI service temporarily unavailable: {err_str}")

    # All models in chain failed
    _force_demo_mode = True
    raise RuntimeError(
        f"All Gemini models are currently unavailable. "
        f"Last error: {last_err[:200]}. Falling back to demo mode."
    )


# --------------------------------------------------------------------------- #
#  JSON extraction (provider-agnostic)
# --------------------------------------------------------------------------- #

def _extract_json(text: str) -> dict:
    """Robustly extract JSON from LLM output, stripping any markdown fences."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"```(?:json)?", "", text).strip().strip("`")
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        raise ValueError(f"Evaluation could not be validated. Raw output: {text[:200]}")


def _get_demo_qa_response(question: str) -> dict:
    """Return a deterministic demo response based on question keywords."""
    q = question.lower()
    if any(kw in q for kw in ["cloud", "deploy", "docker", "aws"]):
        return DEMO_QA_RESPONSES["cloud"]
    if any(kw in q for kw in ["gap", "unexplained", "between"]):
        return DEMO_QA_RESPONSES["gap"]
    if any(kw in q for kw in ["backend", "technology", "technologies", "stack"]):
        return DEMO_QA_RESPONSES["backend"]
    if "aws" in q:
        return DEMO_QA_RESPONSES["aws"]
    if any(kw in q for kw in ["2023", "2024", "2025", "doing", "during"]):
        return DEMO_QA_RESPONSES["2023"]
    return DEMO_QA_RESPONSES["default"]


# --------------------------------------------------------------------------- #
#  Public API (unchanged signatures — backend routes use these directly)
# --------------------------------------------------------------------------- #

def ask_question(question: str, profile: CandidateProfile) -> QAResponse:
    """Answer a recruiter question grounded to the provided candidate profile."""
    context = profile_to_context_string(profile)
    user_message = f"RESUME CONTEXT:\n{context}\n\nQUESTION: {question}"

    if _is_demo_mode():
        raw = _get_demo_qa_response(question)
    else:
        try:
            raw_text = _call_gemini(QA_SYSTEM_PROMPT, user_message)
            raw = _extract_json(raw_text)
        except RuntimeError:
            # All models unavailable — graceful fallback to demo response
            raw = _get_demo_qa_response(question)

    return QAResponse(
        question=question,
        answer=raw.get("answer", "The resume does not provide this information."),
        evidence=raw.get("evidence", "No supporting information found in the supplied resume."),
        source=raw.get("source", "N/A"),
    )


def generate_evaluation(profile: CandidateProfile, target_role: str) -> CandidateEvaluation:
    """
    Generate and validate a structured hiring evaluation.
    Uses Pydantic schema; retries once on validation failure.
    """
    context = profile_to_context_string(profile)
    user_message = (
        f"RESUME CONTEXT:\n{context}\n\n"
        f"TARGET ROLE: {target_role}\n\n"
        "Generate the structured hiring evaluation JSON."
    )

    if _is_demo_mode():
        raw = dict(DEMO_EVALUATION)
        raw["recommended_role"] = target_role
    else:
        raw_text = _call_gemini(EVALUATION_SYSTEM_PROMPT, user_message)
        raw = _extract_json(raw_text)

        # Retry once if Pydantic validation fails
        try:
            return CandidateEvaluation(**raw)
        except Exception:
            raw_text = _call_gemini(EVALUATION_SYSTEM_PROMPT, user_message)
            raw = _extract_json(raw_text)

    try:
        return CandidateEvaluation(**raw)
    except Exception as e:
        raise ValueError(f"Evaluation could not be validated: {str(e)}")


# Kept for backward compatibility with existing callers
def is_demo_mode() -> bool:
    return _is_demo_mode()
