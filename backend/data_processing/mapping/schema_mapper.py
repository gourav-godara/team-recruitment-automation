"""Schema mapping engine to convert raw heterogeneous dictionaries to canonical attributes."""

import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from mapping.alias_registry import MEMBER_ALIASES, TEAM_ALIASES
from schemas.config import ImportConfig


class SchemaMapper:
    """Resolves header variations and applies custom organizer mapping rules."""

    def __init__(self, config: Optional[ImportConfig] = None):
        self.config = config or ImportConfig()
        self._normalized_custom_mapping = {
            self._normalize_key(k): v
            for k, v in self.config.column_mapping.items()
        }
        self._reverse_member_aliases = self._build_reverse_lookup(MEMBER_ALIASES)
        self._reverse_team_aliases = self._build_reverse_lookup(TEAM_ALIASES)

    def _normalize_key(self, key: str) -> str:
        """Normalize key string for robust comparison (lowercase, strip symbols)."""
        k = key.strip().lower()
        k = re.sub(r"[\s\-\.&/]+", "_", k)
        k = re.sub(r"[^\w]", "", k)
        k = re.sub(r"_+", "_", k)
        return k.strip("_")

    def _build_reverse_lookup(self, aliases_dict: Dict[str, List[str]]) -> Dict[str, str]:
        """Build a normalized lookup table from alias -> canonical field name."""
        lookup = {}
        for canonical, aliases in aliases_dict.items():
            lookup[self._normalize_key(canonical)] = canonical
            for alias in aliases:
                lookup[self._normalize_key(alias)] = canonical
        return lookup

    def map_teams(self, raw_teams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map a list of raw team dictionaries to canonical dictionary representations."""
        mapped_teams = []
        for raw_team in raw_teams:
            mapped = self.map_single_team(raw_team)
            mapped_teams.append(mapped)
        return mapped_teams

    def map_single_team(self, raw_team: Dict[str, Any]) -> Dict[str, Any]:
        """Map a single team dictionary and its constituent members."""
        team_id = raw_team.get("team_id")
        team_name = raw_team.get("team_name")
        lead_email = raw_team.get("lead_email")
        metadata = dict(raw_team.get("metadata", {}))

        # Check unmapped keys in raw_team
        for k, v in raw_team.items():
            if k in ["team_id", "team_name", "lead_email", "members", "metadata", "_source_line"]:
                continue
            norm_k = self._normalize_key(k)
            custom_mapped = self._normalized_custom_mapping.get(norm_k)
            target_field = custom_mapped or self._reverse_team_aliases.get(norm_k)

            if target_field == "team_name" and not team_name:
                team_name = v
            elif target_field == "team_id" and not team_id:
                team_id = v
            elif target_field == "lead_email" and not lead_email:
                lead_email = v
            else:
                metadata[k] = v

        if not team_id:
            team_id = f"team_{uuid.uuid4().hex[:8]}"

        if not team_name:
            team_name = f"Team_{team_id}"

        # Map members
        raw_members = raw_team.get("members", [])
        mapped_members = [self.map_member(m, idx) for idx, m in enumerate(raw_members, start=1)]

        return {
            "id": str(team_id),
            "team_name": str(team_name),
            "lead_email": lead_email,
            "members": mapped_members,
            "metadata": metadata,
            "_source_line": raw_team.get("_source_line"),
        }

    def map_member(self, raw_member: Dict[str, Any], index: int) -> Dict[str, Any]:
        """Map an individual member dictionary to canonical attributes."""
        canonical_data: Dict[str, Any] = {
            "id": f"m_{uuid.uuid4().hex[:8]}",
            "name": "",
            "email": None,
            "is_lead": False,
            "github_url": None,
            "linkedin_url": None,
            "portfolio_url": None,
            "skills": [],
            "experience_years": None,
            "education": None,
            "extra_data": {},
            "missing_fields": [],
        }

        for raw_k, raw_v in raw_member.items():
            norm_k = self._normalize_key(raw_k)
            custom_target = self._normalized_custom_mapping.get(norm_k)
            target_field = custom_target or self._reverse_member_aliases.get(norm_k)

            if target_field in canonical_data and target_field not in ["extra_data", "missing_fields", "id"]:
                if target_field == "is_lead":
                    canonical_data["is_lead"] = self._parse_bool(raw_v)
                else:
                    canonical_data[target_field] = raw_v
            else:
                if raw_v not in (None, ""):
                    canonical_data["extra_data"][raw_k] = raw_v

        # Track missing standard fields
        standard_check = ["name", "email", "github_url", "skills", "experience_years", "education"]
        for field in standard_check:
            val = canonical_data.get(field)
            if val is None or val == "" or val == []:
                canonical_data["missing_fields"].append(field)

        return canonical_data

    def _parse_bool(self, val: Any) -> bool:
        """Parse truthy value to bool."""
        if isinstance(val, bool):
            return val
        if isinstance(val, (int, float)):
            return bool(val)
        if isinstance(val, str):
            return val.strip().lower() in ["true", "1", "yes", "y", "lead", "leader", "captain"]
        return False
