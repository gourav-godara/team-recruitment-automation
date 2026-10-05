## Git Workflow

main
    Stable and demo-ready code

develop
    Integration branch for completed features

feature/*
    Individual development branches

Rules:

1. Never push directly to main.
2. Never push directly to develop.
3. All feature work must happen on a feature branch.
4. Every feature must be merged through a Pull Request.
5. develop requires at least 1 approval.
6. main requires at least 2 approvals.
7. The latest push must be reviewed by another team member.
8. Review conversations must be resolved before merging.
9. Force pushes are not allowed on main or develop.
10. Secrets and .env files must never be committed.
11. Use meaningful commit messages.
12. Use squash merge for Pull Requests.
13. Delete feature branches after successful merge.
14. CI checks must pass before merging once CI is configured.
