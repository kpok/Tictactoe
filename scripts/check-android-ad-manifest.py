"""Check the merged APK, not just manifest merger directives in source."""
import subprocess
import xml.etree.ElementTree as ET
xml = subprocess.check_output(['apkanalyzer', 'manifest', 'print', 'android-artifacts/app-debug.apk'], text=True)
root = ET.fromstring(xml)
name = '{http://schemas.android.com/apk/res/android}name'
blocked = {'com.google.android.gms.permission.AD_ID', 'android.permission.ACCESS_ADSERVICES_AD_ID', 'android.permission.ACCESS_ADSERVICES_ATTRIBUTION', 'android.permission.ACCESS_ADSERVICES_TOPICS'}
assert not any(el.get(name) in blocked for el in root.findall('uses-permission')), 'Advertising identifier permission leaked into APK'
assert not any(el.get(name) == 'com.google.android.gms.ads.MobileAdsInitProvider' for el in root.findall('application/provider')), 'Ads auto-initialization provider leaked into APK'
print('Merged APK ad privacy manifest: PASS (no auto-init provider or advertising identifier permissions)')
