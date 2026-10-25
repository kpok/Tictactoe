# Council decisions

2026-10-25. Baseline 0c7fa98. Actual independent roles: game_council and online_council. A fresh plan reviewer returned PASS. Votes are advisory, not proof of runtime correctness.

- DEC-001, accepted for implementation: shared deterministic native ES modules rather than introducing a framework for one game screen. React and modern Angular remain valid alternatives. The small incomplete Angular skeleton is retired; historical sources remain in Git. No need for a raster asset generator for geometric marks and the CSS/SVG visual system.
- DEC-002, accepted: atomic removal before win evaluation; only initially empty squares legal; ordered queues + turn for threefold repetition; 100-ply limit; win precedes draw. Historical win-before-removal behavior is a defect, not compatibility to preserve.
- DEC-003, accepted: original midnight navy/mint/coral identity, oldest-mark dashed border and age numbers, reduced motion, keyboard buttons, PL/EN, quick rematch and alternating starter. Daily puzzles deferred to keep the user's disappearing-mark game central.
- DEC-004, accepted with limits: private two-seat rooms with same-origin HTTP polling; random secret seat tokens distinct from invite code, revision checks/idempotent mutations, both players accept rematch. In-memory single process, expiry and limits. No accounts/chat/matchmaking or cloud provisioning. Internet play requires a separately deployed HTTPS server.
- DEC-005, accepted: bounded AI in worker, three difficulties, no claim of unbeatable play.
- DEC-006, user instruction: write verified changes directly to main (supersedes initial branch/PR handoff plan). CI build + tests and Playwright required. No merge approval gate or deployment inferred.

Conditions retained: test FIFO false-win regression, stale worker cancellation, HTTP replay/revision/auth cases, two isolated browser sessions, offline API cache exclusion. Signing and native store release remain explicitly unverified and incomplete.
