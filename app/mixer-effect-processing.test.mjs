import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./07-audio.js", import.meta.url), "utf8");

function extractFunction(name, nextName) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf(`  function ${nextName}(`, start);
  assert.notEqual(start, -1, `${name} is present`);
  assert.notEqual(end, -1, `${nextName} follows ${name}`);
  return source.slice(start, end);
}

function makeAudioContext() {
  const created = [];
  const makeParam = () => ({
    value: 0,
    updates: [],
    setTargetAtTime(value, time, constant) {
      this.value = value;
      this.updates.push([value, time, constant]);
    },
  });
  const makeNode = (kind) => {
    const node = {
      kind,
      context,
      connections: [],
      gain: makeParam(),
      frequency: makeParam(),
      delayTime: makeParam(),
      pan: makeParam(),
      Q: makeParam(),
      connect(target, ...ports) {
        this.connections.push([target, ...ports]);
      },
      disconnect() {},
      start(...args) { this.startArgs = args; },
      stop() {},
    };
    created.push(node);
    return node;
  };
  const context = { sampleRate: 44100, currentTime: 3 };
  [
    ["createGain", "gain"],
    ["createBiquadFilter", "biquad"],
    ["createWaveShaper", "waveshaper"],
    ["createDelay", "delay"],
    ["createOscillator", "oscillator"],
    ["createStereoPanner", "stereo-panner"],
    ["createChannelSplitter", "splitter"],
    ["createChannelMerger", "merger"],
  ].forEach(([method, kind]) => {
    context[method] = (...args) => {
      const node = makeNode(kind);
      if (method === "createDelay") node.maxDelay = args[0];
      return node;
    };
  });
  return { context, created };
}

const state = { bpm: 120, audioContext: { currentTime: 3 } };
const createTrackEffect = new Function("state", `
  ${extractFunction("makeMixerMidSideBuses", "makeMixerMidSideOutput")}
  ${extractFunction("makeMixerMidSideOutput", "addMixerFilterStages")}
  ${extractFunction("addMixerFilterStages", "createTrackEffect")}
  ${extractFunction("createTrackEffect", "updateMixerTempoEffects")}
  return createTrackEffect;
`)(state);

test("guitar distortion and Blood Overdrive build bounded oversampled curves", () => {
  for (const effectId of ["guitarDistortion", "bloodOverdrive"]) {
    const { context, created } = makeAudioContext();
    const module = createTrackEffect(context, effectId, 50, {
      drive: 10,
      tone: 4200,
      level: -6,
      bias: 0.08,
    });
    const shaper = created.find((node) => node.kind === "waveshaper");

    assert.equal(shaper.oversample, "4x");
    assert.ok(Array.from(shaper.curve).every(Number.isFinite));
    assert.ok(Math.max(...shaper.curve) <= 1 && Math.min(...shaper.curve) >= -1);
    if (effectId === "guitarDistortion") {
      assert.ok(Math.abs(shaper.curve[0] + shaper.curve.at(-1)) < 0.00001);
    } else {
      assert.ok(shaper.curve[Math.floor(shaper.curve.length / 2)] > 0);
      assert.ok(created.some((node) => node.kind === "biquad" && node.type === "highpass" && node.frequency.value === 24));
    }
    assert.equal(module.wet.connections[0][0], module.output);
  }
});

test("Gross Beat tracks tempo changes without rebuilding its effect graph", () => {
  const { context, created } = makeAudioContext();
  const module = createTrackEffect(context, "grossBeat", 100, { rate: 2, gate: 60, feedback: 35 });
  module.effectId = "grossBeat";
  const updateMixerTempoEffects = new Function("state", "getMixerTracks", `
    ${extractFunction("updateMixerTempoEffects", "snapArrangementBar")}
    return updateMixerTempoEffects;
  `)(state, () => [{ track: { fxRuntime: [module] } }]);

  assert.equal(module.tempoSyncOscillator.frequency.value, 4);
  assert.equal(module.tempoSyncDelay.delayTime.value, 0.25);
  state.bpm = 90;
  updateMixerTempoEffects();

  assert.equal(module.tempoSyncOscillator.frequency.value, 3);
  assert.equal(module.tempoSyncDelay.delayTime.value, 1 / 3);
  assert.equal(module.tempoSyncOscillator.frequency.updates.at(-1)[1], state.audioContext.currentTime);
  assert.ok(created.some((node) => node.kind === "waveshaper"));
});

test("Delay Bank, Stereo Enhancer, and PanOMatic use stereo/modulated signal nodes", () => {
  const delayContext = makeAudioContext();
  const bank = createTrackEffect(delayContext.context, "delayBank", 35, { time: 0.24, feedback: 34, spread: 65 });
  assert.equal(delayContext.created.filter((node) => node.kind === "delay").length, 8);
  assert.equal(bank.wet.connections[0][0], bank.output);

  const stereoContext = makeAudioContext();
  createTrackEffect(stereoContext.context, "stereoEnhancer", 35, { width: 125, bassMono: 120 });
  assert.ok(stereoContext.created.some((node) => node.kind === "biquad" && node.type === "highpass" &&
    node.frequency.value === 120));
  assert.ok(stereoContext.created.some((node) => node.kind === "merger"));

  const panContext = makeAudioContext();
  createTrackEffect(panContext.context, "panOMatic", 35, { rate: 1, depth: 100, phase: 90 });
  const oscillator = panContext.created.find((node) => node.kind === "oscillator");
  assert.equal(oscillator.frequency.value, 1);
  assert.equal(oscillator.startArgs[1], 0.25);
});
