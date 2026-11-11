  function getPattern(patternId = state.selectedPatternId) {
    return state.patterns.find((pattern) => pattern.id === patternId) || null;
  }

  function getPatternGridResolution(pattern) {
    if (GRID_RESOLUTIONS.includes(pattern?.gridResolution)) return pattern.gridResolution;
    if (GRID_RESOLUTIONS.includes(pattern?.noteLength)) return pattern.noteLength;
    const counts = Object.fromEntries(GRID_RESOLUTIONS.map((resolution) => [resolution, 0]));
    Object.values(pattern?.noteLengths || {}).forEach((length) => {
      if (GRID_RESOLUTIONS.includes(length)) counts[length] += 1;
    });
    return GRID_RESOLUTIONS.reduce((selected, resolution) =>
      counts[resolution] > counts[selected] ? resolution : selected, "1/16");
  }

  function getStepsPerBar(pattern = getPattern()) {
    return GRID_STEPS_PER_BAR[getPatternGridResolution(pattern)] || 16;
  }

  function getGridStepCount(pattern = getPattern()) {
    const bars = pattern ? pattern.steps / 16 : state.steps / 16;
    return bars * getStepsPerBar(pattern);
  }

  function normalizePatternSteps(steps) {
    const bars = Number.isFinite(steps) ? Math.round(steps / 16) : 1;
    return Math.max(1, Math.min(MAX_PATTERN_BARS, bars)) * 16;
  }

  function renderPatternLengthControls() {
    const bars = state.steps / 16;
    const label = `${bars} ${bars === 1 ? "BAR" : "BARS"}`;
    $("#pattern-bars-value").textContent = label;
    $("#decrease-pattern-bars").disabled = bars <= 1;
    $("#increase-pattern-bars").disabled = bars >= MAX_PATTERN_BARS;
  }

  function getPianoTickWidth() {
    return PIANO_TICK_WIDTH * state.pianoScale;
  }

  function getPianoSnapStep() {
    return state.pianoSnapEnabled ? state.pianoSnap : 0.5;
  }

  function snapPianoTick(tick, round = Math.round) {
    return state.pianoSnapEnabled ? round(tick / state.pianoSnap) * state.pianoSnap : tick;
  }

  function setSequencerGridDimensions(stepCount, slotsPerBar = getStepsPerBar()) {
    const scale = state.sequencerScale;
    const cellWidth = 20 * scale;
    const gap = 3 * scale;
    const beatSpace = 4 * scale;
    const padding = 12;
    sequencerGridScroll.style.setProperty("--grid-step-count", String(stepCount));
    sequencerGridScroll.style.setProperty("--grid-step-size", `${cellWidth}px`);
    sequencerGridScroll.style.setProperty("--grid-step-gap", `${gap}px`);
    sequencerGridScroll.style.setProperty("--grid-beat-space", `${beatSpace}px`);
    sequencerGridScroll.style.setProperty("--grid-content-width",
      `${stepCount * cellWidth + Math.max(0, stepCount - 1) * gap +
        Math.max(0, Math.round(stepCount / slotsPerBar) * 3) * beatSpace + padding}px`);
  }

  function getDefaultStepMidi(track) {
    if (Number.isFinite(track.sampleRootMidi)) return track.sampleRootMidi;
    return {
      kick: 36,
      snare: 38,
      clap: 39,
      hat: 42,
      openhat: 46,
      rim: 37,
      drumkit: 36,
    }[track.kind] || 60;
  }

  function getStepPianoNotes(pattern, track) {
    const savedNotes = pattern.stepPianoNotes?.[track.id];
    if (Array.isArray(savedNotes)) return savedNotes.map((note) => ({ ...note, trackId: track.id }));
    const ticksPerStep = getGridTicksPerStep(pattern);
    return Array.from({ length: getGridStepCount(pattern) }, (_, step) => {
      if (!pattern.cells?.[track.id]?.[step]) return null;
      return {
        id: makeId(),
        trackId: track.id,
        midi: getDefaultStepMidi(track),
        startTick: step * ticksPerStep,
        durationTicks: ticksPerStep,
        velocity: 0.8,
      };
    }).filter(Boolean);
  }

  function stepPianoNoteSignature(notes) {
    return JSON.stringify(notes
      .map((note) => [note.startTick, note.durationTicks, note.midi, note.velocity, note.volume, note.attack, note.detune, note.pan])
      .sort((left, right) => left[0] - right[0] || left[2] - right[2] || left[1] - right[1]));
  }

  function updatePatternStepPianoCell(pattern, track, step, value, midi = getDefaultStepMidi(track)) {
    if (!pattern) return;
    const savedNotes = pattern.stepPianoNotes?.[track.id];
    if (!Array.isArray(savedNotes)) return;
    const ticksPerStep = getGridTicksPerStep(pattern);
    const notesInStep = (note) => Math.floor(note.startTick / ticksPerStep) === step;
    if (value) {
      if (!savedNotes.some(notesInStep)) {
        const startTick = step * ticksPerStep;
        savedNotes.push({
          id: makeId(),
          startTick,
          durationTicks: Math.min(ticksPerStep, pattern.steps * 2 - startTick),
          midi,
          velocity: 0.8,
        });
      }
    } else {
      pattern.stepPianoNotes[track.id] = savedNotes.filter((note) => !notesInStep(note));
    }
    pattern.cells[track.id] ||= Array(STEP_COUNT).fill(false);
    pattern.cells[track.id][step] = value;
  }

  function syncStepPianoEdit() {
    const context = state.stepPianoEditContext;
    if (!context) return false;
    const pattern = getPattern(context.patternId);
    const track = getPianoTrack(context.trackId);
    if (!pattern || !track) return false;
    if (!context.hasChanges && stepPianoNoteSignature(state.pianoNotes) === context.initialSignature) return false;
    context.hasChanges = true;
    pattern.stepPianoNotes ||= {};
    pattern.stepPianoNotes[track.id] = state.pianoNotes.map((note) => ({
      id: note.id,
      startTick: note.startTick,
      durationTicks: note.durationTicks,
      midi: note.midi,
      velocity: note.velocity,
      volume: note.volume,
      attack: note.attack,
      detune: note.detune,
      pan: note.pan,
    }));
    const cells = Array(STEP_COUNT).fill(false);
    const ticksPerStep = getGridTicksPerStep(pattern);
    const stepCount = getGridStepCount(pattern);
    state.pianoNotes.forEach((note) => {
      const step = Math.floor(note.startTick / ticksPerStep);
      if (step >= 0 && step < stepCount) cells[step] = true;
    });
    pattern.cells[track.id] = cells;
    if (getPattern()?.id === pattern.id) track.cells = [...cells];
    if (state.view === "sequencer" && getPattern()?.id === pattern.id) renderTracks();
    return true;
  }

  function updateStepPianoEditorControls() {
    const active = Boolean(state.stepPianoEditContext);
    $("#step-piano-context").hidden = !active;
    $("#step-piano-context-label").textContent = active
      ? `${getPianoTrack(state.stepPianoEditContext.trackId)?.name || "Instrument"} · Step progression`
      : "";
    if (active) {
      const pattern = getPattern(state.stepPianoEditContext.patternId);
      const dragSource = $("#mel-drag-source");
      dragSource.textContent = pattern ? `Drag full ${pattern.name} to Track View` : "No pattern selected";
      dragSource.title = pattern ? `Drag the full ${pattern.name} pattern to Track View` : "";
      dragSource.setAttribute("aria-label", dragSource.title || "No pattern selected");
      dragSource.disabled = !pattern;
      dragSource.style.setProperty("--pattern-color", pattern?.color || "var(--accent)");
    }
    ["#mel-select", "#piano-instrument-select", "#piano-bars-select"].forEach((selector) => {
      $(selector).closest("label").hidden = active;
    });
    ["#new-mel-button", "#rename-mel-button", "#piano-keyboard-record-button",
      "#import-midi-button", "#export-midi-button"].forEach((selector) => {
      $(selector).hidden = active;
    });
    $("#mel-drag-source").hidden = false;
  }

  function openStepInstrumentPianoRoll(trackId) {
    const pattern = getPattern();
    const track = getPianoTrack(trackId);
    if (!pattern || !track || !getPatternTrackIds(pattern).includes(trackId)) return;
    captureCurrentMel();
    const notes = getStepPianoNotes(pattern, track);
    state.stepPianoEditContext = {
      patternId: pattern.id,
      trackId,
      initialSignature: stepPianoNoteSignature(notes),
      hasChanges: Array.isArray(pattern.stepPianoNotes?.[trackId]),
      previousCursorTick: state.pianoCursorTick,
      previousView: state.view,
    };
    state.selectedPianoTrackId = trackId;
    state.pianoNotes = notes;
    state.pianoBars = pattern.steps / 16;
    state.pianoCursorTick = 0;
    state.selectedPianoNoteId = null;
    state.selectedPianoNoteIds.clear();
    state.pianoSelectionFromMarquee = false;
    updateStepPianoEditorControls();
    $("#step-track-mix-dialog").close();
    setWorkspaceView("piano-roll");
  }

  function closeStepInstrumentPianoRoll() {
    const context = state.stepPianoEditContext;
    if (!context) return;
    syncStepPianoEdit();
    state.stepPianoEditContext = null;
    loadMel(state.selectedMelId);
    state.pianoCursorTick = context.previousCursorTick;
    updateStepPianoEditorControls();
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
  }

  function renderStepPianoPreview(row, pattern, track) {
    row.querySelector(".step-piano-preview")?.remove();
    const notes = pattern.stepPianoNotes?.[track.id];
    const grid = row.querySelector(".steps-grid");
    if (!Array.isArray(notes)) {
      grid?.classList.remove("has-piano-preview");
      return;
    }
    if (!grid) return;
    grid.classList.add("has-piano-preview");
    const preview = document.createElement("div");
    preview.className = "step-piano-preview";
    preview.setAttribute("aria-hidden", "true");
    grid.append(preview);
    const cells = [...grid.querySelectorAll(".step-cell")];
    const previewBounds = preview.getBoundingClientRect();
    const ticksPerStep = getGridTicksPerStep(pattern);
    const tickToX = (tick) => {
      const step = Math.min(cells.length - 1, Math.max(0, Math.floor(tick / ticksPerStep)));
      const fraction = Math.min(1, Math.max(0, tick / ticksPerStep - step));
      const cellBounds = cells[step].getBoundingClientRect();
      const nextX = cells[step + 1]?.getBoundingClientRect().left ?? cellBounds.right;
      return cellBounds.left - previewBounds.left + (nextX - cellBounds.left) * fraction;
    };
    for (let bar = 1; bar < pattern.steps / 16; bar += 1) {
      const line = document.createElement("span");
      line.className = "step-piano-preview-bar";
      line.style.left = `${tickToX(bar * 32)}px`;
      preview.append(line);
    }
    notes.forEach((note) => {
      const item = document.createElement("span");
      const midiRange = PIANO_TOP_MIDI - PIANO_BOTTOM_MIDI;
      const pitch = Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi));
      item.className = "step-piano-preview-note";
      const left = tickToX(note.startTick);
      item.style.left = `${left}px`;
      item.style.width = `${Math.max(2, tickToX(note.startTick + note.durationTicks) - left)}px`;
      item.style.top = `${(PIANO_TOP_MIDI - pitch) / (midiRange + 1) * 100}%`;
      preview.append(item);
    });
  }

  function renderStepPianoPreviews() {
    const pattern = getPattern();
    if (!pattern) return;
    trackList.querySelectorAll(".track-row").forEach((row) => {
      const track = state.tracks.find((item) => item.id === row.dataset.trackId);
      if (track) renderStepPianoPreview(row, pattern, track);
    });
  }

  function setArrangementScale(scale) {
    const timeline = $("#timeline-scroll");
    const barOffset = timeline.scrollLeft / BAR_WIDTH;
    state.arrangementScale = Math.max(0.5, Math.min(4, scale));
    BAR_WIDTH = BASE_BAR_WIDTH * state.arrangementScale;
    renderArrangement();
    timeline.scrollLeft = barOffset * BAR_WIDTH;
  }

  function setStepCellValue(track, step, cell, value) {
    if (track.cells[step] === value) return;
    track.cells[step] = value;
    const pattern = getPattern();
    updatePatternStepPianoCell(pattern, track, step, value);
    if (Array.isArray(pattern.stepPianoNotes?.[track.id])) {
      renderStepPianoPreview(cell.closest(".track-row"), pattern, track);
    }
    cell.classList.toggle("is-on", value);
    cell.setAttribute("aria-pressed", String(value));
    cell.setAttribute("aria-label", `${track.name}, step ${step + 1}${value ? ", on" : ", off"}`);
    if (stepPaint) stepPaint.changed = true;
  }

  function clearStepCellSelection() {
    if (!state.selectedStepCells.size) return;
    state.selectedStepCells.clear();
    document.querySelectorAll(".step-cell.is-selected").forEach((cell) => cell.classList.remove("is-selected"));
  }

  function clearStepSelectionOnPointerDown(event) {
    if (state.view !== "sequencer" || event.shiftKey) return;
    clearStepCellSelection();
  }

  function paintStepAtPointer(event) {
    if (!stepPaint || event.pointerId !== stepPaint.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target instanceof Element ? target.closest(".step-cell") : null;
    const row = cell?.closest(".track-row");
    const track = row && state.tracks.find((item) => item.id === row.dataset.trackId);
    const step = Number(cell?.dataset.step);
    if (cell && track && Number.isInteger(step)) {
      event.preventDefault();
      setStepCellValue(track, step, cell, stepPaint.value);
    }
  }

  function updateStepSelectionDrag(event) {
    const drag = stepSelectionDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return;
    drag.moved = true;
    if (!drag.marquee) {
      drag.marquee = document.createElement("div");
      drag.marquee.className = "selection-marquee";
      drag.marquee.style.position = "fixed";
      document.body.append(drag.marquee);
    }
    const left = Math.min(drag.startX, event.clientX);
    const top = Math.min(drag.startY, event.clientY);
    const right = Math.max(drag.startX, event.clientX);
    const bottom = Math.max(drag.startY, event.clientY);
    Object.assign(drag.marquee.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
    });
    const selection = new Set(drag.initialSelection);
    document.querySelectorAll(".step-cell").forEach((cell) => {
      const bounds = cell.getBoundingClientRect();
      if (bounds.left <= right && bounds.right >= left && bounds.top <= bottom && bounds.bottom >= top) {
        const trackId = cell.closest(".track-row")?.dataset.trackId;
        if (trackId) selection.add(`${trackId}:${cell.dataset.step}`);
      }
    });
    state.selectedStepCells = selection;
    document.querySelectorAll(".step-cell").forEach((cell) => {
      const key = `${cell.closest(".track-row")?.dataset.trackId}:${cell.dataset.step}`;
      cell.classList.toggle("is-selected", state.selectedStepCells.has(key));
    });
  }

  function finishStepSelectionDrag(event) {
    const drag = stepSelectionDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    updateStepSelectionDrag(event);
    if (!drag.moved) state.selectedStepCells.add(`${drag.trackId}:${drag.step}`);
    drag.marquee?.remove();
    stepSelectionDrag = null;
    document.querySelectorAll(".step-cell").forEach((cell) => {
      const key = `${cell.closest(".track-row")?.dataset.trackId}:${cell.dataset.step}`;
      cell.classList.toggle("is-selected", state.selectedStepCells.has(key));
    });
    window.setTimeout(() => { suppressStepClick = false; }, 0);
  }

  function finishStepPaint(event) {
    if (!stepPaint || event.pointerId !== stepPaint.pointerId) return;
    const changed = stepPaint.changed;
    stepPaint = null;
    if (changed) saveState();
    window.setTimeout(() => { suppressStepClick = false; }, 0);
  }

  function remapGridCells(cells, bars, previousSlotsPerBar, nextSlotsPerBar) {
    const remapped = Array(STEP_COUNT).fill(false);
    for (let index = 0; index < bars * previousSlotsPerBar; index += 1) {
      if (!cells[index]) continue;
      const bar = Math.floor(index / previousSlotsPerBar);
      const stepInBar = index % previousSlotsPerBar;
      const nextStepInBar = Math.min(nextSlotsPerBar - 1, Math.round(stepInBar * nextSlotsPerBar / previousSlotsPerBar));
      remapped[bar * nextSlotsPerBar + nextStepInBar] = true;
    }
    return remapped;
  }

  function getGridTicksPerStep(pattern = getPattern()) {
    return 32 / getStepsPerBar(pattern);
  }

  function getGridEventsForTick(pattern, clockTick) {
    const ticksPerStep = getGridTicksPerStep(pattern);
    const subdivisions = Math.max(1, Math.round(1 / ticksPerStep));
    const stepCount = getGridStepCount(pattern);
    return Array.from({ length: subdivisions }, (_, subdivision) => {
      const tickOffset = subdivision / subdivisions;
      const step = (clockTick + tickOffset) / ticksPerStep;
      return Number.isInteger(step) ? { step: step % stepCount, tickOffset } : null;
    }).filter(Boolean);
  }

  function isSongWorkspace() {
    return state.view === "arrangement" || state.view === "piano-roll" || state.view === "mixer";
  }

  function renderViewLayout() {
    const main = $("#arrangement-main");
    $("#workspace-area").hidden = state.workspaceHidden;
    $("#track-view-area").hidden = state.trackViewHidden;
    $("#view-resizer").hidden = state.workspaceHidden || state.trackViewHidden;
    if (state.workspaceHidden) main.style.gridTemplateRows = "0px 0px minmax(0, 1fr)";
    else if (state.trackViewHidden) main.style.gridTemplateRows = "minmax(0, 1fr) 0px 0px";
    else main.style.gridTemplateRows = `minmax(0, ${state.workspaceRatio}fr) 12px minmax(0, ${100 - state.workspaceRatio}fr)`;
    $("#view-resizer").setAttribute("aria-valuenow", String(state.workspaceRatio));
    $("#view-resizer").setAttribute("aria-valuetext", `Workspace ${state.workspaceRatio}%, Track View ${100 - state.workspaceRatio}%`);
    $("#hide-workspace-button").hidden = state.workspaceHidden;
    $("#show-track-view-button").hidden = !state.trackViewHidden;
    $("#hide-track-view-button").hidden = state.trackViewHidden;
    $("#show-workspace-button").hidden = !state.workspaceHidden;
    updateWorkspaceFullscreenButton();
    updateTrackViewFullscreenButton();
    updatePianoRulerViewport();
  }

  function updateWorkspaceFullscreenButton() {
    const button = $("#workspace-fullscreen-button");
    const isFullscreen = document.fullscreenElement === $("#workspace-area");
    button.textContent = isFullscreen ? "Restore" : "Expand";
    button.setAttribute("aria-label", isFullscreen ? "Restore workspace from fullscreen" : "Expand workspace to fullscreen");
    button.setAttribute("aria-pressed", String(isFullscreen));
  }

  function updateTrackViewFullscreenButton() {
    const button = $("#track-view-fullscreen-button");
    const isFullscreen = document.fullscreenElement === $("#track-view-area");
    button.textContent = isFullscreen ? "Restore" : "Expand";
    button.setAttribute("aria-label", isFullscreen ? "Restore Track View" : "Expand Track View to fullscreen");
    button.setAttribute("aria-pressed", String(isFullscreen));
  }

  async function toggleWorkspaceFullscreen() {
    const workspace = $("#workspace-area");
    try {
      if (document.fullscreenElement === workspace) {
        await document.exitFullscreen();
      } else if (document.fullscreenElement) {
        showToast("Exit the current fullscreen view first.");
      } else if (!workspace.requestFullscreen) {
        showToast("Fullscreen is unavailable in this browser.");
      } else {
        await workspace.requestFullscreen();
      }
    } catch (error) {
      showToast(`Could not change workspace fullscreen: ${error.message || "the browser denied the request"}`);
    }
  }

  async function toggleTrackViewFullscreen() {
    const trackView = $("#track-view-area");
    try {
      if (document.fullscreenElement === trackView) {
        await document.exitFullscreen();
      } else if (document.fullscreenElement) {
        showToast("Exit the current fullscreen view first.");
      } else if (!trackView.requestFullscreen) {
        showToast("Fullscreen is unavailable in this browser.");
      } else {
        await trackView.requestFullscreen();
      }
    } catch (error) {
      showToast(`Could not change Track View fullscreen: ${error.message || "the browser denied the request"}`);
    }
  }

  document.addEventListener("fullscreenchange", () => {
    updateWorkspaceFullscreenButton();
    updateTrackViewFullscreenButton();
    updatePianoRulerViewport();
  });

  function setViewVisibility(workspaceHidden, trackViewHidden, focusTarget = null) {
    state.workspaceHidden = workspaceHidden;
    state.trackViewHidden = trackViewHidden;
    renderViewLayout();
    saveState();
    if (focusTarget) $(`#${focusTarget}`).focus();
    else if (workspaceHidden) $("#show-workspace-button").focus();
    else if (trackViewHidden) $("#show-track-view-button").focus();
  }

  function setWorkspaceRatio(ratio) {
    state.workspaceRatio = Math.max(20, Math.min(80, Math.round(ratio)));
    renderViewLayout();
    saveState();
  }

  function getPatternColor(index) {
    if (index < PATTERN_COLORS.length) return PATTERN_COLORS[index];
    return `hsl(${Math.round(index * 137.508 % 360)} 68% 66%)`;
  }

  function isPatternColor(color) {
    return typeof color === "string" && (/^#[\da-f]{6}$/i.test(color) || /^hsl\(\d{1,3} 68% 66%\)$/.test(color));
  }

  function getPatternTrackIds(pattern) {
    const trackIds = Array.isArray(pattern?.trackIds)
      ? pattern.trackIds
      : state.tracks.filter((track) => !track.libraryOnly).map((track) => track.id);
    return trackIds.filter((trackId) => {
      const track = state.tracks.find((item) => item.id === trackId);
      return track && !track.libraryOnly && track.kind !== "drumkit";
    });
  }

  function makePatternSnapshot(id, name, color = getPatternColor(state.patterns.length)) {
    const cells = {};
    const variants = {};
    state.tracks.forEach((track) => {
      cells[track.id] = Array.from({ length: STEP_COUNT }, (_, index) => track.cells[index] === true);
      if (SOUND_VARIANTS[track.kind]) variants[track.id] = track.variant || "classic";
    });
    return {
      id,
      name,
      kind: "pattern",
      color,
      steps: state.steps,
      trackIds: state.tracks.filter((track) => !track.libraryOnly && track.kind !== "drumkit").map((track) => track.id),
      cells,
      variants,
      gridResolution: "1/16",
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      effects: makeDefaultEffects(),
      effectSettings: makeDefaultEffectSettings(),
      effectChain: [],
    };
  }

  function captureCurrentPattern() {
    const pattern = getPattern();
    if (!pattern) return;
    pattern.steps = state.steps;
    const trackIds = getPatternTrackIds(pattern).filter((id) => state.tracks.some((track) => track.id === id));
    pattern.trackIds = trackIds;
    pattern.cells = {};
    pattern.variants = {};
    pattern.gridResolution = getPatternGridResolution(pattern);
    state.tracks.filter((track) => trackIds.includes(track.id)).forEach((track) => {
      pattern.cells[track.id] = Array.from({ length: STEP_COUNT }, (_, index) => track.cells[index] === true);
      if (SOUND_VARIANTS[track.kind]) pattern.variants[track.id] = track.variant || "classic";
    });
  }

  function clearSelectedStepCells() {
    const selected = new Set(state.selectedStepCells);
    let changed = false;
    state.tracks.forEach((track) => track.cells.forEach((active, step) => {
      if (active && selected.has(`${track.id}:${step}`)) {
        track.cells[step] = false;
        updatePatternStepPianoCell(getPattern(), track, step, false);
        changed = true;
      }
    }));
    state.selectedStepCells.clear();
    if (changed) {
      renderTracks();
      saveState();
    } else {
      document.querySelectorAll(".step-cell.is-selected").forEach((cell) => cell.classList.remove("is-selected"));
    }
  }

  function applyPattern(pattern) {
    state.selectedPatternId = pattern.id;
    state.steps = normalizePatternSteps(pattern.steps);
    const patternTrackIds = new Set(getPatternTrackIds(pattern));
    state.tracks.forEach((track) => {
      track.cells = patternTrackIds.has(track.id)
        ? Array.from({ length: STEP_COUNT }, (_, index) => pattern.cells?.[track.id]?.[index] === true)
        : Array(STEP_COUNT).fill(false);
      const variant = pattern.variants?.[track.id];
      if (patternTrackIds.has(track.id) && SOUND_VARIANTS[track.kind]) {
        track.variant = SOUND_VARIANTS[track.kind].some((sound) => sound.id === variant) ? variant : "classic";
      }
    });
    renderPatternLengthControls();
    $("#grid-resolution-select").value = getPatternGridResolution(pattern);
    renderHeader();
  }

  function renderPatternSelectors() {
    const select = $("#sequencer-pattern-select");
    select.replaceChildren();
    state.patterns.forEach((pattern) => {
      const option = document.createElement("option");
      option.value = pattern.id;
      option.textContent = pattern.name;
      select.append(option);
    });
    select.value = state.selectedPatternId;
    const selected = getPattern();
    $("#grid-resolution-select").value = getPatternGridResolution(selected);
  }

