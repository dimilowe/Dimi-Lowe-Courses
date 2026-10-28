# Database promotion pipeline

Set `DATABASE_URL_DEV` and `DATABASE_URL_PROD` in the environment. `DATABASE_URL` is a fallback when a target-specific value is absent.

Run migrations and verification against development first:

```sh
npm run db:migrate:dev
npm run db:verify:dev
```

Then apply the reviewed migrations and verification to production:

```sh
npm run db:migrate:prod
npm run db:verify:prod
```

The migration runner reads `scripts/migrations/*.sql` and tracks checksums in `schema_migrations`. Do not edit or remove applied migrations; create a new migration for schema changes. Historical tool migrations remain for compatibility, but tool seeding and visibility scripts have been removed.

Verification checks the store's users, products, entitlements, purchases, and learner workspace. Existing subscription grants remain in the legacy entitlement tables so active subscriptions and Stripe fulfillment continue to work.

Promote code and reviewed schema changes, rather than copying the development database over production customer data. See `local-postgres.md` for local setup.
