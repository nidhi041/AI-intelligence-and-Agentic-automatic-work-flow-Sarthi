"""Pydantic models for the AI Candidate Intelligence system."""

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class EducationEntry(BaseModel):
    degree: str
    institution: str
    start: str
    end: str


class ExperienceEntry(BaseModel):
    company: str
    title: str
    start: str
    end: str
    responsibilities: List[str] = []


class CandidateProfile(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
    skills: List[str] = []
    certifications: List[str] = []
    note: Optional[str] = None


class EmploymentGap(BaseModel):
    start: str
    end: str
    duration_months: int
    description: str


class CandidateEvaluation(BaseModel):
    candidate_name: str
    email: str
    primary_skillset: List[str]
    years_of_experience: float
    relevant_experience: List[str]
    cloud_experience: str
    employment_gaps: List[str]
    red_flags: List[str]
    recommended_role: str
    recommendation_reason: str
    confidence: str


class QARequest(BaseModel):
    question: str


class QAResponse(BaseModel):
    question: str
    answer: str
    evidence: str
    source: str


class EvaluateRequest(BaseModel):
    target_role: str = "Backend Developer"


class EvaluateDispatchResponse(BaseModel):
    evaluation: CandidateEvaluation
    pdf_file: str
    dispatch: dict
