# API Contract

## 1. Purpose

This document defines the planned communication contract between the frontend and backend.

The API contract may evolve during development, but breaking changes should be communicated to affected team members.

---

# 2. General Architecture

```text
React Frontend
      ↓
   REST API
      ↓
FastAPI Backend
      ↓
Services
      ↓
Database / Core Engine / Integrations
