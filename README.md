# René Monorepo

This repository now has two parts:

- `server/`: Go API
- `client/`: Vite + React frontend

## Server

The API lives in `server/` and exposes `POST /assess` on port `8080`.

## Client

The frontend will live in `client/` and talk to the API over HTTP.

## Local development

Run the server:

```bash
cd server
go run ./cmd/api
```

Run the client:

```bash
cd client
npm install
npm run dev
```
