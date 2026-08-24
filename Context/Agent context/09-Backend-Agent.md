# Backend Agent

## Mission

Own everything under `/backend`.

Implement the backend according to:

- `03-Architecture.md`
- `04-DataModel.md`
- `05-API-Contract.md`
- `06-Anomaly-Detection.md`
- `07-AI-Explanation.md`
- `08-Phases.md`

## Phase B0 — Setup

- [ ] Initialize Node + Express.
- [ ] Install Mongoose, dotenv, multer, CSV parser.
- [ ] Connect to MongoDB Atlas.
- [ ] Create `LogEntry`, `Anomaly`, `Explanation`.
- [ ] Create `rules.config.js`.
- [ ] Create `.env.example`.
- [ ] Add health route.
- [ ] Verify server + Atlas before continuing.

## Phase B1 — Ingestion + Detection

- [ ] Parse real CSV and generic uploaded CSV.
- [ ] Validate timestamps and enums.
- [ ] Reject malformed rows with reasons.
- [ ] Return `422 EMPTY_DATASET` for empty/unparseable input.
- [ ] Normalize fields according to `04-DataModel.md`.
- [ ] Persist logs.
- [ ] Implement R1-R4 independently.
- [ ] Persist anomaly score/reasons.
- [ ] Implement seed through the same ingestion path.
- [ ] Verify `15.6.62.53`.
- [ ] Verify `North Korea`.

## Phase B2 — AI

- [ ] Implement `aiExplainer.js`.
- [ ] Send only flagged-entry evidence.
- [ ] Parse JSON.
- [ ] Retry malformed JSON once.
- [ ] Timeout.
- [ ] Return `502` on provider failure.
- [ ] Persist and cache `Explanation`.
- [ ] Verify one real explanation against a real anomaly.

## Phase B3 — API

- [ ] Implement every endpoint in `05-API-Contract.md`.
- [ ] Pagination.
- [ ] Filtering.
- [ ] Error middleware.
- [ ] Flatten Mongo `_id` to `id`.
- [ ] Never leak Mongo internals.
- [ ] Confirm contract with Main Agent before declaring done.

## Phase B4 — Polish

- [ ] Basic request logging.
- [ ] Backend README contribution.
- [ ] Threshold documentation.
- [ ] Tests if time allows.
- [ ] Optional enhancement only if core is complete.

## Hard rules

- AI never flags anomalies.
- No fake AI output.
- No contract drift.
- No giant single-file implementation.
- No new infrastructure without Main Agent approval.
