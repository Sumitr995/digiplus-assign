# API Contract

**This file is the interface between Backend and Frontend.**

If the implementation needs a different shape, stop, update this contract first, and then propagate the change to both agents.

Base URL: `/api`

## Entity shapes

### LogEntry

```js
{
  id: string,
  timestamp: string,       // ISO 8601
  source: string,
  eventType: string,
  severity: "info" | "low" | "medium" | "critical",
  statusCode: number,
  userAgent: string,
  sessionId: string,
  location: string,
  flagged: boolean,
  createdAt: string
}
```

### Anomaly

```js
{
  id: string,
  logEntryId: string,
  score: number,            // 0-100
  reasonCodes: string[],
  reasonSummary: string,
  ruleVersion: string,
  createdAt: string
}
```

### Explanation

```js
{
  id: string,
  anomalyId: string,
  explanation: string,
  likelyRootCause: string,
  recommendedNextStep: string,
  model: string,
  generatedAt: string
}
```

## Endpoints

### `POST /api/logs/ingest`

Accept CSV multipart upload or JSON raw rows.

Runs:

```text
parse -> validate -> normalize -> persist -> detect anomalies
```

Success:

```json
{
  "totalRows": 10000,
  "ingested": 9998,
  "rejected": 2,
  "rejectedReasons": [
    { "row": 4821, "reason": "missing timestamp" }
  ],
  "flagged": 47
}
```

Empty/unparseable dataset:

```json
{
  "error": "EMPTY_DATASET",
  "message": "No valid rows found in the uploaded file."
}
```

Status: `422`.

### `GET /api/logs`

Query:

```text
page=1
pageSize=25
flagged=true|false
severity=critical|medium|low|info
from=<ISO date>
to=<ISO date>
q=<source/location search>
```

Response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 25,
  "total": 10000,
  "totalPages": 400
}
```

### `GET /api/logs/:id`

Returns one `LogEntry`. `404` if missing.

### `GET /api/anomalies`

Query:

```text
page
pageSize
minScore
reasonCode
```

Response:

```json
{
  "items": [
    { "logEntry": {}, "anomaly": {} }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 47,
  "totalPages": 2
}
```

### `GET /api/anomalies/:id`

Returns anomaly + its log entry + cached explanation.

If not generated:

```json
{ "explanation": null }
```

### `POST /api/anomalies/:id/explain`

Generates or regenerates an explanation.

Force regeneration:

```json
{ "force": true }
```

AI failure:

```json
{
  "error": "AI_PROVIDER_ERROR",
  "message": "Explanation generation failed. Try again."
}
```

Status: `502`.

### `GET /api/stats/summary`

Returns:

```json
{
  "totalLogs": 10000,
  "totalFlagged": 47,
  "bySeverity": {},
  "byReasonCode": {},
  "timeRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2023-01-07T22:39:00Z"
  }
}
```

## Universal error shape

```json
{
  "error": "MACHINE_READABLE_CODE",
  "message": "Human-readable message"
}
```

Use:

- `400` validation
- `404` not found
- `422` semantically empty input
- `500` unexpected server error
- `502` AI provider failure

## Contract rules

- Always return `id`, never `_id`.
- Never leak `_doc`, `_id`, or `__v`.
- Frontend must not silently rename backend fields.
- Backend must not return undocumented fields as a substitute for a missing contract field.
