# Data Model

## Raw dataset

The real dataset contains 10,000 rows.

| Raw column | Meaning |
|---|---|
| `Timestamp` | Timestamp, minute cadence |
| `IP_Address` | Source IP |
| `Request_Type` | GET / PUT / POST / DELETE |
| `Status_Code` | 200 / 301 / 403 / 404 / 500 |
| `User_Agent` | Browser/bot category |
| `Session_ID` | Repeating numeric session identifier |
| `Location` | Geographic location |

## Application mapping

| Application field | Source / derivation |
|---|---|
| `timestamp` | `Timestamp` |
| `source` | `IP_Address` |
| `eventType` | `Request_Type` |
| `severity` | Derived from `Status_Code` |
| `statusCode` | `Status_Code` |
| `userAgent` | `User_Agent` |
| `sessionId` | `Session_ID` |
| `location` | `Location` |

### Severity mapping

```text
500 -> critical
403 / 404 -> medium
301 -> low
200 -> info
```

There is no literal severity column in the real dataset.

## Required Mongo models

### LogEntry

```text
id
timestamp
source
eventType
severity
statusCode
userAgent
sessionId
location
flagged
createdAt
```

### Anomaly

```text
id
logEntryId -> LogEntry
score
reasonCodes[]
reasonSummary
ruleVersion
createdAt
```

### Explanation

```text
id
anomalyId -> Anomaly
explanation
likelyRootCause
recommendedNextStep
model
generatedAt
```

## Ground-truth signals

The dataset analysis identified:

- `North Korea`: 10 rows / 10,000 = 0.1%, making it a strong rarity signal.
- IP `15.6.62.53`: 49 occurrences, making it a rate/burst signal.
- Session IDs repeat unevenly and can support session-volume / multi-IP analysis.

Do not fabricate request paths in the UI; the dataset does not contain them.
