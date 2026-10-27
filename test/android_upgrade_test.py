import pathlib
import sys
import unittest
import tempfile
import subprocess
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import android_release_upgrade as upgrade
from android_release_upgrade import center, label


class UpgradeUiTests(unittest.TestCase):
    def test_visible_targets_and_accessible_names(self):
        self.assertEqual(center('[10,20][30,40]'), ('20', '30'))
        self.assertEqual(label({'text': 'Kahon 5: O', 'content-desc': 'duplicate'}), 'Kahon 5: O')
        self.assertEqual(label({'content-desc': 'Kahon 5: O'}), 'Kahon 5: O')

    def test_hidden_or_malformed_target_cannot_be_clicked(self):
        for bounds in ('[0,0][0,0]', '[30,40][10,20]', 'invalid', ''):
            with self.subTest(bounds=bounds), self.assertRaises(ValueError):
                center(bounds)


class SnapshotReadinessTests(unittest.TestCase):
    def test_busy_initial_dump_retries_with_a_new_file(self):
        xml = '<hierarchy><node text="EN · English" bounds="[10,20][30,40]"/></hierarchy>'
        failure = subprocess.CalledProcessError(1, ['adb', 'cat'], stderr='No such file')
        with tempfile.TemporaryDirectory() as directory, patch.object(upgrade, 'OUT', pathlib.Path(directory)), patch.object(upgrade.time, 'sleep'), patch.object(upgrade, 'run', side_effect=['', 'ERROR: busy', failure, '', 'dumped', xml]) as runner:
            self.assertEqual(label(upgrade.wait_node('EN.*English')), 'EN · English')
            deletes = [c for c in runner.call_args_list if c.args[:4] == ('adb', 'shell', 'rm', '-f')]
            self.assertEqual(len(deletes), 2)

    def test_missing_dump_fails_at_deadline_instead_of_using_old_ui(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(upgrade, 'OUT', pathlib.Path(directory)), patch.object(upgrade.time, 'sleep'), patch.object(upgrade.time, 'monotonic', side_effect=[0, 0, 80]), patch.object(upgrade, 'snapshot', side_effect=subprocess.CalledProcessError(1, ['adb'])):
            with self.assertRaisesRegex(RuntimeError, 'Release UI not found'):
                upgrade.wait_node('Kahon 5: O')

    def test_timeout_bytes_preserve_readiness_diagnostics(self):
        import xml.etree.ElementTree as ET
        tree = ET.fromstring('<hierarchy><node text="Kahon 5: O" bounds="[1,1][20,20]"/></hierarchy>')
        error = subprocess.TimeoutExpired(['adb'], 60, output=b'cold renderer', stderr=b'busy')
        with tempfile.TemporaryDirectory() as directory, patch.object(upgrade, 'OUT', pathlib.Path(directory)), patch.object(upgrade.time, 'sleep'), patch.object(upgrade, 'snapshot', side_effect=[error, tree]):
            self.assertEqual(label(upgrade.wait_node('Kahon 5: O')), 'Kahon 5: O')
            self.assertIn('cold rendererbusy', (pathlib.Path(directory) / 'probe-error.txt').read_text())
