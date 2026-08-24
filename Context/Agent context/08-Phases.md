# Build Phases

## Objective

Two agents work simultaneously while they can remain independent.

```text
TIME        BACKEND                         FRONTEND
────────────────────────────────────────────────────────
0:00-0:20   B0 Setup                        F0 Setup
0:20-1:20   B1 Ingestion + Detection        F1 List/Timeline
1:20-1:55   B2 AI Integration               F2 Detail
1:55-2:25   B3 API Finalization              F3 Integration
2:25-3:00   B4 Polish                       F4 Polish
```

## Phase gates

### Gate 0 — Foundation

**Backend B0 must prove:**

- Express starts.
- MongoDB Atlas connects.
- Models exist.
- Rules config exists.
- `.env.example` exists.

**Frontend F0 must prove:**

- Vite starts.
- Routes exist.
- API functions exist.
- Mock data matches `05-API-Contract.md`.

Both agents can continue independently after their own setup works.

---

### Gate 1 — Core functionality

**Backend B1 must prove:**

- real CSV can be parsed;
- validation works;
- normalized rows persist;
- anomaly engine runs;
- ground-truth anomalies are detected.

**Frontend F1 must prove:**

- paginated list renders;
- flagged rows are visually obvious;
- filters work against mock data;
- empty/loading states exist.

No frontend/backend dependency yet.

---

### Gate 2 — AI + detail

**Backend B2 must prove:**

- real AI provider call works;
- JSON parsing/retry works;
- explanation persists;
- repeat requests use cache.

**Frontend F2 must prove:**

- full detail view exists;
- anomaly score/reasons are visible;
- generate button works against mock;
- loading/error/retry states exist.

---

### Gate 3 — Integration

This is the first hard dependency.

Backend B3 must expose the contract exactly.

Frontend F3 replaces mocks with the live API.

Required round trip:

```text
ingest
  -> list
  -> detail
  -> explain
```

Integration is not complete until both agents test the same real dataset.

---

### Gate 4 — Submission readiness

Both agents may polish in parallel.

Cut order if time is short:

1. polish;
2. optional enhancements;
3. non-essential tests;
4. only as a last resort, the R4 multi-IP session check.

Never cut:

- deterministic anomaly detection;
- malformed/empty input handling;
- real AI explanation;
- AI failure handling;
- API contract consistency.

## Agent behavior

Every phase follows:

```text
READ -> IMPLEMENT -> VERIFY -> REPORT -> WAIT FOR GATE
```

Do not silently jump to the next phase.

## Handoff format

Each agent updates `13-Progress.md` with:

```text
Phase:
Status:
Completed:
Verification:
Files changed:
Contract impact:
Blockers:
Next phase:
```

If a contract change is needed, stop and notify the Main Agent.
