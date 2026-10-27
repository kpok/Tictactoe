#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TEMP:?Use a temporary directory outside the repository}"
curl --fail --location --retry 3 --max-time 120 -o "$RUNNER_TEMP/bundletool.jar" \
  https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar
printf '%s  %s\n' a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29 "$RUNNER_TEMP/bundletool.jar" | sha256sum -c -
