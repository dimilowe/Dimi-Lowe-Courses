# Local Postgres Setup

This repo now supports a plain local Postgres database for local development.

## 1. Copy local env values

Set your local `.env` like this:

```env
DATABASE_URL_DEV=postgresql://postgres:postgres@localhost:5432/dimi_lowe_courses
DATABASE_URL_PROD=your-hosted-production-url
```

`DATABASE_URL_DEV` is what local `next dev` uses by default.

## 2. Start Postgres

```bash
npm run db:local:start
```

This starts Docker Postgres on `localhost:5432`.

## 3. Run migrations

```bash
npm run db:migrate:dev
```

## 4. Start the app

```bash
npm run dev
```

## Useful commands

```bash
npm run db:local:logs
npm run db:local:stop
npm run db:local:down
```

## Environment model

- Local laptop: `DATABASE_URL_DEV` -> local Postgres
- Replit dev: `DATABASE_URL_DEV` -> Replit dev DB
- Replit prod: `DATABASE_URL_PROD` -> Replit prod DB

GitHub should only carry code and migrations, not database state.
