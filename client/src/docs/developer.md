# René API Documentation

## Overview
René is a philosophical matching API that compares user responses to a curated set of philosophers across six philosophical axes.

## Base URL
Production: `https://rene-api.onrender.com`

## Authentication
None required.

## Endpoints

### `POST /assess`
Submits questionnaire answers and returns philosopher matches ranked by similarity.

#### Request Body
```json
[
  { "question_id": 1, "score": 0.75 },
  { "question_id": 2, "score": 0.30 }
]
```

**Fields:**
- `question_id` (integer) - Question identifier (1-18)
- `score` (float) - Response value between 0.0 and 1.0

#### Response
```json
[
  {
    "philosopher": {
      "name": "Plato",
      "scores": {
        "epistemology": 0.85,
        "ethics": 0.62
      },
      "justifications": {
        "epistemology": "Plato believed that knowledge comes from rational insight..."
      }
    },
    "distance": 0.234
  }
]
```

The response is sorted by `distance` ascending (closest match first).

## Scoring
- User responses are averaged per philosophical axis
- Euclidean distance compares user profiles against philosopher profiles
- Lower distance indicates stronger philosophical alignment

## Axes
The six philosophical dimensions evaluated:
- Epistemology
- Ethics
- Metaphysics
- Aesthetics
- Political Philosophy
- Philosophy of Religion

## Rate Limiting
None currently enforced.

## Errors
Standard HTTP status codes:
- `400` - Invalid request format or question IDs
- `405` - Method not allowed
- `500` - Server error

## Example
```bash
curl -X POST https://rene-api.onrender.com/assess \
  -H "Content-Type: application/json" \
  -d '[{"question_id":1,"score":0.8},{"question_id":2,"score":0.4}]'
```