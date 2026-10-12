"""Experience years normalization engine."""

import re
from typing import Any, Optional

# Words that indicate student/beginner status or absence of data;
# per requirements, NEVER infer numerical experience from these.
NON_NUMERIC_STATUS_WORDS = {
    "", "none", "n/a", "na", "null", "-", "--", "nil", "no",
    "student", "freshman", "sophomore", "junior", "senior",
    "fresher", "beginner", "entry", "intern", "undergraduate", "graduate"
}


class ExperienceNormalizer:
    """Parses experience representations into floating point years or returns None."""

    # Patterns matching: "3", "3.0", "3+", "+3", "3 years", "2.5 yrs", "3+ years"
    YEARS_PATTERN = re.compile(
        r"^\+?(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?|yr|y)?\+?$",
        re.IGNORECASE,
    )

    # Patterns matching: "6 months", "18 mos"
    MONTHS_PATTERN = re.compile(
        r"^\+?(\d+(?:\.\d+)?)\+?\s*(?:months?|mos?|mo)\+?$",
        re.IGNORECASE,
    )

    @classmethod
    def normalize_experience(cls, raw: Any) -> Optional[float]:
        """Convert raw experience value to float years.

        Returns:
            Float representing years if parseable.
            None if absent, unparseable, or descriptive text like "student".
        """
        if raw is None:
            return None

        if isinstance(raw, (int, float)):
            val = float(raw)
            return round(val, 2) if val >= 0 else None

        s = str(raw).strip().lower()
        if not s or s in NON_NUMERIC_STATUS_WORDS:
            return None

        # Check if contains explicitly forbidden inference words
        for word in ["student", "freshman", "fresher", "beginner", "undergraduate"]:
            if word in s:
                return None

        # Check months pattern first to convert to fraction of a year
        months_match = cls.MONTHS_PATTERN.match(s)
        if months_match:
            try:
                months_val = float(months_match.group(1))
                if months_val >= 0:
                    return round(months_val / 12.0, 2)
            except ValueError:
                return None

        # Check years pattern
        years_match = cls.YEARS_PATTERN.match(s)
        if years_match:
            try:
                years_val = float(years_match.group(1))
                if years_val >= 0:
                    return round(years_val, 2)
            except ValueError:
                return None

        # Unparseable (e.g. "three years", "moderate", "lots of experience")
        return None
