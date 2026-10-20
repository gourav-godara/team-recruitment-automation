# ShortlistIQ: System Architecture & Engineering Ownership Record

**Project:** Team Recruitment Automation Tool (Hackathon Track 3)  
**Version:** `2.0.0` (Production Ready)  
**Architecture:** Decoupled Micro-Pipeline (React 19 Frontend + FastAPI Core Decision Engine + PostgreSQL / SQLite)  

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend["Frontend Tier (Geet)"]
        UI["React 19 + Vite GUI\n(7-Stage Interactive Pipeline)"]
        Stages["Stage 01: Schema Mapper\nStage 02: Data Quality\nStage 03: Scoring Engine\nStage 04: Ranked Results\nStage 05: Team Compare\nStage 06: Stability Stress\nStage 07: Export & Audit"]
        UI --- Stages
    end

    subgraph DataProcessing["Data Processing Tier (Ritika & Gourav)"]
        Upload["CSV / JSON Ingestion"]
        Parser["Google Forms Parser\n& Column Aliasing"]
        Adapter["Canonical Import Adapter\n(Signal Preservation)"]
        Upload --> Parser --> Adapter
    end

    subgraph CoreEngine["Core Decision & Scoring Engine (Gourav Godara)"]
        DQ["Data Quality & Nullity Audit"]
        Rules["12-Rule Eligibility Engine\n(BETWEEN, IN, ANY/ALL)"]
        Scorer["Multi-Criteria Scoring Engine\n(Standardized [0, 100] Scale)"]
        Agg["Team Aggregation\n(AVERAGE, MAX, MIN, SUM, %)"]
        WhatIf["Sensitivity & Stress Engine\n(Monte Carlo Perturbations)"]
        Compare["Pairwise Deliberation Engine\n(Head-to-Head Comparison)"]
        Enrich["GitHub Signal Enrichment\n(Rate-Limited Public Profiler)"]
        Proof["Cryptographic Proof Engine\n(SHA-256 Dataset & Config Hashes)"]
        
        Adapter --> DQ
        DQ --> Rules
        Rules --> Scorer
        Scorer --> Agg
        Agg --> WhatIf
        Agg --> Compare
        Agg --> Enrich
        Agg --> Proof
    end

    subgraph DatabaseTier["Persistence Tier (Sushmita & Gourav)"]
        DB[("PostgreSQL / SQLite\n(15 Canonical Tables & Views)")]
        Proof --> DB
    end

    subgraph Output["Output & Audit Package (Gourav Godara)"]
        Zip["1-Click Cryptographic ZIP Bundle\n• Shortlist Top-X CSV\n• Full Evaluation Audit CSV\n• Config Snapshot JSON"]
        DB --> Zip
    end

    UI <===>|REST API / HTTPS| CoreEngine
```

---

## 2. End-to-End Pipeline Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Organizer as Hackathon Organizer
    participant Frontend as Frontend GUI (Geet)
    participant Ingestion as Ingestion Engine (Ritika)
    participant Backend as Decision Engine (Gourav Godara)
    participant Database as Database Layer (Sushmita)

    Organizer->>Frontend: Upload candidate CSV (Google Forms export)
    Frontend->>Ingestion: Ingest raw bytes & infer column mappings
    Ingestion->>Backend: Pass canonical TeamData & MemberData
    Backend->>Backend: Audit signal completeness & roster size anomalies
    Backend->>Frontend: Render Data Quality Health Spectrum
    
    Organizer->>Frontend: Configure criteria weights & hard filters
    Frontend->>Backend: Dispatch POST /evaluations with ScoringConfig
    Backend->>Backend: Evaluate 12 hard eligibility gates (BETWEEN, IN, etc.)
    Backend->>Backend: Compute multi-criteria scoring & team aggregation
    Backend->>Backend: Generate deterministic ranks & SHA-256 seals
    Backend->>Database: Persist run records, score breakdowns & audit logs
    Backend->>Frontend: Return ranked leaderboard & transparent per-team reasons

    Organizer->>Frontend: Request Sensitivity Simulation or Head-to-Head Compare
    Frontend->>Backend: Query /sensitivity-preview or /compare
    Backend->>Frontend: Return volatility delta & contender matrix

    Organizer->>Frontend: Download Official Shortlist
    Frontend->>Backend: GET /export/bundle
    Backend-->>Organizer: Streams 1-Click ZIP (Shortlist + Audit + Cryptographic JSON)
```

