# LLM Observability — Backend

NestJS backend for tracking and evaluating LLM/agent interactions. It ingests agent events, requests evaluations for incoming agent events from an internal LLM implementation (judge), and exposes metrics for the observability dashboard.

## Tech Stack

- **Framework:** NestJS (TypeScript) (node version in .nvmrc)
- **Database:** PostgreSQL 18 via TypeORM
- **Package Manager:** pnpm (managed via Corepack)

## Getting Started

### Prerequisites

Enable Corepack to use the exact pnpm version pinned in `package.json`:

```bash
corepack enable
```

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable             | Default                 | Description                       |
| -------------------- | ----------------------- | --------------------------------- |
| `PORT`               | `3001`                  | Port the API listens on           |
| `DATA_ANALYTICS_URL` | `http://localhost:8000` | URL of the data analytics service |
| `DB_TYPE`            | `postgres`              | Database type                     |
| `DB_HOST`            | `localhost`             | Database host                     |
| `DB_PORT`            | `5432`                  | Database port                     |
| `DB_NAME`            | `llm-observability`     | Database name                     |
| `DB_USERNAME`        | `llmobservability`      | Database user                     |
| `DB_PASSWORD`        | `llmobservability`      | Database password                 |
| `FRONTEND_URL`       | `http://localhost:3000` | Allowed CORS origin               |

### Start services

```bash
pnpm run services:start
```

This starts a local PostgreSQL instance via Docker Compose.

### Run Migrations

```bash
pnpm run typeorm:run
```

### Start the App

```bash
# Development (watch mode)
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production
pnpm run start:prod
```

The API will be available at `http://localhost:3001`.

## Database Migrations

```bash
# Generate a new migration from entity changes
pnpm run typeorm:migrate

# Run pending migrations
pnpm run typeorm:run

# Revert the last migration
pnpm run typeorm:revert
```

## Testing

```bash
# Unit tests
pnpm run test

# Unit tests in watch mode
pnpm run test:watch

# Coverage report
pnpm run test:cov

# End-to-end tests
pnpm run test:e2e
```

## API Overview

### Agent Events

| Method | Path                      | Description                                         |
| ------ | ------------------------- | --------------------------------------------------- |
| POST   | `/agent-events`           | Ingest a new agent event; triggers async evaluation |
| GET    | `/agent-events/agents`    | List all agent IDs                                  |
| GET    | `/agent-events/agent/:id` | Get summary and metrics for an agent                |

### Judgements

| Method | Path                     | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| GET    | `/judgements/:uuid`      | Get evaluation status or result       |
| PATCH  | `/judgements/:uuid/vote` | Submit user feedback on an evaluation |

## Docker

Build and run the backend as a container:

```bash
docker buildx build --platform=linux/amd64 -f Dockerfile -t cop-pilot-eu/cop-pilot-llm-observability-be:0.1.0 --no-cache .
docker run --env-file .env --name cop-pilot-llm-observability-be -p 3001:3001 cop-pilot-eu/cop-pilot-llm-observability-be:0.1.0
docker push cop-pilot-eu/cop-pilot-llm-observability-be:0.1.0
```
