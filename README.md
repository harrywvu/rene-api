# René

René is a philosophical position matching app with a React client and a Go REST API. Users answer a set of questions scored on a `0.0` to `1.0` scale across six philosophical axes:

- `epistemology`
- `metaphysics`
- `ethics`
- `free_will`
- `politics`
- `theology`

The API builds a user profile from those answers and ranks philosophers by Euclidean distance to return the closest matches.

Deployed API: `https://rene-api-n27j.onrender.com`

## Repository Layout

- `client/` - Vite + React frontend
- `server/` - Go API, seed CLI, migrations, and documentation

## How It Works

Each question belongs to one philosophical axis. When a user submits answers, the API:

1. Maps each answer to its axis using the question database records.
2. Computes the user’s average score per axis.
3. Compares that profile against each philosopher’s stored axis scores.
4. Calculates Euclidean distance across the six axes.
5. Sorts philosophers from closest match to farthest match.

Lower distance means a closer philosophical match.

## Client

The frontend in `client/` is a Vite app that presents the questionnaire, collects answers, and sends them to the API.

### Run the client

```bash
cd client
npm install
npm run dev
```

By default the client sends browser requests to Vite's local `/assess` proxy during `npm run dev` and `npm run preview`, which forwards them to `http://localhost:8080`. Set `VITE_API_BASE_URL` if you want it to point at another API host directly.

## API

### Environment

The API reads a single required environment variable:

- `DSN`: PostgreSQL connection string

The API also accepts:

- `CORS_ALLOWED_ORIGINS`: comma-separated list of allowed browser origins, including wildcard origins such as `https://*.vercel.app`

The server listens on `:8080` by default, or on `PORT` when set.

By default, the API allows requests from local Vite dev servers and `*.vercel.app` deployments. Set `CORS_ALLOWED_ORIGINS` on Render if you want to restrict that further or add a custom frontend domain.

### Run

```bash
cd server
go run ./cmd/api
```

### Endpoint

#### `POST /assess`

Submits an array of answers and returns philosophers ranked by distance from the user’s profile.

Request body:

```json
[
  { "question_id": 1, "score": 1 },
  { "question_id": 2, "score": 0 }
]
```

Each answer contains:

- `question_id`: the numeric question identifier
- `score`: the user’s score for that question

Response:

```json
[
  {
    "philosopher": {
      "name": "Plato",
      "scores": {
        "epistemology": 0.15,
        "metaphysics": 0.08,
        "ethics": 0.12,
        "free_will": 0.5,
        "politics": 0.18,
        "theology": 0.22
      },
      "justifications": {
        "epistemology": "Plato epistemology text",
        "metaphysics": "Plato metaphysics text",
        "ethics": "Plato ethics text",
        "free_will": "Plato free will text",
        "politics": "Plato politics text",
        "theology": "Plato theology text"
      }
    },
    "distance": 0.123
  }
]
```

The response is sorted from closest match to farthest match.

## Data Model

The database contains:

- `philosophers`
- `axes`
- `questions`
- `philosopher_scores`

`philosopher_scores` stores one `score` and one `justification` per philosopher-axis pair.

### Axes

- `epistemology`: Rationalism → Empiricism
- `metaphysics`: Idealism → Materialism
- `ethics`: Moral Realism → Moral Relativism
- `free_will`: Hard Determinism → Libertarian Free Will
- `politics`: Authoritarianism → Libertarianism
- `theology`: Strong Theism → Strong Atheism

## Questionnaire

The question bank from `server/questions.md` is grouped by axis.

### EPISTEMOLOGY

1. The most reliable way to gain knowledge is through direct sensory observation and experimentation, not pure reasoning alone.
2. A claim should be accepted only if it can be tested and confirmed through observable evidence.
3. There are no meaningful truths we can arrive at through reason alone, independent of any experience.

### METAPHYSICS

1. Physical matter and energy are all that fundamentally exist; consciousness and thought are products of the brain.
2. Even our most private mental experiences - emotions, memories, imagination - are ultimately reducible to physical processes.
3. A complete scientific account of the universe would not need to invoke any non-physical entities or forces.

### ETHICS

1. Moral judgments such as 'slavery is wrong' are only true relative to a given culture or historical period, not universally.
2. There are no moral facts 'out there' in the world waiting to be discovered; moral values are constructed by societies.
3. Two societies with opposing moral codes are not in genuine disagreement about moral truth - they simply have different practices.

### FREE WILL

