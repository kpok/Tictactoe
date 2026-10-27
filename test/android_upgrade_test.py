import pathlib
import sys
import unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
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
