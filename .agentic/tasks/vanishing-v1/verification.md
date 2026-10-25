# Verification — 2026-10-25

Environment Node 24.22.1, npm, Playwright pinned 1.56.1. Tested implementation includes shared FIFO engine, browser/worker UI and authoritative HTTP service.

- npm ci --ignore-scripts: PASS; locked dependencies install.
- npm run check: PASS.
- npm test: 18/18 PASS (rules, all win lines, immutability, FIFO false-win regression, real 22-ply repetition, AI tactics, storage validation, random invariant runs, HTTP auth/replay/concurrency/revision/rematch/expiry/body/origin/rate/static).
- npm run build: PASS, self-contained dist.
- npm run test:e2e -- --project=chromium --project=mobile-chromium: 20/20 PASS, 29.9s. Includes actual two-context game/reconnect/rematch, offline resume, stale poll and SW-update regressions.
- UI visual QA: desktop1440 and Pixel7 screenshots inspected; fixed an untranslated new-round button and reduced mobile intro height after inspection. Label-only/responsive changes require final focused browser confirmation/CI.
- WebKit binary downloaded; local launch BLOCKED by unavailable system libraries. CI installs dependencies and runs iPhone/WebKit project. Do not report local WebKit PASS.
- Docker: NOT RUN, Docker CLI unavailable.
- Android/iOS native: NOT RUN; no native SDK/signing/release projects. Capacitor config is preparation only. Native multiplayer integration remains required as documented in docs/MOBILE.md.
- Public hosting: NOT DEPLOYED. Full web online works only when both clients access the same running Node service; static hosting supports local/AI only.

GitHub Actions verification will be recorded with actual run status after main upload; no result assumed before observation.
