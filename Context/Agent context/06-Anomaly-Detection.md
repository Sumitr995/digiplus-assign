# Anomaly Detection

## Hard rule

The AI model never decides whether an entry is anomalous.

The anomaly engine is deterministic and hand-written.

## Scoring

Each rule returns zero or more:

```text
(reasonCode, subScore)
```

Final score:

```text
maxSubScore + 0.25 * sum(otherSubScores)
```

Clamp to `100`.

Flag when:

```text
score >= 50
OR
a hard-flag rule fires
```

Persist one `Anomaly` per flagged log entry.

## R1 — Rate burst

Reason code:

```text
RATE_BURST
```

For each source IP, count requests inside a rolling 10-minute window.

Default threshold:

```text
8 requests / 10 minutes
```

Score:

```text
min(100, (count / threshold) * 60)
```

Expected ground truth:

```text
15.6.62.53 -> 49 occurrences
```

## R2 — Error burst

Reason code:

```text
ERROR_BURST
```

Only evaluate IPs with at least 3 requests in a 10-minute window.

Flag when:

```text
4xx + 5xx fraction >= 0.6
```

Score:

```text
fraction * 70
```

## R3 — Rare categorical values

Reason codes:

```text
RARE_LOCATION
RARE_USER_AGENT
```

Compute full-dataset frequency for `Location` and `User_Agent`.

Flag when:

```text
frequency < 1% of total rows
```

Score:

```text
100 * (1 - frequency / 0.01)
```

Clamp fired rarity scores to `[40, 100]`.

Expected ground truth:

```text
North Korea = 10 / 10,000 = 0.1%
```

## R4 — Session anomaly

Reason code:

```text
SESSION_ANOMALY
```

### Multi-IP session

If one session appears from more than one source IP:

- hard flag;
- score = 90;
- reason includes number of distinct IPs.

### High-volume session

Compute the 99th percentile session count during ingestion.

Flag sessions at or above p99.

Score:

```text
min(100, (count / p99) * 60)
```

## Deterministic reason summary

The backend must generate the human-readable summary.

Example:

```text
IP 15.6.62.53 sent 49 requests in a 10-minute window (threshold: 8).
```

AI may expand this later, but it must not replace the deterministic reasoning.

## Config

Put thresholds in:

```text
backend/src/config/rules.config.js
```

```js
module.exports = {
  RATE_BURST_WINDOW_MIN: 10,
  RATE_BURST_THRESHOLD: 8,
  ERROR_BURST_WINDOW_MIN: 10,
  ERROR_BURST_MIN_SAMPLE: 3,
  ERROR_BURST_FRACTION: 0.6,
  RARITY_THRESHOLD: 0.01,
  SESSION_VOLUME_PERCENTILE: 0.99,
  FLAG_THRESHOLD: 50
};
```

## Verification

Before integration, verify:

- `15.6.62.53` is flagged with `RATE_BURST`.
- A majority of the 10 `North Korea` rows are flagged with `RARE_LOCATION`.
- Any multi-IP session is surfaced as `SESSION_ANOMALY`.
