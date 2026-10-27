#!/usr/bin/env python3
"""Validate actual decoded release manifests and signed bundles without private keys."""
import argparse
import base64
import hashlib
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

ANDROID = "{http://schemas.android.com/apk/res/android}"
PACKAGE = "com.kpok.threefold"
ALLOWED_PERMISSIONS = {
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.WAKE_LOCK",
}
INTERNAL_PERMISSION = PACKAGE + ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
SIGNATURE_LEVELS = {"signature", "0x00000002", "0x2", "2"}


def verify_manifest(xml, code, name):
    """Fail closed for identity, release flags and unreviewed merged permissions."""
    if not isinstance(code, int) or isinstance(code, bool) or not 1 <= code <= 2100000000:
        raise ValueError("Invalid expected versionCode")
    if not isinstance(name, str) or not name:
        raise ValueError("Invalid expected versionName")
    root = ET.fromstring(xml)
    if root.tag != "manifest" or root.get("package") != PACKAGE:
        raise ValueError("Wrong Android package")
    if root.get(ANDROID + "versionCode") != str(code):
        raise ValueError("Unexpected versionCode")
    if root.get(ANDROID + "versionName") != name:
        raise ValueError("Unexpected versionName")
    applications = root.findall("application")
    if len(applications) != 1:
        raise ValueError("Expected exactly one application")
    app = applications[0]
    for flag in ("debuggable", "testOnly"):
        if app.get(ANDROID + flag, "false") != "false":
            raise ValueError("Release must not enable " + flag)
    for flag in ("allowBackup", "usesCleartextTraffic"):
        if app.get(ANDROID + flag) != "false":
            raise ValueError("Release must explicitly disable " + flag)
    declared = root.findall("permission")
    for permission in declared:
        if permission.get(ANDROID + "name") != INTERNAL_PERMISSION:
            raise ValueError("Unreviewed custom permission")
        if permission.get(ANDROID + "protectionLevel") not in SIGNATURE_LEVELS:
            raise ValueError("AndroidX internal permission must be signature protected")
    for permission in root.findall("uses-permission") + root.findall("uses-permission-sdk-23"):
        permission_name = permission.get(ANDROID + "name")
        if permission_name == INTERNAL_PERMISSION:
            if len([p for p in declared if p.get(ANDROID + "name") == INTERNAL_PERMISSION]) != 1:
                raise ValueError("Internal permission needs one signature-protected declaration")
        elif permission_name not in ALLOWED_PERMISSIONS:
            raise ValueError("Unreviewed release permission: " + str(permission_name))
    for provider in app.findall("provider"):
        if provider.get(ANDROID + "name") == "com.google.android.gms.ads.MobileAdsInitProvider":
            raise ValueError("Ads must not auto-initialize")
    return True


def signer_der(output):
    """Extract exactly one public certificate from keytool RFC output."""
    blocks = re.findall(r"-----BEGIN CERTIFICATE-----\s*([A-Za-z0-9+/=\s]+?)\s*-----END CERTIFICATE-----", output)
    if len(blocks) != 1:
        raise ValueError("Expected exactly one AAB signer certificate")
    try:
        der = base64.b64decode("".join(blocks[0].split()), validate=True)
    except ValueError as error:
        raise ValueError("Invalid signer certificate encoding") from error
    if not der:
        raise ValueError("Empty signer certificate")
    return der


def _run_public_tool(*arguments):
    result = subprocess.run(arguments, capture_output=True, text=True, timeout=90, check=False)
    if result.returncode != 0:
        raise ValueError("Public signature verification tool failed: " + arguments[0])
    return result.stdout + "\n" + result.stderr


def verify_signature(bundle, certificate):
    """Require verified JAR contents and the exact expected public signer DER."""
    output = _run_public_tool("jarsigner", "-J-Duser.language=en", "-J-Duser.country=US", "-verify", "-verbose", "-certs", str(bundle))
    if not re.search(r"(?m)^jar verified\.\s*$", output) or re.search(r"(?i)\bunsigned entr(?:y|ies)\b", output):
        raise ValueError("AAB does not contain a verified JAR signature")
    output = _run_public_tool("keytool", "-J-Duser.language=en", "-J-Duser.country=US", "-printcert", "-rfc", "-jarfile", str(bundle))
    actual = signer_der(output)
    expected = Path(certificate).read_bytes()
    if not expected or hashlib.sha256(actual).digest() != hashlib.sha256(expected).digest():
        raise ValueError("AAB signer does not match expected certificate")
    return hashlib.sha256(actual).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    manifest = commands.add_parser("manifest")
    manifest.add_argument("manifest")
    manifest.add_argument("--code", type=int, required=True)
    manifest.add_argument("--name", required=True)
    signature = commands.add_parser("signature")
    signature.add_argument("bundle")
    signature.add_argument("--certificate", required=True)
    args = parser.parse_args()
    if args.command == "manifest":
        verify_manifest(Path(args.manifest).read_text(), args.code, args.name)
        print("Release manifest PASS: identity, version, flags, privacy and permissions")
    else:
        fingerprint = verify_signature(args.bundle, args.certificate)
        print("AAB signature PASS; expected public certificate SHA-256: " + fingerprint)


if __name__ == "__main__":
    main()
