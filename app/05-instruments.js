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

  function getSoundDurationScale(track) {
    return state.soundDurationEdits[getSoundDurationKey(track)] ?? 1;
  }

  function getLibrarySamplePlaybackBuffer(track) {
    const buffer = track.sample?.buffer;
    if (!buffer || state.soundReverseEdits[getSoundDurationKey(track)] !== true) return buffer;
    let reversedBuffer = reversedLibrarySampleBuffers.get(buffer);
    if (!reversedBuffer) {
      reversedBuffer = state.audioContext.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const source = buffer.getChannelData(channel);
        const destination = reversedBuffer.getChannelData(channel);
        for (let sample = 0; sample < source.length; sample += 1) {
          destination[sample] = source[source.length - sample - 1];
        }
      }
      reversedLibrarySampleBuffers.set(buffer, reversedBuffer);
    }
    return reversedBuffer;
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
    const slider = $("#sound-duration-slider");
    slider.value = String(Math.round((state.soundDurationEdits[soundId] ?? 1) * 100));
    $("#sound-duration-title").textContent = track.name;
    $("#sound-duration-value").textContent = `${slider.value}%`;
    $("#sound-duration-control").hidden = track.kind === "drumkit";
    $("#sound-duration-reset").hidden = track.kind === "drumkit";
    $("#sound-reverse-control").hidden = track.kind !== "sample";
    $("#sound-reverse-toggle").checked = track.kind === "sample" && state.soundReverseEdits[soundId] === true;
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

  function setSoundDurationFromMenu(value) {
    const menu = $("#sound-duration-menu");
    const soundId = menu.dataset.soundId;
    if (!soundId) return;
    const durationScale = Math.max(0.01, Math.min(1, value / 100));
    if (durationScale === 1) delete state.soundDurationEdits[soundId];
    else state.soundDurationEdits[soundId] = durationScale;
    $("#sound-duration-value").textContent = `${Math.round(durationScale * 100)}%`;
    saveState();
  }

  function setSoundReverseFromMenu(isReversed) {
    const soundId = $("#sound-duration-menu").dataset.soundId;
    if (!soundId) return;
    if (isReversed) state.soundReverseEdits[soundId] = true;
    else delete state.soundReverseEdits[soundId];
    saveState();
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
    const soundGroup = document.createElement("div");
    soundGroup.className = "step-mix-group";
    const soundHeading = document.createElement("h3");
    soundHeading.textContent = "Sound";
    soundGroup.append(
      soundHeading,
      makeStepTrackMixRange(track, "pitch", "Pitch", -12, 12, 1, " st"),
      makeStepTrackMixRange(track, "volume", "Volume", 0, 100, 1, "%"),
      makeStepTrackMixRange(track, "swing", "Swing", 0, 45, 1, "%"),
    );
    const eqGroup = document.createElement("div");
    eqGroup.className = "step-mix-group";
    const eqHeading = document.createElement("h3");
    eqHeading.textContent = "3-band EQ";
    eqGroup.append(
      eqHeading,
      makeMixerRange(track, "eqLow", "Low", -12, 12, 1, " dB"),
      makeMixerRange(track, "eqMid", "Mid", -12, 12, 1, " dB"),
      makeMixerRange(track, "eqHigh", "High", -12, 12, 1, " dB"),
    );
    const editButton = document.createElement("button");
    editButton.className = "quiet-button step-piano-edit-button";
    editButton.type = "button";
    editButton.textContent = "Edit progression in Piano Roll";
    editButton.addEventListener("click", () => openStepInstrumentPianoRoll(track.id));
    controls.append(soundGroup, eqGroup, editButton);
    $("#step-track-mix-dialog").showModal();
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
    try {
      await ensureAudio();
      await loadLibrarySample(track);
      if (track.kind === "sample" && !track.sample) {
        throw new Error("This sample is not ready to preview.");
      }
      const startTime = state.audioContext.currentTime + 0.015;
      const outputTrack = state.masterTrack;
      const outputNode = outputTrack.gainNode || state.masterGain;
      if (track.kind === "drumkit") {
        [36, 42, 38, 42, 36, 46, 38, 42].forEach((midi, index) => {
          playPianoNote(track, startTime + index * 0.18, midi, 0.15, 0.8, outputTrack, outputNode);
        });
        return;
      }
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
    } catch (error) {
      showToast(error.message || `Could not preview ${track.name}.`);
    }
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
        triggerTrack(track, time, gridStep, pattern.variants[track.id] || track.variant, getNoteDuration());
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
    state.masterGain.connect(context.destination);
    masterPitchDirectConnections.add(context);
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
      node.connect(context.destination);
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

