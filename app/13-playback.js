  function registerArrangementPlaybackSource(source) {
    if (!state.isSchedulingArrangementVoice) return;
    state.arrangementSources.add(source);
    source.addEventListener("ended", () => state.arrangementSources.delete(source), { once: true });
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

  function triggerTrack(track, time, step, variant = track.variant, noteDuration = getStepDuration(), outputTrack = track, outputNode = null, pitchOffset = 0) {
    const context = state.audioContext;
    const pitchRatio = Math.pow(2, ((track.pitch || 0) + pitchOffset) / 12);
    const soundDurationScale = getSoundDurationScale(track);
    ensureTrackAudio(outputTrack);
    const output = outputNode || outputTrack.gainNode;
    if (track.sample) {
      const source = context.createBufferSource();
      registerArrangementPlaybackSource(source);
      source.buffer = getLibrarySamplePlaybackBuffer(track);
      const envelope = context.createGain();
      const sampleDuration = source.buffer.duration * soundDurationScale;
      source.playbackRate.setValueAtTime(pitchRatio, time);
      envelope.gain.setValueAtTime(1, time);
      const duration = Math.max(0.005, track.sampleOneShot
        ? sampleDuration / pitchRatio
        : Math.min(sampleDuration / pitchRatio, noteDuration));
      const fade = Math.min(0.01, duration * 0.1);
      envelope.gain.setValueAtTime(1, time + Math.max(0, duration - fade));
      envelope.gain.linearRampToValueAtTime(0.0001, time + duration);
      source.connect(envelope);
      envelope.connect(output);
      source.start(time, 0, Math.min(sampleDuration, duration * pitchRatio));
      return;
    }
    noteDuration *= soundDurationScale;
    const durationScale = noteDuration / getStepDuration();
    switch (track.kind) {
      case "kick": playKick(context, output, time, step, variant, durationScale, pitchRatio); break;
      case "snare": playSnare(context, output, time, variant, durationScale, pitchRatio); break;
      case "clap": playClap(context, output, time, variant, durationScale, pitchRatio); break;
      case "hat": playHat(context, output, time, false, variant, durationScale, pitchRatio); break;
      case "openhat": playHat(context, output, time, true, variant, durationScale, pitchRatio); break;
      case "rim": playRim(context, output, time, variant, durationScale, pitchRatio); break;
      case "drumkit": playDrumKitNote(track, time, 36, noteDuration, 0.8, outputTrack, output); break;
      case "instrument": playInstrumentVoice(track, time, 60 + (track.pitch || 0), noteDuration, 0.8, outputTrack, output, { soundDurationScale }); break;
      default: break;
    }
  }

  function playPianoNote(track, time, midi, duration, velocity = 0.8, outputTrack = track, outputNode = null, noteOptions = {}) {
    if (!track) return;
    velocity *= Math.max(0, Math.min(1, noteOptions.volume ?? 1));
    const soundDurationScale = getSoundDurationScale(track);
    ensureSequencerTrackAudio(track);
    ensureTrackAudio(outputTrack);
    outputNode ||= outputTrack.gainNode;
    const pan = Number.isFinite(noteOptions.pan) ? Math.max(-1, Math.min(1, noteOptions.pan)) : 0;
    if (pan !== 0) {
      const panner = state.audioContext.createStereoPanner();
      panner.pan.setValueAtTime(pan, time);
      panner.connect(outputNode);
      outputNode = panner;
    }
    if (track.sample) {
      const context = state.audioContext;
      const source = context.createBufferSource();
      registerArrangementPlaybackSource(source);
      const envelope = context.createGain();
      const detune = Number.isFinite(noteOptions.detune) ? noteOptions.detune : 0;
      const rootMidi = Number.isFinite(track.sampleRootMidi) ? track.sampleRootMidi : 60;
      const rate = Math.pow(2, (midi - rootMidi + detune / 100) / 12);
      source.buffer = getLibrarySamplePlaybackBuffer(track);
      source.playbackRate.setValueAtTime(rate, time);
      const bufferDuration = Math.min(source.buffer.duration * soundDurationScale, Math.max(0.01, duration) * rate);
      const outputDuration = bufferDuration / rate;
      const fade = Math.min(0.02, outputDuration * 0.12);
      const attack = Math.min(Math.max(0, Number.isFinite(noteOptions.attack) ? noteOptions.attack : 0), outputDuration * 0.7);
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.linearRampToValueAtTime(velocity, time + attack);
      envelope.gain.setValueAtTime(velocity, time + Math.max(attack, outputDuration - fade));
      envelope.gain.linearRampToValueAtTime(0.0001, time + outputDuration);
      source.connect(envelope);
      envelope.connect(outputNode);
      source.start(time, 0, bufferDuration);
      return;
    }
    if (track.kind === "instrument") {
      playInstrumentVoice(track, time, midi, duration * soundDurationScale, velocity, outputTrack, outputNode, {
        ...noteOptions,
        soundDurationScale,
      });
      return;
    }
    if (track.kind === "drumkit") {
      playDrumKitNote(track, time, midi, duration * soundDurationScale, velocity, outputTrack, outputNode, noteOptions.attack);
      return;
    }
    triggerTrack(track, time, 0, track.variant, duration, outputTrack, outputNode, midi - getDefaultStepMidi(track));
  }

  function playDansBpmSynthVoice(track, time, midi, duration, velocity, outputNode, noteOptions = {}) {
    const context = state.audioContext;
    const patch = track.patch || {};
    const parameter = (key, fallback) => Number.isFinite(patch[key]) ? patch[key] : fallback;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const durationScale = Number.isFinite(noteOptions.soundDurationScale)
      ? Math.max(0.01, Math.min(1, noteOptions.soundDurationScale))
      : 1;
    const attack = Math.min(
      Math.max(0, Number.isFinite(noteOptions.attack) ? noteOptions.attack : parameter("attack", 0.01)),
      Math.max(0.002, duration * 0.7),
    );
    const decay = Math.min(parameter("decay", 0.25), Math.max(0, duration - attack));
    const sustain = Math.max(0, Math.min(0.9, parameter("sustain", 0.55)));
    const release = Math.max(0.01, parameter("release", 0.25) * durationScale);
    const gateEnd = time + Math.max(0.02, duration);
    const outputLevel = Number.isFinite(patch.output) ? Math.max(0, Math.min(1, patch.output)) : 0.72;
    const peak = velocity * 0.48 * outputLevel;
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const cutoff = Math.max(80, Math.min(18000, Number(patch.cutoff) || 3200));
    const filterPeak = Math.min(18000, cutoff * Math.pow(2, parameter("filterEnvOctaves", 0)));
    const filterAttack = Math.min(Math.max(0, parameter("filterAttack", 0.02)), duration * 0.7);
    const filterDecay = Math.min(parameter("filterDecay", 0.35), Math.max(0, duration - filterAttack));
    const filterSustain = Math.max(0, Math.min(1, parameter("filterSustain", 0.25)));
    const filterSustainFrequency = cutoff * Math.pow(2, Math.log2(Math.max(1, filterPeak / cutoff)) * filterSustain);

    filter.type = "lowpass";
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

    const oscillators = [
      { type: patch.wave || "sawtooth", rate: frequency, level: 0.62, detune: Number(noteOptions.detune) || 0 },
      { type: patch.osc2Wave || patch.wave || "sawtooth", rate: frequency, level: Math.max(0, Math.min(0.7, parameter("osc2Level", 0.28))), detune: parameter("osc2Detune", 0) + (Number(noteOptions.detune) || 0) },
      { type: "sine", rate: frequency / 2, level: Math.max(0, Math.min(0.7, parameter("subLevel", 0))), detune: 0 },
    ];
    const activeOscillators = oscillators.filter((oscillator) => oscillator.level > 0).map((settings) => {
      const oscillator = context.createOscillator();
      registerArrangementPlaybackSource(oscillator);
      const gain = context.createGain();
      oscillator.type = settings.type;
      oscillator.frequency.setValueAtTime(settings.rate, time);
      oscillator.detune.setValueAtTime(settings.detune, time);
      gain.gain.setValueAtTime(settings.level, time);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(time);
      oscillator.stop(gateEnd + release + 0.02);
      return oscillator;
    });

    envelope.connect(outputNode);
    filter.connect(envelope);

    const lfoRate = Math.max(0, Math.min(20, parameter("lfoRate", 0)));
    const lfoDepth = Math.max(0, Math.min(100, parameter("lfoDepth", 0)));
    if (activeOscillators.length && lfoRate > 0 && lfoDepth > 0) {
      const lfo = context.createOscillator();
      registerArrangementPlaybackSource(lfo);
      const lfoGain = context.createGain();
      lfo.frequency.setValueAtTime(lfoRate, time);
      lfoGain.gain.setValueAtTime(lfoDepth, time);
      lfo.connect(lfoGain);
      activeOscillators.forEach((oscillator) => lfoGain.connect(oscillator.detune));
      lfo.start(time);
      lfo.stop(gateEnd + release + 0.02);
    }
  }

  function playInstrumentVoice(track, time, midi, duration, velocity, outputTrack = track, outputNode = outputTrack.gainNode, noteOptions = {}) {
    const context = state.audioContext;
    const patch = track.patch || {};
    if (patch.engine === "dansbpm") {
      playDansBpmSynthVoice(track, time, midi, duration, velocity, outputNode, noteOptions);
      return;
    }
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const noteAttack = Number.isFinite(noteOptions.attack) ? noteOptions.attack : Number(patch.attack) || 0.005;
    const attack = Math.min(Math.max(0, noteAttack), Math.max(0.002, duration * 0.7));
    const decay = Math.min(Number(patch.decay) || 0.1, Math.max(0.005, duration - attack));
    const soundDurationScale = Number.isFinite(noteOptions.soundDurationScale)
      ? Math.max(0.01, Math.min(1, noteOptions.soundDurationScale))
      : 1;
    const release = Math.max(0.01, (Number(patch.release) || 0.1) * soundDurationScale);
    const sustain = Math.max(0.04, Math.min(0.9, Number(patch.sustain) || 0.3));
    const gateEnd = time + Math.max(0.02, duration);
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    registerArrangementPlaybackSource(oscillator);
    const peak = velocity * 0.42;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.max(100, Number(patch.cutoff) || 5000), time);
    filter.Q.value = 0.7;
    oscillator.type = patch.wave || "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.detune.setValueAtTime((Number(patch.detune) || 0) + (Number(noteOptions.detune) || 0), time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(peak, time + attack);
    envelope.gain.linearRampToValueAtTime(peak * sustain, time + attack + decay);
    envelope.gain.setValueAtTime(peak * sustain, gateEnd);
    envelope.gain.linearRampToValueAtTime(0.0001, gateEnd + release);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(outputNode);
    oscillator.start(time);
    oscillator.stop(gateEnd + release + 0.02);
    if (patch.harmonic) {
      const overtone = context.createOscillator();
      registerArrangementPlaybackSource(overtone);
      const overtoneGain = context.createGain();
      overtone.type = patch.wave || "sine";
      overtone.frequency.setValueAtTime(frequency * patch.harmonic, time);
      overtone.detune.setValueAtTime((Number(patch.detune) || 0) + (Number(noteOptions.detune) || 0), time);
      overtoneGain.gain.setValueAtTime(Math.max(0, Math.min(0.6, Number(patch.harmonicLevel) || 0.15)), time);
      overtone.connect(overtoneGain);
      overtoneGain.connect(filter);
      overtone.start(time);
      overtone.stop(gateEnd + release + 0.02);
    }
  }

  function playDrumKitNote(track, time, midi, duration, velocity, outputTrack = track, outputNode = outputTrack.gainNode, attack = 0) {
    const kit = track.patch?.kit || "909";
    const sounds = DRUM_KIT_PROFILES[kit] || DRUM_KIT_PROFILES["909"];
    const scale = Math.max(0.25, Math.min(4, duration / getStepDuration()));
    const context = state.audioContext;
    const noteGain = state.audioContext.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + Math.max(0, Number.isFinite(attack) ? attack : 0));
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
    oscillator.frequency.exponentialRampToValueAtTime(endPitch, time + duration * 0.72);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, velocity * 0.72), time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playDrumKitBell(output, time, frequency, velocity, scale) {
    const context = state.audioContext;
    const envelope = context.createGain();
    const duration = Math.min(0.55, 0.28 * scale);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, velocity * 0.24), time + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
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
      oscillator.stop(time + duration + 0.02);
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
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, velocity * 0.2), time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playKick(context, output, time, step, variant, durationScale, pitchRatio = 1) {
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
    const pitch = settings.start * (step % 8 === 0 ? 1 : 0.88) * pitchRatio;
    osc.type = settings.wave || "sine";
    osc.frequency.setValueAtTime(pitch, time);
    osc.frequency.exponentialRampToValueAtTime(settings.end * pitchRatio, time + duration * (settings.sweep || 0.38));
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    osc.stop(time + duration + 0.02);
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
    envelope.gain.exponentialRampToValueAtTime(peak, time + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    source.start(time);
    source.stop(time + duration + 0.015);
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
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + settings.bodyDuration * durationScale);
    body.connect(envelope);
    envelope.connect(output);
    body.start(time);
    body.stop(time + settings.bodyDuration * durationScale + 0.02);
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
    osc.frequency.exponentialRampToValueAtTime(pitch[1] * pitchRatio, time + 0.045 * durationScale);
    envelope.gain.setValueAtTime(0.32, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.075 * durationScale);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    osc.stop(time + 0.09 * durationScale);
  }

  function triggerClick(time, downbeat) {
    const osc = state.audioContext.createOscillator();
    registerArrangementPlaybackSource(osc);
    const gain = state.audioContext.createGain();
    osc.frequency.setValueAtTime(downbeat ? 1350 : 950, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
    osc.connect(gain);
    gain.connect(state.masterTrack.gainNode || state.masterGain);
    osc.start(time);
    osc.stop(time + 0.035);
  }

  async function startPlayback(mode = "arrangement", { startAtMs = null, remote = false } = {}) {
    if (state.isPlaying || state.isStartingPlayback || state.isExporting) return;
    const requestId = ++state.playbackRequestId;
    state.isStartingPlayback = true;
    playButton.classList.toggle("is-playing", mode === "arrangement");
    playButton.setAttribute("aria-label", "Pause Track View");
    try {
      await ensureAudio();
      if (requestId !== state.playbackRequestId) return;
      await loadLibrarySamplesForPlayback(mode);
      if (requestId !== state.playbackRequestId) return;
      state.isStartingPlayback = false;
      if (startAtMs === null && !remote && collaboration.session &&
        collaboration.socket?.readyState === WebSocket.OPEN) {
        startAtMs = Date.now() + 1500;
        sendCollaborationMessage({ type: "transport", action: "play", mode, startAtMs });
      }
      state.isPlaying = true;
      state.playbackMode = mode;
      const arrangementPlayback = mode === "arrangement";
      const { startBar: loopStartBar, endBar: loopEndBar } = getArrangementLoopRange();
      const startBar = arrangementPlayback
        ? state.arrangementLoopEnabled &&
          (state.arrangementCursor < loopStartBar || state.arrangementCursor >= loopEndBar)
          ? loopStartBar
          : Math.min(state.arrangementCursor, state.arrangementBars - 1)
        : 0;
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
      state.schedulerId = window.setInterval(scheduler, 25);
      syncMixerMeters();
      playButton.classList.toggle("is-playing", arrangementPlayback);
      playButton.setAttribute("aria-label", arrangementPlayback ? "Pause Track View" : "Play Track View");
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
        getAudioClipSegments(clip, startBar, Math.min(
          arrangementEndBar,
          clip.startBar + getArrangementClipDuration("audio", clip),
        ))
          .forEach((segment) => {
            const when = startTime + (segment.startBar - startBar) * secondsPerBar;
            const source = state.audioContext.createBufferSource();
            source.buffer = clip.buffer;
            source.connect(track.gainNode);
            source.onended = () => state.arrangementSources.delete(source);
            source.start(when, segment.sourceOffsetSeconds, segment.durationSeconds);
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
          const duration = Math.max(0, Math.min(noteEndBar, arrangementEndBar) - audibleStartBar) * secondsPerBar;
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
    const tracks = [...state.patterns, ...state.melTracks, ...state.arrangementTracks];
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

  function stopPlayback(remote = false) {
    if ((state.isPlaying || state.isStartingPlayback) && !remote &&
      !collaboration.applyingRemote && collaboration.session) {
      sendCollaborationMessage({ type: "transport", action: "stop" });
    }
    state.playbackRequestId += 1;
    state.isStartingPlayback = false;
    const stoppedPlaybackMode = state.playbackMode;
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
      try { source.stop(state.audioContext?.currentTime || 0); } catch { /* The source may have ended between scheduler ticks. */ }
    });
    state.arrangementSources.clear();
    if (stoppedPlaybackMode === "arrangement" && state.view === "arrangement") state.arrangementCursor = 0;
    if (state.audioContext) {
      const now = state.audioContext.currentTime;
      [...state.patterns, ...state.melTracks, ...state.arrangementTracks].forEach((track) => {
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

  function getCurrentUserProjects() {
    return state.projects.filter((project) => project.ownerId === state.currentUser);
  }

  function getCurrentUserName() {
    return state.users.find((user) => user.id === state.currentUser)?.name || "";
  }

  function saveUsers() {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(state.users));
  }

  function renderLoginUsers() {
    const options = $("#login-options");
    options.replaceChildren();
    state.users.forEach((user) => {
      const button = document.createElement("button");
      button.className = "login-option";
      button.type = "button";
      button.dataset.userId = user.id;
      const avatar = document.createElement("span");
      avatar.className = `login-avatar${user.id === "guest" ? " guest-avatar" : ""}`;
      avatar.textContent = user.name.trim().charAt(0).toUpperCase();
      const text = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = user.name;
      const detail = document.createElement("small");
      detail.textContent = `Open ${user.name}'s projects`;
      text.append(name, detail);
      const arrow = document.createElement("span");
      arrow.className = "login-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      button.append(avatar, text, arrow);
      options.append(button);
    });
  }

  function initializeUsers() {
    let users = DEFAULT_USERS.map((user) => ({ ...user }));
    try {
      const savedUsers = JSON.parse(window.localStorage.getItem(USERS_KEY) || "null");
      if (Array.isArray(savedUsers)) {
        users = savedUsers.filter((user) =>
          typeof user?.id === "string" && user.id && typeof user.name === "string" && user.name.trim())
          .map((user) => ({ id: user.id, name: user.name.trim().slice(0, 32) }));
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
    renderLoginUsers();
  }

  function getSessionUser() {
    try {
      const userId = window.sessionStorage.getItem(ACTIVE_USER_KEY);
      return state.users.some((user) => user.id === userId) ? userId : null;
    } catch {
      return null;
    }
  }

  function selectUser(userId) {
    if (!state.users.some((user) => user.id === userId)) return;
    try {
      window.sessionStorage.setItem(ACTIVE_USER_KEY, userId);
      window.sessionStorage.setItem(OPEN_PROJECTS_KEY, "true");
      window.location.reload();
    } catch (error) {
      try { window.sessionStorage.removeItem(ACTIVE_USER_KEY); } catch { /* Session storage may be unavailable. */ }
      $("#login-error").textContent = `Could not start this profile: ${error.message || "session storage is unavailable"}`;
    }
  }

  function createUser() {
    const input = $("#new-profile-name");
    const name = input.value.trim().slice(0, 32);
    const error = $("#login-error");
    error.textContent = "";
    if (!name) {
      error.textContent = "Enter a name for your profile.";
      input.focus();
      return;
    }
    if (state.users.some((user) => user.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      error.textContent = "A profile with that name already exists in this browser.";
      input.focus();
      return;
    }
    const user = { id: makeId(), name };
    state.users.push(user);
    try {
      saveUsers();
      renderLoginUsers();
      selectUser(user.id);
    } catch (saveError) {
      state.users = state.users.filter((item) => item.id !== user.id);
      error.textContent = `Could not save this profile: ${saveError.message || "browser storage is unavailable"}`;
    }
  }

  function writeProjectCatalog() {
    const activeProjectIds = { ...state.activeProjectIds };
    if (state.currentUser && state.projectId) activeProjectIds[state.currentUser] = state.projectId;
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify({
      activeProjectId: state.projectId,
      activeProjectIds,
      projects: state.projects,
    }));
    state.activeProjectIds = activeProjectIds;
  }

  function updateProjectNameLabel() {
    $("#project-name").firstChild.textContent = `${state.projectName} `;
  }

  function initializeProjects() {
    try {
      const savedCatalog = JSON.parse(window.localStorage.getItem(PROJECTS_KEY) || "null");
      let projects = Array.isArray(savedCatalog?.projects)
        ? savedCatalog.projects.filter((project) => typeof project?.id === "string" && typeof project.name === "string")
        : [];
      projects = projects.map((project) => ({
        ...project,
        ownerId: state.users.some((user) => user.id === project.ownerId) ? project.ownerId : "taylor",
      }));
      state.activeProjectIds = savedCatalog?.activeProjectIds && typeof savedCatalog.activeProjectIds === "object"
        ? { ...savedCatalog.activeProjectIds }
        : {};

      if (!projects.length) {
        const name = window.localStorage.getItem(`${STORAGE_KEY}-name`)?.trim() || "Untitled session";
        const oldSnapshot = window.localStorage.getItem(STORAGE_KEY);
        if (oldSnapshot || name !== "Untitled session") {
          projects = [{ id: "default", name, ownerId: "taylor", updatedAt: Date.now() }];
          if (oldSnapshot) window.localStorage.setItem(getProjectStorageKey("default"), oldSnapshot);
        }
      }

      state.projects = projects;
      if (state.currentUser) {
        let userProjects = getCurrentUserProjects();
        if (!userProjects.length) {
          const project = {
            id: makeId(),
            name: "Untitled session",
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
      state.projectName = activeProject?.name || "Untitled session";
      updateProjectNameLabel();
    } catch (error) {
      state.projects = [{
        id: "default",
        name: "Untitled session",
        ownerId: state.currentUser || "taylor",
        updatedAt: 0,
      }];
      state.projectId = state.currentUser ? "default" : "";
      state.projectName = "Untitled session";
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
        name: track.name,
        kind: track.kind,
        color: track.color,
        cells: track.libraryOnly ? undefined : track.cells,
        volume: track.volume,
        pan: track.pan,
        muted: track.muted,
        solo: track.solo,
        variant: track.variant,
        pitch: track.pitch || 0,
        swing: Number.isFinite(track.swing) ? track.swing : null,
        audioMetadata: normalizeAudioMetadata(track.audioMetadata),
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
      mels: state.mels.map((mel) => ({
        id: mel.id,
        name: mel.name,
        instrumentId: mel.instrumentId,
        bars: mel.bars,
        notes: mel.notes.map((note) => ({ ...note })),
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
      soundDurationEdits: { ...state.soundDurationEdits },
      soundReverseEdits: { ...state.soundReverseEdits },
      selectedPianoTrackId: savedMel?.instrumentId || state.selectedPianoTrackId,
      arrangementBars: state.arrangementBars,
      arrangementScale: state.arrangementScale,
      arrangementCursor: state.arrangementCursor,
      arrangementLoopEnabled: state.arrangementLoopEnabled,
      arrangementLoopStartBar: state.arrangementLoopStartBar,
      arrangementLoopEndBar: state.arrangementLoopEndBar,
      arrangementSnap: state.arrangementSnap,
      workspaceRatio: state.workspaceRatio,
      sequencerScale: state.sequencerScale,
      workspaceHidden: state.workspaceHidden,
      trackViewHidden: state.trackViewHidden,
      view: stepEditContext?.previousView || state.view,
    };
  }

