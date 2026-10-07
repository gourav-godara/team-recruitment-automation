# Database Design: Team Recruitment Automation Tool

> **For the coding agent:** This file and `schema.sql` are the source of truth for the data model.
> - Use ONLY the tables, columns, and enum values listed here. Do not invent new ones.
> - If you think a table or column is missing, STOP and tell the user instead of adding it.
> - If this file and `schema.sql` disagree, `schema.sql` wins. Report the mismatch.
> - Keep code simple and readable (beginner-to-intermediate level). No clever abstractions.

## 1. What the app does

Organizers upload a CSV/JSON of hackathon teams. The tool scores each team using configurable
weights, applies hard filters, picks the top X teams, and explains every result. Everything
tunable (weights, filters, X, tie-breakers) lives in a config, never in code.

## 2. Core rules (must never be broken)

1. **Missing data is never a silent zero.** Missing values are stored with `status = 'missing'`
   and shown to the organizer (`has_missing_data`, `data_status`).
2. **Every result is explainable.** Each team in a run has score breakdown rows and rule result rows.
3. **Reproducible.** A run stores a full copy of its config (`config_snapshot`). Same dataset + same
   config must give the same ranking and the same `result_hash`.
4. **No fabricated data.** Never infer or fill in profile info that is not in the data or fetched sources.
5. **Uncertain AI/parsed values** must be saved with `status = 'low_confidence'` and a `confidence`
   value, and flagged in the UI, not shown as fact.
6. **Team size is variable** (1 to many). Never assume a fixed number of members.
7. **Every link field is optional** (NULL means not provided).

## 3. Tables overview

| Group | Tables |
|---|---|
| Input data | `datasets`, `teams`, `members` |
| Extracted signals | `criteria`, `member_signals`, `data_flags` |
| Configuration | `configs` |
| Runs and results | `runs`, `run_results`, `run_score_details`, `run_rule_results` |
| Organizer actions | `overrides`, `pairwise_comparisons`, `audit_log` |

**MVP (build first):** `datasets`, `teams`, `members`, `criteria`, `member_signals`, `configs`,
`runs`, `run_results`, `run_score_details`, `run_rule_results`.
**Later:** `data_flags`, `overrides`, `pairwise_comparisons`, `audit_log`.

## 4. Table details

Database: SQLite. Dates are TEXT (ISO format). JSON is stored as TEXT. Booleans are INTEGER (0 or 1).
Primary keys are `id INTEGER AUTOINCREMENT` unless stated.

### datasets
One row per uploaded file.
`id`, `name`, `source_format` (`csv` | `json`), `file_hash`, `column_mapping` (JSON), `total_teams`, `uploaded_at`

### teams
`id`, `dataset_id` -> datasets, `external_id`, `team_name`, `team_size`, `extra_data` (JSON)
Unique: (`dataset_id`, `external_id`)

### members
`id`, `team_id` -> teams, `full_name`, `email`, `gender`, `resume_url`, `github_url`, `linkedin_url`,
`portfolio_url`, `resume_text`
All fields except `id` and `team_id` are nullable.
`gender`: optional TEXT (`female` | `male` | `other`), used for diversity criteria (e.g., SIH requirement of at least 1 woman per team).

### criteria
Registry of things we can score. Primary key is TEXT `key`.
`key` (e.g. `github_contributions_1y`), `label`, `source` (`github` | `resume` | `linkedin` | `portfolio` | `form`),
`value_type` (`number` | `boolean` | `text`), `description`
To add a new criterion: insert a row here and write one extractor function.

### member_signals
One row per member per criterion.
`id`, `member_id` -> members, `criterion_key` -> criteria, `value_num`, `value_text`,
`status` (`ok` | `missing` | `fetch_failed` | `low_confidence`), `confidence` (0 to 1),
`evidence`, `extractor_version`, `fetched_at`
Unique: (`member_id`, `criterion_key`)

### data_flags (later)
Suspicious or padded profiles.
`id`, `team_id`, `member_id` (nullable), `flag_type`, `severity` (`info` | `warning` | `severe`), `details`

### configs
`id`, `name`, `config_json`, `config_hash`, `is_preset` (0/1), `created_at`

### runs
`id`, `dataset_id`, `config_id` (nullable), `config_snapshot` (JSON, full copy), `top_x`,
`teams_total`, `teams_shortlisted`, `result_hash`, `run_at`

