## Backend Setup

1. Install dependencies:
	npm install
2. Copy `.env.example` to `.env` and fill required values.
3. Run in development:
	npm run dev

## Health Endpoints

- `GET /health/live`: liveness probe (process-level health).
- `GET /health/ready`: readiness probe (includes MongoDB readiness check).
- `GET /health`: backwards-compatible readiness response.

## Tests

- Run baseline auth/health route tests:
  npm test

## Production Run

### Direct Node

1. Set environment with `NODE_ENV=production` and required secrets.
2. Start service:
	npm run start:prod

### Docker

1. Copy `.env.production.example` to `.env.production` and set production values.
2. Build and run:
	docker compose -f docker-compose.prod.yml up -d --build
