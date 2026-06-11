# René API

René is a Go API that compares a user's answers to a set of philosophers and returns the closest match first.

## Environment

The API reads a single required environment variable:

- `DSN`: PostgreSQL connection string

## Run

Start the API server on port `8080`:

```bash
go run ./cmd/api
```

## Endpoint

### `POST /assess`

Submits an array of answers and returns philosophers ranked by distance from the user's profile.

Request body:

```json
[
  {
    "question_id": 1,
    "score": 1
  },
  {
    "question_id": 2,
    "score": 0
  }
]
```

Each answer contains:

- `question_id`: the numeric question ID
- `score`: the user's score for that question

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

## Data model

The database contains:

- `philosophers`
- `axes`
- `questions`
- `philosopher_scores`

`philosopher_scores` stores one `score` and one `justification` per philosopher-axis pair.

## Axes

- `epistemology`: Rationalism → Empiricism
- `metaphysics`: Idealism → Materialism
- `ethics`: Moral Realism → Moral Relativism
- `free_will`: Hard Determinism → Libertarian Free Will
- `politics`: Authoritarianism → Libertarianism
- `theology`: Strong Theism → Strong Atheism
