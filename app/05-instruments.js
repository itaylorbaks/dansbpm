  const sampleWaveformPeakCache = new WeakMap();
  let stepMixPreview = null;
  let stepMixPreviewSequence = 0;
  let activeInstrumentPreview = null;
  let instrumentPreviewSequence = 0;
  let instrumentPreviewSourceCollector = null;

  function addPatternInstrument(trackId) {
    const pattern = getPattern();
    const source = state.tracks.find((item) => item.id === trackId && !item.sourceId && item.kind !== "drumkit");
    if (!pattern || !source) return false;
    captureCurrentPattern();
    const layerCount = getPatternTrackIds(pattern).filter((id) => {
      const layer = state.tracks.find((item) => item.id === id);
      return layer && (layer.id === source.id || layer.sourceId === source.id);
    }).length;
    const track = makePatternInstrumentLayer(source, {
      name: layerCount ? `${source.name} ${layerCount + 1}` : source.name,
    });
    state.tracks.push(track);
    pattern.trackIds.push(track.id);
    pattern.cells[track.id] = Array(STEP_COUNT).fill(false);
    if (SOUND_VARIANTS[track.kind]) pattern.variants[track.id] = track.variant || "classic";
    renderTracks();
    renderPatternSelectors();
    saveState();
    showToast(`${track.name} added to ${pattern.name}`);
    return true;
  }

  function getStepInstrumentGroup(track) {
    if (track.sampleCategory && track.family) return `${track.family} · ${track.sampleCategory}`;
    if (track.kind === "sample") return "User Samples";
    if (track.family === "Drums" || !track.family) {
      const groups = {
        kick: "Drums · Kicks",
        snare: "Drums · Snares",
        clap: "Drums · Claps",
        hat: "Drums · Closed Hi-Hats",
        openhat: "Drums · Open Hi-Hats",
        rim: "Drums · Rims & Percussion",
        drumkit: "Drum Kits",
      };
      return groups[track.kind] || "Drums · Other";
    }
    return track.family;
  }

  function renderStepInstrumentLibrary(query = "") {
    const library = $("#step-instrument-library");
    library.replaceChildren();
    const instruments = getStepPickerInstruments()
      .filter((track) => matchesInstrumentSearch(track, query));
    const groups = new Map();
    instruments.forEach((track) => {
      const groupName = getStepInstrumentGroup(track);
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(track);
    });
    const addGroup = (groupName, groupInstruments) => {
      const group = document.createElement("section");
      group.className = "step-instrument-group";
      group.dataset.instrumentGroup = groupName;
      const heading = document.createElement("h3");
      heading.textContent = groupName;
      const choices = document.createElement("div");
      choices.className = "step-instrument-choices";
      groupInstruments
        .sort((left, right) => left.name.localeCompare(right.name))
        .forEach((instrument) => {
          const choice = document.createElement("button");
          choice.className = "step-instrument-choice";
          choice.type = "button";
          choice.dataset.soundId = instrument.id;
          choice.style.setProperty("--instrument-color", instrument.color);
          choice.textContent = instrument.name;
          if (stepInstrumentPendingId === instrument.id) {
            choice.classList.add("is-selected");
            choice.setAttribute("aria-pressed", "true");
          } else {
            choice.setAttribute("aria-pressed", "false");
          }
          choice.addEventListener("contextmenu", (event) => openSoundDurationMenu(instrument, event));
          choice.addEventListener("click", () => {
            library.querySelectorAll(".step-instrument-choice.is-selected").forEach((selectedChoice) => {
              selectedChoice.classList.remove("is-selected");
              selectedChoice.setAttribute("aria-pressed", "false");
            });
            choice.classList.add("is-selected");
            choice.setAttribute("aria-pressed", "true");
            stepInstrumentPendingId = instrument.id;
            const selectButton = $("#step-instrument-select");
            selectButton.disabled = true;
            loadLibrarySample(instrument).then(() => {
              if (stepInstrumentPendingId !== instrument.id || !$("#step-instrument-dialog").open) return;
              selectButton.disabled = false;
              previewInstrumentSound(instrument);
            }).catch((error) => {
              if (stepInstrumentPendingId === instrument.id) {
                showToast(error.message || `Could not load ${instrument.name}.`);
              }
            });
          });
          choices.append(choice);
        });
      group.append(heading, choices);
      library.append(group);
    };
    const favorites = instruments.filter(isFavoriteSound);
    if (favorites.length) addGroup("Favorites", favorites);
    Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([groupName, groupInstruments]) => addGroup(groupName, groupInstruments));
    if (!library.childElementCount && query) {
      const empty = document.createElement("div");
      empty.className = "instrument-search-empty";
      empty.textContent = `No sounds found for "${query}".`;
      library.append(empty);
    }
  }

  function openStepInstrumentPicker(targetTrackId = null, pickerMode = "step") {
    stepInstrumentTargetTrackId = targetTrackId;
    stepInstrumentPickerMode = pickerMode;
    stepInstrumentPendingId = null;
    $("#step-instrument-select").disabled = true;
    const searchInput = $("#sound-library-search-input");
    searchInput.value = "";
    renderSoundSearchSuggestions("");
    renderStepInstrumentLibrary();
    $("#step-instrument-title").textContent = pickerMode === "piano-roll"
      ? "Choose a piano roll instrument"
      : pickerMode === "mel-track"
        ? "Choose an instrument for this track"
      : targetTrackId ? "Choose a row instrument" : "Choose an instrument";
    $("#step-instrument-dialog").showModal();
  }

  function getSoundDurationKey(track) {
    return track.sourceId || track.id;
  }

  function isFavoriteSound(track) {
    return state.favoriteSoundIds.includes(getSoundDurationKey(track));
  }

  function loadSoundFavorites() {
    state.favoriteSoundIds = [];
    if (!state.currentUser) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(
        `${SOUND_FAVORITES_STORAGE_PREFIX}${state.currentUser}`,
      ) || "[]");
      if (!Array.isArray(saved)) throw new Error("saved favorites are invalid");
      state.favoriteSoundIds = [...new Set(saved.filter((id) =>
        typeof id === "string" && id.length > 0 && id.length <= 128))];
    } catch (error) {
      showToast(`Could not load sound favorites: ${error.message || "browser storage is unavailable."}`);
    }
  }

  function toggleSoundFavorite(track) {
    if (!state.currentUser) {
      showToast("Choose a profile before saving sound favorites.");
      return;
    }
    const soundId = getSoundDurationKey(track);
    const wasFavorite = isFavoriteSound(track);
    const favorites = wasFavorite
      ? state.favoriteSoundIds.filter((id) => id !== soundId)
      : [...state.favoriteSoundIds, soundId];
    try {
      window.localStorage.setItem(
        `${SOUND_FAVORITES_STORAGE_PREFIX}${state.currentUser}`,
        JSON.stringify(favorites),
      );
    } catch (error) {
      showToast(`Could not save sound favorites: ${error.message || "browser storage is unavailable."}`);
      return;
    }
    state.favoriteSoundIds = favorites;
    const favoriteButton = $("#sound-duration-favorite");
    favoriteButton.textContent = wasFavorite ? "Add to favorites" : "Remove from favorites";
    favoriteButton.setAttribute("aria-pressed", String(!wasFavorite));
    renderInstrumentBrowser();
    if ($("#step-instrument-dialog").open) {
      renderStepInstrumentLibrary($("#sound-library-search-input").value);
    }
  }

  function getSoundProcessingEdits(track) {
    const soundId = getSoundDurationKey(track);
    const stored = state.soundProcessingEdits[soundId] || {};
    const edits = normalizeSoundProcessingEdits(stored);
    const legacyDurationScale = state.soundDurationEdits[soundId];
    if (Number.isFinite(legacyDurationScale) && legacyDurationScale < 1) {
      edits.trimEnd = Math.max(edits.trimStart + 1, Math.round(edits.trimStart +
        (edits.trimEnd - edits.trimStart) * legacyDurationScale));
    }
    return edits;
  }

  function getSamplePlaybackRange(track, buffer) {
    const edits = getSoundProcessingEdits(track);
    const duration = buffer.duration;
    const offset = Math.min(duration, Math.max(edits.sampleStart, edits.trimStart) / 100 * duration +
      edits.playbackStartOffset / 1000);
    const end = Math.max(offset, edits.trimEnd / 100 * duration);
    return { offset, duration: end - offset };
  }

  function getLibrarySamplePlaybackBuffer(track) {
    const buffer = track.sample?.buffer;
    if (!buffer) return buffer;
    const soundId = getSoundDurationKey(track);
    const edits = getSoundProcessingEdits(track);
    const reversed = state.soundReverseEdits[soundId] === true;
    if (!edits.normalize && !reversed && !edits.reversePolarity &&
      !edits.swapStereo && !edits.fadeIn && !edits.fadeOut) return buffer;
    let buffers = processedLibrarySampleBuffers.get(buffer);
    if (!buffers) {
      buffers = new Map();
      processedLibrarySampleBuffers.set(buffer, buffers);
    }
    const cacheKey = JSON.stringify({
      normalize: edits.normalize,
      reversed,
      reversePolarity: edits.reversePolarity,
      swapStereo: edits.swapStereo,
      fadeIn: edits.fadeIn,
      fadeOut: edits.fadeOut,
      sampleStart: edits.sampleStart,
      playbackStartOffset: edits.playbackStartOffset,
      trimStart: edits.trimStart,
      trimEnd: edits.trimEnd,
    });
    if (buffers.has(cacheKey)) return buffers.get(cacheKey);

    const processed = state.audioContext.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const fadeStart = Math.floor(Math.max(edits.trimStart,
      edits.sampleStart + edits.playbackStartOffset / buffer.duration * 100) / 100 * buffer.length);
    const fadeEnd = Math.floor(edits.trimEnd / 100 * buffer.length);
    const fadeRegionFrames = Math.max(0, fadeEnd - fadeStart);
    const fadeInFrames = Math.floor(fadeRegionFrames * edits.fadeIn / 100);
    const fadeOutFrames = Math.floor(fadeRegionFrames * edits.fadeOut / 100);
    let peak = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const sourceChannel = edits.swapStereo && buffer.numberOfChannels > 1
        ? channel === 0 ? 1 : channel === 1 ? 0 : channel
        : channel;
      const source = buffer.getChannelData(sourceChannel);
      const destination = processed.getChannelData(channel);
      for (let sample = 0; sample < buffer.length; sample += 1) {
        const sourceIndex = reversed ? buffer.length - sample - 1 : sample;
        const fadeInGain = fadeInFrames
          ? sample < fadeStart ? 0 : Math.min(1, (sample - fadeStart) / fadeInFrames)
          : 1;
        const fadeOutGain = fadeOutFrames
          ? sample >= fadeEnd ? 0 : Math.min(1, (fadeEnd - sample - 1) / fadeOutFrames)
          : 1;
        const polarity = edits.reversePolarity ? -1 : 1;
        const value = source[sourceIndex] * Math.min(fadeInGain, fadeOutGain) * polarity;
        destination[sample] = value;
        peak = Math.max(peak, Math.abs(value));
      }
    }
    if (edits.normalize && peak > 0) {
      const gain = 0.99 / peak;
      for (let channel = 0; channel < processed.numberOfChannels; channel += 1) {
        const samples = processed.getChannelData(channel);
        for (let sample = 0; sample < processed.length; sample += 1) samples[sample] *= gain;
      }
    }
    buffers.set(cacheKey, processed);
    return processed;
  }

  function closeSoundDurationMenu() {
    const menu = $("#sound-duration-menu");
    menu.hidden = true;
    delete menu.dataset.soundId;
    delete menu.dataset.trackId;
  }

  function openSoundDurationMenu(track, event) {
    event.preventDefault();
    const menu = $("#sound-duration-menu");
    const dialog = event.currentTarget.closest("dialog");
    if (dialog && menu.parentElement !== dialog) dialog.append(menu);
    const soundId = getSoundDurationKey(track);
    $("#sound-duration-title").textContent = track.name;
    const favoriteButton = $("#sound-duration-favorite");
    favoriteButton.textContent = isFavoriteSound(track) ? "Remove from favorites" : "Add to favorites";
    favoriteButton.setAttribute("aria-pressed", String(isFavoriteSound(track)));
    menu.dataset.soundId = soundId;
    menu.dataset.trackId = track.id;
    menu.hidden = false;
    const bounds = dialog?.getBoundingClientRect() || {
      left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight,
    };
    menu.style.left = `${Math.max(bounds.left + 8, Math.min(event.clientX, bounds.right - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(bounds.top + 8, Math.min(event.clientY, bounds.bottom - menu.offsetHeight - 8))}px`;
  }

  async function applyStepInstrumentSelection() {
    const instrument = state.tracks.find((track) => track.id === stepInstrumentPendingId && !track.sourceId);
    if (!instrument) {
      showToast("Choose an instrument before selecting.");
      return;
    }
    const selectButton = $("#step-instrument-select");
    selectButton.disabled = true;
    try {
      await loadLibrarySample(instrument);
    } catch (error) {
      showToast(error.message || `Could not load ${instrument.name}.`);
      selectButton.disabled = false;
      return;
    }
    if (stepInstrumentPendingId !== instrument.id) return;
    if (stepInstrumentPickerMode === "piano-roll") {
      selectPianoInstrument(instrument.id);
    } else if (stepInstrumentPickerMode === "mel-track") {
      const melTrack = state.melTracks.find((track) => track.id === stepInstrumentTargetTrackId);
      if (!melTrack) {
        showToast("That instrument track no longer exists.");
        return;
      }
      melTrack.instrumentId = instrument.id;
      renderArrangement();
      saveState();
      showToast(`${instrument.name} assigned to ${melTrack.name}`);
    } else {
      const applied = stepInstrumentTargetTrackId
        ? replacePatternInstrument(stepInstrumentTargetTrackId, instrument.id)
        : addPatternInstrument(instrument.id);
      if (!applied) return;
    }
    $("#step-instrument-dialog").close();
  }

  function replacePatternInstrument(trackId, sourceId) {
    const pattern = getPattern();
    const oldTrack = state.tracks.find((track) => track.id === trackId);
    const source = state.tracks.find((track) => track.id === sourceId && !track.sourceId && track.kind !== "drumkit");
    if (!pattern || !oldTrack || !source || oldTrack.kind === "drumkit") return false;
    if (oldTrack.id === source.id || oldTrack.sourceId === source.id) return true;
    captureCurrentPattern();
    pattern.trackIds = getPatternTrackIds(pattern);
    const rowIndex = pattern.trackIds.indexOf(oldTrack.id);
    if (rowIndex < 0) return false;
    const replacement = makePatternInstrumentLayer(source, {
      name: source.name,
      cells: oldTrack.cells,
      volume: oldTrack.volume,
      muted: oldTrack.muted,
      solo: oldTrack.solo,
      pitch: oldTrack.pitch,
      swing: oldTrack.swing,
      effects: oldTrack.effects,
    });
    state.tracks.push(replacement);
    pattern.trackIds[rowIndex] = replacement.id;
    delete pattern.cells[oldTrack.id];
    delete pattern.variants[oldTrack.id];
    if (pattern.stepPianoNotes?.[oldTrack.id]) {
      pattern.stepPianoNotes[replacement.id] = pattern.stepPianoNotes[oldTrack.id].map((note) => ({ ...note }));
      delete pattern.stepPianoNotes[oldTrack.id];
    }
    pattern.cells[replacement.id] = [...replacement.cells];
    if (SOUND_VARIANTS[replacement.kind]) pattern.variants[replacement.id] = replacement.variant || "classic";
    state.selectedStepCells.clear();
    state.selectedPreset = null;
    const isUsedElsewhere = state.patterns.some((item) => item.id !== pattern.id && getPatternTrackIds(item).includes(oldTrack.id));
    if (oldTrack.sourceId && !isUsedElsewhere) {
      disconnectTrackAudio(oldTrack);
      state.tracks = state.tracks.filter((track) => track !== oldTrack);
    }
    renderTracks();
    renderPatternSelectors();
    renderPresets();
    saveState();
    showToast(`${oldTrack.name} replaced with ${source.name}`);
    return true;
  }

  function openStepTrackMix(track) {
    $("#step-track-mix-title").textContent = `${track.name} mix`;
    const controls = $("#step-track-mix-controls");
    controls.replaceChildren();
    controls.className = "step-track-mix-layout";
    controls.dataset.trackId = track.id;
    const hasSample = Boolean(track.sample || track.sampleUrl || track.kind === "sample");
    const eqGraph = makeStepTrackMixEqGraph(track);

    const lower = document.createElement("div");
    lower.className = "step-mix-lower";
    const left = document.createElement("div");
    left.className = "step-mix-left";
    const right = document.createElement("div");
    right.className = "step-mix-right";

    left.append(makeSoundWaveformEditor(track));

    const soundGroup = document.createElement("div");
    soundGroup.className = "step-mix-group";
    const soundHeading = document.createElement("h3");
    soundHeading.textContent = "Sound";
    soundGroup.append(
      soundHeading,
      makeStepTrackMixRange(track, "pitch", "Row pitch", -12, 12, 1, " st"),
      makeStepTrackMixRange(track, "volume", "Volume", 0, 100, 1, "%"),
      makeStepTrackMixRange(track, "swing", "Swing", 0, 45, 1, "%"),
      makeSoundProcessingRange(track, "boost", "Boost", -12, 24, 1, " dB"),
      makeSoundProcessingRange(track, "reverb", "Reverb", 0, 100, 1, "%"),
    );
    right.append(soundGroup);
    if (hasSample) {
      const playbackGroup = document.createElement("div");
      playbackGroup.className = "step-mix-group";
      const playbackHeading = document.createElement("h3");
      playbackHeading.textContent = "Playback";
      playbackGroup.append(
        playbackHeading,
        makeSoundProcessingRange(track, "playbackStartOffset", "Start offset", 0, 5000, 10, " ms"),
      );

      const editGroup = document.createElement("div");
      editGroup.className = "step-mix-group";
      const editHeading = document.createElement("h3");
      editHeading.textContent = "Precomputed Effects";
      editGroup.append(
        editHeading,
        makeSoundProcessingToggle(track, "normalize", "Normalize"),
        makeSoundProcessingToggle(track, "reverse", "Reverse"),
        makeSoundProcessingToggle(track, "reversePolarity", "Reverse polarity"),
        makeSoundProcessingToggle(track, "swapStereo", "Swap stereo"),
        makeSoundProcessingRange(track, "sampleStart", "SMP start", 0, 100, 1, "%"),
        makeSoundProcessingRange(track, "arpeggiatorLength", "Arpeggiator length", 1, 16, 1, " steps"),
        makeSoundProcessingRange(track, "crossfade", "Loop crossfade", 0, 500, 5, " ms"),
      );

      const stretchGroup = document.createElement("div");
      stretchGroup.className = "step-mix-group";
      const stretchHeading = document.createElement("h3");
      stretchHeading.textContent = "Time Stretching";
      stretchGroup.append(
        stretchHeading,
        makeSoundProcessingRange(track, "pitch", "Pitch", -12, 12, 0.1, " st"),
        makeSoundProcessingRange(track, "playbackMultiplier", "Mul", 0.25, 4, 0.05, "×",
          (value) => `${Number(value).toFixed(2)}×`),
        makeSoundProcessingRange(track, "time", "Time", 25, 400, 1, "%"),
      );
      left.append(stretchGroup);
      right.append(playbackGroup, editGroup);
    }
    const editButton = document.createElement("button");
    editButton.className = "quiet-button step-piano-edit-button";
    editButton.type = "button";
    editButton.textContent = "Edit progression in Piano Roll";
    editButton.addEventListener("click", () => openStepInstrumentPianoRoll(track.id));
    right.append(editButton);
    lower.append(left, right);
    controls.append(eqGraph.element, lower);
    $("#step-track-mix-dialog").showModal();
    requestAnimationFrame(() => {
      eqGraph.refresh();
      controls.querySelectorAll(".step-mix-waveform").forEach((canvas) =>
        drawStepMixWaveform(canvas, track, getSoundProcessingEdits(track)));
    });
    if (hasSample && !track.sample?.buffer) {
      loadLibrarySample(track).then(() => {
        if (controls.dataset.trackId === track.id) {
          controls.querySelectorAll(".step-mix-waveform").forEach((canvas) =>
            drawStepMixWaveform(canvas, track, getSoundProcessingEdits(track)));
        }
      }).catch((error) => showToast(error.message || `Could not load ${track.name}.`));
    }
  }

  function makeStepTrackMixEqGraph(track) {
    const bands = [
      { id: "low", label: "Low · 30–250 Hz", frequencyKey: "eqLowHz", gainKey: "eqLowGain", min: 30, max: 250 },
      { id: "mid", label: "Mid · 250–4,000 Hz", frequencyKey: "eqMidHz", gainKey: "eqMidGain", min: 250, max: 4000 },
      { id: "high", label: "High · 2,000–18,000 Hz", frequencyKey: "eqHighHz", gainKey: "eqHighGain", min: 2000, max: 18000 },
    ];
    const group = document.createElement("section");
    group.className = "step-mix-eq-group";
    const heading = document.createElement("h3");
    heading.textContent = "EQ response · drag points to adjust frequency and gain";
    const stage = document.createElement("div");
    stage.className = "step-mix-eq-stage";
    const canvas = document.createElement("canvas");
    canvas.className = "step-mix-eq-graph";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Equalizer response curve from 20 hertz to 20 kilohertz");
    const handles = new Map();
    bands.forEach((band) => {
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = `step-mix-eq-handle is-${band.id}`;
      handle.dataset.eqBand = band.id;
      handle.setAttribute("role", "slider");
      handle.setAttribute("aria-label", `${band.label} EQ point`);
      handle.setAttribute("aria-valuemin", "-12");
      handle.setAttribute("aria-valuemax", "12");
      handles.set(band.id, handle);
      stage.append(handle);
    });
    stage.prepend(canvas);
    group.append(heading, stage);

    const refresh = () => {
      const edits = getSoundProcessingEdits(track);
      drawStepMixEqCurve(canvas, edits);
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      getStepMixEqBandPoints(edits, bounds.width, bounds.height).forEach((point) => {
        const handle = handles.get(point.id);
        handle.style.left = `${point.x}px`;
        handle.style.top = `${point.y}px`;
        handle.setAttribute("aria-valuenow", String(edits[point.gainKey]));
        handle.setAttribute("aria-valuetext", `${Math.round(edits[point.frequencyKey])} Hz, ${edits[point.gainKey].toFixed(1)} dB`);
      });
    };

    const updateBand = (band, clientX, clientY) => {
      const bounds = stage.getBoundingClientRect();
      const graphLeft = 42;
      const graphRight = 12;
      const graphTop = 12;
      const graphBottom = 25;
      const xRatio = Math.max(0, Math.min(1,
        (clientX - bounds.left - graphLeft) / (bounds.width - graphLeft - graphRight)));
      const yRatio = Math.max(0, Math.min(1,
        (clientY - bounds.top - graphTop) / (bounds.height - graphTop - graphBottom)));
      const frequency = Math.round(Math.max(band.min, Math.min(band.max, 20 * 1000 ** xRatio)));
      const gain = Math.round(Math.max(-12, Math.min(12, 18 - yRatio * 36)) * 10) / 10;
      const edits = getSoundProcessingEdits(track);
      state.soundProcessingEdits[getSoundDurationKey(track)] = normalizeSoundProcessingEdits({
        ...edits,
        [band.frequencyKey]: frequency,
        [band.gainKey]: gain,
      });
      refresh();
      refreshStepMixPreview(track, false);
    };

    let activeBand = null;
    let activePointerId = null;
    stage.addEventListener("pointerdown", (event) => {
      let band = bands.find((item) => item.id === event.target.closest("[data-eq-band]")?.dataset.eqBand);
      if (!band && event.target === canvas) {
        const bounds = stage.getBoundingClientRect();
        const points = getStepMixEqBandPoints(getSoundProcessingEdits(track), bounds.width, bounds.height);
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        const point = points.reduce((nearest, current) =>
          Math.hypot(current.x - x, current.y - y) < Math.hypot(nearest.x - x, nearest.y - y) ? current : nearest);
        band = bands.find((item) => item.id === point.id);
      }
      if (!band) return;
      event.preventDefault();
      activeBand = band;
      activePointerId = event.pointerId;
      stage.setPointerCapture(activePointerId);
      updateBand(activeBand, event.clientX, event.clientY);
    });
    stage.addEventListener("pointermove", (event) => {
      if (event.pointerId === activePointerId && activeBand) {
        updateBand(activeBand, event.clientX, event.clientY);
      }
    });
    const finishDrag = (event) => {
      if (event.pointerId !== activePointerId) return;
      activeBand = null;
      activePointerId = null;
      saveState();
    };
    stage.addEventListener("pointerup", finishDrag);
    stage.addEventListener("pointercancel", finishDrag);
    handles.forEach((handle, id) => {
      handle.addEventListener("keydown", (event) => {
        const band = bands.find((item) => item.id === id);
        const edits = getSoundProcessingEdits(track);
        const next = { ...edits };
        if (event.key === "ArrowUp") next[band.gainKey] = Math.min(12, edits[band.gainKey] + 0.5);
        else if (event.key === "ArrowDown") next[band.gainKey] = Math.max(-12, edits[band.gainKey] - 0.5);
        else if (event.key === "ArrowRight") next[band.frequencyKey] = Math.min(band.max, Math.round(edits[band.frequencyKey] * 1.05));
        else if (event.key === "ArrowLeft") next[band.frequencyKey] = Math.max(band.min, Math.round(edits[band.frequencyKey] / 1.05));
        else return;
        event.preventDefault();
        state.soundProcessingEdits[getSoundDurationKey(track)] = normalizeSoundProcessingEdits(next);
        refresh();
        refreshStepMixPreview(track, false);
        saveState();
      });
    });
    refresh();
    return { element: group, refresh };
  }

  function makeSoundWaveformEditor(track) {
    const soundId = getSoundDurationKey(track);
    const editor = document.createElement("section");
    editor.className = "step-mix-waveform-editor";
    const headingRow = document.createElement("div");
    headingRow.className = "step-mix-waveform-heading";
    const heading = document.createElement("h3");
    heading.textContent = "Waveform · trim and fades";
    const playButton = makeStepMixPreviewButton(track);
    headingRow.append(heading, playButton);
    const stage = document.createElement("div");
    stage.className = "step-mix-waveform-stage";
    const canvas = document.createElement("canvas");
    canvas.className = "step-mix-waveform";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${track.name} waveform with editable trim and fade handles`);
    const handles = new Map();
    [
      ["trimStart", "Trim start"],
      ["trimEnd", "Trim end"],
      ["fadeIn", "Fade in"],
      ["fadeOut", "Fade out"],
    ].forEach(([key, label]) => {
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = `step-mix-waveform-handle is-${key}`;
      handle.dataset.handle = key;
      handle.setAttribute("role", "slider");
      handle.setAttribute("aria-label", `${track.name} ${label}`);
      handles.set(key, handle);
      stage.append(handle);
    });
    const readout = document.createElement("output");
    readout.className = "step-mix-waveform-readout";
    stage.prepend(canvas);
    editor.append(headingRow, stage, readout);

    const refresh = () => {
      const edits = getSoundProcessingEdits(track);
      const range = edits.trimEnd - edits.trimStart;
      const positions = {
        trimStart: edits.trimStart,
        trimEnd: edits.trimEnd,
        fadeIn: edits.trimStart + range * edits.fadeIn / 100,
        fadeOut: edits.trimEnd - range * edits.fadeOut / 100,
      };
      handles.forEach((handle, key) => {
        handle.style.left = `${positions[key]}%`;
        handle.setAttribute("aria-valuemin", key === "trimEnd" ? String(edits.trimStart + 1) : "0");
        handle.setAttribute("aria-valuemax", key === "trimStart" ? String(edits.trimEnd - 1) :
          key === "trimEnd" ? "100" : "50");
        handle.setAttribute("aria-valuenow", String(edits[key]));
        handle.setAttribute("aria-valuetext", key === "trimStart" || key === "trimEnd"
          ? `${edits[key]} percent`
          : `${edits[key]} percent fade`);
      });
      readout.textContent = `IN ${edits.trimStart}%   FADE IN ${edits.fadeIn}%   FADE OUT ${edits.fadeOut}%   OUT ${edits.trimEnd}%`;
      drawStepMixWaveform(canvas, track, edits);
    };

    const setHandleValue = (key, percent) => {
      const edits = getSoundProcessingEdits(track);
      const range = edits.trimEnd - edits.trimStart;
      const next = { ...edits };
      if (key === "trimStart") next.trimStart = Math.min(edits.trimEnd - 1, Math.max(0, Math.round(percent)));
      else if (key === "trimEnd") next.trimEnd = Math.max(edits.trimStart + 1, Math.min(100, Math.round(percent)));
      else if (key === "fadeIn") next.fadeIn = Math.max(0, Math.min(50,
        (percent - edits.trimStart) / range * 100));
      else next.fadeOut = Math.max(0, Math.min(50, (edits.trimEnd - percent) / range * 100));
      state.soundProcessingEdits[soundId] = normalizeSoundProcessingEdits(next);
      delete state.soundDurationEdits[soundId];
      refresh();
      refreshStepMixPreview(track, true);
    };

    handles.forEach((handle, key) => {
      let pointerId = null;
      handle.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        pointerId = event.pointerId;
        handle.setPointerCapture(pointerId);
        const bounds = stage.getBoundingClientRect();
        setHandleValue(key, (event.clientX - bounds.left) / bounds.width * 100);
      });
      handle.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) return;
        const bounds = stage.getBoundingClientRect();
        setHandleValue(key, (event.clientX - bounds.left) / bounds.width * 100);
      });
      const finish = (event) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        saveState();
      };
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
      handle.addEventListener("keydown", (event) => {
        const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 :
          event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        const bounds = stage.getBoundingClientRect();
        const x = Number.parseFloat(handle.style.left) + direction * 100 / bounds.width;
        setHandleValue(key, x);
        saveState();
      });
    });
    refresh();
    return editor;
  }

  function makeStepMixPreviewButton(track) {
    const button = document.createElement("button");
    button.className = "quiet-button step-mix-preview-button";
    button.type = "button";
    button.textContent = "▶ Play loop";
    button.setAttribute("aria-label", `Play ${track.name} on loop`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => toggleStepMixPreview(track, button));
    return button;
  }

  function toggleStepMixPreview(track, button) {
    if (stepMixPreview?.button === button) {
      stopStepMixPreview();
      return;
    }
    stopStepMixPreview();
    const request = stepMixPreviewSequence;
    button.disabled = true;
    (async () => {
      try {
        await ensureAudio();
        if (track.sampleUrl || track.kind === "sample") await loadLibrarySample(track);
        if (request !== stepMixPreviewSequence || !$("#step-track-mix-dialog").open) return;
        ensureTrackAudio(track);
        const preview = {
          track,
          soundId: getSoundDurationKey(track),
          button,
          outputNode: track.gainNode || state.masterGain,
          voices: new Set(),
          interval: null,
          restartTimer: null,
        };
        stepMixPreview = preview;
        button.textContent = "■ Stop";
        button.setAttribute("aria-label", `Stop ${track.name} preview`);
        button.setAttribute("aria-pressed", "true");
        if (track.sample || track.sampleUrl || track.kind === "sample") {
          startStepMixSamplePreview(preview);
        } else {
          const duration = Math.max(0.15, getStepDuration() * 4);
          const playNote = () => {
            if (stepMixPreview !== preview) return;
            playPianoNote(track, state.audioContext.currentTime + 0.02, getDefaultStepMidi(track),
              duration * 0.9, 0.8, track, preview.outputNode);
          };
          playNote();
          preview.interval = window.setInterval(playNote, duration * 1000);
        }
      } catch (error) {
        if (request === stepMixPreviewSequence) {
          stopStepMixPreview();
          showToast(error.message || `Could not preview ${track.name}.`);
        }
      } finally {
        button.disabled = false;
      }
    })();
  }

  function startStepMixSamplePreview(preview) {
    const track = preview.track;
    const buffer = getLibrarySamplePlaybackBuffer(track);
    if (!buffer) throw new Error(`The audio for ${track.name} is unavailable.`);
    const range = getSamplePlaybackRange(track, buffer);
    if (range.duration <= 0.005) throw new Error("The trimmed sound is too short to preview.");
    const context = state.audioContext;
    const edits = getSoundProcessingEdits(track);
    const rateScale = getSoundPlaybackRateScale(track);
    const canPitchShift = state.masterPitchSupported !== false &&
      typeof window.AudioWorkletNode === "function";
    const playbackRate = canPitchShift ? rateScale : rateScale * Math.pow(2, edits.pitch / 12);
    const startTime = context.currentTime + 0.015;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = range.offset;
    source.loopEnd = range.offset + range.duration;
    source.playbackRate.setValueAtTime(playbackRate, startTime);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.linearRampToValueAtTime(0.75, startTime + 0.025);
    let pitchNode = null;
    const pitchCorrection = canPitchShift
      ? Math.max(-36, Math.min(36, edits.pitch - 12 * Math.log2(rateScale)))
      : 0;
    if (Math.abs(pitchCorrection) >= 0.001) {
      pitchNode = new window.AudioWorkletNode(context, "dansbpm-master-pitch");
      pitchNode.parameters.get("semitones").setValueAtTime(pitchCorrection, startTime);
      source.connect(pitchNode);
      pitchNode.connect(envelope);
    } else {
      source.connect(envelope);
    }
    envelope.connect(getSoundProcessingInput(track, preview.outputNode));
    const voice = { source, envelope, pitchNode };
    preview.voices.add(voice);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
      pitchNode?.disconnect();
      preview.voices.delete(voice);
    };
    source.start(startTime, range.offset);
  }

  function fadeOutStepMixPreviewVoice(voice, context) {
    const endTime = context.currentTime + 0.025;
    voice.envelope.gain.cancelScheduledValues(context.currentTime);
    voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, context.currentTime);
    voice.envelope.gain.linearRampToValueAtTime(0.0001, endTime);
    try {
      voice.source.stop(endTime + 0.005);
    } catch (error) {
      if (error.name !== "InvalidStateError") throw error;
    }
  }

  function refreshStepMixPreview(track, restartSample) {
    const preview = stepMixPreview;
    if (!preview || preview.soundId !== getSoundDurationKey(track)) return;
    getSoundProcessingInput(track, preview.outputNode);
    if (!restartSample || !track.sample && !track.sampleUrl && track.kind !== "sample") return;
    if (preview.restartTimer !== null) window.clearTimeout(preview.restartTimer);
    preview.restartTimer = window.setTimeout(() => {
      preview.restartTimer = null;
      if (stepMixPreview !== preview) return;
      const previousVoices = [...preview.voices];
      try {
        startStepMixSamplePreview(preview);
        previousVoices.forEach((voice) => fadeOutStepMixPreviewVoice(voice, state.audioContext));
      } catch (error) {
        showToast(error.message || `Could not preview ${track.name}.`);
        stopStepMixPreview();
      }
    }, 90);
  }

  function stopStepMixPreview() {
    stepMixPreviewSequence += 1;
    const preview = stepMixPreview;
    stepMixPreview = null;
    if (!preview) return;
    if (preview.interval !== null) window.clearInterval(preview.interval);
    if (preview.restartTimer !== null) window.clearTimeout(preview.restartTimer);
    [...preview.voices].forEach((voice) => fadeOutStepMixPreviewVoice(voice, state.audioContext));
    preview.button.textContent = "▶ Play loop";
    preview.button.setAttribute("aria-label", `Play ${preview.track.name} on loop`);
    preview.button.setAttribute("aria-pressed", "false");
  }

  function drawStepMixWaveform(canvas, track, edits) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.round(bounds.width * pixelRatio);
    const height = Math.round(bounds.height * pixelRatio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const w = bounds.width;
    const h = bounds.height;
    context.clearRect(0, 0, w, h);
    context.fillStyle = "#141518";
    context.fillRect(0, 0, w, h);
    context.strokeStyle = "#303238";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, h / 2);
    context.lineTo(w, h / 2);
    context.stroke();
    const buffer = track.sample?.buffer;
    if (buffer) {
      let peaks = sampleWaveformPeakCache.get(buffer);
      if (!peaks) {
        const bins = Math.min(1200, buffer.length);
        const channelData = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
        peaks = new Float32Array(bins);
        for (let bin = 0; bin < bins; bin += 1) {
          const start = Math.floor(bin / bins * buffer.length);
          const end = Math.max(start + 1, Math.floor((bin + 1) / bins * buffer.length));
          for (const samples of channelData) {
            for (let index = start; index < Math.min(end, buffer.length); index += 1) {
              peaks[bin] = Math.max(peaks[bin], Math.abs(samples[index]));
            }
          }
        }
        sampleWaveformPeakCache.set(buffer, peaks);
      }
      context.fillStyle = "#8ebf70";
      for (let x = 0; x < w; x += 2) {
        const start = Math.floor(x / w * peaks.length);
        const end = Math.max(start + 1, Math.floor((x + 2) / w * peaks.length));
        let peak = 0;
        for (let index = start; index < Math.min(end, peaks.length); index += 1) peak = Math.max(peak, peaks[index]);
        const barHeight = Math.max(1, peak * h * 0.42);
        context.fillRect(x, (h - barHeight) / 2, 1, barHeight);
      }
    } else {
      const wave = track.patch?.wave || (track.kind === "kick" ? "sine" : "triangle");
      context.fillStyle = "#8ebf70";
      for (let x = 0; x < w; x += 2) {
        const progress = x / w;
        const phase = progress * Math.PI * 18;
        const sine = Math.sin(phase);
        const oscillator = wave === "square" ? Math.sign(sine)
          : wave === "sawtooth" ? 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))
            : wave === "triangle" ? 2 / Math.PI * Math.asin(sine) : sine;
        const decay = track.kind === "kick" || track.kind === "snare"
          ? Math.exp(-progress * 5)
          : Math.min(1, progress * 18) * Math.exp(-progress * 1.8);
        const barHeight = Math.max(1, Math.abs(oscillator * decay) * h * 0.42);
        context.fillRect(x, (h - barHeight) / 2, 1, barHeight);
      }
      context.fillStyle = "#707278";
      context.font = "9px monospace";
      context.textAlign = "right";
      context.fillText("SYNTH", w - 8, 12);
    }

    const startX = edits.trimStart / 100 * w;
    const endX = edits.trimEnd / 100 * w;
    const fadeInX = startX + (endX - startX) * edits.fadeIn / 100;
    const fadeOutX = endX - (endX - startX) * edits.fadeOut / 100;
    context.fillStyle = "#0009";
    context.fillRect(0, 0, startX, h);
    context.fillRect(endX, 0, w - endX, h);
    context.fillStyle = "#8ebf7018";
    context.fillRect(startX, 0, endX - startX, h);
    context.strokeStyle = "#c3e3a8";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(startX, edits.fadeIn ? h - 10 : 10);
    context.lineTo(fadeInX, 10);
    context.lineTo(fadeOutX, 10);
    context.lineTo(endX, edits.fadeOut ? h - 10 : 10);
    context.stroke();
    context.setLineDash([3, 3]);
    context.strokeStyle = "#8ebf70";
    [startX, endX].forEach((x) => {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, h);
      context.stroke();
    });
    context.setLineDash([]);
  }

  function getStepMixEqBands(edits) {
    return [
      { id: "low", frequencyKey: "eqLowHz", gainKey: "eqLowGain", min: 30, max: 250,
        frequency: edits.eqLowHz, gain: edits.eqLowGain },
      { id: "mid", frequencyKey: "eqMidHz", gainKey: "eqMidGain", min: 250, max: 4000,
        frequency: edits.eqMidHz, gain: edits.eqMidGain },
      { id: "high", frequencyKey: "eqHighHz", gainKey: "eqHighGain", min: 2000, max: 18000,
        frequency: edits.eqHighHz, gain: edits.eqHighGain },
    ];
  }

  function getStepMixEqResponseDb(frequency, center, gain, sampleRate) {
    if (!gain) return 0;
    const omega = 2 * Math.PI * center / sampleRate;
    const alpha = Math.sin(omega) / 2;
    const amplitude = 10 ** (gain / 40);
    const coefficients = [
      (1 + alpha * amplitude) / (1 + alpha / amplitude),
      (-2 * Math.cos(omega)) / (1 + alpha / amplitude),
      (1 - alpha * amplitude) / (1 + alpha / amplitude),
      (-2 * Math.cos(omega)) / (1 + alpha / amplitude),
      (1 - alpha / amplitude) / (1 + alpha / amplitude),
    ];
    const phase = 2 * Math.PI * frequency / sampleRate;
    const real = coefficients[0] + coefficients[1] * Math.cos(phase) +
      coefficients[2] * Math.cos(2 * phase);
    const imaginary = -coefficients[1] * Math.sin(phase) - coefficients[2] * Math.sin(2 * phase);
    const denominatorReal = 1 + coefficients[3] * Math.cos(phase) + coefficients[4] * Math.cos(2 * phase);
    const denominatorImaginary = -coefficients[3] * Math.sin(phase) - coefficients[4] * Math.sin(2 * phase);
    return 20 * Math.log10(Math.max(0.000001,
      Math.hypot(real, imaginary) / Math.hypot(denominatorReal, denominatorImaginary)));
  }

  function getStepMixEqBandPoints(edits, width, height) {
    const left = 42;
    const right = 12;
    const top = 12;
    const bottom = 25;
    const graphWidth = width - left - right;
    const graphHeight = height - top - bottom;
    const sampleRate = state.audioContext?.sampleRate || 44100;
    const bands = getStepMixEqBands(edits);
    const toX = (frequency) => left + Math.log(frequency / 20) / Math.log(1000) * graphWidth;
    const toY = (db) => top + (18 - Math.max(-18, Math.min(18, db))) / 36 * graphHeight;
    return bands.map((band) => ({
      ...band,
      x: toX(band.frequency),
      y: toY(bands.reduce((sum, item) =>
        sum + getStepMixEqResponseDb(band.frequency, item.frequency, item.gain, sampleRate), 0)),
    }));
  }

  function drawStepMixEqCurve(canvas, edits) {
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.round(bounds.width * pixelRatio);
    const height = Math.round(bounds.height * pixelRatio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const w = bounds.width;
    const h = bounds.height;
    const left = 42;
    const right = 12;
    const top = 12;
    const bottom = 25;
    const graphWidth = w - left - right;
    const graphHeight = h - top - bottom;
    const minDb = -18;
    const maxDb = 18;
    const sampleRate = state.audioContext?.sampleRate || 44100;
    context.clearRect(0, 0, w, h);
    context.fillStyle = "#141518";
    context.fillRect(0, 0, w, h);
    const toY = (db) => top + (maxDb - Math.max(minDb, Math.min(maxDb, db))) /
      (maxDb - minDb) * graphHeight;
    const toX = (frequency) => left + Math.log(frequency / 20) / Math.log(20000 / 20) * graphWidth;

    context.font = "9px monospace";
    context.textAlign = "right";
    [-12, 0, 12].forEach((db) => {
      const y = toY(db);
      context.strokeStyle = db === 0 ? "#4b4d52" : "#292b30";
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(w - right, y);
      context.stroke();
      context.fillStyle = "#777980";
      context.fillText(`${db} dB`, left - 6, y + 3);
    });
    context.textAlign = "center";
    [[20, "20"], [100, "100"], [1000, "1k"], [10000, "10k"], [20000, "20k"]].forEach(([frequency, label]) => {
      const x = toX(frequency);
      context.strokeStyle = "#292b30";
      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x, h - bottom);
      context.stroke();
      context.fillStyle = "#777980";
      context.fillText(label, x, h - 8);
    });

    const bands = getStepMixEqBands(edits);

    context.beginPath();
    for (let point = 0; point <= 240; point += 1) {
      const xRatio = point / 240;
      const frequency = 20 * (20000 / 20) ** xRatio;
      const db = bands.reduce((sum, band) =>
        sum + getStepMixEqResponseDb(frequency, band.frequency, band.gain, sampleRate), 0);
      const x = left + xRatio * graphWidth;
      if (point === 0) context.moveTo(x, toY(db));
      else context.lineTo(x, toY(db));
    }
    context.strokeStyle = "#a9d788";
    context.lineWidth = 2;
    context.stroke();
    context.lineTo(w - right, toY(0));
    context.lineTo(left, toY(0));
    context.closePath();
    context.fillStyle = "#8ebf7018";
    context.fill();
    context.lineWidth = 1;
    getStepMixEqBandPoints(edits, w, h).forEach(({ x, y }) => {
      context.fillStyle = "#d8efc1";
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();
    });
  }

  function makeSoundProcessingRange(track, key, label, min, max, step, unit, formatValue = (value) => `${value}${unit}`) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control step-mix-control";
    control.dataset.soundEditKey = key;
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    const soundId = getSoundDurationKey(track);
    const current = getSoundProcessingEdits(track);
    if (key === "trimStart") input.max = String(current.trimEnd - 1);
    if (key === "trimEnd") input.min = String(current.trimStart + 1);
    input.value = String(current[key]);
    const value = document.createElement("output");
    value.textContent = formatValue(current[key]);
    input.setAttribute("aria-label", `${track.name} ${label}`);
    input.addEventListener("input", () => {
      const edits = getSoundProcessingEdits(track);
      let nextValue = Number(input.value);
      if (key === "trimStart") nextValue = Math.min(nextValue, edits.trimEnd - 1);
      if (key === "trimEnd") nextValue = Math.max(nextValue, edits.trimStart + 1);
      state.soundProcessingEdits[soundId] = normalizeSoundProcessingEdits({ ...edits, [key]: nextValue });
      const updated = state.soundProcessingEdits[soundId];
      const group = control.closest(".step-mix-group");
      if (key === "trimStart" || key === "trimEnd") {
        const startControl = group.querySelector('[data-sound-edit-key="trimStart"]');
        const endControl = group.querySelector('[data-sound-edit-key="trimEnd"]');
        startControl.querySelector("input").max = String(updated.trimEnd - 1);
        endControl.querySelector("input").min = String(updated.trimStart + 1);
        startControl.querySelector("input").value = String(updated.trimStart);
        endControl.querySelector("input").value = String(updated.trimEnd);
        startControl.querySelector("output").textContent = `${updated.trimStart}%`;
        endControl.querySelector("output").textContent = `${updated.trimEnd}%`;
      }
      value.textContent = formatValue(updated[key]);
      refreshStepMixPreview(track, [
        "fadeIn", "fadeOut", "playbackStartOffset", "sampleStart", "trimStart", "trimEnd",
        "pitch", "playbackMultiplier", "time",
      ].includes(key));
      saveState();
    });
    control.append(caption, input, value);
    return control;
  }

  function makeSoundProcessingToggle(track, key, label) {
    const control = document.createElement("label");
    control.className = "step-mix-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    const soundId = getSoundDurationKey(track);
    input.checked = key === "reverse"
      ? state.soundReverseEdits[soundId] === true
      : getSoundProcessingEdits(track)[key];
    input.setAttribute("aria-label", `${track.name} ${label}`);
    const caption = document.createElement("span");
    caption.textContent = label;
    input.addEventListener("change", () => {
      if (key === "reverse") {
        if (input.checked) state.soundReverseEdits[soundId] = true;
        else delete state.soundReverseEdits[soundId];
      } else {
        const edits = getSoundProcessingEdits(track);
        state.soundProcessingEdits[soundId] = normalizeSoundProcessingEdits({ ...edits, [key]: input.checked });
      }
      refreshStepMixPreview(track, key === "reverse" || key === "normalize" ||
        key === "reversePolarity" || key === "swapStereo");
      saveState();
    });
    control.append(input, caption);
    return control;
  }

  function makeStepTrackMixRange(track, id, label, min, max, step, unit) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control step-mix-control";
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    const currentValue = id === "volume"
      ? Math.round(track.volume * 100)
      : id === "swing" && !Number.isFinite(track.swing) ? state.swing : track[id];
    input.value = String(currentValue);
    input.setAttribute("aria-label", `${track.name} ${label}`);
    const value = document.createElement("output");
    value.textContent = `${currentValue}${unit}`;
    input.addEventListener("input", () => {
      const nextValue = Number(input.value);
      if (id === "volume") {
        track.volume = nextValue / 100;
        updateTrackGains();
      } else {
        track[id] = nextValue;
      }
      value.textContent = `${input.value}${unit}`;
      saveState();
    });
    control.append(caption, input, value);
    return control;
  }

  function removePatternInstrument(track) {
    const pattern = getPattern();
    if (!pattern) return;
    captureCurrentPattern();
    pattern.trackIds = getPatternTrackIds(pattern).filter((id) => id !== track.id);
    delete pattern.cells[track.id];
    delete pattern.variants[track.id];
    if (pattern.stepPianoNotes) delete pattern.stepPianoNotes[track.id];
    track.cells = Array(STEP_COUNT).fill(false);
    track.solo = false;
    if (track.sourceId && !state.patterns.some((item) => item.id !== pattern.id && getPatternTrackIds(item).includes(track.id))) {
      track.gainNode?.disconnect();
      track.panNode?.disconnect();
      state.tracks = state.tracks.filter((item) => item !== track);
      if (track.kind === "sample" || track.sample) {
        deletePersistedDrumSample(track.id).catch(() => showToast("Layer removed, but its saved sample could not be deleted."));
      }
    }
    updateTrackGains();
    renderTracks();
    renderPatternSelectors();
    saveState();
    showToast(`${track.name} removed from ${pattern.name}`);
  }

  function selectPattern(patternId) {
    const pattern = getPattern(patternId);
    if (!pattern) return;
    if (pattern.id === state.selectedPatternId) return;
    if (state.keyboardRecording?.mode === "sequencer") stopPlayback();
    state.selectedStepCells.clear();
    captureCurrentPattern();
    applyPattern(pattern);
    state.selectedPreset = null;
    renderTracks();
    renderPresets();
    renderPatternSelectors();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    updateCollaborationLockUi();
    saveState();
  }

  function getNextPatternName() {
    const highestNumber = state.patterns.reduce((highest, pattern) => {
      const match = /^Pattern (\d+)$/i.exec(pattern.name.trim());
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `Pattern ${highestNumber + 1}`;
  }

  function createPattern(showNotification = true, selectCreated = true) {
    captureCurrentPattern();
    const source = getPattern();
    if (!source) return;
    const trackIds = [...getPatternTrackIds(source)];
    const pattern = {
      id: makeId(),
      name: getNextPatternName(),
      kind: "pattern",
      color: getPatternColor(state.patterns.length),
      steps: source.steps,
      trackIds,
      cells: Object.fromEntries(trackIds.map((trackId) => [trackId, Array(STEP_COUNT).fill(false)])),
      variants: { ...source.variants },
      automation: normalizeTrackAutomation(),
      automationOpen: false,
      gridResolution: getPatternGridResolution(source),
      volume: 1,
      effects: makeDefaultEffects(),
      effectSettings: makeDefaultEffectSettings(),
      effectChain: [],
    };
    state.patterns.push(pattern);
    if (selectCreated) {
      state.selectedStepCells.clear();
      applyPattern(pattern);
      state.selectedPreset = null;
      renderTracks();
    }
    renderPresets();
    renderPatternSelectors();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    saveState();
    if (showNotification) showToast(`${pattern.name} created from the selected pattern`);
    return pattern;
  }

  function renamePattern() {
    const pattern = getPattern();
    if (!pattern) return;
    const name = window.prompt("Rename pattern", pattern.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Pattern name cannot be empty.");
      return;
    }
    if (state.patterns.some((item) => item.id !== pattern.id && item.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast("A pattern with that name already exists.");
      return;
    }
    pattern.name = trimmed;
    renderPatternSelectors();
    if (isSongWorkspace()) renderArrangement();
    saveState();
  }

  function renderHeader() {
    stepsHeader.innerHTML = "";
    $("#sequencer-scale-slider").value = String(Math.round(state.sequencerScale * 100));
    $("#sequencer-scale-value").textContent = `${Math.round(state.sequencerScale * 100)}%`;
    const slotsPerBar = getStepsPerBar();
    const stepCount = getGridStepCount();
    setSequencerGridDimensions(stepCount, slotsPerBar);
    for (let step = 0; step < stepCount; step += 1) {
      const barStep = step % slotsPerBar;
      const stepsPerBeat = slotsPerBar / 4;
      const number = document.createElement("span");
      number.className = `step-number${barStep % stepsPerBeat === 0 ? " is-beat" : ""}${barStep === 0 ? " is-bar" : ""}`;
      number.textContent = String(barStep + 1).padStart(2, "0");
      stepsHeader.append(number);
    }
  }

  function renderTracks() {
    trackList.innerHTML = "";
    const includedTrackIds = new Set(getPatternTrackIds(getPattern()));
    const visibleTracks = state.tracks.filter((track) => includedTrackIds.has(track.id));
    const liveKeys = state.keyboardRecording?.mode === "sequencer" ? getStepKeyboardMap() : null;
    setSequencerGridDimensions(getGridStepCount(), getStepsPerBar());
    visibleTracks.forEach((track) => {
      const row = document.createElement("div");
      row.className = "track-row";
      row.dataset.trackId = track.id;
      row.style.setProperty("--track-color", track.color);
      const slotsPerBar = getStepsPerBar();
      const stepCount = getGridStepCount();
      const cellHeight = 21;
      row.style.minHeight = "44px";

      const meta = document.createElement("div");
      meta.className = "track-meta";
      const color = document.createElement("span");
      color.className = "track-color";
      color.setAttribute("aria-hidden", "true");
      const info = document.createElement("div");
      info.className = "track-info";
      const name = document.createElement("div");
      name.className = "track-name";
      const nameText = document.createElement("span");
      nameText.className = "track-name-text";
      nameText.textContent = track.name;
      const chooseInstrument = document.createElement("button");
      chooseInstrument.className = "track-instrument-picker";
      chooseInstrument.type = "button";
      chooseInstrument.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>';
      chooseInstrument.setAttribute("aria-label", `Choose instrument for ${track.name}`);
      chooseInstrument.setAttribute("aria-haspopup", "dialog");
      chooseInstrument.setAttribute("aria-controls", "step-instrument-dialog");
      chooseInstrument.title = "Choose row instrument";
      chooseInstrument.addEventListener("click", () => openStepInstrumentPicker(track.id));
      name.append(nameText, chooseInstrument);
      const liveKey = liveKeys?.get(track.id);
      if (liveKey) {
        const keyHint = document.createElement("kbd");
        keyHint.className = "live-key-hint";
        keyHint.textContent = liveKey.label;
        name.append(keyHint);
        name.title = `${track.name} · press ${liveKey.label} to record`;
      }
      const subtitle = document.createElement("div");
      subtitle.className = `track-subtitle${track.sample ? " has-sample" : ""}`;
      subtitle.title = track.sample?.name || track.subtitle;
      subtitle.textContent = track.sample?.name || track.subtitle;
      info.append(name, subtitle);
      const controls = document.createElement("div");
      controls.className = "track-controls";
      controls.append(
        makeTrackButton("mute", "Mute track", track),
        makeTrackButton("solo", "Solo track", track),
        makeTrackButton("sample", track.sample ? "Replace loaded sample" : "Load an audio sample", track),
        makeTrackButton("remove-from-pattern", "Remove instrument from this pattern", track),
        makeTrackButton("mix", `Open ${track.name} mix`, track),
      );
      if (track.kind === "sample" && !track.sourceId) controls.append(makeTrackButton("remove", "Remove imported drum sound", track));
      meta.append(color, info, controls);

      const grid = document.createElement("div");
      grid.className = "steps-grid";
      grid.style.setProperty("--step-cell-height", `${cellHeight}px`);
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", `${track.name} steps`);
      for (let step = 0; step < stepCount; step += 1) {
        const cell = document.createElement("button");
        const stepInBar = step % slotsPerBar;
        const stepsPerBeat = slotsPerBar / 4;
        cell.className = `step-cell${track.cells[step] ? " is-on" : ""}${state.selectedStepCells.has(`${track.id}:${step}`) ? " is-selected" : ""}${stepInBar === 0 ? " is-bar" : stepInBar % stepsPerBeat === 0 ? " is-beat" : ""}`;
        cell.type = "button";
        cell.dataset.step = String(step);
        cell.setAttribute("aria-label", `${track.name}, step ${step + 1}${track.cells[step] ? ", on" : ", off"}`);
        cell.setAttribute("aria-pressed", String(track.cells[step]));
        if (state.currentStep === step) cell.classList.add("is-playhead");
        cell.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          stepSelectionAnchor = { trackId: track.id, step };
          if (event.shiftKey) {
            event.preventDefault();
            state.selectedArrangementItems.clear();
            state.arrangementSelectionFromMarquee = false;
            state.selectedPianoNoteIds.clear();
            state.selectedPianoNoteId = null;
            state.pianoSelectionFromMarquee = false;
            updateArrangementSelection();
            document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
            stepSelectionDrag = {
              pointerId: event.pointerId,
              trackId: track.id,
              step,
              startX: event.clientX,
              startY: event.clientY,
              initialSelection: new Set(state.selectedStepCells),
              moved: false,
              marquee: null,
            };
            suppressStepClick = true;
            return;
          }
          if (event.pointerType !== "mouse") return;
          stepPaint = { pointerId: event.pointerId, value: !track.cells[step], changed: false };
          suppressStepClick = true;
          setStepCellValue(track, step, cell, stepPaint.value);
        });
        cell.addEventListener("click", (event) => {
          const cellKey = `${track.id}:${step}`;
          if (suppressStepClick) {
            suppressStepClick = false;
            return;
          }
          stepSelectionAnchor = { trackId: track.id, step };
          if (event.shiftKey) {
            state.selectedArrangementItems.clear();
            state.arrangementSelectionFromMarquee = false;
            state.selectedPianoNoteIds.clear();
            state.selectedPianoNoteId = null;
            state.pianoSelectionFromMarquee = false;
            updateArrangementSelection();
            document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
            state.selectedStepCells.add(cellKey);
            cell.classList.add("is-selected");
            return;
          }
          clearStepCellSelection();
          setStepCellValue(track, step, cell, !track.cells[step]);
          saveState();
        });
        grid.append(cell);
      }
      row.append(meta, grid);
      trackList.append(row);
      renderStepPianoPreview(row, getPattern(), track);
    });
    const addInstrument = document.createElement("button");
    addInstrument.className = "add-step-instrument-row";
    addInstrument.type = "button";
    addInstrument.innerHTML = '<span aria-hidden="true">＋</span> Add instrument';
    addInstrument.setAttribute("aria-haspopup", "dialog");
    addInstrument.setAttribute("aria-controls", "step-instrument-dialog");
    addInstrument.addEventListener("click", () => openStepInstrumentPicker());
    trackList.append(addInstrument);
    $("#track-count").textContent = String(visibleTracks.length).padStart(2, "0");
    if (state.view === "mixer") renderMixer();
    renderInstrumentBrowser();
    renderPianoInstrumentOptions();
  }

  function makeSoundSelect(track, compact = false) {
    const sounds = SOUND_VARIANTS[track.kind];
    if (!sounds) return null;
    const select = document.createElement("select");
    select.className = `sound-variant${compact ? " is-compact" : ""}`;
    select.setAttribute("aria-label", `${track.name} sound`);
    sounds.forEach((sound) => {
      const option = document.createElement("option");
      option.value = sound.id;
      option.textContent = sound.name;
      select.append(option);
    });
    select.value = track.variant || "classic";
    select.addEventListener("change", () => {
      track.variant = select.value;
      saveState();
      renderTracks();
      if (isSongWorkspace()) renderArrangement();
      previewInstrumentSound(track);
    });
    return select;
  }

  async function loadLibrarySample(track) {
    if (track.sample?.buffer) return;
    if (!track.sampleUrl) {
      if (track.kind === "sample") {
        throw new Error(`The audio for ${track.name} is unavailable.`);
      }
      return;
    }
    await ensureAudio();
    let load = librarySampleLoads.get(track.sampleUrl);
    if (!load) {
      load = (async () => {
        const response = await fetch(track.sampleUrl);
        if (!response.ok) throw new Error(`Could not load ${track.name} (${response.status}).`);
        const buffer = await state.audioContext.decodeAudioData(await response.arrayBuffer());
        state.tracks.filter((item) => item.sampleUrl === track.sampleUrl).forEach((item) => {
          item.sample = { name: item.name, buffer };
        });
      })();
      librarySampleLoads.set(track.sampleUrl, load);
    }
    try {
      await load;
    } catch (error) {
      librarySampleLoads.delete(track.sampleUrl);
      throw error;
    }
  }

  async function loadLibrarySamplesForPlayback(workspace) {
    let tracks = [];
    if (workspace === "sequencer") {
      tracks = getPatternTrackIds(getPattern()).map((trackId) => state.tracks.find((track) => track.id === trackId));
    } else if (workspace === "piano-roll") {
      const trackId = state.stepPianoEditContext?.trackId || getMel()?.instrumentId || state.selectedPianoTrackId;
      const track = getPianoTrack(trackId);
      if (track) tracks = [track];
    } else if (workspace === "arrangement") {
      const arrangedPatterns = new Set(state.patternClips.map((clip) => clip.patternId));
      const trackIds = [...arrangedPatterns].flatMap((patternId) => {
        const pattern = getPattern(patternId);
        return pattern ? getPatternTrackIds(pattern) : [];
      });
      tracks = trackIds.map((trackId) => state.tracks.find((track) => track.id === trackId));
      tracks.push(...state.melTracks.filter((track) => track.clips.length)
        .map((track) => getPianoTrack(track.instrumentId)));
    }
    const uniqueSamples = new Map();
    tracks.filter((track) => track && (track.sampleUrl || track.kind === "sample"))
      .forEach((track) => uniqueSamples.set(track.sampleUrl || track.id, track));
    await Promise.all(Array.from(uniqueSamples.values(), loadLibrarySample));
  }

  async function previewInstrumentSound(track) {
    const soundId = getSoundDurationKey(track);
    if (activeInstrumentPreview?.soundId === soundId &&
      (activeInstrumentPreview.pending || activeInstrumentPreview.sources.size > 0)) {
      stopInstrumentSoundPreview();
      return;
    }
    stopInstrumentSoundPreview();
    const request = ++instrumentPreviewSequence;
    const preview = { soundId, track, pending: true, sources: new Set(), gain: null };
    activeInstrumentPreview = preview;
    try {
      await ensureAudio();
      await loadLibrarySample(track);
      if (request !== instrumentPreviewSequence || activeInstrumentPreview !== preview) return;
      if (track.kind === "sample" && !track.sample) {
        throw new Error("This sample is not ready to preview.");
      }
      const startTime = state.audioContext.currentTime + 0.015;
      const outputTrack = state.masterTrack;
      ensureTrackAudio(outputTrack);
      const outputNode = state.audioContext.createGain();
      outputNode.gain.setValueAtTime(0.0001, state.audioContext.currentTime);
      outputNode.gain.linearRampToValueAtTime(1, startTime + 0.02);
      outputNode.connect(outputTrack.gainNode || state.masterGain);
      preview.gain = outputNode;
      instrumentPreviewSourceCollector = preview;
      try {
        if (track.kind === "drumkit") {
          [36, 42, 38, 42, 36, 46, 38, 42].forEach((midi, index) => {
            playPianoNote(track, startTime + index * 0.18, midi, 0.15, 0.8, outputTrack, outputNode);
          });
        } else {
          const duration = track.sample?.buffer.duration || (track.kind === "instrument" ? 0.65 : getStepDuration());
          playPianoNote(
            track,
            startTime,
            getDefaultStepMidi(track),
            duration,
            0.8,
            outputTrack,
            outputNode,
          );
        }
      } finally {
        instrumentPreviewSourceCollector = null;
        preview.pending = false;
        finishInstrumentSoundPreview(preview);
      }
    } catch (error) {
      if (activeInstrumentPreview === preview) {
        stopInstrumentSoundPreview();
        showToast(error.message || `Could not preview ${track.name}.`);
      }
    }
  }

  function finishInstrumentSoundPreview(preview) {
    if (activeInstrumentPreview !== preview || preview.pending || preview.sources.size > 0) return;
    activeInstrumentPreview = null;
    preview.gain?.disconnect();
  }

  function stopInstrumentSoundPreview() {
    instrumentPreviewSequence += 1;
    const preview = activeInstrumentPreview;
    activeInstrumentPreview = null;
    if (!preview) return;
    const context = preview.gain?.context || state.audioContext;
    const stopTime = (context?.currentTime || 0) + 0.02;
    if (preview.gain && context) {
      preview.gain.gain.cancelScheduledValues(context.currentTime);
      preview.gain.gain.setValueAtTime(preview.gain.gain.value, context.currentTime);
      preview.gain.gain.linearRampToValueAtTime(0.0001, stopTime);
    }
    preview.sources.forEach((source) => {
      try {
        source.stop(stopTime);
      } catch (error) {
        if (error.name !== "InvalidStateError") throw error;
      }
    });
    if (preview.gain) window.setTimeout(() => preview.gain.disconnect(), 35);
  }

  function makeTrackButton(type, label, track) {
    const button = document.createElement("button");
    button.className = `track-icon-button${(type === "mute" && track.muted) || (type === "solo" && track.solo) ? " is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    if (type === "mix") {
      button.classList.add("track-mix-button");
      button.textContent = "MIX";
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", "step-track-mix-dialog");
      button.addEventListener("click", () => openStepTrackMix(track));
      return button;
    }
    if (type === "sample") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>';
      button.addEventListener("click", () => {
        state.sampleTrackId = track.id;
        sampleInput.click();
      });
      return button;
    }
    if (type === "remove") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12m-10 0 .7 10h6.6L14 6M8 6V4h4v2m-3 3v4m2-4v4" /></svg>';
      button.addEventListener("click", () => removeImportedDrumTrack(track));
      return button;
    }
    if (type === "remove-from-pattern") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12" /></svg>';
      button.addEventListener("click", () => removePatternInstrument(track));
      return button;
    }
    if (type === "mute") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" /><path d="m14 8 4 4m0-4-4 4" /></svg>';
    } else {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" /><path d="M10 7v6m-2-3h4" /></svg>';
    }
    button.setAttribute("aria-pressed", String(type === "mute" ? track.muted : track.solo));
    button.addEventListener("click", () => {
      if (type === "mute") track.muted = !track.muted;
      else track.solo = !track.solo;
      renderTracks();
      updateTrackGains();
      saveState();
    });
    return button;
  }

  function renderPresets() {
    const select = $("#preload-pattern-select");
    select.replaceChildren(new Option("Preload", ""));
    PRESETS.forEach((preset) => {
      select.add(new Option(`${preset.title} — ${preset.description}`, preset.id));
    });
  }

  function loadPreset(preset) {
    state.selectedPreset = preset.id;
    state.bpm = preset.bpm;
    tempoValue.textContent = String(state.bpm);
    const includedTrackIds = new Set(getPatternTrackIds(getPattern()));
    const slotsPerBar = getStepsPerBar();
    state.tracks.forEach((track) => {
      track.cells.fill(false);
      if (includedTrackIds.has(track.id)) {
        (preset.hits[track.sourceId || track.id] || []).forEach((sixteenthStep) => {
          const step = Math.min(slotsPerBar - 1, Math.round(sixteenthStep * slotsPerBar / 16));
          track.cells[step] = true;
        });
      }
    });
    const pattern = getPattern();
    Object.entries(pattern?.stepPianoNotes || {}).forEach(([trackId, notes]) => {
      const track = state.tracks.find((item) => item.id === trackId);
      if (!track || !Array.isArray(notes)) return;
      pattern.stepPianoNotes[trackId] = [];
      track.cells.slice(0, getGridStepCount(pattern)).forEach((active, step) => {
        if (active) updatePatternStepPianoCell(pattern, track, step, true);
      });
    });
    renderTracks();
    renderPresets();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    saveState();
    showToast(`${preset.title} pattern loaded`);
  }

  function setLength(steps) {
    state.steps = normalizePatternSteps(steps);
    state.liveRecordedHits.clear();
    const activePattern = getPattern();
    if (activePattern) {
      activePattern.steps = state.steps;
      Object.entries(activePattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
        const totalTicks = activePattern.steps * 2;
        activePattern.stepPianoNotes[trackId] = notes
          .filter((note) => note.startTick < totalTicks)
          .map((note) => ({ ...note, durationTicks: Math.min(note.durationTicks, totalTicks - note.startTick) }));
        const ticksPerStep = getGridTicksPerStep(activePattern);
        const cells = Array(STEP_COUNT).fill(false);
        activePattern.stepPianoNotes[trackId].forEach((note) => { cells[Math.floor(note.startTick / ticksPerStep)] = true; });
        activePattern.cells[trackId] = cells;
        const track = state.tracks.find((item) => item.id === trackId);
        if (track) track.cells = [...cells];
      });
    }
    state.patternClips.forEach((clip) => {
      if (getPattern(clip.patternId)) {
        clip.startBar = clampArrangementStart(clip.startBar, getArrangementClipDuration("pattern", clip));
      }
    });
    renderPatternLengthControls();
    renderHeader();
    renderTracks();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    if (state.currentStep >= getGridStepCount()) state.currentStep = -1;
    saveState();
  }

  function setPatternGridResolution(gridResolution) {
    const pattern = getPattern();
    if (!pattern || !GRID_RESOLUTIONS.includes(gridResolution)) return;
    captureCurrentPattern();
    const previousSlotsPerBar = getStepsPerBar(pattern);
    if (previousSlotsPerBar === GRID_STEPS_PER_BAR[gridResolution]) return;
    state.liveRecordedHits.clear();
    const nextSlotsPerBar = GRID_STEPS_PER_BAR[gridResolution];
    const bars = pattern.steps / 16;
    const cells = {};
    getPatternTrackIds(pattern).forEach((trackId) => {
      cells[trackId] = remapGridCells(pattern.cells[trackId] || [], bars, previousSlotsPerBar, nextSlotsPerBar);
    });
    pattern.cells = { ...pattern.cells, ...cells };
    pattern.gridResolution = gridResolution;
    Object.entries(pattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
      const noteCells = Array(STEP_COUNT).fill(false);
      const ticksPerStep = getGridTicksPerStep(pattern);
      notes.forEach((note) => { noteCells[Math.floor(note.startTick / ticksPerStep)] = true; });
      pattern.cells[trackId] = noteCells;
    });
    applyPattern(pattern);
    renderTracks();
    renderPatternSelectors();
    if (isSongWorkspace()) renderArrangement();
    saveState();
  }

  function getStepKeyboardMap(pattern = getPattern()) {
    return new Map(getPatternTrackIds(pattern).map((trackId, index) => {
      const code = LIVE_KEY_CODES[index % LIVE_KEY_CODES.length];
      const shift = index >= LIVE_KEY_CODES.length;
      return [trackId, { code, label: `${shift ? "Shift+" : ""}${liveKeyLabel(code)}` }];
    }));
  }

  function liveKeyLabel(code) {
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    return ({
      Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Semicolon: ";",
      Quote: "'", Backslash: "\\", Comma: ",", Period: ".", Slash: "/",
    })[code] || code;
  }

  function updateKeyboardRecordButtons() {
    [
      ["#step-keyboard-record-button", "sequencer"],
      ["#piano-keyboard-record-button", "piano-roll"],
    ].forEach(([selector, mode]) => {
      const button = $(selector);
      const isRecording = state.keyboardRecording?.mode === mode;
      const countdown = state.keyboardRecordingCountdown?.mode === mode
        ? state.keyboardRecordingCountdown.beatsRemaining
        : null;
      button.classList.toggle("is-recording", isRecording || countdown !== null);
      button.setAttribute("aria-pressed", String(isRecording || countdown !== null));
      button.textContent = isRecording ? "Stop recording" : countdown !== null ? `Count-in ${countdown}` : "Record keys";
    });
  }

  function createLivePattern() {
    captureCurrentPattern();
    const source = getPattern();
    if (!source) return null;
    const trackIds = [...getPatternTrackIds(source)];
    const pattern = {
      id: makeId(),
      name: getNextPatternName(),
      color: getPatternColor(state.patterns.length),
      steps: source.steps,
      trackIds,
      cells: Object.fromEntries(trackIds.map((trackId) => [trackId, Array(STEP_COUNT).fill(false)])),
      variants: { ...source.variants },
      gridResolution: getPatternGridResolution(source),
    };
    state.patterns.push(pattern);
    applyPattern(pattern);
    state.selectedPreset = null;
    renderTracks();
    renderPresets();
    renderPatternSelectors();
    addPatternClip(state.arrangementCursor, pattern.id);
    return pattern;
  }

  async function toggleKeyboardRecording(mode) {
    if (state.keyboardRecordingCountdown) {
      cancelKeyboardRecordingCountdown();
      return;
    }
    if (state.keyboardRecording) {
      stopPlayback();
      return;
    }
    if (state.isPlaying) stopPlayback();
    if (mode === "piano-roll") stopWorkspacePlayback("piano-roll");
    try {
      await ensureAudio();
      if (mode === "piano-roll") {
        state.keyboardRecordingCountdown = { mode, beatsRemaining: 4, timerId: null };
        updateKeyboardRecordButtons();
        startRecordingMetronome();
        scheduleKeyboardRecordingCountIn();
        showToast("Count-in: 4 beats before piano recording starts");
        return;
      }
      let targetId;
      if (mode === "sequencer") {
        const pattern = createLivePattern();
        if (!pattern) return;
        targetId = pattern.id;
      } else {
        createMel();
        const mel = getMel();
        if (!mel) return;
        targetId = mel.id;
        addMelTrack(mel.id, state.arrangementCursor);
        renderPianoRoll();
      }
      state.keyboardRecording = { mode, targetId };
      updateKeyboardRecordButtons();
      if (mode === "sequencer") renderTracks();
      await startPlayback(mode);
      if (!state.isPlaying) {
        state.keyboardRecording = null;
        updateKeyboardRecordButtons();
        renderTracks();
        return;
      }
      showToast(mode === "sequencer"
        ? "Recording keys: use the shortcuts shown on each instrument."
        : "Recording keys: use Z/S/X… and Q/2/W… to play notes.");
    } catch (error) {
      state.keyboardRecording = null;
      updateKeyboardRecordButtons();
      showToast(error.message || "Keyboard recording could not start.");
    }
  }

  function scheduleKeyboardRecordingCountIn() {
    const countdown = state.keyboardRecordingCountdown;
    if (!countdown) return;
    countdown.timerId = window.setTimeout(async () => {
      if (state.keyboardRecordingCountdown !== countdown) return;
      countdown.beatsRemaining -= 1;
      if (countdown.beatsRemaining > 0) {
        updateKeyboardRecordButtons();
        scheduleKeyboardRecordingCountIn();
        return;
      }
      state.keyboardRecordingCountdown = null;
      try {
        createMel();
        const mel = getMel();
        if (!mel) throw new Error("A Mel could not be created for recording.");
        addMelTrack(mel.id, state.arrangementCursor);
        renderPianoRoll();
        state.keyboardRecording = { mode: "piano-roll", targetId: mel.id };
        updateKeyboardRecordButtons();
        await startPlayback("piano-roll");
        if (!state.isPlaying) {
          state.keyboardRecording = null;
          stopRecordingMetronome();
          updateKeyboardRecordButtons();
          return;
        }
        showToast("Recording keys: use Z/S/X… and Q/2/W… to play notes.");
      } catch (error) {
        state.keyboardRecording = null;
        stopRecordingMetronome();
        updateKeyboardRecordButtons();
        showToast(error.message || "Keyboard recording could not start.");
      }
    }, 60000 / state.bpm);
  }

  function cancelKeyboardRecordingCountdown() {
    const countdown = state.keyboardRecordingCountdown;
    if (!countdown) return;
    if (countdown.timerId !== null) window.clearTimeout(countdown.timerId);
    state.keyboardRecordingCountdown = null;
    stopRecordingMetronome();
    updateKeyboardRecordButtons();
    showToast("Piano recording cancelled.");
  }

  function recordStepKeyboardHit(event) {
    if (!state.keyboardRecording || state.keyboardRecording.mode !== "sequencer" ||
      state.view !== "sequencer" || !state.isPlaying || !state.audioContext || event.repeat) return false;
    const keyIndex = LIVE_KEY_CODES.indexOf(event.code);
    if (keyIndex < 0) return false;
    const trackIndex = keyIndex + (event.shiftKey ? LIVE_KEY_CODES.length : 0);
    const pattern = getPattern(state.keyboardRecording.targetId);
    if (!pattern) return false;
    const trackId = getPatternTrackIds(pattern)[trackIndex];
    const track = state.tracks.find((item) => item.id === trackId);
    if (!track) return false;
    event.preventDefault();
    const ticksPerStep = getGridTicksPerStep(pattern);
    const elapsed = Math.max(0, state.audioContext.currentTime - state.playbackStartTime);
    const gridStepCount = getGridStepCount(pattern);
    const gridStepDuration = getSchedulerTickDuration() * ticksPerStep;
    const absoluteGridStep = Math.max(0, Math.ceil(elapsed / gridStepDuration - 0.000001));
    const loopIndex = Math.floor(absoluteGridStep / gridStepCount);
    const gridStep = absoluteGridStep % gridStepCount;
    pattern.cells[track.id] ||= Array(STEP_COUNT).fill(false);
    pattern.cells[track.id][gridStep] = true;
    updatePatternStepPianoCell(pattern, track, gridStep, true);
    state.liveRecordedHits.add(`${pattern.id}:${loopIndex}:${track.id}:${gridStep}`);
    track.cells[gridStep] = true;
    const hasSolo = state.tracks.some((item) => item.solo);
    if (!track.muted && (!hasSolo || track.solo)) {
      const time = state.audioContext.currentTime + 0.01;
      const midi = track.kind === "drumkit" ? 36 : 60 + (keyIndex % 24) + (track.kind === "instrument" ? track.pitch || 0 : 0);
      if (track.kind === "instrument" || track.kind === "drumkit") {
        playPianoNote(track, time, midi, getStepDuration(), 0.85);
      } else {
        triggerTrack(track, time, pattern.variants[track.id] || track.variant, getNoteDuration());
      }
    }
    renderTracks();
    saveState();
    return true;
  }

  function recordPianoKeyboardNote(event) {
    if (!state.keyboardRecording || state.keyboardRecording.mode !== "piano-roll" ||
      state.view !== "piano-roll" || !state.isPlaying || !state.audioContext || event.repeat) return false;
    const midi = PIANO_KEY_MIDI.get(event.code);
    if (midi === undefined) return false;
    const mel = getMel(state.keyboardRecording.targetId);
    const instrument = mel ? getPianoTrack(mel.instrumentId) : null;
    if (!mel || !instrument) return false;
    event.preventDefault();
    const secondsPerBar = 240 / state.bpm;
    const loopTicks = getMelLengthBars(mel) * PIANO_TICKS_PER_BAR;
    const elapsedSeconds = Math.max(0, state.audioContext.currentTime - state.playbackStartTime);
    const elapsedTicks = elapsedSeconds / secondsPerBar * PIANO_TICKS_PER_BAR;
    const startTick = Math.max(0, Math.min(loopTicks - 0.5, snapPianoTick(elapsedTicks % loopTicks, Math.floor)));
    const durationTicks = Math.max(0.5, Math.min(state.pianoNoteLength, loopTicks - startTick));
    const note = {
      id: makeId(),
      trackId: instrument.id,
      midi: constrainPianoPitchToScale(midi),
      startTick,
      durationTicks,
      velocity: 0.8,
    };
    mel.notes.push(note);
    mel.notes.sort((left, right) => left.startTick - right.startTick);
    state.pianoNotes = mel.notes.map((item) => ({ ...item, trackId: instrument.id }));
    state.selectedPianoNoteId = note.id;
    state.selectedPianoNoteIds = new Set([note.id]);
    state.selectedArrangementItems.clear();
    updateArrangementSelection();
    const loopIndex = Math.floor(elapsedSeconds / (loopTicks / PIANO_TICKS_PER_BAR * secondsPerBar));
    state.scheduledPianoNotes.add(`${note.id}:${loopIndex}`);
    playPianoNote(instrument, state.audioContext.currentTime + 0.01, note.midi,
      durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar, note.velocity);
    renderPianoRoll();
    renderArrangement();
    saveState();
    return true;
  }

  function getMasterPitchProcessorSource() {
    return `
      class DansBpmMasterPitchProcessor extends AudioWorkletProcessor {
        static get parameterDescriptors() {
          return [{ name: "semitones", defaultValue: 0, minValue: -36, maxValue: 36, automationRate: "k-rate" }];
        }
        constructor() {
          super();
          this.maxDelayFrames = Math.ceil(sampleRate * 0.1);
          this.bufferSize = this.maxDelayFrames + 2;
          this.buffers = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
          this.writeIndex = 0;
          this.phase = 0.25;
        }
        read(channel, delay) {
          const buffer = this.buffers[channel];
          let position = this.writeIndex - delay;
          while (position < 0) position += this.bufferSize;
          const firstIndex = Math.floor(position);
          const fraction = position - firstIndex;
          const first = buffer[firstIndex];
          const second = buffer[(firstIndex + 1) % this.bufferSize];
          return first + (second - first) * fraction;
        }
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          const output = outputs[0];
          if (!output.length) return true;
          const semitones = parameters.semitones[0];
          const ratio = Math.pow(2, semitones / 12);
          const shift = Math.abs(1 - ratio);
          for (let frame = 0; frame < output[0].length; frame += 1) {
            for (let channel = 0; channel < output.length; channel += 1) {
              const sample = input[channel]?.[frame] ?? input[0]?.[frame] ?? 0;
              this.buffers[channel][this.writeIndex] = sample;
              if (Math.abs(semitones) < 0.001) {
                output[channel][frame] = sample;
                continue;
              }
              const phaseA = this.phase;
              const phaseB = (phaseA + 0.5) % 1;
              const delayA = (semitones > 0 ? 1 - phaseA : phaseA) * this.maxDelayFrames;
              const delayB = (semitones > 0 ? 1 - phaseB : phaseB) * this.maxDelayFrames;
              const mixA = 0.5 - 0.5 * Math.cos(2 * Math.PI * phaseA);
              output[channel][frame] = this.read(channel, delayA) * mixA +
                this.read(channel, delayB) * (1 - mixA);
            }
            if (shift) {
              this.phase += shift / this.maxDelayFrames;
              if (this.phase >= 1) this.phase -= Math.floor(this.phase);
            }
            this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
          }
          return true;
        }
      }
      registerProcessor("dansbpm-master-pitch", DansBpmMasterPitchProcessor);
    `;
  }

  function connectMasterGainDirectly(context) {
    if (state.masterPitchNode?.context === context) {
      state.masterGain.disconnect();
      state.masterPitchNode.disconnect();
      state.masterPitchNode = null;
      masterPitchDirectConnections.delete(context);
    }
    if (masterPitchDirectConnections.has(context)) return;
    state.masterGain.disconnect();
    state.masterGain.connect(state.masterLimiter);
    masterPitchDirectConnections.add(context);
  }

  function createMasterLimiter(context) {
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    limiter.connect(context.destination);
    return limiter;
  }

  async function loadMasterPitchProcessorModule(context) {
    let setup = masterPitchProcessorModules.get(context);
    if (!setup) {
      setup = Promise.resolve().then(async () => {
        const source = new Blob([getMasterPitchProcessorSource()], { type: "text/javascript" });
        const moduleUrl = URL.createObjectURL(source);
        try {
          await context.audioWorklet.addModule(moduleUrl);
        } finally {
          URL.revokeObjectURL(moduleUrl);
        }
      });
      masterPitchProcessorModules.set(context, setup);
    }
    try {
      await setup;
    } catch (error) {
      if (masterPitchProcessorModules.get(context) === setup) {
        masterPitchProcessorModules.delete(context);
      }
      throw error;
    }
  }

  async function connectMasterPitchProcessor(context) {
    if (state.masterPitch !== 0 && state.masterPitchNode?.context === context) return state.masterPitchNode;
    if (context === state.audioContext) await applySelectedAudioOutput(context);
    if (state.masterPitch !== 0 && state.masterPitchNode?.context === context) return state.masterPitchNode;
    if (state.masterPitch === 0 && masterPitchDirectConnections.has(context)) return null;
    if (!context.audioWorklet || typeof window.AudioWorkletNode !== "function") {
      state.masterPitchSupported = false;
      if (state.masterPitch !== 0) showToast("Master pitch shifting is not supported in this browser.");
      connectMasterGainDirectly(context);
      updateProjectKeyIndicator();
      return null;
    }
    await loadMasterPitchProcessorModule(context);
    state.masterPitchSupported = true;
    if (state.masterPitch === 0) {
      connectMasterGainDirectly(context);
      updateProjectKeyIndicator();
      return null;
    }
    const pendingSetup = masterPitchProcessorSetups.get(context);
    if (pendingSetup) return pendingSetup;
    const setup = Promise.resolve().then(() => {
      if (state.masterPitch === 0) {
        connectMasterGainDirectly(context);
        return null;
      }
      const node = new window.AudioWorkletNode(context, "dansbpm-master-pitch", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        channelCount: 2,
        channelCountMode: "explicit",
      });
      node.parameters.get("semitones").setValueAtTime(state.masterPitch, context.currentTime);
      state.masterGain.disconnect();
      masterPitchDirectConnections.delete(context);
      state.masterGain.connect(node);
      node.connect(state.masterLimiter);
      state.masterPitchNode = node;
      return node;
    });
    masterPitchProcessorSetups.set(context, setup);
    try {
      return await setup;
    } finally {
      if (masterPitchProcessorSetups.get(context) === setup) {
        masterPitchProcessorSetups.delete(context);
      }
    }
  }

  async function initializeAudio() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Web Audio is not supported in this browser.");
      state.audioContext = new AudioContext();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.gain.value = 0.82;
      state.masterLimiter = createMasterLimiter(state.audioContext);
      await connectMasterPitchProcessor(state.audioContext);
      ensureTrackAudio(state.masterTrack);
      state.effectTracks.forEach(ensureTrackAudio);
      state.tracks.filter((track) => !track.libraryOnly).forEach(ensureSequencerTrackAudio);
      state.noiseBuffer = createNoiseBuffer(state.audioContext);
    }
    await connectMasterPitchProcessor(state.audioContext);
    ensureTrackAudio(state.masterTrack);
    state.effectTracks.forEach(ensureTrackAudio);
    state.arrangementTracks.forEach(ensureArrangementTrackAudio);
    state.melTracks.forEach(ensureTrackAudio);
    state.patterns.forEach(ensureTrackAudio);
    return state.audioContext;
  }

  async function ensureAudio() {
    const initialization = initializeAudio();
    const context = state.audioContext;
    if (!context) {
      const initializedContext = await initialization;
      await initializedContext.resume();
      return initializedContext;
    }
    const resume = context.resume();
    await Promise.all([initialization, resume]);
    if (context.state !== "running") throw new Error("Audio could not start. Check the browser's audio output.");
    return context;
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    const random = createSeededRandom(0x6d2b79f5);
    for (let index = 0; index < data.length; index += 1) data[index] = random() * 2 - 1;
    return buffer;
  }

  function createSeededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 0x100000000;
    };
  }

  function getStepDuration() {
    return 60 / state.bpm / 4;
  }

  function getSchedulerTickDuration() {
    return getStepDuration() / 2;
  }

  function getNoteDuration() {
    return getStepDuration();
  }

