# Android CI and Google Play Internal Testing

Baseline: a1c3c2f580f5a87e40b1e308e5338f9b26ed3f05. Reference daily_logic/main android-e2e.yml and GOOGLE_PLAY_TESTING.md inspected 2026-10-26: Flutter debug build + KVM API30 tests exist; no signed AAB or Play deploy workflow exists there.

Scope and acceptance:
- AC1: Commit a reproducible Capacitor Android project (com.kpok.threefold, existing identity), pinned dependencies, Java21/SDK36 toolchain; build debug APK, test APK and unsigned release AAB in CI. Offline assets/AI bundled; no remote app URL.
- AC2: Separate emulator job depends on Android build, downloads exactly its APKs and runs instrumentation against installed app, checks FIFO/victory, AI, language/layout and persisted game after activity restart. API35 google_apis x86_64 KVM with bounded time and diagnostics, following daily_logic conventions. Existing60 web E2E retained.
- AC3: Manually invoked main-only Play workflow runs same-revision full verification via reusable CI, then signs the previously built unsigned AAB (no debug signing, no rebuild) and can publish exclusively to internal track. Default build-only supports first manual upload; explicit publish input. Version code validated numeric, monotonic operator choice; no reused run-number collision on reruns. App version from package.json.
- AC4: Credentials only in google-play-internal environment, fail fast on missing signing/Play secrets, no secrets on PR tests; clean up keystore in always step; no production track or automatic deployment. Min permissions, pinned third-party upload action. Release deployment serialized. Document required environment branch restrictions and Google Play bootstrap, service account limited to testing for this app, signing keys, first-upload behavior and draft/completed states.
- AC5: Native-only UI hides unavailable online mode and skips PWA service worker; web behavior unchanged. No backend deployment, iOS, Play account setup or live upload in this task.

Implementation: npm Capacitor8.5.3 generates reviewed committed project, Gradle wrapper pinned by generated project; release versionCode via validated Gradle property passed from workflow env. Instrumentation APK built once in build job and installed with debug APK in emulator job (functional tests); release AAB built same source/asset set, release signing occurs only after all checks. Debug variant E2E does not prove Play-distributed release/device behavior. No claim of actual Google Play upload without credentials/setup.

CI validation: local syntax/unit/build, YAML structure, npm lock consistency and instrumentation compilation if local Android SDK exists; real build/emulator via GitHub Actions. Independent plan/code review. Bounded3 repair rounds per stage. Existing main writes authorized. Internal publication workflow prepared, not invoked against Play.

AR-PLAN-001 accepted: use API35 google_apis with modern WebView, log actual WebView provider/version. Flutter API30 reference cannot be copied literally for JavaScript application.

AR-PLAN-002 accepted: fail-closed parser requires exactly5 successful instrumentation tests, final runner completion, and no negative test status/crash/failed/skipped markers; unit regressions cover adb-exit-zero failure logs. Raw output/logcat/provider metadata retained.
