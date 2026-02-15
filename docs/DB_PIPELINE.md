# Database Promotion Pipeline (Dev -> Prod)

This project now supports target-aware DB commands with migration tracking.

## Environment Variables

Set these in Replit Secrets (or your shell):

- `DATABASE_URL_DEV`
- `DATABASE_URL_PROD`

Optional fallback:

- `DATABASE_URL` (used only if target-specific variable is missing)

## Commands

### Migrations

- Dev: `npm run db:migrate:dev`
- Prod: `npm run db:migrate:prod`

Migrations are read from `scripts/migrations/*.sql` and tracked in `schema_migrations`.

### Audio tool seed

- Dev: `npm run db:seed:audio:dev`
- Prod: `npm run db:seed:audio:prod`

### Visibility sync (hidden legacy tools)

- Dev: `npm run db:sync:visibility:dev`
- Prod: `npm run db:sync:visibility:prod`

### Verification

- Dev: `npm run db:verify:dev`
- Prod: `npm run db:verify:prod`

## Recommended Promotion Flow

0. Pull latest code first:
   - `git pull origin main`
1. Run on dev:
   - `npm run db:migrate:dev`
   - `npm run db:seed:audio:dev`
   - `npm run db:sync:visibility:dev`
   - `npm run db:verify:dev`
2. Run on prod:
   - `npm run db:migrate:prod`
   - `npm run db:seed:audio:prod`
   - `npm run db:sync:visibility:prod`
   - `npm run db:verify:prod`
3. Deploy app.

## Notes

- Do not copy the full dev DB to prod.
- Only promote schema migrations + controlled seed scripts.
- If a migration SQL file is edited after apply, checksum validation will fail. Create a new migration instead.
