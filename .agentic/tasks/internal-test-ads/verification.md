# Verification

Local 2026-10-28 reviewed working tree:
- npm run check: PASS (syntax and 12 owner-only workflow job policy).
- npm test: PASS 42 tests, including profile validation, artifact mismatch and workflow mutation rejection.
- python3 -m unittest discover -s test -p '*_test.py': PASS 17 tests after ADS-001 fix; reviewer independently confirmed.
- npm run build: PASS.
- git diff --check: PASS.
- Initial focused Playwright invocation could not launch because browser binaries were missing; installing official Chromium before retry. Not an app-test failure.

Pending remote CI: actual generated release/debug BuildConfig, decoded AAB App ID, full Playwright, native unit tests, emulator and release update. No physical ad/network/UMP test or Play upload performed. Account setup instructions are in docs/ADS.md.
