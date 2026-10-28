# VCM Suite store

This application sells subscriptions, courses, apps, downloads, templates, freebies, bundles, and other products. It is built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Stripe.

See `ARCHITECTURE.md` for the current structure and billing compatibility requirements. The former free-tool platform and its media-processing workers have been removed. Do not reintroduce tool registries, public processing endpoints, or workstation features as part of store maintenance.

Public browsing does not require an account. Purchases, free claims, membership access, and course delivery use product entitlements. Workspace is the learner file locker for course resources, notes, and homework.

Use the existing light theme and shared components. Preserve authentication, payments, fulfillment, and existing customer access when changing shared code.

Run `npm run dev` locally. Replit runs the same application on port 5000 using Node; no Python or media-processing packages are required. Configure database, Stripe, storage, session, and email settings through environment secrets.

Historical migrations must remain unchanged after deployment because their checksums are validated. No customer data is deleted by removing retired features from the application.
