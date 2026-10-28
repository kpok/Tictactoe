# Internal Testing ad profile

Requirement: enable advertising in the Android Internal Testing version. Baseline remote main 706a4a0f777c443888a30e66c24041229ed25c83 (local tree bd3539c8eac8f80879ddb780438e7939e689202a), 2026-10-28.

Existing implementation includes native AdMob/UMP, age gating, generation invalidation, between-round display and cadence (5 completed rounds AND 180 seconds). Gradle defaults disabled; CI previously supplied no enable flag. No native policy change is necessary.

Safe assumption: this testing release uses official Google demo units, no live earnings. Children/unknown remain blocked; no consent bypass. Real AdMob account setup, network creatives and Play installation cannot be verified without owner configuration. No account changes, keys or publishing in scope of this change. Local editing/tests and direct main commits are authorized; Android compilation/emulator available via CI, not locally.

Acceptance:
- AC1: CI release AAB uses test mode and official unit; debug disabled, Families false; local defaults disabled.
- AC2: public App ID/privacy repository variables supported and validated before Gradle; native generated config and actual AAB manifest verified.
- AC3: provenance binds ad configuration and hashes; signing refuses mismatch; owner-only CI protections retained.
- AC4: tests cover accidental live/Families/debug/manifest/profile drift; owner has physical test instructions and explicit UMP limitations.

Plan: wire explicit CI flags and public variables, verify native output, extend provenance and policy tests, update ADS and Play guide; run local checks; independent implementation review; push main and inspect CI. No new dependency, SDK, secret or live service operation.

Decision: no council needed for alternative architecture because the existing reviewed plugin is retained. Independent plan reviewer internal_ads_plan_review: PASS, requiring pre-Gradle input validation, actual native/AAB checks, matching public values, corrected docs, and honest unverified network/UMP reporting. All incorporated.
