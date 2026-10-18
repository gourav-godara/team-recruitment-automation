# Team Roles

## Project

Team Recruitment Automation Tool

---

# 1. Team Structure

| Member | Primary Responsibility | Main Area |
|---|---|---|
| Gourav | Core Decision Engine + Architecture | Backend / Decision Logic |
| Susmita | Database + Authentication | Supabase / Backend |
| Ritika | Data Import + Processing | Backend / Data |
| Dushant | Integrations + Advanced Features | Backend / External APIs |
| Geet | Frontend | React / UI |

---

# 2. Gourav

## Role

Core Decision Engine + Overall Architecture

## Owns

- Core decision engine
- Eligibility engine
- Scoring engine
- Ranking engine
- Team aggregation
- Explanation engine
- Configuration design
- Reproducibility
- Overall architecture
- Cross-module coordination

## Main Deliverables

- Deterministic evaluation pipeline
- Configurable scoring
- Configurable eligibility
- Team aggregation
- Ranking
- Explainability
- Tests
- Architecture decisions

## Must Coordinate With

All members, especially:

- Ritika for input data contracts
- Susmita for persistence
- Geet for API responses
- Dushant for external signals

---

# 3. Susmita

## Role

Database + Authentication

## Owns

- Supabase PostgreSQL
- Database schema
- SQLAlchemy models
- Relationships
- Migrations
- Authentication
- User management
- Persistence

## Main Deliverables

- Database schema
- Database connection
- SQLAlchemy models
- Authentication flow
- Migration strategy
- Secure environment configuration

## Must Coordinate With

- Gourav for engine data structures
- Geet for authentication/API requirements
- Ritika for imported data persistence

---

# 4. Ritika

## Role

Data Import + Processing

## Owns

- CSV import
- JSON import
- Schema mapping
- Validation
- Normalization
- Team construction
- Member construction
- Import error reporting

## Main Deliverables

- CSV parser
- JSON parser
- Validation service
- Normalization service
- Team/member transformation
- Sample datasets
- Import tests

## Must Coordinate With

Gourav to ensure the processed data matches the engine input contract.

---

# 5. Dushant

## Role

Integrations + Advanced Features

## Owns

Potential features:

- GitHub integration
- External profile enrichment
- Sensitivity analysis
- Pairwise comparison
- Suspicious-data detection
- Advanced analysis
- External data caching

## Main Deliverables

Depends on final MVP priority.

Core principle:

Advanced features must not break the core engine.

---

# 6. Geet

## Role

Frontend

## Owns

- React application
- UI components
- Pages
- Navigation
- Configuration screens
- Upload interface
- Ranking interface
- Team detail interface
- Review interface
- Export interface

## Main Deliverables

Potential pages:

```text
/login
/dashboard
/campaigns
/campaigns/:id/import
/campaigns/:id/configure
/campaigns/:id/run
/runs/:id/ranking
/runs/:id/team/:teamId
/runs/:id/compare
/runs/:id/sensitivity
/runs/:id/review
/runs/:id/export
