import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("update-drive-sound-catalog.py")
SPEC = importlib.util.spec_from_file_location("drive_catalog", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(MODULE)
classify_sample = MODULE.classify_sample


class UpdateDriveSoundCatalogTests(unittest.TestCase):
    def test_classify_sample_handles_files_in_the_root_folder(self):
        family, category = classify_sample([], "ambient-pad.wav")
        self.assertEqual(family, "Ambient Loops")
        self.assertEqual(category, "Ambience")

        family, category = classify_sample([], "kick.wav")
        self.assertEqual(family, "Drums")
        self.assertEqual(category, "One-Shots")


if __name__ == "__main__":
    unittest.main()
