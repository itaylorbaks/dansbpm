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
      label.querySelector(".arrangement-label-name").textContent = pattern.arrangementName || pattern.name;
      label.addEventListener("click", () => {
        const contentPatternId = state.patternClips.find((clip) =>
          (clip.trackId || clip.patternId) === pattern.id)?.patternId || pattern.id;
        selectPattern(contentPatternId);
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
        syncQuickMixerControls(track);
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
    else renderQuickActionPanel();
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
    const patternTrackIds = new Set(state.patternClips.map((clip) => clip.trackId || clip.patternId));
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

  function applyMixerPreset(preset, targetTrack = null) {
    const track = preset.target === "master"
      ? state.masterTrack
      : targetTrack
        || getMixerTracks().find(({ track: item }) => item.id === state.selectedMixerTrackId)?.track;
    if (!track) {
      showToast("Select a mixer track before applying a preset.");
      return;
    }
    if (preset.id === "good-master") {
      state.selectedMixerTrackId = state.masterTrack.id;
      renderMixer();
      showToast("The app's master output limiter is already active.");
      return;
    }
    ensureTrackMixerState(track);
    if (preset.operation === "append") {
      Object.entries(preset.effects).forEach(([id, value]) => { track.effects[id] = value; });
      Object.entries(preset.effectSettings).forEach(([id, settings]) => {
        track.effectSettings[id] = { ...track.effectSettings[id], ...settings };
      });
      track.effectChain = [...new Set([...track.effectChain, ...preset.effectChain.filter((id) => EFFECT_IDS.has(id))])];
    } else {
      track.effects = makeDefaultEffects(preset.effects);
      track.effectSettings = makeDefaultEffectSettings(preset.effectSettings);
      track.effectChain = preset.effectChain.filter((id) => EFFECT_IDS.has(id));
    }
    state.selectedMixerTrackId = track.id;
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    }
    saveState();
    renderMixer();
    showToast(`Applied "${preset.name}" to ${track.name}.`);
  }

  function isMixerDrag(event) {
    const types = Array.from(event.dataTransfer?.types || []);
    return types.includes("application/x-dansbpm-effect") ||
      types.includes("application/x-dansbpm-mixer-preset");
  }

  function handleMixerDrop(event, effectTarget, track) {
    const presetId = event.dataTransfer?.getData("application/x-dansbpm-mixer-preset");
    const preset = MIXER_PRESETS.find((item) => item.id === presetId);
    if (preset) {
      event.preventDefault();
      effectTarget.classList.remove("is-drop-target");
      applyMixerPreset(preset, track);
      return;
    }
    const effectId = event.dataTransfer?.getData("application/x-dansbpm-effect");
    if (!EFFECT_IDS.has(effectId)) return;
    event.preventDefault();
    effectTarget.classList.remove("is-drop-target");
    addMixerEffect(track, effectId);
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
      title.textContent = track.arrangementName || track.name;
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
        const deleteButton = document.createElement("button");
        deleteButton.className = "mixer-track-action";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${track.name}`);
        deleteButton.addEventListener("click", () => removeEffectTrack(track));
        titleGroup.append(title, renameButton, routeButton, deleteButton);
        row.append(titleGroup, makeMixerVolumeKnob(track, true), makeMixerPanKnob(track));
      } else {
        row.append(title, makeMixerVolumeKnob(track, true), makeMixerPanKnob(track));
      }
      const effectTarget = document.createElement("div");
      effectTarget.className = "mixer-track-effects";
      effectTarget.setAttribute("aria-label", `${track.name} effects; drop effects here`);
      effectTarget.addEventListener("dragover", (event) => {
        if (!isMixerDrag(event)) return;
        event.preventDefault();
        effectTarget.classList.add("is-drop-target");
      });
      effectTarget.addEventListener("dragleave", (event) => {
        if (!effectTarget.contains(event.relatedTarget)) effectTarget.classList.remove("is-drop-target");
      });
      effectTarget.addEventListener("drop", (event) => handleMixerDrop(event, effectTarget, track));
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
    libraryTitle.textContent = "Available Presets";
    const libraryHint = document.createElement("p");
    libraryHint.textContent = masterSelected
      ? "Drag a preset onto a track or use Apply; individual effects can be dragged onto tracks."
      : "Drag a preset onto a track or use Apply. Presets replace that track's effect chain.";
    const effectList = document.createElement("div");
    effectList.className = "mixer-effects-library-list";
    const presetGroup = document.createElement("section");
    presetGroup.className = "mixer-effect-category mixer-included-presets";
    const presetHeading = document.createElement("h3");
    presetHeading.textContent = "Included presets";
    const presetCards = document.createElement("div");
    presetCards.className = "mixer-preset-list";
    MIXER_PRESETS.forEach((preset) => {
      const card = document.createElement("article");
      card.className = "mixer-preset-card";
      card.draggable = true;
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("application/x-dansbpm-mixer-preset", preset.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
      });
      const info = document.createElement("div");
      info.className = "mixer-preset-info";
      const name = document.createElement("strong");
      name.textContent = preset.name;
      const description = document.createElement("p");
      description.textContent = preset.description;
      const source = document.createElement("a");
      source.href = preset.source;
      source.draggable = false;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "Source";
      source.setAttribute("aria-label", `${preset.name} source repository`);
      info.append(name, description, source);
      const apply = document.createElement("button");
      apply.className = "mixer-preset-apply";
      apply.type = "button";
      apply.textContent = "Apply";
      apply.title = preset.target === "master"
        ? "Apply to the Master output"
        : `Apply to ${masterSelected ? "Master" : "selected track"}`;
      apply.addEventListener("click", () => applyMixerPreset(preset));
      card.append(info, apply);
      presetCards.append(card);
    });
    presetGroup.append(presetHeading, presetCards);
    effectList.append(presetGroup);
    const effectsHeading = document.createElement("h3");
    effectsHeading.className = "mixer-individual-effects-heading";
    effectsHeading.textContent = "Individual effects";
    effectList.append(effectsHeading);
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
    renderQuickActionPanel();
  }

  function makeMixerVolumeMonitor(track, vertical = false) {
    const meter = document.createElement("div");
    meter.className = "mixer-volume-monitor";
    if (vertical) meter.classList.add("is-vertical");
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
    const isPlaying = () => state.isPlaying || Object.values(state.workspacePlayers).some(Boolean);
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
      if (fill) {
        fill.style.width = element.classList.contains("is-vertical") ? "100%" : "0%";
        fill.style.height = element.classList.contains("is-vertical") ? "0%" : "100%";
      }
    });
    if ((state.view !== "mixer" && !(userSettings.quickActionEnabled && userSettings.quickActionView === "mixer")) ||
      !isPlaying()) {
      resetMeters();
      return;
    }
    const draw = () => {
      if ((state.view !== "mixer" && !(userSettings.quickActionEnabled && userSettings.quickActionView === "mixer")) ||
        !isPlaying()) {
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
        if (meter.fill) {
          if (meter.element.classList.contains("is-vertical")) {
            meter.fill.style.width = "100%";
            meter.fill.style.height = `${level}%`;
          } else meter.fill.style.width = `${level}%`;
        }
      });
      state.mixerMeterAnimation = requestAnimationFrame(draw);
    };
    draw();
  }

  function makeMixerVolumeKnob(track, verticalFader = false) {
    return makeMixerKnob(track, {
      label: "VOL",
      min: 0,
      max: 100,
      getTrackValue: () => track.volume,
      valueToPercent: (value) => value * 100,
      percentToValue: (percent) => percent / 100,
      formatValue: (value) => `${Math.round(value * 100)}%`,
      setTrackValue: (value) => { track.volume = value; },
    }, verticalFader);
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
  }, verticalFader = false) {
    const wrapper = document.createElement("label");
    wrapper.className = `mixer-track-knob${verticalFader ? " mixer-track-volume-control" : ""}`;
    const caption = document.createElement("span");
    caption.textContent = label;
    const knob = document.createElement("div");
    knob.className = `mixer-volume-knob${verticalFader ? " mixer-volume-fader" : ""}`;
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
      if (verticalFader) knob.style.setProperty("--fader-position", `${100 - percent}%`);
      value.textContent = displayText;
      updateTrackGains();
      syncQuickMixerControls(track);
      if (persist) saveState();
    };
    const setFromPointer = (event) => {
      const bounds = knob.getBoundingClientRect();
      if (verticalFader) {
        setValue((bounds.bottom - event.clientY) / bounds.height * 100);
        return;
      }
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
    if (verticalFader) {
      const faderGroup = document.createElement("div");
      faderGroup.className = "mixer-fader-control";
      faderGroup.append(makeMixerVolumeMonitor(track, true), knob);
      wrapper.append(caption, faderGroup, value);
    } else wrapper.append(caption, knob, value);
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
      const quickLane = [...document.querySelectorAll(".quick-mixer-lane")]
        .find((item) => item.dataset.trackId === track.id);
      quickLane?.querySelector(".mixer-effect-slots")?.replaceWith(makeMixerEffectSlots(track));
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

  function makeMixerSettingRange(labelText, value, min, max, step, unit, onInput, parameterId = "") {
    const control = document.createElement("label");
    control.className = "mixer-effect-control";
    if (parameterId) control.dataset.effectParameter = parameterId;
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

  function makeMixerSettingKnob(labelText, value, min, max, step, unit, onInput) {
    const control = document.createElement("label");
    control.className = "mixer-effect-knob-control";
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = labelText;
    const dial = document.createElement("div");
    dial.className = "mixer-effect-dial";
    dial.setAttribute("role", "slider");
    dial.setAttribute("aria-label", labelText);
    dial.setAttribute("aria-valuemin", String(min));
    dial.setAttribute("aria-valuemax", String(max));
    dial.tabIndex = 0;
    const indicator = document.createElement("span");
    indicator.className = "mixer-effect-dial-indicator";
    dial.append(indicator);
    const output = document.createElement("output");
    const span = max - min;
    const precision = String(step).split(".")[1]?.length || 0;
    const setValue = (candidate, notify = true) => {
      const clamped = Math.max(min, Math.min(max, candidate));
      const next = Number((min + Math.round((clamped - min) / step) * step).toFixed(precision));
      const percent = span ? (next - min) / span * 100 : 0;
      dial.style.setProperty("--dial-angle", `${-135 + percent * 2.7}deg`);
      dial.style.setProperty("--dial-fill", `${percent * 0.75}%`);
      dial.setAttribute("aria-valuenow", String(next));
      dial.setAttribute("aria-valuetext", `${next}${unit}`);
      output.textContent = `${next}${unit}`;
      if (notify) onInput(next);
    };
    const setFromPointer = (event) => {
      const bounds = dial.getBoundingClientRect();
      const angle = Math.atan2(
        event.clientY - bounds.top - bounds.height / 2,
        event.clientX - bounds.left - bounds.width / 2,
      ) * 180 / Math.PI;
      const percent = Math.max(0, Math.min(1, ((angle + 135 + 360) % 360) / 270));
      setValue(min + percent * span);
    };
    dial.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      dial.setPointerCapture(event.pointerId);
      setFromPointer(event);
      const onMove = (moveEvent) => setFromPointer(moveEvent);
      const onEnd = () => {
        dial.removeEventListener("pointermove", onMove);
        dial.removeEventListener("pointerup", onEnd);
        dial.removeEventListener("pointercancel", onEnd);
      };
      dial.addEventListener("pointermove", onMove);
      dial.addEventListener("pointerup", onEnd);
      dial.addEventListener("pointercancel", onEnd);
    });
    dial.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1;
      const current = Number(dial.getAttribute("aria-valuenow"));
      setValue(current + direction * step * (event.shiftKey ? 5 : 1));
    });
    control.append(caption, dial, output);
    setValue(value, false);
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
      } else if (effectId === "midSideEq") {
        Object.keys(track.effectSettings.midSideEq).forEach((key) => { track.effectSettings.midSideEq[key] = 0; });
      } else if (effectId === "steepEq") {
        Object.assign(track.effectSettings.steepEq, { frequency: 1000, gain: 0, q: 1, order: 4 });
      } else {
        track.effects[effectId] = 0;
      }
      refreshMixerEffectTrack(track);
      openMixerEffectDialog(track, effectId);
    });
    return reset;
  }

  function getMixerEffectHue(effectId) {
    const index = EFFECT_NAMES.findIndex(([id]) => id === effectId);
    const position = index < 0 ? EFFECT_NAMES.length + 1 : index + 1;
    return String((23 + position * 137) % 360);
  }

  function makeMixerEffectScreen(track, effectId, variant = "") {
    const screen = document.createElement("section");
    screen.className = `mixer-effect-screen${variant ? ` ${variant}` : ""}`;
    screen.dataset.effectId = effectId;
    const heading = document.createElement("div");
    heading.className = "mixer-effect-screen-heading";
    const mode = document.createElement("span");
    mode.textContent = "DSP / SCOPE";
    const status = document.createElement("span");
    status.textContent = track.analyser && (state.isPlaying || Object.values(state.workspacePlayers).some(Boolean))
      ? "SIGNAL LIVE"
      : "SIGNAL READY";
    heading.append(mode, status);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", `${track.name} ${effectId} visualizer`);
    const footer = document.createElement("div");
    footer.className = "mixer-effect-screen-footer";
    footer.textContent = `${effectId.replace(/[A-Z]/g, (letter) => ` ${letter}`).toUpperCase()} · ${track.name}`;
    screen.append(heading, canvas, footer);
    return { screen, canvas };
  }

  function makeMixerEffectDialogDraggable(dialog) {
    if (dialog.dataset.dragBound === "true") return;
    const heading = dialog.querySelector(".mixer-effect-dialog-heading");
    heading.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest("button")) return;
      event.preventDefault();
      const bounds = dialog.getBoundingClientRect();
      const offsetX = event.clientX - bounds.left;
      const offsetY = event.clientY - bounds.top;
      dialog.style.left = `${bounds.left}px`;
      dialog.style.top = `${bounds.top}px`;
      dialog.style.transform = "none";
      heading.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const left = Math.max(8, Math.min(window.innerWidth - bounds.width - 8, moveEvent.clientX - offsetX));
        const top = Math.max(8, Math.min(window.innerHeight - bounds.height - 8, moveEvent.clientY - offsetY));
        dialog.style.left = `${left}px`;
        dialog.style.top = `${top}px`;
      };
      const finish = () => {
        heading.removeEventListener("pointermove", move);
        heading.removeEventListener("pointerup", finish);
        heading.removeEventListener("pointercancel", finish);
      };
      heading.addEventListener("pointermove", move);
      heading.addEventListener("pointerup", finish);
      heading.addEventListener("pointercancel", finish);
    });
    dialog.dataset.dragBound = "true";
  }

  function openMixerEffectDialog(track, effectId) {
    ensureTrackMixerState(track);
    if (state.audioContext) ensureTrackAudio(track);
    const dialog = $("#mixer-effect-dialog");
    if (state.mixerEffectAnimation !== null) cancelAnimationFrame(state.mixerEffectAnimation);
    state.mixerEffectAnimation = null;
    if (dialog.open) dialog.close();
    state.mixerEffectDialogTrackId = track.id;
    dialog.dataset.effectId = effectId;
    dialog.style.width = effectId === "time12" ? "640px" : "";
    dialog.style.left = "50%";
    dialog.style.top = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.setProperty("--effect-hue", getMixerEffectHue(effectId));
    $("#mixer-effect-track-name").textContent = track.name;
    const title = effectId === "eq" ? "EQ" : EFFECT_NAMES.find(([id]) => id === effectId)?.[1] || effectId;
    $("#mixer-effect-title").textContent = title;
    const content = $("#mixer-effect-dialog-content");
    content.className = `mixer-effect-dialog-content mixer-layout-${effectId}`;
    content.replaceChildren();
    let eqCanvas = null;
    let eqBands = [];
    let midSideCanvas = null;
    let effectCanvas = null;
    let eqBus = "mid";

    if (effectId === "midSideMonitor") {
      const { screen, canvas } = makeMixerEffectScreen(track, effectId, "is-mid-side");
      midSideCanvas = canvas;
      content.append(screen);
      const note = document.createElement("p");
      note.className = "mixer-effect-help";
      note.textContent = "Analysis only: this monitor does not alter the signal.";
      content.append(note);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "quiet-button mixer-remove-effect";
      remove.textContent = "Remove effect";
      remove.addEventListener("click", () => removeMixerEffect(track, effectId));
      content.append(remove);
    } else if (effectId === "eq") {
      const screen = makeMixerEffectScreen(track, effectId, "is-equalizer");
      eqCanvas = screen.canvas;
      content.append(screen.screen);
      const graphHelp = document.createElement("p");
      graphHelp.className = "mixer-effect-help";
      graphHelp.textContent = "Drag a band node to shape the response; sliders stay synchronized.";
      content.append(graphHelp);
      eqBands = [
        ["eqSub", "SUB", 40],
        ["eqLow", "BASS", 160],
        ["eqMid", "MID", 1000],
        ["eqHigh", "PRES", 5000],
        ["eqAir", "AIR", 12000],
      ];
      const controls = document.createElement("div");
      controls.className = "mixer-effect-controls";
      eqBands.forEach(([id, label]) => {
        const labelText = `${label} · ${id === "eqSub" ? "20–60 Hz" : id === "eqLow" ? "60–250 Hz" : id === "eqMid" ? "250 Hz–2 kHz" : id === "eqHigh" ? "2–8 kHz" : "8–20 kHz"}`;
        controls.append(makeMixerSettingRange(labelText, track.effects[id], -12, 12, 1, " dB", (value) => {
          track.effects[id] = value;
          refreshMixerEffectTrack(track);
        }, id));
      });
      content.append(controls);
      content.append(makeMixerEffectResetButton(track, effectId));
    } else if (effectId === "time12") {
      content.className = "mixer-effect-dialog-content mixer-layout-time12 time12-layout";
      const settings = track.effectSettings.time12;
      if (!Array.isArray(settings.patterns)) settings.patterns = [{ x: 0, y: 0.5 }];
      if (!Array.isArray(settings.pattern)) settings.pattern = [{ x: 0, y: 0.5 }];
      const shell = document.createElement("div");
      shell.className = "time12-shell";

      const top = document.createElement("div");
      top.className = "time12-top";
      const brand = document.createElement("strong");
      brand.className = "time12-brand";
      brand.textContent = "TIME-12";
      top.append(brand);

      const syncSelect = document.createElement("select");
      syncSelect.className = "time12-select time12-sync";
      ["1 Bar", "1/2", "1/4", "1/8", "1/16", "Rate Hz"].forEach((label) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = label;
        syncSelect.append(option);
      });
      syncSelect.value = settings.sync;
      syncSelect.addEventListener("change", () => {
        settings.sync = syncSelect.value;
        refreshMixerEffectTrack(track);
      });
      top.append(syncSelect);

      const triggerLabel = document.createElement("span");
      triggerLabel.className = "time12-trigger";
      triggerLabel.textContent = "Trigger";
      top.append(triggerLabel);

      const triggerSelect = document.createElement("select");
      triggerSelect.className = "time12-select";
      ["Sync", "MIDI", "Audio"].forEach((label) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = label;
        triggerSelect.append(option);
      });
      triggerSelect.value = settings.trigger;
      triggerSelect.addEventListener("change", () => {
        settings.trigger = triggerSelect.value;
        refreshMixerEffectTrack(track);
      });
      top.append(triggerSelect);

      const mix = document.createElement("span");
      mix.className = "time12-mix";
      mix.textContent = `Mix ${track.effects.time12}%`;
      top.append(mix);
      shell.append(top);

      const patternRow = document.createElement("div");
      patternRow.className = "time12-pattern-row";
      const patterns = document.createElement("div");
      patterns.className = "time12-patterns";
      settings.patternIndex = Math.max(0, Math.min(11, settings.patternIndex || 0));
      for (let index = 0; index < 12; index += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(index + 1);
        button.setAttribute("aria-pressed", String(index === settings.patternIndex));
        button.addEventListener("click", () => {
          settings.patterns[settings.patternIndex] = settings.pattern.map((point) => ({ ...point }));
          settings.patternIndex = index;
          settings.pattern = (settings.patterns[index]?.length
            ? settings.patterns[index]
            : [{ x: 0, y: 0.5 }]).map((point) => ({ ...point }));
          patterns.querySelectorAll("button").forEach((item, itemIndex) =>
            item.setAttribute("aria-pressed", String(itemIndex === index)));
          refreshMixerEffectTrack(track);
        });
        patterns.append(button);
      }
      patternRow.append(patterns);
      const patSync = document.createElement("label");
      patSync.className = "time12-pat-sync";
      patSync.append(document.createTextNode("Pat. Sync"));
      const patSyncSelect = document.createElement("select");
      patSyncSelect.className = "time12-select";
      ["Off", "1/4 Beat", "1/2 Beat", "1 Beat", "2 Beats", "4 Beats"].forEach((label) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = label;
        patSyncSelect.append(option);
      });
      patSyncSelect.value = settings.patSync;
      patSyncSelect.addEventListener("change", () => {
        settings.patSync = patSyncSelect.value;
        refreshMixerEffectTrack(track);
      });
      patSync.append(patSyncSelect);
      patternRow.append(patSync);
      shell.append(patternRow);

      const toolbar = document.createElement("div");
      toolbar.className = "time12-toolbar";
      const paint = document.createElement("button");
      paint.type = "button";
      paint.className = "time12-tool";
      paint.textContent = "Paint";
      paint.setAttribute("aria-pressed", "false");
      const seq = document.createElement("button");
      seq.type = "button";
      seq.className = "time12-tool";
      seq.textContent = "Seq";
      seq.setAttribute("aria-pressed", "false");
      [paint, seq].forEach((button) => button.addEventListener("click", () => {
        if (button.getAttribute("aria-pressed") === "true") {
          [paint, seq].forEach((item) => item.setAttribute("aria-pressed", "false"));
          settings.mode = "Normal";
          refreshMixerEffectTrack(track);
          return;
        }
        [paint, seq].forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        settings.mode = button === paint ? "Paint" : "Seq";
        if (paint.getAttribute("aria-pressed") === "false" &&
            seq.getAttribute("aria-pressed") === "false") settings.mode = "Normal";
        refreshMixerEffectTrack(track);
      }));
      toolbar.append(paint, seq);
      const pointSelect = document.createElement("select");
      pointSelect.className = "time12-select time12-point";
      ["Hold", "Curve", "S-Curve", "Pulse", "Wave", "Triangle", "Stairs", "Smooth St", "Half Sine"].forEach((label) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = label;
        pointSelect.append(option);
      });
      pointSelect.value = settings.pointMode;
      pointSelect.addEventListener("change", () => {
        settings.pointMode = pointSelect.value;
        settings.pattern.forEach((point) => {
          point.type = pointSelect.selectedIndex;
        });
        refreshMixerEffectTrack(track);
      });
      toolbar.append(pointSelect);
      const gridLabel = document.createElement("button");
      gridLabel.type = "button";
      gridLabel.className = "time12-grid";
      gridLabel.textContent = `Grid ${settings.grid}`;
      gridLabel.addEventListener("click", () => {
        const grids = [4, 8, 16, 32];
        settings.grid = grids[(grids.indexOf(settings.grid) + 1) % grids.length];
        gridLabel.textContent = `Grid ${settings.grid}`;
        refreshMixerEffectTrack(track);
      });
      toolbar.append(gridLabel);
      const snap = document.createElement("button");
      snap.type = "button";
      snap.className = "time12-tool time12-snap";
      snap.textContent = "Snap";
      snap.setAttribute("aria-pressed", "false");
      snap.setAttribute("aria-pressed", String(settings.snap));
      snap.addEventListener("click", () => {
        settings.snap = snap.getAttribute("aria-pressed") !== "true";
        snap.setAttribute("aria-pressed", String(settings.snap));
        refreshMixerEffectTrack(track);
      });
      toolbar.append(snap);
      shell.append(toolbar);

      const screen = makeMixerEffectScreen(track, effectId, "is-time12");
      effectCanvas = screen.canvas;
      screen.screen.querySelector(".mixer-effect-screen-heading")?.remove();
      screen.screen.querySelector(".mixer-effect-screen-footer")?.remove();
      shell.append(screen.screen);

      const controls = document.createElement("div");
      controls.className = "time12-controls";
      controls.append(makeMixerSettingKnob("Mix", track.effects.time12, 0, 100, 1, "%", (value) => {
        track.effects.time12 = value;
        mix.textContent = `Mix ${value}%`;
        refreshMixerEffectTrack(track);
      }));
      ["rate", "depth", "smooth"].forEach((parameterId) => {
        const definition = EFFECT_PARAMETERS.time12.find(([id]) => id === parameterId);
        if (!definition) return;
        const [, label, min, max, step, unit] = definition;
        controls.append(makeMixerSettingKnob(label, settings[parameterId], min, max, step, unit, (value) => {
          settings[parameterId] = value;
          refreshMixerEffectTrack(track);
        }));
      });
      shell.append(controls);
      content.append(shell);

      const updatePatternPoint = (event, insertPoint = false) => {
        const bounds = effectCanvas.getBoundingClientRect();
        let x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
        let y = Math.max(0, Math.min(1, 1 - (event.clientY - bounds.top) / Math.max(1, bounds.height)));
        if (settings.snap) {
          x = Math.round(x * settings.grid) / settings.grid;
          y = Math.round(y * settings.grid) / settings.grid;
        }
        let nearest = 0;
        let nearestDistance = Infinity;
        settings.pattern.forEach((point, index) => {
          const distance = Math.hypot(point.x - x, point.y - y);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }
        });
        if (insertPoint) {
          settings.pattern.push({ x, y });
        } else if (nearestDistance < 0.12 || settings.pattern.length === 0) {
          if (settings.pattern.length === 0) settings.pattern.push({ x, y });
          else settings.pattern[nearest] = { x, y };
        }
        settings.pattern = settings.pattern.slice(0, 12).sort((a, b) => a.x - b.x);
        settings.patterns[settings.patternIndex] = settings.pattern.map((point) => ({ ...point }));
        refreshMixerEffectTrack(track);
      };
      effectCanvas.addEventListener("pointerdown", (event) => {
        effectCanvas.setPointerCapture(event.pointerId);
        updatePatternPoint(event, event.altKey);
      });
      effectCanvas.addEventListener("pointermove", (event) => {
        if (effectCanvas.hasPointerCapture(event.pointerId)) updatePatternPoint(event);
      });
      effectCanvas.addEventListener("pointerup", (event) => {
        if (effectCanvas.hasPointerCapture(event.pointerId)) effectCanvas.releasePointerCapture(event.pointerId);
      });
      effectCanvas.title = "Alt+drag inserts a point.";
    } else {
      const controls = document.createElement("div");
      controls.className = "mixer-effect-controls";
      if (effectId === "midSideEq" || effectId === "steepEq") {
        const screen = makeMixerEffectScreen(track, effectId, "is-equalizer");
        eqCanvas = screen.canvas;
        content.append(screen.screen);
        eqBands = effectId === "midSideEq"
          ? [["sub", "SUB", 40], ["low", "LOW", 160], ["mid", "MID", 1000], ["high", "HIGH", 5000], ["air", "AIR", 12000]]
          : [["gain", "PEAK", track.effectSettings.steepEq.frequency]];
        if (effectId === "midSideEq") {
          const busSwitch = document.createElement("div");
          busSwitch.className = "mixer-eq-bus-switch";
          ["mid", "side"].forEach((bus) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = bus.toUpperCase();
            button.setAttribute("aria-pressed", String(eqBus === bus));
            button.addEventListener("click", () => {
              eqBus = bus;
              busSwitch.querySelectorAll("button").forEach((item) => {
                item.setAttribute("aria-pressed", String(item === button));
              });
            });
            busSwitch.append(button);
          });
          content.append(busSwitch);
        }
        const graphHelp = document.createElement("p");
        graphHelp.className = "mixer-effect-help";
        graphHelp.textContent = effectId === "midSideEq"
          ? "Choose MID or SIDE, then drag a band node; its slider follows."
          : "Drag the peak node to set frequency and gain; use sliders for width and order.";
        content.append(graphHelp);
      } else {
        const screenVariants = {
          bloodOverdrive: "is-blood-overdrive",
          chorus: "is-chorus",
          delayBank: "is-delay-bank",
          guitarDistortion: "is-guitar-distortion",
          grossBeat: "is-gross-beat",
          time12: "is-time12",
          panOMatic: "is-pan-o-matic",
          stereoEnhancer: "is-stereo-enhancer",
        };
        const screen = makeMixerEffectScreen(track, effectId, screenVariants[effectId] || "");
        effectCanvas = screen.canvas;
        content.append(screen.screen);
        if (effectId === "time12") {
          const settings = track.effectSettings.time12;
          if (!Array.isArray(settings.pattern)) settings.pattern = [];
          const updatePatternPoint = (event, insertPoint = false) => {
            const bounds = effectCanvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (event.clientX - bounds.left - 12) / Math.max(1, bounds.width - 24)));
            const y = Math.max(0, Math.min(1, 1 - (event.clientY - bounds.top - 12) / Math.max(1, bounds.height - 24)));
            let nearest = 0;
            let nearestDistance = Infinity;
            settings.pattern.forEach((point, index) => {
              const distance = Math.hypot(point.x - x, point.y - y);
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = index;
              }
            });
            if (insertPoint) {
              settings.pattern.push({ x, y });
              settings.pattern.sort((a, b) => a.x - b.x);
            } else if (nearestDistance < 0.18 || settings.pattern.length === 0) {
              if (settings.pattern.length === 0) settings.pattern.push({ x, y });
              else settings.pattern[nearest] = { x, y };
            }
            settings.pattern = settings.pattern.slice(0, 12).sort((a, b) => a.x - b.x);
            refreshMixerEffectTrack(track);
          };
          effectCanvas.addEventListener("pointerdown", (event) => {
            effectCanvas.setPointerCapture(event.pointerId);
            updatePatternPoint(event, event.altKey);
          });
          effectCanvas.addEventListener("pointermove", (event) => {
            if (effectCanvas.hasPointerCapture(event.pointerId)) updatePatternPoint(event);
          });
          effectCanvas.addEventListener("pointerup", (event) => {
            if (effectCanvas.hasPointerCapture(event.pointerId)) effectCanvas.releasePointerCapture(event.pointerId);
          });
          effectCanvas.title = "TIME-12 pattern. Drag a point; Alt+drag inserts a point.";
        }
      }
      if (["sidechain", "crossfadeLimiter", "vocoder3Band"].includes(effectId)) {
        const sourceLabel = document.createElement("label");
        sourceLabel.className = "mixer-effect-control mixer-sidechain-source";
        const sourceCaption = document.createElement("span");
        sourceCaption.className = "mixer-control-caption";
        const sourceKey = effectId === "vocoder3Band" ? "modulatorTrackId" : "sourceTrackId";
        sourceCaption.textContent = effectId === "vocoder3Band" ? "Modulator track" : "Source track";
        const sourceSelect = document.createElement("select");
        sourceSelect.setAttribute("aria-label",
          `${effectId === "vocoder3Band" ? "Modulator" : "Sidechain source"} for ${track.name}`);
        const noSource = document.createElement("option");
        noSource.value = "";
        noSource.textContent = effectId === "vocoder3Band" ? "Choose a modulator track" : "Choose a source track";
        sourceSelect.append(noSource);
        getMixerTracks()
          .filter(({ track: sourceTrack }) => sourceTrack.id !== track.id && sourceTrack.kind !== "mixer-master")
          .forEach(({ track: sourceTrack, type }) => {
            const option = document.createElement("option");
            option.value = sourceTrack.id;
            option.textContent = `${sourceTrack.name} · ${type}`;
            sourceSelect.append(option);
          });
        sourceSelect.value = track.effectSettings[effectId][sourceKey] || "";
        sourceSelect.addEventListener("change", () => {
          track.effectSettings[effectId][sourceKey] = sourceSelect.value;
          refreshMixerEffectTrack(track);
        });
        sourceLabel.append(sourceCaption, sourceSelect);
        controls.append(sourceLabel);
      }
      controls.classList.add(`mixer-effect-controls-${effectId}`);
      controls.append(makeMixerSettingKnob(effectId === "sidechain" ? "Depth" : "Mix", track.effects[effectId], 0, 100, 1, "%", (value) => {
        track.effects[effectId] = value;
        refreshMixerEffectTrack(track);
      }));
      const knobEffects = new Set([
        "bloodOverdrive", "chorus", "delayBank", "grossBeat", "time12", "guitarDistortion", "panOMatic", "stereoEnhancer",
      ]);
      (EFFECT_PARAMETERS[effectId] || []).forEach(([id, label, min, max, step, unit]) => {
        const onInput = (value) => {
          track.effectSettings[effectId][id] = value;
          refreshMixerEffectTrack(track);
        };
        controls.append(knobEffects.has(effectId)
          ? makeMixerSettingKnob(label, track.effectSettings[effectId][id], min, max, step, unit, onInput)
          : makeMixerSettingRange(label, track.effectSettings[effectId][id], min, max, step, unit, onInput, id));
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
    makeMixerEffectDialogDraggable(dialog);
    dialog.show();
    if (eqCanvas) drawMixerEq(track, eqCanvas, effectId, eqBands, () => eqBus);
    if (midSideCanvas) drawMixerMidSide(track, midSideCanvas);
    if (effectCanvas) drawMixerEffectVisualizer(track, effectId, effectCanvas);
  }

  function drawMixerMidSide(track, canvas) {
    const context = canvas.getContext("2d");
    if (!context) return;
    let activeModule = null;
    let midSamples = new Float32Array(0);
    let sideSamples = new Float32Array(0);
    const draw = () => {
      if (!canvas.isConnected || !$("#mixer-effect-dialog").open || state.mixerEffectDialogTrackId !== track.id) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        state.mixerEffectAnimation = requestAnimationFrame(draw);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(bounds.width * ratio);
      const height = Math.round(bounds.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = "#141518";
      context.fillRect(0, 0, bounds.width, bounds.height);
      const module = track.fxRuntime?.find((effect) => effect.effectId === "midSideMonitor");
      if (module !== activeModule) {
        activeModule = module || null;
        midSamples = new Float32Array(activeModule?.midSideAnalyser?.fftSize || 0);
        sideSamples = new Float32Array(activeModule?.sideAnalyser?.fftSize || 0);
      }
      if (!activeModule?.midSideAnalyser || !activeModule.sideAnalyser) {
        context.fillStyle = "#85868c";
        context.font = "10px monospace";
        context.fillText("Start playback to view live levels", 14, bounds.height / 2);
        state.mixerEffectAnimation = requestAnimationFrame(draw);
        return;
      }
      const level = (analyser, samples) => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
        return Math.min(1, rms * 3);
      };
      [["MID", level(activeModule.midSideAnalyser, midSamples)], ["SIDE", level(activeModule.sideAnalyser, sideSamples)]]
        .forEach(([label, value], index) => {
          const top = 36 + index * 64;
          context.fillStyle = "#a7a9a2";
          context.font = "10px monospace";
          context.fillText(label, 14, top);
          context.fillStyle = "#282a2d";
          context.fillRect(14, top + 12, Math.max(0, bounds.width - 28), 16);
          context.fillStyle = "#d3f36b";
          context.fillRect(14, top + 12, Math.max(0, bounds.width - 28) * value, 16);
          context.fillStyle = "#c9cac6";
          context.fillText(`${Math.round(value * 100)}%`, 14, top + 45);
        });
      state.mixerEffectAnimation = requestAnimationFrame(draw);
    };
    state.mixerEffectAnimation = requestAnimationFrame(draw);
  }

  function drawMixerEq(track, canvas, effectId, bandDefinitions, getBus) {
    const context = canvas.getContext("2d");
    if (!context) return;
    let activeBand = -1;
    let spectrum = new Uint8Array(0);
    const getBands = () => bandDefinitions.map(([key, label, frequency]) => {
      const parameterId = effectId === "midSideEq"
        ? `${getBus()}${key[0].toUpperCase()}${key.slice(1)}`
        : key;
      return {
        key,
        label,
        parameterId,
        frequency: effectId === "steepEq" ? track.effectSettings.steepEq.frequency : frequency,
      };
    });
    const getGain = (band) => effectId === "steepEq"
      ? track.effectSettings.steepEq.gain
      : effectId === "midSideEq"
        ? track.effectSettings.midSideEq[band.parameterId]
        : track.effects[band.parameterId];
    const syncRange = (parameterId, value) => {
      const control = [...$("#mixer-effect-dialog-content").querySelectorAll("[data-effect-parameter]")]
        .find((item) => item.dataset.effectParameter === parameterId);
      if (!control) return;
      const input = control.querySelector("input");
      const output = control.querySelector("output");
      if (input) input.value = String(value);
      if (output) output.textContent = `${value} dB`;
    };
    const draw = () => {
      if (!canvas.isConnected || !$("#mixer-effect-dialog").open ||
          state.mixerEffectDialogTrackId !== track.id) return;
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
      const left = 32;
      const right = width - 12;
      const top = 14;
      const bottom = height - 26;
      const plotHeight = bottom - top;
      const xForFrequency = (frequency) => left + Math.log(frequency / 20) / Math.log(1000) * (right - left);
      const frequencyForX = (x) => 20 * Math.pow(1000, Math.max(0, Math.min(1, (x - left) / (right - left))));
      const yForGain = (gain) => top + (12 - gain) / 24 * plotHeight;
      const gainForY = (y) => Math.max(-12, Math.min(12, 12 - (y - top) / plotHeight * 24));
      const hue = getComputedStyle($("#mixer-effect-dialog")).getPropertyValue("--effect-hue").trim() || "120";
      const accent = `hsl(${hue} 85% 67%)`;
      const bands = getBands();
      const gradient = context.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, "#171a20");
      gradient.addColorStop(1, "#101216");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(184,198,214,.12)";
      context.lineWidth = 1;
      [-12, -6, 0, 6, 12].forEach((gain) => {
        const y = yForGain(gain);
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(right, y);
        context.stroke();
        context.fillStyle = "#858d9a";
        context.font = "8px monospace";
        context.fillText(`${gain > 0 ? "+" : ""}${gain}`, 3, y + 3);
      });
      [20, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000].forEach((frequency) => {
        const x = xForFrequency(frequency);
        context.beginPath();
        context.moveTo(x, top);
        context.lineTo(x, bottom);
        context.stroke();
        if ([20, 100, 1000, 10000, 20000].includes(frequency)) {
          context.fillStyle = "#858d9a";
          context.font = "8px monospace";
          context.fillText(frequency >= 1000 ? `${frequency / 1000}k` : String(frequency), x + 2, height - 8);
        }
      });
      const playing = state.isPlaying || Object.values(state.workspacePlayers).some(Boolean);
      if (track.analyser && playing) {
        if (spectrum.length !== track.analyser.frequencyBinCount) spectrum = new Uint8Array(track.analyser.frequencyBinCount);
        track.analyser.getByteFrequencyData(spectrum);
        context.fillStyle = "rgba(107,195,255,.16)";
        for (let index = 1; index < spectrum.length; index += 2) {
          const frequency = index * (state.audioContext?.sampleRate || 44100) / track.analyser.fftSize;
          if (frequency < 20 || frequency > 20000) continue;
          const x = xForFrequency(frequency);
          const barHeight = spectrum[index] / 255 * plotHeight * 0.8;
          context.fillRect(x, bottom - barHeight, Math.max(1, width / 220), barHeight);
        }
      }
      const response = (frequency) => {
        if (effectId === "steepEq") {
          const settings = track.effectSettings.steepEq;
          const octaves = Math.log2(frequency / settings.frequency);
          const spread = Math.max(0.2, 1.8 / settings.q);
          return settings.gain * Math.exp(-(octaves * octaves) / spread);
        }
        return bands.reduce((sum, band) => {
          const octaves = Math.log2(frequency / band.frequency);
          return sum + getGain(band) * Math.exp(-(octaves * octaves) / 1.8);
        }, 0);
      };
      context.beginPath();
      context.moveTo(left, bottom);
      for (let x = left; x <= right; x += 2) {
        const gain = Math.max(-12, Math.min(12, response(frequencyForX(x))));
        context.lineTo(x, yForGain(gain));
      }
      context.lineTo(right, bottom);
      context.closePath();
      context.fillStyle = `hsla(${hue},85%,67%,.12)`;
      context.fill();
      context.beginPath();
      for (let x = left; x <= right; x += 2) {
        const gain = Math.max(-12, Math.min(12, response(frequencyForX(x))));
        const y = yForGain(gain);
        if (x === left) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = accent;
      context.lineWidth = 2.5;
      context.shadowColor = accent;
      context.shadowBlur = 10;
      context.stroke();
      context.shadowBlur = 0;
      bands.forEach((band) => {
        const x = xForFrequency(band.frequency);
        const y = yForGain(getGain(band));
        context.beginPath();
        context.arc(x, y, activeBand === bands.indexOf(band) ? 7 : 5, 0, Math.PI * 2);
        context.fillStyle = accent;
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = "#f3f5f7";
        context.stroke();
      });
      state.mixerEffectAnimation = requestAnimationFrame(draw);
    };
    const updateFromPointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      const band = getBands()[activeBand];
      if (!band) return;
      const x = event.clientX - bounds.left;
      const gain = Math.round(gainForY(event.clientY - bounds.top) * 2) / 2;
      if (effectId === "steepEq") {
        track.effectSettings.steepEq.frequency = Math.round(frequencyForX(x) / 10) * 10;
        track.effectSettings.steepEq.gain = gain;
        const frequencyControl = [...$("#mixer-effect-dialog-content").querySelectorAll("[data-effect-parameter]")]
          .find((item) => item.dataset.effectParameter === "frequency");
        if (frequencyControl?.querySelector("input")) {
          frequencyControl.querySelector("input").value = String(track.effectSettings.steepEq.frequency);
          frequencyControl.querySelector("output").textContent = `${track.effectSettings.steepEq.frequency} Hz`;
        }
        syncRange("gain", gain);
      } else if (effectId === "midSideEq") {
        track.effectSettings.midSideEq[band.parameterId] = gain;
        syncRange(band.parameterId, gain);
      } else {
        track.effects[band.parameterId] = gain;
        syncRange(band.parameterId, gain);
      }
    };
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (event) => {
      const bounds = canvas.getBoundingClientRect();
      const bands = getBands();
      const x = event.clientX - bounds.left;
      const nearest = bands
        .map((band, index) => ({ index, distance: Math.abs(x - (32 + Math.log(band.frequency / 20) / Math.log(1000) * (bounds.width - 44))) }))
        .sort((leftBand, rightBand) => leftBand.distance - rightBand.distance)[0];
      if (!nearest || nearest.distance > 28) return;
      event.preventDefault();
      activeBand = nearest.index;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add("is-dragging");
      updateFromPointer(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (activeBand >= 0) updateFromPointer(event);
    });
    const finishDrag = () => {
      if (activeBand < 0) return;
      activeBand = -1;
      canvas.classList.remove("is-dragging");
      refreshMixerEffectTrack(track);
    };
    canvas.addEventListener("pointerup", finishDrag);
    canvas.addEventListener("pointercancel", finishDrag);
    draw();
  }

  function drawMixerEffectVisualizer(track, effectId, canvas) {
    const context = canvas.getContext("2d");
    if (!context) return;
    const modulationEffects = new Set(["autopan", "flanger", "phaser", "vibrato", "tremolo", "autoFilter", "lfoGain"]);
    const timeEffects = new Set(["delay", "pingPong", "slapback", "tapeDelay", "reverb", "room", "hall", "plate"]);
    const dynamicsEffects = new Set(["compressor", "multibandCompressor", "limiter", "noiseGate", "sidechain", "crossfadeLimiter", "transientShaper"]);
    const stereoEffects = new Set(["midSidePanner", "midSideFilter"]);
    const waveEffects = new Set(["distortion", "saturator", "softClipper", "bitcrusher", "gain"]);
    const visualKind = effectId === "guitarDistortion" ? "guitar-distortion"
      : effectId === "bloodOverdrive" ? "blood-overdrive"
        : effectId === "grossBeat" ? "gross-beat"
          : effectId === "time12" ? "time12"
            : effectId === "stereoEnhancer" ? "stereo-enhancer"
              : effectId === "delayBank" ? "delay-bank"
              : effectId === "panOMatic" ? "pan-o-matic"
                : effectId === "chorus" ? "chorus"
                  : modulationEffects.has(effectId) ? "modulation"
                    : timeEffects.has(effectId) ? "time"
                      : dynamicsEffects.has(effectId) ? "dynamics"
                        : stereoEffects.has(effectId) ? "stereo"
                          : waveEffects.has(effectId) ? "wave"
                            : ["vocoder", "vocoder3Band", "harmonizer", "pitchShifter"].includes(effectId) ? "spectrum" : "filter";
    let samples = new Uint8Array(0);
    const draw = (timestamp) => {
      if (!canvas.isConnected || !$("#mixer-effect-dialog").open ||
          state.mixerEffectDialogTrackId !== track.id) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        state.mixerEffectAnimation = requestAnimationFrame(draw);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const widthPx = Math.round(bounds.width * ratio);
      const heightPx = Math.round(bounds.height * ratio);
      if (canvas.width !== widthPx || canvas.height !== heightPx) {
        canvas.width = widthPx;
        canvas.height = heightPx;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = bounds.width;
      const height = bounds.height;
      const time = timestamp / 1000;
      const hue = getComputedStyle($("#mixer-effect-dialog")).getPropertyValue("--effect-hue").trim() || "120";
      const accent = `hsl(${hue} 85% 67%)`;
      const active = state.isPlaying || Object.values(state.workspacePlayers).some(Boolean);
      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#171a20");
      background.addColorStop(1, "#0e1116");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(180,195,212,.1)";
      context.lineWidth = 1;
      for (let x = 0; x <= width; x += 32) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += 24) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      if (track.analyser && active) {
        if (samples.length !== track.analyser.frequencyBinCount) samples = new Uint8Array(track.analyser.frequencyBinCount);
        track.analyser.getByteFrequencyData(samples);
      }
      const drawBars = (count = 40) => {
        const gap = 3;
        const barWidth = Math.max(2, (width - gap * (count - 1) - 24) / count);
        for (let index = 0; index < count; index += 1) {
          const sample = samples.length
            ? samples[Math.floor(index / count * samples.length)] / 255
            : 0.15 + Math.abs(Math.sin(index * 0.41 + time * 1.3)) * 0.25;
          const barHeight = Math.max(3, sample * (height - 36));
          const x = 12 + index * (barWidth + gap);
          context.fillStyle = `hsla(${hue},85%,67%,${0.25 + sample * 0.65})`;
          context.fillRect(x, height - 18 - barHeight, barWidth, barHeight);
        }
      };
      if (visualKind === "guitar-distortion" || visualKind === "blood-overdrive") {
        const drive = track.effectSettings[effectId]?.drive || 8;
        const bias = visualKind === "blood-overdrive" ? track.effectSettings[effectId]?.bias || 0 : 0;
        context.beginPath();
        context.moveTo(12, height / 2);
        context.lineTo(width - 12, height / 2);
        context.strokeStyle = "rgba(190,205,220,.2)";
        context.lineWidth = 1;
        context.stroke();
        context.beginPath();
        for (let index = 0; index <= 180; index += 1) {
          const input = index / 90 - 1;
          const normalized = Math.tanh((input + bias) * drive) / Math.tanh((1 + Math.abs(bias)) * drive);
          const x = 12 + index / 180 * (width - 24);
          const y = height / 2 - normalized * (height * 0.39);
          if (!index) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = accent;
        context.lineWidth = 2.5;
        context.shadowColor = accent;
        context.shadowBlur = visualKind === "blood-overdrive" ? 11 : 6;
        context.stroke();
        context.shadowBlur = 0;
        if (visualKind === "blood-overdrive") {
          context.fillStyle = `hsla(${hue},85%,67%,.12)`;
          context.fillRect(12, height / 2, width - 24, height * 0.34);
        }
      } else if (visualKind === "gross-beat") {
        const gate = (track.effectSettings.grossBeat?.gate || 0) / 100;
        const rate = track.effectSettings.grossBeat?.rate || 1;
        const currentStep = Math.floor(time * state.bpm / 60 * rate * 4) % 16;
        const stepWidth = (width - 24) / 16;
        for (let index = 0; index < 16; index += 1) {
          const open = ((index * 7 + 3) % 16) / 16 > gate;
          const x = 12 + index * stepWidth;
          const barHeight = open ? height * (0.25 + ((index * 5) % 7) / 14) : height * 0.08;
          context.fillStyle = index === currentStep ? "#f5f4e8"
            : open ? `hsla(${hue},85%,67%,.78)` : "rgba(180,195,212,.18)";
          context.fillRect(x + 2, height - 8 - barHeight, Math.max(2, stepWidth - 4), barHeight);
        }
        context.strokeStyle = `hsla(${hue},85%,67%,.28)`;
        context.beginPath();
        context.moveTo(12, height - 7);
        context.lineTo(width - 12, height - 7);
        context.stroke();
      } else if (visualKind === "time12") {
        const settings = track.effectSettings.time12;
        const pattern = Array.isArray(settings.pattern) ? [...settings.pattern].sort((a, b) => a.x - b.x) : [];
        const smooth = (settings.smooth ?? 35) / 100;
        const patternAt = (x) => {
          if (!pattern.length) return 0.5;
          if (x <= pattern[0].x) return pattern[0].y;
          if (x >= pattern.at(-1).x) return pattern.at(-1).y;
          for (let index = 0; index < pattern.length - 1; index += 1) {
            const left = pattern[index];
            const right = pattern[index + 1];
            if (x >= left.x && x <= right.x) {
              const span = Math.max(0.0001, right.x - left.x);
              const raw = (x - left.x) / span;
              const eased = raw * raw * (3 - 2 * raw) * smooth + raw * (1 - smooth);
              return left.y + (right.y - left.y) * eased;
            }
          }
          return 0.5;
        };
        context.strokeStyle = "rgba(190,205,220,.13)";
        context.lineWidth = 1;
        for (let column = 0; column <= 12; column += 1) {
          const x = 12 + column / 12 * (width - 24);
          context.beginPath();
          context.moveTo(x, 12);
          context.lineTo(x, height - 12);
          context.stroke();
        }
        context.beginPath();
        for (let index = 0; index <= 180; index += 1) {
          const xRatio = index / 180;
          const y = 12 + (1 - patternAt(xRatio)) * (height - 24);
          const x = 12 + xRatio * (width - 24);
          if (!index) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = accent;
        context.lineWidth = 2.5;
        context.shadowColor = accent;
        context.shadowBlur = 8;
        context.stroke();
        context.shadowBlur = 0;
        pattern.forEach((point) => {
          const x = 12 + point.x * (width - 24);
          const y = 12 + (1 - point.y) * (height - 24);
          context.fillStyle = "#171a20";
          context.strokeStyle = accent;
          context.lineWidth = 2;
          context.beginPath();
          context.arc(x, y, 4.5, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        });
        const rate = settings.rate ?? 1;
        const playhead = ((time * state.bpm / 60 * rate) % 1);
        const playheadX = 12 + playhead * (width - 24);
        context.fillStyle = "#f5f4e8";
        context.fillRect(playheadX - 1, 8, 2, height - 16);
      } else if (visualKind === "stereo-enhancer") {
        const widthFactor = (track.effectSettings.stereoEnhancer?.width || 125) / 100;
        context.beginPath();
        for (let index = 0; index <= 240; index += 1) {
          const phase = index / 240 * Math.PI * 2;
          const x = width / 2 + Math.sin(phase + time * 0.55) * Math.min(0.46, 0.28 * widthFactor) * width;
          const y = height / 2 + Math.sin(phase * 2 + time * 0.7) * height * 0.32;
          if (!index) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        context.strokeStyle = accent;
        context.lineWidth = 2;
        context.shadowColor = accent;
        context.shadowBlur = 9;
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = `hsla(${hue},85%,67%,.08)`;
        context.fill();
      } else if (visualKind === "delay-bank") {
        const tapTime = track.effectSettings.delayBank?.time || 0.24;
        const feedback = track.effectSettings.delayBank?.feedback || 0;
        for (let tap = 0; tap < 4; tap += 1) {
          const y = 16 + tap * ((height - 30) / 4);
          const phase = (time / Math.max(0.12, tapTime * (tap + 1)) + 1) % 1;
          const x = 12 + phase * (width - 24);
          const opacity = 0.3 + Math.max(0, 0.7 - tap * 0.13) * (1 - feedback / 160);
          context.strokeStyle = `hsla(${(Number(hue) + tap * 18) % 360},85%,67%,${opacity})`;
          context.lineWidth = 2 + (3 - tap) * 0.35;
          context.beginPath();
          context.moveTo(12, y);
          context.lineTo(width - 12, y);
          context.stroke();
          context.fillStyle = accent;
          context.beginPath();
          context.arc(x, y, 3 + (3 - tap) * 0.55, 0, Math.PI * 2);
          context.fill();
        }
      } else if (visualKind === "pan-o-matic") {
        const rate = track.effectSettings.panOMatic?.rate || 0.35;
        const phaseOffset = (track.effectSettings.panOMatic?.phase || 0) * Math.PI / 180;
        [0, 1].forEach((channel) => {
          context.beginPath();
          for (let x = 12; x < width - 12; x += 2) {
            const phase = x / width * Math.PI * 4 + time * rate * 1.4 + phaseOffset + channel * Math.PI;
            const y = height / 2 + Math.sin(phase) * height * (channel ? 0.33 : 0.23);
            if (x === 12) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = `hsla(${(Number(hue) + channel * 34) % 360},85%,67%,${channel ? 0.55 : 0.95})`;
          context.lineWidth = channel ? 1.5 : 2.5;
          context.stroke();
        });
        context.fillStyle = "#dff9bd";
        const panX = width / 2 + Math.sin(time * rate * Math.PI * 2 + phaseOffset) * width * 0.34;
        context.beginPath();
        context.arc(panX, height - 11, 3, 0, Math.PI * 2);
        context.fill();
      } else if (visualKind === "chorus") {
        const rate = track.effectSettings.chorus?.rate || 0.28;
        [0, 1, 2, 3].forEach((layer) => {
          context.beginPath();
          for (let x = 12; x < width - 12; x += 2) {
            const phase = x / width * Math.PI * 4 + time * rate * (layer + 1) + layer * 0.7;
            const y = height / 2 + Math.sin(phase) * height * (0.16 + layer * 0.055);
            if (x === 12) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = `hsla(${(Number(hue) + layer * 16) % 360},85%,67%,${0.9 - layer * 0.16})`;
          context.lineWidth = layer === 0 ? 2 : 1;
          context.stroke();
        });
      } else if (visualKind === "modulation") {
        const rate = track.effectSettings[effectId]?.rate || 0.5;
        [0, 1, 2].forEach((layer) => {
          context.beginPath();
          for (let x = 12; x < width - 12; x += 2) {
            const phase = x / width * Math.PI * 2 * (1 + layer * 0.25) + time * rate * (layer + 1);
            const y = height / 2 + Math.sin(phase) * (height * (0.18 + layer * 0.08));
            if (x === 12) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = `hsla(${hue},85%,67%,${0.85 - layer * 0.2})`;
          context.lineWidth = layer === 0 ? 2 : 1;
          context.stroke();
        });
      } else if (visualKind === "time") {
        const delay = effectId.includes("Delay") || effectId.includes("delay") || effectId === "pingPong";
        const pulseCount = delay ? 7 : 12;
        for (let index = 0; index < pulseCount; index += 1) {
          const phase = (time * (delay ? 0.7 : 0.35) + index / pulseCount) % 1;
          const x = 12 + phase * (width - 24);
          const envelope = Math.exp(-phase * (delay ? 3.2 : 5));
          context.beginPath();
          context.moveTo(x, height - 20);
          context.lineTo(x, height - 20 - envelope * (height - 42));
          context.strokeStyle = `hsla(${hue},85%,67%,${0.2 + envelope * 0.7})`;
          context.lineWidth = delay ? 3 : 2;
          context.stroke();
          context.beginPath();
          context.arc(x, height - 20 - envelope * (height - 42), 3 + envelope * 3, 0, Math.PI * 2);
          context.fillStyle = accent;
          context.fill();
        }
      } else if (visualKind === "dynamics") {
        const threshold = track.effectSettings[effectId]?.threshold ?? -18;
        const knee = Math.max(0.1, (threshold + 60) / 60);
        context.beginPath();
        for (let x = 12; x <= width - 12; x += 2) {
          const input = (x - 12) / (width - 24);
          const output = input < knee ? input : knee + (input - knee) * 0.38;
          const y = height - 18 - output * (height - 36);
          if (x === 12) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = accent;
        context.lineWidth = 2.5;
        context.shadowColor = accent;
        context.shadowBlur = 8;
        context.stroke();
        context.shadowBlur = 0;
        const meter = 0.28 + Math.abs(Math.sin(time * 1.8)) * (active ? 0.68 : 0.3);
        context.fillStyle = `hsla(${hue},85%,67%,.2)`;
        context.fillRect(12, height - 14, (width - 24) * meter, 5);
      } else if (visualKind === "stereo") {
        context.beginPath();
        for (let index = 0; index <= 180; index += 1) {
          const phase = index / 180 * Math.PI * 2;
          const x = width / 2 + Math.sin(phase + time) * (width * 0.36);
          const y = height / 2 + Math.sin(phase * (effectId === "midSidePanner" ? 1.08 : 1.6)) * (height * 0.34);
          if (!index) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = accent;
        context.lineWidth = 2;
        context.shadowColor = accent;
        context.shadowBlur = 10;
        context.stroke();
        context.shadowBlur = 0;
        drawBars(18);
      } else if (visualKind === "wave") {
        const drive = track.effectSettings[effectId]?.drive || 4;
        context.beginPath();
        for (let index = 0; index <= 180; index += 1) {
          const input = index / 90 - 1;
          const output = effectId === "gain" ? input : Math.tanh(input * drive) / Math.tanh(drive);
          const x = 12 + index / 180 * (width - 24);
          const y = height / 2 - output * (height * 0.38);
          if (!index) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = accent;
        context.lineWidth = 2.5;
        context.shadowColor = accent;
        context.shadowBlur = 8;
        context.stroke();
        context.shadowBlur = 0;
      } else {
        drawBars(effectId === "vocoder3Band" ? 3 : 44);
        if (visualKind === "spectrum") {
          context.beginPath();
          for (let x = 12; x < width - 12; x += 2) {
            const y = height * 0.6 - Math.sin(x * 0.07 + time * 2) * (height * 0.17);
            if (x === 12) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = accent;
          context.lineWidth = 1.5;
          context.stroke();
        }
      }
      state.mixerEffectAnimation = requestAnimationFrame(draw);
    };
    state.mixerEffectAnimation = requestAnimationFrame(draw);
  }

