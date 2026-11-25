import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./09-instrument-browser.js", import.meta.url), "utf8");
const start = source.indexOf("  function filterAssetLibrary(");
const end = source.indexOf("  function getStepPickerInstruments(", start);
assert.notEqual(start, -1, "filterAssetLibrary is present");
assert.notEqual(end, -1, "getStepPickerInstruments follows filterAssetLibrary");
const filterAssetLibrary = new Function("$", "normalizeSoundSearch", `
  ${source.slice(start, end)}
  return filterAssetLibrary;
`)(
  (selector) => selector === ".source-sidebar" ? sidebar : { value: "" },
  (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
);

const items = [
  { textContent: "Warm Bass", hidden: false },
  { textContent: "Bright Guitar", hidden: false },
];
const group = {
  hidden: false,
  open: false,
  querySelectorAll: () => items,
};
const sidebar = {
  querySelectorAll: (selector) => selector.includes("recording-source-group")
    ? [group]
    : items,
};

test("asset library filtering hides non-matches in the sidebar", () => {
  filterAssetLibrary("guitar");

  assert.equal(items[0].hidden, true);
  assert.equal(items[1].hidden, false);
  assert.equal(group.hidden, false);
  assert.equal(group.open, true);
});
