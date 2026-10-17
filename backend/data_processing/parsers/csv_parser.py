"""CSV parser supporting flattened and nested/wide formats with encoding handling."""

import csv
import io
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from parsers.base import BaseParser, ParsingError


class CSVParser(BaseParser):
    """Parses CSV files into standardized raw team structures."""

    ENCODINGS_TO_TRY = ["utf-8-sig", "utf-8", "latin-1", "cp1252"]

    def parse_file(self, file_path: Union[str, Path]) -> List[Dict[str, Any]]:
        """Read and parse CSV file with automatic encoding fallback."""
        path = Path(file_path)
        if not path.is_file():
            raise ParsingError(f"File not found: {file_path}")

        raw_bytes = path.read_bytes()
        decoded_text = None
        for enc in self.ENCODINGS_TO_TRY:
            try:
                decoded_text = raw_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if decoded_text is None:
            raise ParsingError(f"Unable to decode {file_path} using supported encodings.")

        return self.parse_string(decoded_text)

    def parse_string(self, content: str) -> List[Dict[str, Any]]:
        """Parse raw CSV string content into raw team/member records."""
        if not content.strip():
            return []

        if "\x00" in content:
            raise ParsingError("CSV content contains invalid NULL bytes.")

        delimiter = self._detect_delimiter(content)
        f = io.StringIO(content.strip())
        reader = csv.DictReader(f, delimiter=delimiter)

        if not reader.fieldnames:
            return []

        # Clean fieldnames (strip whitespace)
        cleaned_fieldnames = [fn.strip() if fn else "" for fn in reader.fieldnames]
        rows: List[Dict[str, Any]] = []

        for line_num, raw_row in enumerate(reader, start=2):
            cleaned_row = {}
            for k, v in raw_row.items():
                if k is not None:
                    cleaned_k = k.strip()
                    cleaned_v = v.strip() if isinstance(v, str) else v
                    cleaned_row[cleaned_k] = cleaned_v
            # Skip completely empty rows
            if any(cleaned_row.values()):
                cleaned_row["_source_line"] = line_num
                rows.append(cleaned_row)

        if not rows:
            return []

        # Check if wide / nested format
        if self._is_wide_format(cleaned_fieldnames):
            return self._parse_wide_rows(rows)
        else:
            return self._parse_flat_rows(rows)

    def _detect_delimiter(self, sample: str) -> str:
        """Sniff delimiter among comma, semicolon, tab, and pipe."""
        first_lines = "\n".join(sample.strip().splitlines()[:5])
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(first_lines, delimiters=[",", ";", "\t", "|"])
            return dialect.delimiter
        except Exception:
            # Fallback heuristic: count occurrences
            first_line = sample.strip().splitlines()[0]
            counts = {d: first_line.count(d) for d in [",", ";", "\t", "|"]}
            return max(counts, key=counts.get) if any(counts.values()) else ","

    def _is_wide_format(self, fieldnames: List[str]) -> bool:
        """Detect if CSV columns contain indexed member markers (e.g., member_1_*, member2_*)."""
        pattern = re.compile(r"^(?:member[_\s]?\d+|lead)[_\s]", re.IGNORECASE)
        match_count = sum(1 for fn in fieldnames if pattern.match(fn))
        return match_count >= 2

    def _parse_wide_rows(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse wide format where each row represents a team with multiple member columns."""
        teams: List[Dict[str, Any]] = []

        for row in rows:
            team_info: Dict[str, Any] = {}
            members_by_index: Dict[str, Dict[str, Any]] = {}
            unmapped_extra: Dict[str, Any] = {}

            # Pattern for member index and field
            member_pattern = re.compile(
                r"^(?P<prefix>member[_\s]?(?P<idx>\d+)|lead)[_\s]+(?P<field>.+)$",
                re.IGNORECASE,
            )

            for key, val in row.items():
                if key == "_source_line":
                    continue
                m = member_pattern.match(key)
                if m:
                    idx = m.group("idx") if m.group("idx") else "lead"
                    field = m.group("field").strip()
                    if idx not in members_by_index:
                        members_by_index[idx] = {}
                    members_by_index[idx][field] = val
                    if idx == "lead":
                        members_by_index[idx]["is_lead"] = True
                else:
                    # Check if team-level attribute or extra
                    norm_key = key.lower().replace(" ", "_")
                    if norm_key in ["team", "team_name", "teamname", "group_name"]:
                        team_info["team_name"] = val
                    elif norm_key in ["team_id", "teamid"]:
                        team_info["team_id"] = val
                    else:
                        unmapped_extra[key] = val

            # Construct member list
            members_list: List[Dict[str, Any]] = []
            for idx, m_data in sorted(
                members_by_index.items(),
                key=lambda x: (0 if x[0] == "lead" else int(x[0]) if x[0].isdigit() else 99),
            ):
                # Only add if at least one meaningful field exists (e.g. name or email)
                if any(v for k, v in m_data.items() if k != "is_lead"):
                    members_list.append(m_data)

            team_record = {
                "team_name": team_info.get("team_name", "Unnamed Team"),
                "team_id": team_info.get("team_id"),
                "members": members_list,
                "metadata": unmapped_extra,
                "_source_line": row.get("_source_line"),
            }
            teams.append(team_record)

        return teams

    def _parse_flat_rows(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse flat format where each row is a member sharing a team identifier."""
        team_id_candidates = ["team_id", "team id", "teamid", "group_id", "registration_id", "reg_id"]
        team_name_candidates = ["team_name", "team", "team name", "teamname", "group_name", "group", "squad_name"]
        team_lead_candidates = ["lead_email", "team_email", "contact_email", "leader_email"]
        all_team_fields = set(team_id_candidates + team_name_candidates + team_lead_candidates)

        teams_map: Dict[str, Dict[str, Any]] = {}

        for row in rows:
            extracted_team_id = None
            extracted_team_name = None
            extracted_lead_email = None

            for rk, rv in row.items():
                if not rv:
                    continue
                norm_k = rk.lower().strip()
                if not extracted_team_id and norm_k in team_id_candidates:
                    extracted_team_id = str(rv).strip()
                elif not extracted_team_name and norm_k in team_name_candidates:
                    extracted_team_name = str(rv).strip()
                elif not extracted_lead_email and norm_k in team_lead_candidates:
                    extracted_lead_email = str(rv).strip()

            grouping_key = (
                extracted_team_id
                or extracted_team_name
                or f"Team_Line_{row.get('_source_line', len(teams_map) + 1)}"
            )

            if grouping_key not in teams_map:
                teams_map[grouping_key] = {
                    "team_name": extracted_team_name or extracted_team_id or grouping_key,
                    "team_id": extracted_team_id,
                    "lead_email": extracted_lead_email,
                    "members": [],
                    "metadata": {},
                    "_source_line": row.get("_source_line"),
                }
            else:
                if not teams_map[grouping_key].get("team_id") and extracted_team_id:
                    teams_map[grouping_key]["team_id"] = extracted_team_id
                if not teams_map[grouping_key].get("lead_email") and extracted_lead_email:
                    teams_map[grouping_key]["lead_email"] = extracted_lead_email
                if (
                    teams_map[grouping_key].get("team_name") == grouping_key
                    and extracted_team_name
                ):
                    teams_map[grouping_key]["team_name"] = extracted_team_name

            # Filter out team keys from member row
            member_dict = {
                k: v
                for k, v in row.items()
                if k != "_source_line" and k.lower().strip() not in all_team_fields
            }
            teams_map[grouping_key]["members"].append(member_dict)

        return list(teams_map.values())
