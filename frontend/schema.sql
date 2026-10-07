-- Team Recruitment Automation Tool: database schema (SQLite)
-- Design ideas:
--   1. Raw data, extracted signals, and run results are kept in separate tables.
--   2. Missing data is stored explicitly (status = 'missing'), never as a silent 0.
--   3. Every run saves a full copy of its config, so results are reproducible.
--   4. Every score and rule result is stored per team, so every result can be explained.

PRAGMA foreign_keys = ON;

-- ============================================================
-- PART 1: INPUT DATA
-- ============================================================

-- One row per uploaded file (CSV or JSON)
CREATE TABLE datasets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    source_format TEXT NOT NULL CHECK (source_format IN ('csv', 'json')),
    file_hash     TEXT,                 -- detects the same file uploaded twice
    column_mapping TEXT,                -- JSON: which CSV column means what
    total_teams   INTEGER DEFAULT 0,
    uploaded_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id    INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    external_id   TEXT,                 -- ID from the original form, if any
    team_name     TEXT NOT NULL,
    team_size     INTEGER NOT NULL,     -- computed from members, 1..many
    extra_data    TEXT,                 -- JSON: any other columns from the file
    UNIQUE (dataset_id, external_id)
);

-- Members: every link is optional (NULL = not provided)
CREATE TABLE members (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id         INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    full_name       TEXT,
    email           TEXT,
    resume_url      TEXT,
    github_url      TEXT,
    linkedin_url    TEXT,
    portfolio_url   TEXT,
    resume_text     TEXT                -- optional: pasted/parsed resume text
);

-- ============================================================
-- PART 2: EXTRACTED SIGNALS (what we learned from each source)
-- ============================================================

-- Registry of criteria. Adding a new criterion = adding a row + one extractor.
CREATE TABLE criteria (
    key          TEXT PRIMARY KEY,      -- e.g. 'github_contributions_1y'
    label        TEXT NOT NULL,         -- shown in the UI
    source       TEXT NOT NULL CHECK (source IN ('github', 'resume', 'linkedin', 'portfolio', 'form')),
    value_type   TEXT NOT NULL CHECK (value_type IN ('number', 'boolean', 'text')),
    description  TEXT
);

-- One row per member per criterion
CREATE TABLE member_signals (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id        INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    criterion_key    TEXT NOT NULL REFERENCES criteria(key),
    value_num        REAL,
    value_text       TEXT,
    status           TEXT NOT NULL CHECK (status IN ('ok', 'missing', 'fetch_failed', 'low_confidence')),
    confidence       REAL,              -- 0..1, used for AI/parsed values
    evidence         TEXT,              -- where the value came from (URL, text snippet)
    extractor_version TEXT,
    fetched_at       TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (member_id, criterion_key)
);

-- Suspicious / padded profile detection
CREATE TABLE data_flags (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id      INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    member_id    INTEGER REFERENCES members(id) ON DELETE CASCADE,
    flag_type    TEXT NOT NULL,        -- 'duplicate_submission', 'only_forked_repos', 'empty_repos', ...
    severity     TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'severe')),
    details      TEXT
);

-- ============================================================
-- PART 3: CONFIGURATION (all tuning lives here, not in code)
-- ============================================================

-- Saved presets. config_json holds weights, hard filters, X,
-- aggregation method (max/mean/sum), missing-data policy, tie-breakers, etc.
CREATE TABLE configs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    config_json TEXT NOT NULL,
    config_hash TEXT NOT NULL,
    is_preset   INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PART 4: RUNS AND RESULTS
-- ============================================================

CREATE TABLE runs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id       INTEGER NOT NULL REFERENCES datasets(id),
    config_id        INTEGER REFERENCES configs(id),
    config_snapshot  TEXT NOT NULL,     -- full copy of config used (reproducibility)
    top_x            INTEGER NOT NULL,
    teams_total      INTEGER,
    teams_shortlisted INTEGER,
    result_hash      TEXT,              -- same data + config must give the same hash
    run_at           TEXT DEFAULT CURRENT_TIMESTAMP
);

-- One row per team per run: the final outcome
CREATE TABLE run_results (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id           INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    team_id          INTEGER NOT NULL REFERENCES teams(id),
    is_eligible      INTEGER NOT NULL,  -- 1 if it passed all hard filters
    total_score      REAL,
    rank             INTEGER,
    outcome          TEXT NOT NULL CHECK (outcome IN
                       ('shortlisted', 'waitlisted', 'rejected', 'ineligible', 'excluded')),
    reason           TEXT,              -- plain-English summary of why
    has_missing_data INTEGER DEFAULT 0, -- shown as a warning in the UI
    tie_break_note   TEXT,
    UNIQUE (run_id, team_id)
);

-- Score breakdown: one row per team per criterion
CREATE TABLE run_score_details (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id           INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    team_id          INTEGER NOT NULL REFERENCES teams(id),
    criterion_key    TEXT NOT NULL REFERENCES criteria(key),
    team_raw_value   REAL,              -- after combining member values
    normalized_value REAL,              -- 0..1
    weight           REAL NOT NULL,
    weighted_score   REAL,
    data_status      TEXT NOT NULL CHECK (data_status IN ('ok', 'partial', 'missing')),
    members_with_data INTEGER,          -- e.g. 2 of 4 members had data
    members_total    INTEGER,
    explanation      TEXT
);

-- Hard filter results: one row per team per rule
CREATE TABLE run_rule_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    team_id     INTEGER NOT NULL REFERENCES teams(id),
    rule_name   TEXT NOT NULL,          -- e.g. 'min 1 member with 50+ contributions'
    passed      INTEGER NOT NULL,
    details     TEXT
);

CREATE INDEX idx_results_rank   ON run_results (run_id, rank);
CREATE INDEX idx_details_team   ON run_score_details (run_id, team_id);
CREATE INDEX idx_signals_member ON member_signals (member_id);
CREATE INDEX idx_teams_dataset  ON teams (dataset_id);

-- ============================================================
-- PART 5: ORGANIZER ACTIONS (good-to-have features)
-- ============================================================

-- Manual overrides: pin / exclude / waitlist
CREATE TABLE overrides (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    team_id     INTEGER NOT NULL REFERENCES teams(id),
    action      TEXT NOT NULL CHECK (action IN ('pin', 'exclude', 'waitlist')),
    reason      TEXT NOT NULL,         -- force the organizer to give a reason
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Head-to-head comparisons
CREATE TABLE pairwise_comparisons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    team_a_id   INTEGER NOT NULL REFERENCES teams(id),
    team_b_id   INTEGER NOT NULL REFERENCES teams(id),
    winner_id   INTEGER REFERENCES teams(id),  -- NULL = tie / undecided
    note        TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Audit log: who changed what and when
CREATE TABLE audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    action      TEXT NOT NULL,         -- 'upload_data', 'save_config', 'run', 'override', 'export'
    entity_type TEXT,                  -- 'dataset', 'config', 'run', 'team'
    entity_id   INTEGER,
    details     TEXT,                  -- JSON: old/new values
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
