# System Architecture

## 1. Architecture Goal

The system should be modular, maintainable, testable, configurable, and reproducible.

The most important architectural principle is:

> The Core Decision Engine must remain independent from the frontend, database, authentication, and external integrations.

The system should therefore separate:

- Presentation
- API
- Business logic
- Data processing
- Persistence
- External integrations

---

# 2. High-Level Architecture

```text
                    ┌─────────────────────┐
                    │       React         │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                              HTTP
                               │
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │ Core Decision│  │ Data Import  │  │ Integrations │
     │    Engine    │  │  Processing  │  │   Services   │
     └──────────────┘  └──────────────┘  └──────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       SQLAlchemy    │
                    │    Persistence      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Supabase PostgreSQL │
                    └─────────────────────┘
