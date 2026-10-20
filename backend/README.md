# Team Recruitment Automation Backend

A configurable, explainable, and reproducible decision-support system for hackathons and team recruitment events.

---

## 1. Product Direction & No-Login User Journey

The backend is refactored into a **public, anonymous, no-login application**. Visitors do not need to register, log in, configure Google OAuth, or create user profiles.

### Primary User Journey
1. **Open the Website:** Instant access to public dashboard and upload area.
2. **Upload Registrations:** Upload candidate registration data in CSV or JSON format (`POST /api/v1/imports`).
3. **Inspect & Validate:** Real-time schema normalization, completeness inspection, and data quality reporting (`GET /api/v1/imports/{id}/quality-report`).
4. **Configure Criteria & Rules:** Select or fine-tune weights and mandatory eligibility rules (`GET /api/v1/rules/catalog`).
5. **Execute Decision Engine:** Run the deterministic scoring and shortlisting engine (`POST /api/v1/evaluations`).
6. **Inspect Outcomes:** Review ranked teams, grounded explanations, score breakdowns, and leaderboard (`GET /api/v1/evaluations/{run_id}`).
7. **Download Audit Artifacts:** 1-click download of official RFC 4180 Shortlist CSV, full audit CSV, or complete audit package (.ZIP) (`GET /api/v1/evaluations/{run_id}/export`).
8. **Anonymous Session Continuity:** Revisit and retrieve previous uploads and evaluation runs from the same browser session without logging in (`GET /api/v1/session/history`).

---

## 2. Anonymous Session Architecture

Session continuity and multi-user data isolation are provided without user accounts:

* **Session Token Generation:** High-entropy, cryptographically random identifiers (`secrets.token_urlsafe(32)`).
* **Dual Header & Cookie Transport:**
  * Browser navigation: Sent via `recruitment_session_id` `HttpOnly; SameSite=Lax; Path=/` cookie (`Secure` in production).
  * API / CLI / Headless clients: Sent via `X-Session-ID` request/response HTTP header.
* **Cryptographic Data Isolation:**
  * Datasets and evaluation runs are bound to the creating `session_id`.
  * Possessing an ordinary incremental integer database ID is **insufficient** to view another user's records. Querying a dataset or run from another session returns `404 Not Found`.
  * Public preset datasets (`session_id IS NULL`) remain accessible to all sessions.
* **Session Lifecycle Endpoints:**
  * `GET /api/v1/session`: Inspect active session status and artifact counts.
  * `GET /api/v1/session/history`: Retrieve all datasets and evaluation runs created within the current session.
  * `POST /api/v1/session/reset`: Reset session and start fresh with a new anonymous identifier.

---

## 3. Public Endpoint Protection & Data Safeguards

* **File Size Limits:** Upload payloads are validated before ingestion with a configurable limit (`MAX_UPLOAD_SIZE_BYTES=10485760`, 10MB). Exceeding files return `413 Content Too Large`.
* **Path-Traversal Prevention:** Uploaded filenames are sanitized (`os.path.basename` and regex stripping) to prevent directory traversal and header injection.
* **Safe Database Access:** Parameterized queries via SQLAlchemy and `PortableJSON` serialization prevent SQL injection and SQLite binding incompatibilities.
* **Credential Isolation:** Database connection strings, service-role keys, and secret tokens remain strictly server-side.

---

## 4. Database Migrations

Sushmita's canonical PostgreSQL schema is extended with additive, reversible migrations:

* `001_initial_schema.sql`: Core 15 PostgreSQL tables (`campaigns`, `datasets`, `teams`, `members`, `criteria`, `runs`, `run_results`, etc.).
* `002_harden_relationships_and_triggers.sql`: Cascading foreign keys, unique constraints, and `v_leaderboard` view.
* `003_add_rule_outcome_status.sql`: 4-valued deterministic rule outcomes (`PASS`, `FAIL`, `UNKNOWN`, `ERROR`).
* `004_supabase_rls_policies.sql`: Multi-tenant Row-Level Security policies.
* `005_anonymous_sessions_and_nullable_auth.sql`: **(New)** Drops mandatory `owner_id` constraint on `campaigns`, adds `session_id` indexing across `campaigns`, `datasets`, `runs`, `overrides`, and `audit_log`, and adds `actor_type` defaulting to `'anonymous'`.

### Applying Migration 005 (Supabase SQL Editor)
```sql
ALTER TABLE public.campaigns ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.overrides ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.pairwise_comparisons ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS actor_type VARCHAR(32) NOT NULL DEFAULT 'anonymous';

CREATE INDEX IF NOT EXISTS idx_campaigns_session_id ON public.campaigns(session_id);
CREATE INDEX IF NOT EXISTS idx_datasets_session_id ON public.datasets(session_id);
CREATE INDEX IF NOT EXISTS idx_runs_session_id ON public.runs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON public.audit_log(session_id);
```

---

## 5. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Application health check |
| `GET` | `/api/v1/session` | Inspect active anonymous session |
| `GET` | `/api/v1/session/history` | Retrieve current session's datasets and runs |
| `POST` | `/api/v1/session/reset` | Clear session and issue a fresh identifier |
| `POST` | `/api/v1/imports` | Upload candidate CSV/JSON registration file |
| `GET` | `/api/v1/imports/{id}` | Retrieve imported dataset and teams (session-isolated) |
| `GET` | `/api/v1/imports/{id}/quality-report` | Data quality, completeness, and nullity report |
| `GET` | `/api/v1/rules/catalog` | Catalog of available scoring and eligibility rule types |
| `POST` | `/api/v1/evaluations` | Execute Decision Engine and persist evaluation run |
| `GET` | `/api/v1/evaluations/{run_id}` | Retrieve saved run, team rankings, and explanations |
| `GET` | `/api/v1/evaluations/{run_id}/leaderboard` | Real-time leaderboard view |
| `GET` | `/api/v1/evaluations/{run_id}/export` | Export full evaluation audit as RFC 4180 CSV |
| `GET` | `/api/v1/evaluations/{run_id}/export/shortlist` | Download official Top-X Shortlist CSV |
| `GET` | `/api/v1/evaluations/{run_id}/export/bundle` | 1-Click download of complete audit package (.ZIP) |
| `POST` | `/api/v1/scoring/evaluate` | Stateless direct scoring evaluation |

---

## 6. Running and Testing Locally

### Start Local Server
```bash
./.venv/bin/uvicorn backend.app.main:app --reload --port 8000
```
Interactive OpenAPI documentation: `http://localhost:8000/docs`

### Run Complete Test Suite
```bash
./.venv/bin/pytest backend
```
*(All 205 unit, schema, decision engine, and anonymous flow tests pass in ~0.5s)*

---

## 7. Project Ownership & Engineering Team

- **Backend & Core Decision Engine:** Gourav Godara
- **Data Ingestion & Normalization:** Ritika
- **Database Architecture & Schema:** Sushmita
- **Frontend & User Interface:** Geet
