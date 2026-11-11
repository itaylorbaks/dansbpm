  function createTimelineLane(trackId, width) {
    const lane = document.createElement("div");
    lane.className = "timeline-lane";
    lane.dataset.trackId = trackId;
    lane.style.width = `${width}px`;
    lane.style.setProperty("--bar-width", `${BAR_WIDTH}px`);
    lane.style.setProperty("--beat-width", `${BAR_WIDTH / 4}px`);
    lane.addEventListener("click", (event) => {
      if (state.suppressArrangementClick) {
        state.suppressArrangementClick = false;
        return;
      }
      if (event.target.closest("[data-selectable-type]")) return;
      setArrangementCursor(barAtPointer(event, lane));
    });
    lane.addEventListener("dragover", (event) => {
      event.preventDefault();
      lane.classList.add("is-drop-target");
      if (event.dataTransfer) {
        const transferTypes = Array.from(event.dataTransfer.types || []);
        const isCopy = event.dataTransfer.files.length ||
          transferTypes.includes("application/x-pulsegrid-pattern-source") ||
          transferTypes.includes("application/x-pulsegrid-mel-source") ||
          transferTypes.includes("application/x-pulsegrid-audio-source") ||
          transferTypes.includes("application/x-pulsegrid-instrument-source");
        event.dataTransfer.dropEffect = isCopy ? "copy" : "move";
      }
      updateArrangementDragPreview(event, lane);
    });
    lane.addEventListener("dragleave", (event) => {
      if (!lane.contains(event.relatedTarget)) {
        lane.classList.remove("is-drop-target");
        lane.querySelector(":scope > .arrangement-drag-preview")?.remove();
      }
    });
    lane.addEventListener("drop", async (event) => {
      event.preventDefault();
      lane.classList.remove("is-drop-target");
      const startBar = arrangementDropStartAtPointer(event, lane);
      clearArrangementDragPreview();
      const isPatternLane = trackId.startsWith("pattern:");
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length) {
        const audioTrackId = state.arrangementTracks.some((track) => track.id === trackId) ? trackId : null;
        for (const file of files) await importRecording(file, audioTrackId, startBar);
        return;
      }
      const instrumentSource = event.dataTransfer?.getData("application/x-pulsegrid-instrument-source");
      if (instrumentSource) {
        try {
          const { instrumentId } = JSON.parse(instrumentSource);
          if (!state.tracks.some((track) => track.id === instrumentId)) {
            showToast("That instrument is no longer available.");
            return;
          }
          createEmptyMelTrack(instrumentId);
        } catch {
          showToast("That instrument track could not be created.");
        }
        return;
      }
      const audioSource = event.dataTransfer?.getData("application/x-pulsegrid-audio-source");
      if (audioSource) {
        try {
          const { sourceTrackId, clipId } = JSON.parse(audioSource);
          addAudioAssetClip(sourceTrackId, clipId, trackId, startBar);
        } catch {
          showToast("That audio asset could not be added.");
        }
        return;
      }
      const melSource = event.dataTransfer?.getData("application/x-pulsegrid-mel-source");
      if (melSource) {
        try {
          const { melId } = JSON.parse(melSource);
          if (trackId.startsWith("mel:")) addMelClip(melId, trackId.slice(4), startBar);
          else {
            const melTrack = addMelTrack(melId, startBar);
            if (trackId === DEFAULT_ARRANGEMENT_TRACK_ID && melTrack) selectArrangementTrack(melTrack.id);
          }
        } catch {
          showToast("That Mel could not be added.");
        }
        return;
      }
      const melClipTransfer = event.dataTransfer?.getData("application/x-pulsegrid-mel-clip");
      if (melClipTransfer) {
        try {
          const { clipId, sourceTrackId } = JSON.parse(melClipTransfer);
          if (trackId.startsWith("mel:")) moveMelClip(clipId, sourceTrackId, trackId.slice(4), startBar);
          else moveMelClipToNewTrack(clipId, sourceTrackId, startBar);
        } catch {
          showToast("That Mel clip could not be moved.");
        }
        return;
      }
      const patternSource = event.dataTransfer?.getData("application/x-pulsegrid-pattern-source");
      if (patternSource) {
        try {
          const { patternId } = JSON.parse(patternSource);
          if (trackId === DEFAULT_ARRANGEMENT_TRACK_ID) {
            addPatternClip(startBar, patternId, patternId);
            selectArrangementTrack(patternId);
          } else if (isPatternLane) addPatternClip(startBar, patternId, trackId.slice("pattern:".length));
          else addPatternClipToNewTrack(startBar, patternId);
        } catch {
          showToast("That pattern could not be added.");
        }
        return;
      }
      const patternTransfer = event.dataTransfer?.getData("application/x-pulsegrid-pattern-clip");
      if (patternTransfer) {
        try {
          const { clipId } = JSON.parse(patternTransfer);
          if (isPatternLane) movePatternClip(clipId, startBar, trackId.slice("pattern:".length));
          else movePatternClipToNewTrack(clipId, startBar);
        } catch {
          showToast("That drum pattern could not be moved.");
        }
        return;
      }
      const audioTransfer = event.dataTransfer?.getData("application/x-pulsegrid-audio-clip");
      if (audioTransfer) {
        try {
          const { clipId, sourceTrackId } = JSON.parse(audioTransfer);
          if (state.arrangementTracks.some((track) => track.id === trackId)) {
            moveArrangementClip(clipId, sourceTrackId, trackId, startBar);
          } else {
            moveArrangementClipToNewTrack(clipId, sourceTrackId, startBar);
          }
        } catch {
          showToast("That audio clip could not be moved.");
        }
      }
    });
    const cursor = document.createElement("div");
    cursor.className = "arrangement-cursor";
    cursor.setAttribute("role", "slider");
    cursor.setAttribute("tabindex", "0");
    cursor.setAttribute("aria-label", "Track View playhead");
    cursor.setAttribute("aria-valuemin", "0");
    cursor.setAttribute("aria-valuemax", String(MAX_ARRANGEMENT_BARS));
    cursor.addEventListener("pointerdown", (event) => startArrangementCursorDrag(event));
    cursor.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      setArrangementCursor(state.arrangementCursor + (event.key === "ArrowRight" ? 0.25 : -0.25));
    });
    lane.append(cursor);
    return lane;
  }

  function barAtPointer(event, lane) {
    const bar = (event.clientX - lane.getBoundingClientRect().left) / BAR_WIDTH;
    return Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 0.001, snapArrangementBar(bar)));
  }

  function arrangementDropStartAtPointer(event, lane) {
    const drag = state.arrangementDrag;
    if (!drag) return barAtPointer(event, lane);
    const pointerBar = (event.clientX - lane.getBoundingClientRect().left) / BAR_WIDTH;
    return clampArrangementStart(pointerBar - drag.grabOffsetBars, drag.durationBars);
  }

  function startArrangementCursorDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const scroll = $("#timeline-scroll");
    let pointerX = event.clientX;
    let animationFrame = null;
    const updateCursor = () => {
      if (scroll.clientWidth === 0) return false;
      const bounds = scroll.getBoundingClientRect();
      const left = bounds.left + scroll.clientLeft;
      const right = left + scroll.clientWidth;
      const edgeSize = Math.min(48, scroll.clientWidth / 4);
      let scrollDelta = 0;
      if (pointerX < left + edgeSize) {
        scrollDelta = -Math.ceil((left + edgeSize - pointerX) / edgeSize * 12);
      } else if (pointerX > right - edgeSize) {
        scrollDelta = Math.ceil((pointerX - (right - edgeSize)) / edgeSize * 12);
      }
      const previousScrollLeft = scroll.scrollLeft;
      scroll.scrollLeft = Math.max(0, Math.min(
        scroll.scrollWidth - scroll.clientWidth,
        previousScrollLeft + scrollDelta,
      ));
      const bar = (pointerX - left + scroll.scrollLeft) / BAR_WIDTH;
      setArrangementCursor(bar, false);
      return scroll.scrollLeft !== previousScrollLeft;
    };
    const autoScroll = () => {
      animationFrame = null;
      if (updateCursor()) animationFrame = window.requestAnimationFrame(autoScroll);
    };
    const update = (moveEvent) => {
      pointerX = moveEvent.clientX;
      if (updateCursor() && animationFrame === null) {
        animationFrame = window.requestAnimationFrame(autoScroll);
      }
    };
    const finish = (upEvent) => {
      if (upEvent) {
        pointerX = upEvent.clientX;
        updateCursor();
      }
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      document.removeEventListener("pointermove", update);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      saveState();
    };
    if (updateCursor()) animationFrame = window.requestAnimationFrame(autoScroll);
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function makeActivityWaveform(values, color, displayWidth) {
    const canvas = document.createElement("canvas");
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.min(16384, Math.max(1, Math.ceil(displayWidth * pixelRatio)));
    const height = Math.ceil(46 * pixelRatio);
    canvas.className = "clip-waveform-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return canvas;
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, pixelRatio * 0.65);
    context.globalAlpha = 0.88;
    const center = height / 2;
    for (let x = 0; x < width; x += 1) {
      const value = values[Math.min(values.length - 1, Math.floor(x / width * values.length))] || 0;
      const amplitude = Math.max(1, value * (height * 0.45));
      context.beginPath();
      context.moveTo(x + 0.5, center - amplitude);
      context.lineTo(x + 0.5, center + amplitude);
      context.stroke();
    }
    context.globalAlpha = 1;
    return canvas;
  }

  function getActivityWaveformSampleCount(displayWidth) {
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    return Math.min(4096, Math.max(1, Math.ceil(displayWidth * pixelRatio)));
  }

  function getPatternActivityWaveform(pattern, clip, durationBars, sampleCount) {
    const patternBars = pattern.steps / 16;
    const sourceOffset = clip.sourceOffsetBars || 0;
    const playableBars = Math.min(durationBars, Math.max(0, patternBars * (clip.repeatCount || 1) - sourceOffset));
    const stepCount = getGridStepCount(pattern);
    const tracks = getPatternTrackIds(pattern);
    const pianoNotes = Object.values(pattern.stepPianoNotes || {}).flat();
    return Array.from({ length: sampleCount }, (_, index) => {
      const position = (index + 0.5) / sampleCount * durationBars;
      if (!tracks.length || position >= playableBars) return 0;
      const sourcePosition = (sourceOffset + position) % patternBars;
      const stepPosition = sourcePosition / patternBars * stepCount;
      const step = Math.min(stepCount - 1, Math.floor(stepPosition));
      const phase = stepPosition - step;
      const active = tracks.reduce((count, trackId) => count + (pattern.cells?.[trackId]?.[step] ? 1 : 0), 0);
      const drumLevel = active
        ? Math.sqrt(active / tracks.length) * (0.28 + 0.72 * Math.exp(-phase * 4)) *
          (0.4 + 0.6 * Math.abs(Math.sin((phase * 3 + step) * Math.PI)))
        : 0;
      const sourceTick = sourcePosition * PIANO_TICKS_PER_BAR;
      const pianoLevel = pianoNotes.reduce((level, note) => {
        const duration = note.durationTicks || 1;
        if (sourceTick < note.startTick || sourceTick >= note.startTick + duration) return level;
        const notePhase = (sourceTick - note.startTick) / duration;
        const envelope = Math.min(1, notePhase * 12, (1 - notePhase) * 8);
        const texture = 0.45 + 0.55 * Math.abs(Math.sin(notePhase * Math.PI * 8));
        return Math.max(level, (note.velocity ?? 0.8) * envelope * texture);
      }, 0);
      return Math.max(drumLevel, pianoLevel);
    });
  }

  function getMelActivityWaveform(mel, clip, durationBars, sampleCount) {
    const sourceOffset = clip.sourceOffsetBars || 0;
    const melBars = getMelLengthBars(mel);
    const playableBars = Math.min(durationBars, Math.max(0, melBars * (clip.repeatCount || 1) - sourceOffset));
    return Array.from({ length: sampleCount }, (_, index) => {
      const position = sourceOffset + (index + 0.5) / sampleCount * durationBars;
      if (position >= sourceOffset + playableBars) return 0;
      const sourcePosition = position % melBars;
      return mel.notes.reduce((level, note) => {
        const start = note.startTick / PIANO_TICKS_PER_BAR;
        const duration = note.durationTicks / PIANO_TICKS_PER_BAR;
        const end = start + duration;
        if (sourcePosition < start || sourcePosition >= end) return level;
        const phase = (sourcePosition - start) / duration;
        const envelope = Math.min(1, phase * 12, (1 - phase) * 8);
        const texture = 0.45 + 0.55 * Math.abs(Math.sin(phase * Math.PI * 8));
        return Math.max(level, (note.velocity ?? 0.8) * envelope * texture);
      }, 0);
    });
  }

  function updateArrangementClipRepeatMarkers(element, clip, repeatLengthBars, durationBars, sourceOffsetBars = 0) {
    element.querySelector(".pattern-repeat-overlay")?.remove();
    const overlay = document.createElement("span");
    overlay.className = "pattern-repeat-overlay";
    const playbackBars = Math.min(durationBars, Math.max(0, repeatLengthBars * (clip.repeatCount || 1) - sourceOffsetBars));
    const sourcePhase = sourceOffsetBars % repeatLengthBars;
    for (let boundary = (sourcePhase ? repeatLengthBars - sourcePhase : repeatLengthBars);
      boundary < playbackBars - 0.001; boundary += repeatLengthBars) {
      const divider = document.createElement("span");
      divider.className = "pattern-repeat-divider";
      divider.style.left = `${Math.max(0, boundary * BAR_WIDTH - 4)}px`;
      overlay.append(divider);
    }
    if (durationBars > playbackBars + 0.001) {
      const extension = document.createElement("span");
      extension.className = "pattern-extension-region";
      extension.style.left = `${Math.max(0, playbackBars * BAR_WIDTH - 4)}px`;
      extension.style.width = `${Math.max(0, (durationBars - playbackBars) * BAR_WIDTH)}px`;
      overlay.append(extension);
    }
    element.append(overlay);
  }

  function updateClipResizeIndicator(element, mode, clip, durationBars, initialDuration) {
    let indicator = element.querySelector(".clip-resize-indicator");
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "clip-resize-indicator";
      element.append(indicator);
    }
    if (mode === "repeat") indicator.textContent = `REPEAT ×${clip.repeatCount || 1}`;
    else if (mode === "start") indicator.textContent = durationBars < initialDuration - 0.001 ? "TRIM START" : "EXTEND START";
    else indicator.textContent = durationBars > initialDuration + 0.001
      ? "EXTEND · SILENT"
      : durationBars < initialDuration - 0.001 ? "TRIM" : "LENGTH";
  }

  function makeAudioClipStartTrimHandle(track, clip, element) {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "clip-resize-handle clip-start-handle";
    handle.setAttribute("aria-label", `Trim the beginning of ${clip.name}`);
    handle.title = "Drag to trim the beginning of this audio clip";
    const handleWidth = Math.max(4, Math.min(12, BAR_WIDTH * 0.1));
    handle.style.width = `${handleWidth}px`;
    handle.style.flexBasis = `${handleWidth}px`;

    const applyTrim = (deltaBars, initial) => {
      const secondsPerBar = 240 / state.bpm;
      const minDuration = Math.min(state.arrangementSnap ? 0.25 : 0.01, initial.durationBars);
      const minDelta = -Math.min(initial.sourceOffsetSeconds / secondsPerBar, initial.startBar);
      const maxDelta = Math.max(0, initial.durationBars - minDuration);
      const delta = Math.max(minDelta, Math.min(maxDelta, snapArrangementBar(deltaBars)));
      const durationBars = initial.durationBars - delta;
      const startBar = initial.startBar + delta;
      const sourceOffsetSeconds = Math.max(0, initial.sourceOffsetSeconds + delta * secondsPerBar);
      const changed = Math.abs(startBar - clip.startBar) > 0.0001 ||
        Math.abs(sourceOffsetSeconds - (clip.sourceOffsetSeconds || 0)) > 0.0001 ||
        Math.abs(durationBars - getArrangementClipDuration("audio", clip)) > 0.0001;
      if (!changed) return false;

      clip.startBar = startBar;
      clip.sourceOffsetSeconds = sourceOffsetSeconds;
      clip.durationSeconds = durationBars * secondsPerBar;
      const repeatLength = getArrangementClipRepeatLength("audio", clip);
      clip.repeatCount = Math.max(1, Math.ceil((sourceOffsetSeconds / secondsPerBar + durationBars - 0.0001) / repeatLength));
      const width = Math.max(12, durationBars * BAR_WIDTH - 8);
      element.style.left = `${startBar * BAR_WIDTH + 4}px`;
      element.style.width = `${width}px`;
      drawAudioClipWaveform(element.querySelector(".clip-waveform-canvas"), clip, Math.max(1, width - 8), track.color);
      updateArrangementClipRepeatMarkers(element, clip, repeatLength, durationBars, sourceOffsetSeconds / secondsPerBar);
      element.setAttribute("aria-label",
        `${clip.name}, bar ${startBar + 1}, ${durationBars.toFixed(2)} bars; drag to move or resize`);
      return true;
    };

    const finishTrim = (changed) => {
      if (!changed) return;
      updateArrangementLength();
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      renderArrangement();
      saveState();
      persistClip(track, clip).catch(() => showToast("Clip trim changed, but browser storage could not be updated."));
    };

    handle.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      const initial = {
        startBar: clip.startBar,
        sourceOffsetSeconds: clip.sourceOffsetSeconds || 0,
        durationBars: getArrangementClipDuration("audio", clip),
      };
      const delta = event.key === "ArrowRight" ? 0.25 : -0.25;
      finishTrim(applyTrim(delta, initial));
    });
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      const startX = event.clientX;
      const initial = {
        startBar: clip.startBar,
        sourceOffsetSeconds: clip.sourceOffsetSeconds || 0,
        durationBars: getArrangementClipDuration("audio", clip),
      };
      let changed = false;
      element.draggable = false;
      updateClipResizeIndicator(element, "start", clip, initial.durationBars, initial.durationBars);
      const onMove = (moveEvent) => {
        const nextDelta = (moveEvent.clientX - startX) / BAR_WIDTH;
        const moved = applyTrim(nextDelta, initial);
        changed = moved || changed;
        updateClipResizeIndicator(element, "start", clip, getArrangementClipDuration("audio", clip), initial.durationBars);
      };
      const onEnd = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onEnd);
        document.removeEventListener("pointercancel", onEnd);
        element.draggable = true;
        element.querySelector(".clip-resize-indicator")?.remove();
        finishTrim(changed);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onEnd);
      document.addEventListener("pointercancel", onEnd);
    });
    return handle;
  }

  function makeArrangementResizeHandle(type, clip, track, element, labelElement, mode = "length") {
    const handle = document.createElement("button");
    const name = type === "pattern" ? getPattern(clip.patternId)?.name || "pattern"
      : type === "mel" ? getMel(clip.melId)?.name || "Mel" : clip.name;
    handle.type = "button";
    handle.className = `clip-resize-handle clip-${mode}-handle`;
    const handleWidth = Math.max(4, Math.min(12, BAR_WIDTH * 0.1));
    handle.style.width = `${handleWidth}px`;
    handle.style.flexBasis = `${handleWidth}px`;
    handle.setAttribute("aria-label", mode === "repeat" ? `Repeat ${name}` : `Trim or extend ${name}`);
    handle.title = mode === "repeat"
      ? `Drag to repeat ${name}`
      : "Drag to trim or extend; extension after the source is silent";

    const updateDuration = (durationBars) => {
      if (type === "audio") clip.durationSeconds = durationBars * (240 / state.bpm);
      else clip.durationBars = durationBars;
      if (mode === "repeat") {
        const repeatLength = getArrangementClipRepeatLength(type, clip);
        const sourceOffset = type === "mel" ? clip.sourceOffsetBars || 0
          : type === "audio" ? (clip.sourceOffsetSeconds || 0) / (240 / state.bpm) : clip.sourceOffsetBars || 0;
        clip.repeatCount = Math.max(1, Math.ceil((sourceOffset + durationBars - 0.0001) / repeatLength));
      }
      const duration = getArrangementClipDuration(type, clip);
      element.style.width = `${Math.max(12, duration * BAR_WIDTH - 8)}px`;
      if (type === "audio") {
        element.style.setProperty("--pattern-color", track?.color || "var(--accent)");
        updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength(type, clip), duration,
          (clip.sourceOffsetSeconds || 0) / (240 / state.bpm));
      }
      if (type === "mel") {
        const mel = getMel(clip.melId);
        if (mel) {
          labelElement.textContent = `${mel.name.toUpperCase()} · ${duration.toFixed(2)} BAR${duration === 1 ? "" : "S"}`;
          updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength(type, clip), duration, clip.sourceOffsetBars || 0);
        }
      } else if (type === "pattern") {
        const pattern = getPattern(clip.patternId);
        labelElement.textContent = `${(pattern?.name || "DRUM PATTERN").toUpperCase()} · ${duration.toFixed(2)} BAR${duration === 1 ? "" : "S"}`;
        if (pattern) updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength(type, clip), duration, clip.sourceOffsetBars || 0);
      }
      element.setAttribute("aria-label", `${name}, bar ${clip.startBar + 1}, ${duration.toFixed(2)} bars; drag to move or resize`);
    };

    const finishResize = (changed) => {
      if (!changed) return;
      updateArrangementLength();
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      renderArrangement();
      saveState();
      if (type === "audio" && track) {
        persistClip(track, clip).catch(() => showToast("Clip resized, but browser storage could not be updated."));
      }
    };

    handle.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      const increment = event.key === "ArrowRight" ? 0.25 : -0.25;
      const maxDuration = MAX_ARRANGEMENT_BARS - clip.startBar;
      const minDuration = Math.min(state.arrangementSnap ? 0.25 : 0.01, maxDuration);
      const next = Math.max(minDuration, Math.min(maxDuration,
        snapArrangementBar(getArrangementClipDuration(type, clip) + increment)));
      updateDuration(next);
      finishResize(true);
    });
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      const startX = event.clientX;
      const initialDuration = getArrangementClipDuration(type, clip);
      let changed = false;
      element.draggable = false;
      updateClipResizeIndicator(element, mode, clip, initialDuration, initialDuration);
      const onMove = (moveEvent) => {
        const maxDuration = MAX_ARRANGEMENT_BARS - clip.startBar;
        const minDuration = Math.min(state.arrangementSnap ? 0.25 : 0.01, maxDuration);
        const next = Math.max(minDuration, Math.min(maxDuration,
          snapArrangementBar(initialDuration + (moveEvent.clientX - startX) / BAR_WIDTH)));
        changed ||= Math.abs(next - getArrangementClipDuration(type, clip)) > 0.0001;
        updateDuration(next);
        updateClipResizeIndicator(element, mode, clip, getArrangementClipDuration(type, clip), initialDuration);
      };
      const onEnd = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onEnd);
        document.removeEventListener("pointercancel", onEnd);
        element.draggable = true;
        element.querySelector(".clip-resize-indicator")?.remove();
        finishResize(changed);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onEnd);
      document.addEventListener("pointercancel", onEnd);
    });
    return handle;
  }