---

## 3. Engineering Roles & Contributor Matrix

| Contributor | Domain & Focus | Key Modules Authored & Integrated |
|---|---|---|
| **Gourav Godara** | **Core Backend & Decision Engine** | • **Core Decision Engine:** Designed the multi-criteria scoring pipeline operating on a normalized `[0, 100]` scale with dynamic weight redistribution for partial data.<br>• **Team Aggregation Strategies:** Built 5 distinct mathematical aggregations (`AVERAGE`, `MAX`, `MIN`, `SUM`, `PERCENTAGE`) with team-size normalization to keep solo and 5-member teams on an equal footing.<br>• **Declarative Rule Engine:** Built 12 configurable hard gates (including `BETWEEN`, `IN`, `EXISTS`, `NOT_IN`) with deterministic three-valued logic (`PASS`, `FAIL`, `INSUFFICIENT_DATA`, `FLAGGED`).<br>• **Automated Data Quality Audit:** Created `data_quality_service.py` to audit completeness, detect solo/oversized roster anomalies, and identify broken profiles.<br>• **Sensitivity & Stress Engine:** Created `sensitivity_service.py` to simulate weight perturbations and compute bubble-zone volatility.<br>• **Pairwise Deliberation Engine:** Created `comparison_service.py` for head-to-head tie breaking.<br>• **Developer Signal Enrichment:** Built `github_service.py` with caching and suspicious activity detection (forks, empty repos).<br>• **Cryptographic Verification & Exports:** Created `export_service.py` generating SHA-256 dataset/config hashes, CSV exports, and 1-Click ZIP bundles.<br>• **API & Deployment:** Built the FastAPI REST routes, CORS middleware, `Procfile`, `render.yaml`, and the **146-test automated test suite** (0.35s execution). |
| **Ritika** | **Data Ingestion & Normalization** | • **Canonical Ingestion Schemas:** Designed canonical Pydantic data schemas (`TeamData`, `MemberData`, `ImportResult`).<br>• **Parsers & Column Aliasing:** Created Google Forms CSV/JSON parsers with fuzzy column-name mapping dictionary.<br>• **Signal Sanitization:** Built initial link validation and string normalization utilities. |
| **Sushmita** | **Database & Persistence Architecture** | • **Relational Schema Design:** Authored the 15-table PostgreSQL DDL migration scripts (`database/migrations/001_initial_schema.sql`).<br>• **Data Models:** Designed relational tables for campaigns, datasets, teams, criteria signals, runs, and audit logs.<br>• **Supabase Configuration:** Configured initial role permissions and database connection sequences. |
| **Geet** | **Frontend Engineering & UI/UX** | • **Interactive 7-Stage Pipeline GUI:** Built the complete React 19 + Vite 8 frontend application (`frontend/src/`).<br>• **Visual Component Suite:** Created the Schema Mapping table, Data Quality Spectrum, Criteria Multiplier Sliders, Ranked Results Table, Contender Deliberation Matrix, and Export Dock.<br>• **Client Integration:** Implemented state synchronization and API client bindings in `client.js`. |

---

## 4. Key Technical Highlights for Interviews (Gourav Godara)

When discussing this project in engineering interviews, you can reference this system design:

1. **Deterministic Three-Valued Logic:**
   - Separated missing data from invalid inputs (`PRESENT`, `MISSING`, `INVALID`, `FLAGGED`) so that teams with partial profile links are never crashed or unfairly penalized without organizer transparency.
2. **Team-Size Bias Mitigation:**
   - Designed 5 aggregation algorithms ensuring solo participants and large teams are evaluated fairly without hardcoded score inflation.
3. **Cryptographic State Sealing:**
   - Implemented dual SHA-256 hashes (`dataset_hash` + `config_hash`) ensuring that any shortlist can be cryptographically verified months later for compliance and anti-tampering audits.
4. **Automated Verification:**
   - Authored an end-to-end automated test suite containing 146 test cases executing in 0.35 seconds with zero external network dependencies.