1. People are the genuine originators of their own choices, in a way that cannot be fully explained by prior causes.
2. Even if scientists could perfectly map your brain, they would still be unable to predict every decision you make.
3. Moral responsibility requires that a person could truly have done otherwise, and I believe humans genuinely have this capacity.

### POLITICS

1. Individuals should be free to make their own choices about their lives as long as they do not harm others.
2. Centralized government control over the economy and personal behavior tends to produce worse outcomes than voluntary cooperation.
3. Most laws that restrict what consenting adults do with their own bodies or property are unjustified intrusions.

### THEOLOGY

1. The existence of the universe and life within it can be fully explained without invoking any god or supernatural designer.
2. Religious experiences and personal testimonies of divine encounters are more likely explained by psychology than by the existence of a deity.
3. There is no compelling evidence that would justify believing in any god, and the default rational position is disbelief.

### Choices

`[SD][D][N][A][SA]`

## Schema Snapshot

The schema snapshot from `server/schema.md` is below.

### philosophers

| id | name      |
| -- | --------- |
| 1  | Plato     |
| 2  | Aristotle |
| 3  | Kant      |

### axes

| id | name         | low_label   | high_label  |
| -- | ------------ | ----------- | ----------- |
| 1  | epistemology | Rationalism | Empiricism  |
| 2  | metaphysics  | Idealism    | Materialism |
| 3  | ethics       | Realism     | Relativism  |

### philosopher_scores

| philosopher_id | axis_id | score | justification               |
| -------------- | ------- | ----- | --------------------------- |
| 1              | 1       | 0.15  | Plato epistemology text     |
| 1              | 2       | 0.08  | Plato metaphysics text      |
| 1              | 3       | 0.12  | Plato ethics text           |
| 2              | 1       | 0.42  | Aristotle epistemology text |
| 2              | 2       | 0.58  | Aristotle metaphysics text  |

## Project Structure

- `cmd/api/main.go` - server entrypoint
- `cmd/seed/main.go` - seed CLI that loads axes, questions, and philosophers from JSON
- `internal/db/db.go` - `pgxpool` connection setup
- `internal/models/models.go` - domain types
- `internal/handlers/assess.go` - `POST /assess` handler
- `internal/scoring/scoring.go` - profile computation, distance calculation, and ranking
- `migrations/` - SQL migrations

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd René/server
```

### 2. Configure the database

Create a `.env` file in `server/` and set your PostgreSQL connection string:

```env
DSN=postgresql://user:password@host:5432/dbname?sslmode=require
```

The API reads `DSN` from the environment, so source the file or export the variable in your shell before running the commands below.

### 3. Run migrations

Use `golang-migrate` to apply the SQL files in `migrations/`:

```bash
migrate -path migrations -database "$DSN" up
```

### 4. Seed the database

Load the axes, questions, and philosophers from the seed JSON files:

```bash
go run ./cmd/seed
```

### 5. Start the API

```bash
go run ./cmd/api
```

## Deployment

The app is deployed as two separate services:

- Client on Vercel
- API on Render

Deploy the API first so you have the final service URL for the client build.

### Client on Vercel

Use the `client/` directory as the Vercel root.

Set:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: leave default or `npm install`

Add this environment variable in Vercel:

- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

Important:

- `VITE_API_BASE_URL` is baked into the client at build time.
- If you change it in Vercel, redeploy the client.
- Do not point it at `localhost` in production.

If you use Vercel preview deployments and want them to call the Render API too, set the same `VITE_API_BASE_URL` value for the Preview environment as well.

### API on Render

Use the `server/` directory as the Render root.

Set:

- Build Command: `go build -o bin/api ./cmd/api`
- Start Command: `./bin/api`

Required environment variables on Render:

- `DSN=postgresql://user:password@host:5432/dbname?sslmode=require`
- `CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app`

Optional if you want Vercel preview deployments to work without updating Render each time:

- `CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app,https://*.vercel.app`

Notes:

- `https://*.vercel.app` is convenient for preview deployments, but it allows any Vercel-hosted site to call the API from the browser.
- If you want a tighter policy, keep only the exact production Vercel origin.
- Render provides `PORT` automatically; the server already listens on it.
- The API also exposes `GET /healthz` for service checks.

### Deployment order

1. Deploy the Render API.
2. Copy the Render service URL.
3. Put that URL into Vercel as `VITE_API_BASE_URL`.
4. Deploy the Vercel client.
5. If the client still gets CORS errors, check that `CORS_ALLOWED_ORIGINS` matches the exact browser origin shown in the address bar.

## Tech Stack

- Go
- Gin
- PostgreSQL on Neon
- Render deployment
