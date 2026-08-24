# Problem Statement

## Assessment

**Smart Log Analyzer & Anomaly Detector — DigiPlus ACOE Technical Assessment**

Official duration: **3.5 hours**. Working target: **3 hours**.

## Core requirement

Build an application that loads and persists log entries, detects unusual entries using an algorithm designed by the team, and uses AI to explain why already-flagged entries were unusual.

The application must provide:

- persistent log storage;
- anomaly detection independent of AI;
- persisted anomaly reason/score;
- AI-generated explanation, likely root cause, and/or next step;
- list/timeline view;
- detail view;
- graceful handling of malformed input and empty datasets.

## Hard boundary

AI must **not** decide whether an entry is anomalous.

The deterministic anomaly engine decides `flagged`. AI receives the already-decided result and explains it.

## Assessment dimensions

| Area | What matters |
|---|---|
| Functionality | Working, coherent end-to-end solution |
| AI | Appropriate use, reasoning, reliability |
| Engineering | Design, code quality, maintainability |
| Data | Persistence and sensible data handling |
| UX | Clarity and usability |
| Problem solving | Technical decisions, trade-offs, originality |

## Scope discipline

The PDF's inline sample data is illustrative only. The real target is the supplied 10,000-row `log-data.csv`.
