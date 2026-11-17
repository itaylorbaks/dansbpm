import { stretchAudioChannels } from "./audio-stretch-processing.mjs";

self.addEventListener("message", (event) => {
  const { id, channels, tempoRatio, pitchSemitones } = event.data;
  try {
    const outputChannels = stretchAudioChannels(channels, tempoRatio, pitchSemitones);
    const buffers = outputChannels.map((channel) => channel.buffer);
    self.postMessage({ id, channels: buffers }, buffers);
  } catch (error) {
    self.postMessage({ id, error: error?.message || "Audio time stretching failed." });
  }
});
