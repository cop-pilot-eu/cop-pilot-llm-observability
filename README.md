# cop-pilot-llm-observability

The LLM Observability & Explainability Dashboard is a web-based monitoring and analytics interface that supports both operational oversight and explainability requirements of LLMs. It provides transparent, real-time monitoring of LLM usage and AI-judged quality metrics; enabling its users (such as LLM admins/operators) to monitor LLM quality metrics, reasoning chains, and assess model outputs against expected behaviour.

## Repository Structure

This monorepo contains three services that work together:

```
cop-pilot-llm-observability/
├── frontend/          # Nuxt 3 (Vue) observability dashboard
├── backend/           # NestJS API — event ingestion, evaluation orchestration, metrics
└── data-analytics/    # Python FastAPI service — LLM-as-judge evaluation engine
```

## Services

### Frontend (`frontend/`)

A Nuxt 3 (Vue) single-page application that renders the observability dashboard. Displays agent event timelines, LLM quality metrics, reasoning chains, and evaluation results. Runs on `http://localhost:3000`.

**Tech stack:** Nuxt 3, Vue 3, TypeScript, ECharts, Nuxt UI

### Backend (`backend/`)

A NestJS (TypeScript) REST API that acts as the central hub. It ingests agent events from upstream systems, triggers async evaluation requests to the data-analytics service (LLM judge), stores results in PostgreSQL, and exposes metrics endpoints consumed by the frontend. Runs on `http://localhost:3001`.

**Tech stack:** NestJS, TypeScript, TypeORM, PostgreSQL 18, pnpm

**Key endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agent-events` | Ingest a new agent event; triggers async evaluation |
| `GET` | `/agent-events/agents` | List all agent IDs |
| `GET` | `/agent-events/agent/:id` | Get summary and metrics for an agent |
| `GET` | `/judgements/:uuid` | Get evaluation status or result |
| `PATCH` | `/judgements/:uuid/vote` | Submit user feedback on an evaluation |

### Data Analytics (`data-analytics/`)

A Python FastAPI service that implements the LLM-as-judge evaluation logic. Receives agent conversation data from the backend, evaluates LLM responses against quality criteria, and returns structured judgement results. Runs on `http://localhost:8000`.

**Tech stack:** Python 3.11, FastAPI, uv

## Getting Started

Each service has its own setup instructions — see the README in each subdirectory:

- [backend/README.md](backend/README.md)
- [data-analytics/README.md](data-analytics/README.md)
- [frontend/README.md](frontend/README.md)

### Typical local startup order

1. **Data analytics** — `fastapi dev main.py` (port 8000)
2. **Backend** — start PostgreSQL (`pnpm run services:start`), run migrations (`pnpm run typeorm:run`), then `pnpm run start:dev` (port 3001)
3. **Frontend** — `pnpm dev` (port 3000)

## Docker

Each service ships a `Dockerfile` for container-based deployment. Images are tagged as:

| Service        | Image                                                      |
| -------------- | ---------------------------------------------------------- |
| Frontend       | `cop-pilot-eu/cop-pilot-llm-observability-fe:0.1.0`        |
| Backend        | `cop-pilot-eu/cop-pilot-llm-observability-be:0.1.0`        |
| Data Analytics | `cop-pilot-eu/cop-pilot-llm-observability-analytics:0.1.0` |
