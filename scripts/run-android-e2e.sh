#!/usr/bin/env bash
set -euo pipefail
mkdir -p android-e2e-results
adb devices -l
adb shell dumpsys webviewupdate > android-e2e-results/webview.txt
adb install -r android-artifacts/app-debug.apk
adb install -r android-artifacts/app-debug-androidTest.apk
# Packaged assets and the AI worker must run without network connectivity.
adb shell svc wifi disable
adb shell svc data disable
trap 'timeout -k 2s 10s adb logcat -d -t 1500 > android-e2e-results/logcat.txt 2>&1 || true; timeout -k 2s 10s adb exec-out screencap -p > android-e2e-results/screen.png 2>/dev/null || true' EXIT
timeout --signal=TERM --kill-after=15s 720s adb shell am instrument -w -r \
  -e class com.kpok.threefold.GameE2ETest \
  com.kpok.threefold.test/androidx.test.runner.AndroidJUnitRunner | tee android-e2e-results/instrumentation.txt
# adb's exit code alone does not reliably signal JUnit failure.
node scripts/check-android-e2e.js
