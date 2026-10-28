import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('ad_build_check', Path(__file__).parents[1] / 'scripts/check-internal-ads.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class InternalAdsTests(unittest.TestCase):
    def test_actual_generated_config_rejects_live_units_families_debug_and_manifest_mismatch(self):
        config = dict(mode='test', debugMode='disabled', familiesReviewed=False,
                      appId='ca-app-pub-1234567890123456~1234567890',
                      unitId='ca-app-pub-3940256099942544/1033173712', privacyUrl='')
        release = '\n'.join(['public static final String ADS_MODE = "test";',
                             'public static final String ADS_UNIT_ID = "' + config['unitId'] + '";',
                             'public static final String ADS_PRIVACY_URL = "";',
                             'public static final boolean ADS_FAMILIES_REVIEWED = false;'])
        debug = release.replace('"test"', '"disabled"')
        manifest = ('<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application>'
                    '<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="' +
                    config['appId'] + '"/></application></manifest>')
        module.verify(config, release, debug, manifest)
        for r, d, m in [
            (release.replace('"test"', '"live"'), debug, manifest),
            (release.replace(config['unitId'], 'ca-app-pub-1234567890123456/1234567890'), debug, manifest),
            (release.replace('false', 'true'), debug, manifest),
            (release, debug.replace('"disabled"', '"test"'), manifest),
            (release, debug, manifest.replace(config['appId'], 'other')),
            (release + '\npublic static final String ADS_MODE = "test";', debug, manifest),
        ]:
            with self.subTest(release=r, debug=d, manifest=m), self.assertRaises(ValueError):
                module.verify(config, r, d, m)

    def test_privacy_url_with_semicolon_and_query_is_a_complete_java_string(self):
        import json
        url = 'https://example.com/privacy?a=1;b=2&lang=pl'
        config = dict(mode='test', debugMode='disabled', familiesReviewed=False,
                      appId='ca-app-pub-1234567890123456~1234567890',
                      unitId='ca-app-pub-3940256099942544/1033173712', privacyUrl=url)
        source = '\n'.join(['public static final String ADS_MODE = "test";',
                             'public static final String ADS_UNIT_ID = "' + config['unitId'] + '";',
                             'public static final String ADS_PRIVACY_URL = ' + json.dumps(url) + ';',
                             'public static final boolean ADS_FAMILIES_REVIEWED = false;'])
        manifest = ('<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application>'
                    '<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="' +
                    config['appId'] + '"/></application></manifest>')
        module.verify(config, source, source.replace('"test"', '"disabled"'), manifest)
