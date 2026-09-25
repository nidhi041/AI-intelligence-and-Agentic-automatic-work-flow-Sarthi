
"""
Gap analysis service — detects unexplained employment periods from resume data.
Never labels gaps as 'unemployment'; only reports undocumented periods.
"""

from datetime import datetime
from typing import List, Tuple

from models.schemas import CandidateProfile, EmploymentGap


def parse_ym(date_str: str) -> datetime:
    """Parse YYYY-MM or YYYY date strings into datetime objects."""
    date_str = date_str.strip()
    if len(date_str) == 7:  # YYYY-MM
        return datetime.strptime(date_str, "%Y-%m")
    elif len(date_str) == 4:  # YYYY
        return datetime.strptime(date_str, "%Y")
    else:
        # Try full ISO date
        return datetime.strptime(date_str[:7], "%Y-%m")


def months_between(d1: datetime, d2: datetime) -> int:
    """Calculate the number of months between two datetimes."""
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


def detect_gaps(profile: CandidateProfile, gap_threshold_months: int = 3) -> List[EmploymentGap]:
    """
    Detect unexplained employment gaps greater than the threshold.
    Returns a list of EmploymentGap objects.

    IMPORTANT: Never infers reason for gap. Only reports undocumented periods.
    """
    if not profile.experience:
        return []

    # Parse and sort by start date
    periods: List[Tuple[datetime, datetime, str]] = []
    for exp in profile.experience:
        try:
            start = parse_ym(exp.start)
            end = parse_ym(exp.end)
            periods.append((start, end, exp.company))
        except (ValueError, AttributeError):
            continue

    if not periods:
        return []

    periods.sort(key=lambda x: x[0])

    gaps: List[EmploymentGap] = []
    for i in range(1, len(periods)):
        prev_end = periods[i - 1][1]
        curr_start = periods[i][0]

        gap_months = months_between(prev_end, curr_start)
        if gap_months > gap_threshold_months:
            gap = EmploymentGap(
                start=prev_end.strftime("%Y-%m"),
                end=curr_start.strftime("%Y-%m"),
                duration_months=gap_months,
                description=(
                    f"The resume does not explain this period "
                    f"({prev_end.strftime('%b %Y')} to {curr_start.strftime('%b %Y')}, "
                    f"approximately {gap_months} months)."
                ),
            )
            gaps.append(gap)

    return gaps


def calculate_total_experience_months(profile: CandidateProfile) -> float:
    """
    Calculate total documented experience in years from employment dates.
    Does NOT count gaps.
    """
    total_months = 0
    for exp in profile.experience:
        try:
            start = parse_ym(exp.start)
            end = parse_ym(exp.end)
            months = months_between(start, end)
            if months > 0:
                total_months += months
        except (ValueError, AttributeError):
            continue
    return round(total_months / 12, 1)
