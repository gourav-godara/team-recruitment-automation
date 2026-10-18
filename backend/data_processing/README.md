# Team Recruitment Automation Tool â€” Input and Data Processing Module

This module forms the foundation of the **Team Recruitment Automation Tool**. Its job is to ingest, standardize, clean, validate, and structure raw candidate registration datasets (from CSV or JSON) into canonical, validated `TeamData` and `MemberData` models ready for decision-making and scoring.

---

## 1. Module Purpose and Scope

* **Purpose**: Hackathons and competitions receive diverse registration submissions where teams provide varied headers, irregular formatting, missing links, unparsed years of experience, or invalid contact information.
* **Scope**: This module handles the complete preliminary data ingestion pipeline:
  1. **Parsing**: Reading CSV (flat and wide formats) and JSON files.
  2. **Schema Mapping**: Normalizing header names and column aliases to canonical attributes.
  3. **Normalization**: Cleaning handles, URLs, technology stacks, and numeric experience without losing raw values.
  4. **Validation**: Enforcing team size limits, required attributes, email/URL syntax, duplicate prevention, and missing-data strategies.
  5. **Orchestration**: Coordinating all stages into a unified `ImportResult`.
* **Out of Scope**: Scoring, ranking, candidate recommendations, and database persistence (handled by downstream services).

---

## 2. Pipeline Execution Flow

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                              DATA PROCESSING PIPELINE                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

 [Input: CSV / JSON File or Content String]
                    â”‚
                    â–¼
 1. PARSING (CSVParser / JSONParser)
    â€¢ Detects delimiters (comma, semicolon, tab, pipe) or parses JSON document arrays.
    â€¢ Preserves original line numbers in `_source_line` for auditability.
    â€¢ Output: Raw heterogeneous dictionaries (`List[Dict[str, Any]]`).
                    â”‚
                    â–¼
 2. SCHEMA MAPPING (SchemaMapper)
    â€¢ Matches aliases (e.g. 'student_name', 'mail', 'yoe') using canonical synonym registries.
    â€¢ Applies custom column overrides from `ImportConfig.column_mapping`.
    â€¢ Preserves unmapped columns inside `member.extra_data` or `team.metadata`.
    â€¢ Output: Canonical dictionary structures.
                    â”‚
                    â–¼
 3. NORMALIZATION (NormalizationService)
    â€¢ Standardizes GitHub handles/URLs (`@user` or `github.com/user` -> `https://github.com/user`).
    â€¢ Cleans LinkedIn and portfolio URLs.
    â€¢ Cleans and deduplicates skills into lowercase lists (`"Python, python, React.js"` -> `["python", "react"]`).
    â€¢ Parses experience strings into clean numeric floats without inventing values.
    â€¢ Preserves raw unparseable text in `extra_data` (e.g. `raw_unnormalized_github`).
    â€¢ Output: Clean canonical dictionaries.
                    â”‚
                    â–¼
 4. VALIDATION (ValidationService)
    â€¢ Enforces required fields (`required_member_fields`, `required_team_fields`).
    â€¢ Checks team size bounds (`min_team_size` <= size <= `max_team_size`).
    â€¢ Validates email syntax (RFC 5322 structure) and URL formats.
    â€¢ Flags unencrypted HTTP URLs with non-fatal warnings.
    â€¢ Applies `MissingDataStrategy` (`NEUTRAL`, `IMPUTE`, `FLAG_FOR_REVIEW`, `STRICT`).
    â€¢ Detects intra-team and cross-team duplicate emails.
    â€¢ Converts records into canonical `TeamData` and `MemberData` Pydantic models.
                    â”‚
                    â–¼
 5. STRUCTURED IMPORT RESULT (ImportResult)
    â€¢ Provides batch statistics: total records, total teams, valid count, invalid count.
    â€¢ Offers helper methods: `get_valid_teams()`, `get_invalid_teams()`, `get_teams_requiring_review()`.
