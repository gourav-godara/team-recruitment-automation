"""JSON parser supporting multiple document structures."""

import json
from pathlib import Path
from typing import Any, Dict, List, Union

from parsers.base import BaseParser, ParsingError


class JSONParser(BaseParser):
    """Parses JSON files or strings into standardized raw team structures."""

    def parse_file(self, file_path: Union[str, Path]) -> List[Dict[str, Any]]:
        """Read and parse a JSON file."""
        path = Path(file_path)
        if not path.is_file():
            raise ParsingError(f"File not found: {file_path}")

        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            content = path.read_text(encoding="latin-1")

        return self.parse_string(content)

    def parse_string(self, content: str) -> List[Dict[str, Any]]:
        """Parse raw JSON string into standardized raw team structures."""
        if not content.strip():
            return []

        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ParsingError(f"Invalid JSON syntax at line {e.lineno}, column {e.colno}: {e.msg}", line_number=e.lineno)

        if isinstance(data, dict):
            # Check for wrapped arrays
            for key in ["teams", "data", "registrations", "participants", "submissions"]:
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break
            else:
                # Single team object
                data = [data]

        if not isinstance(data, list):
            raise ParsingError("Expected a JSON array of teams or a dictionary with a teams list.")

        # Check if list of teams or list of flat members
        return self._normalize_json_records(data)

    def _normalize_json_records(self, items: List[Any]) -> List[Dict[str, Any]]:
        """Convert arbitrary JSON lists into list of team dicts with 'members' list."""
        teams: List[Dict[str, Any]] = []
        flat_records: List[Dict[str, Any]] = []

        for item in items:
            if not isinstance(item, dict):
                continue

            # Check if this object represents a team with an explicit 'members' list
            if "members" in item and isinstance(item["members"], list):
                team_record = {
                    "team_name": item.get("team_name") or item.get("name") or "Unnamed Team",
                    "team_id": item.get("team_id") or item.get("id"),
                    "members": item["members"],
                    "metadata": {k: v for k, v in item.items() if k not in ["members", "team_name", "team_id"]},
                }
                teams.append(team_record)
            else:
                flat_records.append(item)

        if flat_records:
            # Group flat records by team name or id
            teams_map: Dict[str, Dict[str, Any]] = {}
            for idx, rec in enumerate(flat_records):
                team_key = (
                    rec.get("team_name")
                    or rec.get("team")
                    or rec.get("team_id")
                    or f"Team_{idx + 1}"
                )
                team_key = str(team_key)
                if team_key not in teams_map:
                    teams_map[team_key] = {
                        "team_name": team_key,
                        "team_id": team_key,
                        "members": [],
                        "metadata": {},
                    }
                member_dict = {
                    k: v
                    for k, v in rec.items()
                    if k not in ["team_name", "team", "team_id"]
                }
                teams_map[team_key]["members"].append(member_dict)

            teams.extend(teams_map.values())

        return teams
