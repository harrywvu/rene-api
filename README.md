# René

René is a Go REST API for philosophical position matching. Users answer a set of questions scored on a `0.0` to `1.0` scale across six philosophical axes:

- `epistemology`
- `metaphysics`
- `ethics`
- `free_will`
- `politics`
- `theology`

The API builds a user profile from those answers and ranks philosophers by Euclidean distance to return the closest matches.

Deployed API: `https://rene-api-n27j.onrender.com`

## How It Works

Each question belongs to one philosophical axis. When a user submits answers, the API:

1. Maps each answer to its axis using the question database records.
2. Computes the user’s average score per axis.
3. Compares that profile against each philosopher’s stored axis scores.
4. Calculates Euclidean distance across the six axes.
5. Sorts philosophers from closest match to farthest match.

Lower distance means a closer philosophical match.

## API Reference

### `POST /assess`

Accepts an array of answers:

```json
[
  { "question_id": 1, "score": 0.9 },
  { "question_id": 2, "score": 0.2 },
  { "question_id": 3, "score": 0.7 }
]
```

Each item includes:

- `question_id`: integer question identifier
- `score`: float value for the answer, typically between `0.0` and `1.0`

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
        "free_will": 0.50,
        "politics": 0.18,
        "theology": 0.22
      },
      "justifications": {
        "epistemology": "Plato's account of knowledge emphasizes reason and Forms.",
        "metaphysics": "Plato treats reality as fundamentally intelligible and non-material.",
        "ethics": "Plato grounds ethics in objective goodness and virtue.",
        "free_will": "Plato's view leaves room for rational agency.",
        "politics": "Plato favors a hierarchical political order ruled by the wise.",
        "theology": "Plato's theology is tied to a rational, ordered cosmos."
      }
    },
    "distance": 0.123
  }
]
```

The response is a ranked `[]PhilosopherMatch`, ordered from closest to farthest match.

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

The server listens on `:8080` by default, or on the `PORT` environment variable when set.

## Tech Stack

- Go
- Gin
- PostgreSQL on Neon
- Render deployment
