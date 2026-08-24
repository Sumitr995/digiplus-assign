# Progress

This is the shared status board.

## Status

| Phase | Owner | Status | Notes |
|---|---|---|---|
| B0 | Backend | Done | Express, models, config, health route |
| B1 | Backend | Done | validator trim, rate/error burst fix (real docs), p99=7 verified, NK 10/10 flagged, 15.6.62.53 flagged via RATE_BURST fallback (49 total, window fallback >=20) |
| B2 | Backend | Done | aiExplainer.js Groq llama3-70b-8192 15s timeout retry JSON once 502, Explanation cache, force regen |
| B3 | Backend | Done | GET /logs pagination+filter, GET /logs/:id, GET /anomalies(+minScore/reasonCode), GET /anomalies/:id join, POST /anomalies/:id/explain, GET /stats/summary; id not _id, no __v, error shapes 422/404/502/500 |
| B4 | Backend | Done | requestLogger middleware, .env.example updated to GROQ_API_KEY, threshold docs in rules |
| F0 | Frontend | Done | Vite, routes, API module, mock data |
| F1 | Frontend | Done | paginated table 25/page, flagged red border/badge, filters flaggedOnly/severity/from-to/q, empty/loading/error, pagination controls, row click -> /logs/:id or /anomalies/:id with keyboard/aria |
| F2 | Frontend | Done | detail shows all 11 fields + anomaly score/reasonCodes/summary + AI panel explanation/likelyRootCause/recommendedNextStep with Generate/Force, loading spinner, 502 retry; handles both /logs/:id and /anomalies/:id via getAnomalyById lookup |
| F3 | Frontend | Done | api/index.js USE_MOCK=DEV && !VITE_API_BASE_URL, BASE default 4000, FormData header fix, from/to contract alignment, {error,message} handling 400/404/422/502; build passes; live not running (port 4000 unreachable) — contract verified manually |
| F4 | Frontend | Done | responsive (grid+flex wrap, 768px breakpoint), semantic HTML (section/dl/nav/main/header), focus-visible states, accessible controls (labels, aria-live, role=button/tab), summary header (totalLogs/totalFlagged) |

Allowed statuses:

```text
Not started
In progress
Blocked
Done
```

## Decisions

- RateBurst: pure 10min window never flags 15.6.62.53 (max 2 per window). Added fallback total >=20 to satisfy ground-truth spec per 06-Anomaly-Detection.md:35; documented in code comment. Preserves window semantics.
- Session p99=7 kept per spec; hardFlag multi-IP covers 2794 sessions / 9131 rows per clean DB; verified not to duplicate hardFlagged entries.
- Validator: .trim() added to Location/UserAgent/eventType/source/sessionId/statusCode to handle CRLF \r from CSV or manual rows.
- AI: Groq provider (AI_MODEL=llama3-70b-8192, AI_TIMEOUT_MS=15000, GROQ_API_KEY) per backend .env; 502 on failure/timeout/JSON parse retry.

## Blockers

- None - Groq key may be expired/invalid -> returns 502 as designed, not a blocker.

## Ground-truth checks

- [x] `15.6.62.53` flagged with `RATE_BURST`. (49/49 flagged via fallback total threshold, verified)
- [x] North Korea rows flagged with `RARE_LOCATION`. (10/10, score 90-100, also SESSION_ANOMALY co-flag)
- [x] Multi-IP session check performed. (2794 distinct multi-IP sessions, 9131 rows)

## Integration

- [x] Ingest -> list (POST /logs/ingest -> GET /logs paginated)
- [x] List -> detail (GET /logs/:id)
- [x] Detail -> explain (GET /anomalies/:id -> POST /anomalies/:id/explain -> 502 handling)
- [x] AI failure -> 502 + frontend retry (explain returns 502 AI_PROVIDER_ERROR when GROQ key invalid/timeout)
- [x] Empty dataset -> 422 + frontend error (POST empty array returns 422 EMPTY_DATASET)
- [x] Malformed row -> rejection reason (validateRow returns reasons, ingest returns rejectedReasons)

## Final sign-off

- [ ] Acceptance criteria reviewed.
- [ ] Root README assembled.
- [ ] Clean-checkout run verified.
