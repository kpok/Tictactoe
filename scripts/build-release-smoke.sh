#!/usr/bin/env bash
# Disposable CI certificates only. Never upload these packages to Google Play.
set -euo pipefail
: "${RUNNER_TEMP:?}"
: "${ANDROID_HOME:?}"
umask 077
key="$RUNNER_TEMP/threefold-disposable.jks"
trap 'rm -f "$key"' EXIT
export CI_SMOKE_PASSWORD=disposable-ci-only
keytool -genkeypair -noprompt -storetype JKS -keystore "$key" -alias smoke \
  -storepass:env CI_SMOKE_PASSWORD -keypass:env CI_SMOKE_PASSWORD \
  -dname 'CN=Threefold Disposable CI,C=US' -keyalg RSA -keysize 2048 -validity 2
keytool -exportcert -keystore "$key" -alias smoke -storepass:env CI_SMOKE_PASSWORD -file "$RUNNER_TEMP/smoke-cert.der"
tools="$ANDROID_HOME/build-tools/36.0.0"
mkdir -p release-smoke
for code in 1001 1002; do
  (cd android && ./gradlew --no-daemon -PversionCode="$code" :app:assembleRelease :app:bundleRelease)
  "$tools/zipalign" -f -p 4 android/app/build/outputs/apk/release/app-release-unsigned.apk "$RUNNER_TEMP/aligned.apk"
  "$tools/apksigner" sign --ks "$key" --ks-key-alias smoke --ks-pass env:CI_SMOKE_PASSWORD \
    --key-pass env:CI_SMOKE_PASSWORD --out "release-smoke/$code.apk" "$RUNNER_TEMP/aligned.apk"
  "$tools/apksigner" verify --verbose --print-certs "release-smoke/$code.apk" > "$RUNNER_TEMP/$code-signer.txt"
  apkanalyzer manifest print "release-smoke/$code.apk" > "$RUNNER_TEMP/$code-manifest.xml"
  version=$(node -p 'require("./package.json").version')
  python3 scripts/android_release.py manifest "$RUNNER_TEMP/$code-manifest.xml" --code "$code" --name "$version"
done
python3 - <<'PY'
import hashlib, os, pathlib, re
root=pathlib.Path(os.environ['RUNNER_TEMP'])
expected=hashlib.sha256((root/'smoke-cert.der').read_bytes()).hexdigest()
for code in (1001,1002):
    matches=re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]+)$',(root/f'{code}-signer.txt').read_text(),re.M)
    if matches != [expected]:
        raise SystemExit('Release APK signer does not match the disposable certificate')
print('Both release APK signatures match the expected disposable certificate')
PY
jarsigner -keystore "$key" -storepass:env CI_SMOKE_PASSWORD -keypass:env CI_SMOKE_PASSWORD \
  -signedjar release-smoke/disposable.aab android/app/build/outputs/bundle/release/app-release.aab smoke
python3 scripts/android_release.py signature release-smoke/disposable.aab --certificate "$RUNNER_TEMP/smoke-cert.der"
java -jar "$RUNNER_TEMP/bundletool.jar" validate --bundle=release-smoke/disposable.aab
java -jar "$RUNNER_TEMP/bundletool.jar" dump manifest --bundle=release-smoke/disposable.aab > "$RUNNER_TEMP/signed-release-manifest.xml"
python3 scripts/android_release.py manifest "$RUNNER_TEMP/signed-release-manifest.xml" --code 1002 --name "$version"
echo 'Disposable signing/manifest checks passed. Packages are NOT Play upload artifacts.'
