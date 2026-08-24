# Agent Coordination

## Purpose

This file is the operating agreement for the two OpenCode sub-agents.

## Shared workspace

```text
Context/
backend/
frontend/
Resources/
```

## Ownership

```text
Backend Agent  -> backend/**
Frontend Agent -> frontend/**
Main Agent     -> Context/** + root integration
```

Agents should avoid editing files outside their ownership unless explicitly coordinated.

## Parallel execution

### Safe to run in parallel

```text
B0 <-> F0
B1 <-> F1
B2 <-> F2
B4 <-> F4
```

### Dependency

```text
B3 -> F3
```

Frontend integration must wait for the backend API layer to be usable.

## Shared contract

`05-API-Contract.md` is the only interface between agents.

If Backend discovers that an endpoint needs to change:

```text
STOP
  ↓
propose contract change
  ↓
Main Agent approves/edits contract
  ↓
Backend + Frontend update
  ↓
resume phase
```

## No hidden coupling

Backend must not assume frontend implementation.

Frontend must not assume backend internals.

The only shared assumptions are documented Context files.

## Phase reporting

At the end of each phase, each agent writes to `13-Progress.md`.

Example:

```md
### Backend B1
Status: Done

Completed:
- CSV ingestion
- validation
- R1-R4
- persistence

Verification:
- 15.6.62.53 -> RATE_BURST
- North Korea -> 10 rows checked

Contract impact:
- None

Blockers:
- None
```

## Integration protocol

After B3:

1. Backend confirms API is running.
2. Frontend switches mock -> live.
3. Frontend tests list/detail/explain.
4. Main Agent compares actual responses to contract.
5. Both agents fix issues in their own area.
6. Main Agent runs acceptance checklist.

## Time discipline

If an agent finishes early:

Do not invent a large feature.

First help with:

- tests;
- error states;
- documentation;
- contract verification;
- ground-truth checks;
- small UX improvements.

Optional features come last.