```

---

## 3. Directory and File Responsibilities

```
backend/data_processing/
â”œâ”€â”€ mapping/
â”‚   â”œâ”€â”€ __init__.py               # Exports SchemaMapper
â”‚   â”œâ”€â”€ alias_registry.py         # Standard synonyms for member and team headers
â”‚   â””â”€â”€ schema_mapper.py          # Fuzzy matching & column resolution
â”œâ”€â”€ normalization/
â”‚   â”œâ”€â”€ __init__.py               # Exports normalizer classes and NormalizationService
â”‚   â”œâ”€â”€ experience_normalizer.py  # Conservative float extraction from experience strings
â”‚   â”œâ”€â”€ link_normalizer.py        # GitHub, LinkedIn, and portfolio link cleaning
â”‚   â”œâ”€â”€ normalization_service.py  # Service coordinating all normalization steps
â”‚   â””â”€â”€ skill_normalizer.py       # Delimiter splitting, synonym alias mapping, deduping
â”œâ”€â”€ parsers/
â”‚   â”œâ”€â”€ __init__.py               # Exports CSVParser, JSONParser, ParsingError
â”‚   â”œâ”€â”€ base.py                   # Abstract BaseParser class and ParsingError definition
â”‚   â”œâ”€â”€ csv_parser.py             # Delimiter sniffing, encoding fallback, flat/wide formats
â”‚   â””â”€â”€ json_parser.py            # Array and wrapped dictionary JSON parser
â”œâ”€â”€ pipeline/
â”‚   â”œâ”€â”€ __init__.py               # Exports PipelineOrchestrator and ImportPipeline alias
â”‚   â””â”€â”€ orchestrator.py           # Unified pipeline runner and stage error handler
â”œâ”€â”€ schemas/
â”‚   â”œâ”€â”€ __init__.py               # Exports all canonical Pydantic models
â”‚   â”œâ”€â”€ config.py                 # ImportConfig and MissingDataStrategy enum
â”‚   â”œâ”€â”€ import_result.py          # ImportResult model and query helpers
â”‚   â”œâ”€â”€ member.py                 # MemberData canonical schema
â”‚   â””â”€â”€ team.py                   # TeamData canonical schema with auto-sync team_size
â””â”€â”€ tests/
    â”œâ”€â”€ test_normalization.py     # Unit tests for link, skill, and experience normalizers
    â”œâ”€â”€ test_parsers.py           # Unit tests for CSV and JSON format parsing
    â”œâ”€â”€ test_pipeline.py          # Integration tests for full pipeline execution
    â”œâ”€â”€ test_schema_mapper.py     # Unit tests for alias registry and custom mapping
    â”œâ”€â”€ test_schemas.py           # Schema defaults, validation states, and helper methods
    â””â”€â”€ test_validation.py        # Syntax validators, size boundaries, duplicate detection
```

---

## 4. Dependencies and Setup

### Requirements
* **Python**: 3.12+ (tested and verified with Python 3.14.3)
* **Libraries**: `pydantic` (v2.x)

No heavy external dependencies are required. All parsers, validators, normalizers, and the test suite rely on standard Python modules (`csv`, `json`, `re`, `pathlib`, `typing`, `collections`, `unittest`, `urllib.parse`, `uuid`, `enum`).

---

## 5. Running the Test Suite

Run the complete test suite from the repository root:

```powershell
C:\Users\HP\AppData\Local\Python\bin\python.exe -m unittest discover tests -v
```

All 81 tests execute in ~0.03 seconds with 0 failures:
* 14 tests in `test_normalization.py`
* 7 tests in `test_parsers.py`
* 4 tests in `test_schema_mapper.py`
* 5 tests in `test_schemas.py`
* 33 tests in `test_validation.py`
* 18 tests in `test_pipeline.py`

---

## 6. Calling the Pipeline from Python

### 6.1 Basic Usage

```python
from pipeline import PipelineOrchestrator

# Initialize the pipeline with default configuration
orchestrator = PipelineOrchestrator()

# Process an input file (.csv or .json)
result = orchestrator.process_file("registrations.csv")

print(f"Status: {result.summary['pipeline_status']}")
print(f"Total Teams: {result.total_teams}")
print(f"Valid Teams: {result.valid_teams_count}")
print(f"Invalid Teams: {result.invalid_teams_count}")

# Iterate through validated teams
for team in result.get_valid_teams():
    print(f"Team: {team.team_name} (Size: {team.team_size})")
    for member in team.members:
        print(f"  - {member.name} <{member.email}> | Skills: {member.skills}")
```

### 6.2 Custom Configuration & Imputation

```python
from schemas import ImportConfig, MissingDataStrategy
from pipeline import ImportPipeline

# Configure organizer rules
config = ImportConfig(
    min_team_size=2,
    max_team_size=4,
    required_member_fields=["name", "email"],
    missing_data_strategy=MissingDataStrategy.IMPUTE,
    impute_defaults={
        "experience_years": 0.0,
        "education": "Not specified",
        "skills": [],
    },
    column_mapping={
        "candidate": "name",
        "contact_mail": "email",
    },
    allow_cross_team_duplicates=False,
    validate_urls=True,
    validate_emails=True,
)

