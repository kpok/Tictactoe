# Independent council evidence

DEC-PLAY-READY-001: first Android Internal Testing versus public production. Baseline remote08403ebb1e1b923b552a0edb5f27e530d0ce57f7; runtime a9e5a70076fa7b7619cd56c019b311ec6b0efc67. Four independent read-only specialists.

- release_game_review: ACCEPT WITH CONDITIONS for Internal Testing; public HOLD. 17 engine/i18n tests,1000 games/13188 roundtrips/621 legal AI moves,11 Chromium game E2E PASS. Findings GAME001/002 map RR04.
- release_android_review: ACCEPT WITH CONDITIONS internal, HOLD public. Python17 and focused Node5 PASS. AND01→RR03; AND02→RR01; AND03→RR07; AND04→RR04/RR08. Root actual artifact inspection found no.so in AAB/APKs, removing speculative NDK alignment concern.
- release_security_review: ACCEPT WITH CONDITIONS internal, public not ready. Policy and16 tests PASS; production audit0/full3 moderate nodes in one dev chain; limiter proxy experiment confirmed. SEC001→RR05; SEC002→RR06; SEC003→RR09; SEC004→RR04.
- release_play_ads_review: ACCEPT WITH CONDITIONS internal, NOT READY public. Official primary sources checked. PLAY001→RR01; PLAY002→RR02; PLAY003→RR03; PLAY004→RR04.

Round2 cross-role synthesis confirmed by game, Android and Play specialists; security final report explicitly accepted same boundary. No substantiated remaining disagreement. Votes are advisory; external account configuration and physical acceptance are still unverified. Review complete does not mean production ready. No application fixes were silently claimed; findings remain open as recorded in the report.

Final report accuracy check: release_play_ads_review read docs/RELEASE_REVIEW_2026-10-28.md and returned PASS in Play/ads/privacy scope. Confirmed internal exception versus privacy obligations, evidence gaps versus defects, optional child ads, and account-dependent closed test. No substantive correction.
