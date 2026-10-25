# Multilingual Threefold

Baseline remote main206bc71250564e210639d817f0a432344492061c. User authorizes16-language support and prior direct-main delivery. No game-rule or public-backend changes.

AC1: complete111-key catalogs for PL, EN, TL, ES, PT, FR, DE, IT, RU, AR, HI, ZH-CN, JA, KO, ID, BN; include privacy, rules, errors and accessibility.
AC2: native-name selector, browser detection with region/fil aliases, manual choice persistence; switching language must retain game state.
AC3: Arabic RTL for surrounding UI; board coordinate order and invite codes remain LTR. Responsive mobile layout.
AC4: offline precache includes i18n module and all catalogs; Node completeness/markup/normalization tests plus E2E language switching, persistence, Tagalog detection and RTL.
AC5: existing CI remains strict; run build, syntax, rules/API/localization tests and all browser projects before final success claim. Main updates via GitHub connector; no live infrastructure writes.

Implementation: shared ESM i18n catalog/normalizer; replace inline PL/EN conditional strings. Locale contributors own separate worktrees and nonoverlapping files; parent serializes integration. Text catalogs are first-party authored translations, not a claim of professional native-speaker certification. Semantic rule invariants and key completeness are checked; independent code review precedes delivery.
