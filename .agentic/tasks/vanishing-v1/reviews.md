# Review ledger

Plan: independent plan_review, PASS. Identified CI replacement, API cache exclusion, stale async guards and two-party rematch as required verification points.

Implementation reviewers (did not author or edit code): review_game_ui and review_server_ci.

Round 1 UI: CHANGES_REQUIRED.
- UI-001: cache-first unchanged SW could retain obsolete JS indefinitely. FIX: network-first public assets, canonical cache keys, no API/auth caching. Verified by test changing a real temporary server's CSS, then offline reuse.
- UI-002: obsolete room poll error could clear replacement session. FIX: generation increment on room creation/join, auth identity and poll tickets for both success/error. Delayed-404 regression passes.
- UI-003: leaving online retained invite URL and forced online on reload. FIX: strip invite parameter on all mode exits. Reload regression passes.

Round 2 UI: PASS. Reviewer independently ran the three new Chromium regression scenarios, 3/3 passed. Optional focus suggestion also implemented: focus proceeds to a legal square.

Server/CI: PASS. Reviewer independently ran syntax, build, 17 then-current unit/HTTP tests and listed Playwright tests. No substantive security blocker. SC-001 optional residual: create/join do not have idempotent receipts; losing a join response may require creating a new room. Move/rematch retries are idempotent. SC-002 fixed: manual online contexts now use project device settings and record video; runner itself supplies traces. An attempted redundant manual tracing.start caused a test-harness failure and was removed; full Chromium suites subsequently passed.

No review establishes public deployment, native release, store acceptance, stress-test performance or business viability.
