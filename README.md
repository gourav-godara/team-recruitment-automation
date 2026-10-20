# ShortlistIQ: Team Recruitment Automation Tool

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.142.2-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Test Suite](https://img.shields.io/badge/tests-146%20passed-brightgreen.svg)]()

> A tunable, explainable, and mathematically reproducible recruitment decision-support system built for hackathon organizers to evaluate and shortlist teams from large registration pools.

---

## 🌟 Highlights

- **Multi-Criteria Scoring Engine:** Normalizes heterogeneous candidate signals (GitHub activity, experience years, skill tags, presentation) onto a standardized `[0.0, 100.0]` scale.
- **5 Team Aggregation Strategies:** Fair team-level evaluation (`AVERAGE`, `MAX`, `MIN`, `SUM`, `PERCENTAGE`) preventing solo vs. large-team evaluation bias.
- **12 Configurable Hard Filters:** Hard eligibility gates including `TEAM_SIZE_BETWEEN`, `REQUIRED_SKILL`, `COUNT_AT_LEAST`, and `DATA_COMPLETENESS_AT_LEAST`.
- **Three-Valued Deterministic Logic:** Explicit separation between `PRESENT`, `MISSING`, `INVALID`, and `FLAGGED` data — partial data never crashes the tool or results in silent zero penalties.
- **Cryptographic Audit Proofs:** Dual SHA-256 state sealing (`dataset_hash` & `config_hash`) guaranteeing 100% reproducibility.
- **1-Click Audit Package:** Export Top-X Shortlist CSV, Full Evaluation Audit CSV, and Configuration Snapshot JSON bundled into a single `.zip` file.
- **Interactive 7-Stage Frontend:** Built with React 19 + TailwindCSS, covering ingestion, quality diagnosis, scoring controls, ranked consensus, contender deliberation, sensitivity stress testing, and audit export.

---

## 🏗️ Architecture & Engineering Team

```text
User / Judge Browser (React 19 GUI)
       │
       ▼  REST API (HTTP / JSON)
FastAPI Backend Core
       │
       ├── Ingestion & Schema Mapper (Ritika)
       ├── Core Decision & Scoring Engine (Gourav Godara)
       ├── Database Persistence & Models (Sushmita)
       └── Visual Pipeline Interface (Geet)
```

### Contributor Matrix

| Contributor | Domain & Focus | Modules Owned |
|---|---|---|
| **Gourav Godara** | **Core Backend & Decision Engine** | Core Decision Engine, 5 Aggregation Algorithms, 12 Eligibility Rules, Data Quality Service, Sensitivity Stress Testing, Pairwise Comparison, GitHub Signal Enrichment, Export Package, and Test Suite (146 tests). |
| **Ritika** | **Data Ingestion & Normalization** | Canonical schemas (`TeamData`, `MemberData`, `ImportResult`), CSV/JSON parsers, and column aliasing dictionary. |
| **Sushmita** | **Database & Persistence Architecture** | PostgreSQL DDL migrations (15 tables), relational schema design, and Supabase integration. |
| **Geet** | **Frontend Engineering & UI/UX** | React 19 + Vite 8 frontend interface, 7-stage interactive pipeline, and state synchronization. |

For the complete architectural specification, sequence diagrams, and detailed module ownership, see:  
📖 **[`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md)**

---

## 🚀 Quick Start

### 1. Run the Backend (FastAPI on Port 8000)

```bash
# From repository root
PYTHONPATH=backend/data_processing:backend backend/.venv/bin/python -m uvicorn backend.app.main:app --reload --port 8000
```
Interactive OpenAPI Swagger docs: `http://localhost:8000/docs`

### 2. Run the Frontend (Vite on Port 5173)

```bash
cd frontend
npm install
npm run dev
```
Open in browser: `http://localhost:5173`

### 3. Run the Automated Test Suite

```bash
./.venv/bin/pytest
```
*All 146 unit, integration, and end-to-end tests pass in ~0.35s.*

---

## 📦 Cloud Deployment

- **Backend (Render):** Deploy as a Web Service using the included [`render.yaml`](render.yaml) or [`Procfile`](Procfile).
- **Frontend (Vercel):** Connect GitHub repo, set root directory to `frontend`, and configure `VITE_API_BASE_URL` to point to your live Render backend URL.
