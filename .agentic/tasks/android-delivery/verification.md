# Verification

Baseline a1c3c2f580f5a87e40b1e308e5338f9b26ed3f05.

- Local npm check: PASS.
- Local npm test:24/24 PASS, including fail-closed instrumentation/version helpers.
- npm run android:sync: PASS, web build and native sync.
- YAML parse / bash -n / git diff --check: PASS.
- Local native-shell browser tests:2/2 Chromium/mobile PASS2.9s after installing browser; initial missing-binary attempts are not application assertions.
- Independent plan review: PASS after AR-PLAN-001/002 corrections.
- Independent implementation review: PASS static, no confirmed blockers. Reviewer independently ran2 helper tests, YAML parse, bash syntax.
- Local Gradle/emulator: NOT RUN, JDK21 and Android SDK unavailable locally (Java17 installed).
- GitHub Android build/emulator CI: pending upload.
- Real signing with upload key, protected Environment configuration, Play Console bootstrap and live upload: NOT RUN, owner credentials/setup required. No private material committed.

First CI40327303232 at60192a0: Node22/24 PASS; Android setup failed before Gradle because setup-android v3 default tools package is no longer available. Fix explicitly requests platform-tools only; SDK36/build-tools installed separately. Emulator skipped because build failed. No Android build PASS claimed.

Second CI40327558788 at933d840: setup fixed; actual :app:assembleDebug and :app:assembleDebugAndroidTest including GameE2ETest compilation PASSED. Unqualified root Gradle task also tried instrumentation of dependency capacitor-cordova-android-plugins and failed there with Kotlin1.6/1.8 duplicates. Fix scopes all requested builds to :app tasks, leaving all5 app E2E tests intact; no force/exclusion of production dependencies or app assertions. Release bundle/emulator not yet verified.

## Final observed evidence

Runtime commit823a970c30bfdca7ea3fa62f6b55293b50918ed3; local source tree e98e7722c98d8a4aac4abd85ed4a3ea3ad2c553c matches remote tree. Run https://github.com/kpok/Tictactoe/actions/runs/40328159473 SUCCESS.

- Node22 and24 syntax/unit/API/build: SUCCESS,24 tests each.
- Android build job121590760074: SUCCESS; actual debug APK, instrumentation APK and unsigned release AAB built with JDK21/SDK36.
- Emulator job121591849655: SUCCESS on API35 google_apis with network disabled. Runner printed OK (5 tests), INSTRUMENTATION_CODE:-1 and strict parser confirmed5/5. FIFO, victory/rematch, bundled worker AI offline, Tagalog/Indonesian/native policy, activity recreation/persistence/fullscreen all exercised.
- Browser job121590759871:63/63 PASS first attempt2.7m, strict flaky gate retained.
- Android artifact12651604669 downloaded from this run. Local provenance verification: SHA/package/versionCode/hashes PASS.
- Release signing bash commands executed on that actual AAB with a freshly generated ephemeral synthetic PKCS12 key, publish=false; signing and signature verification PASS. Non-META-INF AAB entries byte-identical after signing; always cleanup PASS. Local Java17 has jdk.jartool but no standalone jarsigner launcher, so a shell function invoked the same tool module. Initial standalone-launcher attempt failed before signing and cleaned up; subsequent module-launcher check PASS. This does not claim real upload-key signing or JDK21 release-job execution.
- No Google Play API invoked, no real release credentials used or committed. Environment creation/protection, key provisioning, Play app bootstrap and actual publication remain owner setup. Dedicated release workflow reviewed statically; not manually dispatched because owner signing environment is absent.

Independent android_code_review additionally approved both bounded corrections: explicit supported SDK package and app-qualified Gradle tasks. Final fixes2/3 budget; no confirmed unresolved implementation blocker. Public artifacts contain game code/debug test material, not upload key/service JSON. No physical-device or Play-installed-release test claimed.
