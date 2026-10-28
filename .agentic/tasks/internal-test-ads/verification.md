# Verification

Local 2026-10-28 reviewed working tree:
- npm run check: PASS (syntax and 12 owner-only workflow job policy).
- npm test: PASS 42 tests, including profile validation, artifact mismatch and workflow mutation rejection.
- python3 -m unittest discover -s test -p '*_test.py': PASS 17 tests after ADS-001 fix; reviewer independently confirmed.
- npm run build: PASS.
- git diff --check: PASS.
- Initial focused Playwright invocation could not launch because browser binaries were missing; installing official Chromium before retry. Not an app-test failure.

Pending remote CI: actual generated release/debug BuildConfig, decoded AAB App ID, full Playwright, native unit tests, emulator and release update. No physical ad/network/UMP test or Play upload performed. Account setup instructions are in docs/ADS.md.

## Final CI evidence

https://github.com/kpok/Tictactoe/actions/runs/40751579227 — SUCCESS, runtime revision a9e5a70076fa7b7619cd56c019b311ec6b0efc67.

- Node22 and24: 42 Node tests, 17 Python tests, syntax/workflow policy/build PASS.
- Android packages/native unit tests: SUCCESS. Actual BuildConfig test-only release, disabled debug/Families and AAB App ID check PASS; actual release manifest privacy/permission check PASS; debug merged APK privacy check PASS.
- Playwright: 84 passed (desktop Chromium, mobile Chromium, iPhone WebKit), including initial test profile age UI; no flaky retry accepted.
- Android real emulator: OK (5 tests), strict result gate passed.
- Disposable release signing/update: SUCCESS, 1001 to1002 preserves Tagalog, local game and center O; further X move works offline. These separate upgrade packages retain their intentionally disabled ad profile.
- Local focused ads browser suite after installing Chromium: 12/12 PASS.

Owner clarification: no package has ever been uploaded to Google Play yet. First bootstrap may use version_code=1, publish=false, followed by manual Console Internal Testing upload after signing setup. No existing Play install is assumed. No credentials/variables/accounts were created or changed; no live ads or Play upload performed. Real AdMob App ID, published UMP messages and physical network ad/consent acceptance remain owner steps in docs/ADS.md; CI does not prove ad serving.
