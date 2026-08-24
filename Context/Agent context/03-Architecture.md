# Architecture

## Architecture principle

**Fewer moving parts beats more elaborate infrastructure under a 3-hour constraint.**

## Repository

```text
DigiPlus-LogAnalyzer/
├── Context/
├── Resources/
│   └── log-data.csv
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── modules/
│   │   │   ├── logs/
│   │   │   ├── anomaly/
│   │   │   ├── ai/
│   │   │   └── stats/
│   │   ├── routes/
│   │   └── server.js
│   ├── scripts/
│   │   └── seed.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── features/
│   │   │   ├── log-list/
│   │   │   ├── log-detail/
│   │   │   └── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

## Runtime flow

```text
CSV upload / seed
      |
      v
Validation + normalization
      |
      v
Persist LogEntry
      |
      v
Deterministic anomaly engine
      |
      v
Persist Anomaly
      |
      |  on demand only
      v
AI explanation service
      |
      v
Persist Explanation
      |
      v
REST API
      |
      v
React list/timeline + detail
```

## Architectural decisions

### 1. Deterministic rule engine

Rules are independent functions registered in a collection. Adding a rule should not require rewriting the engine.

### 2. In-memory batch analysis

The 10,000-row ingestion batch is small enough for an in-memory analysis pass. This avoids complex MongoDB aggregation pipelines while keeping the implementation explainable.

This is a deliberate time-boxed trade-off, not a claim that the approach is ideal for arbitrary production-scale streams.

### 3. On-demand AI

AI is generated when the user requests an explanation. Generated explanations are cached.

This avoids calling the model for every flagged row during ingestion.

### 4. Pagination

Logs and anomalies are paginated. The frontend must never render all 10,000 records at once.

### 5. Mongo abstraction

Mongo `_id` is never exposed through the API. Responses use `id`.

## Ownership boundaries

| Area | Owner |
|---|---|
| `/backend/**` | Backend Agent |
| `/frontend/**` | Frontend Agent |
| `Context/**` | Main / Orchestrator |
| Root README | Main / Orchestrator |
| API contract | Main / Orchestrator |
| Final integration | Main / Orchestrator |
