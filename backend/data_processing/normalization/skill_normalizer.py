"""Skill normalization and deduplication engine."""

import re
from typing import Any, List

# Common skill synonyms to canonicalize
SKILL_SYNONYMS = {
    "react.js": "react",
    "reactjs": "react",
    "react native": "react-native",
    "node.js": "nodejs",
    "node": "nodejs",
    "vue.js": "vue",
    "vuejs": "vue",
    "next.js": "nextjs",
    "nextjs": "nextjs",
    "golang": "go",
    "k8s": "kubernetes",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "py": "python",
    "python3": "python",
    "js": "javascript",
    "ts": "typescript",
    "docker": "docker",
}

NEGATIVE_SKILL_TOKENS = {
    "", "none", "n/a", "na", "null", "-", "--", "nil", "no", "no skills", "fresher", "student"
}


class SkillNormalizer:
    """Splits, standardizes, canonicalizes, and deduplicates skills."""

    DELIMITER_REGEX = re.compile(r"[,;/\n\|]+")

    @classmethod
    def normalize_skills(cls, raw: Any) -> List[str]:
        """Normalize raw skill input into a unique, canonical list of skill strings.

        Args:
            raw: Raw string (e.g. "Python, React.js; Node"), list of strings, or None.

        Returns:
            List of normalized, deduplicated lowercase skills.
        """
        if raw is None:
            return []

        tokens: List[str] = []

        if isinstance(raw, list):
            for item in raw:
                if item:
                    item_str = str(item).strip()
                    if item_str.lower() in NEGATIVE_SKILL_TOKENS:
                        continue
                    item_str = re.sub(r"\b(?:n/a|na|nil|none)\b", " ", item_str, flags=re.IGNORECASE)
                    parts = cls.DELIMITER_REGEX.split(item_str)
                    tokens.extend(parts)
        elif isinstance(raw, (str, bytes)):
            raw_str = raw.decode("utf-8", errors="ignore") if isinstance(raw, bytes) else str(raw)
            raw_str = raw_str.strip()
            if raw_str.lower() in NEGATIVE_SKILL_TOKENS:
                return []
            raw_str = re.sub(r"\b(?:n/a|na|nil|none)\b", " ", raw_str, flags=re.IGNORECASE)
            parts = cls.DELIMITER_REGEX.split(raw_str)
            tokens.extend(parts)
        else:
            val_str = str(raw).strip()
            if val_str and val_str.lower() not in NEGATIVE_SKILL_TOKENS:
                tokens.append(val_str)

        deduped: List[str] = []
        seen = set()

        for token in tokens:
            cleaned = token.strip().lower()
            if not cleaned or cleaned in NEGATIVE_SKILL_TOKENS:
                continue

            # Map known synonyms
            canonical = SKILL_SYNONYMS.get(cleaned, cleaned)

            if canonical not in seen:
                seen.add(canonical)
                deduped.append(canonical)

        return deduped
