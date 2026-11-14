#!/usr/bin/env python3
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT_FOLDER_ID = "1hv_ZMs_NX7nKJkYeOGXRNWk5AUt0bbzC"
ROOT_FOLDER_NAME = "Google Drive Samples"
AUDIO_EXTENSIONS = {".aif", ".aiff", ".flac", ".m4a", ".mp3", ".ogg", ".wav"}
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "app" / "drive-sample-catalog.js"
IDS_OUTPUT_PATH = Path(__file__).resolve().parents[1] / "drive-sample-ids.json"
DOWNLOAD_URL = "/drive-sample-proxy.php?id={}"
COLORS = {
    "Ambient Loops": "#b5a0ff",
    "Drum Loops": "#d4f16c",
    "Drums": "#d4f16c",
    "Foley": "#d29b79",
    "Loops": "#7cc9ff",
    "Samples": "#93e2bd",
}


class FolderRows(HTMLParser):
    def __init__(self):
        super().__init__()
        self.row = None
        self.capture_name = False
        self.rows = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "tr" and self.row is None:
            self.row = {"depth": 0, "id": None, "name": [], "is_folder": False}
        if self.row is None:
            return
        self.row["depth"] += 1
        if attrs.get("data-id") and self.row["id"] is None:
            self.row["id"] = attrs["data-id"]
        if "folder" in attrs.get("aria-label", "").lower() or "folder" in attrs.get("data-tooltip", "").lower():
            self.row["is_folder"] = True
        if tag == "strong" and "DNoYtb" in attrs.get("class", "").split():
            self.capture_name = True

    def handle_endtag(self, tag):
        if self.row is None:
            return
        if tag == "strong":
            self.capture_name = False
        self.row["depth"] -= 1
        if tag == "tr" and self.row["depth"] == 0:
            name = "".join(self.row["name"]).strip()
            if self.row["id"] and name:
                self.rows.append({
                    "id": self.row["id"],
                    "name": name,
                    "is_folder": self.row["is_folder"],
                })
            self.row = None

    def handle_data(self, data):
        if self.row is not None and self.capture_name:
            self.row["name"].append(data)


def fetch_folder(folder_id):
    request = Request(
        f"https://drive.google.com/drive/folders/{folder_id}?usp=sharing",
        headers={"User-Agent": "Mozilla/5.0 DansBPM sound catalog updater"},
    )
    for attempt in range(4):
        try:
            with urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", "replace")
        except (HTTPError, URLError, TimeoutError):
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def display_name(name):
    name = name.replace("+", " ")
    name = re.sub(r"\.[^.]+$", "", name)
    return re.sub(r"\s+", " ", name).strip()


def clean_category(value):
    value = value.replace("+", " ").replace("_", " ")
    value = re.sub(r"\bCC0\b", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value).strip(" -_")
    return value or "Samples"


def classify_sample(path, filename):
    words = " ".join(path + [filename]).lower()
    if "foley" in words:
        family, category = "Foley", "One-Shots"
    elif re.search(r"\bhh\b", words):
        family = "Drums"
        if re.search(r"\bopen\b", words):
            category = "Open Hi-Hats"
        elif re.search(r"\bclosed\b", words):
            category = "Closed Hi-Hats"
        else:
            category = "Hi-Hats"
    elif "ambience" in words or any(word in words for word in ("guitar", "mallet", "piano", "pad", "string")):
        family = "Ambient Loops"
        category = clean_category(path[-1]) if len(path) > 1 else "Ambience"
    elif "loop" in words and any(word in words for word in ("drum", "kick", "bongo", "808", "trap")):
        family = "Drum Loops"
        category = clean_category(path[-1]) if len(path) > 1 else clean_category(path[0])
    elif any(word in words for word in ("drum", "kick", "bongo", "808")):
        family, category = "Drums", clean_category(path[-1]) if len(path) > 1 else "One-Shots"
    elif "loop" in words:
        family, category = "Loops", clean_category(path[-1]) if len(path) > 1 else clean_category(path[0])
    else:
        family, category = "Samples", clean_category(path[-1]) if len(path) > 1 else clean_category(path[0])

    if category.lower() == clean_category(path[0]).lower():
        pack = clean_category(path[0])
        if "foley" in words:
            category = "One-Shots"
        elif "bongo" in words:
            category = "Bongos"
        elif "kick" in words:
            category = "Kicks"
        elif "trap" in words or "808" in words:
            category = "Trap / 808"
        elif "industrial" in words:
            category = "Industrial Drums"
        elif "plucked" in words:
            category = "Plucked"
        elif "house" in words:
            category = "House"
        elif "ambience" in words:
            category = "Ambience"
        else:
            category = pack
    return family, category


def read_drive_catalog():
    pending = [(ROOT_FOLDER_ID, [])]
    visited = set()
    samples = []
    while pending:
        folder_id, path = pending.pop(0)
        if folder_id in visited:
            continue
        visited.add(folder_id)
        parser = FolderRows()
        parser.feed(fetch_folder(folder_id))
        time.sleep(0.15)
        for item in parser.rows:
            name = item["name"].replace("+", " ")
            if name == "__MACOSX" or name.startswith("._"):
                continue
            item_path = [*path, name]
            if item["is_folder"]:
                pending.append((item["id"], item_path))
                continue
            extension = Path(name).suffix.lower()
            if extension not in AUDIO_EXTENSIONS or any(part == "__MACOSX" for part in item_path):
                continue
            filename = item_path[-1]
            folders = item_path[:-1]
            family, category = classify_sample(folders, filename)
            samples.append({
                "id": f"drive-{item['id']}",
                "name": display_name(filename),
                "kind": "sample",
                "family": family,
                "sampleCategory": category,
                "sampleUrl": DOWNLOAD_URL.format(item["id"]),
                "sampleRootMidi": 60,
                "sampleOneShot": True,
                "subtitle": f"{ROOT_FOLDER_NAME} · {clean_category(folders[0])}",
                "searchTerms": " ".join(item_path),
                "color": COLORS[family],
                "volume": 0.68,
            })
    return sorted(samples, key=lambda sample: (sample["family"], sample["sampleCategory"], sample["name"].lower(), sample["id"]))


def main():
    samples = read_drive_catalog()
    if not samples:
        raise SystemExit("Drive folder scan found no supported audio files; catalog was not changed.")
    content = (
        "// Generated by scripts/update-drive-sound-catalog.py; do not edit by hand.\n"
        f"const DRIVE_SAMPLE_TRACKS = {json.dumps(samples, indent=2, ensure_ascii=False)};\n"
    )
    ids_content = f"{json.dumps(sorted(sample['id'].removeprefix('drive-') for sample in samples), indent=2)}\n"
    if (
        OUTPUT_PATH.exists()
        and OUTPUT_PATH.read_text() == content
        and IDS_OUTPUT_PATH.exists()
        and IDS_OUTPUT_PATH.read_text() == ids_content
    ):
        print(f"Drive sound catalog is current ({len(samples)} audio files).")
        return
    OUTPUT_PATH.write_text(content)
    IDS_OUTPUT_PATH.write_text(ids_content)
    print(f"Updated Drive sound catalog with {len(samples)} audio files.")


if __name__ == "__main__":
    main()
