# AI Explanation

## Scope

AI is only used after deterministic anomaly detection has already flagged a log entry.

AI generates exactly three user-facing values:

- `explanation`
- `likelyRootCause`
- `recommendedNextStep`

## Module

```text
backend/src/modules/ai/aiExplainer.js
```

Keep the provider integration small: one exported async function is sufficient.

## Input

```js
{
  logEntry,
  reasonCodes,
  reasonSummary,
  score,
  contextStats
}
```

## Output

```js
{
  explanation,
  likelyRootCause,
  recommendedNextStep
}
```

## Prompt contract

The system instruction must establish that:

1. the anomaly decision is final;
2. the model must not re-evaluate anomalousness;
3. the model must explain the deterministic evidence;
4. the output must be JSON only.

Expected output:

```json
{
  "explanation": "1-3 plain-English sentences.",
  "likelyRootCause": "1-2 evidence-based sentences.",
  "recommendedNextStep": "1-2 concrete actions."
}
```

## Reliability

1. Parse JSON.
2. If parsing fails, retry once with a stricter JSON reminder.
3. If it still fails, return `502 AI_PROVIDER_ERROR`.
4. Timeout around 15 seconds.
5. Never return hard-coded text pretending it came from AI.
6. Cache the generated explanation.
7. Only `{ "force": true }` regenerates it.

## Environment

```text
ANTHROPIC_API_KEY=...
AI_MODEL=...
AI_TIMEOUT_MS=15000
```

The exact currently recommended model name should be confirmed at implementation time.

## Security / prompt boundary

Only send the flagged entry plus deterministic detection evidence.

Do not ask the model to classify the raw dataset.
