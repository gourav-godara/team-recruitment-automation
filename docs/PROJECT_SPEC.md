# Team Recruitment Automation Tool

## 1. Project Overview

The Team Recruitment Automation Tool is a reusable, configurable, explainable decision-support system for hackathon and competition organizers.

Large hackathons can receive hundreds or thousands of team registrations. Each team may contain a different number of members, and each member may provide different information such as:

- Resume
- GitHub
- LinkedIn
- Portfolio
- Projects
- Achievements
- Experience
- Education

Manually reviewing and shortlisting all teams can be slow, inconsistent, and difficult to explain.

Our system helps organizers transform registration data into a transparent and configurable shortlist.

The system must support:

- Configurable selection criteria
- Configurable scoring weights
- Configurable eligibility rules
- Different team sizes
- Partial or missing profile information
- Explainable results
- Reproducible scoring
- Manual review and overrides
- Exportable results

The system must NOT assume that there is one universally correct definition of a "good team".

The organizer defines what matters.

---

# 2. Core Product Philosophy

The most important principle of this project is:

> The engine should never decide what "good" means. The organizer defines what "good" means through configuration.

For example, one hackathon may prioritize:

- GitHub activity
- Projects
- Technical experience

Another may prioritize:

- Achievements
- Previous hackathon experience
- Domain expertise

Another may use completely different criteria.

Therefore:

- Weights must be configurable.
- Thresholds must be configurable.
- Eligibility rules must be configurable.
- Top X must be configurable.
- Team aggregation must be configurable where applicable.
- Missing-data behavior must be configurable.

Changing these values should NOT require changing source code.

---

# 3. Main System Pipeline

The overall system should follow this pipeline:

```text
CSV / JSON
    ↓
Schema Mapping
    ↓
Validation
    ↓
Normalization
    ↓
Team + Member Construction
    ↓
Individual Signal Extraction
    ↓
Team-Level Aggregation
    ↓
Eligibility / Hard Rules
    ↓
Weighted Scoring
    ↓
Ranking
    ↓
Top X Selection
    ↓
Explainability
    ↓
Manual Review / Overrides
    ↓
Export + Configuration + Audit Log
