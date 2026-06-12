# René

## Project description
René is a philosophical matching app with a React client and a Go REST API. Users answer a questionnaire scored on a `0.0` to `1.0` scale across six philosophical axes:

- `epistemology`
- `metaphysics`
- `ethics`
- `free_will`
- `politics`
- `theology`

The API averages the submitted answers by axis, compares the user profile to each philosopher profile, and returns ranked matches by Euclidean distance.

## Installation

### Prerequisites
- Go 1.25+
- Node.js 18+
- PostgreSQL

### Server
```bash
cd server
go run ./cmd/api
```

Required environment variable:
- `DSN`: PostgreSQL connection string

Optional environment variables:
- `PORT`: server listen port, defaults to `8080`
- `CORS_ALLOWED_ORIGINS`: comma-separated allowed browser origins, including wildcards such as `https://*.vercel.app`

### Client
```bash
cd client
npm install
npm run dev
```

Optional frontend environment variable:
- `VITE_API_BASE_URL`: API base URL for direct browser requests

### Seed data
```bash
cd server
go run ./cmd/seed
```

## Usage examples

### Run the client locally
The Vite dev server proxies `/assess` to `http://localhost:8080` when `VITE_API_BASE_URL` is not set.

### Call the API directly
```bash
curl -X POST http://localhost:8080/assess \
  -H "Content-Type: application/json" \
  -d '[{"question_id":1,"score":1},{"question_id":2,"score":0}]'
```

### Deployed setup
- Client: Vercel
- API: Render

The API must allow the deployed client origin through CORS.

## License
No license has been declared in this repository. Add one before distributing the project publicly.

## Contribution policy
No formal contribution policy is defined. If you make changes:
- keep the client, server, and docs in sync
- add or update tests where behavior changes
- update deployment notes when env vars or origins change

## Warranty disclaimer
This software is provided without warranty of any kind, express or implied. Use it at your own risk.

## Security reporting
If you find a security issue, do not open a public issue with exploit details. Contact the repository owner privately and include:
- the affected endpoint or file
- the impact
- steps to reproduce
- any suggested mitigation

