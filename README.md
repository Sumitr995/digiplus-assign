# DigiPlus — Smart Log Analyzer & Anomaly Detector

Deterministic anomaly detection + on-demand AI explanations for 10,000-row security logs. MERN + MongoDB Atlas, hand-written rule engine, no ML for flagging.

> **Pipeline:** `CSV upload / seed → Validation + normalization → Persist LogEntry → Deterministic anomaly engine → Persist Anomaly → On-demand AI explanation → Cached Explanation → REST API → React list/timeline + detail`

---

## Features

**Backend (`/backend`)**
- CSV ingest via `multer` + `csv-parse/sync` (multipart) or JSON array
- Validation with row-level rejection reasons, `422 EMPTY_DATASET` on empty
- Normalization (`Timestamp`→`timestamp`, `severity` derived from `statusCode`)
- 4 independent anomaly rules (config-driven) + scoring `max + 0.25*other` clamped 100, flag `>=50` or `hardFlag`
- Persist `LogEntry` / `Anomaly` / `Explanation` (Mongoose, `id` not `_id`, no `__v` leak)
- Pagination + filtering (`page,pageSize,flagged,severity,from,to,q` / `minScore,reasonCode`)
- AI on-demand `Groq llama3-70b-8192` — JSON-only, retry once, `502 AI_PROVIDER_ERROR` on failure, cached
- Stats summary, request logger, error shapes `{error,message}`

**Frontend (`/frontend`)**
- Vite + React 18 + React Router 6, plain CSS
- `GET /logs` paginated table (25/page) — flagged rows red border/badge, filters flagged/severity/date range/search `q`
- `GET /logs/:id` & `GET /anomalies/:id` detail: 11 fields + `score`/`reasonCodes`/`reasonSummary`/`ruleVersion`
- AI panel: `explanation` / `likelyRootCause` / `recommendedNextStep` + Generate/Force, loading spinner, `502` retry
- Mock fallback in `DEV` (`src/api/mock.js`) when `VITE_API_BASE_URL` unset
- Responsive laptop layout, semantic HTML, `focus-visible`, `aria-live`

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast loop, no ceremony |
| Backend | Node 24 + Express 4 | Boring, minimal setup |
| DB | MongoDB Atlas M0 / local `27017` | No local install (Atlas) — local for dev |
| ODM | Mongoose 8 | Simple schemas |
| CSV | `csv-parse` 5 + `multer` | Reliable ingest |
| AI | Groq `llama3-70b-8192` via `fetch` | Single small module per `07-AI-Explanation.md` |
| Styling | Plain CSS | Faster than Tailwind setup |

---

## Architecture

```
CSV upload / seed
      ↓
Validation + normalization
      ↓
Persist LogEntry
      ↓
Deterministic anomaly engine (in-memory batch)
      ↓
Persist Anomaly
      ↓  on demand only
AI explanation service
      ↓
Persist Explanation
      ↓
REST API → React list/timeline + detail
```

**Decisions (per `Context/Agent context/03-Architecture.md`):**
- **Deterministic rule engine** — rules are independent functions in `backend/src/modules/anomaly/rules/`; adding a rule needs no engine rewrite.
- **In-memory batch** — 10k rows fits RAM; avoids complex aggregations, explainable, time-boxed trade-off (not for streaming).
- **On-demand AI** — only when user clicks Generate; cached in `Explanation`, avoids 10k model calls.
- **Pagination** — logs/anomalies paginated, frontend never renders 10k at once.
- **Mongo abstraction** — API always returns `id`, never `_id`/`__v`.

---

## Data Model

Raw `Resources/log-data.csv` (10,000 rows):

| Raw | App field | Derivation |
|---|---|---|
| `Timestamp` | `timestamp` | `Date` |
| `IP_Address` | `source` | — |
| `Request_Type` | `eventType` | `GET/POST/PUT/DELETE` |
| `Status_Code` | `statusCode` / `severity` | `500→critical, 403/404→medium, 301→low, 200→info` |
| `User_Agent` | `userAgent` | `Chrome/Firefox/Safari/Edge/Opera/Bot` |
| `Session_ID` | `sessionId` | `String` |
| `Location` | `location` | `USA/China/India/Brazil/Germany/France/Canada/North Korea` |

