import assert from "node:assert/strict";
import test from "node:test";
import { stretchAudioChannels } from "./audio-stretch-processing.mjs";

function makeTone(frequency, frames, sampleRate) {
  return Float32Array.from({ length: frames }, (_, index) =>
    Math.sin(2 * Math.PI * frequency * index / sampleRate));
}

function estimateFrequency(samples, sampleRate) {
  const start = Math.floor(samples.length * 0.4);
  const end = Math.floor(samples.length * 0.6);
  let crossings = 0;
  for (let index = start + 1; index < end; index += 1) {
    if (samples[index - 1] <= 0 && samples[index] > 0) crossings += 1;
  }
  return crossings * sampleRate / (end - start);
}

test("tempo adjustment changes duration without changing pitch or stereo channels", () => {
  const sampleRate = 44_100;
  const frames = sampleRate * 2;
  const output = stretchAudioChannels([
    makeTone(440, frames, sampleRate),
    makeTone(660, frames, sampleRate),
  ], 1.5);

  assert.equal(output.length, 2);
  assert.equal(output[0].length, Math.ceil(frames / 1.5));
  assert.ok(Math.abs(estimateFrequency(output[0], sampleRate) - 440) < 2);
  assert.ok(Math.abs(estimateFrequency(output[1], sampleRate) - 660) < 2);
});

test("an explicit key shift is applied independently from tempo", () => {
  const sampleRate = 44_100;
  const output = stretchAudioChannels([makeTone(440, sampleRate, sampleRate)], 1.25, 12);

  assert.equal(output[0].length, Math.ceil(sampleRate / 1.25));
  assert.ok(Math.abs(estimateFrequency(output[0], sampleRate) - 880) < 3);
});
