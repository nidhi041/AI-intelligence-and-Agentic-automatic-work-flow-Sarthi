"""Tests for the AI Candidate Intelligence backend."""

import json
import sys
from pathlib import Path
import pytest

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.schemas import CandidateProfile, CandidateEvaluation, EducationEntry, ExperienceEntry
from services.parser import parse_resume, load_sample_resume, profile_to_context_string
from services.gap_analyzer import detect_gaps, calculate_total_experience_months
from services.ai_service import ask_question, generate_evaluation, is_demo_mode
from services.pdf_service import generate_evaluation_pdf
from services.email_service import simulate_dispatch


# --------------------------------------------------------------------------- #
#  Fixtures
# --------------------------------------------------------------------------- #

@pytest.fixture
def sample_profile():
    """Load the built-in sample candidate."""
    return load_sample_resume()


@pytest.fixture
def sample_evaluation(sample_profile):
    """Generate an evaluation for the sample candidate."""
    return generate_evaluation(sample_profile, "Backend Developer")


# --------------------------------------------------------------------------- #
#  1. Resume Parsing
# --------------------------------------------------------------------------- #

class TestResumeParsing:
    def test_load_sample_resume(self, sample_profile):
        """Sample resume should load and parse correctly."""
        assert sample_profile.name == "Aarav Mehta"
        assert sample_profile.email == "aarav.mehta@example.com"
        assert sample_profile.location == "Gurugram, India"

    def test_sample_has_experience(self, sample_profile):
        """Sample resume should have two experience entries."""
        assert len(sample_profile.experience) == 2
        companies = [exp.company for exp in sample_profile.experience]
        assert "TechNova Solutions" in companies
        assert "CloudPeak Labs" in companies

    def test_sample_has_skills(self, sample_profile):
        """Sample resume should have skills."""
        assert len(sample_profile.skills) > 0
        assert "Python" in sample_profile.skills
        assert "FastAPI" in sample_profile.skills

    def test_sample_has_certifications(self, sample_profile):
        """Sample resume should have certifications."""
        assert "AWS Cloud Practitioner" in sample_profile.certifications

    def test_unsupported_format_raises(self, tmp_path):
        """Unsupported file format should raise ValueError."""
        fake = tmp_path / "resume.docx"
        fake.write_text("test content")
        with pytest.raises(ValueError, match="Unsupported file format"):
            parse_resume(str(fake))

    def test_txt_parsing(self, tmp_path):
        """TXT resume should parse without error."""
        txt_file = tmp_path / "resume.txt"
        txt_file.write_text("John Doe\njohn.doe@example.com\nSoftware Engineer")
        profile = parse_resume(str(txt_file))
        assert profile.name == "John Doe"
        assert "john.doe@example.com" in profile.email

    def test_empty_file_raises(self, tmp_path):
        """Empty file should raise ValueError."""
        empty = tmp_path / "resume.txt"
        empty.write_text("")
        with pytest.raises(ValueError, match="no usable information"):
            parse_resume(str(empty))


# --------------------------------------------------------------------------- #
#  2. Q&A Endpoint Behavior
# --------------------------------------------------------------------------- #

class TestQandA:
    def test_cloud_question(self, sample_profile):
        """Cloud question should return positive answer with evidence."""
        response = ask_question(
            "Does this candidate have experience with cloud deployments?",
            sample_profile,
        )
        assert "aws" in response.answer.lower() or "cloud" in response.answer.lower() or "docker" in response.answer.lower()
        assert response.evidence
        assert response.question

    def test_backend_question(self, sample_profile):
        """Backend tech question should mention known skills."""
        response = ask_question(
            "What backend technologies has the candidate used?",
            sample_profile,
        )
        answer_lower = response.answer.lower()
        assert any(tech in answer_lower for tech in ["python", "fastapi", "rest", "postgresql"])

    def test_response_structure(self, sample_profile):
        """Q&A response should have all required fields."""
        response = ask_question("What are this candidate's skills?", sample_profile)
        assert hasattr(response, "question")
        assert hasattr(response, "answer")
        assert hasattr(response, "evidence")
        assert hasattr(response, "source")


# --------------------------------------------------------------------------- #
#  3. Missing Information Behavior (Hallucination Prevention)
# --------------------------------------------------------------------------- #

class TestHallucinationPrevention:
    def test_gap_reason_not_invented(self, sample_profile):
        """AI should not invent a reason for the employment gap."""
        response = ask_question(
            "What was the candidate doing during the employment gap between 2023 and 2025?",
            sample_profile,
        )
        answer_lower = response.answer.lower()
        # Should NOT claim unemployment, freelancing, studying, etc.
        fabricated_reasons = ["freelanc", "studying", "travel", "personal", "unemployed", "sabbatical"]
        for reason in fabricated_reasons:
            assert reason not in answer_lower, f"AI fabricated reason: '{reason}' found in answer"

    def test_gap_not_provided(self, sample_profile):
        """AI should explicitly say the resume doesn't provide gap info."""
        response = ask_question(
            "What was the candidate doing between August 2023 and January 2025?",
            sample_profile,
        )
        # Should indicate information is not in the resume
        assert (
            "not provide" in response.answer.lower()
            or "not explain" in response.answer.lower()
            or "no information" in response.answer.lower()
            or "resume does not" in response.answer.lower()
        )


