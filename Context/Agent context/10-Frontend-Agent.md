# Frontend Agent

## Mission

Own everything under `/frontend`.

Implement against `05-API-Contract.md` as a black-box API.

Do not adapt silently to backend implementation details.

## Phase F0 — Setup

- [ ] Scaffold React + Vite.
- [ ] Pick fastest styling approach.
- [ ] Create API function per contract endpoint.
- [ ] Create realistic mock API/data layer.
- [ ] Add `.env.example`.
- [ ] Add list and detail routes.

## Phase F1 — List / Timeline

- [ ] Paginated log table/timeline.
- [ ] Flagged rows are visually obvious.
- [ ] Flagged-only filter.
- [ ] Severity filter.
- [ ] Date range.
- [ ] Search where useful.
- [ ] Empty state.
- [ ] Loading state.
- [ ] Row -> detail navigation.

## Phase F2 — Detail

Show:

- [ ] timestamp
- [ ] source
- [ ] event type
- [ ] severity
- [ ] status
- [ ] user agent
- [ ] session
- [ ] location

For flagged entries:

- [ ] score
- [ ] reason codes
- [ ] deterministic reason summary

AI panel:

- [ ] explanation
- [ ] likely root cause
- [ ] recommended next step
- [ ] generate action
- [ ] loading state
- [ ] failure state
- [ ] retry action

Never show fake AI text after an API failure.

## Phase F3 — Integration

Only after Backend B3 is live:

- [ ] replace mocks with real API;
- [ ] verify pagination at 10,000 rows;
- [ ] handle 400/404/422/502;
- [ ] verify ingest -> list -> detail -> explain;
- [ ] verify real anomaly ground truth.

If API shape differs from the contract, report a contract violation. Do not patch it locally.

## Phase F4 — Polish

- [ ] responsive laptop-width layout;
- [ ] semantic HTML;
- [ ] focus states;
- [ ] accessible controls;
- [ ] frontend README contribution;
- [ ] optional summary header only if core is finished.

## Hard rules

- `05-API-Contract.md` is authoritative.
- Do not expose Mongo-specific fields.
- Do not fabricate AI output.
- Do not start optional features before the core path works.
