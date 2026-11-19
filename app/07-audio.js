  function toggleCurrentWorkspacePlayback() {
    const workspace = !state.workspaceHidden && ["sequencer", "piano-roll"].includes(state.view)
      ? state.view
      : null;
    const currentPlaybackActive = workspace
      ? Boolean(state.workspacePlayers[workspace])
      : state.isPlaying && state.playbackMode === "arrangement";
    if (currentPlaybackActive) {
      stopAllWorkspacePlayers(true);
      if (state.isPlaying) stopPlayback(false, true);
      return;
    }
    stopAllWorkspacePlayers();
    if (state.isPlaying) stopPlayback();
    if (workspace) toggleWorkspacePlayback(workspace);
    else startPlayback("arrangement");
  }

  function workspacePlaybackScheduler(workspace, playbackPlayer = state.workspacePlayers[workspace], quickAction = false) {
    const player = playbackPlayer;
    if (!player || !state.audioContext) return;
    const now = state.audioContext.currentTime;
    const lookAhead = AUDIO_SCHEDULER_LOOKAHEAD;
    while (player.nextStepTime < now + lookAhead) {
      const clockStep = player.stepIndex;
      if (workspace === "sequencer") {
        const pattern = getPattern();
        if (pattern) {
          getGridEventsForTick(pattern, clockStep).forEach(({ step, tickOffset }) => {
            const eventTick = clockStep + tickOffset;
            const swingOffset = Math.floor(eventTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0;
            const eventTime = player.nextStepTime + tickOffset * getSchedulerTickDuration();
            const displayedStep = step % getGridStepCount(pattern);
            scheduleStep(displayedStep, eventTime + swingOffset, pattern, null, false,
              quickAction ? null : player);
            if (quickAction) scheduleQuickActionStepPlayhead(displayedStep, eventTime + swingOffset, player);
          });
          schedulePatternPianoNotes(pattern, clockStep % (pattern.steps * 2), player.nextStepTime);
        }
      } else {
        scheduleWorkspaceMelLoop(player, now, lookAhead);
        if (!quickAction) updatePianoCursorFromTime(player.startTime);
      }
      if (state.metronome && state.recordingMetronomeTimer === null && clockStep % 8 === 0) {
        triggerClick(player.nextStepTime, clockStep % 32 === 0);
      }
      player.nextStepTime += getSchedulerTickDuration();
      const cycleTicks = workspace === "sequencer" ? (getPattern()?.steps || state.steps) * 2 : 32;
      player.stepIndex = (clockStep + 1) % cycleTicks;
    }
    if (quickAction && workspace === "piano-roll") {
      const loopTicks = Math.max(1, getPianoPlaybackSource().loopBars * PIANO_TICKS_PER_BAR);
      const elapsedTicks = Math.max(0, now - player.startTime) / (240 / state.bpm) * PIANO_TICKS_PER_BAR;
      setQuickActionPianoPlayhead((player.startTick + elapsedTicks) % loopTicks);
    }
  }

  function scheduleQuickActionStepPlayhead(step, time, player) {
    const displayDelay = Math.max(0, (time - state.audioContext.currentTime) * 1000);
    const timerId = window.setTimeout(() => {
      player.playheadTimers.delete(timerId);
      if (quickActionWorkspacePlayers.sequencer === player) setQuickActionStepPlayhead(step);
    }, displayDelay);
    player.playheadTimers.add(timerId);
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

  function detectAudioBeatOffset(onsets, frameRate, bpm, onsetCenterOffsetSeconds) {
    const beatFrames = frameRate * 60 / bpm;
    const analysisFrames = Math.min(onsets.length, Math.floor(frameRate * 12));
    if (!Number.isFinite(beatFrames) || beatFrames < 1 || analysisFrames < beatFrames * 4) return null;
    const averageOnset = onsets.slice(0, analysisFrames)
      .reduce((sum, value) => sum + value, 0) / analysisFrames;
    let bestPhase = 0;
    let bestScore = -Infinity;
    for (let phase = 0; phase < Math.ceil(beatFrames); phase += 1) {
      let score = 0;
      let beatCount = 0;
      for (let beat = phase; beat < analysisFrames; beat += beatFrames) {
        score += onsets[Math.min(onsets.length - 1, Math.round(beat))];
        beatCount += 1;
      }
      const averageScore = score / beatCount;
      if (averageScore > bestScore) {
        bestScore = averageScore;
        bestPhase = phase;
      }
    }
    if (bestScore <= averageOnset * 1.15) return null;
    const beatSeconds = 60 / bpm;
    const phaseSeconds = (bestPhase / frameRate + onsetCenterOffsetSeconds) % beatSeconds;
    const phaseTolerance = 2 / frameRate;
    if (phaseSeconds <= phaseTolerance || beatSeconds - phaseSeconds <= phaseTolerance) return 0;
    return Math.round(phaseSeconds * 1000) / 1000;
  }

  function detectAudioMetadata(buffer) {
    // Analyze a bounded local window; spectral flux estimates tempo and chroma estimates key.
    const stride = Math.max(1, Math.floor(buffer.sampleRate / 11025));
    const sampleRate = buffer.sampleRate / stride;
    const sampleCount = Math.min(Math.floor(buffer.length / stride), Math.floor(sampleRate * 45));
    const frameSize = 2048;
    const hopSize = 256;
    if (sampleCount < frameSize) return { bpm: null, key: null, beatOffsetSeconds: null };
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
    let beatOffsetSeconds = null;
    if (buffer.duration >= 2 && onsets.length > 12) {
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
        if (detected < 100 && detected * 2 <= 200 &&
          correlationAt(Math.round(bestLag / 2)) >= bestScore * 0.8) detected *= 2;
        bpm = roundBpm(detected);
        // Overlapping Hann-window frames make the flux peak lead the transient.
        const onsetPhaseCorrection = frameSize * 0.7 / sampleRate;
        beatOffsetSeconds = detectAudioBeatOffset(onsets, frameRate, bpm, onsetPhaseCorrection);
      }
    }
    return { bpm, key: getKeyFromChroma(chroma), beatOffsetSeconds };
  }

  function estimateAudioPitchNotes(buffer, sourceOffsetSeconds = 0, durationSeconds = buffer.duration) {
    const secondsPerBar = 240 / state.bpm;
    const sourceOffset = Math.max(0, Math.min(buffer.duration, sourceOffsetSeconds));
    const sourceDuration = Math.max(0, Math.min(buffer.duration - sourceOffset, durationSeconds));
    const analysisDuration = Math.min(sourceDuration, secondsPerBar * 8);
    const stride = Math.max(1, Math.floor(buffer.sampleRate / 22050));
    const sampleRate = buffer.sampleRate / stride;
    const sourceStartSample = Math.floor(sourceOffset * buffer.sampleRate);
    const sampleCount = Math.min(buffer.length - sourceStartSample,
      Math.ceil(analysisDuration * buffer.sampleRate));
    const frameSize = 4096;
    const hopSize = Math.max(1, Math.floor(sampleRate * 0.055));
    if (sampleCount < frameSize * stride) return [];

    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
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
    const magnitudes = new Float32Array(frameSize / 2);
    const framesByMidi = new Map();
    const frameEnd = sampleCount - frameSize * stride;

    for (let offset = 0; offset <= frameEnd; offset += hopSize * stride) {
      let frameEnergy = 0;
      for (let index = 0; index < frameSize; index += 1) {
        let sample = 0;
        const sourceIndex = sourceStartSample + offset + index * stride;
        channels.forEach((channel) => { sample += channel[sourceIndex] || 0; });
        sample /= channels.length;
        frameEnergy += sample * sample;
        real[reversedIndices[index]] = sample * window[index];
        imaginary[reversedIndices[index]] = 0;
      }
      if (frameEnergy / frameSize < 0.0000005) continue;

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

      let maximum = 0;
      for (let bin = 1; bin < frameSize / 2; bin += 1) {
        const magnitude = Math.hypot(real[bin], imaginary[bin]);
        magnitudes[bin] = magnitude;
        const frequency = bin * sampleRate / frameSize;
        if (frequency >= 55 && frequency <= 1600) maximum = Math.max(maximum, magnitude);
      }
      if (maximum < 0.001) continue;

      const candidates = [];
      for (let bin = Math.max(1, Math.floor(55 * frameSize / sampleRate));
        bin < Math.min(frameSize / 2 - 1, Math.ceil(1600 * frameSize / sampleRate)); bin += 1) {
        const magnitude = magnitudes[bin];
        if (magnitude < maximum * 0.18 || magnitude < magnitudes[bin - 1] || magnitude < magnitudes[bin + 1]) continue;
        const left = magnitudes[bin - 1];
        const right = magnitudes[bin + 1];
        const curvature = left - 2 * magnitude + right;
        const correction = curvature ? Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / curvature)) : 0;
        const frequency = (bin + correction) * sampleRate / frameSize;
        const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
        if (midi < PIANO_BOTTOM_MIDI || midi > PIANO_TOP_MIDI) continue;
        candidates.push({ midi, frequency, magnitude });
      }
      candidates.sort((left, right) => right.magnitude - left.magnitude);
      const accepted = [];
      candidates.forEach((candidate) => {
        if (accepted.some((item) => item.midi === candidate.midi)) return;
        const isHarmonic = accepted.some((item) => {
          const ratio = candidate.frequency / item.frequency;
          const harmonic = Math.round(ratio);
          return harmonic >= 2 && harmonic <= 6 &&
            Math.abs(ratio - harmonic) < 0.045 && item.magnitude >= candidate.magnitude * 0.85;
        });
        if (!isHarmonic && accepted.length < 6) accepted.push(candidate);
      });

      const frameIndex = Math.round(offset / (hopSize * stride));
      accepted.forEach(({ midi, magnitude }) => {
        if (!framesByMidi.has(midi)) framesByMidi.set(midi, []);
        framesByMidi.get(midi).push({ frameIndex, strength: magnitude / maximum });
      });
    }

    const notes = [];
    const secondsPerFrame = hopSize / sampleRate;
    framesByMidi.forEach((frames, midi) => {
      let startFrame = frames[0]?.frameIndex;
      let previousFrame = startFrame;
      let strength = 0;
      let count = 0;
      const emit = (endFrame) => {
        const startSeconds = startFrame * secondsPerFrame;
        const endSeconds = Math.min(analysisDuration, (endFrame + 1) * secondsPerFrame);
        if (endSeconds - startSeconds >= 0.075) {
          notes.push({
            midi,
            startSeconds,
            endSeconds,
            velocity: Math.max(0.35, Math.min(0.95, 0.45 + strength / Math.max(1, count) * 0.5)),
          });
        }
      };
      frames.forEach((frame, index) => {
        if (index && frame.frameIndex > previousFrame + 2) {
          emit(previousFrame);
          startFrame = frame.frameIndex;
          strength = 0;
          count = 0;
        }
        previousFrame = frame.frameIndex;
        strength += frame.strength;
        count += 1;
      });
      if (count) emit(previousFrame);
    });
    return notes.sort((left, right) => left.startSeconds - right.startSeconds || left.midi - right.midi).slice(0, 4096);
  }

  function normalizeAudioMetadata(metadata) {
    return {
      bpm: Number.isFinite(metadata?.bpm) && metadata.bpm >= 40 && metadata.bpm <= 240
        ? roundBpm(metadata.bpm) : null,
      key: typeof metadata?.key === "string" && /^[A-G]#? (major|minor)$/.test(metadata.key)
        ? metadata.key : null,
      beatOffsetSeconds: Number.isFinite(metadata?.beatOffsetSeconds) &&
        metadata.beatOffsetSeconds >= 0 && metadata.beatOffsetSeconds <= 2
        ? metadata.beatOffsetSeconds : null,
    };
  }

  function normalizeAudioAdjustment(adjustment) {
    if (!adjustment || typeof adjustment !== "object") return null;
    const tempoRatio = Number.isFinite(adjustment.tempoRatio) && adjustment.tempoRatio >= 1 / 6 &&
      adjustment.tempoRatio <= 6 ? adjustment.tempoRatio : 1;
    const keyShiftSemitones = Number.isInteger(adjustment.keyShiftSemitones) &&
      adjustment.keyShiftSemitones >= -6 && adjustment.keyShiftSemitones <= 6
      ? adjustment.keyShiftSemitones : 0;
    const isKey = (value) => typeof value === "string" && /^[A-G]#? (major|minor)$/.test(value);
    const isBpm = (value) => Number.isFinite(value) && value >= 30 && value <= 360;
    const isSourceBpm = (value) => Number.isFinite(value) && value >= 30 && value <= 360;
    if (tempoRatio === 1 && keyShiftSemitones === 0 && !isSourceBpm(adjustment.sourceBpm)) return null;
    return {
      sourceBpm: isSourceBpm(adjustment.sourceBpm) ? adjustment.sourceBpm : null,
      targetBpm: isBpm(adjustment.targetBpm) ? adjustment.targetBpm : null,
      sourceKey: isKey(adjustment.sourceKey) ? adjustment.sourceKey : null,
      targetKey: isKey(adjustment.targetKey) ? adjustment.targetKey : null,
      tempoRatio,
      keyShiftSemitones,
    };
  }

  function describeAudioMetadata(metadata) {
    const { bpm, key } = normalizeAudioMetadata(metadata);
    if (bpm === null && !key) return "Tempo and key not confidently detected";
    return `Detected ${bpm === null ? "tempo unknown" : `${bpm} BPM`} · ${key || "key unknown"}`;
  }

  function getAudioClipTempoRatio(clip) {
    if (Number.isFinite(clip.tempoRatioOverride) && clip.tempoRatioOverride > 0) {
      return clip.tempoRatioOverride;
    }
    const sourceBpm = clip.audioAdjustment?.sourceBpm ?? normalizeAudioMetadata(clip.audioMetadata).bpm;
    if (Number.isFinite(sourceBpm) && sourceBpm > 0) return state.bpm / sourceBpm;
    const ratio = clip.audioAdjustment?.tempoRatio;
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  }

  function getArrangementClipTempoRatio(clip) {
    return Number.isFinite(clip.tempoLockBpm) && clip.tempoLockBpm > 0
      ? state.bpm / clip.tempoLockBpm : 1;
  }

  function isProjectEmptyForAudioImport() {
    const hasArrangementContent = state.patternClips.length > 0 ||
      state.arrangementTracks.some((track) => track.clips.length > 0) ||
      state.melTracks.some((track) => track.clips.length > 0);
    const hasMelodicContent = state.pianoNotes.some((note) => Number.isFinite(note?.midi)) ||
      state.mels.some((mel) => Array.isArray(mel.notes) &&
        mel.notes.some((note) => Number.isFinite(note?.midi))) ||
      state.patterns.some((pattern) => Object.values(pattern.stepPianoNotes || {})
        .some((notes) => Array.isArray(notes) && notes.some((note) => Number.isFinite(note?.midi))));
    const hasAudioMetadata = state.tracks.some((track) => {
      const metadata = normalizeAudioMetadata(track.audioMetadata);
      return metadata.bpm !== null || metadata.key !== null;
    });
    return !hasArrangementContent && !hasMelodicContent && !hasAudioMetadata && !getProjectKey(false);
  }

  function getAudioClipProjectAdjustment(metadata, targetBpm = null) {
    const { bpm: detectedBpm, key } = normalizeAudioMetadata(metadata);
    const selectedTargetBpm = Number.isFinite(targetBpm) && targetBpm >= 30 && targetBpm <= 360
      ? roundBpm(targetBpm) : null;
    const tempoRatio = selectedTargetBpm && detectedBpm
      ? selectedTargetBpm / detectedBpm : 1;
    const projectKey = getProjectKey(false);
    let keyShiftSemitones = 0;
    if (key && projectKey) {
      const sourceTonic = MUSICAL_KEY_NAMES.indexOf(key.split(" ")[0]);
      const targetTonic = MUSICAL_KEY_NAMES.indexOf(projectKey.split(" ")[0]);
      if (sourceTonic >= 0 && targetTonic >= 0) {
        keyShiftSemitones = (targetTonic - sourceTonic + 12) % 12;
        if (keyShiftSemitones > 6) keyShiftSemitones -= 12;
      }
    }
    if (selectedTargetBpm === null && keyShiftSemitones === 0) return null;
    return {
      sourceBpm: detectedBpm,
      targetBpm: selectedTargetBpm,
      sourceKey: key,
      targetKey: keyShiftSemitones ? projectKey : null,
      tempoRatio,
      keyShiftSemitones,
    };
  }

  function getProjectKey(includeMasterPitch = true) {
    const chroma = Array(12).fill(0);
    const addKeyProfile = (key) => {
      const match = /^([A-G]#?) (major|minor)$/.exec(key || "");
      if (!match) return;
      const tonic = MUSICAL_KEY_NAMES.indexOf(match[1]);
      const profile = MUSICAL_KEY_PROFILES[match[2] === "major" ? 0 : 1];
      const weight = 2 / profile.reduce((sum, value) => sum + value, 0);
      profile.forEach((value, index) => { chroma[(tonic + index) % 12] += value * weight; });
    };
    const addNotes = (notes) => {
      if (!Array.isArray(notes)) return;
      notes.forEach((note) => {
        if (!Number.isFinite(note?.midi)) return;
        const weight = Math.max(0.1, (note.durationTicks || 8) / 8) *
          Math.max(0.1, Math.min(1, note.velocity ?? 0.8));
        chroma[(Math.round(note.midi) % 12 + 12) % 12] += weight;
      });
    };

    state.mels.forEach((mel) => addNotes(mel.notes));
    state.patterns.forEach((pattern) => Object.values(pattern.stepPianoNotes || {}).forEach(addNotes));
    state.tracks.forEach((track) => addKeyProfile(normalizeAudioMetadata(track.audioMetadata).key));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) =>
      addKeyProfile(clip.audioAdjustment?.targetKey || normalizeAudioMetadata(clip.audioMetadata).key)));

    const key = getKeyFromChroma(chroma);
    if (!key) return null;
    const [tonic, mode] = key.split(" ");
    const activePitch = includeMasterPitch && state.masterPitchSupported !== false ? state.masterPitch : 0;
    const shiftedTonic = (MUSICAL_KEY_NAMES.indexOf(tonic) + activePitch % 12 + 12) % 12;
    return `${MUSICAL_KEY_NAMES[shiftedTonic]} ${mode}`;
  }

  function updateProjectKeyIndicator() {
    const key = getProjectKey();
    const keyValue = $("#project-key-value");
    if (keyValue) keyValue.textContent = key ? key.replace("major", "maj").replace("minor", "min") : "—";
    const keyControl = $("#project-key-control");
    if (keyControl) keyControl.title = key ? `Detected project key: ${key}` : "Project key is unclear";
    const pitchInput = $("#master-pitch-control");
    const pitchValue = $("#master-pitch-value");
    if (pitchInput) {
      pitchInput.value = String(state.masterPitch);
      pitchInput.disabled = state.masterPitchSupported === false;
    }
    if (pitchValue) pitchValue.textContent = `${state.masterPitch > 0 ? "+" : ""}${state.masterPitch} st`;
    const dial = pitchInput?.closest(".master-pitch-dial");
    if (dial) {
      const ratio = (state.masterPitch + 12) / 24;
      dial.style.setProperty("--dj-dial-angle", `${-135 + ratio * 270}deg`);
      dial.style.setProperty("--dj-dial-fill", `${ratio * 270}deg`);
    }
    const pitch = state.masterPitchNode?.context === state.audioContext
      ? state.masterPitchNode.parameters.get("semitones")
      : null;
    if (pitch && state.audioContext) pitch.setTargetAtTime(state.masterPitch, state.audioContext.currentTime, 0.02);
  }

  function setMasterPitch(value) {
    if (state.masterPitchSupported === false) {
      showToast("Master pitch shifting is not supported in this browser.");
      updateProjectKeyIndicator();
      return;
    }
    state.masterPitch = Math.max(-12, Math.min(12, Math.round(Number(value) || 0)));
    if (state.audioContext) {
      if (state.masterPitch === 0) {
        connectMasterGainDirectly(state.audioContext);
      } else {
        connectMasterPitchProcessor(state.audioContext).catch((error) => {
          showToast(`Could not apply master pitch: ${error.message || "audio setup failed."}`);
        });
      }
    }
    updateProjectKeyIndicator();
    saveState();
  }

  function makeDrumSampleTrack(options) {
    const name = options.name?.trim() || "Imported drum";
    const track = {
      id: options.id || makeId(),
      name,
      kind: "sample",
      libraryOnly: options.libraryOnly === true,
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
    if (!track.libraryOnly) ensureSequencerTrackAudio(track);
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

  async function importDrumSamples(files, { selectFirst = false, input = drumSamplesInput } = {}) {
    if (!files.length) return;
    const imported = [];
    const failures = [];
    try {
      await ensureAudio();
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
            libraryOnly: true,
            buffer,
            audioMetadata: detectAudioMetadata(buffer),
          });
          state.tracks.push(track);
          imported.push({ track, file });
        } catch {
          failures.push(file.name);
        }
      }

      if (imported.length) {
        renderInstrumentBrowser("", true);
        if (selectFirst && $("#step-instrument-dialog").open) {
          const searchInput = $("#sound-library-search-input");
          searchInput.value = "User Samples";
          stepInstrumentPendingId = imported[0].track.id;
          renderSoundSearchSuggestions(searchInput.value);
          renderStepInstrumentLibrary(searchInput.value);
          loadLibrarySample(imported[0].track).then(() => {
            if (stepInstrumentPendingId === imported[0].track.id && $("#step-instrument-dialog").open) {
              $("#step-instrument-select").disabled = false;
            }
          }).catch((error) => showToast(error.message || `Could not load ${imported[0].track.name}.`));
        }
        saveState();
        const saves = await Promise.allSettled(imported.map(({ track, file }) => persistDrumSample(track, file)));
        const storageFailed = saves.some((result) => result.status === "rejected");
        const summary = `${imported.length} sound${imported.length === 1 ? "" : "s"} added to the library`;
        showToast(`${summary}${failures.length ? `; ${failures.length} could not be decoded` : ""}${storageFailed ? "; some couldn't be saved" : ""}.`);
      } else {
        showToast(failures.length ? `Could not import ${failures.join(", ")}.` : "Choose one or more audio files.");
      }
    } catch (error) {
      showToast(`Could not import drum sounds: ${error.message || "audio is unavailable"}`);
    } finally {
      input.value = "";
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

  function getLastArrangementTrackId() {
    const arrangedPatternIds = new Set(state.patternClips.map((clip) => clip.trackId || clip.patternId));
    const patternTrackIds = state.patterns.filter((pattern) => arrangedPatternIds.has(pattern.id))
      .map((pattern) => pattern.id);
    const currentTrackIds = new Set([
      ...patternTrackIds,
      ...state.melTracks.map((track) => track.id),
      ...state.arrangementTracks.map((track) => track.id),
    ]);
    const trackId = Array.from($("#arrangement-track-labels").children)
      .map((label) => label.dataset.trackId)
      .filter((id) => currentTrackIds.has(id))
      .at(-1);
    return trackId || [
      ...patternTrackIds,
      ...state.melTracks.map((track) => track.id),
      ...state.arrangementTracks.map((track) => track.id),
    ].at(-1) || null;
  }

  function createArrangementTrack(name = getNextArrangementTrackName(), insertAfterTrackId = getLastArrangementTrackId()) {
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
    const context = state.audioContext;
    if (track !== state.masterTrack) ensureTrackAudio(state.masterTrack);
    if (track.kind !== "mixer-master" && track.kind !== "mixer-effects") {
      state.effectTracks.forEach(ensureTrackAudio);
    }
    if (track.kind === "mel") {
      const instrument = state.tracks.find((item) => item.id === track.instrumentId);
      if (instrument && instrument !== track) ensureTrackAudio(instrument);
    }
    if (track.panNode?.context !== context) {
      track.panNode = context.createStereoPanner();
      track.panNode.pan.value = track.pan;
    }
    if (track.automationGainNode?.context !== context) {
      track.automationGainNode = context.createGain();
      track.automationGainNode.gain.value = 1;
    }
    if (track.gainNode?.context !== context) {
      track.gainNode = context.createGain();
      track.gainNode.gain.value = track.muted ? 0 : track.volume;
      updateTrackGains();
    }
    const fxRuntimeMatchesContext = track.fxRuntime?.every(({ nodes, sources }) =>
      nodes.every((node) => node.context === context) && sources.every((source) => source.context === context));
    if (!fxRuntimeMatchesContext) rebuildTrackEffectChain(track);
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
    if (track.gainNode.context !== context) {
      track.gainNode = context.createGain();
      track.gainNode.gain.value = track.muted ? 0 : track.volume;
    }
    if (track.panNode?.context !== context) {
      track.panNode = context.createStereoPanner();
      track.panNode.pan.value = track.pan;
    }
    if (track.automationGainNode?.context !== context) {
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
    ].filter(([, , gain]) => gain !== 0).map(([type, frequency, gain]) => {
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
      if (id === "sidechain") {
        const sidechainGain = context.createGain();
        output.connect(sidechainGain);
        output = sidechainGain;
        const nodes = [sidechainGain];
        if (track.effectSettings.sidechain.sourceTrackId && track.effects.sidechain > 0) {
          const detector = context.createWaveShaper();
          const curve = new Float32Array(4096);
          curve.forEach((_, index) => {
            const sample = index * 2 / (curve.length - 1) - 1;
            curve[index] = -Math.min(0.85, Math.abs(sample) * 2.5) * track.effects.sidechain / 100;
          });
          detector.curve = curve;
          const envelope = context.createBiquadFilter();
          envelope.type = "lowpass";
          envelope.frequency.value = 18;
          envelope.Q.value = Math.SQRT1_2;
          detector.connect(envelope);
          envelope.connect(sidechainGain.gain);
          track.sidechainInputNode = detector;
          nodes.push(detector, envelope);
        }
        track.fxRuntime.push({ nodes, sources: [] });
        return;
      }
      const amount = track.effects[id];
      const module = createTrackEffect(context, id, amount, track.effectSettings[id]);
      module.effectId = id;
      output.connect(module.input);
      output = module.output;
      track.fxRuntime.push(module);
    });
    track.panNode.disconnect();
    output.connect(track.automationGainNode);
    track.automationGainNode.connect(track.panNode);
    track.panNode.connect(getTrackOutputNode(track));
    rebuildMixerSidechainRouting();
  }

  function rebuildMixerSidechainRouting() {
    getMixerTracks().forEach(({ track }) => {
      if (track.sidechainSourceNode && track.sidechainInputNode) {
        try {
          track.sidechainSourceNode.disconnect(track.sidechainInputNode);
        } catch {
          // A source-chain rebuild may already have removed this connection.
        }
      }
      track.sidechainSourceNode = null;
      if (!track.sidechainInputNode) return;
      const source = getMixerTracks().find(({ track: sourceTrack }) =>
        sourceTrack.id === track.effectSettings.sidechain.sourceTrackId &&
        sourceTrack.kind !== "mixer-master" && sourceTrack.id !== track.id)?.track;
      if (!source?.gainNode) return;
      source.gainNode.connect(track.sidechainInputNode);
      track.sidechainSourceNode = source.gainNode;
    });
    getMixerTracks().forEach(({ track }) => {
      track.fxRuntime?.forEach((module) => {
        if (!module.externalInputNode) return;
        if (module.externalSourceNode) {
          try {
            module.externalSourceNode.disconnect(module.externalInputNode);
          } catch {
            // A source-chain rebuild may already have removed this connection.
          }
          module.externalSourceNode = null;
        }
        const sourceId = module.effectId === "vocoder3Band"
          ? track.effectSettings.vocoder3Band.modulatorTrackId
          : module.effectId === "crossfadeLimiter"
            ? track.effectSettings.crossfadeLimiter.sourceTrackId
            : "";
        const source = getMixerTracks().find(({ track: sourceTrack }) =>
          sourceTrack.id === sourceId && sourceTrack.kind !== "mixer-master" &&
          sourceTrack.id !== track.id)?.track;
        if (module.fallbackGain) module.fallbackGain.gain.value = source?.gainNode ? 0 : 1;
        if (!source?.gainNode) return;
        source.gainNode.connect(module.externalInputNode);
        module.externalSourceNode = source.gainNode;
      });
    });
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
    if (track.sidechainSourceNode && track.sidechainInputNode) {
      try {
        track.sidechainSourceNode.disconnect(track.sidechainInputNode);
      } catch {
        // A source-chain rebuild may already have removed this connection.
      }
    }
    track.sidechainSourceNode = null;
    track.sidechainInputNode = null;
    track.fxRuntime?.forEach((module) => {
      const { nodes, sources } = module;
      if (module.externalSourceNode && module.externalInputNode) {
        try {
          module.externalSourceNode.disconnect(module.externalInputNode);
        } catch {
          // A source-chain rebuild may already have removed this connection.
        }
      }
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

  function makeMixerMidSideBuses(context, input, nodes) {
    const splitter = context.createChannelSplitter(2);
    const midBus = context.createGain();
    const sideBus = context.createGain();
    const midLeft = context.createGain();
    const midRight = context.createGain();
    const sideLeft = context.createGain();
    const sideRight = context.createGain();
    midLeft.gain.value = midRight.gain.value = sideLeft.gain.value = 0.5;
    sideRight.gain.value = -0.5;
    input.connect(splitter);
    splitter.connect(midLeft, 0);
    splitter.connect(midRight, 1);
    splitter.connect(sideLeft, 0);
    splitter.connect(sideRight, 1);
    midLeft.connect(midBus);
    midRight.connect(midBus);
    sideLeft.connect(sideBus);
    sideRight.connect(sideBus);
    nodes.push(splitter, midBus, sideBus, midLeft, midRight, sideLeft, sideRight);
    return { midBus, sideBus };
  }

  function makeMixerMidSideOutput(context, mid, side, nodes) {
    const merger = context.createChannelMerger(2);
    const invertSide = context.createGain();
    invertSide.gain.value = -1;
    mid.connect(merger, 0, 0);
    mid.connect(merger, 0, 1);
    side.connect(merger, 0, 0);
    side.connect(invertSide);
    invertSide.connect(merger, 0, 1);
    nodes.push(merger, invertSide);
    return merger;
  }

  function addMixerFilterStages(context, source, type, frequency, order, nodes, q = Math.SQRT1_2, gain = 0) {
    let output = source;
    for (let index = 0; index < order; index += 1) {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;
      filter.gain.value = gain;
      output.connect(filter);
      output = filter;
      nodes.push(filter);
    }
    return output;
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
    let midSideAnalyser = null;
    let sideAnalyser = null;
    let externalInputNode = null;
    let fallbackGain = null;
    let tempoSyncOscillator = null;
    let tempoSyncDelay = null;
    let tempoSyncRate = 1;
    const connectWet = (node) => {
      nodes.push(node);
      input.connect(node);
      effectOutput = node;
    };

    if (id === "midSideMonitor") {
      const { midBus, sideBus } = makeMixerMidSideBuses(context, input, nodes);
      midSideAnalyser = context.createAnalyser();
      sideAnalyser = context.createAnalyser();
      midSideAnalyser.fftSize = sideAnalyser.fftSize = 1024;
      const midSilence = context.createGain();
      const sideSilence = context.createGain();
      midSilence.gain.value = sideSilence.gain.value = 0;
      midBus.connect(midSideAnalyser);
      sideBus.connect(sideAnalyser);
      midSideAnalyser.connect(midSilence);
      sideAnalyser.connect(sideSilence);
      midSilence.connect(output);
      sideSilence.connect(output);
      nodes.push(midSideAnalyser, sideAnalyser, midSilence, sideSilence);
      const through = context.createGain();
      connectWet(through);
    } else if (id === "midSidePanner" || id === "midSideFilter" || id === "midSideEq" ||
      id === "stereoEnhancer") {
      const { midBus, sideBus } = makeMixerMidSideBuses(context, input, nodes);
      let mid = midBus;
      let side = sideBus;
      if (id === "midSidePanner") {
        const sideWidth = context.createGain();
        sideWidth.gain.value = setting("width", 100) / 100;
        side.connect(sideWidth);
        side = sideWidth;
        nodes.push(sideWidth);
      } else if (id === "stereoEnhancer") {
        const sideWidth = context.createGain();
        sideWidth.gain.value = setting("width", 125) / 100;
        side = addMixerFilterStages(context, side, "highpass", setting("bassMono", 120), 1, nodes);
        side.connect(sideWidth);
        side = sideWidth;
        nodes.push(sideWidth);
      } else if (id === "midSideFilter") {
        const order = Math.max(1, Math.min(4, Math.round(setting("order", 2))));
        mid = addMixerFilterStages(context, mid, "lowpass", setting("midCutoff", 800), order, nodes);
        side = addMixerFilterStages(context, side, "highpass", setting("sideCutoff", 800), order, nodes);
      } else {
        const bands = [
          ["lowshelf", 40, "Sub"],
          ["peaking", 160, "Low"],
          ["peaking", 1000, "Mid"],
          ["peaking", 5000, "High"],
          ["highshelf", 12000, "Air"],
        ];
        bands.forEach(([type, frequency, label]) => {
          for (const [busName, bus] of [["mid", mid], ["side", side]]) {
            const filter = context.createBiquadFilter();
            filter.type = type;
            filter.frequency.value = frequency;
            filter.Q.value = Math.SQRT1_2;
            filter.gain.value = setting(`${busName}${label}`, 0);
            bus.connect(filter);
            if (busName === "mid") mid = filter;
            else side = filter;
            nodes.push(filter);
          }
        });
      }
      const stereo = makeMixerMidSideOutput(context, mid, side, nodes);
      if (id === "midSidePanner") {
        const panner = context.createStereoPanner();
        panner.pan.value = setting("pan", 0) / 100;
        stereo.connect(panner);
        nodes.push(panner);
        effectOutput = panner;
      } else effectOutput = stereo;
    } else if (id === "steepEq") {
      effectOutput = addMixerFilterStages(context, input, "peaking", setting("frequency", 1000),
        Math.max(1, Math.min(4, Math.round(setting("order", 4)))), nodes,
        setting("q", 1), setting("gain", 0) / Math.max(1, Math.min(4, Math.round(setting("order", 4)))));
    } else if (id === "crossfadeLimiter") {
      const duck = context.createGain();
      duck.gain.value = 1;
      input.connect(duck);
      const detector = context.createWaveShaper();
      const curve = new Float32Array(4096);
      const depth = setting("depth", 45) / 100;
      curve.forEach((_, index) => {
        const sample = index * 2 / (curve.length - 1) - 1;
        curve[index] = -Math.min(0.7, Math.abs(sample) * 6) * depth;
      });
      detector.curve = curve;
      const envelope = context.createBiquadFilter();
      envelope.type = "lowpass";
      envelope.frequency.value = Math.max(3, Math.min(25, 1000 / setting("release", 120)));
      detector.connect(envelope);
      envelope.connect(duck.gain);
      externalInputNode = context.createGain();
      externalInputNode.connect(detector);
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = setting("threshold", -1);
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = setting("release", 120) / 1000;
      duck.connect(limiter);
      nodes.push(duck, detector, envelope, externalInputNode, limiter);
      effectOutput = limiter;
    } else if (id === "vocoder3Band") {
      const lowCrossover = setting("lowCrossover", 300);
      const highCrossover = Math.max(lowCrossover + 100, setting("highCrossover", 3000));
      const release = setting("envelopeRelease", 80);
      const modulatorInput = context.createGain();
      const modulatorSplit = context.createChannelSplitter(2);
      modulatorInput.connect(modulatorSplit);
      externalInputNode = modulatorInput;
      const sum = context.createGain();
      fallbackGain = context.createGain();
      fallbackGain.gain.value = settings.modulatorTrackId ? 0 : 1;
      input.connect(fallbackGain);
      fallbackGain.connect(sum);
      const makeBand = (source, band, carrier) => {
        let output = source;
        const order = band === "mid" ? 2 : 1;
        if (band !== "low") {
          output = addMixerFilterStages(context, output, "highpass", lowCrossover, order, nodes);
        }
        if (band !== "high") {
          output = addMixerFilterStages(context, output, "lowpass",
            band === "low" ? lowCrossover : highCrossover, order, nodes);
        }
        if (!carrier) {
          const rectifier = context.createWaveShaper();
          const curve = new Float32Array(1024);
          curve.forEach((_, index) => {
            const sample = index * 2 / (curve.length - 1) - 1;
            curve[index] = Math.abs(sample);
          });
          rectifier.curve = curve;
          const envelope = context.createBiquadFilter();
          envelope.type = "lowpass";
          envelope.frequency.value = Math.max(2, Math.min(20, 1000 / (release * 2)));
          envelope.Q.value = Math.SQRT1_2;
          const envelopeGain = context.createGain();
          envelopeGain.gain.value = 2.5;
          output.connect(rectifier);
          rectifier.connect(envelope);
          envelope.connect(envelopeGain);
          const carrierGain = context.createGain();
          carrierGain.gain.value = 0;
          envelopeGain.connect(carrierGain.gain);
          nodes.push(rectifier, envelope, envelopeGain, carrierGain);
          return { carrierGain };
        }
        const carrierGain = context.createGain();
        output.connect(carrierGain);
        nodes.push(carrierGain);
        return { output: carrierGain };
      };
      const modulatorMono = context.createGain();
      const modulatorLeft = context.createGain();
      const modulatorRight = context.createGain();
      modulatorLeft.gain.value = modulatorRight.gain.value = 0.5;
      modulatorSplit.connect(modulatorLeft, 0);
      modulatorSplit.connect(modulatorRight, 1);
      modulatorLeft.connect(modulatorMono);
      modulatorRight.connect(modulatorMono);
      ["low", "mid", "high"].forEach((band) => {
        const detector = makeBand(modulatorMono, band, false);
        let carrier = input;
        if (band !== "low") carrier = addMixerFilterStages(context, carrier, "highpass", lowCrossover, band === "mid" ? 2 : 1, nodes);
        if (band !== "high") carrier = addMixerFilterStages(context, carrier, "lowpass",
          band === "low" ? lowCrossover : highCrossover, band === "mid" ? 2 : 1, nodes);
        carrier.connect(detector.carrierGain);
        detector.carrierGain.connect(sum);
      });
      nodes.push(modulatorInput, modulatorSplit, modulatorMono, modulatorLeft, modulatorRight, sum, fallbackGain);
      effectOutput = sum;
    } else if (["reverb", "room", "hall", "plate"].includes(id)) {
      const convolver = context.createConvolver();
      const decay = setting("decay", id === "hall" ? 3.2 : id === "room" ? 0.7 : id === "plate" ? 2.2 : 1.8);
      const impulse = context.createBuffer(2, Math.floor(context.sampleRate * decay), context.sampleRate);
      const random = createSeededRandom(0x51f15e);
      const decayCurve = id === "room" ? 3.8 : id === "plate" ? 1.7 : 2.8;
      for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const samples = impulse.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          const earlyReflection = id === "plate" && index < context.sampleRate * 0.012 ? 1.7 : 1;
          samples[index] = (random() * 2 - 1) * earlyReflection *
            Math.pow(1 - index / samples.length, decayCurve);
        }
      }
      convolver.buffer = impulse;
      const preDelay = context.createDelay(0.13);
      preDelay.delayTime.value = setting("preDelay", id === "hall" ? 35 : id === "room" ? 8 : id === "plate" ? 15 : 20) / 1000;
      input.connect(preDelay);
      preDelay.connect(convolver);
      nodes.push(preDelay, convolver);
      effectOutput = convolver;
    } else if (["dragonflyHall", "dragonflyRoom", "dragonflyPlate", "dragonflyEarly"].includes(id)) {
      const convolver = context.createConvolver();
      const preDelay = context.createDelay(0.12);
      const lowPass = context.createBiquadFilter();
      const highPass = context.createBiquadFilter();
      const presetIndex = setting("preset", id === "dragonflyPlate" ? 1 : id === "dragonflyRoom" ? 6 : 11);
      const decay = id === "dragonflyEarly"
        ? 0.15
        : setting("decay", id === "dragonflyPlate" ? 0.4 : id === "dragonflyRoom" ? 0.4 : 1.3);
      const predelay = id === "dragonflyEarly"
        ? 0.003
        : setting("predelay", 0) / 1000;
      const size = setting("size", id === "dragonflyEarly" ? 20 : 24);
      const width = setting("width", 100) / 100;
      const lowCut = setting("lowCut", 4);
      const highCut = id === "dragonflyEarly"
        ? setting("highCut", 10000)
        : setting("highCut", id === "dragonflyPlate" ? 16000 : 7600);
      const impulseLength = Math.max(2048, Math.floor(context.sampleRate * Math.max(0.12, decay * (id === "dragonflyEarly" ? 1 : 1.8))));
      const impulse = context.createBuffer(2, impulseLength, context.sampleRate);
      const random = createSeededRandom(0x44524659 + presetIndex * 101 + impulseLength);
      for (let channel = 0; channel < 2; channel += 1) {
        const samples = impulse.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          const age = index / context.sampleRate;
          const earlyWindow = Math.exp(-age * (id === "dragonflyEarly" ? 16 : 4));
          const lateWindow = Math.exp(-age / Math.max(0.08, decay * (0.8 + size / 60)));
          const density = 0.45 + width * 0.55;
          const diffuse = (random() * 2 - 1) * lateWindow * density +
            (id === "dragonflyEarly" ? random() * earlyWindow * 0.5 : 0);
          samples[index] = diffuse * earlyWindow;
        }
      }
      convolver.buffer = impulse;
      preDelay.delayTime.value = predelay;
      lowPass.type = "lowpass";
      lowPass.frequency.value = highCut;
      highPass.type = "highpass";
      highPass.frequency.value = Math.max(20, lowCut);
      input.connect(preDelay);
      preDelay.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(convolver);
      nodes.push(convolver, preDelay, lowPass, highPass);
      effectOutput = convolver;
    } else if (id === "time12") {
      const delay = context.createDelay(2);
      const oscillator = context.createOscillator();
      const shaper = context.createWaveShaper();
      const depth = context.createGain();
      const feedbackFilter = context.createBiquadFilter();
      const feedback = context.createGain();
      const time12TempoRate = setting("rate", 1);
      const pattern = Array.isArray(settings.pattern) && settings.pattern.length
        ? settings.pattern
        : [{ x: 0, y: 0.2 }, { x: 0.25, y: 0.9 }, { x: 0.5, y: 0.15 }, { x: 0.75, y: 0.65 }, { x: 1, y: 0.2 }];
      const points = [...pattern].sort((a, b) => a.x - b.x);
      const smooth = setting("smooth", 35) / 100;
      const curve = new Float32Array(4096);
      for (let index = 0; index < curve.length; index += 1) {
        const x = index / (curve.length - 1);
        let left = points[0];
        let right = points.at(-1);
        for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex += 1) {
          if (x >= points[pointIndex].x && x <= points[pointIndex + 1].x) {
            left = points[pointIndex];
            right = points[pointIndex + 1];
            break;
          }
        }
        const span = Math.max(0.000001, right.x - left.x);
        const raw = (x - left.x) / span;
        const eased = smooth > 0
          ? raw * raw * (3 - 2 * raw) * smooth + raw * (1 - smooth)
          : raw;
        curve[index] = left.y + (right.y - left.y) * eased;
      }
      shaper.curve = curve;
      shaper.oversample = "2x";
      oscillator.type = "sine";
      oscillator.frequency.value = Math.max(0.05, state.bpm / 60 * time12TempoRate);
      delay.delayTime.value = 0.02;
      depth.gain.value = setting("depth", 75) / 100 * 1.48;
      feedbackFilter.type = "lowpass";
      feedbackFilter.frequency.value = 8000;
      feedback.gain.value = 0.18;
      oscillator.connect(shaper);
      shaper.connect(depth);
      depth.connect(delay.delayTime);
      input.connect(delay);
      delay.connect(feedbackFilter);
      feedbackFilter.connect(feedback);
      feedback.connect(delay);
      effectOutput = delay;
      nodes.push(delay, shaper, depth, feedbackFilter, feedback);
      sources.push(oscillator);
      tempoSyncOscillator = oscillator;
      tempoSyncDelay = delay;
      tempoSyncRate = time12TempoRate;
      oscillator.start();
    } else if (id === "grossBeat") {
      const delay = context.createDelay(2);
      const feedbackFilter = context.createBiquadFilter();
      const feedback = context.createGain();
      tempoSyncRate = setting("rate", 1);
      const beatRate = Math.max(0.05, state.bpm / 60 * tempoSyncRate);
      const gateDepth = setting("gate", 55) / 100 * mix;
      delay.delayTime.value = Math.max(0.02, Math.min(2, 60 / state.bpm / setting("rate", 1)));
      tempoSyncDelay = delay;
      feedbackFilter.type = "lowpass";
      feedbackFilter.frequency.value = 6500;
      feedback.gain.value = Math.max(0, Math.min(0.8, setting("feedback", 35) / 100));
      input.connect(delay);
      delay.connect(feedbackFilter);
      feedbackFilter.connect(feedback);
      feedback.connect(delay);
      effectOutput = delay;
      output.gain.value = 1 - gateDepth / 2;
      if (gateDepth > 0) {
        const oscillator = context.createOscillator();
        const gate = context.createWaveShaper();
        const depth = context.createGain();
        const curve = new Float32Array(256);
        curve.forEach((_, index) => {
          curve[index] = index / (curve.length - 1) < 0.5 ? -1 : 1;
        });
        oscillator.frequency.value = beatRate;
        tempoSyncOscillator = oscillator;
        gate.curve = curve;
        depth.gain.value = gateDepth / 2;
        oscillator.connect(gate);
        gate.connect(depth);
        depth.connect(output.gain);
        oscillator.start();
        sources.push(oscillator);
        nodes.push(gate, depth);
      }
      nodes.push(delay, feedbackFilter, feedback);
    } else if (id === "delayBank") {
      const splitter = context.createChannelSplitter(2);
      const merger = context.createChannelMerger(2);
      const baseTime = setting("time", 0.24);
      const feedbackAmount = Math.max(0, Math.min(0.78, setting("feedback", 34) / 100));
      const spread = setting("spread", 65) / 100;
      const tapTimes = [1, 1.5, 2, 3];
      const tapLevels = [0.48, 0.36, 0.27, 0.2];
      input.connect(splitter);
      tapTimes.forEach((tapTime, tapIndex) => {
        for (let channel = 0; channel < 2; channel += 1) {
          const delay = context.createDelay(3.1);
          const tap = context.createGain();
          const feedback = context.createGain();
          const damping = context.createBiquadFilter();
          const sideOffset = channel === 0 ? 1 - spread * 0.25 : 1 + spread * 0.25;
          delay.delayTime.value = Math.min(3, baseTime * tapTime * sideOffset);
          tap.gain.value = tapLevels[tapIndex] * (1 - tapIndex * 0.08);
          feedback.gain.value = feedbackAmount;
          damping.type = "lowpass";
          damping.frequency.value = 7000 - tapIndex * 900;
          splitter.connect(delay, channel);
          delay.connect(tap);
          tap.connect(merger, 0, channel);
          delay.connect(damping);
          damping.connect(feedback);
          feedback.connect(delay);
          nodes.push(delay, tap, feedback, damping);
        }
      });
      nodes.push(splitter, merger);
      effectOutput = merger;
    } else if (id === "pingPong") {
      const splitter = context.createChannelSplitter(2);
      const merger = context.createChannelMerger(2);
      const leftDelay = context.createDelay(1);
      const rightDelay = context.createDelay(1);
      const leftFeedback = context.createGain();
      const rightFeedback = context.createGain();
      const delayTime = setting("time", 0.32);
      leftDelay.delayTime.value = delayTime;
      rightDelay.delayTime.value = delayTime;
      leftFeedback.gain.value = rightFeedback.gain.value = setting("feedback", 45) / 100;
      input.connect(splitter);
      splitter.connect(leftDelay, 0);
      splitter.connect(rightDelay, 1);
      leftDelay.connect(rightFeedback);
      rightFeedback.connect(rightDelay);
      rightDelay.connect(leftFeedback);
      leftFeedback.connect(leftDelay);
      leftDelay.connect(merger, 0, 0);
      rightDelay.connect(merger, 0, 1);
      nodes.push(splitter, merger, leftDelay, rightDelay, leftFeedback, rightFeedback);
      effectOutput = merger;
    } else if (["delay", "slapback", "tapeDelay"].includes(id)) {
      const delay = context.createDelay(1);
      const defaultTime = id === "slapback" ? 0.11 : id === "tapeDelay" ? 0.36 : 0.28;
      delay.delayTime.value = setting("time", defaultTime);
      const feedback = context.createGain();
      feedback.gain.value = setting("feedback", id === "slapback" ? 18 : id === "tapeDelay" ? 48 : 42) / 100;
      if (id === "tapeDelay") {
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 4200;
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        input.connect(delay);
        nodes.push(filter, feedback, delay);
        effectOutput = filter;
      } else {
        delay.connect(feedback);
        feedback.connect(delay);
        nodes.push(feedback);
        connectWet(delay);
      }
    } else if (id === "chorus" || id === "flanger" || id === "vibrato" ||
      id === "pitchShifter" || id === "harmonizer") {
      const delay = context.createDelay(0.5);
      const modulation = context.createOscillator();
      const depth = context.createGain();
      const interval = id === "pitchShifter" ? Math.abs(setting("semitones", 0)) : setting("interval", 7);
      delay.delayTime.value = id === "flanger" ? 0.005 : id === "vibrato" ? 0.02
        : id === "chorus" ? setting("depth", 12) / 1000 : 0.035 + interval * 0.006;
      modulation.frequency.value = id === "chorus" ? setting("rate", 0.28)
        : id === "flanger" || id === "vibrato" ? setting("rate", id === "vibrato" ? 5 : 0.22)
          : id === "harmonizer" ? 0.7 : 0.45;
      depth.gain.value = id === "chorus" ? setting("depth", 12) / 1000
        : id === "flanger" ? setting("depth", 3) / 1000 * mix
          : id === "vibrato" ? setting("depth", 5) / 1000 * mix : 0.035 * mix;
      modulation.connect(depth);
      depth.connect(delay.delayTime);
      modulation.start();
      sources.push(modulation);
      nodes.push(depth);
      if (id === "flanger") {
        const feedback = context.createGain();
        feedback.gain.value = setting("feedback", 20) / 100;
        delay.connect(feedback);
        feedback.connect(delay);
        nodes.push(feedback);
      }
      connectWet(delay);
    } else if (id === "guitarDistortion" || id === "bloodOverdrive") {
      const drive = setting("drive", id === "guitarDistortion" ? 8 : 10);
      const tone = context.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = setting("tone", id === "guitarDistortion" ? 4200 : 5200);
      const shaper = context.createWaveShaper();
      const curve = new Float32Array(4096);
      const bias = id === "bloodOverdrive" ? setting("bias", 0.08) : 0;
      const normalization = Math.tanh((1 + Math.abs(bias)) * drive);
      curve.forEach((_, index) => {
        const sample = index * 2 / (curve.length - 1) - 1;
        curve[index] = Math.tanh((sample + bias) * drive) / normalization;
      });
      shaper.curve = curve;
      shaper.oversample = "4x";
      const outputLevel = context.createGain();
      outputLevel.gain.value = Math.pow(10, setting("level", id === "guitarDistortion" ? -6 : -8) / 20);
      let processorInput = input;
      if (id === "guitarDistortion") {
        const lowCut = context.createBiquadFilter();
        lowCut.type = "highpass";
        lowCut.frequency.value = 70;
        processorInput.connect(lowCut);
        processorInput = lowCut;
        nodes.push(lowCut);
      }
      processorInput.connect(shaper);
      shaper.connect(tone);
      if (id === "bloodOverdrive") {
        const dcFilter = context.createBiquadFilter();
        dcFilter.type = "highpass";
        dcFilter.frequency.value = 24;
        tone.connect(dcFilter);
        dcFilter.connect(outputLevel);
        nodes.push(dcFilter);
      } else {
        tone.connect(outputLevel);
      }
      nodes.push(shaper, tone, outputLevel);
      effectOutput = outputLevel;
    } else if (id === "gain") {
      const gain = context.createGain();
      gain.gain.value = Math.pow(10, setting("gainDb", 6) / 20);
      connectWet(gain);
    } else if (id === "distortion" || id === "saturator" || id === "softClipper" || id === "bitcrusher") {
      const shaper = context.createWaveShaper();
      const curve = new Float32Array(4096);
      const drive = setting("drive", id === "saturator" ? 3 : id === "softClipper" ? 2 : 8);
      const levels = Math.pow(2, setting("bits", 8));
      for (let index = 0; index < curve.length; index += 1) {
        const sample = index * 2 / (curve.length - 1) - 1;
        curve[index] = id === "bitcrusher"
          ? Math.round(sample * levels) / levels
          : id === "softClipper"
            ? sample * drive / (1 + Math.abs(sample * drive))
            : Math.tanh(sample * drive);
      }
      shaper.curve = curve;
      shaper.oversample = "4x";
      connectWet(shaper);
    } else if (id === "multibandCompressor") {
      const lowCrossover = setting("lowCrossover", 180);
      const highCrossover = Math.max(lowCrossover + 100, setting("highCrossover", 3500));
      const attack = setting("attack", 10) / 1000;
      const release = setting("release", 180) / 1000;
      const sum = context.createGain();
      const configureFilter = (filter, type, frequency) => {
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = Math.SQRT1_2;
        nodes.push(filter);
      };
      const connectBand = (filters, thresholdKey, ratioKey, gainKey) => {
        let previous = input;
        filters.forEach(([type, frequency]) => {
          const filter = context.createBiquadFilter();
          configureFilter(filter, type, frequency);
          previous.connect(filter);
          previous = filter;
        });
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = setting(thresholdKey, -18);
        compressor.knee.value = 6;
        compressor.ratio.value = setting(ratioKey, 3);
        compressor.attack.value = attack;
        compressor.release.value = release;
        const makeup = context.createGain();
        makeup.gain.value = Math.pow(10, setting(gainKey, 0) / 20);
        previous.connect(compressor);
        compressor.connect(makeup);
        makeup.connect(sum);
        nodes.push(compressor, makeup);
      };
      connectBand([["lowpass", lowCrossover], ["lowpass", lowCrossover]],
        "lowThreshold", "lowRatio", "lowGain");
      connectBand([
        ["highpass", lowCrossover], ["highpass", lowCrossover],
        ["lowpass", highCrossover], ["lowpass", highCrossover],
      ],
        "midThreshold", "midRatio", "midGain");
      connectBand([["highpass", highCrossover], ["highpass", highCrossover]],
        "highThreshold", "highRatio", "highGain");
      nodes.push(sum);
      effectOutput = sum;
    } else if (id === "compressor" || id === "limiter" || id === "noiseGate" || id === "transientShaper") {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = id === "noiseGate" ? setting("threshold", -42)
        : id === "limiter" ? setting("threshold", -1)
          : id === "transientShaper" ? -18 - setting("attack", 3)
            : setting("threshold", -18);
      compressor.knee.value = id === "noiseGate" || id === "limiter" ? 0 : 12;
      compressor.ratio.value = id === "noiseGate" || id === "limiter" ? 20
        : id === "transientShaper" ? Math.max(1, 5 + setting("sustain", -2) / 3)
          : setting("ratio", 4);
      compressor.attack.value = id === "transientShaper" ? 0.003 : id === "limiter" ? 0.001 : setting("attack", 3) / 1000;
      compressor.release.value = id === "transientShaper" ? 0.08 : setting("release", id === "limiter" ? 80 : 180) / 1000;
      connectWet(compressor);
    } else if (id === "tremolo" || id === "lfoGain") {
      const tremolo = context.createGain();
      tremolo.gain.value = id === "lfoGain" ? 0.5 : 0.55;
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", id === "lfoGain" ? 2 : 5);
      depth.gain.value = setting("depth", id === "lfoGain" ? 50 : 45) / (id === "lfoGain" ? 200 : 100) * mix;
      oscillator.connect(depth);
      depth.connect(tremolo.gain);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(tremolo);
    } else if (id === "autoFilter") {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 5000;
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 0.4);
      depth.gain.value = setting("depth", 2200) * mix;
      oscillator.connect(depth);
      depth.connect(filter.frequency);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(filter);
    } else if (id === "autopan" || id === "panOMatic") {
      const panner = context.createStereoPanner();
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      const rate = setting("rate", 0.35);
      oscillator.frequency.value = rate;
      depth.gain.value = setting("depth", 100) / 100 * mix;
      oscillator.connect(depth);
      depth.connect(panner.pan);
      oscillator.start(context.currentTime, id === "panOMatic" ? setting("phase", 0) / 360 / rate : 0);
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
    return {
      input, output, nodes, sources, dry, wet,
      midSideAnalyser, sideAnalyser, externalInputNode, externalSourceNode: null, fallbackGain,
      tempoSyncOscillator, tempoSyncDelay, tempoSyncRate,
    };
  }

  function updateMixerTempoEffects() {
    const now = state.audioContext?.currentTime || 0;
    getMixerTracks().forEach(({ track }) => {
      track.fxRuntime?.forEach((module) => {
        if (!["grossBeat", "time12"].includes(module.effectId)) return;
        const beatRate = Math.max(0.05, state.bpm / 60 * module.tempoSyncRate);
        module.tempoSyncOscillator?.frequency.setTargetAtTime(beatRate, now, 0.02);
        if (module.effectId === "time12") return;
        module.tempoSyncDelay?.delayTime.setTargetAtTime(
          Math.max(0.02, Math.min(2, 60 / state.bpm / module.tempoSyncRate)), now, 0.02,
        );
      });
    });
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
    const tempoRatio = getArrangementClipTempoRatio(clip);
    if (type === "pattern") {
      const durationBars = Number.isFinite(clip.durationBars)
        ? clip.durationBars
        : (getPattern(clip.patternId)?.steps || 16) / 16 * (clip.repeatCount || 1);
      return durationBars * tempoRatio;
    }
    if (type === "mel") {
      if (Number.isFinite(clip.durationBars)) return clip.durationBars * tempoRatio;
      const mel = getMel(clip.melId);
      return (mel ? getMelLengthBars(mel) : 1) * tempoRatio;
    }
    const audioTempoRatio = getAudioClipTempoRatio(clip);
    return Number.isFinite(clip.durationSeconds)
      ? clip.durationSeconds / audioTempoRatio / (240 / state.bpm)
      : clip.buffer.duration / audioTempoRatio / (240 / state.bpm);
  }

  function getArrangementClipRepeatLength(type, clip) {
    const tempoRatio = getArrangementClipTempoRatio(clip);
    if (type === "pattern") {
      return (Number.isFinite(clip.repeatLengthBars) && clip.repeatLengthBars > 0
        ? clip.repeatLengthBars : (getPattern(clip.patternId)?.steps || 16) / 16) * tempoRatio;
    }
    if (type === "mel") {
      return (Number.isFinite(clip.repeatLengthBars) && clip.repeatLengthBars > 0
        ? clip.repeatLengthBars : getMelLengthBars(getMel(clip.melId) || { bars: 1, notes: [] })) * tempoRatio;
    }
    return Math.max(0.01, Number.isFinite(clip.repeatLengthSeconds) && clip.repeatLengthSeconds > 0
      ? clip.repeatLengthSeconds / getAudioClipTempoRatio(clip)
      : clip.buffer.duration / getAudioClipTempoRatio(clip)) / (240 / state.bpm);
  }

  function getArrangementClipRepeatPhaseBars(type, clip) {
    const tempoRatio = getArrangementClipTempoRatio(clip);
    if (type === "audio") {
      const sourceOffset = clip.sourceOffsetSeconds || 0;
      const repeatStart = clip.repeatStartSeconds;
      const repeatLength = clip.repeatLengthSeconds;
      if (Number.isFinite(repeatStart) && Number.isFinite(repeatLength) && repeatLength > 0) {
        return (((sourceOffset - repeatStart) % repeatLength + repeatLength) % repeatLength) /
          ((240 / state.bpm) * getAudioClipTempoRatio(clip));
      }
      return sourceOffset / ((240 / state.bpm) * getAudioClipTempoRatio(clip));
    }
    const sourceOffset = clip.sourceOffsetBars || 0;
    const repeatStart = clip.repeatStartBars;
    const repeatLength = clip.repeatLengthBars;
    if (Number.isFinite(repeatStart) && Number.isFinite(repeatLength) && repeatLength > 0) {
      return (((sourceOffset - repeatStart) % repeatLength + repeatLength) % repeatLength) * tempoRatio;
    }
    return sourceOffset * tempoRatio;
  }

  function getArrangementPatternStepEvents(clip, pattern, fromElapsed = 0, toElapsed = Infinity) {
    const stepsPerBar = getStepsPerBar(pattern);
    const patternBars = pattern.steps / 16;
    const tempoScale = getArrangementClipTempoRatio(clip);
    const sourceDuration = getArrangementClipDuration("pattern", clip) / tempoScale;
    const windows = getArrangementClipSourceWindows(
      patternBars,
      clip.sourceOffsetBars || 0,
      clip.repeatCount,
      sourceDuration,
      clip.repeatStartBars,
      clip.repeatLengthBars,
      fromElapsed,
      toElapsed,
    );
    const gridStepCount = getGridStepCount(pattern);
    const ticksPerGridStep = getGridTicksPerStep(pattern);
    const events = [];
    windows.forEach((window) => {
      const firstStep = Math.max(0, Math.ceil(window.sourceOffset * stepsPerBar - 0.0001));
      const lastStep = Math.ceil((window.sourceOffset + window.duration) * stepsPerBar - 0.0001);
      for (let sourceStep = firstStep; sourceStep < lastStep; sourceStep += 1) {
        const sourcePosition = sourceStep / stepsPerBar;
        if (sourcePosition < window.sourceOffset - 0.0001) continue;
        events.push({
          patternStep: sourceStep % gridStepCount,
          tick: (sourceStep % gridStepCount) * ticksPerGridStep,
          elapsedSource: window.elapsedSource + sourcePosition - window.sourceOffset,
        });
      }
    });
    return events;
  }

  function getAudioClipSegments(clip, fromBar = clip.startBar, toBar = Infinity) {
    const secondsPerBar = 240 / state.bpm;
    const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
    const sourceDuration = Math.max(0, clip.buffer.duration);
    const tempoRatio = getAudioClipTempoRatio(clip);
    const segments = [];
    if (!sourceDuration) return segments;
    const clipSourceDuration = Number.isFinite(clip.durationSeconds) ? clip.durationSeconds : sourceDuration;
    const sourceWindows = getArrangementClipSourceWindows(
      sourceDuration,
      sourceOffset,
      clip.repeatCount,
      clipSourceDuration,
      clip.repeatStartSeconds,
      clip.repeatLengthSeconds,
    );
    sourceWindows.forEach((window) => {
      const segmentStart = clip.startBar + window.elapsedSource / (secondsPerBar * tempoRatio);
      const segmentDuration = window.duration;
      const segmentEnd = segmentStart + segmentDuration / (secondsPerBar * tempoRatio);
      if (segmentEnd > fromBar && segmentStart < toBar) {
        const audibleStart = Math.max(segmentStart, fromBar);
        const audibleEnd = Math.min(segmentEnd, toBar);
        segments.push({
          startBar: audibleStart,
          sourceOffsetSeconds: window.sourceOffset + (audibleStart - segmentStart) * secondsPerBar * tempoRatio,
          durationSeconds: (audibleEnd - audibleStart) * secondsPerBar * tempoRatio,
          loopIndex: window.index,
        });
      }
    });
    return segments;
  }

  function getMelClipNoteEvents(mel, clip) {
    const melBars = getMelLengthBars(mel);
    const sourceOffset = clip.sourceOffsetBars || 0;
    const tempoRatio = getArrangementClipTempoRatio(clip);
    const sourceWindows = getArrangementClipSourceWindows(
      melBars,
      sourceOffset,
      clip.repeatCount,
      getArrangementClipDuration("mel", clip) / tempoRatio,
      clip.repeatStartBars,
      clip.repeatLengthBars,
    );
    const events = [];
    sourceWindows.forEach((window) => mel.notes.forEach((note) => {
      const noteStart = note.startTick / PIANO_TICKS_PER_BAR;
      const noteEnd = noteStart + note.durationTicks / PIANO_TICKS_PER_BAR;
      const audibleStart = Math.max(window.sourceOffset, noteStart);
      const audibleEnd = Math.min(window.sourceOffset + window.duration, noteEnd);
      if (audibleEnd <= audibleStart) return;
      const elapsedSource = window.elapsedSource + audibleStart - window.sourceOffset;
      events.push({
        note,
        loop: window.index,
        startBar: clip.startBar + elapsedSource * tempoRatio,
        endBar: clip.startBar + (elapsedSource + audibleEnd - audibleStart) * tempoRatio,
      });
    }));
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
      syncQuickMixerControls(track);
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
      : "Drag across the bar ruler to select a section; turn looping on with this button";
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
    delete menu.dataset.assetType;
    delete menu.dataset.assetId;
    delete menu.dataset.clipTrackId;
    delete menu.dataset.clipId;
    $("#arrangement-audio-piano-options").replaceChildren();
    $("#arrangement-audio-piano-options").hidden = true;
    $("#arrangement-segment-options").replaceChildren();
    $("#arrangement-segment-options").hidden = true;
    $("#rename-arrangement-asset").hidden = true;
    $("#branch-arrangement-asset").hidden = true;
  }

  function openArrangementTrackContextMenu(event) {
    const trackId = getArrangementTrackIdFromTarget(event.target);
    if (!trackId) {
      closeArrangementTrackContextMenu();
      return;
    }
    event.preventDefault();
    const menu = $("#arrangement-track-context-menu");
    const audioOptions = $("#arrangement-audio-piano-options");
    const segmentOptions = $("#arrangement-segment-options");
    audioOptions.replaceChildren();
    segmentOptions.replaceChildren();
    const audioTrack = state.arrangementTracks.find((track) => track.id === trackId);
    const targetElement = event.target instanceof Element ? event.target : null;
    const targetedClip = targetElement?.closest("[data-selectable-type][data-clip-id]");
    const targetedClipId = targetedClip?.dataset.clipId || null;
    const clips = audioTrack
      ? audioTrack.clips.filter((clip) => !targetedClipId || clip.id === targetedClipId)
      : [];
    clips.forEach((clip) => {
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "menuitem");
      option.dataset.clipId = clip.id;
      option.textContent = `Open ${clip.name} in Piano Roll`;
      option.title = `Transcribe and edit ${clip.name} in the Piano Roll`;
      audioOptions.append(option);
    });
    audioOptions.hidden = clips.length === 0;
    const targetType = targetedClip?.dataset.selectableType;
    const targetAsset = targetType === "audio"
      ? audioTrack?.clips.find((clip) => clip.id === targetedClipId)
      : targetType === "mel"
        ? state.melTracks.flatMap((track) => track.clips).find((clip) => clip.id === targetedClipId)
        : targetType === "pattern"
          ? state.patternClips.find((clip) => clip.id === targetedClipId)
          : null;
    const assetType = targetType || "";
    const assetId = assetType === "audio" ? targetAsset?.id
      : assetType === "mel" ? targetAsset?.melId
        : assetType === "pattern" ? targetAsset?.patternId : "";
    const asset = assetId ? getArrangementAsset(assetType, assetId) : null;
    const hasSegment = Boolean(asset?.segmentSourceMelId || asset?.segmentSourcePatternId ||
      asset?.segmentSourceAssetId || targetAsset?.sourceAssetId || targetAsset?.segmentSourceAssetId);
    $("#rename-arrangement-asset").hidden = !asset;
    $("#branch-arrangement-asset").hidden = !asset;
    if (asset) {
      menu.dataset.assetType = assetType;
      menu.dataset.assetId = asset.id;
      menu.dataset.clipTrackId = audioTrack?.id || "";
      menu.dataset.clipId = targetedClipId || "";
    }
    if (hasSegment) {
      const sourceId = asset.segmentSourceMelId || asset.segmentSourcePatternId ||
        asset.segmentSourceAssetId || targetAsset?.sourceAssetId || targetAsset?.segmentSourceAssetId;
      const addOption = (label, id) => {
        const option = document.createElement("button");
        option.type = "button";
        option.setAttribute("role", "menuitem");
        option.dataset.assetType = assetType;
        option.dataset.assetId = id;
        option.textContent = label;
        segmentOptions.append(option);
      };
      if (assetType === "audio") {
        const source = getArrangementAsset(assetType, sourceId);
        if (source) addOption(`Open ${source.name} - Source in Piano Roll`, source.id);
      } else {
        const source = getArrangementAsset(assetType, sourceId);
        const editor = assetType === "mel" ? "Piano Roll" : "Grid";
        addOption(`Open ${asset.name} in ${editor}`, asset.id);
        if (source) addOption(`Open ${source.name} - Source in ${editor}`, source.id);
      }
      segmentOptions.hidden = false;
    }
    menu.dataset.trackId = trackId;
    menu.hidden = false;
    menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 8))}px`;
  }