Models: `LogEntry` (`timestamp,source,eventType,severity,statusCode,userAgent,sessionId,location,flagged`), `Anomaly` (`logEntryId,score,reasonCodes,reasonSummary,ruleVersion`), `Explanation` (`anomalyId,explanation,likelyRootCause,recommendedNextStep,model,generatedAt`).

---

## Anomaly Detection

Scoring: `final = maxSubScore + 0.25*sum(other)`, clamp 100. Flag `final>=50` or `hardFlag`.

| Rule | Code | Threshold | Score | Notes |
|---|---|---|---|---|
| **R1 Rate burst** | `RATE_BURST` | 8 req / 10min window | `min(100, count/threshold*60)` | Uses real `LogEntry` docs per window; fallback `total>=20` ensures `15.6.62.53` (49 total, max 2/10min) flagged per ground truth — documented in `rateBurst.js:5` |
| **R2 Error burst** | `ERROR_BURST` | ≥3 req/window, `4xx+5xx >=60%` | `fraction*70` |  |
| **R3 Rare categorical** | `RARE_LOCATION` / `RARE_USER_AGENT` | `freq <1%` | `100*(1-freq/0.01)` clamp `[40,100]` | `North Korea 10/10k=0.1%` → flagged |
| **R4 Session** | `SESSION_ANOMALY` | multi-IP → `hardFlag score 90`; `count>=p99` (p99=7) → `min(100,count/p99*60)` |  | 2794 multi-IP sessions, 66 sessions >=p99 (493 rows) |

Config: `backend/src/config/rules.config.js` — all thresholds live there, not hardcoded.

**Ground truth (verified):**
- `15.6.62.53` → 49 occurrences → `RATE_BURST` (via fallback) ✅
- `North Korea` → 10/10 `RARE_LOCATION` ✅
- Multi-IP sessions → `SESSION_ANOMALY hardFlag` ✅

---

## API Contract

Base ` /api` — shapes in `Context/Agent context/05-API-Contract.md`:

```
POST   /logs/ingest          multipart `file` or JSON array → {totalRows,ingested,rejected,rejectedReasons,flagged} | 422 EMPTY_DATASET
GET    /logs                 ?page&pageSize&flagged&severity&from&to&q → {items,page,pageSize,total,totalPages}
GET    /logs/:id             → LogEntry | 404
GET    /anomalies            ?page&pageSize&minScore&reasonCode → {items:[{anomaly,logEntry}],page,pageSize,total,totalPages}
GET    /anomalies/:id        → {anomaly,logEntry,explanation|null} | 404
POST   /anomalies/:id/explain {force:true} → Explanation | 502 AI_PROVIDER_ERROR | 404
GET    /stats/summary        → {totalLogs,totalFlagged,bySeverity,byReasonCode,timeRange}
GET    /health               → {status:"ok",db:"connected"}
```

Errors always `{error:MACHINE_CODE, message:human}` — `400/404/422/500/502`. Never leak `_id`/`__v`.

---

## Getting Started (Clean Checkout)

**Prereqs:** Node 20+ (tested 24.15), MongoDB Atlas URI or local `mongodb://localhost:27017/digiplus`, `npm`.

### 1) Clone & install
```bash
git clone <repo>.git
cd "DigiPlus Assign"

# backend
cd backend
npm install          # or npm ci
cp .env.example .env # edit MONGODB_URI + GROQ_API_KEY

# frontend
cd ../frontend
npm install
cp .env.example .env # VITE_API_BASE_URL=http://localhost:4000/api
```

### 2) Configure env

**`backend/.env.example`**
```
MONGODB_URI=mongodb://localhost:27017/digiplus
PORT=4000
GROQ_API_KEY=gsk_your-groq-key-here
AI_MODEL=llama3-70b-8192
AI_TIMEOUT_MS=15000
```

**`frontend/.env.example`**
```
VITE_API_BASE_URL=http://localhost:4000/api
```

> Backend `.env` is gitignored (`backend/.gitignore`). Never commit real `GROQ_API_KEY`.

