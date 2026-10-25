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

CI round 1 (run 40222693239, implementation 297d407): Node22/24 checks/build/tests PASS; 25/30 browser cases PASS. Five WebKit failures investigated using actual logs/traces. Dedicated reviewer identified upstream Playwright issues #42775 (setOffline bypasses service-worker responses) and #42273 (protocol reload plus SW cache writes). API route mocks were hidden by service-worker ownership. No application assertion was removed.

CI repair: user-initiated location.reload replaces protocol reload; actual dedicated HTTP server shutdown replaces offline emulation in PWA tests; only the two API-mocking tests block service workers per official routing guidance. The real multiplayer, PWA and cache-update tests retain actual SW behavior. Local Chromium suites rerun; WebKit confirmation is delegated to the actual CI runner, not assumed.

Evidence: https://github.com/microsoft/playwright/issues/42775 ; https://github.com/microsoft/playwright/issues/42273 ; https://playwright.dev/docs/network#missing-network-events-and-service-workers .

CI round 2 run40223341937: overall success, 29 first-attempt PASS and one WebKit online retry PASS. This is not a clean 30/30 first-attempt result. CI round 3 refinement: serialize WebKit project; online scenario alone has a 60s total budget for two recorded mobile contexts and polling, unchanged 7s assertion budgets; failOnFlakyTests enabled on CI. No runtime application behavior changed. This is the final bounded CI repair round.

Final CI refinement independently reviewed by review_server_ci: PASS, no functional coverage weakened. Final strict run40223718836: SUCCESS, 30/30 first-attempt browser PASS in1.3m. All blocking findings closed for the web/PWA delivery; native and hosting boundaries remain explicit.
