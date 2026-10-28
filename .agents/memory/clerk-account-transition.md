---
name: Clerk account transition
description: Why Clerk sign-in preserves historic store accounts and how to communicate the transition.
---

Keep historic store account IDs as the owners of purchases, subscriptions, and workspace content instead of replacing them with Clerk IDs. Existing customers establish a Clerk account using their original purchase email; old passwords were not imported.

**Why:** Changing the sign-in provider must not rewrite ownership or disconnect customers from paid products. Linking requires a verified email, not a browser-supplied account ID. Once linked, account ownership must remain stable through subsequent email changes.

**How to apply:** Preserve this continuity when changing identity resolution, billing, or account settings. Explain the first-time Clerk signup requirement when answering access questions from existing customers.

Pre-transition authenticated sessions may finish their original lifetime rather than signing everyone out immediately.

**Why:** This transition intentionally avoids interrupting already-authenticated customers.

**How to apply:** Treat removing legacy-session support as a separate, deliberate cutoff; do not delete customer records or purchase history as auth cleanup.
