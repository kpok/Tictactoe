# Verification

User reference daily_logic PR1 head7aee325f3cf7c87c274a6a09c669914305bce86a +sprint1-20261026/reviews.md read. Adapted relevant release/state/concurrency protections; no daily/streak feature copied. Guide in docs/GOOGLE_PLAY_TESTING.md expanded and reviewed against actual workflow and official Google signing/testing/API docs2026-10-27.

Local check/policy12jobs/build PASS; Node39/39; Python10/10; Bashsyntax and diffcheck PASS. Independent planreview PASS; independent engine review PASS with10000legalgames144146JSON positions; independent release/provenance/docs code review PASS and focusedtests. LocalAndroidSDK/compiler unavailable; actual AAB/cert and upgrade WebView accessibility require CI. No realkeys generated, no Play or AdMob activation.
Local desktop+mobileChromium full E2E54/54 PASS beforepush. WebKit and installedrelease upgrade pending externalCI.

Repair1: CI40573779835 actualAAB check rejected android.permission.FOREGROUND_SERVICE. Inspected officialMaven play-services-ads24.9.0 POM →ads-api24.9.0 POM →androidx.work:work-runtime2.7.0 AAR manifest. It explicitlydeclares FOREGROUND_SERVICE (normal permission), WAKE_LOCK/NETWORK_STATE, and RECEIVE_BOOT_COMPLETED removed byads-api manifest. Exactoneadditional permission allowed; AD_ID/AdServices/unknown stillreject. Addedregression and decodedXMLartifact for future diagnostics. OfficialURLs: https://dl.google.com/dl/android/maven2/com/google/android/gms/play-services-ads-api/24.9.0/play-services-ads-api-24.9.0.pom and https://dl.google.com/dl/android/maven2/androidx/work/work-runtime/2.7.0/work-runtime-2.7.0.aar . This records an existing merged permission; no new app permission was introduced. Full releaseCI pending.

Repair2: CI40574571861 actualAAB and bothAPK manifests/certs plus signedAABcert PASS; browser81 and debugemulator5 PASS. Newreleaseupgrade failed beforelanguage selection because first UIAutomator returned0 withoutcreatingXML and cat failed. Added freshsnapshot removal on everyprobe, bounded retry only for unavailable/malformed dumps, regressionfor firstmissingdump and deadlinefail, case-insensitive accessibilitylabels, finalfailure screenshot. No assertion skipped and no retry of packageupgrade/statechecks.

Repair3 (continued2026-10-28): CI40575962925 confirmsNode39/Python14/Playwright81/actualAABcert+manifest PASS, but debugemulator first setup storageclear timedout atGameE2ETest.java29 (5s callback; other4testsPASS) and releaseupgrade couldnotfind selected-value ENEnglish. Downloaded artifact12766608808: screenshotshowsworkingapp, ui.xml exposes actual select text Language withvalidbounds, not selectedoptiontext. Corrected exactaccessible selector Language and enabled scrolling for counters belowboard; ordinary mark/state assertions retained. Debug startupclear uses30s callback only; subsequent functional checks remain5s/15s. UI dump freshness fix independentlyPASS and stillactive. No application code or securitypolicy relaxed.

Repair3 pre-push robustness: recordedXML also has off-screen counter bounds[0,0][0,0]. Scrolling now uses smaller gestures and document-order direction to recover targets above the viewport after visiting a counter, with up/down fixture regression. No game assertions changed.


## Final verified delivery — 2026-10-28

Runtime revision57af2c45fdb2aa3cefcb063172aa45685e878e03, treea36f15c5272d97c786adde1828422e4de8348bbb.
https://github.com/kpok/Tictactoe/actions/runs/40638520909 completed SUCCESS; all6 jobs actually executed.
- Node22/24 each39tests and Python15tests plus policy/syntax/build PASS.
- Playwright81/81 PASS first attempt, no retries/flaky acceptance.
- Debug installed APK offline Android15 instrumentation OK(5 tests), strict gate PASS.
- Actual decoded release AAB and APK manifests verified against identity/version/release/privacy/permission expectations.
- Both release APK signatures match generated disposable certificate; signed AAB integrity and actual certificate DER match verified. No real upload key used.
- Actual release update1001→1002 through adb install-r PASS: Tagalog, local game and centerO retained across restart/update; furtherX move and2/100 counter verified offline.
- Downloaded artifact12794284261; before/after/final screenshots present, after-upgrade screenshot independently visually inspected byparent: localmode selected, Tagalog labels, centerO andcornerX,2/100galaw. No key or package uploaded in diagnostics artifact.
- Independent plan/state/release reviews PASS; repair3 narrowreview including scroll helper PASS, Python15 independently rerun. All required findings closed.

Operator guide delivered in docs/GOOGLE_PLAY_TESTING.md: Windows private key outside checkout, clipboard/backup, exact protected-environment secrets, build-only first upload/manual Console, API optional, tester install, public-artifact boundaries and credential incident handling. No owner secrets read, no real key generated, no Play upload or ads activation. This test covers current schema and disposable signatures, not all historical migrations or Play App Signing/physical devices. Administrative repo settings remain owner responsibility per separate workflow security guide.

Closure commit changes task evidence only [skip ci]; runtime files unchanged after verified revision.
