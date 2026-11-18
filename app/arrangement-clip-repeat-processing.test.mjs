import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("./arrangement-clip-repeat-processing.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);

function summarize(windows) {
  return JSON.parse(JSON.stringify(windows.map(({ sourceOffset, duration }) => [sourceOffset, duration])));
}

test("repeating a split first half replays only that half", () => {
  const windows = context.getArrangementClipSourceWindows(2, 0, 2, 2, 0, 1);
  assert.deepEqual(summarize(windows), [[0, 1], [0, 1]]);
});

test("repeating a split second half preserves its source offset", () => {
  const windows = context.getArrangementClipSourceWindows(2, 1, 2, 2, 1, 1);
  assert.deepEqual(summarize(windows), [[1, 1], [1, 1]]);
});

test("a repeat slice crossing the source boundary wraps without exposing adjacent audio", () => {
  const windows = context.getArrangementClipSourceWindows(2, 1.5, 2, 2, 1.5, 1);
  assert.deepEqual(summarize(windows), [[1.5, 0.5], [0, 0.5], [1.5, 0.5], [0, 0.5]]);
});

test("ordinary clips retain full-source repeat behavior", () => {
  const windows = context.getArrangementClipSourceWindows(2, 1.5, 2, 1.5);
  assert.deepEqual(summarize(windows), [[1.5, 0.5], [0, 1]]);
});
