# Multilingual verification

Baseline main206bc71. Implemented16 catalogs,111 keys each. Main/game rules unchanged; locale selection and metadata centralized, stored choice retained and browser languages supported.

- npm run check: PASS, now recursive through locales and E2E as well.
- npm test:22/22 PASS, including4 localization checks for exact catalog completeness, safe markup, normalization, Arabic direction, API error lookup and offline asset coverage.
- npm run build: PASS.
- Full local Chromium+mobile suite:26/26 PASS35.1s.
- Stronger offline+locale reload coverage:4/4 PASS13.1s (Tagalog survives real server outage).
- Final320px sweep:2/2 PASS8.6s (all16 languages on desktop/mobile engines). A real Tagalog scoreboard min-content overflow was found and fixed with explicit flex shrink/wrapping, not hidden by viewport clipping.
- Independent review_i18n: PASS; independently ran4 localization unit tests and diff whitespace check. Reviewed Tagalog rule semantics, RTL coordinates, state preservation, cache and markup safety.
- Screenshots: Tagalog and Arabic at320px inspected; decorative brand kept LTR, board and invite codes LTR within Arabic layout.
- Native-speaker editorial certification: not performed. Translations authored in this implementation and structurally/semantically reviewed; professional market localization may still refine wording.
- GitHub Actions: pending this implementation upload. No claim of final WebKit PASS until observed.

First GitHub run40225266286: Node22/24 success;38/39 browser PASS. WebKit identified4px Indonesian overflow at320px. Screenshot reviewed: unusually long match label plus intrinsic flex/grid minima. Fix: bounded/wrapping match label, zero tab/board track minima, explicit board width; no clipping or relaxed assertions. Final run pending.

Follow-up: 113 keys per locale including fullscreen controls. Smaller non-PL/EN headings, accessible SVG fullscreen button, native Fullscreen API with CSS fallback, Escape/external exit and safe-area landscape support. Local focused follow-up:22/22 unit and6/6 E2E PASS. Independent reviewer reported no confirmed fullscreen blocker before hitting its usage limit; final fullscreen verdict unavailable. Parent verification remains required.

Current session recheck: syntax,22 unit/API tests and build PASS. Full local browser rerun could not launch because Chromium executable is absent in the refreshed runtime (30 launch failures, not application assertions). Final browsers are therefore verified by GitHub Actions, which installs its own binaries. Runtime commit09634c397281ccacd826c49fa9b13366d05c55a2; matching local tree e83ac3054483306e7de125707d6df991f2368f66. Pages deployment40240506485 SUCCESS.

Run40240506983:44/45 PASS, including all fullscreen scenarios on all3 engines. WebKit reports stale324px scroll area immediately after Indonesian select while diagnostics find zero elements outside viewport. Follow-up waits two animation frames before measuring the new locale layout; same strict320px bound retained. This tests settled rendering rather than same-task scroll-area invalidation.

Final run40240846217 at1de9c35e5ffcf9dceeaed922b9f4d2dc34247dc7: Node22/24 PASS;44/45 E2E PASS with no flaky passes. Fullscreen6/6 PASS across Chromium, Android viewport and iPhone WebKit. Indonesian320px WebKit scrollWidth324 persists despite two-frame wait: stale-layout hypothesis NOT confirmed, synchronization adjustment did not fix issue. No main/header element bounding box crosses viewport. CSS text ink overflow/pseudo-elements remain candidates, not established causes. CI remains RED; bounded3 fix rounds ended with I18N-002 OPEN. Typography and fullscreen shipped; full multilingual acceptance incomplete.

## Tagalog follow-up
User reports Tagalog text remains oversized. New change caps Tagalog hero at22px on mobile /40px desktop, game heading17px, rules16px, dialog20px; normalizes mobile text-size-adjust to100% without disabling zoom. Added four explicit viewport regression cases (320 portrait,393 portrait,851 landscape,1280 desktop), checking heading/control/player/status font budgets, overflow, locale switching, reload and preserved game. These run on all3 CI browser projects (12 new cases). Local browsers unavailable: installation download truncated in this environment; no claim of local browser PASS. Syntax/unit/build results and CI recorded below when available.

Tagalog result at b5c16133c296b35f97155468cd1451d5931a8382: GitHub run40241467570, Node22/24 SUCCESS; new Tagalog regression cases12/12 PASS on first attempt across Chromium/mobile Chromium/iPhone WebKit. Complete browser suite56/57 PASS; existing I18N-002 Indonesian320px WebKit overflow persists. Local syntax,22/22 unit/API tests and build PASS. Chromium eventually downloaded but local launch blocked by socket permissions; no local browser PASS claimed. Manual baseline red test not executed. The mobile hero budget22px would reject the previous25px style; CI verifies corrected budgets, switching/reload and no overflow. No independent review performed for this narrow follow-up.

## Indonesian header overflow follow-up
Diagnostic run40241992161 isolated overflow to HEADER: client292/scroll310; header-actions client138/scroll156. Hiding header removes document324→320; hiding main/footer/dialogs does not. This overturns earlier game-card/scoreboard hypothesis. Patch replaces native select appearance with explicit chevron, ellipsis and bounded label painting while retaining native select behavior and full option names. New regression tests header and header-actions internal scroll widths as well as document width, repeated Indonesian transitions and persisted reload. No viewport threshold relaxed. CI pending.

Final verification at102cff3cb6c27495ab0a9548945e8ac1c8134b1d: run40242363311 SUCCESS. Node22/24 syntax/unit/API/build PASS;60/60 Playwright PASS first attempt in2.8m, including WebKit all16-language sweep and dedicated Indonesian header regression. Local language checks8/8 PASS31.5s. Local320px screenshot inspected: language label ellipsis and arrow contained, controls visible. Pages40242363046 SUCCESS. I18N-002 CLOSED with browser evidence. No independent reviewer used for this focused fix. Local WebKit unavailable due missing host libraries; authoritative WebKit result is CI. Diagnostic-only round1 isolated source; repair round2 verified; previous unsuccessful hypotheses preserved above.
