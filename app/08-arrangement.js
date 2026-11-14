  function renderArrangement() {
    syncStepPianoEdit();
    captureCurrentPattern();
    captureCurrentMel();
    BAR_WIDTH = BASE_BAR_WIDTH * state.arrangementScale;
    $("#arrangement-empty").hidden = state.view !== "arrangement";
    $("#arrangement-scale-slider").value = String(Math.round(state.arrangementScale * 100));
    $("#arrangement-scale-value").textContent = `${Math.round(state.arrangementScale * 100)}%`;
    const snapButton = $("#arrangement-snap-button");
    snapButton.textContent = `SNAP ${state.arrangementSnap ? "ON" : "OFF"}`;
    snapButton.setAttribute("aria-pressed", String(state.arrangementSnap));
    $("#arrangement-tab-count").textContent = String(Math.max(
      1,
      state.arrangementTracks.length + state.melTracks.length + state.patternClips.length,
    ));
    renderPatternSelectors();
    renderInstrumentBrowser();
    renderRecordingBrowser();

    const width = state.arrangementBars * BAR_WIDTH;
    const labels = $("#arrangement-track-labels");
    const content = $("#timeline-content");
    const automationLabelsByTrackId = new Map();
    const automationLanesByTrackId = new Map();
    labels.replaceChildren();
    content.replaceChildren();
    content.style.width = `${width}px`;

    const ruler = document.createElement("div");
    ruler.className = "timeline-ruler";
    ruler.style.width = `${width}px`;
    ruler.style.gridTemplateColumns = `repeat(${state.arrangementBars}, ${BAR_WIDTH}px)`;
    ruler.addEventListener("pointerdown", startArrangementRulerInteraction);
    for (let bar = 0; bar < state.arrangementBars; bar += 1) {
      const marker = document.createElement("div");
      marker.className = "timeline-bar";
      marker.textContent = `BAR ${String(bar + 1).padStart(2, "0")}`;
      ruler.append(marker);
    }
    const { startBar: loopStartBar, endBar: loopEndBar } = getArrangementLoopRange();
    const loopRange = document.createElement("div");
    loopRange.className = `arrangement-loop-range${state.arrangementLoopEnabled ? "" : " is-disabled"}`;
    loopRange.style.left = `${loopStartBar * BAR_WIDTH}px`;
    loopRange.style.width = `${(loopEndBar - loopStartBar) * BAR_WIDTH}px`;
    ruler.append(loopRange);
    const rulerPlayhead = document.createElement("div");
    rulerPlayhead.className = "arrangement-ruler-playhead";
    rulerPlayhead.setAttribute("aria-hidden", "true");
    ruler.append(rulerPlayhead);
    content.append(ruler);

    const arrangedPatternIds = new Set(state.patternClips.map((clip) => clip.trackId || clip.patternId));
    const patternTracks = state.patterns.filter((pattern) => arrangedPatternIds.has(pattern.id));
    const hasTimelineTracks = patternTracks.length > 0 || state.melTracks.length > 0 || state.arrangementTracks.length > 0;
    patternTracks.forEach((pattern) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === pattern.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = pattern.id;
      label.style.setProperty("--track-color", pattern.color || "var(--accent)");
      label.innerHTML = `<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name"></div><div class="arrangement-label-type">Beat pattern · ${getPatternTrackIds(pattern).length} instruments</div></div>`;
      label.querySelector(".arrangement-label-name").textContent = pattern.name;
      label.addEventListener("click", () => {
        selectPattern(pattern.id);
        selectArrangementTrack(pattern.id);
      });
      const controls = makeArrangementTrackControls(pattern);
      controls.actions.append(makeAutomationToggle(pattern));
      label.append(controls.actions, controls.volume);
      labels.append(label);

      const lane = createTimelineLane(`pattern:${pattern.id}`, width);
      state.patternClips
        .filter((clip) => (clip.trackId || clip.patternId) === pattern.id)
        .forEach((clip) => lane.append(createPatternClip(clip)));
      content.append(lane);
      appendAutomationRows(pattern, width, labels, content, automationLabelsByTrackId, automationLanesByTrackId);
    });

    state.melTracks.forEach((track) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === track.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = track.id;
      label.style.setProperty("--track-color", track.color);
      label.innerHTML = '<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name"></div><div class="arrangement-label-type"></div></div>';
      label.querySelector(".arrangement-label-name").textContent = track.name;
      const instrument = getPianoTrack(track.instrumentId);
      const type = label.querySelector(".arrangement-label-type");
      type.classList.add("mel-track-type");
      type.append("Mel · ");
      const chooseInstrument = document.createElement("button");
      chooseInstrument.className = "mel-track-instrument-button";
      chooseInstrument.type = "button";
      chooseInstrument.textContent = instrument?.name || "Choose instrument";
      chooseInstrument.title = `Choose instrument for ${track.name}`;
      chooseInstrument.setAttribute("aria-label", `Choose instrument for ${track.name}`);
      chooseInstrument.setAttribute("aria-haspopup", "dialog");
      chooseInstrument.setAttribute("aria-controls", "step-instrument-dialog");
      chooseInstrument.addEventListener("click", (event) => {
        event.stopPropagation();
        selectArrangementTrack(track.id);
        openStepInstrumentPicker(track.id, "mel-track");
      });
      type.append(chooseInstrument);
      label.addEventListener("click", (event) => {
        if (!event.target.closest(".mixer-track-button")) selectArrangementTrack(track.id);
      });
      const controls = makeArrangementTrackControls(track);
      controls.actions.append(makeAutomationToggle(track));
      label.append(controls.actions, controls.volume);
      labels.append(label);
      const lane = createTimelineLane(`mel:${track.id}`, width);
      track.clips.forEach((clip) => lane.append(createMelClipElement(track, clip)));
      content.append(lane);
      appendAutomationRows(track, width, labels, content, automationLabelsByTrackId, automationLanesByTrackId);
    });

    state.arrangementTracks.forEach((track) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === track.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = track.id;
      label.style.setProperty("--track-color", track.color);
      const color = document.createElement("span");
      color.className = "track-color";
      const info = document.createElement("div");
      info.className = "arrangement-label-info";
      const name = document.createElement("div");
      name.className = "arrangement-label-name";
      name.textContent = track.name;
      const type = document.createElement("div");
      type.className = "arrangement-label-type";
      const isRecording = state.recordingPreview?.track === track;
      type.textContent = `${track.clips.length} recording${track.clips.length === 1 ? "" : "s"}${isRecording ? " · recording" : ""}`;
      info.append(name, type);
      const actions = document.createElement("div");
      actions.className = "arrangement-label-actions";
      const add = document.createElement("button");
      add.type = "button";
      add.title = "Add a recording to this track";
      add.setAttribute("aria-label", `Add recording to ${track.name}`);
      add.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>';
      add.addEventListener("click", () => requestRecordingImport(track.id));
      const mute = document.createElement("button");
      mute.type = "button";
      mute.className = track.muted ? "is-active" : "";
      mute.title = track.muted ? "Unmute track" : "Mute track";
      mute.setAttribute("aria-label", mute.title);
      mute.setAttribute("aria-pressed", String(track.muted));
      mute.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" /><path d="m14 8 4 4m0-4-4 4" /></svg>';
      mute.addEventListener("click", () => {
        track.muted = !track.muted;
        updateTrackGains();
        renderArrangement();
        persistTrackClips(track);
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
      actions.append(add, mute, solo, makeOpenMixerButton(track), makeAutomationToggle(track));
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
      volume.addEventListener("change", () => {
        persistTrackClips(track);
        saveState();
      });
      label.append(color, info, actions, volume);
      label.addEventListener("click", (event) => {
        if (event.target.closest("button, input")) return;
        selectArrangementTrack(track.id);
      });
      labels.append(label);

      const lane = createTimelineLane(track.id, width);
      track.clips.forEach((clip) => lane.append(createAudioClip(track, clip)));
      content.append(lane);
      appendAutomationRows(track, width, labels, content, automationLabelsByTrackId, automationLanesByTrackId);
    });

    const rows = [
      ...patternTracks.map((track) => ({
        id: track.id, type: "pattern", insertAfterTrackId: track.insertAfterTrackId,
      })),
      ...state.melTracks.map((track) => ({
        id: track.id, type: "mel", insertAfterTrackId: track.insertAfterTrackId,
      })),
      ...state.arrangementTracks.map((track) => ({
        id: track.id, type: "audio", insertAfterTrackId: track.insertAfterTrackId,
      })),
    ];
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const childrenByParent = new Map();
    const childIds = new Set();
    rows.forEach((row) => {
      const parentId = row.insertAfterTrackId;
      if (!parentId || !rowsById.has(parentId) || parentId === row.id) return;
      const children = childrenByParent.get(parentId) || [];
      children.push(row);
      childrenByParent.set(parentId, children);
      childIds.add(row.id);
    });
    const orderedRows = [];
    const addedRowIds = new Set();
    const appendRow = (row) => {
      if (!row || addedRowIds.has(row.id)) return;
      addedRowIds.add(row.id);
      orderedRows.push(row);
      childrenByParent.get(row.id)?.forEach(appendRow);
    };
    rows.filter((row) => !childIds.has(row.id)).forEach(appendRow);
    rows.forEach(appendRow);
    const labelsById = new Map(Array.from(labels.children, (label) => [label.dataset.trackId, label]));
    const lanesById = new Map(Array.from(content.querySelectorAll(".timeline-lane"), (lane) =>
      [lane.dataset.trackId, lane]));
    const orderedLabels = orderedRows.flatMap((row) => [
      labelsById.get(row.id),
      ...(automationLabelsByTrackId.get(row.id) || []),
    ]).filter(Boolean);
    const orderedLanes = orderedRows.flatMap((row) => [
      lanesById.get(row.type === "pattern" ? `pattern:${row.id}` : row.type === "mel" ? `mel:${row.id}` : row.id),
      ...(automationLanesByTrackId.get(row.id) || []),
    ]).filter(Boolean);
    const timelineRuler = content.firstElementChild;
    labels.replaceChildren(...orderedLabels);
    content.replaceChildren(timelineRuler, ...orderedLanes);

    const dropLabel = document.createElement("div");
    const dropLane = createTimelineLane(hasTimelineTracks ? "new-track" : DEFAULT_ARRANGEMENT_TRACK_ID, width);
    dropLane.classList.add("new-track-drop-lane");
    const dropHint = document.createElement("span");
    if (hasTimelineTracks) {
      dropLabel.className = "arrangement-label new-track-drop-label";
      dropLabel.textContent = "Drop item for a new track";
      dropHint.textContent = "DROP AN ITEM HERE TO CREATE A TRACK";
    } else {
      dropLabel.className = "arrangement-label default-track-label";
      dropLabel.dataset.trackId = DEFAULT_ARRANGEMENT_TRACK_ID;
      dropLabel.style.setProperty("--track-color", TRACK_COLORS[0]);
      dropLabel.innerHTML = '<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name">Track 1</div><div class="arrangement-label-type">Drop an item to start</div></div>';
      dropLabel.addEventListener("click", () => selectArrangementTrack(DEFAULT_ARRANGEMENT_TRACK_ID));
      dropHint.textContent = "DROP AN ITEM HERE TO START TRACK 1";
    }
    labels.append(dropLabel);
    dropLane.append(dropHint);
    content.append(dropLane);
    $("#arrangement-track-count").textContent = String(hasTimelineTracks
      ? patternTracks.length + state.melTracks.length + state.arrangementTracks.length
      : 1).padStart(2, "0");
    updateArrangementLoopUI();
    updateArrangementCursorMarker();
    updateArrangementSelection();
    updateProjectKeyIndicator();
    if (state.view === "mixer") renderMixer();
  }

  function makeAutomationToggle(track) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `automation-toggle${track.automationOpen ? " is-active" : ""}`;
    button.textContent = "A";
    button.title = `${track.automationOpen ? "Hide" : "Show"} volume and pan automation`;
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(Boolean(track.automationOpen)));
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      track.automationOpen = !track.automationOpen;
      renderArrangement();
      saveState();
    });
    return button;
  }

  function appendAutomationRows(track, width, labels, content, labelsByTrack, lanesByTrack) {
    if (!track.automationOpen) return;
    const properties = ["volume", "pan"];
    const automationLabels = properties.map((property) => {
      const label = document.createElement("div");
      label.className = "automation-label";
      label.textContent = property === "volume" ? "VOL AUTOMATION" : "PAN AUTOMATION";
      label.style.setProperty("--track-color", track.color || "var(--accent)");
      return label;
    });
    const automationLanes = properties.map((property) => createArrangementAutomationLane(track, property, width));
    labelsByTrack.set(track.id, automationLabels);
    lanesByTrack.set(track.id, automationLanes);
    automationLabels.forEach((label) => labels.append(label));
    automationLanes.forEach((lane) => content.append(lane));
  }

  function drawArrangementAutomationLane(lane, track, property, activeIndex = -1) {
    const svg = lane.querySelector("svg");
    svg.replaceChildren();
    const width = Math.max(1, state.arrangementBars * BAR_WIDTH);
    const height = 42;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const points = normalizeTrackAutomation(track.automation)[property]
      .map((point, index) => ({ ...point, index }));
    if (points.length) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "automation-curve");
      path.setAttribute("d", points.map((point, index) => {
        const x = point.bar * BAR_WIDTH;
        const y = property === "volume"
          ? height - 6 - point.value * (height - 12)
          : height - 6 - (point.value + 1) / 2 * (height - 12);
        return `${index ? "L" : "M"}${x},${y}`;
      }).join(" "));
      svg.append(path);
    }
    points.forEach((point) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const y = property === "volume"
        ? height - 6 - point.value * (height - 12)
        : height - 6 - (point.value + 1) / 2 * (height - 12);
      circle.setAttribute("class", `automation-point${point.index === activeIndex ? " is-active" : ""}`);
      circle.setAttribute("cx", String(point.bar * BAR_WIDTH));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", "5");
      circle.dataset.automationIndex = String(point.index);
      circle.setAttribute("role", "slider");
      circle.setAttribute("tabindex", "0");
      circle.setAttribute("aria-label", `${track.name} ${property} automation point at bar ${point.bar + 1}`);
      circle.setAttribute("aria-valuemin", property === "volume" ? "0" : "-1");
      circle.setAttribute("aria-valuemax", "1");
      circle.setAttribute("aria-valuenow", String(point.value));
      circle.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Delete", "Backspace"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const automation = normalizeTrackAutomation(track.automation);
        const edited = automation[property][point.index];
        if (!edited) return;
        if (event.key === "Delete" || event.key === "Backspace") automation[property].splice(point.index, 1);
        else if (event.key === "ArrowLeft") edited.bar -= 0.25;
        else if (event.key === "ArrowRight") edited.bar += 0.25;
        else edited.value += (event.key === "ArrowUp" ? 1 : -1) * (property === "volume" ? 0.05 : 0.1);
        track.automation = normalizeTrackAutomation(automation);
        saveState();
        renderArrangement();
      });
      svg.append(circle);
    });
  }

  function createArrangementAutomationLane(track, property, width) {
    const lane = document.createElement("div");
    lane.className = `timeline-automation-lane is-${property}`;
    lane.dataset.automationTrackId = track.id;
    lane.dataset.automationProperty = property;
    lane.style.width = `${width}px`;
    lane.style.setProperty("--bar-width", `${BAR_WIDTH}px`);
    lane.style.setProperty("--track-color", track.color || "var(--accent)");
    lane.setAttribute("aria-label", `${track.name} ${property} automation lane`);
    lane.title = "Click to add or edit points; drag to move; Shift-click or select and press Delete to remove.";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "false");
    lane.append(svg);
    drawArrangementAutomationLane(lane, track, property);
    let activeIndex = -1;
    const getPoint = (event) => {
      const bounds = lane.getBoundingClientRect();
      const maxBar = state.arrangementBars;
      const bar = Math.max(0, Math.min(maxBar, snapArrangementBar((event.clientX - bounds.left) / BAR_WIDTH)));
      const position = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      const value = property === "volume" ? 1 - position : 1 - position * 2;
      return { bar, value };
    };
    const finishEdit = () => {
      if (activeIndex < 0) return;
      activeIndex = -1;
      track.automation = normalizeTrackAutomation(track.automation);
      saveState();
      renderArrangement();
    };
    lane.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const automation = normalizeTrackAutomation(track.automation);
      track.automation = automation;
      const pointElement = event.target.closest("[data-automation-index]");
      if (pointElement && (event.detail > 1 || event.shiftKey)) {
        automation[property].splice(Number(pointElement.dataset.automationIndex), 1);
        track.automation = normalizeTrackAutomation(automation);
        saveState();
        renderArrangement();
        return;
      }
      if (pointElement) {
        activeIndex = Number(pointElement.dataset.automationIndex);
      } else {
        const point = getPoint(event);
        const existingIndex = automation[property].findIndex((item) => Math.abs(item.bar - point.bar) < 0.001);
        if (existingIndex >= 0) {
          activeIndex = existingIndex;
          automation[property][activeIndex].value = point.value;
        } else {
          automation[property].push({ ...point, id: makeId() });
          automation[property].sort((left, right) => left.bar - right.bar);
          activeIndex = automation[property].findIndex((item) => item.bar === point.bar);
        }
      }
      lane.setPointerCapture(event.pointerId);
      const point = getPoint(event);
      if (automation[property][activeIndex]) Object.assign(automation[property][activeIndex], point);
      drawArrangementAutomationLane(lane, track, property, activeIndex);
    });
    lane.addEventListener("pointermove", (event) => {
      if (activeIndex < 0) return;
      const point = getPoint(event);
      const edited = track.automation[property][activeIndex];
      if (!edited) return;
      Object.assign(edited, point);
      drawArrangementAutomationLane(lane, track, property, activeIndex);
    });
    lane.addEventListener("pointerup", finishEdit);
    lane.addEventListener("pointercancel", finishEdit);
    return lane;
  }

  function getMixerSourceTracks() {
    const selectedPatternIsRoutedToCopy = state.patternClips.some((clip) =>
      clip.patternId === state.selectedPatternId && (clip.trackId || clip.patternId) !== clip.patternId);
    const patternTrackIds = new Set([
      ...(selectedPatternIsRoutedToCopy ? [] : [state.selectedPatternId]),
      ...state.patternClips.map((clip) => clip.trackId || clip.patternId),
    ]);
    return [
      ...state.patterns.filter((track) => patternTrackIds.has(track.id))
        .map((track) => ({ track, type: "Pattern" })),
      ...state.melTracks.map((track) => ({ track, type: "Mel" })),
      ...state.arrangementTracks.map((track) => ({ track, type: "Audio" })),
    ];
  }

  function getMixerTracks() {
    return [
      { track: state.masterTrack, type: "Master" },
      ...state.effectTracks.map((track) => ({ track, type: "Effects" })),
      ...getMixerSourceTracks(),
    ].filter(({ track }) => track);
  }

  function createEffectTrack() {
    let number = 1;
    while (state.effectTracks.some((track) => track.name === `Effects ${number}`)) number += 1;
    const track = makeMixerBusTrack("mixer-effects", { id: makeId(), name: `Effects ${number}` });
    state.effectTracks.push(track);
    state.selectedMixerTrackId = track.id;
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildMixerAudioRouting();
    }
    saveState();
    renderMixer();
  }

  function removeEffectTrack(track) {
    if (!state.effectTracks.includes(track)) return;
    if (state.mixerRoutingDialogTrackId === track.id) $("#mixer-routing-dialog").close();
    disconnectTrackAudio(track);
    state.effectTracks = state.effectTracks.filter((item) => item !== track);
    if (state.selectedMixerTrackId === track.id) state.selectedMixerTrackId = MASTER_MIXER_TRACK_ID;
    rebuildMixerAudioRouting();
    saveState();
    renderMixer();
  }

  function renameEffectTrack(track) {
    const name = window.prompt("Rename Effects Track", track.name)?.trim();
    if (!name || name === track.name) return;
    track.name = name;
    saveState();
    renderMixer();
  }

  function getEffectPresetsStorageKey() {
    return `${EFFECT_PRESETS_STORAGE_PREFIX}${state.currentUser}`;
  }

  function loadEffectPresets() {
    state.effectPresets = [];
    if (!state.currentUser) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(getEffectPresetsStorageKey()) || "[]");
      if (!Array.isArray(saved)) throw new Error("saved presets are invalid");
      state.effectPresets = saved
        .filter((preset) => typeof preset?.id === "string" && typeof preset?.name === "string" && preset.name.trim())
        .map((preset) => ({
          id: preset.id,
          name: preset.name.trim(),
          effects: makeDefaultEffects(preset.effects),
          effectSettings: makeDefaultEffectSettings(preset.effectSettings),
          effectChain: Array.isArray(preset.effectChain)
            ? [...new Set(preset.effectChain.filter((id) => EFFECT_IDS.has(id)))]
            : [],
        }));
    } catch (error) {
      showToast(`Could not load effects presets: ${error.message || "browser storage is unavailable."}`);
    }
  }

  function persistEffectPresets(presets) {
    if (!state.currentUser) {
      showToast("Choose a profile before saving effects presets.");
      return false;
    }
    try {
      window.localStorage.setItem(getEffectPresetsStorageKey(), JSON.stringify(presets));
      return true;
    } catch (error) {
      showToast(`Could not save effects preset: ${error.message || "browser storage is unavailable."}`);
      return false;
    }
  }

  function saveEffectTrackPreset(track) {
    ensureTrackMixerState(track);
    const name = window.prompt("Save effects preset", track.name)?.trim();
    if (!name) return;
    const existing = state.effectPresets.find((preset) => preset.name.toLowerCase() === name.toLowerCase());
    if (existing && !window.confirm(`Replace the "${existing.name}" effects preset?`)) return;
    const preset = {
      id: existing?.id || makeId(),
      name,
      effects: makeDefaultEffects(track.effects),
      effectSettings: makeDefaultEffectSettings(track.effectSettings),
      effectChain: [...track.effectChain],
    };
    const presets = existing
      ? state.effectPresets.map((item) => item.id === existing.id ? preset : item)
      : [...state.effectPresets, preset];
    if (!persistEffectPresets(presets)) return;
    state.effectPresets = presets;
    showToast(`Saved "${name}" effects preset.`);
    renderMixer();
  }

  function applyEffectTrackPreset(track, presetId) {
    const preset = state.effectPresets.find((item) => item.id === presetId);
    if (!state.effectTracks.includes(track) || !preset) return;
    track.effects = makeDefaultEffects(preset.effects);
    track.effectSettings = makeDefaultEffectSettings(preset.effectSettings);
    track.effectChain = [...preset.effectChain];
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    }
    saveState();
    renderMixer();
    showToast(`Applied "${preset.name}" to ${track.name}.`);
  }

  function setEffectTrackRouting(track, sourceTrackId, routed) {
    if (routed) {
      state.effectTracks.forEach((effectTrack) => {
        if (effectTrack !== track) {
          effectTrack.routedTrackIds = effectTrack.routedTrackIds.filter((id) => id !== sourceTrackId);
        }
      });
      if (!track.routedTrackIds.includes(sourceTrackId)) track.routedTrackIds.push(sourceTrackId);
    } else {
      track.routedTrackIds = track.routedTrackIds.filter((id) => id !== sourceTrackId);
    }
    rebuildMixerAudioRouting();
    saveState();
    renderMixer();
  }

  function openMixerRoutingDialog(track) {
    if (!state.effectTracks.includes(track)) return;
    state.mixerRoutingDialogTrackId = track.id;
    $("#mixer-routing-title").textContent = track.name;
    const choices = $("#mixer-routing-choices");
    choices.replaceChildren();
    const sources = getMixerSourceTracks();
    if (!sources.length) {
      const empty = document.createElement("span");
      empty.className = "mixer-routing-empty";
      empty.textContent = "Add a pattern, Mel, or audio track to route it here.";
      choices.append(empty);
    }
    sources.forEach(({ track: sourceTrack, type }) => {
      const label = document.createElement("label");
      label.className = "mixer-routing-choice";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = track.routedTrackIds.includes(sourceTrack.id);
      checkbox.addEventListener("change", () => {
        setEffectTrackRouting(track, sourceTrack.id, checkbox.checked);
      });
      const name = document.createElement("span");
      name.textContent = `${sourceTrack.name} · ${type}`;
      label.append(checkbox, name);
      choices.append(label);
    });
    $("#mixer-routing-dialog").showModal();
  }

  function renderMixer() {
    const root = $("#mixer-content");
    const channels = getMixerTracks();
    root.replaceChildren();
    channels.forEach(({ track }) => ensureTrackMixerState(track));
    if (!channels.some(({ track }) => track.id === state.selectedMixerTrackId)) {
      state.selectedMixerTrackId = state.masterTrack.id;
    }

    const trackList = document.createElement("div");
    trackList.className = "mixer-track-list";
    channels.forEach(({ track }) => {
      const row = document.createElement("section");
      row.className = `mixer-track-row${track.id === state.selectedMixerTrackId ? " is-selected" : ""}`;
      row.dataset.trackId = track.id;
      const title = document.createElement("button");
      title.className = "mixer-track-title";
      title.type = "button";
      title.textContent = track.name;
      title.setAttribute("aria-pressed", String(track.id === state.selectedMixerTrackId));
      title.addEventListener("click", () => {
        selectArrangementTrack(track.id);
        renderMixer();
      });
      if (track.kind === "mixer-effects") {
        const titleGroup = document.createElement("div");
        titleGroup.className = "mixer-track-title-group";
        const renameButton = document.createElement("button");
        renameButton.className = "mixer-track-action";
        renameButton.type = "button";
        renameButton.textContent = "Rename";
        renameButton.setAttribute("aria-label", `Rename ${track.name}`);
        renameButton.addEventListener("click", () => renameEffectTrack(track));
        const routeButton = document.createElement("button");
        routeButton.className = "mixer-track-action";
        routeButton.type = "button";
        routeButton.textContent = "Route";
        routeButton.setAttribute("aria-label", `Route tracks through ${track.name}`);
        routeButton.addEventListener("click", () => {
          selectArrangementTrack(track.id);
          renderMixer();
          openMixerRoutingDialog(track);
        });
        titleGroup.append(title, renameButton, routeButton);
        row.append(titleGroup, makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track), makeMixerPanKnob(track));
      } else {
        row.append(title, makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track), makeMixerPanKnob(track));
      }
      const effectTarget = document.createElement("div");
      effectTarget.className = "mixer-track-effects";
      effectTarget.setAttribute("aria-label", `${track.name} effects; drop effects here`);
      effectTarget.addEventListener("dragover", (event) => {
        if (!Array.from(event.dataTransfer?.types || []).includes("application/x-dansbpm-effect")) return;
        event.preventDefault();
        effectTarget.classList.add("is-drop-target");
      });
      effectTarget.addEventListener("dragleave", (event) => {
        if (!effectTarget.contains(event.relatedTarget)) effectTarget.classList.remove("is-drop-target");
      });
      effectTarget.addEventListener("drop", (event) => {
        event.preventDefault();
        effectTarget.classList.remove("is-drop-target");
        const effectId = event.dataTransfer?.getData("application/x-dansbpm-effect");
        if (effectId) addMixerEffect(track, effectId);
      });
      if (track.kind === "mixer-effects") {
        const presetControls = document.createElement("div");
        presetControls.className = "mixer-effect-presets";
        const savePresetButton = document.createElement("button");
        savePresetButton.className = "mixer-track-action";
        savePresetButton.type = "button";
        savePresetButton.textContent = "Save preset";
        savePresetButton.setAttribute("aria-label", `Save ${track.name} effects as a preset`);
        savePresetButton.addEventListener("click", () => saveEffectTrackPreset(track));
        const presetSelect = document.createElement("select");
        presetSelect.setAttribute("aria-label", `Saved effects presets for ${track.name}`);
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = state.effectPresets.length ? "Choose preset…" : "No saved presets";
        presetSelect.append(placeholder);
        state.effectPresets.forEach((preset) => {
          const option = document.createElement("option");
          option.value = preset.id;
          option.textContent = preset.name;
          presetSelect.append(option);
        });
        presetSelect.disabled = state.effectPresets.length === 0;
        const applyPresetButton = document.createElement("button");
        applyPresetButton.className = "mixer-track-action";
        applyPresetButton.type = "button";
        applyPresetButton.textContent = "Apply";
        applyPresetButton.disabled = true;
        applyPresetButton.setAttribute("aria-label", `Apply saved effects preset to ${track.name}`);
        presetSelect.addEventListener("change", () => {
          applyPresetButton.disabled = !presetSelect.value;
        });
        applyPresetButton.addEventListener("click", () => applyEffectTrackPreset(track, presetSelect.value));
        presetControls.append(savePresetButton, presetSelect, applyPresetButton);
        effectTarget.append(presetControls);
      }
      effectTarget.append(makeMixerEffectSlots(track));
      row.append(effectTarget);
      trackList.append(row);
    });

    const library = document.createElement("aside");
    library.className = "mixer-effects-library";
    const libraryTitle = document.createElement("h2");
    const masterSelected = state.selectedMixerTrackId === state.masterTrack.id;
    libraryTitle.textContent = masterSelected ? "Master effects" : "Available effects";
    const libraryHint = document.createElement("p");
    libraryHint.textContent = masterSelected
      ? "Add effects to the master output"
      : "Drag an effect onto a track; add Sidechain to choose its source and depth";
    const effectList = document.createElement("div");
    effectList.className = "mixer-effects-library-list";
    EFFECT_CATEGORIES.forEach((category) => {
      const group = document.createElement("section");
      group.className = "mixer-effect-category";
      const heading = document.createElement("h3");
      heading.textContent = category.name;
      const categoryEffects = document.createElement("div");
      categoryEffects.className = "mixer-effect-category-list";
      category.effects.forEach(([id, name]) => {
        const effect = document.createElement("button");
        effect.className = "mixer-library-effect";
        effect.type = "button";
        effect.draggable = true;
        effect.textContent = name;
        effect.dataset.effectId = id;
        effect.addEventListener("dragstart", (event) => {
          event.dataTransfer?.setData("application/x-dansbpm-effect", id);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
        });
        effect.addEventListener("click", () => {
          const track = channels.find(({ track: item }) => item.id === state.selectedMixerTrackId)?.track || channels[0].track;
          addMixerEffect(track, id, true);
        });
        categoryEffects.append(effect);
      });
      group.append(heading, categoryEffects);
      effectList.append(group);
    });
    library.append(libraryTitle, libraryHint, effectList);
    root.append(trackList, library);
    syncMixerMeters();
  }

  function makeMixerVolumeMonitor(track) {
    const meter = document.createElement("div");
    meter.className = "mixer-volume-monitor";
    meter.dataset.trackId = track.id;
    meter.dataset.level = "0";
    meter.setAttribute("role", "meter");
    meter.setAttribute("aria-label", `${track.name} active volume`);
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "100");
    meter.setAttribute("aria-valuenow", "0");
    const fill = document.createElement("span");
    fill.className = "mixer-volume-monitor-fill";
    meter.append(fill);
    return meter;
  }

  function syncMixerMeters() {
    if (state.mixerMeterAnimation !== null) {
      cancelAnimationFrame(state.mixerMeterAnimation);
      state.mixerMeterAnimation = null;
    }
    const tracksById = new Map(getMixerTracks().map(({ track }) => [track.id, track]));
    const meters = Array.from(document.querySelectorAll(".mixer-volume-monitor"), (meter) => ({
      element: meter,
      fill: meter.querySelector(".mixer-volume-monitor-fill"),
      track: tracksById.get(meter.dataset.trackId),
      samples: null,
    }));
    const resetMeters = () => meters.forEach(({ element, fill }) => {
      element.dataset.level = "0";
      element.setAttribute("aria-valuenow", "0");
      if (fill) fill.style.width = "0%";
    });
    if (state.view !== "mixer" || !state.isPlaying) {
      resetMeters();
      return;
    }
    const draw = () => {
      if (state.view !== "mixer" || !state.isPlaying) {
        resetMeters();
        state.mixerMeterAnimation = null;
        return;
      }
      meters.forEach((meter) => {
        const analyser = meter.track?.analyser;
        let target = 0;
        if (analyser) {
          if (!meter.samples || meter.samples.length !== analyser.fftSize) {
            meter.samples = new Uint8Array(analyser.fftSize);
          }
          analyser.getByteTimeDomainData(meter.samples);
          const sumSquares = meter.samples.reduce((sum, sample) => {
            const amplitude = (sample - 128) / 128;
            return sum + amplitude * amplitude;
          }, 0);
          const rms = Math.sqrt(sumSquares / meter.samples.length);
          if (rms > 0) {
            const decibels = 20 * Math.log10(rms);
            target = Math.max(0, Math.min(100, (decibels + 60) / 60 * 100));
          }
        }
        const previous = Number(meter.element.dataset.level) || 0;
        const level = target >= previous
          ? previous + (target - previous) * 0.65
          : Math.max(target, previous - 2.5);
        meter.element.dataset.level = String(level);
        meter.element.setAttribute("aria-valuenow", String(Math.round(level)));
        if (meter.fill) meter.fill.style.width = `${level}%`;
      });
      state.mixerMeterAnimation = requestAnimationFrame(draw);
    };
    draw();
  }

  function makeMixerVolumeKnob(track) {
    return makeMixerKnob(track, {
      label: "VOL",
      min: 0,
      max: 100,
      getTrackValue: () => track.volume,
      valueToPercent: (value) => value * 100,
      percentToValue: (percent) => percent / 100,
      formatValue: (value) => `${Math.round(value * 100)}%`,
      setTrackValue: (value) => { track.volume = value; },
    });
  }

  function makeMixerPanKnob(track) {
    return makeMixerKnob(track, {
      label: "PAN",
      min: -100,
      max: 100,
      getTrackValue: () => track.pan,
      valueToPercent: (value) => (value + 1) * 50,
      percentToValue: (percent) => percent / 50 - 1,
      formatValue: (value) => {
        const pan = Math.round(value * 100);
        return pan === 0 ? "C" : `${pan < 0 ? "L" : "R"}${Math.abs(pan)}`;
      },
      setTrackValue: (value) => { track.pan = value; },
    });
  }

  function makeMixerKnob(track, {
    label, min, max, getTrackValue, valueToPercent, percentToValue, formatValue, setTrackValue,
  }) {
    const wrapper = document.createElement("label");
    wrapper.className = "mixer-track-knob";
    const caption = document.createElement("span");
    caption.textContent = label;
    const knob = document.createElement("div");
    knob.className = "mixer-volume-knob";
    knob.setAttribute("role", "slider");
    knob.tabIndex = 0;
    knob.setAttribute("aria-label", `${track.name} ${label.toLowerCase()}`);
    knob.setAttribute("aria-valuemin", String(min));
    knob.setAttribute("aria-valuemax", String(max));
    const pointer = document.createElement("span");
    pointer.className = "mixer-volume-knob-pointer";
    knob.append(pointer);
    const value = document.createElement("output");
    const setValue = (nextPercent, persist = false) => {
      const percent = Math.max(0, Math.min(100, Math.round(nextPercent)));
      const trackValue = percentToValue(percent);
      setTrackValue(trackValue);
      const displayValue = Math.round(trackValue * 100);
      const displayText = formatValue(trackValue);
      knob.setAttribute("aria-valuenow", String(displayValue));
      knob.setAttribute("aria-valuetext", displayText);
      knob.style.setProperty("--knob-angle", `${-135 + percent * 2.7}deg`);
      knob.style.setProperty("--knob-fill", `${percent * 0.75}%`);
      value.textContent = displayText;
      updateTrackGains();
      if (persist) saveState();
    };
    const setFromPointer = (event) => {
      const bounds = knob.getBoundingClientRect();
      const angle = Math.atan2(event.clientY - bounds.top - bounds.height / 2, event.clientX - bounds.left - bounds.width / 2) * 180 / Math.PI;
      setValue(((angle - 135 + 360) % 360) / 270 * 100);
    };
    knob.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      knob.setPointerCapture(event.pointerId);
      setFromPointer(event);
      const onMove = (moveEvent) => setFromPointer(moveEvent);
      const onEnd = () => {
        knob.removeEventListener("pointermove", onMove);
        knob.removeEventListener("pointerup", onEnd);
        knob.removeEventListener("pointercancel", onEnd);
        saveState();
      };
      knob.addEventListener("pointermove", onMove);
      knob.addEventListener("pointerup", onEnd);
      knob.addEventListener("pointercancel", onEnd);
    });
    knob.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1;
      setValue(valueToPercent(getTrackValue()) + direction * (event.shiftKey ? 5 : 1), true);
    });
    setValue(valueToPercent(getTrackValue()));
    wrapper.append(caption, knob, value);
    return wrapper;
  }

  function makeMixerRange(track, id, label, min, max, step, unit) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control";
    control.dataset.effectId = id;
    control.classList.toggle("is-selected", state.selectedMixerEffectId === id);
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(track.effects[id] || 0);
    input.setAttribute("aria-label", `${track.name} ${label}`);
    const value = document.createElement("output");
    value.textContent = `${input.value}${unit}`;
    input.addEventListener("input", () => {
      track.effects[id] = Number(input.value);
      value.textContent = `${input.value}${unit}`;
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
      saveState();
      const channel = [...document.querySelectorAll(".mixer-channel")]
        .find((item) => item.dataset.trackId === track.id);
      channel?.querySelector(".mixer-effect-slots")?.replaceWith(makeMixerEffectSlots(track));
    });
    control.append(caption, input, value);
    return control;
  }

  function makeMixerEffectSlots(track) {
    const effects = document.createElement("div");
    effects.className = "mixer-effect-slots";
    effects.setAttribute("aria-label", `${track.name} active effects`);
    const addSlot = (id, name) => {
      const effectButton = document.createElement("button");
      effectButton.className = "mixer-effect-slot";
      effectButton.type = "button";
      effectButton.textContent = id === "eq" ? name : `${name} ${Math.round(track.effects[id])}%`;
      effectButton.title = `Open ${name} settings for ${track.name}`;
      effectButton.addEventListener("click", () => openMixerEffectDialog(track, id));
      effects.append(effectButton);
    };
    addSlot("eq", "EQ");
    track.effectChain.forEach((id) => addSlot(id, EFFECT_NAMES.find(([effectId]) => effectId === id)?.[1] || id));
    if (track.effectChain.length === 0) effects.classList.add("is-empty");
    return effects;
  }

  function addMixerEffect(track, effectId, openEditor = false) {
    if (!EFFECT_IDS.has(effectId)) return;
    ensureTrackMixerState(track);
    if (!track.effectChain.includes(effectId)) {
      track.effectChain.push(effectId);
      if (track.effects[effectId] === 0) track.effects[effectId] = 35;
      if (state.audioContext) {
        ensureTrackAudio(track);
        rebuildTrackEffectChain(track);
      }
      saveState();
      renderMixer();
    }
    selectArrangementTrack(track.id);
    if (openEditor) openMixerEffectDialog(track, effectId);
  }

  function removeMixerEffect(track, effectId) {
    track.effectChain = track.effectChain.filter((id) => id !== effectId);
    track.effects[effectId] = 0;
    if (state.audioContext) rebuildTrackEffectChain(track);
    saveState();
    $("#mixer-effect-dialog").close();
    renderMixer();
  }

  function refreshMixerEffectTrack(track) {
    ensureTrackMixerState(track);
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    }
    saveState();
  }

  function makeMixerSettingRange(labelText, value, min, max, step, unit, onInput) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control";
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = labelText;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    const output = document.createElement("output");
    output.textContent = `${input.value}${unit}`;
    input.addEventListener("input", () => {
      output.textContent = `${input.value}${unit}`;
      onInput(Number(input.value));
    });
    control.append(caption, input, output);
    return control;
  }

  function makeMixerEffectResetButton(track, effectId) {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "quiet-button mixer-reset-effect";
    reset.textContent = "Reset";
    reset.addEventListener("click", () => {
      if (effectId === "eq") {
        ["eqSub", "eqLow", "eqMid", "eqHigh", "eqAir"].forEach((band) => { track.effects[band] = 0; });
      } else {
        track.effects[effectId] = 0;
      }
      refreshMixerEffectTrack(track);
      openMixerEffectDialog(track, effectId);
    });
    return reset;
  }

  function openMixerEffectDialog(track, effectId) {
    ensureTrackMixerState(track);
    if (state.audioContext) ensureTrackAudio(track);
    const dialog = $("#mixer-effect-dialog");
    if (state.mixerEffectAnimation !== null) cancelAnimationFrame(state.mixerEffectAnimation);
    state.mixerEffectAnimation = null;
    if (dialog.open) dialog.close();
    state.mixerEffectDialogTrackId = track.id;
    $("#mixer-effect-track-name").textContent = track.name;
    const title = effectId === "eq" ? "EQ" : EFFECT_NAMES.find(([id]) => id === effectId)?.[1] || effectId;
    $("#mixer-effect-title").textContent = title;
    const content = $("#mixer-effect-dialog-content");
    content.replaceChildren();
    let eqCanvas = null;
    let eqBands = [];

    if (effectId === "eq") {
      const visualizer = document.createElement("div");
      visualizer.className = "mixer-eq-visualizer";
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-label", `${track.name} live EQ spectrum`);
      eqCanvas = canvas;
      visualizer.append(canvas);
      content.append(visualizer);
      eqBands = [
        ["eqSub", "Sub · 20–60 Hz", 40],
        ["eqLow", "Bass · 60–250 Hz", 160],
        ["eqMid", "Mid · 250 Hz–2 kHz", 1000],
        ["eqHigh", "Presence · 2–8 kHz", 5000],
        ["eqAir", "Air · 8–20 kHz", 12000],
      ];
      const controls = document.createElement("div");
      controls.className = "mixer-effect-controls";
      eqBands.forEach(([id, label]) => {
        controls.append(makeMixerSettingRange(label, track.effects[id], -12, 12, 1, " dB", (value) => {
          track.effects[id] = value;
          refreshMixerEffectTrack(track);
        }));
      });
      content.append(controls);
      content.append(makeMixerEffectResetButton(track, effectId));
    } else {
      const controls = document.createElement("div");
      controls.className = "mixer-effect-controls";
      if (effectId === "sidechain") {
        const sourceLabel = document.createElement("label");
        sourceLabel.className = "mixer-effect-control mixer-sidechain-source";
        const sourceCaption = document.createElement("span");
        sourceCaption.className = "mixer-control-caption";
        sourceCaption.textContent = "Source track";
        const sourceSelect = document.createElement("select");
        sourceSelect.setAttribute("aria-label", `Sidechain source for ${track.name}`);
        const noSource = document.createElement("option");
        noSource.value = "";
        noSource.textContent = "Choose a source track";
        sourceSelect.append(noSource);
        getMixerTracks()
          .filter(({ track: sourceTrack }) => sourceTrack.id !== track.id && sourceTrack.kind !== "mixer-master")
          .forEach(({ track: sourceTrack, type }) => {
            const option = document.createElement("option");
            option.value = sourceTrack.id;
            option.textContent = `${sourceTrack.name} · ${type}`;
            sourceSelect.append(option);
          });
        sourceSelect.value = track.effectSettings.sidechain.sourceTrackId || "";
        sourceSelect.addEventListener("change", () => {
          track.effectSettings.sidechain.sourceTrackId = sourceSelect.value;
          refreshMixerEffectTrack(track);
        });
        sourceLabel.append(sourceCaption, sourceSelect);
        controls.append(sourceLabel);
      }
      controls.append(makeMixerSettingRange(effectId === "sidechain" ? "Depth" : "Mix", track.effects[effectId], 0, 100, 1, "%", (value) => {
        track.effects[effectId] = value;
        refreshMixerEffectTrack(track);
      }));
      (EFFECT_PARAMETERS[effectId] || []).forEach(([id, label, min, max, step, unit]) => {
        controls.append(makeMixerSettingRange(label, track.effectSettings[effectId][id], min, max, step, unit, (value) => {
          track.effectSettings[effectId][id] = value;
          refreshMixerEffectTrack(track);
        }));
      });
      content.append(controls);
      content.append(makeMixerEffectResetButton(track, effectId));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "quiet-button mixer-remove-effect";
      remove.textContent = "Remove effect";
      remove.addEventListener("click", () => removeMixerEffect(track, effectId));
      content.append(remove);
    }
    dialog.showModal();
    if (eqCanvas) drawMixerEq(track, eqCanvas, eqBands.map(([id, , frequency]) => [id, frequency]));
  }

  function drawMixerEq(track, canvas, bands) {
    const context = canvas.getContext("2d");
    if (!context) return;
    const draw = () => {
      if (!canvas.isConnected || !$("#mixer-effect-dialog").open || state.mixerEffectDialogTrackId !== track.id) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        state.mixerEffectAnimation = requestAnimationFrame(draw);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const canvasWidth = Math.round(bounds.width * ratio);
      const canvasHeight = Math.round(bounds.height * ratio);
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = bounds.width;
      const height = bounds.height;
      const centerY = height / 2;
      context.fillStyle = "#141518";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "#34363b";
      context.lineWidth = 1;
      [0.2, 0.5, 0.8].forEach((ratioY) => {
        const y = height * ratioY;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      });
      const frequencies = [20, 100, 1000, 10000, 20000];
      frequencies.forEach((frequency) => {
        const x = Math.log(frequency / 20) / Math.log(1000) * width;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
        context.fillStyle = "#85868c";
        context.font = "9px sans-serif";
        context.fillText(frequency >= 1000 ? `${frequency / 1000}k` : String(frequency), x + 3, height - 5);
      });
      if (track.analyser && state.isPlaying) {
        const data = new Uint8Array(track.analyser.frequencyBinCount);
        track.analyser.getByteFrequencyData(data);
        const sampleRate = state.audioContext?.sampleRate || 44100;
        context.fillStyle = "rgba(124, 201, 255, .3)";
        for (let index = 1; index < data.length; index += 1) {
          const frequency = index * sampleRate / track.analyser.fftSize;
          if (frequency < 20 || frequency > 20000) continue;
          const x = Math.log(frequency / 20) / Math.log(1000) * width;
          const barWidth = Math.max(1, width / 180);
          const barHeight = (data[index] / 255) * height * 0.8;
          context.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      }
      const response = (frequency) => bands.reduce((sum, [id, center]) => {
        const gain = track.effects[id];
        const octaves = Math.log2(frequency / center);
        return sum + gain * Math.exp(-(octaves * octaves) / 1.8);
      }, 0);
      context.strokeStyle = "#d4f16c";
      context.lineWidth = 2;
      context.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const frequency = 20 * Math.pow(1000, x / width);
        const gain = Math.max(-12, Math.min(12, response(frequency)));
        const y = centerY - gain / 24 * height;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      state.mixerEffectAnimation = requestAnimationFrame(draw);
    };
    draw();
  }

