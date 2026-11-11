import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const parts = [
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
  "16-events.js",
];
const body = (await Promise.all(parts.map((part) => readFile(join(root, "app", part), "utf8")))).join("");
const output = `(() => {\n  "use strict";\n${body}})();\n`;
const appPath = join(root, "app.js");

if (process.argv.includes("--check")) {
  if (await readFile(appPath, "utf8") !== output) {
    console.error("app.js is out of date; run node scripts/build-app.js.");
    process.exitCode = 1;
  } else {
    console.log("app.js matches app source files.");
  }
} else {
  await writeFile(appPath, output);
  console.log("Built app.js from app source files.");
}
