# AI Candidate Intelligence & Agentic Hiring Assistant

#Frontend: https://ai-intelligence-and-agentic-automat.vercel.app/
#Backend : https://ai-intelligence-and-agentic-automatic.onrender.com/

## Overview

A full-stack AI-powered recruitment assistant that demonstrates intelligent document analysis, recruiter Q&A, and automated agentic hiring evaluation — built as a working 24-hour MVP.

## Problem

Modern recruiting involves manually reading resumes, asking repetitive questions, maintaining evaluation forms, and coordinating with HR teams — all slow, inconsistent, and error-prone.

## Solution

An AI-native recruiter dashboard that:
- Parses candidate resumes into structured profiles
- Answers recruiter questions **grounded only to resume content** (no hallucination)
- Detects employment gaps without making assumptions
- Runs a 10-step agentic evaluation workflow automatically
- Generates PDF/JSON evaluation forms and simulates HR dispatch

## Features

- **Resume parsing** — JSON and TXT (PDF/DOCX extensible)
- **Candidate profile** — structured display with experience timeline
- **Employment gap detection** — identifies undocumented periods without assuming reasons
- **Grounded AI Q&A** — answers only from resume context, refuses to hallucinate
- **Evidence-backed answers** — shows source quote and resume section
- **Agentic evaluation** — 10-step automated hiring workflow
- **Pydantic validation** — AI output validated before use
- **PDF generation** — professional Corporate Hiring Evaluation Form via ReportLab
- **JSON download** — structured evaluation export
- **Mock HR dispatch** — simulated email to hr-admissions@company.mock
- **Activity log** — complete workflow event history
- **Demo mode** — fully functional without an API key

## Architecture

```
Resume Upload
    ↓
Parser (JSON/TXT → CandidateProfile)
    ↓
Structured Candidate Profile
    ↓
AI Q&A (grounded to resume only)
    ↓
Agentic Evaluation (10-step workflow)
    ↓
Pydantic Validation
    ↓
PDF / JSON generation
    ↓
Mock HR Dispatch
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Lucide React |
| Backend | Python + FastAPI + Pydantic |
| AI | Google Gemini API using the official Google GenAI Python SDK |
| PDF | ReportLab |
| Storage | Local filesystem / JSON |
| Email | Mock (no real SMTP) |

## AI Provider

Google Gemini powers the core intelligence workflows of the platform:
- **Resume-grounded Q&A**: Answers recruiter inquiries strictly adhering to verified resume facts.
- **Evidence extraction**: Extracts direct quotes and identifies exact resume sections supporting answers.
- **Candidate evaluation**: Assesses qualifications, experience, and competencies against target roles.
- **Structured evaluation generation**: Generates schema-compliant, validated JSON evaluation models.

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app + all API routes
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/
│   │   └── sample_resume.json   # Built-in demo candidate (Aarav Mehta)
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── services/
│   │   ├── parser.py            # Resume parser (JSON/TXT)
│   │   ├── gap_analyzer.py      # Employment gap detection
│   │   ├── ai_service.py        # LLM integration + demo fallback
│   │   ├── pdf_service.py       # ReportLab PDF generation
│   │   ├── email_service.py     # Mock email dispatch
│   │   └── activity_log.py      # Event logging
│   ├── outputs/                 # Generated PDFs and JSON
│   └── tests/
│       └── test_main.py         # Pytest test suite
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main application + state
    │   ├── api/client.js        # Backend API client
    │   └── components/
    │       ├── Navbar.jsx
    │       ├── UploadResume.jsx
    │       ├── CandidateProfile.jsx
    │       ├── ExperienceTimeline.jsx
    │       ├── ChatBox.jsx
    │       ├── SuggestedQuestions.jsx
    │       ├── EvidenceCard.jsx
    │       ├── HiringAgent.jsx
    │       ├── AgentProgress.jsx
    │       ├── EvaluationCard.jsx
    │       ├── DispatchModal.jsx
    │       └── ActivityLog.jsx
    └── vite.config.js
```

## Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Configure `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend server:
```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key. Used only by the FastAPI backend and must never be exposed to the frontend. |

> **Security Note**: `GEMINI_API_KEY` is used only by the FastAPI backend and must never be exposed to the frontend or browser client.

If `GEMINI_API_KEY` is not configured, the application runs in **Demo AI Mode** using deterministic mock responses. All application features remain fully functional without an API key.

## Demo Flow

1. Open http://localhost:5173
2. Click **Load Demo** to load the built-in Aarav Mehta resume
3. Go to **Candidate** tab — view profile, experience timeline, skills
4. Go to **AI Q&A** tab — ask "Does the candidate have cloud deployment experience?"
5. Test hallucination prevention — ask "What was the candidate doing between 2023 and 2025?"
6. Go to **Evaluation** tab — select **Backend Developer**, click **Run AI Evaluation**
7. Watch the 10-step agent workflow complete
8. Click **Download PDF** and **Download JSON**
9. Click **Send to HR** → Simulate Dispatch
10. Go to **Activity** tab — view complete workflow history

## Example Questions

| Question | Expected Behavior |
|---|---|
| "Does this candidate have cloud deployment experience?" | References AWS EC2/S3 and Docker with evidence |
| "Are there unexplained employment gaps?" | Reports Aug 2023 → Jan 2025 without assuming reason |
| "What backend technologies has the candidate used?" | Lists Python, FastAPI, REST APIs, PostgreSQL, JWT |
| "What was the candidate doing during the employment gap?" | "The resume does not provide this information." |

## Hallucination Prevention

The AI is designed to never fabricate information:

| Mechanism | Description |
|---|---|
| **Grounded system prompt** | AI instructed to use ONLY supplied resume content |
| **Temperature 0** | Deterministic, factual output |
| **No external knowledge** | AI explicitly told not to use external information |
| **Explicit missing-info handling** | Returns "The resume does not provide this information." |
| **Gap neutrality** | Employment gaps reported without assuming unemployment or reasons |
| **Structured output** | JSON schema enforced |
| **Pydantic validation** | AI output validated before use; retries once on failure |

## Agentic Workflow

When "Run AI Evaluation" is clicked, the system executes 10 sequential steps:

```
1. Extract candidate information
2. Validate extracted information
3. Calculate documented experience
4. Identify employment gaps
5. Identify role-relevant skills
6. Generate structured hiring evaluation
7. Validate evaluation against schema
8. Generate PDF report
9. Prepare mock HR email
10. Complete dispatch simulation
```

This demonstrates: **Understand → Analyze → Validate → Generate → Dispatch**

## Limitations

- Email dispatch is mocked (no real SMTP)
- PDF parsing requires future integration (architecture is in place)
- Single candidate session (no database persistence)
- No authentication

## Next Steps

- PDF and DOCX resume parsing
- OCR for scanned documents
- Vector database for multi-document candidate search
- Multi-candidate comparison dashboard
- Authentication and user accounts
- Real email dispatch (SMTP/SendGrid)
- PostgreSQL for persistent storage
- Audit logs and compliance
- Human approval gates in the agentic workflow
- Production cloud deployment (Docker + Kubernetes)