pipeline = ImportPipeline(config=config)
result = pipeline.process_file("hackathon_data.csv")
```

### 6.3 In-Memory String Processing (Web APIs / Testing)

```python
csv_string = """team_name,name,email,github,yoe
CyberKnights,Alice Smith,alice@example.com,https://github.com/alice,2.5
CyberKnights,Bob Jones,bob@example.com,https://github.com/bob,1.0
"""

result = pipeline.process_string(csv_string, file_format="csv")
```

---

## 7. Example Inputs and Outputs

### 7.1 Example CSV Input (`registrations.csv`)

```csv
team_name,full_name,email,github,yoe,skills
CodeWarriors,Alice Smith,alice@example.com,github.com/alice,3.5,Python; FastAPI
CodeWarriors,Bob Jones,bob@example.com,https://github.com/bob,2.0,React; TypeScript
SoloSquad,Charlie Day,not-an-email,https://github.com/charlie,1.0,Docker
```

### 7.2 Example Output Structure (`result.to_dict()`)

```json
{
  "total_records": 3,
  "total_teams": 2,
  "valid_teams_count": 1,
  "invalid_teams_count": 1,
  "teams": [
    {
      "id": "team_a1b2c3d4",
      "team_name": "CodeWarriors",
      "team_size": 2,
      "lead_email": null,
      "is_valid": true,
      "requires_review": false,
      "validation_errors": [],
      "validation_warnings": [],
      "members": [
        {
          "id": "m_11223344",
          "name": "Alice Smith",
          "email": "alice@example.com",
          "is_lead": false,
          "github_url": "https://github.com/alice",
          "github_username": "alice",
          "linkedin_url": null,
          "portfolio_url": null,
          "skills": ["python", "fastapi"],
          "experience_years": 3.5,
          "education": null,
          "is_valid": true,
          "validation_errors": [],
          "validation_warnings": []
        },
        {
          "id": "m_55667788",
          "name": "Bob Jones",
          "email": "bob@example.com",
          "is_lead": false,
          "github_url": "https://github.com/bob",
          "github_username": "bob",
          "skills": ["react", "typescript"],
          "experience_years": 2.0,
          "is_valid": true,
          "validation_errors": [],
          "validation_warnings": []
        }
      ]
    },
    {
      "id": "team_e5f6g7h8",
      "team_name": "SoloSquad",
      "team_size": 1,
      "is_valid": false,
      "requires_review": false,
      "validation_errors": [
        "Member 'Charlie Day' failed validation: Invalid email format: 'not-an-email'"
      ],
      "validation_warnings": [],
      "members": [
        {
          "id": "m_99aabbcc",
          "name": "Charlie Day",
          "email": "not-an-email",
          "is_valid": false,
          "validation_errors": ["Invalid email format: 'not-an-email'"],
          "validation_warnings": []
        }
      ]
    }
  ],
  "global_errors": [],
  "global_warnings": [],
  "summary": {
    "total_teams": 2,
    "valid_teams": 1,
    "invalid_teams": 1,
    "total_members": 3,
    "valid_members": 2,
    "invalid_members": 1,
    "teams_requiring_review": 0,
    "pipeline_status": "SUCCESS",
    "last_completed_stage": "Validation",
    "has_validation_errors": true,
    "has_global_errors": false
  }
}
```

---

## 8. Missing-Data Strategies & Validation Behavior

The system follows the core project philosophy: **The engine never guesses unless instructed.**

| Strategy | Missing Optional Field Behavior | Years of Experience = None | Candidate entered `0.0` | Team Review Status | Record Validity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NEUTRAL` (Default) | Kept as `None` | Preserved as `None` | Preserved as `0.0` | Not flagged | `is_valid = True` |
| `IMPUTE` | Replaced by `impute_defaults` | Imputed to `0.0` | Preserved as `0.0` | Warning logged | `is_valid = True` |
| `FLAG_FOR_REVIEW` | Kept as `None` | Preserved as `None` | Preserved as `0.0` | `requires_review = True` | `is_valid = True` |
| `STRICT` | Rejected as an error | Rejected as error | Preserved as `0.0` | Not applicable | `is_valid = False` |

---

## 9. Current Limitations & Known Issues

1. **Text-based Formats Only**: Currently supports `.csv` (comma, semicolon, tab, pipe separated) and `.json`. Binary spreadsheet formats (`.xlsx`) or PDF/Word resumes are not supported in this module and should be converted prior to ingestion.
2. **Network Validation Intentionally Offline**: URL and email validation perform RFC syntax checking and domain structure validation. Live network HTTP probing/pinging is deliberately excluded to maintain fast, offline, and reliable processing.
3. **Downstream Handoff**: Constructing higher-level candidate feature vectors, scoring criteria, and ranking matrices belongs to the subsequent Core Decision Engine stage.
