import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./13-playback.js", import.meta.url), "utf8");
const start = source.indexOf("  function scheduleExponentialRamp(");
const end = source.indexOf("  function scheduleArrangementVoice(", start);
assert.notEqual(start, -1, "scheduleExponentialRamp is present");
assert.notEqual(end, -1, "scheduleArrangementVoice follows scheduleExponentialRamp");
const scheduleExponentialRamp = new Function(`
  ${source.slice(start, end)}
  return scheduleExponentialRamp;
`)();
const stopAudioSource = new Function(`
  ${source.slice(source.indexOf("  function stopAudioSource("), source.indexOf("  function scheduleArrangementVoice("))}
  return stopAudioSource;
`)();

test("exponential ramps reject invalid values and times", () => {
  const updates = [];
  const param = { exponentialRampToValueAtTime: (...args) => updates.push(args) };

  scheduleExponentialRamp(param, Number.NaN, 1);
  scheduleExponentialRamp(param, Number.POSITIVE_INFINITY, 1);
  scheduleExponentialRamp(param, 0, 1);
  scheduleExponentialRamp(param, 1, Number.NaN);
  scheduleExponentialRamp(param, 1, Number.POSITIVE_INFINITY);
  scheduleExponentialRamp(param, 0.0001, 1);

  assert.deepEqual(updates, [[0.0001, 1]]);
});

test("audio sources use immediate stop when their scheduled stop time is non-finite", () => {
  const calls = [];
  const source = { stop: (...args) => calls.push(args) };

  stopAudioSource(source, Number.NaN);
  stopAudioSource(source, Number.POSITIVE_INFINITY);
  stopAudioSource(source, 1);

  assert.deepEqual(calls, [[], [], [1]]);
});
