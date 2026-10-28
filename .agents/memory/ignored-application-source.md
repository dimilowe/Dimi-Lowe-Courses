---
name: Ignored application source
description: Why feature-removal merges must reconcile the live filesystem with Git, not just tracked files.
---

Audit ignored and untracked application source when merging broad removals. Next.js builds routes present on disk even when Git ignores them.

**Why:** Broad artifact ignore names hid both a retired processing handler and a legitimate upload-serving handler. The long-lived Replit filesystem could therefore run code absent from a clean Git checkout, while an apparently complete feature deletion still failed to build.

**How to apply:** Root-anchor generated-output and uploaded-data ignore patterns. Check ignored source beneath application directories after removals; delete retired handlers and track legitimate store handlers. A clean Git status alone is not evidence that ignored application routes are absent.
