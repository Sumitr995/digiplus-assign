# DigiPlus — Smart Log Analyzer & Anomaly Detector

This folder is the shared execution context for the DigiPlus ACOE technical assessment.

## Goal

Build a minimal, explainable MERN application that:

1. Ingests the real `Resources/log-data.csv` dataset.
2. Persists normalized log entries in MongoDB Atlas.
3. Detects anomalies using deterministic, hand-written rules.
4. Persists anomaly scores and reasons.
5. Uses AI only to explain an already-flagged anomaly.
6. Provides a paginated log list/timeline and detail view.
7. Handles malformed rows, missing timestamps, and empty datasets gracefully.

The official assessment window is 3.5 hours. The working plan is intentionally capped at 3 hours, leaving 30 minutes as safety margin.

## Agent model

There are exactly three execution roles:

- **Main / Orchestrator** — integration, contract control, phase gates, final QA.
- **Backend Agent** — owns `/backend`.
- **Frontend Agent** — owns `/frontend`.

Backend and Frontend work in parallel until integration requires the live backend.

## Source of truth

- `05-API-Contract.md` is the HTTP contract.
- `06-Anomaly-Detection.md` is the anomaly algorithm.
- `07-AI-Explanation.md` is the AI behavior.
- `08-Phases.md` controls execution order and gates.
- `12-Acceptance-Criteria.md` controls final sign-off.
- `13-Progress.md` is the shared status board.

## Rule

Do not add scope because it sounds useful. A finished core requirement is more valuable than an unfinished enhancement.
