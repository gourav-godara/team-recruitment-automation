# Team Recruitment Automation Backend

A configurable, explainable, and reproducible decision-support system for hackathons and team recruitment events.

---

## 1. Architecture Overview

```text
Registration File (CSV / JSON)
        │
        ▼
   [ImportService]
        │
        ├── CSVParser / JSONParser
        ├── SchemaMapper (Aliases & Custom Column Mappings)
        ├── NormalizationService (Links, Skills, Experience)
        └── Validation (Min/Max size, duplicates, missing data)
        │
        ▼
   [ImportRepository] ──► Database (Supabase PostgreSQL / SQLite)
        │
        ▼
   [ImportAdapter] ──► Converts TeamData to Decision Engine Entities
        │
        ▼
   [Core Decision Engine]
        │
        ├── Eligibility Engine (Hard filters: ANY/ALL/PERCENTAGE)
        ├── Scoring Engine (Standardized [0, 100] scale, dynamic weight redistribution)
        ├── Explanation Engine (Grounded transparent natural-language reasons)
        ├── Ranking Engine (Deterministic secondary criterion and ID tie-breaking)
        └── Reproducibility Engine (dataset_hash, config_hash, engine_version)
        │
        ▼
   [EvaluationService] ──► Persists Runs, Scores, Ranks & Explanations
        │
        ├── [API: GET /api/v1/evaluations/{run_id}] (Zero-recalculation retrieval)
        └── [ExportService] ──► RFC 4180 CSV Export
```

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── evaluations.py      # Evaluate dataset, get saved run, export CSV
│   │   ├── exports.py          # Dedicated CSV export route
│   │   ├── imports.py          # CSV/JSON file upload & dataset retrieval
│   │   ├── scoring.py          # Standalone direct scoring API
│   │   └── ... (reserved teammate placeholders)
│   ├── core/
│   │   ├── config.py           # Application settings & environment variables
│   │   └── database.py         # SQLAlchemy engine, session management, transaction rollback
│   ├── models/
│   │   ├── entities.py         # ORM entities (Campaign, ImportDataset, Team, Member, etc.)
│   │   └── store.py            # Transactional query engine mirroring SQLAlchemy Session
│   ├── schemas/
│   │   └── scoring.py          # Decision engine Pydantic schemas (SignalValue, Config, etc.)
│   ├── services/
│   │   ├── config_service.py   # Config hashing, persistence, and versioning
│   │   ├── decision_engine.py  # evaluate_teams_pipeline
│   │   ├── eligibility_engine.py
│   │   ├── evaluation_service.py # Orchestrates evaluation execution and persistence
│   │   ├── explanation_engine.py
│   │   ├── export_service.py   # RFC 4180 CSV generation
│   │   ├── import_adapter.py   # Bridges data_processing with decision engine
│   │   ├── import_service.py   # End-to-end import orchestration & validation
│   │   ├── ranking_engine.py
│   │   ├── scoring_engine.py
│   │   └── team_aggregation.py
│   └── main.py                 # FastAPI application and route registration
├── data_processing/            # File parsers, schema mapping, and normalization
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql # Initial Supabase PostgreSQL DDL
└── tests/                      # Pytest suite covering unit and end-to-end flows
```

---

## 3. Database Schema & Supabase Integration

The database models strictly map to Sushmita's canonical 15 PostgreSQL tables:
- `campaigns`: Recruitment campaigns/events (UUID `owner_id` referencing `auth.users`)
- `datasets`: Uploaded files with validation summaries and `file_hash`
- `teams`: Candidate teams with `external_id` (e.g. "T1", "Binary Bosses"), `team_size`, and JSONB `extra_data`
- `members`: Member details, contact info, and profile URLs
- `criteria`: Standardized scoring/eligibility criteria catalog with text key PK
- `member_signals`: Individual criterion signals (`status`: `'ok'`, `'missing'`, `'fetch_failed'`, `'low_confidence'`)
- `configs`: Scoring rules and weights versioned with `config_hash`
- `runs`: Evaluation runs with `config_snapshot` JSONB, `top_x`, team counts, and `result_hash`
- `run_results`: Team ranks, final scores, outcomes (`'shortlisted'`, `'waitlisted'`, `'rejected'`, `'ineligible'`, `'excluded'`), and tie-break notes
- `run_score_details`: Per-criterion breakdown, weights, explanations, and `data_status` (`'ok'`, `'partial'`, `'missing'`)
- `run_rule_results`: Hard eligibility rule evaluation results per team
- `data_flags`: Integrity flags for missing or suspicious data
- `overrides`: Manual human reviewer overrides (`pin`, `exclude`, `waitlist`)
- `pairwise_comparisons`: Manual or assisted team comparison logs
- `audit_log`: Transactional audit records (`changed_by` referencing `auth.users`)

The canonical DDL schema is provided in:
`database/migrations/001_initial_schema.sql`

### Supabase Database Permissions & Role Setup

For the dedicated backend role (`recruitment_backend`) to interact with these tables and auto-incrementing identity sequences, run the following grants in the Supabase SQL editor:

```sql
-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO recruitment_backend;

-- Grant sequence permissions (required for GENERATED BY DEFAULT AS IDENTITY columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO recruitment_backend;

-- Ensure future tables and sequences created also inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO recruitment_backend;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO recruitment_backend;
```

---

## 4. API Endpoints

### Health
- `GET /health`: Health check (`{"status": "ok", "service": "team-recruitment-automation"}`).

### Data Import
- `POST /api/v1/imports`: Upload registration file (CSV or JSON).
  - Query params: `filename` (optional), `format_hint` (`csv`|`json`), `persist` (default: `true`).
  - Returns `import_id`, `dataset_hash`, valid/invalid team counts, and structured summary.
- `GET /api/v1/imports/{import_id}`: Retrieve imported dataset and all constructed teams.

### Evaluation & Scoring
- `POST /api/v1/evaluations`: Evaluate an imported dataset by `dataset_id` using a `ScoringConfig`.
  - Persists run, computes deterministic ranking, and returns `ScoringEvaluationResponse`.
- `GET /api/v1/evaluations/{run_id}`: Retrieve saved evaluation run without recalculating scores.
- `POST /api/v1/scoring/evaluate`: Direct in-memory evaluation endpoint (no database required).

### Export
- `GET /api/v1/evaluations/{run_id}/export`: Download evaluation results as an RFC 4180 CSV file.
- `GET /api/v1/exports/evaluations/{run_id}`: Alternate route for CSV export.

---

## 5. Running the Application

### Setup Environment
```bash
cp backend/.env.example backend/.env
```

### Start Server
```bash
.venv/bin/uvicorn backend.app.main:app --reload --port 8000
```
API Documentation is available at: `http://localhost:8000/docs`

---

## 6. Running Tests

```bash
PYTHONPATH=backend/data_processing:. .venv/bin/pytest backend/tests backend/data_processing/tests -v
```

---

## 7. Project Ownership & Engineering Team

- **Backend & Core Decision Engine:** Gourav Godara
- **Data Ingestion & Normalization:** Ritika
- **Database Architecture & Schema:** Sushmita
- **Frontend & User Interface:** Geet

For the detailed architectural specification, sequence diagrams, and granular module ownership, see:
[`docs/SYSTEM_ARCHITECTURE.md`](../docs/SYSTEM_ARCHITECTURE.md)

