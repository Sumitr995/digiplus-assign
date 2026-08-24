# Progress

This is the shared status board.

## Status

| Phase | Owner | Status | Notes |
|---|---|---|---|
| B0 | Backend | Not started | |
| B1 | Backend | Not started | |
| B2 | Backend | Not started | |
| B3 | Backend | Not started | |
| B4 | Backend | Not started | |
| F0 | Frontend | Not started | |
| F1 | Frontend | Not started | |
| F2 | Frontend | Not started | |
| F3 | Frontend | Blocked | Waiting for B3 |
| F4 | Frontend | Not started | |

Allowed statuses:

```text
Not started
In progress
Blocked
Done
```

## Decisions

- None yet.

## Blockers

- None yet.

## Ground-truth checks

- [ ] `15.6.62.53` flagged with `RATE_BURST`.
- [ ] North Korea rows flagged with `RARE_LOCATION`.
- [ ] Multi-IP session check performed.

## Integration

- [ ] Ingest -> list
- [ ] List -> detail
- [ ] Detail -> explain
- [ ] AI failure -> 502 + frontend retry
- [ ] Empty dataset -> 422 + frontend error
- [ ] Malformed row -> rejection reason

## Final sign-off

- [ ] Acceptance criteria reviewed.
- [ ] Root README assembled.
- [ ] Clean-checkout run verified.
