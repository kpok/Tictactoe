# Verification

Local Node29/29 PASS. Focusedbrowserfake tests8/8 desktop/mobilePASS, later4/4 desktop afteremptyboundary legacyregressionPASS. npmcheck/sync/buildPASS beforefinalnarrowchanges; finalcheck scheduled. YAMLparse/PythonAST/diffchecksPASS. No localAndroidSDK; Android/JUnit/mergedmanifest/emulatorCI pending. Fakeprovider tests do NOT prove SDKnetwork fill, actualcreativeclose, UMPaccount setup, orcertification. Allads off; no AdMob/Play activation.

First CI40391747153 at988b346: Node22/24 PASS29tests each; Android SDK compilation +:app:testDebugUnitTest +APK/AAB build SUCCESS; merged APK privacy manifest PASS (auto-init provider and identifier permissions absent);75/75 browser E2E PASS first attempt. Emulator pending when final polish prepared.
Final polish independently PASS: testmode may use own appID for UMP but testunit enforced; debug variant always disabled unless explicit debugAdsMode=test (neverlive) so future release activation does not cause CI ads; native UI links only credential-freeHTTPS policy URL. Local5/5 desktop ad regressions PASS4.6s. FinalCI required for this diff.

Parent found and independent reviewer confirmed AR-ADS-003: privacy options coupled to ad eligibility hid recovery after form errors. Corrected separate consentUpdated profile barrier, adult privacy entry independent of consentFresh/canRequestAds; ad gates remain unchanged. Added native JUnit regression (native policy tests now6). Second CI40393112474 runtimeAndroid+emulatorPASS before correction; browser installation stillpending. FinalfixCI required.


## CI repair round 3

Revision38e1b8d / CI40394606174: Node22/24 each29 PASS; Android SDK compile, APK/AAB and merged manifest PASS; downloaded JUnit XML confirms AdCadence3 +AdAudience3 =6 PASS. Browser77 passed +1 flaky (WebKit online rematch, retry passed; failOnFlakyTests correctly rejected). Emulator4/5 passed; first cold evaluateJavascript callback exceeded5s before ready loop could continue. This run is NOT green.

CI-ADS-004: downloaded failing Playwright trace contains no second-client rematch POST, while unchanged snapshot polling continues. Every accepted identical snapshot rebuilt board cells and restart text nodes. Skip healthy equal-revision snapshots; retain reconnect render and every newer revision. New browser regression checks board/text node identity across an unchanged poll and successful reconnect rendering. This proves DOM stability; exact lost touch event mechanism remains an inference from the trace.

CI-ADS-005: allow cold startup readiness45s with individual callback30s; ordinary game evaluate/assertion budgets5s/15s unchanged. No test skip, unconditional sleep or flaky acceptance added. Independent static review PASS for both changes. Local Android execution unavailable; CI required. Node29/check PASS. Local initial browser attempt could not launch because browser binaries were absent; installing binaries before rerun.

Local after browser installation:22/22 Chromium desktop/mobile game E2E PASS. Negative control: temporarily removed equal-revision guard; new DOM stability regression FAILED as expected; restored fixed source. WebKit host libraries unavailable locally; GitHub runner installs them. No test acceptance settings changed. Independent reviewer PASS.


## Final verified delivery

Runtime revision0442898e468b1e3934197dcc4d970221a7131b2e, tree bba9106e4762aad2dfc93b832c4f29057ba6a071.
GitHub Actions https://github.com/kpok/Tictactoe/actions/runs/40462715295 completed SUCCESS.
- Node22 and24:29/29 tests each, syntax and build PASS.
- Browser:81/81 first attempt PASS (desktop Chromium, Pixel viewport, iPhone WebKit); no retry/flaky result. failOnFlakyTests remains enabled.
- Native JUnit: downloaded artifact12714874317 XML confirms AdCadence3 +AdAudience3, zero failure/error/skip.
- Android build APK/instrumentation APK/unsigned AAB and actual merged privacy manifest check PASS.
- Installed APK offline Android15 emulator:OK(5 tests), strict instrumentation gate PASS.
- Independent static review PASS. CI-ADS-004/005 verified closed. No workflow gates weakened, no real ads or Play publication enabled.

Documentation-only closure commit follows the tested runtime revision; no runtime changes after CI.
