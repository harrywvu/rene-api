# René Developer Guide

## Overview
René is a philosophical matching app with a Vite + React client and a Go REST API backed by PostgreSQL. The questionnaire spans 6 axes and 18 questions, and the seed data contains philosopher profiles scored across the same axis set.

## Repository Layout
- `client/` - Vite frontend that renders the questionnaire, request preview, result view, and docs section.
- `server/` - Go API, seed CLI, migrations, and scoring logic.
- `server/assets/` - static assets used by the backend.

## Local Development

### Client
```bash
cd client
npm install
npm run dev
```

The Vite dev server proxies `/assess` to `http://localhost:8080` when `VITE_API_BASE_URL` is not set. If `VITE_API_BASE_URL` is defined, the client sends requests directly to that host instead.

### Server
```bash
cd server
go run ./cmd/api
```

The API requires `DSN` and optionally accepts `CORS_ALLOWED_ORIGINS` and `PORT`.

### Seed Data
```bash
cd server
go run ./cmd/seed
```

The seed command reads the JSON files in `server/cmd/seed/`, loads the canonical axes, questions, and philosophers, and upserts them into PostgreSQL.

## Environment Variables
- `DSN` - PostgreSQL connection string used by the API and seed CLI.
- `PORT` - server listen port; defaults to `8080`.
- `CORS_ALLOWED_ORIGINS` - comma-separated browser origins accepted by the API. Wildcards are allowed, such as `https://*.vercel.app`.
- `VITE_API_BASE_URL` - optional frontend override for the API host. Leave unset in local development to use the Vite proxy.

## API Contract

### `POST /assess`
Request body:
```json
[
  { "question_id": 1, "score": 1 },
  { "question_id": 2, "score": 0 }
]
```

Each item is a submitted answer with:
- `question_id` - numeric identifier from the questions table.
- `score` - user position on the `0.0` to `1.0` scale.
- Only the discrete values `0`, `0.25`, `0.5`, `0.75`, and `1` are accepted.

The API expects the full questionnaire payload and rejects duplicate, missing, or unknown question IDs.

Response body:
```json
[
  {
    "philosopher": {
      "name": "Plato",
      "scores": {
        "epistemology": 0.15
      },
      "justifications": {
        "epistemology": "..."
      }
    },
    "distance": 0.123
  }
]
```

The response is sorted from closest match to farthest match. The backend currently returns the top-ranked philosophers produced by Euclidean distance across the available axes.

## Scoring Flow
1. The API loads question-to-axis mappings from PostgreSQL.
2. User answers are averaged per axis to build a profile.
3. Each philosopher profile is compared against the user profile.
4. Distances are sorted ascending and returned to the client.

## Data Model
- `philosophers` stores the philosopher names.
- `axes` stores the six philosophical axes and their endpoint labels.
- `questions` stores the question text, weight, and axis foreign key.
- `philosopher_scores` stores one score and one justification per philosopher-axis pair.

The initial migration defines foreign keys from `questions.axis_id` to `axes.id` and from `philosopher_scores` to both `philosophers` and `axes`.

## Frontend Notes
- `client/src/App.jsx` holds the questionnaire state and request payload generation.
- The response view shows the ranked philosopher list, radar comparison, and per-axis justifications.
- The docs section renders directly from `client/src/docs/developer.md`, so that file is the source of truth for developer-facing documentation.

## Deployment Notes
- The client is deployed on Vercel and the API on Render.
- The API must allow the deployed client origin through CORS. The current server defaults include local Vite origins and `*.vercel.app`.
- If you use a custom frontend domain, add it to `CORS_ALLOWED_ORIGINS` on Render.

## Operational Behavior
- Requests to `POST /assess` are rate limited per client IP.
- Slow requests are terminated with a timeout rather than hanging indefinitely.
- JSON bodies are parsed strictly so unknown fields are rejected instead of ignored.

## Verification
```bash
cd server
go test ./...
```

```bash
cd client
npm run build
```

## Maintenance
- Keep this document aligned with the README and the seed data when axes, questions, environment variables, or deployment targets change.
- Update the markdown first, then the docs section in the client will pick up the new content automatically on the next build.
