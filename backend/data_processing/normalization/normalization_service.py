"""Normalization service coordinating link, skill, and experience normalizers."""

import re
from typing import Any, Dict, List

from normalization.experience_normalizer import ExperienceNormalizer
from normalization.gender_detector import detect_gender_from_name, normalize_gender
from normalization.link_normalizer import LinkNormalizer
from normalization.skill_normalizer import SkillNormalizer


class NormalizationService:
    """Standardizes parsed registration records without mixing in validation or imputation."""

    def __init__(self):
        self.link_normalizer = LinkNormalizer()
        self.skill_normalizer = SkillNormalizer()
        self.exp_normalizer = ExperienceNormalizer()

    def _clean_text(self, text: Any) -> Any:
        """Strip and collapse whitespace in string attributes."""
        if isinstance(text, str):
            cleaned = re.sub(r"\s+", " ", text).strip()
            return cleaned if cleaned else None
        return text

    def normalize_member(self, member_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize an individual member dictionary.

        Transforms raw values into clean, canonical representations while preserving
        unparseable raw data in extra_data so original information is never lost.
        """
        normalized = dict(member_dict)
        extra_data = dict(normalized.get("extra_data", {}))

        # 1. Clean basic text fields
        name = self._clean_text(normalized.get("name"))
        normalized["name"] = name if name else ""

        email = self._clean_text(normalized.get("email"))
        normalized["email"] = email.lower() if email else None

        education = self._clean_text(normalized.get("education"))
        normalized["education"] = education

        # 2. Normalize GitHub
        raw_github = normalized.get("github_url")
        norm_gh_url, norm_gh_user = self.link_normalizer.normalize_github(raw_github)
        normalized["github_url"] = norm_gh_url
        normalized["github_username"] = norm_gh_user
        if raw_github and not norm_gh_user and norm_gh_url == raw_github:
            # Preserve unparseable raw string in extra_data for inspection
            extra_data["raw_unnormalized_github"] = str(raw_github)

        # 3. Normalize LinkedIn
        raw_linkedin = normalized.get("linkedin_url")
        norm_linkedin = self.link_normalizer.normalize_linkedin(raw_linkedin)
        normalized["linkedin_url"] = norm_linkedin
        if raw_linkedin and norm_linkedin == raw_linkedin and not str(raw_linkedin).lower().startswith("http"):
            extra_data["raw_unnormalized_linkedin"] = str(raw_linkedin)

        # 4. Normalize Portfolio
        raw_portfolio = normalized.get("portfolio_url")
        norm_portfolio = self.link_normalizer.normalize_portfolio(raw_portfolio)
        normalized["portfolio_url"] = norm_portfolio

        # 5. Normalize Skills (ensures List[str])
        raw_skills = normalized.get("skills")
        norm_skills = self.skill_normalizer.normalize_skills(raw_skills)
        normalized["skills"] = norm_skills
        if raw_skills and not norm_skills and isinstance(raw_skills, str) and raw_skills.strip():
            extra_data["raw_skills_unparsed"] = str(raw_skills)

        # 6. Normalize Experience (ensures Optional[float])
        raw_exp = normalized.get("experience_years")
        norm_exp = self.exp_normalizer.normalize_experience(raw_exp)
        normalized["experience_years"] = norm_exp
        if raw_exp is not None and norm_exp is None and str(raw_exp).strip():
            # Keep original raw text for review (e.g. "student", "freshman", "three years")
            extra_data["raw_experience_unparsed"] = str(raw_exp).strip()

        # 7. Normalize Gender (and fallback to high-precision name detection if missing)
        raw_gender = normalized.get("gender") or normalized.get("declared_gender")
        if not raw_gender:
            for k, v in extra_data.items():
                if k.lower().strip() in ("gender", "declared_gender", "sex", "gender_identity"):
                    raw_gender = v
                    break
        norm_gender = normalize_gender(raw_gender)
        if not norm_gender and normalized.get("name"):
            norm_gender = detect_gender_from_name(normalized["name"])
        if norm_gender:
            normalized["gender"] = norm_gender
            normalized["declared_gender"] = norm_gender
            extra_data["gender"] = norm_gender
            extra_data["declared_gender"] = norm_gender

        normalized["extra_data"] = extra_data
        return normalized

    def normalize_team(self, team_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a team dictionary and its constituent members."""
        normalized = dict(team_dict)

        team_name = self._clean_text(normalized.get("team_name"))
        normalized["team_name"] = team_name if team_name else "Unnamed Team"

        lead_email = self._clean_text(normalized.get("lead_email"))
        normalized["lead_email"] = lead_email.lower() if lead_email else None

        raw_members = normalized.get("members", [])
        normalized["members"] = [self.normalize_member(m) for m in raw_members]

        return normalized

    def normalize_teams(self, team_dicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize a collection of team dictionaries."""
        return [self.normalize_team(t) for t in team_dicts]
