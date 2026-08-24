# Acceptance Criteria

## Functionality

- [ ] Clean checkout: install dependencies, configure `.env`, run both apps.
- [ ] Real 10,000-row CSV ingests without crashing.
- [ ] Logs persist in MongoDB.
- [ ] List view works.
- [ ] Detail view works.
- [ ] Flagged entries are clearly highlighted.
- [ ] Empty dataset is handled.
- [ ] Malformed rows are handled.

## AI

- [ ] `/explain` performs a real model call.
- [ ] Different anomalies produce substantively different explanations.
- [ ] Explanations reference actual evidence.
- [ ] AI never decides `flagged`.
- [ ] AI failure returns `502`.
- [ ] Frontend shows an error/retry state instead of fake text.

## Engineering

- [ ] Backend respects module boundaries.
- [ ] Anomaly rules are independent units.
- [ ] Thresholds live in configuration.
- [ ] API contract matches actual backend output.
- [ ] No `_id` / `__v` leakage.

## Data

- [ ] `LogEntry`, `Anomaly`, and `Explanation` persist.
- [ ] Pagination works for 10,000 rows.
- [ ] Derived severity is consistent and documented.

## UX

- [ ] Flagged rows are visually obvious.
- [ ] Loading states exist.
- [ ] Error states exist for async actions.
- [ ] AI generation has a visible loading state.
- [ ] Flagged/severity/date filters work on real data.

## Problem solving

README must explain:

- why the four anomaly rules were selected;
- why MongoDB Atlas was selected;
- why in-memory batch analysis was selected;
- why AI is on-demand;
- how severity is derived;
- what limitations remain.

## Ground truth

- [ ] `15.6.62.53` -> `RATE_BURST`.
- [ ] Majority of `North Korea` rows -> `RARE_LOCATION`.
- [ ] Session multi-IP behavior is checked.

## Known limitations to state honestly

- heuristic thresholds;
- in-memory batch analysis;
- no streaming architecture;
- no authentication/multi-tenancy;
- limited automated tests because of the time box.