### run_results
One row per team per run (final outcome).
`id`, `run_id`, `team_id`, `is_eligible`, `total_score`, `rank`,
`outcome` (`shortlisted` | `waitlisted` | `rejected` | `ineligible` | `excluded`),
`reason` (plain English), `has_missing_data`, `tie_break_note`
Unique: (`run_id`, `team_id`)

### run_score_details
One row per team per criterion per run (score breakdown).
`id`, `run_id`, `team_id`, `criterion_key`, `team_raw_value`, `normalized_value` (0 to 1), `weight`,
`weighted_score`, `data_status` (`ok` | `partial` | `missing`), `members_with_data`, `members_total`, `explanation`

### run_rule_results
One row per team per hard-filter rule per run.
`id`, `run_id`, `team_id`, `rule_name`, `passed` (0/1), `details`

### overrides (later)
`id`, `run_id`, `team_id`, `action` (`pin` | `exclude` | `waitlist`), `reason` (required), `created_at`

### pairwise_comparisons (later)
`id`, `run_id`, `team_a_id`, `team_b_id`, `winner_id` (NULL = tie), `note`, `created_at`

### audit_log (later)
`id`, `action`, `entity_type`, `entity_id`, `details` (JSON), `created_at`

## 5. Relationships

```
datasets 1---* teams 1---* members 1---* member_signals *---1 criteria
datasets 1---* runs  *---1 configs
runs 1---* run_results
runs 1---* run_score_details      (team_id + criterion_key)
runs 1---* run_rule_results       (team_id + rule_name)
runs 1---* overrides, pairwise_comparisons
```

Deleting a dataset deletes its teams and members. Deleting a run deletes its results.

## 6. How scoring flows

1. Upload file -> create `datasets`, `teams`, `members`.
2. Extract values per member -> `member_signals` (missing stays `missing`).
3. Organizer saves a config -> `configs` (weights, hard filters, X, how to combine members, tie-breakers).
4. Run:
   - Combine member values into one team value (method set in config: e.g. max, mean, sum, or "at least one member").
   - Normalize to 0..1, multiply by weight -> `run_score_details`.
   - Check hard filters -> `run_rule_results`; failing teams get `outcome = 'ineligible'`.
   - Rank eligible teams, take top X -> `run_results`.
5. Export shortlist + `config_snapshot` as CSV/JSON.

## 7. Frontend data shape (what the UI receives for one team)

This is what the demo/mock JSON must look like. It is the joined result of `run_results`,
`run_score_details`, and `run_rule_results`. Do not rename these fields.

```json
{
  "team_id": 12,
  "team_name": "Byte Bandits",
  "team_size": 3,
  "rank": 4,
  "total_score": 0.72,
  "outcome": "shortlisted",
  "reason": "Passed all rules; strong GitHub activity",
  "has_missing_data": true,
  "breakdown": [
    {
      "criterion_key": "github_contributions_1y",
      "normalized_value": 0.8,
      "weight": 0.4,
      "weighted_score": 0.32,
      "data_status": "partial",
      "members_with_data": 2,
      "members_total": 3,
      "explanation": "Max of 2 members with data"
    }
  ],
  "rules": [
    { "rule_name": "min 50 contributions", "passed": true, "details": "Member A has 120" }
  ]
}
```

Config JSON shape (stored in `configs.config_json`, also used by the UI controls):

```json
{
  "top_x": 50,
  "weights": { "github_contributions_1y": 0.4, "projects": 0.4, "education": 0.2 },
  "hard_filters": [
    { "criterion_key": "github_contributions_1y", "operator": ">=", "value": 50, "applies_to": "any_member" },
    { "criterion_key": "gender", "operator": "==", "value": "female", "applies_to": "at_least_1_member" }
  ],
  "team_aggregation": { "github_contributions_1y": "max" },
  "missing_data_policy": "flag_and_exclude_from_average",
  "tie_breakers": ["total_score", "team_size"]
}
```

## 8. Naming conventions

- Tables and columns: `snake_case`, tables are plural.
- Foreign keys: `<table_singular>_id` (e.g. `team_id`).
- Criterion keys: `snake_case`, e.g. `github_contributions_1y`.
- Enum values: lowercase with underscores, exactly as listed above.
