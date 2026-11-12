import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const parts = [
  "drive-sample-catalog.js",
  "00-library-catalog.js",
  "01-app-config.js",
  "02-state.js",
  "03-sequencer.js",
  "04-piano-roll.js",
  "05-instruments.js",
  "06-dj.js",
  "07-audio.js",
  "08-arrangement.js",
  "09-instrument-browser.js",
  "10-timeline.js",
  "11-audio-clips.js",
  "12-recording.js",
  "13-playback.js",
  "14-collaboration.js",
  "15-projects.js",
  "18-settings.js",
  "16-events.js",
  "17-midi.js",
];
const body = (await Promise.all(parts.map((part) => readFile(join(root, "app", part), "utf8")))).join("");
const output = `(() => {\n  "use strict";\n${body}})();\n`;
const appPath = join(root, "app.js");
const indexPath = join(root, "index.html");
const index = await readFile(indexPath, "utf8");
const appVersion = createHash("sha256").update(output).digest("hex").slice(0, 12);
const appScriptPattern = /<script src="app\.js(?:\?v=[^"]*)?"><\/script>/g;
const appScripts = index.match(appScriptPattern) || [];
if (appScripts.length !== 1) {
  throw new Error("Expected exactly one app.js script tag in index.html.");
}
const versionedIndex = index.replace(appScriptPattern, `<script src="app.js?v=${appVersion}"></script>`);

if (process.argv.includes("--check")) {
  const [currentApp, currentIndex] = await Promise.all([readFile(appPath, "utf8"), readFile(indexPath, "utf8")]);
  if (currentApp !== output || currentIndex !== versionedIndex) {
    console.error("app.js or its cache-busted script reference is out of date; run node scripts/build-app.js.");
    process.exitCode = 1;
  } else {
    console.log("app.js and its cache-busted script reference match app source files.");
  }
} else {
  await writeFile(appPath, output);
  await writeFile(indexPath, versionedIndex);
  console.log("Built app.js from app source files.");
}
