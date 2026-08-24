# Tech Stack

The stack is intentionally boring because the build is time-boxed.

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast development loop |
| Backend | Node.js + Express | Known stack, minimal setup |
| Database | MongoDB Atlas M0 | No local DB installation |
| ODM | Mongoose | Simple schema/persistence layer |
| Validation | Hand-written validation; `zod` only if already fast | Avoid setup overhead |
| CSV parsing | `csv-parse` or equivalent | Reliable CSV ingestion |
| Upload | `multer` | Multipart CSV upload |
| AI | Anthropic Claude API | Single small explanation module |
| Data fetching | `fetch` or `axios` | No TanStack Query ceremony |
| Styling | Plain CSS or Tailwind | Choose whichever is already faster |
| Language | JavaScript by default | Avoid TypeScript overhead in a 3-hour build |
| Deployment | Local submission is acceptable | Render + Vercel only if time permits |
| Containers | None | Docker is explicitly out of scope |

## Consistency rule

Backend and Frontend must use the same language choice. Do not let one agent independently switch the project to TypeScript.

## Non-goals

- Docker / docker-compose
- authentication
- multi-tenancy
- complex state-management libraries
- streaming anomaly infrastructure
- ML model for anomaly detection
- eager AI generation for every anomaly