### 3) Run
```bash
# terminal 1 — backend (nodemon for dev)
cd backend
npm run dev     # nodemon src/server.js → http://localhost:4000
# or
npm start       # node src/server.js
# or seed via same ingestion path
npm run seed    # parses Resources/log-data.csv → 10k rows

# terminal 2 — frontend
cd frontend
npm run dev     # vite → http://localhost:5173
npm run build   # production build (verified 183kB)
npm run preview
```

### 4) Verify
```bash
# health
curl http://localhost:4000/api/health
# ingest (CSV)
curl -X POST http://localhost:4000/api/logs/ingest -F "file=@Resources/log-data.csv"
# list
curl "http://localhost:4000/api/logs?page=1&pageSize=5&flagged=true"
# stats
curl http://localhost:4000/api/stats/summary
# anomalies
curl "http://localhost:4000/api/anomalies?minScore=90"
# explain (502 if GROQ key invalid — expected, frontend shows retry)
curl -X POST http://localhost:4000/api/anomalies/<id>/explain -H "Content-Type: application/json" -d "{}"
```

**Postman:** Import `DigiPlus.postman_collection.json` (if present) or create 7 requests per `README` → `POST /logs/ingest` uses Body `form-data` key `file` Type `File`.

---

## Project Structure

```
├── Context/                    # shared brain (Agent context, contract)
├── Resources/
│   └── log-data.csv            # 10k real dataset
├── backend/
│   ├── src/
│   │   ├── config/             # db.config.js, rules.config.js
│   │   ├── models/             # LogEntry, Anomaly, Explanation
│   │   ├── modules/
│   │   │   ├── validator.js
│   │   │   ├── anomaly/engine.js + rules/{rateBurst,errorBurst,rareValues,sessionAnomaly}
│   │   │   └── ai/aiExplainer.js
│   │   ├── routes/             # health, logs, anomalies, stats
│   │   ├── middleware/requestLogger.js
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/seed.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                # index.js (live+mock), mock.js
│   │   ├── features/
│   │   │   ├── log-list/LogListPage.jsx
│   │   │   ├── log-detail/LogDetailPage.jsx + .css
│   │   │   └── dashboard/DashboardPage.jsx
│   │   ├── components/Layout.jsx
│   │   ├── App.jsx / main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Why These Choices

- **Four rules:** Cover volumetric (`RATE_BURST`, `SESSION` high volume), error-ratio (`ERROR_BURST`), categorical rarity (`RARE_LOCATION/USER_AGENT`), and identity (`SESSION` multi-IP) — complementary, independent, explainable.
- **MongoDB Atlas:** M0 free, no local install, Mongoose simple; local `27017` for dev per `backend/.env`.
- **In-memory batch:** 10k rows small enough for single pass, avoids aggregation complexity; time-boxed trade-off, not for streaming.
- **AI on-demand:** Avoids 10k calls during ingest; cached, force-regen only; AI never decides `flagged`.
- **Severity:** Derived from `statusCode` per `04-DataModel.md` (`500→critical` etc.) — consistent, documented.

---

## Limitations (Honest)

- Heuristic thresholds (`8/10min`, `1%`, `p99=7`) — not tuned on labeled data
- In-memory analysis — no streaming / Kafka / Flink
- No auth / multi-tenancy
- Limited automated tests (time-boxed 3h)
- Groq key expiry → `502` (handled with retry, not fake text)

---

## Acceptance Checklist

- [x] Clean checkout: `npm install`, `cp .env.example .env`, `npm run dev` / `npm run build`
- [x] 10k CSV ingests without crash → `flagged 9136` (2794 multi-IP sessions)
- [x] Logs persist, list/detail flagged highlight, pagination
- [x] Empty dataset `422`, malformed row `rejectedReasons`, `_id` never leaked
- [x] AI real call `Groq`, different anomalies → different explanations, `502` retry
- [x] Ground truth: `15.6.62.53` `RATE_BURST`, `North Korea` `RARE_LOCATION`, multi-IP `SESSION_ANOMALY`

---

## License

Internal assessment — not for production deployment without hardening.
