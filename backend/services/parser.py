"""Resume parser service — supports JSON and TXT (extensible to PDF/DOCX)."""

import json
import re
from pathlib import Path
from typing import Optional

from models.schemas import CandidateProfile, EducationEntry, ExperienceEntry


def parse_resume(file_path: str) -> CandidateProfile:
    """Parse a resume file and return a structured CandidateProfile."""
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext == ".json":
        return _parse_json(path)
    elif ext == ".txt":
        return _parse_txt(path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported: .json, .txt")


def _parse_json(path: Path) -> CandidateProfile:
    """Parse a structured JSON resume."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not data:
        raise ValueError("Resume contains no usable information.")

    education = [
        EducationEntry(**edu) for edu in data.get("education", [])
    ]
    experience = [
        ExperienceEntry(**exp) for exp in data.get("experience", [])
    ]

    return CandidateProfile(
        name=data.get("name", "Unknown"),
        email=data.get("email", ""),
        phone=data.get("phone"),
        location=data.get("location"),
        summary=data.get("summary"),
        education=education,
        experience=experience,
        skills=data.get("skills", []),
        certifications=data.get("certifications", []),
        note=data.get("note"),
    )


def _parse_txt(path: Path) -> CandidateProfile:
    """
    Parse a plain-text resume with a best-effort approach.
    Returns a CandidateProfile with raw text stored in summary.
    """
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().strip()

    if not content:
        raise ValueError("Resume contains no usable information.")

    
    lines = [line.strip() for line in content.split("\n") if line.strip()]
    name = lines[0] if lines else "Unknown"

    email = ""
    phone = ""
    for line in lines:
        if re.search(r"[\w.-]+@[\w.-]+\.\w+", line):
            email = re.search(r"[\w.-]+@[\w.-]+\.\w+", line).group()
        if re.search(r"[\+]?[\d\s\-\(\)]{10,}", line):
            phone_match = re.search(r"[\+]?[\d\s\-\(\)]{10,}", line)
            if phone_match:
                phone = phone_match.group().strip()

    return CandidateProfile(
        name=name,
        email=email,
        phone=phone if phone else None,
        location=None,
        summary=content,  
        education=[],
        experience=[],
        skills=[],
        certifications=[],
    )


def load_sample_resume() -> CandidateProfile:
    """Load the built-in demo resume."""
    sample_path = Path(__file__).parent.parent / "data" / "sample_resume.json"
    return _parse_json(sample_path)


def profile_to_context_string(profile: CandidateProfile) -> str:
    """Convert a CandidateProfile to a plain-text string for AI context."""
    lines = []
    lines.append(f"CANDIDATE: {profile.name}")
    lines.append(f"Email: {profile.email}")
    if profile.phone:
        lines.append(f"Phone: {profile.phone}")
    if profile.location:
        lines.append(f"Location: {profile.location}")
    if profile.summary:
        lines.append(f"\nSUMMARY:\n{profile.summary}")

    if profile.education:
        lines.append("\nEDUCATION:")
        for edu in profile.education:
            lines.append(f"  - {edu.degree}, {edu.institution} ({edu.start}–{edu.end})")

    if profile.experience:
        lines.append("\nEXPERIENCE:")
        for exp in profile.experience:
            lines.append(f"  Company: {exp.company}")
            lines.append(f"  Title: {exp.title}")
            lines.append(f"  Period: {exp.start} to {exp.end}")
            if exp.responsibilities:
                lines.append("  Responsibilities:")
                for r in exp.responsibilities:
                    lines.append(f"    - {r}")

    if profile.skills:
        lines.append(f"\nSKILLS: {', '.join(profile.skills)}")

    if profile.certifications:
        lines.append(f"\nCERTIFICATIONS: {', '.join(profile.certifications)}")

    if profile.note:
        lines.append(f"\nNOTE: {profile.note}")

    return "\n".join(lines)
