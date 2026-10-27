"""Negative release validation tests use public fixtures and no private credentials."""
import base64
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from android_release import INTERNAL_PERMISSION, signer_der, verify_manifest, verify_signature

MANIFEST = '''<manifest xmlns:android="http://schemas.android.com/apk/res/android"
 package="com.kpok.threefold" android:versionCode="1002" android:versionName="1.0.0">
 <uses-permission android:name="android.permission.INTERNET"/>
 <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
 <application android:allowBackup="false" android:usesCleartextTraffic="false" />
 </manifest>'''


def pem(der):
    return "-----BEGIN CERTIFICATE-----\n" + base64.b64encode(der).decode() + "\n-----END CERTIFICATE-----\n"


class ReleaseManifestTests(unittest.TestCase):
    def test_accepts_reviewed_release(self):
        self.assertTrue(verify_manifest(MANIFEST, 1002, "1.0.0"))

    def test_reviewed_workmanager_permission_is_explicitly_allowed(self):
        xml = MANIFEST.replace('<application ', '<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/><application ')
        self.assertTrue(verify_manifest(xml, 1002, "1.0.0"))

    def test_rejects_wrong_identity_version_and_flags(self):
        for old, new in [
            ("com.kpok.threefold", "com.example.fake"),
            ('versionCode="1002"', 'versionCode="1001"'),
            ('versionName="1.0.0"', 'versionName="2.0.0"'),
            ("<application ", '<application android:debuggable="true" '),
            ("<application ", '<application android:testOnly="true" '),
            ('allowBackup="false"', 'allowBackup="true"'),
            ('usesCleartextTraffic="false"', 'usesCleartextTraffic="true"'),
            (' android:allowBackup="false"', ''),
            (' android:usesCleartextTraffic="false"', ''),
        ]:
            with self.subTest(new=new), self.assertRaises(ValueError):
                verify_manifest(MANIFEST.replace(old, new), 1002, "1.0.0")

    def test_rejects_all_unreviewed_permission_tags(self):
        for tag in ("uses-permission", "uses-permission-sdk-23"):
            for name in ("com.google.android.gms.permission.AD_ID", "android.permission.CAMERA", "android.permission.ACCESS_ADSERVICES_TOPICS"):
                xml = MANIFEST.replace("<application ", f'<{tag} android:name="{name}"/><application ')
                with self.subTest(tag=tag, name=name), self.assertRaises(ValueError):
                    verify_manifest(xml, 1002, "1.0.0")

    def test_internal_permission_requires_signature_declaration(self):
        use = f'<uses-permission android:name="{INTERNAL_PERMISSION}"/>'
        declaration = f'<permission android:name="{INTERNAL_PERMISSION}" android:protectionLevel="signature"/>'
        self.assertTrue(verify_manifest(MANIFEST.replace("<application ", use + declaration + "<application "), 1002, "1.0.0"))
        for extra in (use, use + declaration.replace("signature", "normal"), use + declaration + declaration):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                verify_manifest(MANIFEST.replace("<application ", extra + "<application "), 1002, "1.0.0")

    def test_rejects_ads_auto_init(self):
        xml = MANIFEST.replace(" />", '><provider android:name="com.google.android.gms.ads.MobileAdsInitProvider"/></application>')
        with self.assertRaises(ValueError):
            verify_manifest(xml, 1002, "1.0.0")


class SignatureTests(unittest.TestCase):
    def test_certificate_extraction_rejects_absent_multiple_or_empty_signers(self):
        self.assertEqual(signer_der(pem(b"public-cert")), b"public-cert")
        for output in ("jar is unsigned.", pem(b"a") + pem(b"b"), pem(b"")):
            with self.subTest(output=output), self.assertRaises(ValueError):
                signer_der(output)

    def test_signature_must_be_verified_and_match_expected_certificate(self):
        with tempfile.TemporaryDirectory() as directory:
            cert = Path(directory) / "public.der"
            cert.write_bytes(b"expected-public-cert")
            with patch("android_release._run_public_tool", side_effect=["jar verified.\n", pem(cert.read_bytes())]):
                self.assertEqual(len(verify_signature("bundle.aab", cert)), 64)
            for outputs in (["jar is unsigned.\n"], ["jar verified.\nThis jar contains unsigned entries which have not been integrity-checked."], ["jar verified.\n", pem(b"wrong")], ["jar verified.\n", pem(b"a") + pem(b"b")]):
                with self.subTest(outputs=outputs), patch("android_release._run_public_tool", side_effect=outputs), self.assertRaises(ValueError):
                    verify_signature("bundle.aab", cert)

    def test_failed_integrity_tool_cannot_pass(self):
        result = subprocess.CompletedProcess([], 1, "jar verified.", "tampered entry")
        with patch("android_release.subprocess.run", return_value=result), self.assertRaises(ValueError):
            verify_signature("bundle.aab", "unused.der")


if __name__ == "__main__":
    unittest.main()
