# START HERE

## Read this first

This folder is the shared brain for the DigiPlus assessment.

The build is intentionally time-boxed to 3 hours.

## Reading order

```text
00 START
01 Problem
02 Tech Stack
03 Architecture
04 Data Model
05 API Contract
06 Anomaly Detection
07 AI Explanation
08 Phases
09 Backend Agent
10 Frontend Agent
11 Agent Coordination
12 Acceptance Criteria
13 Progress
MASTER PROMPT
```

## Non-negotiables

1. Use the real 10,000-row dataset.
2. Use MERN + MongoDB Atlas.
3. Keep anomaly detection deterministic.
4. Use AI only for explanation.
5. Treat `05-API-Contract.md` as the backend/frontend boundary.
6. Backend owns `/backend`.
7. Frontend owns `/frontend`.
8. Main Agent owns integration and Context.
9. Work phase-by-phase.
10. Do not add optional scope until the core path works.

## The key mental model

```text
DATA
  ↓
PERSIST
  ↓
DETECT
  ↓
FLAG + REASON
  ↓
EXPLAIN WITH AI
  ↓
DISPLAY
```
