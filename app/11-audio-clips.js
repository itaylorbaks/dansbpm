  let arrangementSliceMode = false;
  const reversedAudioClipBuffers = new WeakMap();
  const stretchedAudioClipBuffers = new WeakMap();
  const audioClipStemSeparations = new Map();
  let audioStretchModulePromise = null;

  function normalizeAudioStemSelection(selection) {
    return {
      melody: selection?.melody !== false,
      vocals: selection?.vocals !== false,
      percussion: selection?.percussion !== false,
      bass: selection?.bass !== false,
    };
  }

  function getAudioClipStemGroup(clip) {
    if (!clip.audioStemGroupId) clip.audioStemGroupId = makeId();
    const siblings = state.arrangementTracks.flatMap((track) => track.clips).filter((candidate) =>
      candidate === clip || candidate.audioStemGroupId === clip.audioStemGroupId ||
      candidate.buffer === clip.buffer || (clip.blob && candidate.blob === clip.blob));
    siblings.forEach((sibling) => { sibling.audioStemGroupId = clip.audioStemGroupId; });
    return siblings;
  }

  function registerAudioClipStemSeparation(clip, stems, sampleRate) {
    const siblings = getAudioClipStemGroup(clip);
    const selection = normalizeAudioStemSelection(clip.audioStemSelection);
    siblings.forEach((sibling) => { sibling.audioStemSelection = { ...selection }; });
    audioClipStemSeparations.set(clip.audioStemGroupId, {
      stems,
      sampleRate,
      mixedBuffer: null,
      mixedSelection: "",
    });
    return siblings;
  }

  function hasAudioClipStemSeparation(clip) {
    return Boolean(clip?.audioStemGroupId && audioClipStemSeparations.has(clip.audioStemGroupId));
  }

  function getAudioClipStemPresence(clip) {
    const separation = audioClipStemSeparations.get(clip?.audioStemGroupId);
    if (!separation) return null;
    const rms = (stem) => {
      const sampleCount = stem.left.length;
      const stride = Math.max(1, Math.floor(sampleCount / 2048));
      let sum = 0;
      let samples = 0;
      for (let index = 0; index < sampleCount; index += stride) {
        sum += stem.left[index] ** 2 + stem.right[index] ** 2;
        samples += 2;
      }
      return samples ? Math.sqrt(sum / samples) : 0;
    };
    return {
      melody: rms(separation.stems.other) > 0.0001,
      vocals: rms(separation.stems.vocals) > 0.0001,
      percussion: rms(separation.stems.drums) > 0.0001,
      bass: rms(separation.stems.bass) > 0.0001,
    };
  }

  function setAudioClipStemSelection(clip, selection) {
    if (!hasAudioClipStemSeparation(clip)) return [];
    const siblings = getAudioClipStemGroup(clip);
    const normalized = normalizeAudioStemSelection(selection);
    siblings.forEach((sibling) => { sibling.audioStemSelection = { ...normalized }; });
    const separation = audioClipStemSeparations.get(clip.audioStemGroupId);
    if (separation) {
      separation.mixedBuffer = null;
      separation.mixedSelection = "";
    }
    return siblings;
  }

  function getAudioClipContentBuffer(context, clip) {
    const separation = audioClipStemSeparations.get(clip.audioStemGroupId);
    if (!separation) return clip.buffer;
    const selection = normalizeAudioStemSelection(clip.audioStemSelection);
    if (Object.values(selection).every(Boolean)) return clip.buffer;
    const selectionKey = `${selection.melody}:${selection.vocals}:${selection.percussion}:${selection.bass}`;
    if (separation.mixedBuffer && separation.mixedSelection === selectionKey) {
      return separation.mixedBuffer;
    }

    const frameCount = separation.stems.other.left.length;
    const mixed = context.createBuffer(2, frameCount, separation.sampleRate);
    const left = mixed.getChannelData(0);
    const right = mixed.getChannelData(1);
    const includedStems = [
      selection.melody ? separation.stems.other : null,
      selection.vocals ? separation.stems.vocals : null,
      selection.percussion ? separation.stems.drums : null,
      selection.bass ? separation.stems.bass : null,
    ].filter(Boolean);
    for (const stem of includedStems) {
      for (let index = 0; index < frameCount; index += 1) {
        left[index] += stem.left[index];
        right[index] += stem.right[index];
      }
    }
    separation.mixedBuffer = mixed;
    separation.mixedSelection = selectionKey;
    return mixed;
  }

  function setArrangementSliceMode(enabled) {
    arrangementSliceMode = enabled;
    const button = $("#arrangement-slice-button");
    button.setAttribute("aria-pressed", String(enabled));
    button.title = enabled ? "Click a clip to split it; click SLICE again to exit" : "Click a clip to split it at that point";
    document.body.classList.toggle("is-arrangement-slicing", enabled);
  }

  function sliceArrangementClipFromPointer(event, type, clip) {
    if (!arrangementSliceMode || event.target.closest(".clip-resize-handle")) return false;
    const lane = event.currentTarget.closest(".timeline-lane");
    if (!lane) return false;
    event.preventDefault();
    event.stopPropagation();
    state.selectedArrangementItems = new Set([arrangementSelectionKey(type, clip.id)]);
    updateArrangementSelection();
    splitArrangementItemsAtCursor(barAtPointer(event, lane));
    return true;
  }

  function drawAudioClipWaveform(canvas, clip, displayWidth, color) {
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.min(16384, Math.max(1, Math.ceil(displayWidth * pixelRatio)));
    const height = Math.ceil(46 * pixelRatio);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    const sampleChannels = Array.from({ length: clip.buffer.numberOfChannels }, (_, index) =>
      clip.buffer.getChannelData(index));
    const bufferDuration = clip.buffer.duration;
    if (!bufferDuration || !sampleChannels.length) return;
    const sourceOffset = clip.sourceOffsetSeconds || 0;
    const tempoRatio = getAudioClipTempoRatio(clip);
    const sourceWindows = getArrangementClipSourceWindows(
      bufferDuration,
      sourceOffset,
      clip.repeatCount,
      clip.durationSeconds ?? bufferDuration,
      clip.repeatStartSeconds,
      clip.repeatLengthSeconds,
    );
    const sourcePlayableDuration = sourceWindows.reduce((duration, window) => duration + window.duration, 0);
    const playableOutputDuration = sourcePlayableDuration / tempoRatio;
    const secondsPerBar = 240 / state.bpm;
    const canvasScale = width / (displayWidth * pixelRatio);
    const playableWidth = Math.min(width, Math.ceil(
      playableOutputDuration / secondsPerBar * BAR_WIDTH * pixelRatio * canvasScale,
    ));
    const secondsPerPixel = secondsPerBar / (BAR_WIDTH * pixelRatio * canvasScale);
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, pixelRatio * 0.65);
    context.globalAlpha = 0.88;
    const center = height / 2;
    let firstWindow = 0;
    for (let x = 0; x < playableWidth; x += 1) {
      const sourceStart = x * secondsPerPixel * tempoRatio;
      const sourceEnd = Math.min(sourcePlayableDuration, (x + 1) * secondsPerPixel * tempoRatio);
      while (firstWindow < sourceWindows.length &&
        sourceWindows[firstWindow].elapsedSource + sourceWindows[firstWindow].duration <= sourceStart) firstWindow += 1;
      let peak = 0;
      for (let windowIndex = firstWindow; windowIndex < sourceWindows.length; windowIndex += 1) {
        const window = sourceWindows[windowIndex];
        const windowEnd = window.elapsedSource + window.duration;
        if (window.elapsedSource >= sourceEnd) break;
        const overlapStart = Math.max(sourceStart, window.elapsedSource);
        const overlapEnd = Math.min(sourceEnd, windowEnd);
        if (overlapEnd <= overlapStart) continue;
        const localStart = window.sourceOffset + overlapStart - window.elapsedSource;
        const localEnd = window.sourceOffset + overlapEnd - window.elapsedSource;
        const sampleCount = sampleChannels[0].length;
        const sampleStartSeconds = clip.reversed ? bufferDuration - localEnd : localStart;
        const sampleEndSeconds = clip.reversed ? bufferDuration - localStart : localEnd;
        const sampleStart = Math.max(0, Math.floor(sampleStartSeconds / bufferDuration * sampleCount));
        const sampleEnd = Math.min(sampleCount, Math.max(sampleStart + 1,
          Math.ceil(sampleEndSeconds / bufferDuration * sampleCount)));
        for (const samples of sampleChannels) {
          for (let sample = sampleStart; sample < sampleEnd; sample += 1) {
            peak = Math.max(peak, Math.abs(samples[sample]));
          }
        }
      }
      const amplitude = Math.max(1, peak * (height * 0.45));
      context.beginPath();
      context.moveTo(x + 0.5, center - amplitude);
      context.lineTo(x + 0.5, center + amplitude);
      context.stroke();
    }
    const durationBars = displayWidth / BAR_WIDTH;
    if (durationBars > 1) {
      const scale = width / (displayWidth * pixelRatio);
      context.fillStyle = "rgba(255,255,255,.2)";
      for (let bar = 1; bar < durationBars; bar += 1) {
        const x = Math.round(bar * BAR_WIDTH * pixelRatio * scale);
        if (x < width) context.fillRect(x, 0, Math.max(1, pixelRatio * scale), height);
      }
    }
    context.globalAlpha = 1;
  }

  function getReversedAudioClipBuffer(context, buffer) {
    let buffersForContext = reversedAudioClipBuffers.get(context);
    if (!buffersForContext) {
      buffersForContext = new WeakMap();
      reversedAudioClipBuffers.set(context, buffersForContext);
    }
    let reversed = buffersForContext.get(buffer);
    if (reversed) return reversed;
    reversed = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      reversed.getChannelData(channel).set(buffer.getChannelData(channel).slice().reverse());
    }
    buffersForContext.set(buffer, reversed);
    return reversed;
  }

  function getAudioClipStretchSettings(clip, { ignoreReverse = false } = {}) {
    const tempoRatio = getAudioClipTempoRatio(clip);
    const pitchSemitones = Number.isFinite(clip.audioAdjustment?.keyShiftSemitones)
      ? clip.audioAdjustment.keyShiftSemitones : 0;
    const reversed = clip.reversed === true && !ignoreReverse;
    return {
      tempoRatio,
      pitchSemitones,
      reversed,
      key: `${tempoRatio}:${pitchSemitones}:${reversed}`,
    };
  }

  async function prepareAudioClipPlaybackBuffer(context, clip, { ignoreReverse = false } = {}) {
    const { tempoRatio, pitchSemitones, reversed, key } =
      getAudioClipStretchSettings(clip, { ignoreReverse });
    if (Math.abs(tempoRatio - 1) < 0.001 && Math.abs(pitchSemitones) < 0.001) return;

    const contentBuffer = getAudioClipContentBuffer(context, clip);
    let clipBuffers = stretchedAudioClipBuffers.get(clip);
    if (!clipBuffers) {
      clipBuffers = new Map();
      stretchedAudioClipBuffers.set(clip, clipBuffers);
    }
    let cached = clipBuffers.get(key);
    if (cached?.key === key && cached.sourceBuffer === contentBuffer) {
      await cached.promise;
      return;
    }

    const sourceBuffer = reversed ? getReversedAudioClipBuffer(context, contentBuffer) : contentBuffer;
    if (!audioStretchModulePromise) audioStretchModulePromise = import("./app/audio-stretch.js");
    const entry = {
      key,
      sourceBuffer: contentBuffer,
      buffer: null,
      promise: audioStretchModulePromise.then(({ stretchAudioBuffer }) =>
        stretchAudioBuffer(context, sourceBuffer, tempoRatio, pitchSemitones)),
    };
    clipBuffers.set(key, entry);
    try {
      entry.buffer = await entry.promise;
    } catch (error) {
      if (clipBuffers.get(key) === entry) clipBuffers.delete(key);
      if (!clipBuffers.size) stretchedAudioClipBuffers.delete(clip);
      throw new Error(`Could not time-stretch ${clip.name}: ${error.message || "audio processing failed"}`);
    }
  }

  function getAudioClipPlaybackBuffer(context, clip, { ignoreReverse = false } = {}) {
    const { tempoRatio, pitchSemitones, reversed, key } =
      getAudioClipStretchSettings(clip, { ignoreReverse });
    const contentBuffer = getAudioClipContentBuffer(context, clip);
    if (Math.abs(tempoRatio - 1) < 0.001 && Math.abs(pitchSemitones) < 0.001) {
      return reversed ? getReversedAudioClipBuffer(context, contentBuffer) : contentBuffer;
    }
    const cached = stretchedAudioClipBuffers.get(clip)?.get(key);
    if (cached?.key !== key || cached.sourceBuffer !== contentBuffer || !cached.buffer) {
      throw new Error(`The time-stretched audio for ${clip.name} is not ready.`);
    }
    return cached.buffer;
  }

  async function prepareAudioClipPlaybackBuffers(startBar, endBar) {
    for (const track of state.arrangementTracks) {
      for (const clip of track.clips) {
        const clipEndBar = clip.startBar + getArrangementClipDuration("audio", clip);
        if (clipEndBar <= startBar || clip.startBar >= endBar) continue;
        await prepareAudioClipPlaybackBuffer(state.audioContext, clip);
        if (clip.reversed) {
          await prepareAudioClipPlaybackBuffer(state.audioContext, clip, { ignoreReverse: true });
        }
      }
    }
  }

  async function preparePianoAudioSliceBuffers(notes) {
    const clips = new Set();
    for (const note of notes || []) {
      if (note.audioSlice?.pitchEdited !== true) continue;
      const clip = getPianoRollAudioClipById(note.audioSlice.clipId);
      if (clip?.buffer) clips.add(clip);
    }
    for (const clip of clips) {
      await prepareAudioClipPlaybackBuffer(state.audioContext, clip, { ignoreReverse: true });
    }
  }

  function createAudioClipPlaybackSource(context, track, clip, segment, when, secondsPerBar) {
    const source = context.createBufferSource();
    const buffer = getAudioClipPlaybackBuffer(context, clip);
    const envelope = context.createGain();
    const tempoRatio = getAudioClipTempoRatio(clip);
    source.buffer = buffer;
    source.connect(envelope);
    envelope.connect(track.gainNode);
    source.playbackRate.setValueAtTime(1, when);

    const clipDuration = getArrangementClipDuration("audio", clip) * secondsPerBar;
    const segmentOffset = Math.max(0, (segment.startBar - clip.startBar) * secondsPerBar);
    const clipGain = Math.max(0, Math.min(2, Number.isFinite(clip.clipGain) ? clip.clipGain : 1));
    const fadeIn = Math.min(clipDuration, Math.max(0, Number(clip.fadeInSeconds) || 0));
    const fadeOut = Math.min(clipDuration, Math.max(0, Number(clip.fadeOutSeconds) || 0));
    if (fadeIn || fadeOut) {
      const curve = new Float32Array(65);
      const segmentOutputDuration = segment.durationSeconds / tempoRatio;
      for (let index = 0; index < curve.length; index += 1) {
        const clipTime = segmentOffset + segmentOutputDuration * index / (curve.length - 1);
        const fadeInGain = fadeIn ? Math.min(1, clipTime / fadeIn) : 1;
        const fadeOutGain = fadeOut ? Math.min(1, Math.max(0, (clipDuration - clipTime) / fadeOut)) : 1;
        curve[index] = Math.min(fadeInGain, fadeOutGain) * clipGain;
      }
      envelope.gain.setValueCurveAtTime(curve, when, segmentOutputDuration);
    } else {
      envelope.gain.value = clipGain;
    }

    const sourceOffset = (clip.reversed
      ? clip.buffer.duration - segment.sourceOffsetSeconds - segment.durationSeconds
      : segment.sourceOffsetSeconds) / tempoRatio;
    source.start(when, Math.max(0, sourceOffset), segment.durationSeconds / tempoRatio);
    return { source, envelope };
  }

  function openAudioClipEditor(track, clip) {
    const dialog = $("#audio-clip-edit-dialog");
    dialog.dataset.trackId = track.id;
    dialog.dataset.clipId = clip.id;
    $("#audio-clip-edit-name").textContent = clip.name;
    $("#audio-clip-edit-metadata").textContent = describeAudioMetadata(clip.audioMetadata);
    $("#audio-clip-gain").value = String(Math.round(Math.max(0, Math.min(2, clip.clipGain ?? 1)) * 100));
    $("#audio-clip-fade-in").value = String(Math.max(0, Math.min(10, clip.fadeInSeconds || 0)));
    $("#audio-clip-fade-out").value = String(Math.max(0, Math.min(10, clip.fadeOutSeconds || 0)));
    $("#audio-clip-reverse").checked = clip.reversed === true;
    updateAudioClipGainOutput(Number($("#audio-clip-gain").value));
    updateAudioClipFadeOutput("fadeInSeconds", Number($("#audio-clip-fade-in").value));
    updateAudioClipFadeOutput("fadeOutSeconds", Number($("#audio-clip-fade-out").value));
    dialog.showModal();
  }

  function askAudioTempoChoice(filename, detectedBpm, projectBpm = state.bpm) {
    const dialog = $("#audio-tempo-dialog");
    const mainOptions = $("#audio-tempo-main-options");
    const interpretations = $("#audio-tempo-interpretations");
    const adjustAudioButton = $("#audio-tempo-audio-to-project");
    const interpretationDescription = $("#audio-tempo-interpretation-description");
    const projectTempoBpm = roundBpm(projectBpm);
    const doubleBpm = roundBpm(projectTempoBpm * 2);
    const halfBpm = roundBpm(projectTempoBpm / 2);
    const canStretchTo = (targetBpm) => detectedBpm !== null &&
      targetBpm / detectedBpm >= 1 / 6 && targetBpm / detectedBpm <= 6;
    $("#audio-tempo-file").textContent = filename;
    $("#audio-tempo-detection").textContent = detectedBpm === null
      ? "Tempo could not be confidently detected. You can leave both tempos unchanged."
      : `Detected audio tempo: ${detectedBpm} BPM · Project tempo: ${projectTempoBpm} BPM.`;
    adjustAudioButton.disabled = detectedBpm === null;
    $("#audio-tempo-project-to-audio").disabled = detectedBpm === null;
    $("#audio-tempo-actual").textContent = `Use project tempo (${projectTempoBpm} BPM)`;
    $("#audio-tempo-double").textContent = `Use double project tempo (${doubleBpm} BPM)`;
    $("#audio-tempo-half").textContent = `Use half project tempo (${halfBpm} BPM)`;
    $("#audio-tempo-actual").value = `audio-to-project:${projectTempoBpm}`;
    $("#audio-tempo-double").value = `audio-to-project:${doubleBpm}`;
    $("#audio-tempo-half").value = `audio-to-project:${halfBpm}`;
    $("#audio-tempo-actual").disabled = !canStretchTo(projectTempoBpm);
    $("#audio-tempo-double").disabled = !canStretchTo(doubleBpm);
    $("#audio-tempo-half").disabled = !canStretchTo(halfBpm);
    interpretationDescription.textContent = detectedBpm === null
      ? `Choose a target relative to the project's ${projectTempoBpm} BPM tempo.`
      : `Choose the audio's target tempo relative to the project (${projectTempoBpm} BPM); detected audio tempo is ${detectedBpm} BPM.`;
    mainOptions.hidden = false;
    interpretations.hidden = true;
    dialog.returnValue = "";
    return new Promise((resolve) => {
      const controller = new AbortController();
      adjustAudioButton.addEventListener("click", () => {
        mainOptions.hidden = true;
        interpretations.hidden = false;
        $("#audio-tempo-actual").focus();
      }, { signal: controller.signal });
      $("#audio-tempo-back").addEventListener("click", () => {
        interpretations.hidden = true;
        mainOptions.hidden = false;
        adjustAudioButton.focus();
      }, { signal: controller.signal });
      dialog.addEventListener("close", () => {
        const [action, interpretation] = (dialog.returnValue || "leave").split(":");
        resolve({
          action,
          targetBpm: action === "audio-to-project" ? Number(interpretation) : null,
        });
        controller.abort();
      }, { once: true, signal: controller.signal });
      dialog.showModal();
    });
  }

  function updateAudioClipGainOutput(value) {
    $("#audio-clip-gain-value").textContent = `${value}%`;
  }

  function updateAudioClipFadeOutput(property, value) {
    const output = $(`#audio-clip-${property === "fadeInSeconds" ? "fade-in" : "fade-out"}-value`);
    output.textContent = value > 0 ? `${value.toFixed(2)} s` : "Off";
  }

  function updateAudioClipEditor(event) {
    const input = event.target.closest("[data-audio-clip-property]");
    if (!(input instanceof HTMLInputElement)) return;
    const dialog = $("#audio-clip-edit-dialog");
    const track = state.arrangementTracks.find((item) => item.id === dialog.dataset.trackId);
    const clip = track?.clips.find((item) => item.id === dialog.dataset.clipId);
    if (!track || !clip) return;

    if (input.dataset.audioClipProperty === "reversed") {
      clip.reversed = input.checked;
    } else if (input.dataset.audioClipProperty === "clipGain") {
      const value = Math.max(0, Math.min(200, Number(input.value) || 0));
      clip.clipGain = value / 100;
      updateAudioClipGainOutput(value);
    } else {
      const property = input.dataset.audioClipProperty;
      const value = Math.max(0, Math.min(10, Number(input.value) || 0));
      if (property === "fadeInSeconds") clip.fadeInSeconds = value;
      else if (property === "fadeOutSeconds") clip.fadeOutSeconds = value;
      updateAudioClipFadeOutput(property, value);
    }
    saveState();
    renderArrangement();
    if (event.type === "change") {
      persistClip(track, clip).catch(() => showToast("Clip settings changed, but browser storage could not be updated."));
    }
  }

  function getAudioClipEditedMel(clip) {
    return state.mels.slice().reverse().find((mel) => mel.audioSourceClipId === clip.id) || null;
  }

  function createAudioClip(track, clip) {
    const element = document.createElement("div");
    const durationBars = getArrangementClipDuration("audio", clip);
    const editedMel = getAudioClipEditedMel(clip);
    element.className = "audio-clip";
    element.classList.toggle("is-reversed", clip.reversed === true);
    element.classList.toggle("has-audio-pitch-mel", Boolean(editedMel));
    element.draggable = true;
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "audio";
    element.style.setProperty("--clip-color", track.color);
    element.style.left = `${clip.startBar * BAR_WIDTH}px`;
    const clipWidth = Math.max(12, durationBars * BAR_WIDTH);
    element.style.width = `${clipWidth}px`;
    const metadataLabel = describeAudioMetadata(clip.audioMetadata);
    const adjustmentLabel = clip.audioAdjustment
      ? ` · Matched to ${[
        clip.audioAdjustment.targetKey,
        clip.audioAdjustment.targetBpm ? `${clip.audioAdjustment.targetBpm} BPM` : null,
      ].filter(Boolean).join(" and ")}`
      : "";
    element.title = `${clip.name} · ${metadataLabel}${adjustmentLabel}${editedMel ? ` · Piano Roll Mel: ${editedMel.name}` : ""}`;
    element.setAttribute("aria-label", `${clip.name}, ${metadataLabel}, bar ${clip.startBar + 1}, ${durationBars.toFixed(2)} bars; drag to move or resize`);

    const waveform = document.createElement("canvas");
    waveform.className = "clip-waveform-canvas bar-aligned-waveform";
    waveform.setAttribute("aria-hidden", "true");
    drawAudioClipWaveform(waveform, clip, Math.max(1, durationBars * BAR_WIDTH), track.color);
    const name = document.createElement("span");
    name.className = "clip-name";
    name.textContent = clip.name;
    const reverseBadge = document.createElement("span");
    reverseBadge.className = "audio-clip-reverse-badge";
    reverseBadge.textContent = "REV";
    const melBadge = document.createElement("span");
    melBadge.className = "audio-clip-mel-badge";
    melBadge.textContent = "MEL";
    element.style.setProperty("--pattern-color", track.color);
    const startHandle = makeAudioClipStartTrimHandle(track, clip, element);
    const repeatHandle = makeArrangementResizeHandle("audio", clip, track, element, name, "repeat");
    const resizeHandle = makeArrangementResizeHandle("audio", clip, track, element, name);
    updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength("audio", clip), durationBars,
      getArrangementClipRepeatPhaseBars("audio", clip));
    element.addEventListener("dragstart", (event) => {
      selectArrangementTrack(track.id);
      if (!(event.shiftKey && (event.ctrlKey || event.metaKey))) selectArrangementItem("audio", clip.id, event);
      event.dataTransfer?.setData("application/x-pulsegrid-audio-clip", JSON.stringify({ clipId: clip.id, sourceTrackId: track.id }));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      beginArrangementItemDrag(event, element, "audio", durationBars, clip.startBar);
    });
    element.addEventListener("click", (event) => {
      if (sliceArrangementClipFromPointer(event, "audio", clip)) return;
      if (event.target.closest(".clip-resize-handle")) return;
      event.stopPropagation();
      selectArrangementTrack(track.id);
      if (!selectArrangementItem("audio", clip.id, event)) return;
      setArrangementCursor(clip.startBar);
    });
    element.addEventListener("dblclick", (event) => {
      if (event.target.closest(".clip-resize-handle")) return;
      event.preventDefault();
      event.stopPropagation();
      openAudioClipEditor(track, clip);
    });
    element.append(waveform, name, startHandle);
    if (clip.reversed) element.append(reverseBadge);
    if (editedMel) element.append(melBadge);
    element.append(repeatHandle, resizeHandle);
    return element;
  }

  function createMelClipElement(track, clip) {
    const mel = getMel(clip.melId);
    if (!mel) return document.createElement("div");
    const bars = getArrangementClipDuration("mel", clip);
    const element = document.createElement("div");
    element.className = "mel-arrangement-clip";
    element.draggable = true;
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "mel";
    element.style.setProperty("--clip-color", track.color);
    element.style.setProperty("--pattern-color", track.color);
    element.style.left = `${clip.startBar * BAR_WIDTH}px`;
    element.style.width = `${Math.max(12, bars * BAR_WIDTH)}px`;
    const name = document.createElement("span");
    name.className = "mel-clip-name";
    name.textContent = `${mel.name.toUpperCase()} · ${Number(bars.toFixed(2))} BAR${bars === 1 ? "" : "S"}`;
    element.setAttribute("aria-label", `${mel.name}, bar ${clip.startBar + 1}, ${bars.toFixed(2)} bars; drag to move or resize`);
    const repeatHandle = makeArrangementResizeHandle("mel", clip, track, element, name, "repeat");
    const resizeHandle = makeArrangementResizeHandle("mel", clip, track, element, name);
    updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength("mel", clip), bars,
      getArrangementClipRepeatPhaseBars("mel", clip));
    const waveform = makeActivityWaveform(
      getMelActivityWaveform(mel, clip, bars, getActivityWaveformSampleCount(Math.max(1, bars * BAR_WIDTH))),
      track.color,
      Math.max(1, bars * BAR_WIDTH),
      bars,
    );
    waveform.classList.add("bar-aligned-waveform");
    element.addEventListener("dragstart", (event) => {
      selectArrangementTrack(track.id);
      if (!(event.shiftKey && (event.ctrlKey || event.metaKey))) selectArrangementItem("mel", clip.id, event);
      event.dataTransfer?.setData("application/x-pulsegrid-mel-clip", JSON.stringify({ clipId: clip.id, sourceTrackId: track.id }));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      beginArrangementItemDrag(event, element, "mel", bars, clip.startBar);
    });
    element.addEventListener("click", (event) => {
      if (sliceArrangementClipFromPointer(event, "mel", clip)) return;
      if (event.target.closest(".clip-resize-handle")) return;
      event.stopPropagation();
      selectArrangementTrack(track.id);
      if (!selectArrangementItem("mel", clip.id, event)) return;
      setArrangementCursor(clip.startBar);
    });
    element.append(waveform, name, repeatHandle, resizeHandle);
    return element;
  }

  function createPatternClip(clip) {
    const element = document.createElement("div");
    element.className = "drum-arrangement-clip";
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "pattern";
    const pattern = getPattern(clip.patternId) || getPattern();
    const patternName = pattern?.name || "Drum pattern";
    const totalBars = getArrangementClipDuration("pattern", clip);
    const displayBars = Number(totalBars.toFixed(2));
    element.style.setProperty("--pattern-color", pattern?.color || "var(--accent)");
    element.style.setProperty("--clip-color", pattern?.color || "var(--accent)");
    element.draggable = true;
    element.style.left = `${clip.startBar * BAR_WIDTH}px`;
    element.style.width = `${Math.max(12, totalBars * BAR_WIDTH)}px`;
    element.setAttribute("aria-label", `${patternName}, bar ${clip.startBar + 1}, ${displayBars} bars; drag to move, repeat, or resize`);
    const icon = document.createElement("span");
    icon.className = "pattern-clip-icon";
    icon.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 11h3l2-6 4 10 2-6h3" /></svg>';
    const text = document.createElement("span");
    text.className = "pattern-clip-name";
    text.textContent = `${patternName.toUpperCase()} · ${displayBars} BAR${displayBars === 1 ? "" : "S"}`;
    const repeatHandle = makeArrangementResizeHandle("pattern", clip, null, element, text, "repeat");
    const resizeHandle = makeArrangementResizeHandle("pattern", clip, null, element, text);
    const waveform = pattern
      ? makeActivityWaveform(
        getPatternActivityWaveform(pattern, clip, totalBars,
          getActivityWaveformSampleCount(Math.max(1, totalBars * BAR_WIDTH))),
        pattern.color || "var(--accent)",
        Math.max(1, totalBars * BAR_WIDTH),
        totalBars,
      )
      : makeActivityWaveform([0], "#d3f36b", 1);
    waveform.classList.add("bar-aligned-waveform");
    element.addEventListener("dragstart", (event) => {
      if (!(event.shiftKey && (event.ctrlKey || event.metaKey))) selectArrangementItem("pattern", clip.id, event);
      event.dataTransfer?.setData("application/x-pulsegrid-pattern-clip", JSON.stringify({ clipId: clip.id }));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      beginArrangementItemDrag(event, element, "pattern", totalBars, clip.startBar);
    });
    element.addEventListener("click", (event) => {
      if (sliceArrangementClipFromPointer(event, "pattern", clip)) return;
      if (event.target.closest(".clip-resize-handle")) return;
      event.stopPropagation();
      selectArrangementTrack(clip.trackId || clip.patternId);
      if (!selectArrangementItem("pattern", clip.id, event)) return;
      setArrangementCursor(clip.startBar);
    });
    element.append(waveform, icon, text, repeatHandle, resizeHandle);
    if (pattern) updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength("pattern", clip), totalBars,
      getArrangementClipRepeatPhaseBars("pattern", clip));
    return element;
  }

  function updateArrangementCursorMarker() {
    document.querySelectorAll(".arrangement-cursor").forEach((marker) => {
      marker.style.left = `${state.arrangementCursor * BAR_WIDTH}px`;
      marker.setAttribute("aria-valuenow", state.arrangementCursor.toFixed(2));
      marker.setAttribute("aria-valuemax", String(state.arrangementBars));
    });
    const rulerPlayhead = document.querySelector(".arrangement-ruler-playhead");
    if (rulerPlayhead) rulerPlayhead.style.left = `${state.arrangementCursor * BAR_WIDTH}px`;
    const timeValue = $("#playhead-time-value");
    if (timeValue) {
      const seconds = Math.max(0, state.arrangementCursor * 240 / state.bpm);
      const minutes = Math.floor(seconds / 60);
      timeValue.textContent = `${String(minutes).padStart(2, "0")}:${(seconds % 60).toFixed(3).padStart(6, "0")}`;
    }
  }

  function setArrangementCursor(bar, persist = true) {
    if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
    state.arrangementCursor = Math.max(0, Math.min(state.arrangementBars - 0.001, snapArrangementBar(bar)));
    updateArrangementCursorMarker();
    if (persist) saveState();
  }

  function arrangementSelectionKey(type, id) {
    return `${type}:${id}`;
  }

  function updateArrangementSelection() {
    document.querySelectorAll("[data-selectable-type][data-clip-id]").forEach((item) => {
      item.classList.toggle("is-selected", state.selectedArrangementItems.has(
        arrangementSelectionKey(item.dataset.selectableType, item.dataset.clipId)));
    });
  }

  function selectAllArrangementItems() {
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    state.pianoSelectionFromMarquee = false;
    document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    state.selectedArrangementItems = new Set([
      ...state.patternClips.map((clip) => arrangementSelectionKey("pattern", clip.id)),
      ...state.melTracks.flatMap((track) => track.clips.map((clip) => arrangementSelectionKey("mel", clip.id))),
      ...state.arrangementTracks.flatMap((track) => track.clips.map((clip) => arrangementSelectionKey("audio", clip.id))),
    ]);
    state.arrangementSelectionFromMarquee = false;
    updateArrangementSelection();
  }

  function selectAllPianoNotes() {
    state.selectedPianoNoteIds = new Set(state.pianoNotes
      .filter((note) => note.startTick < state.pianoBars * PIANO_TICKS_PER_BAR)
      .map((note) => note.id));
    state.selectedPianoNoteId = [...state.selectedPianoNoteIds].at(-1) || null;
    state.pianoSelectionFromMarquee = false;
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    updateArrangementSelection();
    renderPianoRoll();
  }

  function selectAllStepCells() {
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    state.pianoSelectionFromMarquee = false;
    updateArrangementSelection();
    document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    const patternTrackIds = new Set(getPatternTrackIds(getPattern()));
    const stepCount = getGridStepCount();
    state.selectedStepCells = new Set(state.tracks
      .filter((track) => patternTrackIds.has(track.id))
      .flatMap((track) => Array.from({ length: stepCount }, (_, step) => `${track.id}:${step}`)));
    const firstTrack = state.tracks.find((track) => patternTrackIds.has(track.id));
    stepSelectionAnchor = firstTrack ? { trackId: firstTrack.id, step: 0 } : null;
    document.querySelectorAll(".step-cell").forEach((cell) => {
      cell.classList.toggle("is-selected", state.selectedStepCells.has(`${cell.closest(".track-row").dataset.trackId}:${cell.dataset.step}`));
    });
  }

  function getClipboardEditorView() {
    return getLastInteractedViewArea() === "track-view" ? "arrangement" : state.view;
  }

  function copyEditorSelection({ trackOnly = false } = {}) {
    const editorView = getClipboardEditorView();
    if (editorView === "sequencer") {
      if (!state.selectedStepCells.size) return;
      const tracks = Array.from(document.querySelectorAll(".track-row"), (row) =>
        state.tracks.find((track) => track.id === row.dataset.trackId)).filter(Boolean);
      const trackIndexes = new Map(tracks.map((track, index) => [track.id, index]));
      const selection = [...state.selectedStepCells].map((key) => {
        const separator = key.lastIndexOf(":");
        return { trackId: key.slice(0, separator), step: Number(key.slice(separator + 1)) };
      });
      const firstSelection = selection.find(({ trackId }) => trackIndexes.has(trackId));
      const anchor = stepSelectionAnchor && trackIndexes.has(stepSelectionAnchor.trackId)
        ? stepSelectionAnchor
        : firstSelection;
      if (!anchor) return;
      const anchorTrackIndex = trackIndexes.get(anchor.trackId);
      const items = selection.flatMap(({ trackId, step }) => {
        const trackIndex = trackIndexes.get(trackId);
        const track = trackIndex === undefined ? null : tracks[trackIndex];
        if (!track || !Number.isInteger(step)) return [];
        return [{
          trackOffset: trackIndex - anchorTrackIndex,
          stepOffset: step - anchor.step,
          value: track.cells[step] === true,
        }];
      });
      if (!items.length) return;
      stepSelectionAnchor = { ...anchor };
      state.clipboard = { type: "sequencer", items, pasteCount: 0 };
      return;
    }
    if (editorView === "piano-roll") {
      const selectedIds = new Set(state.selectedPianoNoteIds);
      if (state.selectedPianoNoteId) selectedIds.add(state.selectedPianoNoteId);
      const notes = state.pianoNotes.filter((note) => selectedIds.has(note.id));
      if (!notes.length) return;
      const firstTick = Math.min(...notes.map((note) => note.startTick));
      const endTick = Math.max(...notes.map((note) => note.startTick + note.durationTicks));
      state.clipboard = {
        type: "piano-roll",
        items: notes.map((note) => ({ ...note, startOffset: note.startTick - firstTick })),
        span: Math.max(getPianoSnapStep(), endTick - firstTick),
        pasteCount: 0,
      };
      return;
    }
    if (!["arrangement", "mixer"].includes(editorView)) return;
    let trackCopy = null;
    if (trackOnly || !state.selectedArrangementItems.size) {
      const selectedTrackId = state.selectedMixerTrackId;
      const patternTrack = state.patterns.find((pattern) => pattern.id === selectedTrackId &&
        state.patternClips.some((clip) => (clip.trackId || clip.patternId) === pattern.id));
      const melTrack = state.melTracks.find((track) => track.id === selectedTrackId);
      const audioTrack = state.arrangementTracks.find((track) => track.id === selectedTrackId);
      if (patternTrack) {
        trackCopy = { type: "pattern", sourceTrackId: patternTrack.id, track: { patternId: patternTrack.id } };
      } else if (melTrack) {
        trackCopy = {
          type: "mel",
          sourceTrackId: melTrack.id,
          track: {
            id: melTrack.id, name: melTrack.name, kind: "mel", instrumentId: melTrack.instrumentId,
            color: melTrack.color, volume: melTrack.volume, pan: melTrack.pan,
            automation: normalizeTrackAutomation(melTrack.automation),
            automationOpen: melTrack.automationOpen === true, effects: makeDefaultEffects(melTrack.effects),
          },
        };
      } else if (audioTrack) {
        trackCopy = {
          type: "audio",
          sourceTrackId: audioTrack.id,
          track: {
            id: audioTrack.id, name: audioTrack.name, color: audioTrack.color, volume: audioTrack.volume,
            pan: audioTrack.pan, automation: normalizeTrackAutomation(audioTrack.automation),
            automationOpen: audioTrack.automationOpen === true, effects: makeDefaultEffects(audioTrack.effects),
          },
        };
      }
    }
    const items = [];
    state.patternClips.forEach((clip) => {
      const sourceTrackId = clip.trackId || clip.patternId;
      if (!trackCopy && !state.selectedArrangementItems.has(arrangementSelectionKey("pattern", clip.id))) return;
      if (trackCopy && (trackCopy.type !== "pattern" || trackCopy.sourceTrackId !== sourceTrackId)) return;
      items.push({
        type: "pattern", sourceTrackId, patternId: clip.patternId, startBar: clip.startBar,
        track: { patternId: clip.patternId }, clip: { ...clip }, repeatCount: clip.repeatCount || 1,
      });
    });
    state.melTracks.forEach((track) => track.clips.forEach((clip) => {
      if (!trackCopy && !state.selectedArrangementItems.has(arrangementSelectionKey("mel", clip.id))) return;
      if (trackCopy && (trackCopy.type !== "mel" || trackCopy.sourceTrackId !== track.id)) return;
      items.push({
        type: "mel", sourceTrackId: track.id, track: {
          id: track.id, name: track.name, kind: "mel", instrumentId: track.instrumentId,
          color: track.color, volume: track.volume, pan: track.pan, automation: normalizeTrackAutomation(track.automation),
          automationOpen: track.automationOpen === true, effects: makeDefaultEffects(track.effects),
        },
        clip: { ...clip }, melId: clip.melId, startBar: clip.startBar,
      });
    }));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
      if (!trackCopy && !state.selectedArrangementItems.has(arrangementSelectionKey("audio", clip.id))) return;
      if (trackCopy && (trackCopy.type !== "audio" || trackCopy.sourceTrackId !== track.id)) return;
      items.push({
        type: "audio", sourceTrackId: track.id, track: {
          id: track.id, name: track.name, color: track.color, volume: track.volume,
          pan: track.pan,
          automation: normalizeTrackAutomation(track.automation),
          automationOpen: track.automationOpen === true, effects: makeDefaultEffects(track.effects),
        },
        clip: { ...clip }, startBar: clip.startBar,
      });
    }));
    if (!items.length && !trackCopy) return;
    const firstBar = items.length ? Math.min(...items.map((item) => item.startBar)) : 0;
    const lastBar = items.length
      ? Math.max(...items.map((item) => item.startBar + getArrangementClipDuration(item.type, item.clip)))
      : 1;
    state.clipboard = {
      type: "arrangement",
      items: items.map((item) => ({ ...item, startOffset: item.startBar - firstBar })),
      span: Math.max(1, lastBar - firstBar),
      pasteCount: 0,
      ...(trackCopy ? { trackCopy } : {}),
    };
  }

  function createArrangementPasteTrack(type, sourceTrackId, trackSnapshot = null) {
    if (type === "pattern") {
      const source = getPattern(sourceTrackId) || (trackSnapshot?.patternId
        ? getPattern(trackSnapshot.patternId) : null);
      if (!source) return null;
      const destination = createPatternLaneCopy(source);
      destination.insertAfterTrackId = getLastArrangementTrackId();
      return destination.id;
    }
    if (type === "mel") {
      if (!trackSnapshot) return null;
      const destination = {
        id: makeId(),
        name: `${trackSnapshot.name} copy`,
        insertAfterTrackId: getLastArrangementTrackId(),
        kind: "mel",
        instrumentId: trackSnapshot.instrumentId,
        color: trackSnapshot.color,
        muted: false,
        solo: false,
        volume: trackSnapshot.volume,
        pan: trackSnapshot.pan,
        automation: normalizeTrackAutomation(trackSnapshot.automation),
        automationOpen: trackSnapshot.automationOpen === true,
        gainNode: null,
        effects: makeDefaultEffects(trackSnapshot.effects),
        clips: [],
      };
      state.melTracks.push(destination);
      return destination.id;
    }
    if (type === "audio") {
      if (!trackSnapshot) return null;
      const destination = {
        id: makeId(),
        name: `${trackSnapshot.name} copy`,
        insertAfterTrackId: getLastArrangementTrackId(),
        color: trackSnapshot.color,
        muted: false,
        solo: false,
        volume: trackSnapshot.volume,
        pan: trackSnapshot.pan,
        automation: normalizeTrackAutomation(trackSnapshot.automation),
        automationOpen: trackSnapshot.automationOpen === true,
        gainNode: null,
        effects: makeDefaultEffects(trackSnapshot.effects),
        clips: [],
      };
      state.arrangementTracks.push(destination);
      ensureArrangementTrackAudio(destination);
      return destination.id;
    }
    return null;
  }

  function pasteEditorClipboard({ newTrack = false } = {}) {
    const editorView = getClipboardEditorView();
    const expectedType = editorView === "sequencer" ? "sequencer" :
      editorView === "piano-roll" ? "piano-roll" :
        ["arrangement", "mixer"].includes(editorView) ? "arrangement" : null;
    if (!state.clipboard) {
      showToast("Copy selected items before pasting.");
      return;
    }
    if (!expectedType || state.clipboard.type !== expectedType) {
      showToast("Copied items can only be pasted into the same editor they came from.");
      return;
    }
    const clipboard = state.clipboard;
    if (expectedType === "piano-roll") {
      const totalTicks = getPianoLoopRange().totalBars * PIANO_TICKS_PER_BAR;
      const pasteStartTick = Math.max(0, Math.min(totalTicks - 0.001, state.pianoCursorTick));
      const pasted = clipboard.items
        .map((note) => ({
          id: makeId(),
          trackId: state.selectedPianoTrackId,
          midi: note.midi,
          startTick: pasteStartTick + note.startOffset,
          durationTicks: Math.min(note.durationTicks, totalTicks - pasteStartTick - note.startOffset),
          velocity: note.velocity,
          pan: note.pan,
        }))
        .filter((note) => note.startTick < totalTicks && note.durationTicks > 0);
      if (!pasted.length) {
        showToast("There is no room to paste those notes in the current Piano Roll length.");
        return;
      }
      state.pianoNotes.push(...pasted);
      state.selectedPianoNoteIds = new Set(pasted.map((note) => note.id));
      state.selectedPianoNoteId = pasted.at(-1).id;
      state.pianoSelectionFromMarquee = false;
      clipboard.pasteCount += 1;
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
      return;
    }
    if (expectedType === "sequencer") {
      const tracks = Array.from(document.querySelectorAll(".track-row"), (row) =>
        state.tracks.find((track) => track.id === row.dataset.trackId)).filter(Boolean);
      const targetTrackIndex = stepSelectionAnchor
        ? tracks.findIndex((track) => track.id === stepSelectionAnchor.trackId)
        : -1;
      const stepCount = getGridStepCount();
      if (targetTrackIndex < 0 || stepCount < 1) {
        showToast("Select a step in the current Step Grid before pasting.");
        return;
      }
      const targetStep = Math.max(0, Math.min(stepCount - 1, stepSelectionAnchor.step));
      const pasted = new Set();
      clipboard.items.forEach((item) => {
        const track = tracks[targetTrackIndex + item.trackOffset];
        const step = targetStep + item.stepOffset;
        if (!track || step < 0 || step >= stepCount) return;
        track.cells[step] = item.value;
        pasted.add(`${track.id}:${step}`);
      });
      if (!pasted.size) {
        showToast("There is no room to paste those steps at the selected position.");
        return;
      }
      stepSelectionAnchor = { trackId: tracks[targetTrackIndex].id, step: targetStep };
      state.selectedStepCells = pasted;
      captureCurrentPattern();
      renderTracks();
      saveState();
      return;
    }
    const offset = snapArrangementBar(state.arrangementCursor + clipboard.pasteCount * clipboard.span);
    const selection = new Set();
    const items = clipboard.items || [];
    const itemTypes = new Set(items.map((item) => item.type));
    const pasteType = clipboard.trackCopy?.type || (itemTypes.size === 1 ? [...itemTypes][0] : null);
    const selectedPatternTrack = state.patterns.find((pattern) => pattern.id === state.selectedMixerTrackId &&
      state.patternClips.some((clip) => (clip.trackId || clip.patternId) === pattern.id));
    const selectedTarget = selectedPatternTrack
      ? { type: "pattern", id: selectedPatternTrack.id }
      : state.melTracks.some((track) => track.id === state.selectedMixerTrackId)
        ? { type: "mel", id: state.selectedMixerTrackId }
        : state.arrangementTracks.some((track) => track.id === state.selectedMixerTrackId)
          ? { type: "audio", id: state.selectedMixerTrackId }
          : null;
    const targetMatches = pasteType && itemTypes.size <= 1 && selectedTarget?.type === pasteType;
    const makeTrackCopy = Boolean(clipboard.trackCopy && (
      newTrack || !targetMatches || selectedTarget.id === clipboard.trackCopy.sourceTrackId || !items.length
    ));
    const makeNewTracks = newTrack || makeTrackCopy;
    const destinationBySource = new Map();
    const pastedTrackIds = new Set();
    const getDestinationTrackId = (item) => {
      if (targetMatches && !makeNewTracks) return selectedTarget.id;
      const sourceTrackId = item.sourceTrackId || item.clip.trackId || item.patternId;
      const sourceKey = `${item.type}:${sourceTrackId}`;
      if (destinationBySource.has(sourceKey)) return destinationBySource.get(sourceKey);
      if (!makeNewTracks) {
        const sourceTrack = item.type === "pattern"
          ? state.patterns.find((track) => track.id === sourceTrackId)
          : item.type === "mel"
            ? state.melTracks.find((track) => track.id === sourceTrackId)
            : state.arrangementTracks.find((track) => track.id === sourceTrackId);
        if (sourceTrack) {
          destinationBySource.set(sourceKey, sourceTrack.id);
          return sourceTrack.id;
        }
      }
      const trackSnapshot = item.track || clipboard.trackCopy?.track;
      const destinationId = createArrangementPasteTrack(item.type, sourceTrackId, trackSnapshot);
      if (destinationId) {
        destinationBySource.set(sourceKey, destinationId);
        pastedTrackIds.add(destinationId);
      }
      return destinationId;
    };
    if (!items.length && clipboard.trackCopy) {
      const destinationId = createArrangementPasteTrack(
        clipboard.trackCopy.type, clipboard.trackCopy.sourceTrackId, clipboard.trackCopy.track,
      );
      if (destinationId) pastedTrackIds.add(destinationId);
    }
    items.forEach((item) => {
      const startBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 0.001, snapArrangementBar(offset + item.startOffset)));
      if (item.type === "pattern") {
        const pattern = getPattern(item.patternId);
        if (!pattern) return;
        const trackId = getDestinationTrackId(item);
        if (!trackId) return;
        const trackPattern = getPattern(trackId);
        if (trackPattern && !state.patternClips.some((clip) => (clip.trackId || clip.patternId) === trackId)) {
          trackPattern.insertAfterTrackId = getLastArrangementTrackId();
        }
        const durationBars = getArrangementClipDuration("pattern", item.clip);
        const patternStart = clampArrangementStart(startBar, durationBars);
        const clip = {
          ...item.clip, id: makeId(), patternId: item.patternId, trackId,
          repeatCount: item.repeatCount, startBar: patternStart,
        };
        state.patternClips.push(clip);
        selection.add(arrangementSelectionKey("pattern", clip.id));
      } else if (item.type === "mel") {
        if (!getMel(item.melId)) return;
        const melLength = getArrangementClipDuration("mel", item.clip);
        const clipStart = clampArrangementStart(startBar, melLength);
        const destinationId = getDestinationTrackId(item);
        if (!destinationId) return;
        let track = state.melTracks.find((candidate) => candidate.id === destinationId);
        if (!track) {
          return;
        }
        const clip = { ...item.clip, id: makeId(), melId: item.melId, startBar: clipStart };
        track.clips.push(clip);
        selection.add(arrangementSelectionKey("mel", clip.id));
      } else if (item.type === "audio") {
        const clipStart = clampArrangementStart(startBar, getArrangementClipDuration("audio", item.clip));
        const destinationId = getDestinationTrackId(item);
        if (!destinationId) return;
        let track = state.arrangementTracks.find((candidate) => candidate.id === destinationId);
        if (!track) {
          return;
        }
        const clip = { ...item.clip, id: makeId(), startBar: clipStart };
        track.clips.push(clip);
        selection.add(arrangementSelectionKey("audio", clip.id));
        if (clip.blob) persistClip(track, clip).catch(() => showToast("The copied recording was pasted, but could not be saved."));
      }
    });
    if (!selection.size && !pastedTrackIds.size) {
      showToast("The copied arrangement items are no longer available.");
      return;
    }
    state.selectedArrangementItems = selection;
    state.arrangementSelectionFromMarquee = false;
    state.selectedMixerTrackId = [...pastedTrackIds].at(-1) || selectedTarget?.id || state.selectedMixerTrackId;
    clipboard.pasteCount += 1;
    updateArrangementLength();
    renderArrangement();
    saveState();
  }

  function selectArrangementItem(type, id, event) {
    const key = arrangementSelectionKey(type, id);
    if (event.type === "dragstart") arrangementMarqueeDeselectPending = false;
    state.arrangementSelectionFromMarquee = false;
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
      deleteSelectedArrangementItems(new Set([...state.selectedArrangementItems, key]));
      return false;
    }
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    if (event.shiftKey) state.selectedArrangementItems.add(key);
    else state.selectedArrangementItems = new Set([key]);
    updateArrangementSelection();
    return true;
  }

  function deleteSelectedArrangementItems(selection = state.selectedArrangementItems) {
    let deleted = false;
    const has = (type, id) => selection.has(arrangementSelectionKey(type, id));
    const nextPatterns = state.patternClips.filter((clip) => {
      const keep = !has("pattern", clip.id);
      deleted ||= !keep;
      return keep;
    });
    state.patternClips = nextPatterns;
    state.melTracks.forEach((track) => {
      track.clips = track.clips.filter((clip) => {
        const keep = !has("mel", clip.id);
        deleted ||= !keep;
        return keep;
      });
    });
    state.melTracks = state.melTracks.filter((track) => {
      if (track.clips.length) return true;
      disconnectTrackAudio(track);
      return false;
    });
    state.arrangementTracks.forEach((track) => {
      track.clips = track.clips.filter((clip) => {
        const keep = !has("audio", clip.id);
        if (!keep) {
          deleted = true;
          deletePersistedClip(clip.id);
        }
        return keep;
      });
    });
    state.arrangementTracks = state.arrangementTracks.filter((track) => {
      if (track.clips.length) return true;
      disconnectTrackAudio(track);
      return false;
    });
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    if (!deleted) return false;
    updateArrangementLength();
    renderArrangement();
    saveState();
    return true;
  }

  function splitArrangementItemsAtCursor(bar = state.arrangementCursor) {
    const splitKeys = new Set();
    const hasSelection = state.selectedArrangementItems.size > 0;
    const cursor = snapArrangementBar(bar);
    setArrangementCursor(cursor);
    let splitCount = 0;
    let audioMelAdded = false;
    const canSplit = (type, clip) => {
      const selected = state.selectedArrangementItems.has(arrangementSelectionKey(type, clip.id));
      const start = clip.startBar;
      const end = start + getArrangementClipDuration(type, clip);
      return (!hasSelection || selected) && cursor > start + 0.0001 && cursor < end - 0.0001;
    };

    state.patternClips.forEach((clip) => {
      if (!canSplit("pattern", clip)) return;
      const leftDuration = cursor - clip.startBar;
      const totalDuration = getArrangementClipDuration("pattern", clip);
      const tempoRatio = getArrangementClipTempoRatio(clip);
      const sourceStart = getArrangementClipSourcePosition(
        clip.sourceOffsetBars || 0, 0, clip.repeatStartBars, clip.repeatLengthBars,
      );
      const leftSourceDuration = leftDuration / tempoRatio;
      const rightSourceStart = getArrangementClipSourcePosition(
        clip.sourceOffsetBars || 0, leftSourceDuration, clip.repeatStartBars, clip.repeatLengthBars,
      );
      const rightSourceDuration = (totalDuration - leftDuration) / tempoRatio;
      clip.durationBars = leftSourceDuration;
      clip.sourceOffsetBars = sourceStart;
      clip.repeatStartBars = sourceStart;
      clip.repeatLengthBars = leftSourceDuration;
      clip.repeatCount = 1;
      const right = {
        ...clip,
        id: makeId(),
        startBar: cursor,
        durationBars: rightSourceDuration,
        sourceOffsetBars: rightSourceStart,
        repeatStartBars: rightSourceStart,
        repeatLengthBars: rightSourceDuration,
      };
      state.patternClips.push(right);
      splitKeys.add(arrangementSelectionKey("pattern", clip.id));
      splitKeys.add(arrangementSelectionKey("pattern", right.id));
      splitCount += 1;
    });
    state.patternClips.sort((left, right) => left.startBar - right.startBar);

    state.melTracks.forEach((track) => {
      track.clips.slice().forEach((clip) => {
        if (!canSplit("mel", clip)) return;
        const leftDuration = cursor - clip.startBar;
        const totalDuration = getArrangementClipDuration("mel", clip);
        const tempoRatio = getArrangementClipTempoRatio(clip);
        const sourceStart = getArrangementClipSourcePosition(
          clip.sourceOffsetBars || 0, 0, clip.repeatStartBars, clip.repeatLengthBars,
        );
        const leftSourceDuration = leftDuration / tempoRatio;
        const rightSourceStart = getArrangementClipSourcePosition(
          clip.sourceOffsetBars || 0, leftSourceDuration, clip.repeatStartBars, clip.repeatLengthBars,
        );
        const rightSourceDuration = (totalDuration - leftDuration) / tempoRatio;
        clip.durationBars = leftSourceDuration;
        clip.sourceOffsetBars = sourceStart;
        clip.repeatStartBars = sourceStart;
        clip.repeatLengthBars = leftSourceDuration;
        clip.repeatCount = 1;
        const right = {
          ...clip,
          id: makeId(),
          startBar: cursor,
          durationBars: rightSourceDuration,
          sourceOffsetBars: rightSourceStart,
          repeatStartBars: rightSourceStart,
          repeatLengthBars: rightSourceDuration,
        };
        track.clips.push(right);
        splitKeys.add(arrangementSelectionKey("mel", clip.id));
        splitKeys.add(arrangementSelectionKey("mel", right.id));
        splitCount += 1;
      });
      track.clips.sort((left, right) => left.startBar - right.startBar);
    });

    state.arrangementTracks.forEach((track) => {
      track.clips.slice().forEach((clip) => {
        if (!canSplit("audio", clip)) return;
        const secondsPerBar = 240 / state.bpm;
        const leftDuration = (cursor - clip.startBar) * secondsPerBar * getAudioClipTempoRatio(clip);
        const totalDuration = clip.durationSeconds ?? clip.buffer.duration;
        const sourceStart = getArrangementClipSourcePosition(
          clip.sourceOffsetSeconds || 0, 0, clip.repeatStartSeconds, clip.repeatLengthSeconds,
        );
        const rightSourceStart = getArrangementClipSourcePosition(
          clip.sourceOffsetSeconds || 0, leftDuration, clip.repeatStartSeconds, clip.repeatLengthSeconds,
        );
        clip.durationSeconds = leftDuration;
        clip.sourceOffsetSeconds = sourceStart;
        clip.repeatStartSeconds = sourceStart;
        clip.repeatLengthSeconds = leftDuration;
        clip.repeatCount = 1;
        clip.fadeOutSeconds = 0;
        const right = {
          ...clip,
          id: makeId(),
          startBar: cursor,
          durationSeconds: totalDuration - leftDuration,
          sourceOffsetSeconds: rightSourceStart,
          repeatStartSeconds: rightSourceStart,
          repeatLengthSeconds: totalDuration - leftDuration,
          fadeInSeconds: 0,
        };
        audioMelAdded = ensureAudioClipMel(clip) || audioMelAdded;
        audioMelAdded = ensureAudioClipMel(right) || audioMelAdded;
        track.clips.push(right);
        splitKeys.add(arrangementSelectionKey("audio", clip.id));
        splitKeys.add(arrangementSelectionKey("audio", right.id));
        if (clip.blob) persistClip(track, clip).catch(() => showToast("Clip split, but browser storage could not be updated."));
        if (right.blob) persistClip(track, right).catch(() => showToast("Clip split, but browser storage could not be updated."));
        splitCount += 1;
      });
      track.clips.sort((left, right) => left.startBar - right.startBar);
    });

    if (!splitCount) {
      showToast(hasSelection ? "Move the playhead inside a selected clip to split it." : "Move the playhead inside a clip to split it.");
      return;
    }
    state.selectedArrangementItems = splitKeys;
    state.arrangementSelectionFromMarquee = false;
    if (audioMelAdded) renderMelOptions();
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast(`Split ${splitCount} clip${splitCount === 1 ? "" : "s"}`);
  }

  function placeCurrentEditorAtPlayhead() {
    if (state.view === "sequencer") {
      const pattern = getPattern();
      const hasSteps = pattern && getPatternTrackIds(pattern).some((trackId) =>
        pattern.cells?.[trackId]?.slice(0, getGridStepCount(pattern)).some(Boolean));
      if (!pattern || !hasSteps) {
        showToast("Add steps to the pattern before placing it in Track View.");
        return;
      }
      const selectedPatternTrack = state.patterns.find((item) => item.id === state.selectedMixerTrackId);
      const selectedMixerBus = state.selectedMixerTrackId === MASTER_MIXER_TRACK_ID ||
        state.effectTracks.some((track) => track.id === state.selectedMixerTrackId);
      let destinationTrackId = selectedPatternTrack?.id;
      if (!destinationTrackId) {
        if (state.selectedMixerTrackId === DEFAULT_ARRANGEMENT_TRACK_ID || selectedMixerBus) {
          destinationTrackId = pattern.id;
        } else {
          const newTrackPattern = createPatternLaneCopy(pattern);
          destinationTrackId = newTrackPattern.id;
        }
      }
      addPatternClip(state.arrangementCursor, pattern.id, destinationTrackId);
      selectArrangementTrack(destinationTrackId);
      return;
    }
    if (state.view === "piano-roll") {
      captureCurrentMel();
      const mel = getMel();
      if (!mel?.notes.length) {
        showToast("Add notes to the Piano Roll before placing it in Track View.");
        return;
      }
      const selectedMelTrack = state.melTracks.find((track) => track.id === state.selectedMixerTrackId);
      if (selectedMelTrack) {
        addMelClip(mel.id, selectedMelTrack.id, state.arrangementCursor);
      } else {
        const newMelTrack = addMelTrack(mel.id, state.arrangementCursor);
        if (newMelTrack) selectArrangementTrack(newMelTrack.id);
      }
    }
  }

  function nudgeSelectedArrangementItems(direction) {
    if (!state.selectedArrangementItems.size) return false;
    const selected = [];
    state.patternClips.forEach((clip) => {
      if (state.selectedArrangementItems.has(arrangementSelectionKey("pattern", clip.id))) {
        const pattern = getPattern(clip.patternId);
        if (pattern) selected.push({ clip, length: getArrangementClipDuration("pattern", clip) });
      }
    });
    state.melTracks.forEach((track) => track.clips.forEach((clip) => {
      if (state.selectedArrangementItems.has(arrangementSelectionKey("mel", clip.id))) {
        if (getMel(clip.melId)) selected.push({ clip, length: getArrangementClipDuration("mel", clip) });
      }
    }));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
      if (state.selectedArrangementItems.has(arrangementSelectionKey("audio", clip.id))) {
        selected.push({ clip, length: getArrangementClipDuration("audio", clip) });
      }
    }));
    if (!selected.length) return false;
    const minStart = Math.min(...selected.map(({ clip }) => clip.startBar));
    const maxEnd = Math.max(...selected.map(({ clip, length }) => clip.startBar + length));
    const delta = Math.max(-minStart, Math.min(MAX_ARRANGEMENT_BARS - maxEnd, direction));
    if (!delta) return false;
    selected.forEach(({ clip, length }) => {
      clip.startBar = clampArrangementStart(clip.startBar + delta, length);
    });
    renderArrangement();
    saveState();
    return true;
  }

  function startArrangementSelection(event) {
    if (event.button !== 0 || !event.target.closest(".timeline-lane") ||
      event.target.closest("[data-selectable-type]")) return;
    const content = $("#timeline-content");
    const startX = event.clientX;
    const startY = event.clientY;
    const subtractive = event.altKey;
    const additive = event.shiftKey && !subtractive;
    let marquee = null;
    let moved = false;
    const update = (moveEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
      moved = true;
      arrangementMarqueeDeselectPending = false;
      moveEvent.preventDefault();
      if (!marquee) {
        marquee = document.createElement("div");
        marquee.className = "selection-marquee";
        content.append(marquee);
      }
      const bounds = content.getBoundingClientRect();
      marquee.style.left = `${Math.min(startX, moveEvent.clientX) - bounds.left}px`;
      marquee.style.top = `${Math.min(startY, moveEvent.clientY) - bounds.top}px`;
      marquee.style.width = `${Math.abs(moveEvent.clientX - startX)}px`;
      marquee.style.height = `${Math.abs(moveEvent.clientY - startY)}px`;
    };
    const finish = () => {
      document.removeEventListener("pointermove", update);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      if (!moved) return;
      const selection = marquee.getBoundingClientRect();
      const next = new Set(additive || subtractive ? state.selectedArrangementItems : []);
      document.querySelectorAll("[data-selectable-type][data-clip-id]").forEach((item) => {
        const bounds = item.getBoundingClientRect();
        if (bounds.left <= selection.right && bounds.right >= selection.left &&
          bounds.top <= selection.bottom && bounds.bottom >= selection.top) {
          const itemKey = arrangementSelectionKey(item.dataset.selectableType, item.dataset.clipId);
          if (subtractive) next.delete(itemKey);
          else next.add(itemKey);
        }
      });
      state.selectedArrangementItems = next;
      state.arrangementSelectionFromMarquee = true;
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      state.pianoSelectionFromMarquee = false;
      document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      updateArrangementSelection();
    };
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function setWorkspaceView(view, force = false) {
    if (view === state.view && !force && !state.workspaceHidden) return;
    if (view !== "dj" && djViewExpanded) setDjViewExpanded(false, false);
    if (state.stepPianoEditContext && view !== "piano-roll") closeStepInstrumentPianoRoll();
    if (state.keyboardRecordingCountdown && view !== "piano-roll") cancelKeyboardRecordingCountdown();
    if (state.isPlaying) stopPlayback();
    if (view !== "piano-roll") {
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      state.pianoSelectionFromMarquee = false;
    }
    state.view = view;
    state.workspaceHidden = false;
    state.lastInteractedViewArea = view === "arrangement" ? "track-view" : "workspace";
    sendCollaborationView();
    const showSequencer = view === "sequencer";
    const showPianoRoll = view === "piano-roll";
    const showMixer = view === "mixer";
    const showDJ = view === "dj";
    $("#arrangement-heading").hidden = showSequencer || showPianoRoll || showMixer || showDJ;
    $("#arrangement-view").hidden = false;
    document.body.classList.toggle("is-beat-grid-open", showSequencer);
    $("#sequencer-view").hidden = !showSequencer;
    $("#piano-roll-view").hidden = !showPianoRoll;
    $("#mixer-view").hidden = !showMixer;
    $("#dj-view").hidden = !showDJ;
    if (showDJ) renderDjView();
    refreshDjVisualTimer();
    $("#sequencer-tab").classList.toggle("is-selected", showSequencer);
    $("#sequencer-tab").setAttribute("aria-selected", String(showSequencer));
    $("#arrangement-tab").classList.toggle("is-selected", view === "arrangement");
    $("#arrangement-tab").setAttribute("aria-selected", String(view === "arrangement"));
    $("#piano-roll-tab").classList.toggle("is-selected", showPianoRoll);
    $("#piano-roll-tab").setAttribute("aria-selected", String(showPianoRoll));
    $("#mixer-tab").classList.toggle("is-selected", showMixer);
    $("#dj-tab").classList.toggle("is-selected", showDJ);
    $("#dj-tab").setAttribute("aria-selected", String(showDJ));
    $("#mixer-tab").setAttribute("aria-selected", String(showMixer));
    document.querySelectorAll(".workspace-open-button").forEach((button) => {
      button.classList.toggle("is-active", (button.id === "open-beat-grid-button" && showSequencer) || (button.id === "open-piano-roll-button" && showPianoRoll));
      button.setAttribute("aria-pressed", String((button.id === "open-beat-grid-button" && showSequencer) || (button.id === "open-piano-roll-button" && showPianoRoll)));
    });
    if (showSequencer) {
      renderTracks();
      renderPresets();
      renderPatternSelectors();
    }
    if (showPianoRoll) {
      updateStepPianoEditorControls();
      renderMelOptions();
      renderPianoInstrumentOptions();
      renderPianoRoll();
    }
    renderArrangement();
    renderViewLayout();
    updateCollaborationLockUi();
    saveState();
  }

  function requestRecordingImport(trackId = null) {
    state.pendingImportTrackId = trackId;
    const input = $("#recording-input");
    input.value = "";
    input.click();
  }

  async function importRecording(file, trackId = null, startBar = state.arrangementCursor, snapStart = true) {
    if (!isAudioFile(file)) {
      showToast(`"${file.name}" is not an audio file.`);
      return null;
    }
    try {
      await ensureAudio();
      const buffer = await state.audioContext.decodeAudioData(await file.arrayBuffer());
      const audioMetadata = detectAudioMetadata(buffer);
      const projectWasEmpty = isProjectEmptyForAudioImport();
      const detectedMetadata = normalizeAudioMetadata(audioMetadata);
      const tempoChoice = await askAudioTempoChoice(file.name, detectedMetadata.bpm, state.bpm);
      const sourceOffsetSeconds = Number.isFinite(detectedMetadata.beatOffsetSeconds)
        ? Math.max(0, Math.min(buffer.duration - 0.01, detectedMetadata.beatOffsetSeconds))
        : 0;
      const alignmentNotice = sourceOffsetSeconds > 0.02
        ? ` Aligned the detected first beat; ${sourceOffsetSeconds.toFixed(2)} s of lead-in is trimmed. Drag the clip's left edge to restore it.`
        : "";
      let projectTempoChanged = false;
      if (tempoChoice.action === "project-to-audio" && detectedMetadata.bpm !== null) {
        const bpm = Math.max(60, Math.min(180, roundBpm(detectedMetadata.bpm)));
        if (bpm !== state.bpm) projectTempoChanged = await openProjectTempoChangeDialog(bpm);
      }
      const audioAdjustment = getAudioClipProjectAdjustment(audioMetadata,
        tempoChoice.action === "audio-to-project" ? tempoChoice.targetBpm : null);
      let track = state.arrangementTracks.find((item) => item.id === trackId);
      if (!track) track = createArrangementTrack(file.name);
      else if (!track.clips.length && /^Track \d+$/.test(track.name)) track.name = file.name;
      const clip = {
        id: makeId(), name: file.name, buffer,
        audioStemGroupId: makeId(),
        repeatCount: 1,
        durationSeconds: buffer.duration - sourceOffsetSeconds,
        sourceOffsetSeconds,
        startBar: 0,
        blob: file,
        audioMetadata,
        ...(audioAdjustment ? { audioAdjustment } : {}),
        ...(tempoChoice.action === "audio-to-project" && audioAdjustment
          ? { tempoRatioOverride: audioAdjustment.tempoRatio } : {}),
      };
      clip.startBar = snapStart
        ? clampArrangementStart(startBar, getArrangementClipDuration("audio", clip))
        : Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - getArrangementClipDuration("audio", clip), startBar));
      track.clips.push(clip);
      track.clips.sort((left, right) => left.startBar - right.startBar);
      updateArrangementLength();
      renderArrangement();
      updateProjectKeyIndicator();
      if (state.view === "dj") renderDjView();
      saveState();
      try {
        await persistClip(track, clip);
      } catch {
        showToast("Recording added for this session, but browser storage is unavailable.");
      }
      if (audioAdjustment) {
        const targets = [
          audioAdjustment.targetKey,
          audioAdjustment.targetBpm ? `${audioAdjustment.targetBpm} BPM` : null,
        ].filter(Boolean);
        const projectTempoNotice = projectTempoChanged
          ? ` Project set to ${state.bpm} BPM.` : "";
        if (targets.length) showToast(`${file.name} matched to ${targets.join(" and ")}.${projectTempoNotice}${alignmentNotice}`);
        else showToast(`${file.name} added.${projectTempoNotice}${alignmentNotice}`);
      } else if (projectTempoChanged) {
        showToast(`${file.name} added. Project set to ${state.bpm} BPM.${alignmentNotice}`);
      } else if (tempoChoice.action === "project-to-audio" && detectedMetadata.bpm !== null) {
        showToast(`${file.name} added. Project tempo left at ${state.bpm} BPM.${alignmentNotice}`);
      } else if (projectWasEmpty) {
        const message = projectTempoChanged
          ? `Project set to ${state.bpm} BPM from ${file.name}.`
          : tempoChoice.action === "audio-to-project" && detectedMetadata.bpm !== null
            ? `Added ${file.name} at ${state.bpm} BPM.`
            : `Added ${file.name} without changing tempo.`;
        showToast(`${message}${alignmentNotice}`);
      } else if (alignmentNotice) {
        showToast(`${file.name}.${alignmentNotice}`);
      }
      return clip;
    } catch (error) {
      showToast(`Could not import ${file.name}: ${error.message || "unsupported audio format"}`);
      return null;
    }
  }

  function stopRecordingMetronome() {
    if (state.recordingMetronomeTimer !== null) window.clearInterval(state.recordingMetronomeTimer);
    state.recordingMetronomeTimer = null;
  }

  function startRecordingMetronome() {
    stopRecordingMetronome();
    state.recordingClickIndex = 0;
    state.nextRecordingClickTime = state.audioContext.currentTime + 0.02;
    const scheduleClicks = () => {
      while (state.nextRecordingClickTime < state.audioContext.currentTime + 0.12) {
        triggerClick(state.nextRecordingClickTime, state.recordingClickIndex % 4 === 0);
        state.recordingClickIndex += 1;
        state.nextRecordingClickTime += 60 / state.bpm;
      }
    };
    scheduleClicks();
    state.recordingMetronomeTimer = window.setInterval(scheduleClicks, 25);
  }

  function resetRecordingControls() {
    $("#record-audio-button").classList.remove("is-recording");
    $("#record-audio-button").disabled = false;
    $("#record-audio-button").setAttribute("aria-pressed", "false");
    $("#record-button-label").textContent = "Record input";
  }

  function extendArrangementForRecording(endBar) {
    const previousBars = state.arrangementBars;
    const nextBars = Math.min(MAX_ARRANGEMENT_BARS, Math.max(previousBars, Math.ceil(endBar)));
    if (nextBars === previousBars) return;

    state.arrangementBars = nextBars;
    if (state.playbackStartTime && state.isPlaying && state.playbackMode === "arrangement") {
      state.playbackEndTime = state.playbackStartTime +
        (nextBars - state.playbackStartBar) * (240 / state.bpm);
    }
    const width = nextBars * BAR_WIDTH;
    const content = $("#timeline-content");
    const ruler = content.querySelector(".timeline-ruler");
    content.style.width = `${width}px`;
    ruler.style.width = `${width}px`;
    ruler.style.gridTemplateColumns = `repeat(${nextBars}, ${BAR_WIDTH}px)`;
    for (let bar = previousBars; bar < nextBars; bar += 1) {
      const marker = document.createElement("div");
      marker.className = "timeline-bar";
      marker.textContent = `BAR ${String(bar + 1).padStart(2, "0")}`;
      ruler.append(marker);
    }
    content.querySelectorAll(".timeline-lane").forEach((lane) => {
      lane.style.width = `${width}px`;
    });
    $("#arrangement-bar-label").textContent = `${nextBars} BARS`;
    updateArrangementCursorMarker();
  }

  function drawRecordingWaveform(preview) {
    const bounds = preview.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.min(16384, Math.ceil(bounds.width * pixelRatio));
    const height = Math.min(512, Math.ceil(bounds.height * pixelRatio));
    if (preview.canvas.width !== width || preview.canvas.height !== height) {
      preview.canvas.width = width;
      preview.canvas.height = height;
    }

    const context = preview.canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(preview.element).getPropertyValue("--clip-color");
    const barWidth = Math.max(1, width / Math.max(1, preview.waveform.length) * 0.55);
    preview.waveform.forEach((value, index) => {
      const barHeight = Math.max(2, value * height * 0.82);
      const x = index / Math.max(1, preview.waveform.length) * width;
      context.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
    });
  }

  function updateRecordingPreview() {
    const preview = state.recordingPreview;
    if (!preview) return;

    const elapsedSeconds = Math.min(
      (performance.now() - preview.startedAt) / 1000,
      (MAX_ARRANGEMENT_BARS - preview.startBar) * (240 / state.bpm),
    );
    const durationBars = elapsedSeconds / (240 / state.bpm);
    const endBar = preview.startBar + durationBars;
    extendArrangementForRecording(endBar);
    state.arrangementCursor = Math.max(0, Math.min(state.arrangementBars - 0.001, endBar));
    updateArrangementCursorMarker();

    preview.element.style.left = `${preview.startBar * BAR_WIDTH}px`;
    preview.element.style.width = `${Math.max(4, durationBars * BAR_WIDTH)}px`;
    preview.element.setAttribute("aria-label", `Recording from bar ${Math.floor(preview.startBar) + 1}`);
    const lane = Array.from($("#timeline-content").querySelectorAll(".timeline-lane"))
      .find((item) => item.dataset.trackId === preview.track.id);
    if (lane && !preview.element.isConnected) {
      lane.insertBefore(preview.element, lane.querySelector(".arrangement-cursor"));
    }

    const samples = new Uint8Array(preview.analyser.fftSize);
    preview.analyser.getByteTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, sample) => {
      const value = (sample - 128) / 128;
      return sum + value * value;
    }, 0) / samples.length);
    if (preview.waveform.length >= 4000) {
      preview.waveform = preview.waveform.reduce((compressed, value, index, values) => {
        if (index % 2 === 0) compressed.push(Math.max(value, values[index + 1] || value));
        return compressed;
      }, []);
    }
    preview.waveform.push(rms);
    drawRecordingWaveform(preview);

    const timeline = $("#timeline-scroll");
    const recordingEndX = endBar * BAR_WIDTH;
    if (timeline.clientWidth > 0) {
      timeline.scrollLeft = Math.max(0, Math.min(
        timeline.scrollWidth - timeline.clientWidth,
        recordingEndX - timeline.clientWidth * 0.72,
      ));
    }

    if (endBar >= MAX_ARRANGEMENT_BARS && state.mediaRecorder?.state === "recording") {
      showToast(`Recording stopped at the ${MAX_ARRANGEMENT_BARS}-bar limit.`);
      state.mediaRecorder.stop();
    }
  }

  function startRecordingPreview(stream) {
    let track = null;
    let analyser = null;
    let source = null;
    try {
      track = createArrangementTrack("Recording");
      analyser = state.audioContext.createAnalyser();
      analyser.fftSize = 512;
      source = state.audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const element = document.createElement("div");
      element.className = "audio-clip is-recording";
      element.style.setProperty("--clip-color", "#ff777f");
      element.setAttribute("role", "img");
      const canvas = document.createElement("canvas");
      canvas.className = "recording-waveform";
      canvas.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "clip-name";
      name.textContent = "RECORDING";
      element.append(canvas, name);

      const preview = {
        track,
        startBar: state.recordingStartBar,
        startedAt: performance.now(),
        analyser,
        source,
        element,
        canvas,
        waveform: [],
      };
      state.recordingPreview = preview;
      renderArrangement();
      updateRecordingPreview();
      state.recordingPreviewTimer = window.setInterval(updateRecordingPreview, 100);
    } catch (error) {
      state.recordingPreview = null;
      source?.disconnect();
      analyser?.disconnect();
      if (track) state.arrangementTracks = state.arrangementTracks.filter((item) => item !== track);
      throw error;
    }
  }

