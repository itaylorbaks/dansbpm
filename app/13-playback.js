  const vstNoiseBuffers = new WeakMap();
  const vstDriveCurves = new Map();

  function registerArrangementPlaybackSource(source) {
    const soundPreview = instrumentPreviewSourceCollector;
    if (soundPreview) {
      soundPreview.sources.add(source);
      source.addEventListener("ended", () => {
        soundPreview.sources.delete(source);
        finishInstrumentSoundPreview(soundPreview);
      }, { once: true });
    }
    if (!state.isSchedulingArrangementVoice) return;
    state.arrangementSources.add(source);
    source.addEventListener("ended", () => state.arrangementSources.delete(source), { once: true });
  }

  function scheduleExponentialRamp(param, value, time) {
    if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(time)) return;
    param.exponentialRampToValueAtTime(value, time);
  }

  function stopAudioSource(source, time) {
    if (Number.isFinite(time)) source.stop(time);
    else source.stop();
  }

  function scheduleArrangementVoice(schedule) {
    const wasSchedulingArrangementVoice = state.isSchedulingArrangementVoice;
    state.isSchedulingArrangementVoice = true;
    try {
      schedule();
    } finally {
      state.isSchedulingArrangementVoice = wasSchedulingArrangementVoice;
    }
  }

  function getSoundProcessingInput(track, outputNode) {
    const edits = getSoundProcessingEdits(track);
    const soundId = getSoundDurationKey(track);
    const hasEq = edits.eqLowGain || edits.eqMidGain || edits.eqHighGain;
    let processors = soundProcessingOutputNodes.get(outputNode);
    let processor = processors?.get(soundId);
    if (!processor && !edits.boost && !edits.reverb && !hasEq) return outputNode;
    if (!processors) {
      processors = new Map();
      soundProcessingOutputNodes.set(outputNode, processors);
    }
    if (!processor) {
      const gain = state.audioContext.createGain();
      const filters = [
        ["eqLowHz", "eqLowGain"],
        ["eqMidHz", "eqMidGain"],
        ["eqHighHz", "eqHighGain"],
      ].map(() => {
        const filter = state.audioContext.createBiquadFilter();
        filter.type = "peaking";
        filter.Q.value = 1;
        return filter;
      });
      gain.connect(filters[0]);
      filters[0].connect(filters[1]);
      filters[1].connect(filters[2]);
      filters[2].connect(outputNode);
      processor = { gain, filters, effect: null, outputNode };
      processors.set(soundId, processor);
    }
    const now = state.audioContext.currentTime;
    processor.gain.gain.setTargetAtTime(Math.pow(10, edits.boost / 20), now, 0.015);
    [
      [edits.eqLowHz, edits.eqLowGain],
      [edits.eqMidHz, edits.eqMidGain],
      [edits.eqHighHz, edits.eqHighGain],
    ].forEach(([frequency, gain], index) => {
      processor.filters[index].frequency.setTargetAtTime(frequency, now, 0.015);
      processor.filters[index].gain.setTargetAtTime(gain, now, 0.015);
    });
    if (edits.reverb > 0) {
      if (!processor.effect) {
        processor.effect = createTrackEffect(state.audioContext, "reverb", edits.reverb);
        processor.filters[2].disconnect(processor.outputNode);
        processor.filters[2].connect(processor.effect.input);
        processor.effect.output.connect(outputNode);
      }
      const mix = edits.reverb / 100;
      processor.effect.dry.gain.setTargetAtTime(1 - mix * 0.65, now, 0.015);
      processor.effect.wet.gain.setTargetAtTime(mix * 0.65, now, 0.015);
    } else if (processor.effect) {
      processor.effect.dry.gain.setTargetAtTime(1, now, 0.015);
      processor.effect.wet.gain.setTargetAtTime(0, now, 0.015);
    }
    return processor.gain;
  }

  function getSoundPlaybackRateScale(track) {
    const edits = getSoundProcessingEdits(track);
    return Math.max(0.125, Math.min(8, edits.playbackMultiplier * 100 / edits.time));
  }

  function getLibraryLoopTempoRatio(track) {
    if (!/\bloops?\b/i.test(track.family || "")) return 1;
    const match = /(?:^|[^0-9])(\d{2,3}(?:\.\d+)?)\s*BPM/i.exec(track.name || "");
    const sourceBpm = Number(match?.[1]);
    return Number.isFinite(sourceBpm) && sourceBpm >= 40 && sourceBpm <= 240
      ? state.bpm / sourceBpm
      : 1;
  }

  function getSoundTrimmedNote(track, time, duration) {
    const edits = getSoundProcessingEdits(track);
    const trimScale = (edits.trimEnd - edits.trimStart) / 100;
    const trimmedDuration = duration * trimScale;
    return {
      time: time + duration * edits.trimStart / 100,
      duration: trimmedDuration,
      trimScale,
      attack: edits.fadeIn ? trimmedDuration * edits.fadeIn / 100 : undefined,
      release: edits.fadeOut ? trimmedDuration * edits.fadeOut / 100 : undefined,
    };
  }

  function playProcessedSample(track, buffer, offset, sourceDuration, time, rate, velocity,
    maxOutputDuration, outputNode, noteOptions = {}) {
    if (sourceDuration <= 0 || rate <= 0) return;
    const edits = getSoundProcessingEdits(track);
    const canPitchShift = state.masterPitchSupported !== false &&
      typeof window.AudioWorkletNode === "function";
    const tempoRatio = getLibraryLoopTempoRatio(track);
    const playbackRate = rate * tempoRatio * (canPitchShift ? 1 : Math.pow(2, edits.pitch / 12));
    const totalSourceDuration = maxOutputDuration === null
      ? sourceDuration
      : Math.min(sourceDuration, maxOutputDuration * playbackRate);
    const sliceCount = edits.arpeggiatorLength;
    const sliceDuration = totalSourceDuration / sliceCount;
    const rateScale = getSoundPlaybackRateScale(track) * tempoRatio;
    const pitchCorrection = canPitchShift
      ? Math.max(-36, Math.min(36, edits.pitch - 12 * Math.log2(rateScale)))
      : 0;
    const attack = Math.max(0, Number.isFinite(noteOptions.attack) ? noteOptions.attack : 0);
    for (let index = 0; index < sliceCount; index += 1) {
      const segmentOffset = offset + index * sliceDuration;
      const segmentSourceDuration = Math.min(sliceDuration, buffer.duration - segmentOffset);
      const outputDuration = segmentSourceDuration / playbackRate;
      if (outputDuration <= 0) continue;
      const source = state.audioContext.createBufferSource();
      registerArrangementPlaybackSource(source);
      source.buffer = buffer;
      const envelope = state.audioContext.createGain();
      const fade = Math.min(outputDuration / 2, Math.max(
        sliceCount > 1 ? edits.crossfade / 1000 : 0,
        Math.min(0.02, outputDuration * 0.12),
      ));
      const segmentTime = time + index * (sliceCount > 1
        ? Math.max(0, getStepDuration() - fade)
        : getStepDuration());
      source.playbackRate.setValueAtTime(playbackRate, segmentTime);
      const noteAttack = Math.min(attack, outputDuration * 0.7, outputDuration - fade);
      envelope.gain.setValueAtTime(0.0001, segmentTime);
      envelope.gain.linearRampToValueAtTime(velocity, segmentTime + Math.max(fade, noteAttack));
      envelope.gain.setValueAtTime(velocity, segmentTime + Math.max(fade, outputDuration - fade));
      envelope.gain.linearRampToValueAtTime(0.0001, segmentTime + outputDuration);
      let pitchNode = null;
      if (Math.abs(pitchCorrection) >= 0.001) {
        pitchNode = new window.AudioWorkletNode(state.audioContext, "dansbpm-master-pitch");
        pitchNode.parameters.get("semitones").setValueAtTime(pitchCorrection, segmentTime);
        source.connect(pitchNode);
        pitchNode.connect(envelope);
      } else {
        source.connect(envelope);
      }
      envelope.connect(outputNode);
      source.onended = () => {
        source.disconnect();
        envelope.disconnect();
        pitchNode?.disconnect();
      };
      source.start(segmentTime, segmentOffset, segmentSourceDuration);
    }
  }

  function triggerTrack(track, time, variant = track.variant, noteDuration = getStepDuration(), outputTrack = track, outputNode = null, pitchOffset = 0) {
    const context = state.audioContext;
    const pitchRatio = Math.pow(2, ((track.pitch || 0) + pitchOffset) / 12);
    ensureTrackAudio(outputTrack);
    const output = getSoundProcessingInput(track, outputNode || outputTrack.gainNode);
    if (track.sample || track.sampleUrl || track.kind === "sample") {
      const sampleBuffer = getLibrarySamplePlaybackBuffer(track);
      if (!sampleBuffer) throw new Error(`The audio for ${track.name} is unavailable.`);
      const range = getSamplePlaybackRange(track, sampleBuffer);
      const rateScale = getSoundPlaybackRateScale(track);
      const rate = pitchRatio * rateScale;
      const sourceDuration = range.duration;
      const maxOutputDuration = track.sampleOneShot
        ? null
        : noteDuration * getSoundProcessingEdits(track).arpeggiatorLength;
      playProcessedSample(track, sampleBuffer, range.offset, sourceDuration, time, rate,
        1, maxOutputDuration, output);
      return;
    }
    const trimmedNote = getSoundTrimmedNote(track, time, noteDuration);
    time = trimmedNote.time;
    noteDuration = trimmedNote.duration;
    const durationScale = noteDuration / getStepDuration();
    switch (track.kind) {
      case "kick": playKick(context, output, time, variant, durationScale, pitchRatio); break;
      case "snare": playSnare(context, output, time, variant, durationScale, pitchRatio); break;
      case "clap": playClap(context, output, time, variant, durationScale, pitchRatio); break;
      case "hat": playHat(context, output, time, false, variant, durationScale, pitchRatio); break;
      case "openhat": playHat(context, output, time, true, variant, durationScale, pitchRatio); break;
      case "rim": playRim(context, output, time, variant, durationScale, pitchRatio); break;
      case "drumkit": playDrumKitNote(track, time, 36, noteDuration, 0.8, outputTrack, output, trimmedNote.attack, trimmedNote.release); break;
      case "instrument": playInstrumentVoice(track, time, 60 + (track.pitch || 0), noteDuration, 0.8, outputTrack, output, {
        attack: trimmedNote.attack,
        soundFadeOut: trimmedNote.release,
        soundDurationScale: trimmedNote.trimScale,
      }); break;
      default: break;
    }
  }

  function playPianoNote(track, time, midi, duration, velocity = 0.8, outputTrack = track, outputNode = null, noteOptions = {}) {
    if (!track) return;
    velocity *= Math.max(0, Math.min(1, noteOptions.volume ?? 1));
    ensureSequencerTrackAudio(track);
    ensureTrackAudio(outputTrack);
    outputNode ||= outputTrack.gainNode;
    outputNode = getSoundProcessingInput(track, outputNode);
    const pan = Number.isFinite(noteOptions.pan) ? Math.max(-1, Math.min(1, noteOptions.pan)) : 0;
    if (pan !== 0) {
      const panner = state.audioContext.createStereoPanner();
      panner.pan.setValueAtTime(pan, time);
      panner.connect(outputNode);
      outputNode = panner;
    }
    if (noteOptions.audioSlice) {
      playPianoAudioSlice(noteOptions.audioSlice, time, midi, duration, velocity, outputNode, noteOptions);
      return;
    }
    const rowPitch = Number.isFinite(track.pitch) ? track.pitch : 0;
    const playedMidi = midi + rowPitch;
    if (track.sample || track.sampleUrl || track.kind === "sample") {
      const sampleBuffer = getLibrarySamplePlaybackBuffer(track);
      if (!sampleBuffer) throw new Error(`The audio for ${track.name} is unavailable.`);
      const detune = Number.isFinite(noteOptions.detune) ? noteOptions.detune : 0;
      const rootMidi = Number.isFinite(track.sampleRootMidi) ? track.sampleRootMidi : 60;
      const range = getSamplePlaybackRange(track, sampleBuffer);
      const rateScale = getSoundPlaybackRateScale(track);
      const rate = Math.pow(2, (playedMidi - rootMidi + detune / 100) / 12) * rateScale;
      const sourceDuration = range.duration;
      const arpLength = getSoundProcessingEdits(track).arpeggiatorLength;
      const maxOutputDuration = track.sampleOneShot ? null : Math.max(0.01, duration) * arpLength;
      playProcessedSample(track, sampleBuffer, range.offset, sourceDuration, time, rate,
        velocity, maxOutputDuration, outputNode, noteOptions);
      return;
    }
    const trimmedNote = getSoundTrimmedNote(track, time, duration);
    if (track.kind === "instrument") {
      playInstrumentVoice(track, trimmedNote.time, playedMidi, trimmedNote.duration, velocity, outputTrack, outputNode, {
        ...noteOptions,
        attack: trimmedNote.attack ?? noteOptions.attack,
        soundFadeOut: trimmedNote.release,
        soundDurationScale: trimmedNote.trimScale,
      });
      return;
    }
    if (track.kind === "drumkit") {
      playDrumKitNote(track, trimmedNote.time, playedMidi, trimmedNote.duration, velocity, outputTrack, outputNode,
        trimmedNote.attack ?? noteOptions.attack, trimmedNote.release);
      return;
    }
    triggerTrack(track, time, track.variant, duration, outputTrack, outputNode, midi - getDefaultStepMidi(track));
  }

  function playPianoAudioSlice(audioSlice, time, midi, duration, velocity, outputNode, noteOptions) {
    const clip = getPianoRollAudioClipById(audioSlice.clipId);
    if (!clip?.buffer) return;
    const offset = Math.max(0, Math.min(clip.buffer.duration, audioSlice.offsetSeconds));
    const sourceDuration = Math.max(0, Math.min(
      clip.buffer.duration - offset,
      audioSlice.durationSeconds,
    ));
    if (!sourceDuration) return;
    const rootMidi = Number.isInteger(audioSlice.rootMidi) ? audioSlice.rootMidi : 60;
    const detune = Number.isFinite(noteOptions.detune) ? noteOptions.detune : 0;
    const tempoRatio = getAudioClipTempoRatio(clip);
    const keyShiftSemitones = Number.isFinite(clip.audioAdjustment?.keyShiftSemitones)
      ? clip.audioAdjustment.keyShiftSemitones : 0;
    const pitchEdited = audioSlice.pitchEdited === true;
    const noteRate = Math.pow(2, (midi - rootMidi + detune / 100) / 12);
    const rate = pitchEdited
      ? noteRate
      : tempoRatio * Math.pow(2, (midi - rootMidi + keyShiftSemitones + detune / 100) / 12);
    const playbackBuffer = pitchEdited
      ? getAudioClipPlaybackBuffer(state.audioContext, clip, { ignoreReverse: true })
      : clip.buffer;
    const playbackOffset = pitchEdited ? offset / tempoRatio : offset;
    const requestedOutputDuration = Math.max(0.005, duration +
      Math.max(0, audioSlice.crossfadeOutSeconds || 0));
    const bufferDuration = pitchEdited
      ? Math.min(playbackBuffer.duration - playbackOffset, requestedOutputDuration * rate)
      : Math.min(sourceDuration, requestedOutputDuration);
    const outputDuration = bufferDuration / rate;
    const dropOff = Math.max(0, Math.min(90, audioSlice.dropOff ?? 10)) / 100;
    const crossfadeOut = Math.max(0, audioSlice.crossfadeOutSeconds || 0);
    const crossfadeIn = Math.max(0, audioSlice.crossfadeInSeconds || 0);
    const fadeDuration = pitchEdited
      ? Math.min(outputDuration, crossfadeOut || Math.max(0.001, Math.min(0.005, outputDuration * dropOff)))
      : Math.min(outputDuration, Math.max(0.003, outputDuration * dropOff));
    const fadeStart = Math.max(0, outputDuration - fadeDuration);
    const attack = Math.max(0, Math.min(pitchEdited ? (crossfadeIn || 0.002)
      : Number.isFinite(noteOptions.attack) ? noteOptions.attack : 0, fadeStart));
    const source = state.audioContext.createBufferSource();
    registerArrangementPlaybackSource(source);
    source.buffer = playbackBuffer;
    source.playbackRate.setValueAtTime(rate, time);
    const envelope = state.audioContext.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(velocity, time + attack);
    if (fadeStart > attack) envelope.gain.setValueAtTime(velocity, time + fadeStart);
    envelope.gain.linearRampToValueAtTime(0.0001, time + outputDuration);
    let pitchNode = null;
    const pitchCorrection = -12 * Math.log2(tempoRatio);
    if (!pitchEdited && Math.abs(pitchCorrection) >= 0.001 && state.masterPitchSupported !== false) {
      pitchNode = new window.AudioWorkletNode(state.audioContext, "dansbpm-master-pitch");
      pitchNode.parameters.get("semitones").setValueAtTime(pitchCorrection, time);
      source.connect(pitchNode);
      pitchNode.connect(envelope);
    } else {
      source.connect(envelope);
    }
    const clipEnvelope = noteOptions.clipEnvelope;
    let clipGainNode = null;
    if (clipEnvelope) {
      clipGainNode = state.audioContext.createGain();
      const clipGain = Math.max(0, Math.min(2, clipEnvelope.gain));
      const clipOffset = Math.max(0, clipEnvelope.offsetSeconds);
      const clipDuration = Math.max(0, clipEnvelope.durationSeconds);
      const fadeIn = Math.max(0, clipEnvelope.fadeInSeconds);
      const fadeOut = Math.max(0, clipEnvelope.fadeOutSeconds);
      if (fadeIn || fadeOut) {
        const curve = new Float32Array(33);
        curve.forEach((_, index) => {
          const clipTime = clipOffset + outputDuration * index / (curve.length - 1);
          const fadeInGain = fadeIn ? Math.min(1, clipTime / fadeIn) : 1;
          const fadeOutGain = fadeOut ? Math.min(1, Math.max(0, (clipDuration - clipTime) / fadeOut)) : 1;
          curve[index] = clipGain * Math.min(fadeInGain, fadeOutGain);
        });
        clipGainNode.gain.setValueCurveAtTime(curve, time, outputDuration);
      } else {
        clipGainNode.gain.setValueAtTime(clipGain, time);
      }
      envelope.connect(clipGainNode);
      clipGainNode.connect(outputNode);
    } else {
      envelope.connect(outputNode);
    }
    source.onended = () => {
      pitchNode?.disconnect();
      clipGainNode?.disconnect();
    };
    source.start(time, playbackOffset, bufferDuration);
  }

  function getVstNoiseBuffer(context) {
    let buffer = vstNoiseBuffers.get(context);
    if (buffer) return buffer;
    buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
    vstNoiseBuffers.set(context, buffer);
    return buffer;
  }

  function getVstDriveCurve(amount) {
    const strength = Math.round(Math.max(0, Math.min(100, amount)));
    if (!strength) return null;
    if (vstDriveCurves.has(strength)) return vstDriveCurves.get(strength);
    const curve = new Float32Array(2048);
    const drive = 1 + strength * 0.18;
    const normalization = Math.tanh(drive);
    curve.forEach((_, index) => {
      const input = index * 2 / (curve.length - 1) - 1;
      curve[index] = Math.tanh(input * drive) / normalization;
    });
    vstDriveCurves.set(strength, curve);
    return curve;
  }

  function makeVstPeriodicWave(context, shape, position, frequency) {
    const amount = Math.max(0, Math.min(100, position));
    if (amount === 0) return null;
    const partials = Math.max(1, Math.min(48, Math.floor(context.sampleRate * 0.45 / frequency)));
    const real = new Float32Array(partials + 1);
    const imaginary = new Float32Array(partials + 1);
    const morph = amount / 100;
    for (let partial = 1; partial <= partials; partial += 1) {
      let amplitude = 0;
      if (shape === "sawtooth") amplitude = (partial % 2 ? 1 : -1) / partial;
      else if (shape === "square" && partial % 2) amplitude = 1 / partial;
      else if (shape === "triangle" && partial % 2) {
        amplitude = (partial % 4 === 1 ? 1 : -1) / (partial * partial);
      } else if (shape === "sine" && partial === 1) amplitude = 1;
      if (!amplitude) continue;
      const brightness = 1 + morph * 2.5 * (partial - 1) / Math.max(1, partials - 1);
      const phase = morph * Math.PI * 0.45 * (partial - 1) / Math.max(1, partials - 1);
      amplitude *= brightness;
      real[partial] = amplitude * Math.sin(phase);
      imaginary[partial] = amplitude * Math.cos(phase);
    }
    return context.createPeriodicWave(real, imaginary);
  }

  function playDansBpmSynthVoice(track, time, midi, duration, velocity, outputNode, noteOptions = {}) {
    const context = state.audioContext;
    const patch = track.patch || {};
    const parameter = (key, fallback) => Number.isFinite(patch[key]) ? patch[key] : fallback;
    const engine = patch.engine || "dansbpm";
    const frequency = 440 * Math.pow(2, (midi - 69) / 12) *
      Math.pow(2, (engine === "dansbpm-bell" ? parameter("bellTune", 0) : 0) / 12);
    const durationScale = Number.isFinite(noteOptions.soundDurationScale)
      ? Math.max(0.01, Math.min(1, noteOptions.soundDurationScale))
      : 1;
    const attack = Math.min(
      Math.max(0, Number.isFinite(noteOptions.attack) ? noteOptions.attack : parameter("attack", 0.01)),
      Math.max(0.002, duration * 0.7),
    );
    const decay = Math.min(Math.max(0, parameter("decay", 0.25)), Math.max(0, duration - attack));
    const sustain = Math.max(0, Math.min(0.9, parameter("sustain", 0.55)));
    const release = Math.max(0.01, Number.isFinite(noteOptions.soundFadeOut)
      ? noteOptions.soundFadeOut
      : parameter("release", 0.25) * durationScale);
    const gateEnd = time + Math.max(0.02, duration);
    const outputLevel = Number.isFinite(patch.output) ? Math.max(0, Math.min(1, patch.output)) : 0.72;
    const peak = velocity * 0.48 * outputLevel *
      (engine === "dansbpm-bell" ? parameter("bellStrike", 100) / 100 : 1);
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const cutoff = Math.max(80, Math.min(18000, Number(patch.cutoff) || 3200));
    const filterPeak = Math.min(18000, cutoff * Math.pow(2, parameter("filterEnvOctaves", 0)));
    const filterAttack = Math.min(Math.max(0, parameter("filterAttack", 0.02)), duration * 0.7);
    const filterDecay = Math.min(Math.max(0, parameter("filterDecay", 0.35)),
      Math.max(0, duration - filterAttack));
    const filterSustain = Math.max(0, Math.min(1, parameter("filterSustain", 0.25)));
    const filterSustainFrequency = cutoff * Math.pow(2, Math.log2(Math.max(1, filterPeak / cutoff)) * filterSustain);

    filter.type = ["lowpass", "highpass", "bandpass", "notch"].includes(patch.filterType)
      ? patch.filterType : "lowpass";
    filter.Q.setValueAtTime(Math.max(0.1, Math.min(18, Number(patch.resonance) || 0.2)) * 4, time);
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.linearRampToValueAtTime(filterPeak, time + filterAttack);
    filter.frequency.linearRampToValueAtTime(filterSustainFrequency, time + filterAttack + filterDecay);
    filter.frequency.setValueAtTime(filterSustainFrequency, gateEnd);
    filter.frequency.linearRampToValueAtTime(cutoff, gateEnd + release);

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(peak, time + attack);
    envelope.gain.linearRampToValueAtTime(peak * sustain, time + attack + decay);
    envelope.gain.setValueAtTime(peak * sustain, gateEnd);
    envelope.gain.linearRampToValueAtTime(0.0001, gateEnd + release);

    const osc1Wave = patch.wave || "sawtooth";
    const wavetablePosition = parameter("wavetablePosition", 0);
    let oscillatorSettings;
    if (engine === "dansbpm-bell") {
      const inharmonicity = parameter("bellInharmonicity", 0.018);
      const brightness = parameter("bellBrightness", 58) / 100;
      const partialCount = Math.round(Math.max(3, Math.min(12, parameter("bellPartialCount", 8))));
      const damping = Math.max(0, Math.min(100, parameter("bellDamping", 0))) / 100;
      oscillatorSettings = Array.from({ length: partialCount }, (_, index) => {
        const partial = index + 1;
        const ratio = partial * Math.sqrt(1 + inharmonicity * partial * partial);
        const level = Math.pow(partial, -1.35) * (0.5 + brightness * partial * 0.12);
        return {
          type: partial === 1 ? osc1Wave : "sine",
          rate: frequency * ratio,
          level,
          detune: (Number(noteOptions.detune) || 0) +
            ((partial - (partialCount + 1) / 2) / Math.max(1, partialCount - 1)) * parameter("bellSpread", 0),
          decay: Math.max(0.08,
            parameter("decay", 3.2) * (1 - damping * 0.8) / Math.pow(partial, 0.38)),
          fm: partial === 1 ? parameter("fmAmount", 0) : 0,
          fmRatio: parameter("fmRatio", 2.71),
        };
      });
    } else if (engine === "dansbpm-piano") {
      const brightness = parameter("pianoBrightness", 52) / 100;
      const hammer = parameter("pianoHammer", 18) / 100;
      const damping = parameter("pianoDamping", 42) / 100;
      const stringCount = Math.round(Math.max(1, Math.min(3, parameter("pianoStringCount", 1))));
      const stringWidth = Math.max(0, Math.min(30, parameter("pianoStringWidth", 0)));
      const partialLevels = [0.58, 0.25, 0.13, 0.075, 0.045, 0.028, 0.018];
      oscillatorSettings = partialLevels.flatMap((level, index) => {
        const partial = index + 1;
        const strike = 0.35 + brightness * 0.65 + hammer * Math.max(0, partial - 2) * 0.09;
        return Array.from({ length: stringCount }, (_, stringIndex) => ({
          type: partial === 1 ? osc1Wave : (partial % 2 ? "sine" : (patch.osc2Wave || "sine")),
          rate: frequency * partial,
          level: level * strike / stringCount,
          detune: (Number(noteOptions.detune) || 0) +
            ((stringIndex - (stringCount - 1) / 2) / Math.max(1, stringCount - 1)) * stringWidth,
          decay: Math.max(0.08,
            parameter("decay", 1.1) * (1 - damping * 0.72) / (1 + index * 0.14)),
        }));
      });
    } else if (engine === "dansbpm-808") {
      oscillatorSettings = [
        {
          type: osc1Wave,
          rate: frequency,
          level: 0.78,
          detune: Number(noteOptions.detune) || 0,
          pitchDrop: parameter("pitchDrop", 30),
        },
        {
          type: patch.osc2Wave || "triangle",
          rate: frequency * Math.pow(2, parameter("subTune", 0) / 12),
          level: Math.max(0, Math.min(0.24, parameter("subLevel", 0.12))),
          detune: Number(noteOptions.detune) || 0,
          pitchDrop: parameter("pitchDrop", 30),
        },
      ];
    } else if (engine === "dansbpm-kick") {
      const kickFrequency = Math.max(28, Math.min(120,
        55 * Math.pow(2, (midi - 60) / 12)));
      const pitchDrop = parameter("kickPitchDrop", 34);
      oscillatorSettings = [
        {
          type: "sine",
          rate: kickFrequency,
          level: 0.8,
          detune: Number(noteOptions.detune) || 0,
          pitchDrop,
          pitchDropTime: parameter("kickPitchTime", 0.045),
          decay: parameter("kickBody", 0.36),
        },
        {
          type: "sine",
          rate: kickFrequency * 2.4,
          level: Math.max(0, Math.min(0.6, parameter("kickHarmonic", 18) / 100)),
          detune: Number(noteOptions.detune) || 0,
          pitchDrop: pitchDrop * 0.55,
          pitchDropTime: parameter("kickPitchTime", 0.045) * 0.65,
          decay: 0.045,
        },
      ];
    } else {
      const unisonCount = Math.round(Math.max(1, Math.min(7, parameter("unison", 1))));
      const unisonSpread = Math.max(0, Math.min(60, parameter("unisonSpread", 0)));
      oscillatorSettings = Array.from({ length: unisonCount }, (_, index) => ({
        type: osc1Wave,
        rate: frequency * Math.pow(2, parameter("osc1Octave", 0)),
        level: parameter("osc1Level", 0.62) / Math.sqrt(unisonCount),
        detune: (Number(noteOptions.detune) || 0) +
          (unisonCount === 1 ? 0 : (index / (unisonCount - 1) - 0.5) * unisonSpread),
        wavetablePosition,
        pan: unisonCount === 1 ? 0 : (index / (unisonCount - 1) - 0.5) * 1.2,
        fm: parameter("fmAmount", 0),
        fmRatio: parameter("fmRatio", 2),
      }));
      oscillatorSettings.push(
        {
          type: patch.osc2Wave || osc1Wave,
          rate: frequency * Math.pow(2, parameter("osc2Octave", 0)),
          level: Math.max(0, Math.min(0.7, parameter("osc2Level", 0.28))),
          detune: parameter("osc2Detune", 0) + (Number(noteOptions.detune) || 0),
          wavetablePosition,
        },
        {
          type: "sine",
          rate: frequency / 2,
          level: Math.max(0, Math.min(0.7, parameter("subLevel", 0))),
          detune: 0,
        },
      );
    }
    const activeOscillators = oscillatorSettings.filter((oscillator) => oscillator.level > 0).map((settings) => {
      const oscillator = context.createOscillator();
      registerArrangementPlaybackSource(oscillator);
      const gain = context.createGain();
      oscillator.type = settings.type;
      if (settings.pitchDrop > 0) {
        const startFrequency = settings.rate * Math.pow(2, settings.pitchDrop / 12);
        oscillator.frequency.setValueAtTime(startFrequency, time);
        scheduleExponentialRamp(oscillator.frequency, settings.rate,
          time + Math.max(0.01, settings.pitchDropTime ||
            parameter("pitchDropTime", engine === "dansbpm-kick" ? 0.045 : 0.11)));
      } else {
        oscillator.frequency.setValueAtTime(settings.rate, time);
      }
      oscillator.detune.setValueAtTime(settings.detune, time);
      gain.gain.setValueAtTime(settings.level, time);
      if (settings.decay) {
        scheduleExponentialRamp(gain.gain, 0.0001,
          time + Math.max(0.02, Math.min(8, settings.decay)));
      }
      const periodicWave = makeVstPeriodicWave(context, settings.type, settings.wavetablePosition || 0, settings.rate);
      if (periodicWave) oscillator.setPeriodicWave(periodicWave);
      if (settings.pan) {
        const panner = context.createStereoPanner();
        panner.pan.setValueAtTime(settings.pan, time);
        gain.connect(panner);
        panner.connect(filter);
      } else {
        gain.connect(filter);
      }
      oscillator.connect(gain);
      oscillator.start(time);
      stopAudioSource(oscillator, gateEnd + release + 0.02);
      if (settings.fm > 0) {
        const modulator = context.createOscillator();
        registerArrangementPlaybackSource(modulator);
        const modulatorGain = context.createGain();
        modulator.type = patch.osc2Wave || "sine";
        modulator.frequency.setValueAtTime(settings.rate * (settings.fmRatio || 2), time);
        modulatorGain.gain.setValueAtTime(settings.rate * settings.fm / 100 * 0.18, time);
        modulator.connect(modulatorGain);
        modulatorGain.connect(oscillator.frequency);
        modulator.start(time);
        stopAudioSource(modulator, gateEnd + release + 0.02);
      }
      return oscillator;
    });

    const driveCurve = getVstDriveCurve(parameter("drive", 0));
    if (driveCurve) {
      const shaper = context.createWaveShaper();
      shaper.curve = driveCurve;
      shaper.oversample = "4x";
      filter.connect(shaper);
      shaper.connect(envelope);
    } else {
      filter.connect(envelope);
    }
    envelope.connect(outputNode);

    const is808 = engine === "dansbpm-808";
    const isKick = engine === "dansbpm-kick";
    const noiseLevel = Math.max(0, Math.min(0.7,
      is808 || isKick ? parameter("clickLevel", 0) :
        engine === "dansbpm-piano"
          ? parameter("pianoKeyNoise", 0)
          : parameter("noiseLevel", 0)));
    if (noiseLevel > 0) {
      const noise = context.createBufferSource();
      registerArrangementPlaybackSource(noise);
      noise.buffer = getVstNoiseBuffer(context);
      noise.loop = true;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(noiseLevel, time);
      if (is808 || isKick) {
        const clickFilter = context.createBiquadFilter();
        clickFilter.type = "lowpass";
        clickFilter.frequency.setValueAtTime(parameter("clickTone", 3800), time);
        noise.connect(clickFilter);
        clickFilter.connect(noiseGain);
        scheduleExponentialRamp(noiseGain.gain, 0.0001, time +
          (isKick ? parameter("kickClickDuration", 0.025) : parameter("clickDuration", 0.045)));
      } else {
        noise.connect(noiseGain);
      }
      noiseGain.connect(filter);
      noise.start(time);
      stopAudioSource(noise, is808 || isKick
        ? time + (isKick
          ? parameter("kickClickDuration", 0.025) + 0.015
          : parameter("clickDuration", 0.045) + 0.015)
        : gateEnd + release + 0.02);
    }

    const delayMix = Math.max(0, Math.min(100, parameter("delayMix", 0))) / 100;
    if (delayMix > 0) {
      const delay = context.createDelay(1.5);
      const echoGain = context.createGain();
      delay.delayTime.setValueAtTime(60 / Math.max(30, state.bpm) * 0.75, time);
      echoGain.gain.setValueAtTime(delayMix * 0.36, time);
      envelope.connect(delay);
      delay.connect(echoGain);
      echoGain.connect(outputNode);
    }

    const lfoRate = Math.max(0, Math.min(20, parameter("lfoRate", 0)));
    const lfoDepth = Math.max(0, Math.min(100, parameter("lfoDepth", 0)));
    if (activeOscillators.length && lfoRate > 0 && lfoDepth > 0) {
      const lfo = context.createOscillator();
      registerArrangementPlaybackSource(lfo);
      const lfoGain = context.createGain();
      lfo.frequency.setValueAtTime(lfoRate, time);
      const target = patch.lfoTarget || "pitch";
      const modulationScale = target === "filter"
        ? cutoff * 0.2 * lfoDepth / 100
        : target === "amp"
          ? peak * 0.45 * lfoDepth / 100
          : lfoDepth;
      lfoGain.gain.setValueAtTime(modulationScale, time);
      lfo.connect(lfoGain);
      if (target === "filter") lfoGain.connect(filter.frequency);
      else if (target === "amp") lfoGain.connect(envelope.gain);
      else activeOscillators.forEach((oscillator) => lfoGain.connect(oscillator.detune));
      lfo.start(time);
      stopAudioSource(lfo, gateEnd + release + 0.02);
    }
  }

  function playInstrumentVoice(track, time, midi, duration, velocity, outputTrack = track, outputNode = outputTrack.gainNode, noteOptions = {}) {
    const context = state.audioContext;
    const patch = track.patch || {};
    if (["dansbpm", "dansbpm-bell", "dansbpm-piano", "dansbpm-808", "dansbpm-kick"].includes(patch.engine)) {
      playDansBpmSynthVoice(track, time, midi, duration, velocity, outputNode, noteOptions);
      return;
    }
    const patchValue = (key, fallback) => {
      const value = Number(patch[key]);
      return Number.isFinite(value) && value !== 0 ? value : fallback;
    };
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const noteAttack = Number.isFinite(noteOptions.attack) ? noteOptions.attack : patchValue("attack", 0.005);
    const attack = Math.min(Math.max(0, noteAttack), Math.max(0.002, duration * 0.7));
    const decay = Math.min(Math.max(0, patchValue("decay", 0.1)), Math.max(0.005, duration - attack));
    const soundDurationScale = Number.isFinite(noteOptions.soundDurationScale)
      ? Math.max(0.01, Math.min(1, noteOptions.soundDurationScale))
      : 1;
    const release = Math.max(0.01, Number.isFinite(noteOptions.soundFadeOut)
      ? noteOptions.soundFadeOut
      : patchValue("release", 0.1) * soundDurationScale);
    const sustain = Math.max(0.04, Math.min(0.9, patchValue("sustain", 0.3)));
    const gateEnd = time + Math.max(0.02, duration);
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    registerArrangementPlaybackSource(oscillator);
    const peak = velocity * 0.42;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.max(100, patchValue("cutoff", 5000)), time);
    filter.Q.value = 0.7;
    oscillator.type = patch.wave || "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.detune.setValueAtTime(patchValue("detune", 0) + (Number(noteOptions.detune) || 0), time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(peak, time + attack);
    envelope.gain.linearRampToValueAtTime(peak * sustain, time + attack + decay);
    envelope.gain.setValueAtTime(peak * sustain, gateEnd);
    envelope.gain.linearRampToValueAtTime(0.0001, gateEnd + release);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(outputNode);
    oscillator.start(time);
    stopAudioSource(oscillator, gateEnd + release + 0.02);
    const harmonic = patchValue("harmonic", 0);
    if (harmonic > 0) {
      const overtone = context.createOscillator();
      registerArrangementPlaybackSource(overtone);
      const overtoneGain = context.createGain();
      overtone.type = patch.wave || "sine";
      overtone.frequency.setValueAtTime(frequency * harmonic, time);
      overtone.detune.setValueAtTime(patchValue("detune", 0) + (Number(noteOptions.detune) || 0), time);
      overtoneGain.gain.setValueAtTime(Math.max(0, Math.min(0.6, patchValue("harmonicLevel", 0.15))), time);
      overtone.connect(overtoneGain);
      overtoneGain.connect(filter);
      overtone.start(time);
      stopAudioSource(overtone, gateEnd + release + 0.02);
    }
  }

  function playDrumKitNote(track, time, midi, duration, velocity, outputTrack = track,
    outputNode = outputTrack.gainNode, attack = 0, fadeOut = 0) {
    const kit = track.patch?.kit || "909";
    const sounds = DRUM_KIT_PROFILES[kit] || DRUM_KIT_PROFILES["909"];
    const scale = Math.max(0.25, Math.min(4, duration / getStepDuration()));
    const context = state.audioContext;
    const noteGain = state.audioContext.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + Math.max(0, Number.isFinite(attack) ? attack : 0));
    if (Number.isFinite(fadeOut) && fadeOut > 0) {
      const fadeStart = Math.max(time + Math.max(0, attack), time + duration - fadeOut);
      noteGain.gain.setValueAtTime(velocity, fadeStart);
      noteGain.gain.linearRampToValueAtTime(0.0001, time + duration);
    }
    noteGain.connect(outputNode);
    if (midi === 35 || midi === 36) playKick(context, noteGain, time, midi, sounds.kick, scale);
    else if (midi === 37) playRim(context, noteGain, time, sounds.rim, scale * 0.7);
    else if (midi === 38) playSnare(context, noteGain, time, sounds.snare, scale);
    else if (midi === 39) playClap(context, noteGain, time, sounds.clap, scale);
    else if (midi === 40) playSnare(context, noteGain, time, sounds.altSnare, scale);
    else if ([41, 43, 45, 47, 48, 50, 60, 61, 62, 63, 64, 65, 66, 67, 68, 75, 76, 77].includes(midi)) {
      playDrumKitTom(noteGain, time, midi, velocity, scale, kit);
    }
    else if (midi === 42) playHat(context, noteGain, time, false, sounds.hat, scale);
    else if (midi === 44) playHat(context, noteGain, time, false, sounds.pedalHat, scale * 0.65);
    else if (midi === 46) playHat(context, noteGain, time, true, sounds.openhat, scale);
    else if ([49, 52, 55, 57, 82, 83].includes(midi)) playHat(context, noteGain, time, true, sounds.cymbal, scale * ([52, 82].includes(midi) ? 1.8 : 2.4));
    else if ([51, 59].includes(midi)) playHat(context, noteGain, time, true, sounds.ride, scale * 1.8);
    else if (midi === 53 || midi === 56) playDrumKitBell(noteGain, time, midi === 53 ? 1120 : 680, velocity, scale);
    else if (midi === 54) playNoise(context, noteGain, time, 0.15 * scale, 4200, 0.2);
    else if (midi === 58) playNoise(context, noteGain, time, 0.23 * scale, 1100, 0.26);
    else if ([69, 70, 73, 74, 78, 79].includes(midi)) {
      const percussion = {
        69: [0.12, 3200, 0.18], 70: [0.12, 5600, 0.18], 73: [0.14, 2800, 0.24],
        74: [0.34, 1800, 0.3], 78: [0.11, 1500, 0.2], 79: [0.28, 900, 0.3],
      }[midi];
      playNoise(context, noteGain, time, percussion[0] * scale, percussion[1], percussion[2]);
    }
    else if (midi === 71 || midi === 72) playDrumKitTone(noteGain, time, midi === 71 ? 1450 : 980, midi === 71 ? 0.12 : 0.3, velocity);
    else if (midi === 80 || midi === 81) playDrumKitBell(noteGain, time, midi === 80 ? 1680 : 2200, velocity, scale);
    else playRim(context, noteGain, time, sounds.rim, scale);
  }

  function playDrumKitTom(output, time, midi, velocity, scale, kit) {
    const context = state.audioContext;
    const pitches = {
      41: [175, 90], 43: [195, 100], 45: [220, 112], 47: [255, 130], 48: [290, 145], 50: [340, 170],
      60: [540, 300], 61: [320, 180], 62: [410, 260], 63: [360, 140], 64: [230, 90],
      65: [600, 300], 66: [420, 220], 67: [780, 420], 68: [560, 310], 75: [1800, 950],
      76: [1200, 650], 77: [720, 380],
    };
    const [startPitch, endPitch] = pitches[midi] || pitches[45];
    const baseDuration = { 75: 0.11, 76: 0.13, 77: 0.16 }[midi] || (kit === "industrial" ? 0.28 : 0.34);
    const duration = Math.min(0.75, baseDuration * scale);
    const oscillator = context.createOscillator();
    registerArrangementPlaybackSource(oscillator);
    const envelope = context.createGain();
    oscillator.type = kit === "industrial" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(startPitch, time);
    scheduleExponentialRamp(oscillator.frequency, endPitch, time + duration * 0.72);
    envelope.gain.setValueAtTime(0.0001, time);
    scheduleExponentialRamp(envelope.gain, Math.max(0.0002, velocity * 0.72), time + 0.004);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    stopAudioSource(oscillator, time + duration + 0.02);
  }

  function playDrumKitBell(output, time, frequency, velocity, scale) {
    const context = state.audioContext;
    const envelope = context.createGain();
    const duration = Math.min(0.55, 0.28 * scale);
    envelope.gain.setValueAtTime(0.0001, time);
    scheduleExponentialRamp(envelope.gain, Math.max(0.0002, velocity * 0.24), time + 0.003);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + duration);
    [frequency, frequency * 1.48].forEach((partial, index) => {
      const oscillator = context.createOscillator();
      registerArrangementPlaybackSource(oscillator);
      const partialGain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(partial, time);
      partialGain.gain.value = index ? 0.42 : 1;
      oscillator.connect(partialGain);
      partialGain.connect(envelope);
      oscillator.start(time);
      stopAudioSource(oscillator, time + duration + 0.02);
    });
    envelope.connect(output);
  }

  function playDrumKitTone(output, time, frequency, duration, velocity) {
    const context = state.audioContext;
    const oscillator = context.createOscillator();
    registerArrangementPlaybackSource(oscillator);
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, time);
    envelope.gain.setValueAtTime(0.0001, time);
    scheduleExponentialRamp(envelope.gain, Math.max(0.0002, velocity * 0.2), time + 0.004);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    stopAudioSource(oscillator, time + duration + 0.02);
  }

  function playKick(context, output, time, variant, durationScale, pitchRatio = 1) {
    const osc = context.createOscillator();
    registerArrangementPlaybackSource(osc);
    const envelope = context.createGain();
    const legacy = {
      classic: [148, 43, 0.36],
      deep: [92, 31, 0.56],
      punch: [182, 58, 0.23],
      sub: [72, 24, 0.7],
      industrial: [120, 27, 0.4],
    }[variant] || [148, 43, 0.36];
    const settings = DRUM_VARIANT_SETTINGS.kick?.[variant] || {
      start: legacy[0], end: legacy[1], duration: legacy[2], wave: "sine",
    };
    const duration = settings.duration * durationScale;
    const pitch = settings.start * pitchRatio;
    osc.type = settings.wave || "sine";
    osc.frequency.setValueAtTime(pitch, time);
    scheduleExponentialRamp(osc.frequency, settings.end * pitchRatio, time + duration * (settings.sweep || 0.38));
    envelope.gain.setValueAtTime(0.0001, time);
    scheduleExponentialRamp(envelope.gain, 1, time + 0.004);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + duration);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    stopAudioSource(osc, time + duration + 0.02);
    if (settings.clickPeak) {
      playNoise(context, output, time, 0.018 * durationScale, settings.clickCutoff, settings.clickPeak);
    }
  }

  function playNoise(context, output, time, duration, cutoff, peak = 0.35, resonance = 0.7) {
    const source = context.createBufferSource();
    registerArrangementPlaybackSource(source);
    source.buffer = state.noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.value = resonance;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    scheduleExponentialRamp(envelope.gain, peak, time + 0.003);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    source.start(time);
    stopAudioSource(source, time + duration + 0.015);
  }

  function playSnare(context, output, time, variant, durationScale, pitchRatio = 1) {
    const legacy = {
      classic: [0.17, 1500, 0.36, 185, 0.1],
      tight: [0.1, 2300, 0.32, 235, 0.075],
      noise: [0.23, 1000, 0.48, 145, 0.14],
      body: [0.2, 1250, 0.34, 125, 0.18],
      metal: [0.17, 4100, 0.4, 330, 0.085],
    }[variant] || [0.17, 1500, 0.36, 185, 0.1];
    const preset = DRUM_VARIANT_SETTINGS.snare?.[variant];
    const settings = preset || {
      noiseDuration: legacy[0], cutoff: legacy[1], noisePeak: legacy[2],
      bodyHz: legacy[3], bodyDuration: legacy[4], bodyPeak: 0.2, resonance: 0.7, bodyWave: "triangle",
    };
    playNoise(context, output, time, settings.noiseDuration * durationScale, settings.cutoff * pitchRatio, settings.noisePeak, settings.resonance);
    const body = context.createOscillator();
    registerArrangementPlaybackSource(body);
    const envelope = context.createGain();
    body.type = settings.bodyWave || "triangle";
    body.frequency.setValueAtTime(settings.bodyHz * pitchRatio, time);
    envelope.gain.setValueAtTime(settings.bodyPeak, time);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + settings.bodyDuration * durationScale);
    body.connect(envelope);
    envelope.connect(output);
    body.start(time);
    stopAudioSource(body, time + settings.bodyDuration * durationScale + 0.02);
  }

  function playClap(context, output, time, variant, durationScale, pitchRatio = 1) {
    const legacy = {
      classic: [[0, 0.018, 0.038], 0.17, 1100, 0.28],
      tight: [[0, 0.012], 0.1, 1500, 0.27],
      layered: [[0, 0.018, 0.038, 0.062], 0.22, 900, 0.34],
      room: [[0, 0.024, 0.052], 0.28, 720, 0.31],
    }[variant] || [[0, 0.018, 0.038], 0.17, 1100, 0.28];
    const preset = DRUM_VARIANT_SETTINGS.clap?.[variant];
    const settings = preset || { offsets: legacy[0], tail: legacy[1], cutoff: legacy[2], peak: legacy[3], resonance: 0.7 };
    settings.offsets.forEach((offset, index) => {
      const last = index === settings.offsets.length - 1;
      const peak = last ? settings.peak : (preset ? settings.peak * 0.7 : 0.2);
      playNoise(context, output, time + offset * durationScale, (last ? settings.tail : 0.045) * durationScale, settings.cutoff * pitchRatio, peak, settings.resonance);
    });
  }

  function playHat(context, output, time, open, variant, durationScale, pitchRatio = 1) {
    const legacy = open
      ? ({ classic: [0.34, 6500, 0.2], shimmer: [0.48, 9000, 0.22], dark: [0.3, 3800, 0.25], wash: [0.7, 5200, 0.3] }[variant] || [0.34, 6500, 0.2])
      : ({ classic: [0.055, 6500, 0.16], soft: [0.07, 4300, 0.12], bright: [0.045, 10000, 0.2], vinyl: [0.09, 3200, 0.18] }[variant] || [0.055, 6500, 0.16]);
    const preset = DRUM_VARIANT_SETTINGS[open ? "openhat" : "hat"]?.[variant];
    const settings = preset || { duration: legacy[0], cutoff: legacy[1], peak: legacy[2], resonance: 0.55 };
    playNoise(context, output, time, settings.duration * durationScale, settings.cutoff * pitchRatio, settings.peak, settings.resonance);
  }

  function playRim(context, output, time, variant, durationScale, pitchRatio = 1) {
    const osc = context.createOscillator();
    registerArrangementPlaybackSource(osc);
    const envelope = context.createGain();
    osc.type = "triangle";
    const pitch = { classic: [880, 420], low: [190, 110], high: [1450, 720], wood: [560, 250] }[variant] || [880, 420];
    osc.frequency.setValueAtTime(pitch[0] * pitchRatio, time);
    scheduleExponentialRamp(osc.frequency, pitch[1] * pitchRatio, time + 0.045 * durationScale);
    envelope.gain.setValueAtTime(0.32, time);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + 0.075 * durationScale);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    stopAudioSource(osc, time + 0.09 * durationScale);
  }

  function triggerClick(time, downbeat) {
    triggerMetronomeSound(
      time,
      downbeat,
      getMetronomeOutputNode(state.isPlaying && state.playbackMode === "arrangement"),
    );
  }

  function triggerMetronomeSound(time, downbeat, output, pitchRatio = 1) {
    const context = state.audioContext;
    const peakGain = Math.max(0.0001, 0.22 * userSettings.metronomeVolume / 100);

    if (userSettings.metronomeSound === "hi-hat") {
      playNoise(context, output, time, 0.055, (downbeat ? 9500 : 8000) * pitchRatio,
        peakGain * (downbeat ? 1 : 0.78), 0.55);
      return;
    }

    const oscillator = context.createOscillator();
    registerArrangementPlaybackSource(oscillator);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    scheduleExponentialRamp(envelope.gain,
      userSettings.metronomeSound === "kick" ? peakGain * (downbeat ? 1 : 0.78) : peakGain,
      time + 0.002,
    );

    if (userSettings.metronomeSound === "kick") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime((downbeat ? 150 : 115) * pitchRatio, time);
      scheduleExponentialRamp(oscillator.frequency, (downbeat ? 48 : 42) * pitchRatio, time + 0.1);
      scheduleExponentialRamp(envelope.gain, 0.0001, time + 0.14);
      oscillator.connect(envelope);
      envelope.connect(output);
      oscillator.start(time);
      stopAudioSource(oscillator, time + 0.16);
      return;
    }

    oscillator.frequency.setValueAtTime((downbeat ? 1350 : 950) * pitchRatio, time);
    scheduleExponentialRamp(envelope.gain, 0.0001, time + 0.028);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    stopAudioSource(oscillator, time + 0.035);
  }

  async function startPlayback(mode = "arrangement", { startAtMs = null, remote = false } = {}) {
    if (state.isPlaying || state.isStartingPlayback || state.isExporting) return;
    const requestId = ++state.playbackRequestId;
    state.isStartingPlayback = true;
    playButton.classList.add("is-playing");
    playButton.setAttribute("aria-label", mode === "sequencer" ? "Pause Pattern" : "Pause Track View");
    try {
      await ensureAudio();
      if (requestId !== state.playbackRequestId) return;
      await loadLibrarySamplesForPlayback(mode);
      if (requestId !== state.playbackRequestId) return;
      if (mode === "piano-roll") {
        const pianoSource = getPianoPlaybackSource();
        if (pianoSource.notes?.length && !pianoSource.instrument) {
          throw new Error("Choose an instrument before playing Piano Roll notes.");
        }
        if (pianoSource.instrument) {
          await loadLibrarySample(pianoSource.instrument);
          ensureSequencerTrackAudio(pianoSource.instrument);
        }
        await preparePianoAudioSliceBuffers(pianoSource.notes);
        if (requestId !== state.playbackRequestId) return;
      }
      const arrangementPlayback = mode === "arrangement";
      const { startBar: loopStartBar, endBar: loopEndBar } = getArrangementLoopRange();
      const startBar = arrangementPlayback
        ? state.arrangementLoopEnabled &&
          (state.arrangementCursor < loopStartBar || state.arrangementCursor >= loopEndBar)
          ? loopStartBar
          : Math.min(state.arrangementCursor, state.arrangementBars - 1)
        : 0;
      if (arrangementPlayback) {
        await prepareAudioClipPlaybackBuffers(startBar,
          state.arrangementLoopEnabled ? loopEndBar : state.arrangementBars);
        if (requestId !== state.playbackRequestId) return;
      }
      state.isStartingPlayback = false;
      if (startAtMs === null && !remote && collaboration.session &&
        collaboration.socket?.readyState === WebSocket.OPEN) {
        startAtMs = Date.now() + 1500;
        sendCollaborationMessage({ type: "transport", action: "play", mode, startAtMs });
      }
      state.isPlaying = true;
      state.playbackMode = mode;
      state.playbackStartBar = startBar;
      const scheduledStartTime = state.audioContext.currentTime + Math.max(
        0.04,
        startAtMs === null ? 0 : (startAtMs - Date.now()) / 1000,
      );
      state.playbackStartTime = scheduledStartTime;
      if (mode === "piano-roll") {
        const loopTicks = Math.max(1, getPianoPlaybackSource().loopBars * PIANO_TICKS_PER_BAR);
        const { startBar, endBar } = getPianoLoopRange();
        const loopStartTick = state.pianoLoopEnabled ? startBar * PIANO_TICKS_PER_BAR : 0;
        const loopEndTick = state.pianoLoopEnabled ? endBar * PIANO_TICKS_PER_BAR : loopTicks;
        const cursorTick = state.pianoLoopEnabled &&
          (state.pianoCursorTick < loopStartTick || state.pianoCursorTick >= loopEndTick)
          ? loopStartTick
          : state.pianoCursorTick % loopTicks;
        state.pianoCursorTick = cursorTick;
        state.pianoPlaybackStartTick = cursorTick;
        state.playbackStartTime -= cursorTick / PIANO_TICKS_PER_BAR * (240 / state.bpm);
      }
      state.playbackEndTime = arrangementPlayback
        ? state.playbackStartTime + ((state.arrangementLoopEnabled ? loopEndBar : state.arrangementBars) - startBar) *
          (240 / state.bpm)
        : Infinity;
      state.stepIndex = 0;
      state.scheduledPianoNotes.clear();
      state.scheduledArrangementSteps.clear();
      state.scheduledArrangementClicks.clear();
      state.arrangementLoopIteration = 0;
      state.preScheduledArrangementIteration = null;
      state.nextStepTime = scheduledStartTime;
      updateTrackGains();
      if (arrangementPlayback) scheduleArrangementClips(state.playbackStartTime, startBar);
      scheduler();
      state.schedulerId = window.setInterval(() => {
        try {
          scheduler();
        } catch (error) {
          stopPlayback();
          showToast(error.message || "Audio playback stopped unexpectedly.");
        }
      }, 25);
      syncMixerMeters();
      playButton.classList.add("is-playing");
      playButton.setAttribute("aria-label", mode === "sequencer" ? "Pause Pattern" : "Pause Track View");
      $("#now-playing").classList.add("is-live");
      $("#now-playing").innerHTML = `<span class="live-dot"></span>${arrangementPlayback ? "TRACK VIEW PLAYING" : "KEY RECORDING"}`;
    } catch (error) {
      if (requestId !== state.playbackRequestId) return;
      state.isStartingPlayback = false;
      stopPlayback();
      showToast(error.message || "Audio could not start in this browser.");
    }
  }

  function scheduleArrangementClips(startTime, startBar) {
    const secondsPerBar = 240 / state.bpm;
    const arrangementEndBar = state.arrangementLoopEnabled
      ? getArrangementLoopRange().endBar
      : state.arrangementBars;
    scheduleArrangementAutomation(startTime, startBar, arrangementEndBar);
    state.arrangementTracks.forEach((track) => {
      ensureArrangementTrackAudio(track);
      track.clips.forEach((clip) => {
        const editedMel = getAudioClipEditedMel(clip);
        if (editedMel?.notes.length) {
          const instrument = getPianoTrack(editedMel.instrumentId) || getPianoTrack();
          if (!instrument) throw new Error(`The edited Mel for ${clip.name} has no available instrument.`);
          const clipDurationBars = getArrangementClipDuration("audio", clip);
          const tempoRatio = getArrangementClipTempoRatio(clip);
          const audioTempoRatio = getAudioClipTempoRatio(clip);
          const melSourceSecondsPerBar = (240 / state.bpm) * audioTempoRatio * tempoRatio;
          const hasAudioRepeatRegion = Number.isFinite(clip.repeatStartSeconds) &&
            Number.isFinite(clip.repeatLengthSeconds) && clip.repeatLengthSeconds > 0;
          const melClip = {
            melId: editedMel.id,
            startBar: clip.startBar,
            sourceOffsetBars: hasAudioRepeatRegion
              ? (clip.sourceOffsetSeconds || 0) / melSourceSecondsPerBar : 0,
            repeatCount: clip.repeatCount || 1,
            durationBars: clipDurationBars / tempoRatio,
            ...(hasAudioRepeatRegion ? {
              repeatStartBars: clip.repeatStartSeconds / melSourceSecondsPerBar,
              repeatLengthBars: clip.repeatLengthSeconds / melSourceSecondsPerBar,
            } : {}),
            tempoLockBpm: clip.tempoLockBpm,
          };
          const clipEndBar = Math.min(arrangementEndBar, clip.startBar + clipDurationBars);
          const clipGain = Math.max(0, Math.min(2, Number.isFinite(clip.clipGain) ? clip.clipGain : 1));
          getMelClipNoteEvents(editedMel, melClip).forEach(({ note, loop, startBar: noteStartBar, endBar: noteEndBar }) => {
            const key = `audio-mel:${track.id}:${clip.id}:${loop}:${note.id}`;
            if (state.scheduledPianoNotes.has(key) || noteEndBar <= startBar) return;
            const audibleStartBar = Math.max(startBar, noteStartBar);
            const monoTicks = getPianoNotePlaybackDurationTicks(
              editedMel.notes, note, editedMel.bars * PIANO_TICKS_PER_BAR,
            );
            const noteBarLength = note.durationTicks / PIANO_TICKS_PER_BAR;
            const monoEndBar = noteStartBar + (noteBarLength > 0
              ? (noteEndBar - noteStartBar) * monoTicks / note.durationTicks
              : 0);
            const audibleEndBar = Math.min(noteEndBar, clipEndBar, monoEndBar);
            if (audibleEndBar <= audibleStartBar) return;
            const elapsedSeconds = (audibleStartBar - noteStartBar) * secondsPerBar;
            const duration = (audibleEndBar - audibleStartBar) * secondsPerBar;
            let noteOptions = note;
            if (note.audioSlice) {
              const audioSlice = { ...note.audioSlice };
              const sourceClip = getPianoRollAudioClipById(audioSlice.clipId) || clip;
              const sourceRootMidi = Number.isInteger(audioSlice.rootMidi) ? audioSlice.rootMidi : 60;
              const keyShiftSemitones = Number.isFinite(sourceClip.audioAdjustment?.keyShiftSemitones)
                ? sourceClip.audioAdjustment.keyShiftSemitones : 0;
              const sourceRate = getAudioClipTempoRatio(sourceClip) * Math.pow(2,
                (note.midi - sourceRootMidi +
                  (audioSlice.pitchEdited ? 0 : keyShiftSemitones) +
                  (note.detune || 0) / 100) / 12);
              const sourceAdvance = elapsedSeconds * sourceRate;
              audioSlice.offsetSeconds += sourceAdvance;
              audioSlice.durationSeconds = Math.max(0, audioSlice.durationSeconds - sourceAdvance);
              noteOptions = {
                ...note,
                audioSlice,
                clipEnvelope: {
                  gain: clipGain,
                  offsetSeconds: (audibleStartBar - clip.startBar) * secondsPerBar,
                  durationSeconds: clipDurationBars * secondsPerBar,
                  fadeInSeconds: clip.fadeInSeconds || 0,
                  fadeOutSeconds: clip.fadeOutSeconds || 0,
                },
              };
            }
            scheduleArrangementVoice(() => playPianoNote(
              instrument,
              startTime + (audibleStartBar - startBar) * secondsPerBar,
              note.midi,
              duration,
              (note.velocity ?? 0.8) * (note.audioSlice ? 1 : clipGain),
              track,
              null,
              noteOptions,
            ));
            state.scheduledPianoNotes.add(key);
          });
          return;
        }
        getAudioClipSegments(clip, startBar, Math.min(
          arrangementEndBar,
          clip.startBar + getArrangementClipDuration("audio", clip),
        ))
          .forEach((segment) => {
            const when = startTime + (segment.startBar - startBar) * secondsPerBar;
            const { source, envelope, pitchNode } = createAudioClipPlaybackSource(
              state.audioContext, track, clip, segment, when, secondsPerBar,
            );
            source.onended = () => {
              state.arrangementSources.delete(source);
              pitchNode?.disconnect();
              envelope.disconnect();
            };
            state.arrangementSources.add(source);
          });
      });
    });
    const hasMelSolo = state.melTracks.some((track) => track.solo);
    const hasInstrumentSolo = state.tracks.some((track) => track.solo);
    state.melTracks.forEach((melTrack) => {
      const instrument = getPianoTrack(melTrack.instrumentId);
      if (!instrument || melTrack.muted || (hasMelSolo && !melTrack.solo) ||
        instrument.muted || (hasInstrumentSolo && !instrument.solo)) return;
      melTrack.clips.forEach((clip) => {
        const mel = getMel(clip.melId);
        if (!mel) return;
        getMelClipNoteEvents(mel, clip).forEach(({ note, loop, startBar: noteStartBar, endBar: noteEndBar }) => {
          const key = `${melTrack.id}:${clip.id}:${loop}:${note.id}`;
          if (state.scheduledPianoNotes.has(key)) return;
          if (noteEndBar <= startBar) return;
          const audibleStartBar = Math.max(startBar, noteStartBar);
          const when = startTime + (audibleStartBar - startBar) * secondsPerBar;
          const monoTicks = getPianoNotePlaybackDurationTicks(mel.notes, note, mel.bars * PIANO_TICKS_PER_BAR);
          const noteBarLength = note.durationTicks / PIANO_TICKS_PER_BAR;
          const monoEndBar = noteStartBar + (noteBarLength > 0
            ? (noteEndBar - noteStartBar) * monoTicks / note.durationTicks
            : 0);
          const duration = Math.max(0, Math.min(noteEndBar, arrangementEndBar, monoEndBar) -
            audibleStartBar) * secondsPerBar;
          if (duration > 0) {
            scheduleArrangementVoice(() =>
              playPianoNote(instrument, when, note.midi, duration, note.velocity ?? 0.8, melTrack, null, note));
            state.scheduledPianoNotes.add(key);
          }
        });
      });
    });
  }

  function getArrangementAutomationValue(track, property, bar) {
    const points = normalizeTrackAutomation(track.automation)[property];
    let previousBar = 0;
    let previousValue = track[property] ?? 0;
    for (const point of points) {
      if (point.bar >= bar) {
        const range = point.bar - previousBar;
        if (range <= 0) return point.value;
        const amount = Math.max(0, Math.min(1, (bar - previousBar) / range));
        return previousValue + (point.value - previousValue) * amount;
      }
      previousBar = point.bar;
      previousValue = point.value;
    }
    return previousValue;
  }

  function scheduleArrangementAutomation(startTime, startBar, endBar) {
    const tracks = [...state.patterns, ...state.tracks, ...state.melTracks, ...state.arrangementTracks];
    const secondsPerBar = 240 / state.bpm;
    tracks.forEach((track) => {
      const automation = normalizeTrackAutomation(track.automation);
      if (!automation.volume.length && !automation.pan.length) return;
      ensureTrackAudio(track);
      if (automation.volume.length && track.automationGainNode) {
        const gain = track.automationGainNode.gain;
        const toAutomationGain = (value) => track.volume > 0 ? value / track.volume : 1;
        gain.cancelScheduledValues(startTime);
        gain.setValueAtTime(toAutomationGain(getArrangementAutomationValue(track, "volume", startBar)), startTime);
        automation.volume
          .filter((point) => point.bar > startBar && point.bar <= endBar)
          .forEach((point) => gain.linearRampToValueAtTime(
            toAutomationGain(point.value),
            startTime + (point.bar - startBar) * secondsPerBar,
          ));
      }
      if (automation.pan.length && track.panNode) {
        const pan = track.panNode.pan;
        pan.cancelScheduledValues(startTime);
        pan.setValueAtTime(getArrangementAutomationValue(track, "pan", startBar), startTime);
        automation.pan
          .filter((point) => point.bar > startBar && point.bar <= endBar)
          .forEach((point) => pan.linearRampToValueAtTime(
            point.value,
            startTime + (point.bar - startBar) * secondsPerBar,
          ));
      }
    });
  }

  function stopPlayback(remote = false, pausedByUser = false) {
    if ((state.isPlaying || state.isStartingPlayback) && !remote &&
      !collaboration.applyingRemote && collaboration.session) {
      sendCollaborationMessage({ type: "transport", action: "stop" });
    }
    state.playbackRequestId += 1;
    state.isStartingPlayback = false;
    const stoppedPlaybackMode = state.playbackMode;
    const wasPlaying = state.isPlaying;
    if (stoppedPlaybackMode === "piano-roll" && state.isPlaying) updatePianoCursorFromTime(state.playbackStartTime);
    if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
    if (state.schedulerId !== null) window.clearInterval(state.schedulerId);
    state.schedulerId = null;
    const stoppedRecording = state.keyboardRecording;
    state.keyboardRecording = null;
    if (stoppedRecording?.mode === "piano-roll") stopRecordingMetronome();
    state.liveRecordedHits.clear();
    state.scheduledArrangementSteps.clear();
    state.scheduledArrangementClicks.clear();
    state.arrangementLoopIteration = 0;
    state.preScheduledArrangementIteration = null;
    updateKeyboardRecordButtons();
    if (stoppedRecording?.mode === "sequencer") renderTracks();
    state.isPlaying = false;
    state.playbackMode = "arrangement";
    syncMixerMeters();
    state.stepIndex = 0;
    state.stepTimers.forEach((timerId) => window.clearTimeout(timerId));
    state.stepTimers.clear();
    state.arrangementSources.forEach((source) => {
      try { stopAudioSource(source, state.audioContext?.currentTime || 0); } catch { /* The source may have ended between scheduler ticks. */ }
    });
    state.arrangementSources.clear();
    if (stoppedPlaybackMode === "arrangement") {
      if (pausedByUser) {
        if (wasPlaying && userSettings.pauseBehavior === "playback-start") {
          state.arrangementCursor = state.playbackStartBar;
        } else if (wasPlaying && userSettings.pauseBehavior === "track-origin") {
          state.arrangementCursor = 0;
        }
      } else if (state.view === "arrangement") {
        state.arrangementCursor = 0;
      }
    }
    if (pausedByUser && wasPlaying && stoppedPlaybackMode === "piano-roll") {
      if (userSettings.pauseBehavior === "playback-start") {
        setPianoCursorTick(state.pianoPlaybackStartTick, false, false);
      } else if (userSettings.pauseBehavior === "track-origin") {
        setPianoCursorTick(0, false, false, true);
      }
    }
    if (state.audioContext) {
      const now = state.audioContext.currentTime;
      [...state.patterns, ...state.tracks, ...state.melTracks, ...state.arrangementTracks].forEach((track) => {
        track.gainNode?.gain.cancelScheduledValues(now);
        track.automationGainNode?.gain.cancelScheduledValues(now);
        track.automationGainNode?.gain.setValueAtTime(1, now);
        track.panNode?.pan.cancelScheduledValues(now);
      });
      updateTrackGains();
      state.tracks.forEach((track) => {
        if (track.gainNode) {
          track.gainNode.gain.cancelScheduledValues(now);
          track.gainNode.gain.setTargetAtTime(track.muted || (state.tracks.some((item) => item.solo) && !track.solo) ? 0 : track.volume, now, 0.01);
        }
      });
    }
    playButton.classList.remove("is-playing");
    playButton.setAttribute("aria-label", "Play");
    $("#now-playing").classList.remove("is-live");
    $("#now-playing").innerHTML = '<span class="live-dot"></span>READY TO PLAY';
    setPlayhead(-1);
    updateArrangementCursorMarker();
  }

  async function loadSample(file) {
    const track = state.tracks.find((item) => item.id === state.sampleTrackId);
    if (!track || !file) return;
    if (!isAudioFile(file)) {
      showToast("Choose an audio file such as WAV, MP3, or OGG.");
      return;
    }
    let sampleLoaded = false;
    try {
      await ensureAudio();
      const bytes = await file.arrayBuffer();
      const buffer = await state.audioContext.decodeAudioData(bytes);
      const previousBuffer = track.sample?.buffer;
      track.sample = { name: file.name, buffer };
      track.audioMetadata = detectAudioMetadata(buffer);
      if (!track.sourceId) {
        state.tracks.filter((item) => item.sourceId === track.id && item.sample?.buffer === previousBuffer).forEach((layer) => {
          layer.sample = { ...track.sample };
          ensureSequencerTrackAudio(layer);
        });
      }
      sampleLoaded = true;
      renderTracks();
      saveState();
      await persistDrumSample(track, file);
      showToast(`${file.name} loaded on ${track.name}`);
    } catch (error) {
      if (sampleLoaded) showToast(`${file.name} loaded, but could not be saved: ${error.message || "browser storage is unavailable"}`);
      else showToast(`Could not load that audio file: ${error.message || "unsupported format"}`);
    } finally {
      sampleInput.value = "";
      state.sampleTrackId = null;
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function getProjectStorageKey(projectId) {
    return `${PROJECT_STORAGE_PREFIX}${projectId}`;
  }

  function projectNeedsCloudDownload(project) {
    if (!project?.cloudBacked || !project.cloudHasFile) return false;
    if (project.localCloudRevision !== project.cloudRevision) return true;
    if (project.localSnapshotStorage === "indexedDB") return false;
    try {
      return window.localStorage.getItem(getProjectStorageKey(project.id)) === null;
    } catch {
      return true;
    }
  }

  function saveCloudProjectSnapshot(projectId, snapshot) {
    const snapshotKey = getProjectStorageKey(projectId);
    const serialized = JSON.stringify(snapshot);
    try {
      window.localStorage.setItem(snapshotKey, serialized);
      return;
    } catch (error) {
      if (error?.name !== "QuotaExceededError") throw error;
    }

    // Synced cloud snapshots can be downloaded again; unsynced local edits cannot.
    for (const cachedProject of state.projects.filter((project) =>
      project.id !== projectId &&
      project.ownerId === state.currentUser &&
      project.cloudBacked &&
      project.cloudHasFile &&
      project.localDirty !== true)) {
      const cachedSnapshotKey = getProjectStorageKey(cachedProject.id);
      window.localStorage.removeItem(cachedSnapshotKey);
      window.localStorage.removeItem(`${cachedSnapshotKey}:dj`);
      if (cachedProject.localSnapshotStorage === "indexedDB") {
        void deleteCachedProjectSnapshot(cachedProject.id).catch((error) => {
          showToast(`Could not remove the outdated IndexedDB cache: ${error.message || "browser storage is unavailable"}`);
        });
      }
      cachedProject.localCloudRevision = null;
      cachedProject.localSnapshotStorage = null;
      try {
        window.localStorage.setItem(snapshotKey, serialized);
        return;
      } catch (error) {
        if (error?.name !== "QuotaExceededError") throw error;
      }
    }

    throw new DOMException("localStorage quota exceeded.", "QuotaExceededError");
  }

  function getCurrentUserProjects() {
    return state.projects.filter((project) => project.ownerId === state.currentUser);
  }

  function getNextProjectNumber(ownerId = state.currentUser) {
    if (!ownerId) return 1;
    const existingCount = state.projects.filter((project) => project.ownerId === ownerId).length;
    const createdCount = Number.isSafeInteger(state.projectCreationCounts[ownerId])
      ? state.projectCreationCounts[ownerId]
      : 0;
    const nextNumber = Math.max(existingCount, createdCount) + 1;
    state.projectCreationCounts[ownerId] = nextNumber;
    return nextNumber;
  }

  function getCurrentUserName() {
    return state.users.find((user) => user.id === state.currentUser)?.name || "";
  }

  function saveUsers() {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(state.users));
  }

  function initializeUsers() {
    let users = DEFAULT_USERS.map((user) => ({ ...user }));
    try {
      const savedUsers = JSON.parse(window.localStorage.getItem(USERS_KEY) || "null");
      if (Array.isArray(savedUsers)) {
        users = savedUsers.filter((user) =>
          typeof user?.id === "string" && user.id && typeof user.name === "string" && user.name.trim())
          .map((user) => ({
            id: user.id,
            name: user.name.trim().slice(0, 32),
            ...(user.cloudAccount === true ? { cloudAccount: true } : {}),
          }))
          .filter((user) => user.cloudAccount);
      }
      DEFAULT_USERS.forEach((defaultUser) => {
        if (!users.some((user) => user.id === defaultUser.id)) users.push(defaultUser);
      });
      state.users = users;
      saveUsers();
    } catch (error) {
      if (!state.users.length) state.users = users;
      showToast(`Could not load or save profiles: ${error.message || "browser storage is unavailable"}`);
    }
  }

  function getSessionUser() {
    try {
      const userId = window.sessionStorage.getItem(ACTIVE_USER_KEY);
      const user = state.users.find((item) => item.id === userId);
      if (user?.cloudAccount && !getCloudToken()) return null;
      return user ? userId : null;
    } catch {
      return null;
    }
  }

  function selectUser(userId) {
    if (!state.users.some((user) => user.id === userId && !user.cloudAccount)) return;
    try {
      window.sessionStorage.setItem(ACTIVE_USER_KEY, userId);
      window.sessionStorage.setItem(OPEN_PROJECTS_KEY, "true");
      window.location.reload();
    } catch (error) {
      try { window.sessionStorage.removeItem(ACTIVE_USER_KEY); } catch { /* Session storage may be unavailable. */ }
      $("#login-error").textContent = `Could not start this profile: ${error.message || "session storage is unavailable"}`;
    }
  }

  async function createUser() {
    const input = $("#new-profile-name");
    const name = input.value.trim().slice(0, 32);
    const passwordInput = $("#new-profile-password");
    const password = passwordInput.value;
    const error = $("#login-error");
    error.textContent = "";
    if (!name) {
      error.textContent = "Enter a name for your profile.";
      input.focus();
      return;
    }
    if (password.length < 8) {
      error.textContent = "Choose a password with at least 8 characters.";
      passwordInput.focus();
      return;
    }
    try {
      await registerCloudAccount(name, password);
    } catch (createError) {
      error.textContent = createError.message || "Could not create this account.";
    }
  }

  async function loginUser() {
    const name = $("#login-profile-name").value.trim();
    const passwordInput = $("#login-profile-password");
    const error = $("#login-error");
    error.textContent = "";
    if (!name || !passwordInput.value) {
      error.textContent = "Enter your profile name and password.";
      return;
    }
    try {
      await loginCloudAccount(name, passwordInput.value);
    } catch (loginError) {
      error.textContent = loginError.message || "Could not sign in.";
    }
  }

  function writeProjectCatalog() {
    const activeProjectIds = { ...state.activeProjectIds };
    if (state.currentUser && state.projectId) activeProjectIds[state.currentUser] = state.projectId;
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify({
      activeProjectId: state.projectId,
      activeProjectIds,
      projects: state.projects,
      projectCreationCounts: state.projectCreationCounts,
    }));
    state.activeProjectIds = activeProjectIds;
  }

  function updateProjectNameLabel() {
    const name = $("#project-name-text");
    if (name) name.textContent = state.projectName;
    else $("#project-name").firstChild.textContent = `${state.projectName} `;
  }

  function initializeProjects() {
    try {
      const savedCatalog = JSON.parse(window.localStorage.getItem(PROJECTS_KEY) || "null");
      let projects = Array.isArray(savedCatalog?.projects)
        ? savedCatalog.projects.filter((project) => typeof project?.id === "string" && typeof project.name === "string")
        : [];
      projects = projects.map((project) => ({
        ...project,
        ownerId: state.users.some((user) => user.id === project.ownerId) ? project.ownerId : "guest",
      }));
      const savedCreationCounts = savedCatalog?.projectCreationCounts;
      state.projectCreationCounts = Object.fromEntries(state.users.map((user) => [
        user.id,
        Math.max(
          Number.isSafeInteger(savedCreationCounts?.[user.id]) ? savedCreationCounts[user.id] : 0,
          projects.filter((project) => project.ownerId === user.id).length,
        ),
      ]));
      state.activeProjectIds = savedCatalog?.activeProjectIds && typeof savedCatalog.activeProjectIds === "object"
        ? { ...savedCatalog.activeProjectIds }
        : {};
      if (!state.activeProjectIds.guest && typeof state.activeProjectIds.taylor === "string") {
        state.activeProjectIds.guest = state.activeProjectIds.taylor;
      }

      if (!projects.length) {
        const savedName = window.localStorage.getItem(`${STORAGE_KEY}-name`)?.trim();
        const name = !savedName || savedName === "Untitled session" ? "New Proj 1" : savedName;
        const oldSnapshot = window.localStorage.getItem(STORAGE_KEY);
        if (oldSnapshot || name !== "New Proj 1") {
          projects = [{ id: "default", name, ownerId: "guest", updatedAt: Date.now() }];
          state.projectCreationCounts.guest = Math.max(1, state.projectCreationCounts.guest || 0);
          if (oldSnapshot) window.localStorage.setItem(getProjectStorageKey("default"), oldSnapshot);
        }
      }

      state.projects = projects;
      if (state.currentUser) {
        let userProjects = getCurrentUserProjects();
        if (!userProjects.length) {
          const project = {
            id: makeId(),
            name: `New Proj ${getNextProjectNumber(state.currentUser)}`,
            ownerId: state.currentUser,
            updatedAt: Date.now(),
          };
          state.projects.unshift(project);
          userProjects = [project];
        }
        const preferredProjectId = state.activeProjectIds[state.currentUser] ||
          (savedCatalog?.activeProjectId && userProjects.some((project) => project.id === savedCatalog.activeProjectId)
            ? savedCatalog.activeProjectId
            : null);
        state.projectId = userProjects.some((project) => project.id === preferredProjectId)
          ? preferredProjectId
          : userProjects[0].id;
        state.activeProjectIds[state.currentUser] = state.projectId;
        writeProjectCatalog();
      } else {
        state.projectId = "";
      }
      const activeProject = state.projects.find((project) => project.id === state.projectId);
      state.projectName = activeProject?.name || "New Proj 1";
      updateProjectNameLabel();
    } catch (error) {
      state.projects = [{
        id: "default",
        name: "New Proj 1",
        ownerId: state.currentUser || "guest",
        updatedAt: 0,
      }];
      state.projectId = state.currentUser ? "default" : "";
      state.projectName = "New Proj 1";
      updateProjectNameLabel();
      showToast(`Project storage is unavailable: ${error.message || "could not load projects"}`);
    }
  }

  function createStateSnapshot() {
    syncStepPianoEdit();
    captureCurrentPattern();
    captureCurrentMel();
    const stepEditContext = state.stepPianoEditContext;
    const savedMel = stepEditContext ? getMel() : null;
    return {
      bpm: state.bpm,
      masterPitch: state.masterPitch,
      swing: state.swing,
      steps: state.steps,
      selectedPreset: state.selectedPreset,
      selectedPatternId: state.selectedPatternId,
      patterns: state.patterns.map((pattern) => {
        const trackIds = [...getPatternTrackIds(pattern)];
        return {
          id: pattern.id,
          name: pattern.name,
          arrangementName: pattern.arrangementName || null,
          arrangementCopy: pattern.arrangementCopy === true,
          ...(pattern.segmentSourcePatternId ? {
            segmentSourcePatternId: pattern.segmentSourcePatternId,
            segmentStartBar: pattern.segmentStartBar,
            segmentEndBar: pattern.segmentEndBar,
            segmentEdited: pattern.segmentEdited === true,
            segmentNameEdited: pattern.segmentNameEdited === true,
            segmentSnapshot: pattern.segmentSnapshot || "",
          } : {}),
          insertAfterTrackId: pattern.insertAfterTrackId || null,
          steps: pattern.steps,
          trackIds,
          cells: Object.fromEntries(trackIds.flatMap((trackId) => {
            const cells = pattern.cells[trackId];
            return Array.isArray(cells) ? [[trackId, [...cells]]] : [];
          })),
          variants: Object.fromEntries(trackIds
            .filter((trackId) => pattern.variants?.[trackId])
            .map((trackId) => [trackId, pattern.variants[trackId]])),
          ...(pattern.stepPianoNotes ? {
            stepPianoNotes: Object.fromEntries(Object.entries(pattern.stepPianoNotes).map(([trackId, notes]) =>
              [trackId, notes.map((note) => ({ ...note }))])),
          } : {}),
          gridResolution: getPatternGridResolution(pattern),
          color: pattern.color,
          volume: pattern.volume,
          pan: pattern.pan,
          automation: normalizeTrackAutomation(pattern.automation),
          automationOpen: pattern.automationOpen === true,
          muted: pattern.muted,
          solo: pattern.solo,
          effects: makeDefaultEffects(pattern.effects),
          effectSettings: makeDefaultEffectSettings(pattern.effectSettings),
          effectChain: ensureTrackMixerState(pattern),
        };
      }),
      tracks: state.tracks.map((track) => ({
        id: track.id,
        sourceId: track.sourceId || null,
        libraryOnly: track.libraryOnly === true,
        ...(track.vstPluginId ? {
          vstPluginId: track.vstPluginId,
          patch: track.patch ? { ...track.patch } : {},
          vstPatch: track.vstPatch ? { ...track.vstPatch } : undefined,
          vstBypassed: track.vstBypassed === true,
          ...(Array.isArray(track.vstUserPresets)
            ? { vstUserPresets: track.vstUserPresets.map((preset) => ({ ...preset, patch: { ...preset.patch } })) }
            : {}),
        } : {}),
        name: track.name,
        kind: track.kind,
        color: track.color,
        cells: track.libraryOnly ? undefined : track.cells,
        volume: track.volume,
        pan: track.pan,
        automation: normalizeTrackAutomation(track.automation),
        automationOpen: track.automationOpen === true,
        muted: track.muted,
        solo: track.solo,
        variant: track.variant,
        pitch: track.pitch || 0,
        swing: Number.isFinite(track.swing) ? track.swing : null,
        audioMetadata: normalizeAudioMetadata(track.audioMetadata),
        sampleRootMidi: Number.isFinite(track.sampleRootMidi) ? track.sampleRootMidi : 60,
        sampleOneShot: track.sampleOneShot === true,
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
        sampleName: track.sample?.name || null,
      })),
      arrangementTracks: state.arrangementTracks.map((track) => ({
        id: track.id,
        name: track.name,
        insertAfterTrackId: track.insertAfterTrackId || null,
        color: track.color,
        volume: track.volume,
        pan: track.pan,
        automation: normalizeTrackAutomation(track.automation),
        automationOpen: track.automationOpen === true,
        muted: track.muted,
        solo: track.solo,
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
      })),
      audioAssets: state.audioAssets.map(({ buffer, blob, ...asset }) => ({ ...asset })),
      mels: state.mels.map((mel) => ({
        id: mel.id,
        name: mel.name,
        instrumentId: mel.instrumentId,
        bars: mel.bars,
        notes: mel.notes.map((note) => ({ ...note })),
        audioSourceClipId: mel.audioSourceClipId || null,
        audioSourceAssetId: mel.audioSourceAssetId || null,
        ...(mel.segmentSourceMelId ? {
          segmentSourceMelId: mel.segmentSourceMelId,
          segmentStartTick: mel.segmentStartTick,
          segmentEndTick: mel.segmentEndTick,
          segmentEdited: mel.segmentEdited === true,
          segmentNameEdited: mel.segmentNameEdited === true,
          segmentSnapshot: mel.segmentSnapshot || "",
        } : {}),
      })),
      selectedMelId: state.selectedMelId,
      melTracks: state.melTracks.map((track) => ({
        id: track.id,
        name: track.name,
        insertAfterTrackId: track.insertAfterTrackId || null,
        instrumentId: track.instrumentId,
        color: track.color,
        volume: track.volume,
        pan: track.pan,
        automation: normalizeTrackAutomation(track.automation),
        automationOpen: track.automationOpen === true,
        muted: track.muted,
        solo: track.solo,
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
        clips: track.clips.map((clip) => ({ ...clip })),
      })),
      masterTrack: {
        volume: state.masterTrack.volume,
        pan: state.masterTrack.pan,
        effects: makeDefaultEffects(state.masterTrack.effects),
        effectSettings: makeDefaultEffectSettings(state.masterTrack.effectSettings),
        effectChain: ensureTrackMixerState(state.masterTrack),
      },
      effectTracks: state.effectTracks.map((track) => ({
        id: track.id,
        name: track.name,
        volume: track.volume,
        pan: track.pan,
        routedTrackIds: [...track.routedTrackIds],
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
      })),
      patternClips: state.patternClips.map((clip) => ({ ...clip, repeatCount: clip.repeatCount || 1 })),
      pianoNotes: (savedMel?.notes || state.pianoNotes).map((note) => ({ ...note })),
      pianoStartBar: state.pianoStartBar,
      pianoCursorTick: stepEditContext?.previousCursorTick ?? state.pianoCursorTick,
      pianoLoopEnabled: state.pianoLoopEnabled,
      pianoLoopStartBar: state.pianoLoopStartBar,
      pianoLoopEndBar: state.pianoLoopEndBar,
      pianoBars: savedMel?.bars || state.pianoBars,
      pianoScale: state.pianoScale,
      pianoSnap: state.pianoSnap,
      pianoSnapEnabled: state.pianoSnapEnabled,
      pianoNoteLength: state.pianoNoteLength,
      pianoScaleRoot: state.pianoScaleRoot,
      pianoScaleType: state.pianoScaleType,
      pianoScaleLock: state.pianoScaleLock,
      pianoNoteMode: state.pianoNoteMode,
      transportMode: state.transportMode,
      personalAssetFolders: state.personalAssetFolders,
      personalAssets: state.personalAssets,
      soundDurationEdits: { ...state.soundDurationEdits },
      soundReverseEdits: { ...state.soundReverseEdits },
      soundProcessingEdits: Object.fromEntries(Object.entries(state.soundProcessingEdits).map(([soundId, edits]) =>
        [soundId, normalizeSoundProcessingEdits(edits)])),
      selectedPianoTrackId: savedMel?.instrumentId || state.selectedPianoTrackId,
      arrangementBars: state.arrangementBars,
      arrangementScale: state.arrangementScale,
      arrangementCursor: state.arrangementCursor,
      arrangementLoopEnabled: state.arrangementLoopEnabled,
      arrangementLoopStartBar: state.arrangementLoopStartBar,
      arrangementLoopEndBar: state.arrangementLoopEndBar,
      arrangementSnap: state.arrangementSnap,
      workspaceRatio: state.workspaceRatio,
      bottomMixerRatio: state.bottomMixerRatio,
      trackAssetLibraryWidth: state.trackAssetLibraryWidth,
      sequencerScale: state.sequencerScale,
      workspaceHidden: state.workspaceHidden,
      trackViewHidden: state.trackViewHidden,
      view: stepEditContext?.previousView || state.view,
    };
  }

