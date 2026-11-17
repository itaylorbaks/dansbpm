import { SimpleFilter, SoundTouch, WebAudioBufferSource } from "../assets/vendor/soundtouch.mjs";

const INPUT_BLOCK_FRAMES = 16_384;
const INPUT_PADDING_FRAMES = INPUT_BLOCK_FRAMES * 2;
const OUTPUT_CHUNK_FRAMES = 4_096;

export function stretchAudioChannels(channels, tempoRatio, pitchSemitones = 0) {
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new TypeError("Audio stretching requires at least one channel.");
  }
  const inputFrames = channels[0].length;
  if (inputFrames === 0 || channels.some((channel) => channel.length !== inputFrames)) {
    throw new RangeError("Audio channels must have the same non-zero length.");
  }
  if (!Number.isFinite(tempoRatio) || tempoRatio < 1 / 6 || tempoRatio > 6) {
    throw new RangeError("Audio tempo ratio must be between 1/6 and 6.");
  }
  if (!Number.isFinite(pitchSemitones) || pitchSemitones < -36 || pitchSemitones > 36) {
    throw new RangeError("Audio pitch shift must be between -36 and 36 semitones.");
  }

  const paddedFrames = Math.ceil((inputFrames + INPUT_PADDING_FRAMES) / INPUT_BLOCK_FRAMES) *
    INPUT_BLOCK_FRAMES;
  const paddedChannels = channels.map((channel) => {
    const padded = new Float32Array(paddedFrames);
    padded.set(channel);
    return padded;
  });
  const outputFrames = Math.ceil(inputFrames / tempoRatio);
  const outputChannels = channels.map(() => new Float32Array(outputFrames));

  for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 2) {
    const left = paddedChannels[channelIndex];
    const right = paddedChannels[channelIndex + 1] || left;
    const source = {
      numberOfChannels: 2,
      getChannelData(channel) {
        return channel === 0 ? left : right;
      },
    };
    const soundTouch = new SoundTouch();
    soundTouch.tempo = tempoRatio;
    soundTouch.pitchSemitones = pitchSemitones;
    const filter = new SimpleFilter(new WebAudioBufferSource(source), soundTouch);
    const interleaved = new Float32Array(OUTPUT_CHUNK_FRAMES * 2);
    let outputPosition = 0;

    while (outputPosition < outputFrames) {
      const requestedFrames = Math.min(OUTPUT_CHUNK_FRAMES, outputFrames - outputPosition);
      const extractedFrames = filter.extract(interleaved, requestedFrames);
      if (extractedFrames !== requestedFrames) {
        throw new Error("The time-stretch processor returned an incomplete audio segment.");
      }
      for (let frame = 0; frame < extractedFrames; frame += 1) {
        outputChannels[channelIndex][outputPosition + frame] = interleaved[frame * 2];
        if (outputChannels[channelIndex + 1]) {
          outputChannels[channelIndex + 1][outputPosition + frame] = interleaved[frame * 2 + 1];
        }
      }
      outputPosition += extractedFrames;
    }
  }

  return outputChannels;
}
