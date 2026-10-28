"""Verify generated native configuration and the actual AAB manifest before signing."""
import argparse
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ANDROID = '{http://schemas.android.com/apk/res/android}'


def verify(config, release, debug, manifest):
    expected = {
        'ADS_MODE': config['mode'],
        'ADS_UNIT_ID': config['unitId'],
        'ADS_PRIVACY_URL': config['privacyUrl'],
        'ADS_FAMILIES_REVIEWED': False,
    }
    if config['mode'] != 'test' or config['debugMode'] != 'disabled' or config['familiesReviewed'] is not False:
        raise ValueError('Only the test profile with disabled debug and Families is permitted')
    if config['unitId'] != 'ca-app-pub-3940256099942544/1033173712':
        raise ValueError('Official Google test unit required')
    for source, mode in [(release, 'test'), (debug, 'disabled')]:
        for name, wanted in {**expected, 'ADS_MODE': mode}.items():
            values = re.findall(r'public static final (?:String|boolean) ' + name + r' = ("(?:\\.|[^"\\])*"|true|false);', source)
            if len(values) != 1 or json.loads(values[0]) != wanted:
                raise ValueError('Generated native ad configuration mismatch: ' + name)
    root = ET.fromstring(manifest)
    ids = [e.get(ANDROID + 'value') for e in root.findall('application/meta-data')
           if e.get(ANDROID + 'name') == 'com.google.android.gms.ads.APPLICATION_ID']
    if ids != [config['appId']]:
        raise ValueError('Actual release manifest AdMob App ID mismatch')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    parser.add_argument('--manifest', required=True)
    args = parser.parse_args()
    generated = Path('android/app/build/generated/source/buildConfig')
    verify(json.loads(Path(args.config).read_text()),
           (generated / 'release/com/kpok/threefold/BuildConfig.java').read_text(),
           (generated / 'debug/com/kpok/threefold/BuildConfig.java').read_text(),
           Path(args.manifest).read_text())
    print('PASS: actual release uses test ads only; debug and Families disabled; AAB App ID verified')
