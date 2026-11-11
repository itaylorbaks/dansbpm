  function toggleCurrentWorkspacePlayback() {
    const workspace = !state.workspaceHidden && ["sequencer", "piano-roll"].includes(state.view)
      ? state.view
      : null;
    const currentPlaybackActive = workspace
      ? Boolean(state.workspacePlayers[workspace])
      : state.isPlaying && state.playbackMode === "arrangement";
    if (currentPlaybackActive) {
      stopAllWorkspacePlayers();
      if (state.isPlaying) stopPlayback();
      return;
    }
    stopAllWorkspacePlayers();
    if (state.isPlaying) stopPlayback();
    if (workspace) toggleWorkspacePlayback(workspace);
    else startPlayback("arrangement");
  }

  function workspacePlaybackScheduler(workspace) {
    const player = state.workspacePlayers[workspace];
    if (!player || !state.audioContext) return;
    const now = state.audioContext.currentTime;
    const lookAhead = 0.12;
    while (player.nextStepTime < now + lookAhead) {
      const clockStep = player.stepIndex;
      if (workspace === "sequencer") {
        const pattern = getPattern();
        if (pattern) {
          getGridEventsForTick(pattern, clockStep).forEach(({ step, tickOffset }) => {
            const eventTick = clockStep + tickOffset;
            const swingOffset = Math.floor(eventTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0;
            const eventTime = player.nextStepTime + tickOffset * getSchedulerTickDuration();
            scheduleStep(step % getGridStepCount(pattern), eventTime + swingOffset, pattern, null, false, player);
          });
          schedulePatternPianoNotes(pattern, clockStep % (pattern.steps * 2), player.nextStepTime);
        }
      } else {
        scheduleWorkspaceMelLoop(player, now, lookAhead);
        updatePianoCursorFromTime(player.startTime);
      }
      if (state.metronome && state.recordingMetronomeTimer === null && clockStep % 8 === 0) {
        triggerClick(player.nextStepTime, clockStep % 32 === 0);
      }
      player.nextStepTime += getSchedulerTickDuration();
      const cycleTicks = workspace === "sequencer" ? (getPattern()?.steps || state.steps) * 2 : 32;
      player.stepIndex = (clockStep + 1) % cycleTicks;
    }
  }

  function scheduleWorkspaceMelLoop(player, now, lookAhead) {
    const { notes, instrument, loopBars } = getPianoPlaybackSource();
    if (!notes || !instrument) return;
    schedulePianoMelLoopNotes(notes, instrument, player.startTime, now, lookAhead,
      player.scheduledMelNotes, loopBars, player.startTick || 0);
  }

  function setPlayhead(step) {
    state.currentStep = step;
    document.querySelectorAll(".step-cell.is-playhead").forEach((cell) => cell.classList.remove("is-playhead"));
    document.querySelectorAll(`.step-cell[data-step="${step}"]`).forEach((cell) => cell.classList.add("is-playhead"));
  }

  function makeId() {
    return window.crypto?.randomUUID?.() || `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function isAudioFile(file) {
    return file.type.startsWith("audio/") || /\.(wav|wave|mp3|m4a|aac|flac|ogg|opus|webm|aiff?)$/i.test(file.name);
  }

  const MUSICAL_KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const MUSICAL_KEY_PROFILES = [
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  ];

  function getKeyFromChroma(chroma) {
    const total = chroma.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return null;
    const distribution = chroma.map((value) => value / total);
    const entropy = -distribution.reduce((sum, value) => sum + (value > 0 ? value * Math.log2(value) : 0), 0);
    const contrast = Math.max(...chroma) / (total / chroma.length);
    if (entropy > 3.45 || contrast < 1.7) return null;
    const mean = total / chroma.length;
    let best = { score: -Infinity, tonic: 0, mode: 0 };
    let secondScore = -Infinity;
    MUSICAL_KEY_PROFILES.forEach((profile, mode) => {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        const profileMean = profile.reduce((sum, value) => sum + value, 0) / 12;
        let numerator = 0;
        let chromaVariance = 0;
        let profileVariance = 0;
        for (let pitch = 0; pitch < 12; pitch += 1) {
          const observed = chroma[(pitch + tonic) % 12] - mean;
          const expected = profile[pitch] - profileMean;
          numerator += observed * expected;
          chromaVariance += observed * observed;
          profileVariance += expected * expected;
        }
        const score = numerator / Math.sqrt(chromaVariance * profileVariance || 1);
        if (score > best.score) {
          secondScore = best.score;
          best = { score, tonic, mode };
        } else if (score > secondScore) {
          secondScore = score;
        }
      }
    });
    if (best.score < 0.25 || best.score - secondScore < 0.02) return null;
    return `${MUSICAL_KEY_NAMES[best.tonic]} ${best.mode === 0 ? "major" : "minor"}`;
  }

  function detectAudioMetadata(buffer) {
    // Analyze a bounded local window; spectral flux estimates tempo and chroma estimates key.
    const stride = Math.max(1, Math.floor(buffer.sampleRate / 11025));
    const sampleRate = buffer.sampleRate / stride;
    const sampleCount = Math.min(Math.floor(buffer.length / stride), Math.floor(sampleRate * 45));
    const frameSize = 2048;
    const hopSize = 256;
    if (sampleCount < frameSize) return { bpm: null, key: null };
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const mono = new Float32Array(sampleCount);
    for (let index = 0; index < sampleCount; index += 1) {
      let sample = 0;
      channels.forEach((channel) => { sample += channel[index * stride] || 0; });
      mono[index] = sample / channels.length;
    }

    const cosine = new Float64Array(frameSize / 2);
    const sine = new Float64Array(frameSize / 2);
    const reversedIndices = new Uint16Array(frameSize);
    for (let index = 0; index < frameSize / 2; index += 1) {
      cosine[index] = Math.cos(2 * Math.PI * index / frameSize);
      sine[index] = Math.sin(2 * Math.PI * index / frameSize);
    }
    for (let index = 0; index < frameSize; index += 1) {
      let reversed = 0;
      for (let bit = 1, source = index; bit < frameSize; bit <<= 1, source >>= 1) {
        reversed = (reversed << 1) | (source & 1);
      }
      reversedIndices[index] = reversed;
    }
    const window = Float32Array.from({ length: frameSize }, (_, index) =>
      0.5 - 0.5 * Math.cos(2 * Math.PI * index / (frameSize - 1)));
    const real = new Float64Array(frameSize);
    const imaginary = new Float64Array(frameSize);
    const previousMagnitudes = new Float32Array(frameSize / 2);
    const chroma = Array(12).fill(0);
    const onsets = [];
    const frameRate = sampleRate / hopSize;

    for (let offset = 0; offset + frameSize <= sampleCount; offset += hopSize) {
      for (let index = 0; index < frameSize; index += 1) {
        real[reversedIndices[index]] = mono[offset + index] * window[index];
        imaginary[reversedIndices[index]] = 0;
      }
      for (let size = 2; size <= frameSize; size <<= 1) {
        const halfSize = size >> 1;
        const tableStep = frameSize / size;
        for (let start = 0; start < frameSize; start += size) {
          for (let index = 0; index < halfSize; index += 1) {
            const tableIndex = index * tableStep;
            const cosineValue = cosine[tableIndex];
            const sineValue = -sine[tableIndex];
            const even = start + index;
            const odd = even + halfSize;
            const oddReal = real[odd] * cosineValue - imaginary[odd] * sineValue;
            const oddImaginary = real[odd] * sineValue + imaginary[odd] * cosineValue;
            real[odd] = real[even] - oddReal;
            imaginary[odd] = imaginary[even] - oddImaginary;
            real[even] += oddReal;
            imaginary[even] += oddImaginary;
          }
        }
      }

      let spectralFlux = 0;
      for (let bin = 1; bin < frameSize / 2; bin += 1) {
        const magnitude = Math.hypot(real[bin], imaginary[bin]);
        const frequency = bin * frameRate * hopSize / frameSize;
        if (frequency >= 55 && frequency <= 5000) {
          const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
          chroma[(midi % 12 + 12) % 12] += magnitude;
          spectralFlux += Math.max(0, magnitude - previousMagnitudes[bin]);
        }
        previousMagnitudes[bin] = magnitude;
      }
      onsets.push(spectralFlux);
    }

    let bpm = null;
    if (buffer.duration >= 4 && onsets.length > 12) {
      const onsetMean = onsets.reduce((sum, value) => sum + value, 0) / onsets.length;
      const centeredOnsets = onsets.map((value) => value - onsetMean);
      const minLag = Math.max(2, Math.floor(frameRate * 60 / 200));
      const maxLag = Math.min(onsets.length - 2, Math.ceil(frameRate * 60 / 60));
      const correlations = new Map();
      const totalOnsetEnergy = centeredOnsets.reduce((sum, value) => sum + value * value, 0);
      const correlationAt = (lag) => {
        if (lag < minLag || lag > maxLag) return 0;
        if (correlations.has(lag)) return correlations.get(lag);
        let product = 0;
        for (let index = lag; index < centeredOnsets.length; index += 1) {
          product += centeredOnsets[index] * centeredOnsets[index - lag];
        }
        const score = product / (totalOnsetEnergy || 1);
        correlations.set(lag, score);
        return score;
      };
      let bestLag = 0;
      let bestScore = -Infinity;
      for (let lag = minLag; lag <= maxLag; lag += 1) {
        const score = correlationAt(lag);
        if (score > bestScore) {
          bestLag = lag;
          bestScore = score;
        }
      }
      if (bestLag && bestScore > 0.08) {
        const leftScore = correlationAt(bestLag - 1);
        const rightScore = correlationAt(bestLag + 1);
        const curvature = leftScore - 2 * bestScore + rightScore;
        const fractionalLag = bestLag + (curvature ? 0.5 * (leftScore - rightScore) / curvature : 0);
        let detected = 60 * frameRate / fractionalLag;
        if (detected < 85 && detected * 2 <= 200 &&
          correlationAt(Math.round(bestLag / 2)) >= bestScore * 0.8) detected *= 2;
        bpm = Math.round(detected);
      }
    }
    return { bpm, key: getKeyFromChroma(chroma) };
  }

  function normalizeAudioMetadata(metadata) {
    return {
      bpm: Number.isFinite(metadata?.bpm) && metadata.bpm >= 40 && metadata.bpm <= 240
        ? Math.round(metadata.bpm) : null,
      key: typeof metadata?.key === "string" && /^[A-G]#? (major|minor)$/.test(metadata.key)
        ? metadata.key : null,
    };
  }

  function makeDrumSampleTrack(options) {
    const name = options.name?.trim() || "Imported drum";
    const track = {
      id: options.id || makeId(),
      name,
      kind: "sample",
      color: /^#[\da-f]{6}$/i.test(options.color || "") ? options.color : TRACK_COLORS[state.tracks.length % TRACK_COLORS.length],
      subtitle: "Imported drum sample",
      volume: Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : 0.72,
      cells: Array.from({ length: STEP_COUNT }, (_, index) => options.cells?.[index] === true),
      variant: null,
      muted: options.muted === true,
      solo: options.solo === true,
      pitch: Number.isFinite(options.pitch) ? Math.max(-12, Math.min(12, options.pitch)) : 0,
      swing: Number.isFinite(options.swing) ? Math.max(0, Math.min(45, options.swing)) : null,
      sample: options.buffer ? { name: options.fileName || name, buffer: options.buffer } : null,
      audioMetadata: normalizeAudioMetadata(options.audioMetadata),
      gainNode: null,
      effects: makeDefaultEffects(options.effects),
    };
    ensureSequencerTrackAudio(track);
    return track;
  }

  function makePatternInstrumentLayer(source, options = {}) {
    const layer = {
      ...source,
      id: options.id || makeId(),
      sourceId: source.sourceId || source.id,
      name: options.name || source.name,
      libraryOnly: false,
      patch: source.patch ? { ...source.patch } : undefined,
      cells: Array.from({ length: STEP_COUNT }, (_, index) => options.cells?.[index] === true),
      volume: Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : source.volume,
      muted: options.muted === true,
      solo: options.solo === true,
      pitch: Number.isFinite(options.pitch) ? Math.max(-12, Math.min(12, options.pitch)) : source.pitch || 0,
      swing: Number.isFinite(options.swing) ? Math.max(0, Math.min(45, options.swing)) : source.swing ?? null,
      variant: options.variant ?? source.variant,
      sample: source.sample ? { ...source.sample } : null,
      gainNode: null,
      fxRuntime: null,
      effects: makeDefaultEffects(options.effects),
    };
    ensureSequencerTrackAudio(layer);
    return layer;
  }

  async function importDrumSamples(files) {
    if (!files.length) return;
    const imported = [];
    const failures = [];
    try {
      await ensureAudio();
      captureCurrentPattern();
      for (const file of files) {
        if (!isAudioFile(file)) {
          failures.push(file.name);
          continue;
        }
        try {
          const buffer = await state.audioContext.decodeAudioData(await file.arrayBuffer());
          const track = makeDrumSampleTrack({
            name: file.name.replace(/\.[^.]+$/, "") || file.name,
            fileName: file.name,
            buffer,
            audioMetadata: detectAudioMetadata(buffer),
          });
          state.tracks.push(track);
          const pattern = getPattern();
          if (pattern) {
            pattern.trackIds = [...getPatternTrackIds(pattern), track.id];
            pattern.cells[track.id] = Array(STEP_COUNT).fill(false);
          }
          imported.push({ track, file });
        } catch {
          failures.push(file.name);
        }
      }

      if (imported.length) {
        renderTracks();
        if (isSongWorkspace()) renderArrangement();
        saveState();
        const saves = await Promise.allSettled(imported.map(({ track, file }) => persistDrumSample(track, file)));
        const storageFailed = saves.some((result) => result.status === "rejected");
        const summary = `${imported.length} drum sound${imported.length === 1 ? "" : "s"} imported`;
        showToast(`${summary}${failures.length ? `; ${failures.length} could not be decoded` : ""}${storageFailed ? "; some couldn't be saved" : ""}.`);
      } else {
        showToast(failures.length ? `Could not import ${failures.join(", ")}.` : "Choose one or more audio files.");
      }
    } catch (error) {
      showToast(`Could not import drum sounds: ${error.message || "audio is unavailable"}`);
    } finally {
      drumSamplesInput.value = "";
    }
  }

  function removeImportedDrumTrack(track) {
    if (state.isPlaying) stopPlayback();
    const removedTracks = track.sourceId
      ? [track]
      : state.tracks.filter((item) => item === track || item.sourceId === track.id);
    const removedIds = new Set(removedTracks.map((item) => item.id));
    removedTracks.forEach(disconnectTrackAudio);
    state.tracks = state.tracks.filter((item) => !removedIds.has(item.id));
    const fallbackInstrumentId = state.tracks.find((item) => !item.sourceId)?.id || state.tracks[0]?.id || "";
    if (removedIds.has(state.selectedPianoTrackId)) state.selectedPianoTrackId = fallbackInstrumentId;
    state.pianoNotes = state.pianoNotes.map((note) => ({
      ...note,
      trackId: removedIds.has(note.trackId) ? fallbackInstrumentId : note.trackId,
    }));
    state.mels.forEach((mel) => {
      if (removedIds.has(mel.instrumentId)) mel.instrumentId = fallbackInstrumentId;
      mel.notes = mel.notes.map((note) => ({ ...note, trackId: mel.instrumentId }));
    });
    state.melTracks.forEach((melTrack) => {
      if (removedIds.has(melTrack.instrumentId)) {
        melTrack.instrumentId = fallbackInstrumentId;
        if (state.audioContext) {
          const fallbackTrack = getPianoTrack(fallbackInstrumentId);
          if (fallbackTrack) ensureTrackAudio(fallbackTrack);
          rebuildTrackEffectChain(melTrack);
        }
      }
    });
    if (!state.pianoNotes.some((note) => note.id === state.selectedPianoNoteId)) state.selectedPianoNoteId = null;
    state.patterns.forEach((pattern) => {
      pattern.trackIds = getPatternTrackIds(pattern).filter((id) => !removedIds.has(id));
      removedIds.forEach((id) => {
        delete pattern.cells[id];
        delete pattern.variants[id];
      });
    });
    renderTracks();
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
    if (isSongWorkspace()) renderArrangement();
    updateTrackGains();
    saveState();
    removedTracks.filter((item) => item.kind === "sample" || item.sample).forEach((item) => {
      deletePersistedDrumSample(item.id).catch(() => showToast("Track removed, but its saved sample could not be deleted."));
    });
    showToast(`${track.name} removed`);
  }

  function getNextArrangementTrackName() {
    let number = 1;
    while (state.arrangementTracks.some((track) => track.name === `Track ${number}`)) number += 1;
    return `Track ${number}`;
  }

  function createArrangementTrack(name = getNextArrangementTrackName(), insertAfterTrackId = null) {
    const track = {
      id: makeId(),
      name,
      insertAfterTrackId,
      color: TRACK_COLORS[state.arrangementTracks.length % TRACK_COLORS.length],
      clips: [],
      volume: 0.8,
      automation: normalizeTrackAutomation(),
      automationOpen: false,
      muted: false,
      solo: false,
      gainNode: null,
      effects: makeDefaultEffects(),
    };
    state.arrangementTracks.push(track);
    ensureArrangementTrackAudio(track);
    return track;
  }

  function ensureArrangementTrackAudio(track) {
    ensureTrackAudio(track);
  }

  function ensureSequencerTrackAudio(track) {
    ensureTrackAudio(track);
  }

  function ensureTrackAudio(track) {
    ensureTrackMixerState(track);
    if (!state.audioContext) return;
    if (track !== state.masterTrack) ensureTrackAudio(state.masterTrack);
    if (track.kind !== "mixer-master" && track.kind !== "mixer-effects") {
      state.effectTracks.forEach(ensureTrackAudio);
    }
    if (track.kind === "mel") {
      const instrument = state.tracks.find((item) => item.id === track.instrumentId);
      if (instrument && instrument !== track) ensureTrackAudio(instrument);
    }
    if (!track.panNode) {
      track.panNode = state.audioContext.createStereoPanner();
      track.panNode.pan.value = track.pan;
    }
    if (!track.automationGainNode) {
      track.automationGainNode = state.audioContext.createGain();
      track.automationGainNode.gain.value = 1;
    }
    if (!track.gainNode) {
      track.gainNode = state.audioContext.createGain();
      track.gainNode.gain.value = track.muted ? 0 : track.volume;
      updateTrackGains();
    }
    if (!track.fxRuntime) rebuildTrackEffectChain(track);
  }

  function getTrackOutputNode(track) {
    if (track === state.masterTrack) return state.masterGain;
    if (track.kind === "mixer-effects") return state.masterTrack?.gainNode || state.masterGain;
    const effectTrack = state.effectTracks.find((candidate) => candidate.routedTrackIds.includes(track.id));
    if (effectTrack) return effectTrack.gainNode || state.masterTrack?.gainNode || state.masterGain;
    if (track.kind === "mel") {
      const instrument = state.tracks.find((item) => item.id === track.instrumentId);
      if (instrument && instrument !== track) return instrument.gainNode || state.masterTrack?.gainNode || state.masterGain;
    }
    return state.masterTrack?.gainNode || state.masterGain;
  }

  function rebuildTrackEffectChain(track) {
    const context = state.audioContext;
    if (!context || !track.gainNode || !state.masterGain) return;
    clearTrackEffectNodes(track);
    track.analyser?.disconnect();
    track.analyser = null;
    ensureTrackMixerState(track);
    if (!track.panNode) {
      track.panNode = context.createStereoPanner();
      track.panNode.pan.value = track.pan;
    }
    if (!track.automationGainNode) {
      track.automationGainNode = context.createGain();
      track.automationGainNode.gain.value = 1;
    }
    track.fxRuntime = [];
    track.gainNode.disconnect();
    track.automationGainNode.disconnect();
    let output = track.gainNode;

    const eq = [
      ["lowshelf", 40, track.effects.eqSub],
      ["peaking", 160, track.effects.eqLow],
      ["peaking", 1000, track.effects.eqMid],
      ["peaking", 5000, track.effects.eqHigh],
      ["highshelf", 12000, track.effects.eqAir],
    ].map(([type, frequency, gain]) => {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.gain.value = gain;
      output.connect(filter);
      output = filter;
      return filter;
    });
    track.fxRuntime.push({ nodes: eq, sources: [] });

    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    output.connect(analyser);
    output = analyser;
    track.analyser = analyser;
    track.fxRuntime.push({ nodes: [analyser], sources: [] });

    track.effectChain.forEach((id) => {
      const amount = track.effects[id];
      const module = createTrackEffect(context, id, amount, track.effectSettings[id]);
      output.connect(module.input);
      output = module.output;
      track.fxRuntime.push(module);
    });
    track.panNode.disconnect();
    output.connect(track.automationGainNode);
    track.automationGainNode.connect(track.panNode);
    track.panNode.connect(getTrackOutputNode(track));
  }

  function rebuildMixerAudioRouting() {
    if (!state.audioContext) return;
    ensureTrackAudio(state.masterTrack);
    state.effectTracks.forEach(ensureTrackAudio);
    getMixerSourceTracks().forEach(({ track }) => {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    });
  }

  function clearTrackEffectNodes(track) {
    track.fxRuntime?.forEach(({ nodes, sources }) => {
      sources.forEach((source) => {
        try { source.stop(); } catch { /* already stopped */ }
      });
      nodes.forEach((node) => node.disconnect());
    });
    track.fxRuntime = null;
  }

  function disconnectTrackAudio(track) {
    clearTrackEffectNodes(track);
    track.gainNode?.disconnect();
    track.automationGainNode?.disconnect();
    track.panNode?.disconnect();
    track.gainNode = null;
    track.automationGainNode = null;
    track.panNode = null;
  }

  function createTrackEffect(context, id, amount, settings = {}) {
    const input = context.createGain();
    const output = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    const nodes = [input, output, dry, wet];
    const sources = [];
    const mix = amount / 100;
    const setting = (key, fallback) => Number.isFinite(settings[key]) ? settings[key] : fallback;
    dry.gain.value = 1 - mix * 0.65;
    wet.gain.value = mix * 0.65;
    input.connect(dry);
    dry.connect(output);
    let effectOutput;
    const connectWet = (node) => {
      nodes.push(node);
      input.connect(node);
      effectOutput = node;
    };

    if (id === "reverb") {
      const convolver = context.createConvolver();
      const decay = setting("decay", 1.8);
      const impulse = context.createBuffer(2, Math.floor(context.sampleRate * decay), context.sampleRate);
      const random = createSeededRandom(0x51f15e);
      for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const samples = impulse.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          samples[index] = (random() * 2 - 1) * Math.pow(1 - index / samples.length, 2.8);
        }
      }
      convolver.buffer = impulse;
      const preDelay = context.createDelay(0.11);
      preDelay.delayTime.value = setting("preDelay", 20) / 1000;
      input.connect(preDelay);
      preDelay.connect(convolver);
      nodes.push(preDelay, convolver);
      effectOutput = convolver;
    } else if (id === "delay") {
      const delay = context.createDelay(1);
      delay.delayTime.value = setting("time", 0.28);
      const feedback = context.createGain();
      feedback.gain.value = setting("feedback", 42) / 100;
      delay.connect(feedback);
      feedback.connect(delay);
      nodes.push(feedback);
      connectWet(delay);
    } else if (id === "chorus" || id === "pitchShifter" || id === "harmonizer") {
      const delay = context.createDelay(0.5);
      const modulation = context.createOscillator();
      const depth = context.createGain();
      const interval = id === "pitchShifter" ? Math.abs(setting("semitones", 0)) : setting("interval", 7);
      delay.delayTime.value = id === "chorus" ? setting("depth", 12) / 1000 : 0.035 + interval * 0.006;
      modulation.frequency.value = id === "chorus" ? setting("rate", 0.28) : id === "harmonizer" ? 0.7 : 0.45;
      depth.gain.value = id === "chorus" ? setting("depth", 12) / 1000 : 0.035 * mix;
      modulation.connect(depth);
      depth.connect(delay.delayTime);
      modulation.start();
      sources.push(modulation);
      nodes.push(depth);
      connectWet(delay);
    } else if (id === "distortion" || id === "bitcrusher") {
      const shaper = context.createWaveShaper();
      const curve = new Float32Array(4096);
      const drive = setting("drive", 8);
      const levels = Math.pow(2, setting("bits", 8));
      for (let index = 0; index < curve.length; index += 1) {
        const sample = index * 2 / (curve.length - 1) - 1;
        curve[index] = id === "bitcrusher"
          ? Math.round(sample * levels) / levels
          : Math.tanh(sample * drive);
      }
      shaper.curve = curve;
      shaper.oversample = "4x";
      connectWet(shaper);
    } else if (id === "compressor" || id === "noiseGate" || id === "transientShaper") {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = id === "noiseGate" ? setting("threshold", -42)
        : id === "transientShaper" ? -18 - setting("attack", 3)
          : setting("threshold", -18);
      compressor.knee.value = id === "noiseGate" ? 0 : 12;
      compressor.ratio.value = id === "noiseGate" ? 20
        : id === "transientShaper" ? Math.max(1, 5 + setting("sustain", -2) / 3)
          : setting("ratio", 4);
      compressor.attack.value = id === "transientShaper" ? 0.003 : setting("attack", 3) / 1000;
      compressor.release.value = id === "transientShaper" ? 0.08 : setting("release", 180) / 1000;
      connectWet(compressor);
    } else if (id === "tremolo") {
      const tremolo = context.createGain();
      tremolo.gain.value = 0.55;
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 5);
      depth.gain.value = setting("depth", 45) / 100 * mix;
      oscillator.connect(depth);
      depth.connect(tremolo.gain);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(tremolo);
    } else if (id === "autopan") {
      const panner = context.createStereoPanner();
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 0.35);
      depth.gain.value = setting("depth", 100) / 100 * mix;
      oscillator.connect(depth);
      depth.connect(panner.pan);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(panner);
    } else if (id === "phaser") {
      const filters = Array.from({ length: 4 }, () => {
        const filter = context.createBiquadFilter();
        filter.type = "allpass";
        return filter;
      });
      filters.forEach((filter, index) => {
        filter.frequency.value = 400 + index * 600;
        if (index) filters[index - 1].connect(filter);
      });
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 0.18);
      depth.gain.value = setting("depth", 900) * mix;
      oscillator.connect(depth);
      filters.forEach((filter) => depth.connect(filter.frequency));
      oscillator.start();
      nodes.push(...filters, depth);
      sources.push(oscillator);
      connectWet(filters[0]);
      effectOutput = filters.at(-1);
    } else if (id === "vocoder") {
      const carrier = context.createOscillator();
      const ring = context.createGain();
      carrier.type = "sawtooth";
      carrier.frequency.value = setting("carrier", 110);
      carrier.connect(ring.gain);
      carrier.start();
      sources.push(carrier);
      nodes.push(ring);
      connectWet(ring);
    }
    effectOutput.connect(wet);
    wet.connect(output);
    return { input, output, nodes, sources };
  }

  function snapArrangementBar(bar) {
    const position = Number.isFinite(bar) ? bar : 0;
    return state.arrangementSnap ? Math.round(position * 4) / 4 : position;
  }

  function clampArrangementStart(startBar, durationBars) {
    const limit = Math.max(0, MAX_ARRANGEMENT_BARS - durationBars);
    const maxStart = state.arrangementSnap ? Math.floor(limit * 4 + 0.0001) / 4 : limit;
    return Math.max(0, Math.min(maxStart, snapArrangementBar(startBar)));
  }

  function getArrangementClipDuration(type, clip) {
    if (type === "pattern") {
      return Number.isFinite(clip.durationBars)
        ? clip.durationBars
        : (getPattern(clip.patternId)?.steps || 16) / 16 * (clip.repeatCount || 1);
    }
    if (type === "mel") {
      if (Number.isFinite(clip.durationBars)) return clip.durationBars;
      const mel = getMel(clip.melId);
      return mel ? getMelLengthBars(mel) : 1;
    }
    return Number.isFinite(clip.durationSeconds)
      ? clip.durationSeconds / (240 / state.bpm)
      : clip.buffer.duration / (240 / state.bpm);
  }

  function getArrangementClipRepeatLength(type, clip) {
    if (type === "pattern") return (getPattern(clip.patternId)?.steps || 16) / 16;
    if (type === "mel") return getMelLengthBars(getMel(clip.melId) || { bars: 1, notes: [] });
    return Math.max(0.01, clip.buffer.duration) / (240 / state.bpm);
  }

  function getAudioClipSegments(clip, fromBar = clip.startBar, toBar = Infinity) {
    const secondsPerBar = 240 / state.bpm;
    const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
    const sourceDuration = Math.max(0, clip.buffer.duration);
    const segments = [];
    if (!sourceDuration) return segments;
    const clipDuration = getArrangementClipDuration("audio", clip);
    const playableDuration = Math.min(clipDuration, sourceDuration * (clip.repeatCount || 1) - sourceOffset);
    let elapsed = 0;
    while (elapsed < playableDuration) {
      const position = sourceOffset + elapsed;
      const offsetInBuffer = position % sourceDuration;
      const segmentDuration = Math.min(sourceDuration - offsetInBuffer, playableDuration - elapsed);
      const segmentStart = clip.startBar + elapsed / secondsPerBar;
      const segmentEnd = segmentStart + segmentDuration / secondsPerBar;
      if (segmentEnd > fromBar && segmentStart < toBar) {
        const audibleStart = Math.max(segmentStart, fromBar);
        const audibleEnd = Math.min(segmentEnd, toBar);
        segments.push({
          startBar: audibleStart,
          sourceOffsetSeconds: offsetInBuffer + (audibleStart - segmentStart) * secondsPerBar,
          durationSeconds: (audibleEnd - audibleStart) * secondsPerBar,
          loopIndex: Math.floor(position / sourceDuration),
        });
      }
      elapsed += segmentDuration;
    }
    return segments;
  }

  function getMelClipNoteEvents(mel, clip) {
    const melBars = getMelLengthBars(mel);
    const sourceOffset = clip.sourceOffsetBars || 0;
    const sourceEnd = Math.min(melBars * (clip.repeatCount || 1),
      sourceOffset + getArrangementClipDuration("mel", clip));
    const events = [];
    mel.notes.forEach((note) => {
      const noteStart = note.startTick / PIANO_TICKS_PER_BAR;
      const noteEnd = noteStart + note.durationTicks / PIANO_TICKS_PER_BAR;
      const firstLoop = Math.max(0, Math.floor(sourceOffset / melBars));
      const lastLoop = Math.ceil(sourceEnd / melBars);
      for (let loop = firstLoop; loop < lastLoop; loop += 1) {
        const noteStartSource = loop * melBars + noteStart;
        const noteEndSource = loop * melBars + noteEnd;
        const audibleStart = Math.max(sourceOffset, noteStartSource);
        const audibleEnd = Math.min(sourceEnd, noteEndSource);
        if (audibleEnd <= audibleStart) continue;
        events.push({
          note,
          loop,
          startBar: clip.startBar + audibleStart - sourceOffset,
          endBar: clip.startBar + audibleEnd - sourceOffset,
        });
      }
    });
    return events;
  }

  function updateArrangementLength() {
    const secondsPerBar = 240 / state.bpm;
    const melEnd = state.melTracks.reduce((latest, track) =>
      track.clips.reduce((end, clip) => {
        return Math.max(end, clip.startBar + getArrangementClipDuration("mel", clip));
      }, latest), 0);
    const clipEnd = state.arrangementTracks.reduce((latest, track) => {
      return track.clips.reduce((end, clip) => Math.max(end, clip.startBar + getArrangementClipDuration("audio", clip)), latest);
    }, state.patternClips.reduce((end, clip) => {
      return Math.max(end, clip.startBar + getArrangementClipDuration("pattern", clip));
    }, Math.max(32, melEnd)));
    state.arrangementBars = Math.min(MAX_ARRANGEMENT_BARS, Math.max(state.arrangementBars, Math.ceil(clipEnd)));
    if (state.playbackStartTime && state.isPlaying && state.playbackMode === "arrangement") {
      state.playbackEndTime = state.playbackStartTime + (state.arrangementBars - state.playbackStartBar) * secondsPerBar;
    }
    $("#arrangement-bar-label").textContent = `${state.arrangementBars} BARS`;
  }

  function makeOpenMixerButton(track) {
    const button = document.createElement("button");
    button.className = "mixer-track-button";
    button.type = "button";
    button.textContent = "EQ";
    button.title = `Open EQ and effects for ${track.name}`;
    button.setAttribute("aria-label", `Open EQ and effects for ${track.name}`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectArrangementTrack(track.id);
      setWorkspaceView("mixer");
    });
    return button;
  }

  function makeArrangementTrackControls(track, includeRecordingButton = false) {
    const actions = document.createElement("div");
    actions.className = "arrangement-label-actions";
    if (includeRecordingButton) {
      const add = document.createElement("button");
      add.type = "button";
      add.title = "Add a recording to this track";
      add.setAttribute("aria-label", `Add recording to ${track.name}`);
      add.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>';
      add.addEventListener("click", () => requestRecordingImport(track.id));
      actions.append(add);
    }
    const mute = document.createElement("button");
    mute.type = "button";
    mute.className = track.muted ? "is-active" : "";
    mute.title = track.muted ? "Unmute track" : "Mute track";
    mute.setAttribute("aria-label", `${mute.title}: ${track.name}`);
    mute.setAttribute("aria-pressed", String(Boolean(track.muted)));
    mute.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" /><path d="m14 8 4 4m0-4-4 4" /></svg>';
    mute.addEventListener("click", (event) => {
      event.stopPropagation();
      track.muted = !track.muted;
      updateTrackGains();
      renderArrangement();
      saveState();
    });
    const solo = document.createElement("button");
    solo.type = "button";
    solo.className = track.solo ? "is-active" : "";
    solo.textContent = "S";
    solo.title = track.solo ? "Unsolo track" : "Solo track";
    solo.setAttribute("aria-label", `${solo.title}: ${track.name}`);
    solo.setAttribute("aria-pressed", String(Boolean(track.solo)));
    solo.addEventListener("click", (event) => {
      event.stopPropagation();
      track.solo = !track.solo;
      updateTrackGains();
      renderArrangement();
      saveState();
    });
    actions.append(mute, solo, makeOpenMixerButton(track));
    const volume = document.createElement("input");
    volume.className = "arrangement-volume";
    volume.type = "range";
    volume.min = "0";
    volume.max = "100";
    volume.value = String(Math.round(track.volume * 100));
    volume.setAttribute("aria-label", `${track.name} volume`);
    volume.addEventListener("input", () => {
      track.volume = Number(volume.value) / 100;
      updateTrackGains();
    });
    volume.addEventListener("change", saveState);
    return { actions, volume };
  }

  function getArrangementLoopRange() {
    const startBar = Math.max(0, Math.min(state.arrangementBars - 1, state.arrangementLoopStartBar));
    const endBar = Math.max(startBar + 1, Math.min(state.arrangementBars, state.arrangementLoopEndBar));
    return { startBar, endBar };
  }

  function updateArrangementLoopUI() {
    const ruler = $("#timeline-content").querySelector(".timeline-ruler");
    if (ruler) {
      ruler.querySelector(".arrangement-loop-range")?.remove();
      const { startBar, endBar } = getArrangementLoopRange();
      const range = document.createElement("div");
      range.className = `arrangement-loop-range${state.arrangementLoopEnabled ? "" : " is-disabled"}`;
      range.style.left = `${startBar * BAR_WIDTH}px`;
      range.style.width = `${(endBar - startBar) * BAR_WIDTH}px`;
      ruler.append(range);
    }
    const button = $("#arrangement-loop-button");
    button.textContent = `LOOP ${state.arrangementLoopEnabled ? "ON" : "OFF"}`;
    button.setAttribute("aria-pressed", String(state.arrangementLoopEnabled));
    const { startBar, endBar } = getArrangementLoopRange();
    button.title = state.arrangementLoopEnabled
      ? `Loop bars ${startBar + 1}-${Math.ceil(endBar)}; drag the ruler to change the section`
      : "Drag across the bar ruler to select a loop section";
  }

  function startArrangementLoopRangeSelection(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const ruler = event.currentTarget;
    const bounds = ruler.getBoundingClientRect();
    const pointerBar = (clientX) => Math.max(0, Math.min(state.arrangementBars, (clientX - bounds.left) / BAR_WIDTH));
    const anchorBar = pointerBar(event.clientX);
    const startX = event.clientX;
    let hasDragged = false;
    const updateRange = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 4) hasDragged = true;
      if (!hasDragged) return;
      const currentBar = pointerBar(moveEvent.clientX);
      const startBar = Math.max(0, Math.min(state.arrangementBars - 1, Math.floor(Math.min(anchorBar, currentBar))));
      const endBar = Math.max(startBar + 1,
        Math.min(state.arrangementBars, Math.ceil(Math.max(anchorBar, currentBar))));
      state.arrangementLoopStartBar = startBar;
      state.arrangementLoopEndBar = endBar;
      state.arrangementLoopEnabled = true;
      updateArrangementLoopUI();
    };
    const finish = () => {
      document.removeEventListener("pointermove", updateRange);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      if (!hasDragged) return;
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      state.arrangementCursor = state.arrangementLoopStartBar;
      updateArrangementCursorMarker();
      saveState();
    };
    document.addEventListener("pointermove", updateRange);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function startArrangementRulerInteraction(event) {
    const ruler = event.currentTarget;
    const bounds = ruler.getBoundingClientRect();
    if (event.clientY < bounds.top + bounds.height / 2) {
      startArrangementLoopRangeSelection(event);
    } else {
      startArrangementCursorDrag(event);
    }
  }

  function selectArrangementTrack(trackId) {
    state.selectedMixerTrackId = trackId;
    document.querySelectorAll(".arrangement-label[data-track-id]").forEach((label) => {
      label.classList.toggle("is-track-selected", label.dataset.trackId === trackId);
    });
    document.querySelectorAll(".mixer-track-row").forEach((row) => {
      const selected = row.dataset.trackId === trackId;
      row.classList.toggle("is-selected", selected);
      row.querySelector(".mixer-track-title")?.setAttribute("aria-pressed", String(selected));
    });
  }

  function getArrangementTrackIdFromTarget(target) {
    if (!(target instanceof Element)) return null;
    const label = target.closest(".arrangement-label[data-track-id]");
    let trackId = label?.dataset.trackId || "";
    if (!trackId) {
      const laneId = target.closest(".timeline-lane[data-track-id]")?.dataset.trackId || "";
      trackId = laneId.startsWith("pattern:")
        ? laneId.slice("pattern:".length)
        : laneId.startsWith("mel:")
          ? laneId.slice("mel:".length)
          : laneId;
    }
    const isPatternTrack = state.patternClips.some((clip) =>
      (clip.trackId || clip.patternId) === trackId);
    return state.arrangementTracks.some((track) => track.id === trackId) ||
      state.melTracks.some((track) => track.id === trackId) || isPatternTrack
      ? trackId
      : null;
  }

  function closeArrangementTrackContextMenu() {
    const menu = $("#arrangement-track-context-menu");
    menu.hidden = true;
    delete menu.dataset.trackId;
  }

  function openArrangementTrackContextMenu(event) {
    const trackId = getArrangementTrackIdFromTarget(event.target);
    if (!trackId) {
      closeArrangementTrackContextMenu();
      return;
    }
    event.preventDefault();
    const menu = $("#arrangement-track-context-menu");
    menu.dataset.trackId = trackId;
    menu.hidden = false;
    menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 8))}px`;
  }

