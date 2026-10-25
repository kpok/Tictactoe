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