# --------------------------------------------------------------------------- #
#  4. Employment Gap Detection
# --------------------------------------------------------------------------- #

class TestGapDetection:
    def test_gap_detected(self, sample_profile):
        """The Aug 2023 → Jan 2025 gap should be detected."""
        gaps = detect_gaps(sample_profile)
        assert len(gaps) > 0

    def test_gap_dates(self, sample_profile):
        """The gap should cover the Aug 2023 → Jan 2025 period."""
        gaps = detect_gaps(sample_profile)
        assert len(gaps) >= 1
        gap = gaps[0]
        assert "2023" in gap.start
        assert "2025" in gap.end

    def test_gap_duration(self, sample_profile):
        """The gap should be approximately 17 months."""
        gaps = detect_gaps(sample_profile)
        assert len(gaps) > 0
        gap = gaps[0]
        assert 15 <= gap.duration_months <= 18  # Allow minor date tolerance

    def test_gap_description_no_assumption(self, sample_profile):
        """Gap description should never assume unemployment."""
        gaps = detect_gaps(sample_profile)
        for gap in gaps:
            desc_lower = gap.description.lower()
            assert "unemployed" not in desc_lower
            assert "unemploy" not in desc_lower

    def test_no_gap_for_continuous_employment(self):
        """No gap should be detected for continuous employment."""
        profile = CandidateProfile(
            name="Test",
            email="test@test.com",
            experience=[
                ExperienceEntry(company="A", title="Dev", start="2020-01", end="2022-01", responsibilities=[]),
                ExperienceEntry(company="B", title="Dev", start="2022-02", end="2024-01", responsibilities=[]),
            ],
        )
        gaps = detect_gaps(profile, gap_threshold_months=3)
        assert len(gaps) == 0

    def test_experience_calculation(self, sample_profile):
        """Total documented experience should be calculated correctly."""
        total = calculate_total_experience_months(sample_profile)
        # TechNova: Jul 2021 - Aug 2023 = ~25 months = ~2.1yr
        # CloudPeak: Jan 2025 - Jun 2026 = ~17 months = ~1.4yr
        # Total ~3.5yr
        assert 3.0 <= total <= 4.5


# --------------------------------------------------------------------------- #
#  5. Evaluation Schema Validation
# --------------------------------------------------------------------------- #

class TestEvaluationSchema:
    def test_evaluation_structure(self, sample_evaluation):
        """Evaluation should have all required fields."""
        assert sample_evaluation.candidate_name
        assert sample_evaluation.email
        assert isinstance(sample_evaluation.primary_skillset, list)
        assert isinstance(sample_evaluation.years_of_experience, (int, float))
        assert isinstance(sample_evaluation.relevant_experience, list)
        assert isinstance(sample_evaluation.employment_gaps, list)
        assert isinstance(sample_evaluation.red_flags, list)
        assert sample_evaluation.recommended_role
        assert sample_evaluation.recommendation_reason
        assert sample_evaluation.confidence

    def test_evaluation_gap_in_red_flags(self, sample_evaluation):
        """The employment gap should be mentioned in red flags or employment_gaps."""
        all_text = " ".join(
            sample_evaluation.employment_gaps + sample_evaluation.red_flags
        ).lower()
        assert "2023" in all_text or "2025" in all_text or "gap" in all_text

    def test_pydantic_validation(self):
        """Invalid evaluation data should raise ValidationError."""
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            CandidateEvaluation(
                candidate_name="Test",
                # Missing required fields
            )


# --------------------------------------------------------------------------- #
#  6. PDF Generation
# --------------------------------------------------------------------------- #

class TestPDFGeneration:
    def test_pdf_created(self, sample_evaluation):
        """PDF should be generated and exist on disk."""
        filename = generate_evaluation_pdf(sample_evaluation)
        assert filename.endswith(".pdf")
        from pathlib import Path
        pdf_path = Path(__file__).parent.parent / "outputs" / filename
        assert pdf_path.exists()
        assert pdf_path.stat().st_size > 0

    def test_pdf_filename(self, sample_evaluation):
        """PDF filename should be the expected name."""
        filename = generate_evaluation_pdf(sample_evaluation)
        assert filename == "candidate_evaluation.pdf"


# --------------------------------------------------------------------------- #
#  7. Mock Dispatch
# --------------------------------------------------------------------------- #

class TestMockDispatch:
    def test_dispatch_simulated(self, sample_evaluation):
        """Dispatch should return simulated status."""
        result = simulate_dispatch(sample_evaluation, "candidate_evaluation.pdf")
        assert result["status"] == "simulated"
        assert result["recipient"] == "hr-admissions@company.mock"

    def test_dispatch_subject(self, sample_evaluation):
        """Dispatch subject should include candidate name."""
        result = simulate_dispatch(sample_evaluation, "candidate_evaluation.pdf")
        assert sample_evaluation.candidate_name in result["subject"]

    def test_dispatch_attachment(self, sample_evaluation):
        """Dispatch should include PDF attachment name."""
        result = simulate_dispatch(sample_evaluation, "candidate_evaluation.pdf")
        assert result["attachment"] == "candidate_evaluation.pdf"

    def test_no_real_email_sent(self, sample_evaluation):
        """Dispatch should include mock-only note."""
        result = simulate_dispatch(sample_evaluation, "candidate_evaluation.pdf")
        assert "mock" in result.get("note", "").lower()
