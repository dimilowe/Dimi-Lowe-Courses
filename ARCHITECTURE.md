# Store architecture

VCM Suite is a product store built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and Stripe. Its catalog supports subscriptions, courses, apps, downloads, templates, freebies, bundles, and other product types.

- `app/store` and the category pages browse public catalog products. The store includes every public product type, including types outside its preferred display order.
- `app/products` and `app/product` present catalog and CMS product pages.
- `app/api/checkout`, `app/api/subscribe`, billing routes, and Stripe webhooks handle purchases and recurring plans.
- `lib/products` handles product access, bundles, order bumps, and post-purchase offers.
- `app/courses`, `app/dashboard`, and `app/workspace` deliver entitled products, lessons, resources, notes, and homework.
- `app/admin/products` manages the catalog. Newsletter, feedback, authentication, and media uploads remain supported.

The legacy public tool platform, processing APIs, engines, tool registries, tool admin screens, workflows, and workstations have been removed. Old public tool and cloud URLs redirect to the store; removed processing APIs have no handlers.

Existing subscriptions and some offers still use `cloud_entitlements` and `cloud_entitlement_grants`. These are billing compatibility records, not public tool features. Stripe metadata and grant identifiers must remain stable for existing subscribers and delayed webhook events. Membership access applies to eligible public products with `membership` or `free` pricing; individual purchases retain their own entitlements.

Historical SQL migrations remain unchanged because the migration runner validates their checksums. Retiring application features does not delete customer records or modify deployed databases. A separate schema migration is required if obsolete tables are later removed.

Run `npm test`, `npx tsc --noEmit`, and `npm run build` to validate changes. Database commands are described in `docs/DB_PIPELINE.md`.
