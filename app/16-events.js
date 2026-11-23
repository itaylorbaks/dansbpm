  let scaleSaveTimer = null;
  let pendingProjectTempoChange = null;
  let bottomMixerResizePointerId = null;

  function scheduleScaleSave() {
    if (scaleSaveTimer !== null) window.clearTimeout(scaleSaveTimer);
    scaleSaveTimer = window.setTimeout(() => {
      scaleSaveTimer = null;
      saveState();
    }, 250);
  }

  function updateTransportModeIndicator() {
    const indicator = $("#play-mode-indicator");
    const patternMode = state.transportMode === "sequencer";
    indicator.textContent = patternMode ? "PAT" : "TRACK";
    indicator.setAttribute("aria-label", `Playback mode: ${patternMode ? "Pattern" : "Track"}. Click to switch.`);
    indicator.setAttribute("aria-pressed", String(patternMode));
  }

  function setTransportMode(mode) {
    if (mode !== "arrangement" && mode !== "sequencer") return;
    if (state.isStartingPlayback || state.isPlaying) stopPlayback(false, true);
    state.transportMode = mode;
    updateTransportModeIndicator();
    saveState();
    showToast(mode === "sequencer" ? "Pattern playback selected" : "Track playback selected");
  }

  function applyBottomMixerPanelSize() {
    const panel = $("#bottom-mixer-panel");
    const arrangement = $("#arrangement-view");
    const main = panel.parentElement;
    if (!document.body.classList.contains("is-bottom-mixer-open")) return;
    const availableHeight = main.getBoundingClientRect().bottom - arrangement.getBoundingClientRect().top;
    const height = Math.max(120, Math.round(availableHeight * state.bottomMixerRatio / 100));
    panel.style.flex = `0 0 ${height}px`;
    const resizer = $("#bottom-mixer-resizer");
    resizer.setAttribute("aria-valuenow", String(state.bottomMixerRatio));
  }

  function setBottomMixerRatio(ratio, persist = true) {
    state.bottomMixerRatio = Math.max(20, Math.min(80, Math.round(ratio)));
    applyBottomMixerPanelSize();
    if (persist) saveState();
  }

  function setTrackAssetLibraryWidth(width, persist = true) {
    const content = $("#track-view-content");
    const lane = $("#track-view-asset-lane");
    const resizer = $("#track-asset-resizer");
    const maxWidth = content.clientWidth
      ? Math.max(150, Math.min(600, content.clientWidth - 280))
      : 600;
    state.trackAssetLibraryWidth = Math.max(150, Math.min(maxWidth, Math.round(width)));
    lane.style.width = `${state.trackAssetLibraryWidth}px`;
    lane.style.flexBasis = `${state.trackAssetLibraryWidth}px`;
    resizer.setAttribute("aria-valuemax", String(maxWidth));
    resizer.setAttribute("aria-valuenow", String(state.trackAssetLibraryWidth));
    resizer.setAttribute("aria-valuetext", `${state.trackAssetLibraryWidth} pixels`);
    if (persist) saveState();
  }

  function routeSelectedRackRowsToMixer(separateBuses) {
    const pattern = getPattern();
    const trackIds = [...state.selectedRackRows].filter((id) =>
      pattern && getPatternTrackIds(pattern).includes(id));
    if (!trackIds.length) {
      showToast("Select one or more Rack rows before routing.");
      return;
    }
    if (separateBuses) {
      trackIds.forEach((trackId) => {
        state.effectTracks.forEach((bus) => {
          bus.routedTrackIds = bus.routedTrackIds.filter((id) => id !== trackId);
        });
        const trackName = state.tracks.find((track) => track.id === trackId)?.name || "Row";
        const bus = makeMixerBusTrack("mixer-effects", {
          id: makeId(),
          name: `Rack ${trackName}`,
          routedTrackIds: [trackId],
        });
        bus.routedTrackIds = [trackId];
        state.effectTracks.push(bus);
      });
    } else {
      let targetBus = state.effectTracks.find((bus) => bus.id === state.selectedMixerTrackId);
      if (!targetBus) {
        targetBus = state.effectTracks.find((bus) => !bus.routedTrackIds?.length);
        if (!targetBus) {
          let number = state.effectTracks.length + 1;
          while (state.effectTracks.some((bus) => bus.name === `Effects ${number}`)) number += 1;
          targetBus = makeMixerBusTrack("mixer-effects", {
            id: makeId(),
            name: `Effects ${number}`,
          });
          state.effectTracks.push(targetBus);
        }
        state.selectedMixerTrackId = targetBus.id;
      }
      state.effectTracks.forEach((bus) => {
        bus.routedTrackIds = bus.routedTrackIds.filter((id) => !trackIds.includes(id));
      });
      targetBus.routedTrackIds.push(...trackIds);
    }
    rebuildMixerAudioRouting();
    renderTracks();
    renderMixer();
    saveState();
    showToast(separateBuses
      ? `Routed ${trackIds.length} Rack row${trackIds.length === 1 ? "" : "s"} to separate Mixer tracks`
      : `Routed ${trackIds.length} Rack row${trackIds.length === 1 ? "" : "s"} to the selected Mixer track`);
  }

  function getProjectTempoChangeItems() {
    return [
      ...state.patternClips.map((clip) => ({
        key: `pattern:${clip.id}`,
        kind: "pattern",
        clip,
        label: `Pattern · ${getPattern(clip.patternId)?.name || "Pattern"} · bar ${Math.floor(clip.startBar) + 1}`,
      })),
      ...state.melTracks.flatMap((track) => track.clips.map((clip) => ({
        key: `mel:${clip.id}`,
        kind: "mel",
        clip,
        label: `Mel · ${getMel(clip.melId)?.name || "Mel"} · ${track.name} · bar ${Math.floor(clip.startBar) + 1}`,
      }))),
      ...state.arrangementTracks.flatMap((track) => track.clips.map((clip) => ({
        key: `audio:${clip.id}`,
        kind: "audio",
        clip,
        track,
        label: `Audio · ${clip.name} · ${track.name} · bar ${Math.floor(clip.startBar) + 1}`,
      }))),
    ];
  }

  function applyProjectTempoChange(bpm, items, followKeys) {
    const previousBpm = state.bpm;
    const resumeBar = state.arrangementCursor;
    stopAllWorkspacePlayers();
    if (state.isPlaying || state.isStartingPlayback) stopPlayback();

    const audioItemsToPersist = [];
    items.forEach((item) => {
      if (followKeys.has(item.key)) {
        delete item.clip.tempoLockBpm;
        if (item.kind === "audio") delete item.clip.tempoRatioOverride;
      } else {
        if (!Number.isFinite(item.clip.tempoLockBpm)) item.clip.tempoLockBpm = previousBpm;
        if (item.kind === "audio") {
          if (!Number.isFinite(item.clip.tempoRatioOverride)) {
            item.clip.tempoRatioOverride = getAudioClipTempoRatio(item.clip);
          }
        }
      }
      if (item.kind === "audio") audioItemsToPersist.push(item);
    });

    state.bpm = bpm;
    updateMixerTempoEffects();
    tempoValue.textContent = String(state.bpm);
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    if (resumeBar > 0) setArrangementCursor(resumeBar);
    saveState();
    audioItemsToPersist.forEach((item) => {
      persistClip(item.track, item.clip).catch((error) =>
        showToast(`Tempo changed, but ${item.clip.name} could not be saved: ${error.message || "browser storage is unavailable"}`));
    });
  }

  function openProjectTempoChangeDialog(bpm) {
    const items = getProjectTempoChangeItems();
    if (!items.length) {
      applyProjectTempoChange(bpm, items, new Set());
      return Promise.resolve(true);
    }

    const dialog = $("#project-tempo-change-dialog");
    const list = $("#tempo-change-items");
    $("#project-tempo-change-description").textContent =
      `Project: ${state.bpm} → ${bpm} BPM. Checked clips follow the new BPM; unchecked clips keep their current playback tempo.`;
    list.replaceChildren();
    items.forEach((item) => {
      const label = document.createElement("label");
      label.className = "tempo-change-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.dataset.tempoItemKey = item.key;
      const name = document.createElement("span");
      name.className = "tempo-change-item-name";
      name.textContent = item.label;
      label.append(checkbox, name);
      list.append(label);
    });
    return new Promise((resolve) => {
      pendingProjectTempoChange = { bpm, items, resolve };
      dialog.showModal();
    });
  }

  function resolveProjectTempoChange(apply) {
    const pending = pendingProjectTempoChange;
    if (!pending) return;
    pendingProjectTempoChange = null;
    if (apply) {
      const followKeys = new Set(Array.from(
        $("#tempo-change-items").querySelectorAll('input[type="checkbox"]:checked'),
        (checkbox) => checkbox.dataset.tempoItemKey,
      ));
      applyProjectTempoChange(pending.bpm, pending.items, followKeys);
    }
    $("#project-tempo-change-dialog").close();
    pending.resolve(apply);
  }

  function editProjectTempo() {
    const entry = window.prompt("Set tempo (60–180 BPM)", String(state.bpm));
    if (entry === null || !entry.trim()) return;
    const value = Number(entry);
    if (!Number.isFinite(value) || value < 60 || value > 180) {
      showToast("Tempo must be between 60 and 180 BPM.");
      return;
    }
    const bpm = roundBpm(value);
    if (bpm !== state.bpm) void openProjectTempoChangeDialog(bpm);
  }

  let rackTabDrag = null;
  let suppressRackTabClick = false;
  let rackAssetLibraryAutoFloated = false;
  let pianoRollTabDrag = null;
  let suppressPianoRollTabClick = false;

  function fitFloatingRackWindow() {
    if (!state.rackUndocked) return;
    const floating = $("#rack-floating-window");
    if (floating.hidden) return;
    floating.style.height = "auto";
    floating.style.height = `${Math.min(floating.scrollHeight, window.innerHeight - 16)}px`;
  }

  function floatRackWindow(clientX, clientY) {
    const floating = $("#rack-floating-window");
    const rack = $("#sequencer-view");
    if (!state.rackUndocked) {
      state.rackUndocked = true;
      $("#rack-floating-content").append(rack);
      rack.hidden = false;
      floating.hidden = false;
      if (state.view === "sequencer") setWorkspaceView("arrangement");
      else {
        renderTracks();
        renderPresets();
        renderPatternSelectors();
      }
    }
    floating.hidden = false;
    const width = Math.min(860, window.innerWidth - 24);
    floating.style.width = `${width}px`;
    floating.style.height = "auto";
    fitFloatingRackWindow();
    const height = floating.offsetHeight;
    floating.style.left = `${Math.max(8, Math.min(clientX - 100, window.innerWidth - width - 8))}px`;
    floating.style.top = `${Math.max(8, Math.min(clientY - 16, window.innerHeight - height - 8))}px`;
  }

  function dockRackWindow() {
    if (rackAssetLibraryAutoFloated && $("#source-browser-dialog").open) {
      rackAssetLibraryAutoFloated = false;
      $("#source-browser-dialog").close();
    }
    const rack = $("#sequencer-view");
    state.rackUndocked = false;
    $(".workspace-content").insertBefore(rack, $("#piano-roll-view"));
    $("#rack-floating-window").hidden = true;
    $("#rack-floating-window").style.removeProperty("min-width");
    $("#rack-floating-window").style.removeProperty("width");
    setWorkspaceView(state.view, true);
  }

  function openPatternInRackWindow(patternId) {
    if (!getPattern(patternId)) {
      showToast("That pattern is no longer available.");
      return;
    }
    if (state.view === "sequencer" && !state.workspaceHidden && !state.rackUndocked) {
      selectPattern(patternId);
      return;
    }
    selectPattern(patternId);
    if (state.rackUndocked) {
      $("#rack-floating-window").hidden = false;
      renderTracks();
      renderPresets();
      renderPatternSelectors();
    } else {
      floatRackWindow(window.innerWidth / 2, window.innerHeight / 3);
    }
  }

  function openRackAssetLibrary() {
    const gap = 8;
    const panelWidth = Math.min(320, Math.max(180, Math.floor(window.innerWidth * 0.32)));
    if (!state.rackUndocked) {
      rackAssetLibraryAutoFloated = true;
      floatRackWindow(panelWidth + 108, 80);
    }

    const rackWindow = $("#rack-floating-window");
    const rackWidth = Math.max(1, Math.min(860, window.innerWidth - panelWidth - gap * 3));
    rackWindow.style.minWidth = `${Math.min(360, rackWidth)}px`;
    rackWindow.style.width = `${rackWidth}px`;
    fitFloatingRackWindow();
    rackWindow.style.left = `${panelWidth + gap * 2}px`;
    rackWindow.style.top = `${Math.max(8, Math.min(
      rackWindow.offsetTop,
      window.innerHeight - rackWindow.offsetHeight - 8,
    ))}px`;

    openAssetLibrary();
    const assetLibrary = $("#source-browser-dialog");
    assetLibrary.style.left = `${gap}px`;
    assetLibrary.style.width = `${panelWidth}px`;
  }

  function moveRackTab(event) {
    if (!rackTabDrag || event.pointerId !== rackTabDrag.pointerId) return;
    if (event.clientY - rackTabDrag.y < 24) return;
    event.preventDefault();
    suppressRackTabClick = true;
    floatRackWindow(event.clientX, event.clientY);
    rackTabDrag = null;
    document.removeEventListener("pointermove", moveRackTab);
  }

  function endRackTabDrag() {
    rackTabDrag = null;
    document.removeEventListener("pointermove", moveRackTab);
  }

  function startFloatingRackMove(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    const floating = $("#rack-floating-window");
    const start = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: floating.offsetLeft,
      top: floating.offsetTop,
    };
    event.preventDefault();
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== start.pointerId) return;
      const maxLeft = Math.max(8, window.innerWidth - floating.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - floating.offsetHeight - 8);
      floating.style.left = `${Math.max(8, Math.min(maxLeft, start.left + moveEvent.clientX - start.x))}px`;
      floating.style.top = `${Math.max(8, Math.min(maxTop, start.top + moveEvent.clientY - start.y))}px`;
    };
    const finish = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function floatPianoRollWindow(clientX, clientY) {
    const floating = $("#piano-floating-window");
    const pianoRoll = $("#piano-roll-view");
    if (!state.pianoRollUndocked) {
      state.pianoRollUndocked = true;
      $("#piano-floating-content").append(pianoRoll);
      pianoRoll.hidden = false;
      floating.hidden = false;
      if (state.view === "piano-roll") setWorkspaceView("arrangement");
    }
    floating.hidden = false;
    const width = Math.min(960, window.innerWidth - 24);
    const height = Math.min(640, window.innerHeight - 24);
    floating.style.width = `${width}px`;
    floating.style.height = `${height}px`;
    floating.style.left = `${Math.max(8, Math.min(clientX - 100, window.innerWidth - width - 8))}px`;
    floating.style.top = `${Math.max(8, Math.min(clientY - 16, window.innerHeight - height - 8))}px`;
    renderPianoRoll();
  }

  function dockPianoRollWindow() {
    const pianoRoll = $("#piano-roll-view");
    state.pianoRollUndocked = false;
    $(".workspace-content").insertBefore(pianoRoll, $("#mixer-view"));
    $("#piano-floating-window").hidden = true;
    setWorkspaceView(state.view, true);
  }

  function openMelInPianoRollWindow(melId) {
    const mel = getMel(melId);
    if (!mel) {
      showToast("That Mel is no longer available.");
      return;
    }
    captureCurrentMel();
    loadMel(melId);
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
    if (state.view === "piano-roll" && !state.workspaceHidden && !state.pianoRollUndocked) return;
    if (state.pianoRollUndocked) {
      $("#piano-floating-window").hidden = false;
    } else {
      floatPianoRollWindow(window.innerWidth / 2, window.innerHeight / 3);
    }
  }

  function openAudioAssetInPianoRollWindow(type, assetId) {
    const asset = getArrangementAsset(type, assetId);
    if (asset && state.audioAssets.includes(asset)) {
      if (state.view === "piano-roll" && !state.workspaceHidden && !state.pianoRollUndocked) {
        void openAudioAssetInPianoRoll(asset);
      } else {
        if (state.pianoRollUndocked) $("#piano-floating-window").hidden = false;
        else floatPianoRollWindow(window.innerWidth / 2, window.innerHeight / 3);
        void openAudioAssetInPianoRoll(asset, true);
      }
      return;
    }
    const track = state.arrangementTracks.find((candidate) =>
      candidate.clips.some((clip) => clip.id === assetId));
    if (!track) {
      showToast("That audio asset is no longer available.");
      return;
    }
    if (state.view === "piano-roll" && !state.workspaceHidden && !state.pianoRollUndocked) {
      void openAudioClipInPianoRoll(track.id, assetId);
    } else {
      if (state.pianoRollUndocked) $("#piano-floating-window").hidden = false;
      else floatPianoRollWindow(window.innerWidth / 2, window.innerHeight / 3);
      void openAudioClipInPianoRoll(track.id, assetId, true);
    }
  }

  function movePianoRollTab(event) {
    if (!pianoRollTabDrag || event.pointerId !== pianoRollTabDrag.pointerId) return;
    if (event.clientY - pianoRollTabDrag.y < 24) return;
    event.preventDefault();
    suppressPianoRollTabClick = true;
    floatPianoRollWindow(event.clientX, event.clientY);
    pianoRollTabDrag = null;
    document.removeEventListener("pointermove", movePianoRollTab);
  }

  function endPianoRollTabDrag() {
    pianoRollTabDrag = null;
    document.removeEventListener("pointermove", movePianoRollTab);
  }

  function startFloatingPianoRollMove(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    const floating = $("#piano-floating-window");
    const start = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: floating.offsetLeft,
      top: floating.offsetTop,
    };
    event.preventDefault();
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== start.pointerId) return;
      const maxLeft = Math.max(8, window.innerWidth - floating.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - floating.offsetHeight - 8);
      floating.style.left = `${Math.max(8, Math.min(maxLeft, start.left + moveEvent.clientX - start.x))}px`;
      floating.style.top = `${Math.max(8, Math.min(maxTop, start.top + moveEvent.clientY - start.y))}px`;
    };
    const finish = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function bindEvents() {
    const workspaceArea = $("#workspace-area");
    const trackViewArea = $("#track-view-area");
    workspaceArea.addEventListener("pointerdown", () => {
      state.lastInteractedViewArea = "workspace";
    }, true);
    workspaceArea.addEventListener("focusin", () => {
      state.lastInteractedViewArea = "workspace";
    }, true);
    trackViewArea.addEventListener("pointerdown", () => {
      state.lastInteractedViewArea = "track-view";
    }, true);
    trackViewArea.addEventListener("focusin", () => {
      state.lastInteractedViewArea = "track-view";
    }, true);
    document.addEventListener("pointermove", paintStepAtPointer);
    document.addEventListener("pointermove", updateStepSelectionDrag);
    document.addEventListener("pointerup", finishStepPaint);
    document.addEventListener("pointerup", finishStepSelectionDrag);
    document.addEventListener("pointerup", () => { rackRowSelectionDragging = false; });
    document.addEventListener("pointercancel", finishStepPaint);
    document.addEventListener("pointercancel", finishStepSelectionDrag);
    updateTransportModeIndicator();
    playButton.addEventListener("click", () => {
      if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
      if (mixerEffectPreview) stopMixerEffectPreview();
      const mode = state.transportMode;
      if (state.isStartingPlayback || state.isPlaying && state.playbackMode === mode) stopPlayback(false, true);
      else {
        if (state.isPlaying) stopPlayback();
        startPlayback(mode);
      }
    });
    Object.entries(WORKSPACE_PLAY_BUTTONS).forEach(([workspace, buttonId]) => {
      $(`#${buttonId}`).addEventListener("click", () => toggleWorkspacePlayback(workspace));
    });
    $("#stop-button").addEventListener("click", () => {
      stopMixerEffectPreview();
      stopPlayback();
    });
    $("#arrangement-snap-button").addEventListener("click", () => {
      state.arrangementSnap = !state.arrangementSnap;
      if (state.arrangementSnap) setArrangementCursor(state.arrangementCursor);
      renderArrangement();
      saveState();
    });
    $("#arrangement-loop-button").addEventListener("click", () => {
      const resumePlayback = state.isPlaying && state.playbackMode === "arrangement";
      const cursor = state.arrangementCursor;
      if (resumePlayback) stopPlayback();
      state.arrangementLoopEnabled = !state.arrangementLoopEnabled;
      state.arrangementCursor = state.arrangementLoopEnabled
        ? getArrangementLoopRange().startBar
        : Math.min(cursor, state.arrangementBars - 1);
      updateArrangementCursorMarker();
      updateArrangementLoopUI();
      saveState();
      if (resumePlayback) void startPlayback("arrangement");
    });
    $("#tempo-control").addEventListener("click", editProjectTempo);
    document.querySelectorAll(".fullscreen-tempo-control").forEach((button) => {
      button.addEventListener("click", editProjectTempo);
    });
    $("#tempo-change-select-all").addEventListener("click", () => {
      $("#tempo-change-items").querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = true;
      });
    });
    $("#tempo-change-select-none").addEventListener("click", () => {
      $("#tempo-change-items").querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
      });
    });
    $("#tempo-change-cancel").addEventListener("click", () => {
      resolveProjectTempoChange(false);
    });
    $("#tempo-change-apply").addEventListener("click", () => {
      resolveProjectTempoChange(true);
    });
    $("#project-tempo-change-dialog").addEventListener("cancel", (event) => {
      event.preventDefault();
      resolveProjectTempoChange(false);
    });
    $("#master-pitch-control").addEventListener("input", (event) => {
      setMasterPitch(event.currentTarget.value);
    });
    swingSlider.addEventListener("input", () => {
      state.swing = Number(swingSlider.value);
      $("#swing-value").textContent = `${state.swing}%`;
      swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
      saveState();
    });
    $("#decrease-pattern-bars").addEventListener("click", () => setLength(state.steps - 16, "fixed"));
    $("#increase-pattern-bars").addEventListener("click", () => setLength(state.steps + 16, "fixed"));
    $("#clear-button").addEventListener("click", clearPattern);
    $("#preload-pattern-select").addEventListener("change", (event) => {
      const preset = PRESETS.find((item) => item.id === event.target.value);
      if (preset) loadPreset(preset);
    });
    $("#export-pattern-button").addEventListener("click", exportPattern);
    $("#export-mel-button").addEventListener("click", exportMel);
    $("#import-midi-button").addEventListener("click", () => $("#midi-import-input").click());
    $("#midi-import-input").addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      if (file) void importMidiFile(file);
      event.target.value = "";
    });
    $("#piano-roll-toolbar").addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-piano-toolbar-toggle]");
      if (!toggle) return;
      const options = document.getElementById(toggle.getAttribute("aria-controls"));
      if (!options) return;
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.title = `${expanded ? "Collapse" : "Expand"} ${toggle.textContent.trim()} options`;
      options.hidden = !expanded;
    });
    $("#piano-audio-import-button").addEventListener("click", () => $("#piano-audio-import-input").click());
    $("#piano-audio-import-input").addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      if (file) void importAudioToPianoRoll(file);
      event.target.value = "";
    });
    $("#piano-audio-source-select").addEventListener("change", async (event) => {
      selectPianoRollAudioSource(event.currentTarget.value);
      if (event.currentTarget.value) await transcribeSelectedPianoAudio();
    });
    $("#piano-audio-transcribe-button").addEventListener("click", transcribeSelectedPianoAudio);
    $("#piano-audio-scan-button").addEventListener("click", scanSelectedPianoAudio);
    $("#piano-audio-stems").addEventListener("change", (event) => {
      const input = event.target.closest("[data-audio-stem]");
      if (input) updatePianoAudioStemSelection(input.dataset.audioStem, input.checked);
    });
    $("#piano-audio-chop-button").addEventListener("click", openPianoAudioChopper);
    $("#piano-chopper-close").addEventListener("click", () => $("#piano-chopper-dialog").close());
    $("#piano-chopper-cancel").addEventListener("click", () => $("#piano-chopper-dialog").close());
    $("#piano-chopper-apply").addEventListener("click", chopSelectedPianoAudio);
    $("#piano-chopper-division").addEventListener("change", updatePianoChopperPreview);
    $("#piano-chopper-organize").addEventListener("change", updatePianoChopperPreview);
    $("#piano-chopper-dropoff").addEventListener("input", (event) => {
      $("#piano-chopper-dropoff-value").textContent = `${event.currentTarget.value}%`;
    });
    $("#piano-chopper-pitch").addEventListener("input", (event) => {
      const pitch = Number(event.currentTarget.value);
      $("#piano-chopper-pitch-value").textContent =
        `${pitch > 0 ? "+" : ""}${pitch} semitone${Math.abs(pitch) === 1 ? "" : "s"}`;
    });
    $("#piano-chopper-dialog").addEventListener("click", (event) => {
      if (event.target === $("#piano-chopper-dialog")) $("#piano-chopper-dialog").close();
    });
    $("#piano-note-chopper-close").addEventListener("click", () => $("#piano-note-chopper-dialog").close());
    $("#piano-note-chopper-cancel").addEventListener("click", () => $("#piano-note-chopper-dialog").close());
    $("#piano-note-chopper-apply").addEventListener("click", chopSelectedPianoNotes);
    $("#piano-note-chopper-dialog").addEventListener("click", (event) => {
      if (event.target === $("#piano-note-chopper-dialog")) $("#piano-note-chopper-dialog").close();
    });
    $("#piano-autotune-button").addEventListener("click", tunePianoNotesToScale);
    $("#export-midi-button").addEventListener("click", exportMidi);
    $("#export-song-button").addEventListener("click", openSongExportMenu);
    $("#export-song-wav-button").addEventListener("click", () => exportArrangementAudio("wav"));
    $("#export-song-mp3-button").addEventListener("click", () => exportArrangementAudio("mp3"));
    $("#export-project-button").addEventListener("click", exportProjectFile);
    $("#export-song-close").addEventListener("click", () => $("#export-song-dialog").close());
    $("#export-song-dialog").addEventListener("click", (event) => {
      if (event.target === $("#export-song-dialog")) $("#export-song-dialog").close();
    });
    $("#metronome-button").addEventListener("click", toggleMetronome);
    document.querySelectorAll("[data-editor-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        state.editorTool = button.dataset.editorTool;
        document.querySelectorAll("[data-editor-tool]").forEach((item) => {
          item.classList.toggle("is-selected", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
        if (button.dataset.editorTool === "slice") setArrangementSliceMode(true);
        else setArrangementSliceMode(false);
        showToast(`${button.textContent.trim()} tool selected`);
      });
    });
    $("#toolbar-draw-button").addEventListener("click", () => {
      state.pianoDrawMode = !state.pianoDrawMode;
      $("#toolbar-draw-button").setAttribute("aria-pressed", String(state.pianoDrawMode));
      $("#piano-draw-mode-button").setAttribute("aria-pressed", String(state.pianoDrawMode));
      if (state.view === "piano-roll") renderPianoRoll();
    });
    $("#toolbar-note-lock").addEventListener("click", () => {
      const locked = $("#toolbar-note-lock").getAttribute("aria-pressed") !== "true";
      $("#toolbar-note-lock").setAttribute("aria-pressed", String(locked));
      state.pianoNotesLocked = locked;
      showToast(locked ? "Selected-note editing locked" : "Note editing unlocked");
    });
    $("#toolbar-quantize").addEventListener("click", quantizePianoNotes);
    $("#toolbar-strum")?.addEventListener("click", () => {
      strumSelectedPianoNotes();
    });
    $("#toolbar-chop").addEventListener("click", () => {
      if (typeof openPianoAudioChopper === "function") openPianoAudioChopper();
    });
    $("#toolbar-flip").addEventListener("click", () => {
      const choice = window.confirm("Reverse melody vertically? Cancel reverses horizontally.");
      if (typeof flipPianoNotes === "function") flipPianoNotes(choice ? "vertical" : "horizontal");
    });
    $("#toolbar-stabs").addEventListener("click", shortenSelectedPianoNotesToStabs);
    $("#toolbar-duplicate-right").addEventListener("click", duplicateSelectedPianoNotesRight);
    $("#piano-note-mode").addEventListener("change", (event) => {
      state.pianoNoteMode = event.target.value === "mono" ? "mono" : "stereo";
      saveState();
      showToast(`${state.pianoNoteMode === "mono" ? "Mono" : "Stereo"} note mode`);
    });
    $("#piano-velocity-toggle").addEventListener("click", () => {
      const panel = $("#piano-velocity-panel");
      panel.classList.toggle("is-collapsed");
      const expanded = !panel.classList.contains("is-collapsed");
      $("#piano-velocity-toggle").setAttribute("aria-expanded", String(expanded));
      $("#piano-velocity-toggle").textContent = expanded ? "−" : "+";
    });
    $("#bottom-mixer-toggle").addEventListener("click", () => {
      const open = document.body.classList.toggle("is-bottom-mixer-open");
      $("#bottom-mixer-toggle").setAttribute("aria-expanded", String(open));
      const panel = $("#bottom-mixer-panel");
      if (open) {
        const mixer = $("#mixer-view");
        panel.append(mixer);
        mixer.hidden = false;
        renderMixer();
        requestAnimationFrame(applyBottomMixerPanelSize);
      } else {
        const mixer = $("#mixer-view");
        $(".arrangement-main").prepend(mixer);
        setWorkspaceView(state.view === "mixer" ? "arrangement" : state.view);
      }
    });
    const bottomMixerResizer = $("#bottom-mixer-resizer");
    bottomMixerResizer.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("is-bottom-mixer-open") || event.button !== 0) return;
      bottomMixerResizePointerId = event.pointerId;
      bottomMixerResizer.setPointerCapture(event.pointerId);
      document.body.classList.add("is-resizing-bottom-mixer");
      event.preventDefault();
    });
    bottomMixerResizer.addEventListener("pointermove", (event) => {
      if (event.pointerId !== bottomMixerResizePointerId) return;
      const main = $("#bottom-mixer-panel").parentElement;
      const arrangement = $("#arrangement-view");
      const availableHeight = main.getBoundingClientRect().bottom - arrangement.getBoundingClientRect().top;
      if (availableHeight > 0) setBottomMixerRatio(
        (main.getBoundingClientRect().bottom - event.clientY) / availableHeight * 100,
        false,
      );
    });
    const finishBottomMixerResize = (event) => {
      if (event.pointerId !== bottomMixerResizePointerId) return;
      bottomMixerResizePointerId = null;
      document.body.classList.remove("is-resizing-bottom-mixer");
      saveState();
    };
    bottomMixerResizer.addEventListener("pointerup", finishBottomMixerResize);
    bottomMixerResizer.addEventListener("pointercancel", finishBottomMixerResize);
    bottomMixerResizer.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      setBottomMixerRatio(state.bottomMixerRatio + (event.key === "ArrowUp" ? 4 : -4));
    });
    $("#play-mode-indicator").addEventListener("click", (event) => {
      event.stopPropagation();
      setTransportMode(state.transportMode === "arrangement" ? "sequencer" : "arrangement");
    });
    $("#help-button").addEventListener("click", () => $("#help-dialog").showModal());
    const rackTab = $("#sequencer-tab");
    rackTab.addEventListener("click", () => {
      if (suppressRackTabClick) {
        suppressRackTabClick = false;
        return;
      }
      setWorkspaceView("sequencer");
    });
    rackTab.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      rackTabDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      document.addEventListener("pointermove", moveRackTab);
      document.addEventListener("pointerup", endRackTabDrag, { once: true });
      document.addEventListener("pointercancel", endRackTabDrag, { once: true });
    });
    $("#rack-dock-button").addEventListener("click", dockRackWindow);
    $("#rack-floating-header").addEventListener("pointerdown", startFloatingRackMove);
    $("#arrangement-tab")?.addEventListener("click", () => setWorkspaceView("arrangement"));
    const pianoRollTab = $("#piano-roll-tab");
    pianoRollTab.addEventListener("click", () => {
      if (suppressPianoRollTabClick) {
        suppressPianoRollTabClick = false;
        return;
      }
      setWorkspaceView("piano-roll");
    });
    pianoRollTab.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      pianoRollTabDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      document.addEventListener("pointermove", movePianoRollTab);
      document.addEventListener("pointerup", endPianoRollTabDrag, { once: true });
      document.addEventListener("pointercancel", endPianoRollTabDrag, { once: true });
    });
    $("#piano-dock-button").addEventListener("click", dockPianoRollWindow);
    $("#piano-floating-header").addEventListener("pointerdown", startFloatingPianoRollMove);
    $("#step-piano-return").addEventListener("click", () => {
      closeStepInstrumentPianoRoll();
      setWorkspaceView("sequencer");
    });
    $("#mixer-tab").addEventListener("click", () => setWorkspaceView("mixer"));
    $("#dj-tab")?.addEventListener("click", () => setWorkspaceView("dj"));
    bindDjEvents();
    $("#add-effects-track").addEventListener("click", createEffectTrack);
    $("#hide-workspace-button").addEventListener("click", () => setViewVisibility(true, false));
    $("#show-workspace-button").addEventListener("click", () => setViewVisibility(false, false, "hide-workspace-button"));
    $("#hide-track-view-button").addEventListener("click", () => setViewVisibility(false, true));
    $("#show-track-view-button").addEventListener("click", () => setWorkspaceView("arrangement"));
    $("#workspace-fullscreen-button").addEventListener("click", toggleWorkspaceFullscreen);
    $("#track-view-fullscreen-button").addEventListener("click", toggleTrackViewFullscreen);
    document.querySelectorAll(".app-fullscreen-button").forEach((button) => {
      button.addEventListener("click", toggleAppFullscreen);
    });
    document.querySelectorAll(".fullscreen-view-toggle").forEach((button) => {
      button.addEventListener("click", toggleFullscreenWorkspaceView);
    });
    const viewResizer = $("#view-resizer");
    viewResizer.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const main = $("#arrangement-main");
      const updateRatio = (moveEvent) => {
        const bounds = main.getBoundingClientRect();
        const horizontal = userSettings.blueprintLayout === "side-by-side";
        const available = (horizontal ? bounds.width : bounds.height) -
          (horizontal ? viewResizer.offsetWidth : viewResizer.offsetHeight);
        if (available <= 0) return;
        const pointerOffset = horizontal
          ? moveEvent.clientX - bounds.left - viewResizer.offsetWidth / 2
          : moveEvent.clientY - bounds.top - viewResizer.offsetHeight / 2;
        const leadingRatio = pointerOffset / available * 100;
        const workspaceFirst = horizontal || userSettings.blueprintLayout !== "track-top";
        state.workspaceRatio = Math.max(20, Math.min(80,
          Math.round(workspaceFirst ? leadingRatio : 100 - leadingRatio)));
        renderViewLayout();
      };
      const finish = () => {
        document.removeEventListener("pointermove", updateRatio);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        saveState();
      };
      document.addEventListener("pointermove", updateRatio);
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    });
    viewResizer.addEventListener("keydown", (event) => {
      const horizontal = userSettings.blueprintLayout === "side-by-side";
      const workspaceFirst = horizontal || userSettings.blueprintLayout !== "track-top";
      if ((horizontal && event.key === "ArrowRight") ||
        (!horizontal && event.key === (workspaceFirst ? "ArrowDown" : "ArrowUp"))) {
        setWorkspaceRatio(state.workspaceRatio + 5);
      } else if ((horizontal && event.key === "ArrowLeft") ||
        (!horizontal && event.key === (workspaceFirst ? "ArrowUp" : "ArrowDown"))) {
        setWorkspaceRatio(state.workspaceRatio - 5);
      } else if (event.key === "Home") setWorkspaceRatio(20);
      else if (event.key === "End") setWorkspaceRatio(80);
      else return;
      event.preventDefault();
    });
    $("#open-beat-grid-button").addEventListener("click", () => setWorkspaceView(state.view === "sequencer" && !state.workspaceHidden ? "arrangement" : "sequencer"));
    $("#open-piano-roll-button").addEventListener("click", () => setWorkspaceView(state.view === "piano-roll" && !state.workspaceHidden ? "arrangement" : "piano-roll"));
    $("#step-keyboard-record-button").addEventListener("click", () => toggleKeyboardRecording("sequencer"));
    $("#piano-keyboard-record-button").addEventListener("click", () => toggleKeyboardRecording("piano-roll"));
    $("#mel-select").addEventListener("change", (event) => {
      selectMel(event.target.value);
      updateCollaborationLockUi();
    });
    $("#new-mel-button").addEventListener("click", createMel);
    $("#rename-mel-button").addEventListener("click", renameMel);
    $("#mel-drag-source").addEventListener("dragstart", (event) => {
      if (state.stepPianoEditContext) {
        syncStepPianoEdit();
        const pattern = getPattern(state.stepPianoEditContext.patternId);
        if (!pattern || !event.dataTransfer) return;
        event.dataTransfer.setData("application/x-pulsegrid-pattern-source", JSON.stringify({ patternId: pattern.id }));
        event.dataTransfer.effectAllowed = "copy";
        return;
      }
      const mel = getMel();
      if (!mel || !event.dataTransfer) return;
      event.dataTransfer.setData("application/x-pulsegrid-mel-source", JSON.stringify({ melId: mel.id }));
      event.dataTransfer.effectAllowed = "copy";
    });
    $("#piano-instrument-select").addEventListener("click", () => openStepInstrumentPicker(null, "piano-roll"));
    $("#piano-track-mix-button").addEventListener("click", () => {
      const track = getPianoTrack();
      if (track) openStepTrackMix(track);
    });
    const pianoRollDropTarget = $("#piano-roll-scroll");
    pianoRollDropTarget.addEventListener("dragover", (event) => {
      const types = Array.from(event.dataTransfer?.types || []);
      const isVst = types.includes("application/x-pulsegrid-vst");
      const isSample = types.includes("application/x-pulsegrid-sample-source");
      if (!isVst && !isSample) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      pianoRollDropTarget.classList.toggle("is-vst-drop-target", isVst);
      pianoRollDropTarget.classList.toggle("is-sample-drop-target", isSample);
    });
    pianoRollDropTarget.addEventListener("dragleave", (event) => {
      if (!pianoRollDropTarget.contains(event.relatedTarget)) {
        pianoRollDropTarget.classList.remove("is-vst-drop-target");
        pianoRollDropTarget.classList.remove("is-sample-drop-target");
      }
    });
    pianoRollDropTarget.addEventListener("drop", (event) => {
      pianoRollDropTarget.classList.remove("is-vst-drop-target");
      pianoRollDropTarget.classList.remove("is-sample-drop-target");
      const sampleId = event.dataTransfer?.getData("application/x-pulsegrid-sample-source");
      if (sampleId) {
        event.preventDefault();
        void importSampleNoteToPianoRoll(sampleId, event);
        return;
      }
      const payload = event.dataTransfer?.getData("application/x-pulsegrid-vst");
      if (!payload) return;
      event.preventDefault();
      try {
        const { instrumentId, vstPluginId } = JSON.parse(payload);
        assignVstToPianoRoll(instrumentId, vstPluginId);
      } catch {
        showToast("That VST could not be loaded in Piano Roll.");
      }
    });
    $("#piano-draw-mode-button").addEventListener("click", () => {
      state.pianoDrawMode = !state.pianoDrawMode;
      renderPianoRoll();
    });
    $("#piano-humanize-button").addEventListener("click", humanizePianoNotes);
    $("#piano-quantize-button").addEventListener("click", quantizePianoNotes);
    $("#piano-scale-root").addEventListener("change", (event) => {
      state.pianoScaleRoot = Number(event.target.value);
      renderPianoRoll();
      saveState();
    });
    $("#piano-scale-type").addEventListener("change", (event) => {
      state.pianoScaleType = event.target.value;
      renderPianoRoll();
      saveState();
    });
    $("#piano-scale-lock").addEventListener("change", (event) => {
      state.pianoScaleLock = event.target.checked;
      saveState();
    });
    $("#piano-roll-grid").addEventListener("contextmenu", (event) => {
      const noteElement = event.target.closest(".piano-roll-note");
      if (!noteElement) return;
      const note = state.pianoNotes.find((item) => item.id === noteElement.dataset.noteId);
      if (note) openPianoNoteContextMenu(event, note);
    });
    $("#piano-note-context-menu").addEventListener("input", updatePianoNoteContext);
    $("#piano-note-context-close").addEventListener("click", closePianoNoteContextMenu);
    $("#piano-roll-toolbar").addEventListener("keydown", (event) => {
      if (event.key.startsWith("Arrow")) event.stopPropagation();
    });
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#piano-note-context-menu");
      if (!menu.hidden && !menu.contains(event.target)) closePianoNoteContextMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#piano-note-context-menu").hidden) {
        closePianoNoteContextMenu();
      }
    });
    $("#piano-snap-select").addEventListener("change", (event) => {
      state.pianoSnapEnabled = event.target.value !== "off";
      if (state.pianoSnapEnabled) state.pianoSnap = Number(event.target.value);
      $("#piano-quantize-button").disabled = !state.pianoSnapEnabled;
      saveState();
    });
    $("#piano-loop-button").addEventListener("click", () => {
      stopWorkspacePlayback("piano-roll");
      if (state.isPlaying && state.playbackMode === "piano-roll") stopPlayback();
      state.pianoLoopEnabled = !state.pianoLoopEnabled;
      updatePianoLoopUI();
      saveState();
    });
    $("#piano-note-length-select").addEventListener("change", (event) => {
      state.pianoNoteLength = Number(event.target.value);
      saveState();
    });
    $("#piano-bars-select").addEventListener("change", (event) => {
      state.pianoBars = Number(event.target.value);
      state.pianoCursorTick = Math.min(state.pianoCursorTick, state.pianoBars * PIANO_TICKS_PER_BAR - 0.001);
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
    });
    $("#piano-scale-slider").addEventListener("input", (event) => {
      setPianoRollScale(Number(event.target.value) / 100);
    });
    $("#piano-scale-slider").addEventListener("change", saveState);
    $("#piano-roll-scroll").addEventListener("wheel", (event) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        adjustSelectedPianoNoteVelocity(event.deltaY < 0 ? 0.05 : -0.05);
        return;
      }
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setPianoRollScale(state.pianoScale * Math.exp(-event.deltaY * 0.002), event.clientX);
      scheduleScaleSave();
    }, { passive: false });
    $("#piano-roll-grid").addEventListener("click", (event) => {
      if (state.pianoDrawMode) return;
      if (state.suppressPianoGridClick) {
        state.suppressPianoGridClick = false;
        return;
      }
      if (!event.target.closest(".piano-roll-note")) addPianoNoteFromPointer(event);
    });
    $("#piano-roll-grid").addEventListener("pointerdown", startPianoSelection);
    $("#piano-roll-ruler-viewport").addEventListener("pointerdown", seekPianoRollFromRuler);
    $("#piano-roll-scroll").addEventListener("scroll", () => {
      updatePianoRulerViewport();
      updatePianoPlayhead();
      $("#piano-velocity-bars").scrollLeft = $("#piano-roll-scroll").scrollLeft;
    });
    $("#piano-velocity-bars").addEventListener("scroll", () => {
      $("#piano-roll-scroll").scrollLeft = $("#piano-velocity-bars").scrollLeft;
    });
    $("#piano-roll-view").addEventListener("scroll", updatePianoRulerViewport);
    window.addEventListener("scroll", updatePianoRulerViewport, true);
    window.addEventListener("resize", updatePianoRulerViewport);
    $("#clear-piano-roll-button").addEventListener("click", () => {
      if (state.pianoNotes.length) markPianoRollAudioEdited();
      state.pianoNotes = [];
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.pianoSelectionFromMarquee = false;
      state.scheduledPianoNotes.clear();
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
    });
    $("#timeline-scroll").addEventListener("scroll", (event) => {
      const labels = $("#arrangement-track-labels");
      if (labels.scrollTop !== event.currentTarget.scrollTop) labels.scrollTop = event.currentTarget.scrollTop;
    });
    $("#arrangement-track-labels").addEventListener("scroll", (event) => {
      const timeline = $("#timeline-scroll");
      if (timeline.scrollTop !== event.currentTarget.scrollTop) timeline.scrollTop = event.currentTarget.scrollTop;
    });
    $("#arrangement-track-labels").addEventListener("contextmenu", openArrangementTrackContextMenu);
    $("#timeline-content").addEventListener("contextmenu", openArrangementTrackContextMenu);
    $("#audio-clip-edit-close").addEventListener("click", () => $("#audio-clip-edit-dialog").close());
    $("#audio-clip-edit-dialog").addEventListener("input", updateAudioClipEditor);
    $("#audio-clip-edit-dialog").addEventListener("change", updateAudioClipEditor);
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#arrangement-track-context-menu");
      if (!menu.hidden && event.target instanceof Node && !menu.contains(event.target)) {
        closeArrangementTrackContextMenu();
      }
      const assetMenu = $("#asset-context-menu");
      if (!assetMenu.hidden && event.target instanceof Node && !assetMenu.contains(event.target)) {
        closeAssetContextMenu();
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#arrangement-track-context-menu").hidden) {
        closeArrangementTrackContextMenu();
      }
      if (event.key === "Escape") closeAssetContextMenu();
    }, true);
    $("#rename-arrangement-track").addEventListener("click", () => {
      const menu = $("#arrangement-track-context-menu");
      const trackId = menu.dataset.trackId;
      closeArrangementTrackContextMenu();
      if (trackId) renameArrangementTrack(trackId);
    });
    $("#duplicate-arrangement-track").addEventListener("click", () => {
      const trackId = $("#arrangement-track-context-menu").dataset.trackId;
      closeArrangementTrackContextMenu();
      if (trackId) duplicateArrangementTrack(trackId);
    });
    $("#rename-arrangement-asset").addEventListener("click", () => {
      const menu = $("#arrangement-track-context-menu");
      const { assetType, assetId } = menu.dataset;
      closeArrangementTrackContextMenu();
      if (assetType && assetId) renameArrangementAsset(assetType, assetId);
    });
    $("#branch-arrangement-asset").addEventListener("click", () => {
      const menu = $("#arrangement-track-context-menu");
      const { assetType, assetId } = menu.dataset;
      closeArrangementTrackContextMenu();
      if (assetType && assetId) branchArrangementAsset(assetType, assetId);
    });
    $("#arrangement-segment-options").addEventListener("click", (event) => {
      const option = event.target instanceof Element ? event.target.closest("button[data-asset-id]") : null;
      if (!option) return;
      closeArrangementTrackContextMenu();
      openArrangementAssetInEditor(option.dataset.assetType, option.dataset.assetId);
    });
    const handleLibraryAssetAction = (action) => {
      const menu = $("#asset-context-menu");
      const { assetType, assetId } = menu.dataset;
      closeAssetContextMenu();
      if (assetType && assetId) {
        if (action === "rename") renameArrangementAsset(assetType, assetId);
        else branchArrangementAsset(assetType, assetId);
      }
    };
    $("#rename-library-asset").addEventListener("click", () => handleLibraryAssetAction("rename"));
    $("#branch-library-asset").addEventListener("click", () => handleLibraryAssetAction("branch"));
    $("#open-library-asset").addEventListener("click", () => {
      const { assetType, assetId } = $("#asset-context-menu").dataset;
      closeAssetContextMenu();
      if ($("#source-browser-dialog").open) $("#source-browser-dialog").close();
      if (assetType && assetId) {
        if (assetType === "pattern") openPatternInRackWindow(assetId);
        else if (assetType === "mel") openMelInPianoRollWindow(assetId);
        else openAudioAssetInPianoRollWindow(assetType, assetId);
      }
    });
    $("#draw-pattern-components").addEventListener("click", () => {
      const { assetType, assetId } = $("#asset-context-menu").dataset;
      closeAssetContextMenu();
      if (assetType === "pattern" && assetId) drawPatternComponentsIntoTrack(assetId);
    });
    $("#add-empty-track-below").addEventListener("click", () => {
      const menu = $("#arrangement-track-context-menu");
      const parentTrackId = menu.dataset.trackId;
      if (!parentTrackId) return;
      const track = createArrangementTrack(getNextArrangementTrackName(), parentTrackId);
      state.selectedMixerTrackId = track.id;
      closeArrangementTrackContextMenu();
      renderArrangement();
      saveState();
      Array.from($("#arrangement-track-labels").querySelectorAll(".arrangement-label")).find((label) =>
        label.dataset.trackId === track.id)?.scrollIntoView({ block: "nearest" });
    });
    $("#arrangement-audio-piano-options").addEventListener("click", (event) => {
      const option = event.target instanceof Element ? event.target.closest("button[data-clip-id]") : null;
      const trackId = $("#arrangement-track-context-menu").dataset.trackId;
      if (!option || !trackId) return;
      const clipId = option.dataset.clipId;
      closeArrangementTrackContextMenu();
      void openAudioClipInPianoRoll(trackId, clipId);
    });
    $("#timeline-content").addEventListener("pointerdown", startArrangementSelection);
    $("#timeline-content").addEventListener("click", (event) => {
      const ruler = event.target.closest(".timeline-ruler");
      if (!ruler) return;
      const bounds = ruler.getBoundingClientRect();
      setArrangementCursor((event.clientX - bounds.left) / BAR_WIDTH);
    });
    $("#timeline-content").addEventListener("click", (event) => {
      if (!state.suppressArrangementClick) return;
      state.suppressArrangementClick = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    document.addEventListener("pointerdown", clearStepSelectionOnPointerDown, true);
    document.addEventListener("pointerdown", clearMarqueeSelectionOnOutsidePointer, true);
    document.addEventListener("click", finishArrangementMarqueeDeselect, true);
    $("#sequencer-pattern-drag-source").addEventListener("dragstart", (event) => {
      const pattern = getPattern();
      if (!pattern || !event.dataTransfer) return;
      event.dataTransfer.setData("application/x-pulsegrid-pattern-source", JSON.stringify({ patternId: pattern.id }));
      event.dataTransfer.effectAllowed = "copy";
    });
    $("#sequencer-pattern-select").addEventListener("change", (event) => {
      selectPattern(event.target.value);
      updateCollaborationLockUi();
    });
    $("#rename-pattern-sequencer-button").addEventListener("click", renamePattern);
    $("#new-pattern-sequencer-button").addEventListener("click", () => createPattern());
    $("#asset-library-new-pattern-button").addEventListener("click", () => {
      const pattern = createPattern();
      if (!pattern) return;
      const assetLibrary = $("#source-browser-dialog");
      if (assetLibrary.open) assetLibrary.close();
      if (state.rackUndocked) {
        $("#rack-floating-window").hidden = false;
        return;
      }
      floatRackWindow(window.innerWidth / 2, window.innerHeight / 3);
    });
    $("#grid-resolution-select").addEventListener("change", (event) => {
      setPatternGridResolution(event.target.value);
    });
    $("#sequencer-scale-slider").addEventListener("input", (event) => {
      setSequencerScale(Number(event.target.value) / 100);
    });
    $("#sequencer-scale-slider").addEventListener("change", saveState);
    $("#sequencer-grid-scroll").addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setSequencerScale(state.sequencerScale * Math.exp(-event.deltaY * 0.002), event.clientX);
      scheduleScaleSave();
    }, { passive: false });
    $("#assets-button").addEventListener("click", () => openDockedAssetLibrary());
    $("#sequencer-browser-button").addEventListener("click", () => openAssetLibrary());
    const assetLibrarySearch = $("#asset-library-search-input");
    assetLibrarySearch.addEventListener("input", () => {
      const query = assetLibrarySearch.value.trim().toLowerCase();
      document.querySelectorAll("#source-browser-dialog .asset-source, #source-browser-dialog .recording-source, #source-browser-dialog .instrument-source").forEach((item) => {
        item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
      });
    });
    const selectedAssetIndicator = $("#selected-asset-indicator");
    const selectedAssetMenu = $("#selected-asset-menu");
    selectedAssetIndicator.addEventListener("click", () => {
      const shouldOpen = selectedAssetMenu.hidden;
      if (shouldOpen) renderSelectedAssetMenu();
      selectedAssetMenu.hidden = !shouldOpen;
    });
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("#selected-asset-indicator, #selected-asset-menu")) {
        selectedAssetMenu.hidden = true;
      }
    });
    $("#pattern-length-auto").addEventListener("click", () => {
      const pattern = getPattern();
      if (!pattern) return;
      pattern.lengthMode = "auto";
      updateAutoPatternLength(pattern);
      renderPatternLengthControls();
      renderTracks();
      renderArrangement();
      saveState();
      showToast("Pattern length set to Auto");
    });
    const soundSearchInput = $("#sound-library-search-input");
    soundSearchInput.addEventListener("input", () => {
      stepInstrumentPendingId = null;
      $("#step-instrument-select").disabled = true;
      renderSoundSearchSuggestions(soundSearchInput.value);
      renderStepInstrumentLibrary(soundSearchInput.value);
    });
    soundSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        renderSoundSearchSuggestions("");
        renderStepInstrumentLibrary(soundSearchInput.value.trim(), true);
      } else if (event.key === "Escape") {
        renderSoundSearchSuggestions("");
        soundSearchInput.blur();
      } else if (event.key === "ArrowDown") {
        const firstResult = $("#sound-library-search-results").querySelector(".sound-library-search-result");
        if (firstResult) {
          event.preventDefault();
          firstResult.focus();
        }
      }
    });
    $("#sound-library-search-results").addEventListener("click", (event) => {
      const result = event.target instanceof Element
        ? event.target.closest(".sound-library-search-result")
        : null;
      if (result instanceof HTMLButtonElement) navigateToSoundSearchResult(result);
    });
    document.addEventListener("pointerdown", (event) => {
      const search = $("#sound-library-search");
      if (event.target instanceof Node && !search.contains(event.target)) {
        renderSoundSearchSuggestions("");
      }
    }, true);
    $("#sound-duration-favorite").addEventListener("click", () => {
      const track = state.tracks.find((item) => item.id === $("#sound-duration-menu").dataset.trackId);
      if (!track) {
        showToast("This sound is no longer available.");
        return;
      }
      toggleSoundFavorite(track);
    });
    $("#sound-duration-play").addEventListener("click", () => {
      const track = state.tracks.find((item) => item.id === $("#sound-duration-menu").dataset.trackId);
      if (!track) {
        showToast("This sound is no longer available.");
        return;
      }
      previewInstrumentSound(track);
    });
    $("#sound-duration-close").addEventListener("click", closeSoundDurationMenu);
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#sound-duration-menu");
      if (!menu.hidden && !menu.contains(event.target)) closeSoundDurationMenu();
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#sound-duration-menu").hidden) {
        event.preventDefault();
        event.stopPropagation();
        closeSoundDurationMenu();
      }
    }, true);
    $("#step-instrument-close").addEventListener("click", () => $("#step-instrument-dialog").close());
    $("#step-instrument-select").addEventListener("click", applyStepInstrumentSelection);
    $("#step-instrument-upload-button").addEventListener("click", () => stepInstrumentUploadInput.click());
    stepInstrumentUploadInput.addEventListener("change", () => {
      void importDrumSamples(Array.from(stepInstrumentUploadInput.files || []), {
        selectFirst: true,
        input: stepInstrumentUploadInput,
      });
    });
    $("#step-instrument-dialog").addEventListener("close", () => {
      closeSoundDurationMenu();
      stepInstrumentTargetTrackId = null;
      stepInstrumentPendingId = null;
      $("#sound-library-search-input").value = "";
      renderSoundSearchSuggestions("");
    });
    $("#step-instrument-dialog").addEventListener("click", (event) => {
      if (event.target === $("#step-instrument-dialog")) $("#step-instrument-dialog").close();
    });
    $("#step-track-mix-close").addEventListener("click", () => $("#step-track-mix-dialog").close());
    $("#step-track-mix-dialog").addEventListener("close", () => {
      stopStepMixPreview();
      saveState();
    });
    $("#step-track-mix-dialog").addEventListener("click", (event) => {
      if (event.target === $("#step-track-mix-dialog")) $("#step-track-mix-dialog").close();
    });
    $("#mixer-effect-preview").addEventListener("click", () => toggleMixerEffectPreview());
    $("#mixer-effect-close").addEventListener("click", () => $("#mixer-effect-dialog").close());
    $("#remove-mixer-effect-context").addEventListener("click", () => {
      const menu = $("#mixer-effect-context-menu");
      const track = getMixerTracks().find(({ track: item }) => item.id === menu.dataset.trackId)?.track;
      const effectId = menu.dataset.effectId;
      closeMixerEffectContextMenu();
      if (track && effectId) removeMixerEffect(track, effectId);
    });
    $("#mixer-track-context-menu").addEventListener("click", (event) => {
      const button = event.target instanceof Element
        ? event.target.closest("[data-mixer-track-action]")
        : null;
      const menu = $("#mixer-track-context-menu");
      if (!button) return;
      const { trackId } = menu.dataset;
      menu.hidden = true;
      if (trackId) applyMixerTrackContextAction(trackId, button.dataset.mixerTrackAction);
    });
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#mixer-effect-context-menu");
      if (!menu.hidden && event.target instanceof Node && !menu.contains(event.target)) {
        closeMixerEffectContextMenu();
      }
      const trackMenu = $("#mixer-track-context-menu");
      if (!trackMenu.hidden && event.target instanceof Node && !trackMenu.contains(event.target)) {
        trackMenu.hidden = true;
      }
      const rackMenu = $("#rack-row-context-menu");
      if (!rackMenu.hidden && event.target instanceof Node && !rackMenu.contains(event.target)) {
        rackMenu.hidden = true;
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMixerEffectContextMenu();
      if (event.key === "Escape") $("#mixer-track-context-menu").hidden = true;
      if (event.key === "Escape") $("#rack-row-context-menu").hidden = true;
    });
    $("#mixer-effect-dialog").addEventListener("close", () => {
      if ($("#mixer-effect-dialog").open) return;
      stopMixerEffectPreview();
      if (state.mixerEffectAnimation !== null) cancelAnimationFrame(state.mixerEffectAnimation);
      state.mixerEffectAnimation = null;
      state.mixerEffectDialogTrackId = null;
    });
    $("#mixer-effect-dialog").addEventListener("click", (event) => {
      if (event.target === $("#mixer-effect-dialog")) $("#mixer-effect-dialog").close();
    });
    $("#mixer-routing-close").addEventListener("click", () => $("#mixer-routing-dialog").close());
    $("#mixer-routing-done").addEventListener("click", () => $("#mixer-routing-dialog").close());
    $("#mixer-routing-remove").addEventListener("click", () => {
      const track = state.effectTracks.find((item) => item.id === state.mixerRoutingDialogTrackId);
      if (track) removeEffectTrack(track);
    });
    $("#mixer-routing-dialog").addEventListener("close", () => {
      state.mixerRoutingDialogTrackId = null;
    });
    $("#mixer-routing-dialog").addEventListener("click", (event) => {
      if (event.target === $("#mixer-routing-dialog")) $("#mixer-routing-dialog").close();
    });
    $("#rack-row-context-menu").addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-rack-action]") : null;
      if (!button) return;
      const menu = $("#rack-row-context-menu");
      const trackId = menu.dataset.trackId;
      const action = button.dataset.rackAction;
      applyRackRowMenuAction(trackId, action);
      menu.hidden = true;
    });
    $("#source-browser-button").addEventListener("click", () => openTrackAssetLibrary());
    const assetLaneResizer = $("#track-asset-resizer");
    assetLaneResizer.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || $("#track-view-asset-lane").hidden) return;
      event.preventDefault();
      const pointerId = event.pointerId;
      const left = $("#track-view-content").getBoundingClientRect().left;
      document.body.classList.add("is-resizing-track-assets");
      const move = (moveEvent) => {
        if (moveEvent.pointerId === pointerId) {
          setTrackAssetLibraryWidth(moveEvent.clientX - left, false);
        }
      };
      const finish = (finishEvent) => {
        if (finishEvent.pointerId !== pointerId) return;
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        document.body.classList.remove("is-resizing-track-assets");
        saveState();
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    });
    assetLaneResizer.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      setTrackAssetLibraryWidth(state.trackAssetLibraryWidth + (event.key === "ArrowRight" ? 12 : -12));
    });
    window.addEventListener("resize", () => {
      if (!$("#track-view-asset-lane").hidden && $("#track-view-content").clientWidth) {
        setTrackAssetLibraryWidth(state.trackAssetLibraryWidth, false);
      }
      fitFloatingRackWindow();
    });
    $("#source-browser-close").addEventListener("click", () => {
      if (isTrackAssetLibraryOpen()) closeTrackAssetLibrary();
      else $("#source-browser-dialog").close();
    });
    $("#source-browser-dialog").addEventListener("close", () => {
      closeAssetContextMenu();
      closeSoundDurationMenu();
      stopInstrumentSoundPreview();
      $("#source-browser-dialog").classList.remove("is-docked");
      document.body.classList.remove("asset-library-docked");
      restoreAssetLibraryDialogPosition();
      $("#source-browser-dialog").style.removeProperty("left");
      $("#source-browser-dialog").style.removeProperty("width");
      if (rackAssetLibraryAutoFloated) {
        rackAssetLibraryAutoFloated = false;
        if (state.rackUndocked) dockRackWindow();
      }
    });
    $("#empty-import-button").addEventListener("click", () => requestRecordingImport());
    $("#side-add-recording").addEventListener("click", requestAudioAssetImport);
    $("#audio-assets-input").addEventListener("change", (event) => {
      void importAudioAssets(Array.from(event.target.files || []), event.target);
    });
    $("#recording-input").addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      for (const file of files) await importRecording(file, state.pendingImportTrackId);
      state.pendingImportTrackId = null;
      event.target.value = "";
    });
    $("#add-bars-button").addEventListener("click", () => {
      if (state.arrangementBars >= MAX_ARRANGEMENT_BARS) {
        showToast(`Arrangements are limited to ${MAX_ARRANGEMENT_BARS} bars.`);
        return;
      }
      state.arrangementBars = Math.min(MAX_ARRANGEMENT_BARS, state.arrangementBars + 4);
      updateArrangementLength();
      renderArrangement();
      saveState();
    });
    $("#arrangement-scale-slider").addEventListener("input", (event) => {
      setArrangementScale(Number(event.target.value) / 100);
    });
    $("#arrangement-scale-slider").addEventListener("change", saveState);
    $("#timeline-scroll").addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setArrangementScale(state.arrangementScale * Math.exp(-event.deltaY * 0.002), event.clientX);
      scheduleScaleSave();
    }, { passive: false });
    $("#arrangement-slice-button").addEventListener("click", () => setArrangementSliceMode(!arrangementSliceMode));
    $("#record-audio-button").addEventListener("click", toggleAudioRecording);
    $("#project-name").addEventListener("click", () => {
      renderProjectList();
      $("#project-dialog").showModal();
    });
    $("#project-name").addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const nameElement = $("#project-name-text");
      if (!nameElement) return;
      nameElement.contentEditable = "true";
      nameElement.focus();
      const range = document.createRange();
      range.selectNodeContents(nameElement);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    $("#project-name-text").addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.currentTarget.blur();
    });
    $("#project-name-text").addEventListener("blur", async (event) => {
      const nameElement = event.currentTarget;
      nameElement.contentEditable = "false";
      const trimmed = nameElement.textContent?.trim();
      if (!trimmed) {
        updateProjectNameLabel();
        return;
      }
      const project = state.projects.find((item) =>
        item.id === state.projectId && item.ownerId === state.currentUser);
      if (!project || project.name === trimmed) {
        updateProjectNameLabel();
        return;
      }
      const previousName = project.name;
      project.name = trimmed;
      state.projectName = trimmed;
      updateProjectNameLabel();
      try {
        writeProjectCatalog();
        if (project.cloudBacked) Object.assign(project, await renameCloudProject(project));
        writeProjectCatalog();
        renderProjectList();
      } catch (error) {
        project.name = previousName;
        state.projectName = previousName;
        updateProjectNameLabel();
        writeProjectCatalog();
        showToast(`Could not rename project: ${error.message || "storage is unavailable"}`);
      }
    });
    $("#project-dialog-close").addEventListener("click", () => $("#project-dialog").close());
    $("#save-project-button").addEventListener("click", () => { void saveProjectNow(); });
    $("#top-save-project-button").addEventListener("click", () => { void saveProjectNow(); });
    $("#new-project-button").addEventListener("click", () => { void createProject(); });
    $("#import-project-button").addEventListener("click", () => $("#project-import-input").click());
    $("#project-import-input").addEventListener("change", async (event) => {
      const input = event.currentTarget;
      try {
        await importProjectFile(input.files?.[0]);
      } finally {
        input.value = "";
      }
    });
    $("#switch-user-button").addEventListener("click", () => { void switchUser(); });
    $("#sound-library-button").addEventListener("click", () => {
      $("#project-dialog").close();
      openAssetLibrary();
    });
    $("#project-dialog").addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const projects = getCurrentUserProjects();
        if (!projects.length) return;
        const currentIndex = projects.findIndex((project) => project.id === selectedProjectId);
        const direction = event.key === "ArrowUp" ? -1 : 1;
        const nextIndex = currentIndex < 0
          ? (direction > 0 ? 0 : projects.length - 1)
          : (currentIndex + direction + projects.length) % projects.length;
        selectedProjectId = projects[nextIndex].id;
        renderProjectList();
        $(`#project-list .project-list-item.is-selected`)?.scrollIntoView({ block: "nearest" });
      } else if (event.key === "Enter") {
        event.preventDefault();
        enterSelectedProject();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        void deleteSelectedProject();
      }
    });
    bindCloudAccountSettings();
    $("#collaboration-dialog-close").addEventListener("click", () => $("#collaboration-dialog").close());
    $("#collaboration-join-room").addEventListener("click", () => { void startCollaborationRoom("join"); });
    $("#collaboration-copy-code").addEventListener("click", async () => {
      if (!collaboration.session) return;
      try {
        await navigator.clipboard.writeText(collaboration.session.roomCode);
        showToast("Room code copied");
      } catch {
        showToast("Select and copy the room code above.");
      }
    });
    $("#collaboration-enable-audio").addEventListener("click", async () => {
      try {
        await ensureAudio();
        showToast("Audio is ready for synchronized playback.");
      } catch (error) {
        showToast(`Could not enable audio: ${error.message || "audio is unavailable"}`);
      }
    });
    $("#collaboration-leave-room").addEventListener("click", () => { void leaveCollaborationRoom(); });
    document.querySelectorAll(".collaboration-workspace-action").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.collaborationScope;
        if (button.dataset.collaborationAction === "edit") beginWorkspaceCollaborationEdit(target);
        else if (button.dataset.collaborationAction === "push") void pushWorkspaceCollaborationChanges(target);
        else if (button.dataset.collaborationAction === "discard") void discardWorkspaceCollaborationChanges(target);
      });
    });
    $("#continue-as-guest").addEventListener("click", () => selectUser("guest"));
    $("#login-profile-form").addEventListener("submit", (event) => {
      event.preventDefault();
      void loginUser();
    });
    $("#create-profile-form").addEventListener("submit", (event) => {
      event.preventDefault();
      void createUser();
    });
    sampleInput.addEventListener("change", () => loadSample(sampleInput.files?.[0]));
    $("#import-drum-sounds-button").addEventListener("click", () => drumSamplesInput.click());
    drumSamplesInput.addEventListener("change", () => importDrumSamples(Array.from(drumSamplesInput.files || [])));
    $("#reset-session").addEventListener("click", () => {
      if (!window.confirm("Reset this session to the starter pattern?")) return;
      stopPlayback();
      stopAllWorkspacePlayers();
      state.tracks.filter((track) => track.sample || track.kind === "sample").forEach((track) => {
        deletePersistedDrumSample(track.id).catch(() => showToast(`Could not remove saved sample ${track.name}.`));
      });
      [...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
        ...state.effectTracks, state.masterTrack].forEach(disconnectTrackAudio);
      state.masterTrack = makeMixerBusTrack("mixer-master");
      state.effectTracks = makeDefaultMixerTracks();
      state.tracks = makeTracks();
      state.steps = 16;
      state.patterns = [makePatternSnapshot(makeId(), "Pattern 1", PATTERN_COLORS[0], true)];
      state.selectedPatternId = state.patterns[0].id;
      renderPatternSelectors();
      state.patternClips = [];
      state.audioAssets = [];
      state.mels = [];
      state.selectedMelId = "";
      state.melTracks = [];
      state.pianoNotes = [];
      state.pianoStartBar = 0;
      state.pianoBars = 4;
      state.pianoScale = 1;
      state.pianoDrawMode = false;
      state.pianoSnap = 2;
      state.pianoSnapEnabled = true;
      state.pianoNoteLength = 2;
      state.pianoScaleRoot = 0;
      state.pianoScaleType = "major";
      state.pianoScaleLock = false;
      state.selectedPianoTrackId = "piano-grand";
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.pianoSelectionFromMarquee = false;
      state.selectedStepCells.clear();
      state.selectedMixerTrackId = null;
      state.selectedMixerEffectId = null;
      state.clipboard = null;
      state.selectedArrangementItems.clear();
      state.arrangementSelectionFromMarquee = false;
      state.arrangementBars = 32;
      state.arrangementScale = 1;
      state.arrangementCursor = 0;
      state.arrangementSnap = true;
      state.workspaceRatio = 50;
      state.sequencerScale = 1;
      state.workspaceHidden = true;
      state.trackViewHidden = false;
      state.bpm = 124;
      updateMixerTempoEffects();
      state.swing = 0;
      state.selectedPreset = "warehouse";
      state.view = "arrangement";
      tempoValue.textContent = "124";
      swingSlider.value = "0";
      $("#swing-value").textContent = "0%";
      swingSlider.style.setProperty("--range-progress", "0%");
      ensureMels();
      renderMelOptions();
      setLength(16);
      loadPreset(PRESETS[0]);
      renderPianoInstrumentOptions();
      renderPianoRoll();
      setWorkspaceView("arrangement", true);
    });
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const isTextEntry = target instanceof HTMLElement && (
        target.isContentEditable || target.tagName === "TEXTAREA" ||
        (target.tagName === "INPUT" && !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "hidden", "image"].includes(target.type))
      );
      const vstDialog = $("#dansbpm-synth-dialog");
      if (vstDialog?.open && event.code === "Space" && !isTextEntry &&
          !(target instanceof Element && target.closest("select, textarea, [contenteditable='true']")) &&
          !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) toggleDansBpmSynthPreview(vstDialog);
        return;
      }
      const dialogOpen = $("#help-dialog").open || $("#project-dialog").open || $("#source-browser-dialog").open ||
        $("#step-instrument-dialog").open || $("#step-track-mix-dialog").open || $("#audio-tempo-dialog").open ||
        $("#piano-note-chopper-dialog").open || vstDialog?.open;
      if (!isTyping && !dialogOpen && !event.repeat && event.shiftKey && !event.ctrlKey &&
        !event.metaKey && event.altKey && state.view === "mixer" &&
        $("#mixer-track-context-menu").hidden && event.key.toLowerCase() === "r") {
        event.preventDefault();
        renderSelectedMixerTrack();
        return;
      }
      if (!isTyping && !dialogOpen && !event.repeat && state.view === "piano-roll") {
        const key = event.key.toLowerCase();
        let handled = false;
        if ((event.ctrlKey || event.metaKey) && !event.altKey) {
          if (key === "b") {
            duplicateSelectedPianoNotesRight();
            handled = true;
          } else if (key === "q") {
            quantizePianoNotes();
            handled = true;
          } else if (key === "l") {
            lengthenSelectedPianoNotesToNext();
            handled = true;
          } else if (key === "d") {
            state.selectedPianoNoteId = null;
            state.selectedPianoNoteIds.clear();
            renderPianoRoll();
            handled = true;
          }
        } else if (event.altKey && !event.ctrlKey && !event.metaKey) {
          if (key === "s") {
            strumSelectedPianoNotes();
            handled = true;
          } else if (key === "u") {
            openPianoNoteChopper();
            handled = true;
          } else if (key === "y") {
            const vertical = window.confirm("Reverse vertically? Cancel reverses horizontally.");
            flipPianoNotes(vertical ? "vertical" : "horizontal");
            handled = true;
          }
        } else if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && key === "d") {
          shortenSelectedPianoNotesToStabs();
          handled = true;
        }
        if (handled) {
          event.preventDefault();
          return;
        }
      }
      if (!isTyping && !dialogOpen && !event.repeat && state.view === "sequencer" &&
        (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        routeSelectedRackRowsToMixer(event.shiftKey);
        return;
      }
      const rackMenu = $("#rack-row-context-menu");
      if (!isTyping && !dialogOpen && !rackMenu.hidden) {
        const action = ({ "2": "fill2", "4": "fill4", "8": "fill8", d: "delete", a: "automation" })[
          event.key.toLowerCase()
        ];
        if (action) {
          event.preventDefault();
          rackMenu.hidden = true;
          applyRackRowMenuAction(rackMenu.dataset.trackId, action);
          return;
        }
        const mixerTrackMenu = $("#mixer-track-context-menu");
        if (!isTyping && !dialogOpen && !mixerTrackMenu.hidden) {
          const action = ({ r: "reset", e: "clear" })[event.key.toLowerCase()];
          if (action) {
            event.preventDefault();
            mixerTrackMenu.hidden = true;
            applyMixerTrackContextAction(mixerTrackMenu.dataset.trackId, action);
            return;
          }
        }
      }
      if (!isTextEntry && !dialogOpen && matchesConfiguredShortcut(event, "redo")) {
        event.preventDefault();
        if (!event.repeat) redoCurrentView();
        return;
      }
      if (!isTextEntry && !dialogOpen && matchesConfiguredShortcut(event, "undo")) {
        event.preventDefault();
        if (!event.repeat) undoCurrentView();
        return;
      }
      if (!isTyping && !dialogOpen && !event.repeat && matchesConfiguredShortcut(event, "fullscreen")) {
        event.preventDefault();
        const area = getLastInteractedViewArea();
        if (document.fullscreenElement === $("#track-view-area")) {
          void toggleTrackViewFullscreen();
        } else if (document.fullscreenElement === $("#workspace-area")) {
          void toggleWorkspaceFullscreen();
        } else if (state.view === "dj" && djViewExpanded) {
          setDjViewExpanded(false);
        } else if (area === "track-view") {
          void toggleTrackViewFullscreen();
        } else if (state.view === "dj") {
          setDjViewExpanded(!djViewExpanded);
        } else {
          void toggleWorkspaceFullscreen();
        }
        return;
      }
      const djControlFocused = state.view === "dj" && djViewExpanded &&
        target instanceof Element && target.closest("input, select, textarea, [contenteditable='true']");
      const pianoRollSelectAll = state.view === "piano-roll" && !isTextEntry &&
        (matchesConfiguredShortcut(event, "select-all-editor") ||
          matchesLegacyShiftShortcut(event, "select-all-editor"));
      if (state.view === "dj" && djViewExpanded && matchesConfiguredShortcut(event, "play") &&
        (dialogOpen || (djControlFocused && !(event.ctrlKey || event.altKey || event.metaKey)))) return;
      if (!isTyping && !dialogOpen && matchesConfiguredShortcut(event, "workspace-play") && !isTextEntry) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
        toggleCurrentWorkspacePlayback();
        return;
      }
      if (!isTyping && !event.repeat && !dialogOpen) {
        if (matchesConfiguredShortcut(event, "place") && !state.keyboardRecording) {
          event.preventDefault();
          placeCurrentEditorAtPlayhead();
        } else if (matchesConfiguredShortcut(event, "split")) {
          event.preventDefault();
          splitArrangementItemsAtCursor();
        } else if (matchesConfiguredShortcut(event, "slice")) {
          event.preventDefault();
          setArrangementSliceMode(!arrangementSliceMode);
        }
      }
      if ((!isTyping || pianoRollSelectAll) && !dialogOpen && !event.repeat) {
        const clipboardView = getClipboardEditorView();
        const rackClipboardAction = !isTyping && clipboardView === "sequencer" &&
          state.selectedRackRows.size > 0 && (event.ctrlKey || event.metaKey) && !event.altKey
          ? event.key.toLowerCase()
          : "";
        if (rackClipboardAction === "c") {
          event.preventDefault();
          copySelectedRackRowContents();
        } else if (rackClipboardAction === "x") {
          event.preventDefault();
          clearSelectedRackRowContents();
        } else if (rackClipboardAction === "v") {
          event.preventDefault();
          pasteRackRowContents();
        } else if ((matchesConfiguredShortcut(event, "select-all") || matchesLegacyShiftShortcut(event, "select-all") ||
          matchesConfiguredShortcut(event, "select-all-editor") ||
          matchesLegacyShiftShortcut(event, "select-all-editor")) &&
          ["arrangement", "sequencer", "piano-roll", "mixer"].includes(clipboardView)) {
          event.preventDefault();
          if (clipboardView === "arrangement" || clipboardView === "mixer") selectAllArrangementItems();
          else if (clipboardView === "sequencer") selectAllStepCells();
          else selectAllPianoNotes();
        } else if ((matchesConfiguredShortcut(event, "copy") || matchesLegacyShiftShortcut(event, "copy") ||
          matchesConfiguredShortcut(event, "copy-editor") ||
          matchesLegacyShiftShortcut(event, "copy-editor")) &&
          ["arrangement", "sequencer", "piano-roll", "mixer"].includes(clipboardView)) {
          event.preventDefault();
          copyEditorSelection({ trackOnly: event.shiftKey && ["arrangement", "mixer"].includes(clipboardView) });
        } else if ((matchesConfiguredShortcut(event, "paste") || matchesLegacyShiftShortcut(event, "paste") ||
          matchesConfiguredShortcut(event, "paste-editor") ||
          matchesLegacyShiftShortcut(event, "paste-editor")) &&
          ["arrangement", "sequencer", "piano-roll", "mixer"].includes(clipboardView)) {
          event.preventDefault();
          pasteEditorClipboard({ newTrack: event.shiftKey && ["arrangement", "mixer"].includes(clipboardView) });
        } else if ((matchesConfiguredShortcut(event, "cut") || matchesLegacyShiftShortcut(event, "cut") ||
          matchesConfiguredShortcut(event, "cut-editor") ||
          matchesLegacyShiftShortcut(event, "cut-editor")) &&
          ["arrangement", "piano-roll", "mixer"].includes(clipboardView)) {
          event.preventDefault();
          copyEditorSelection();
          if (clipboardView === "piano-roll") deleteSelectedPianoNote();
          else deleteSelectedArrangementItems();
        }
      }
      if (!isTyping && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !dialogOpen) {
        if (recordStepKeyboardHit(event) || recordPianoKeyboardNote(event)) return;
      }
      if (!isTyping && !dialogOpen && !event.ctrlKey && !event.metaKey && !event.altKey &&
        state.view === "piano-roll" && (state.selectedPianoNoteIds.size || state.selectedPianoNoteId)) {
        const key = event.key;
        if (key === "ArrowLeft" || key === "ArrowRight") {
          event.preventDefault();
          nudgeSelectedPianoNotes(key === "ArrowRight" ? 1 : -1, 0, event.shiftKey);
        } else if (event.shiftKey && (key === "ArrowUp" || key === "ArrowDown")) {
          event.preventDefault();
          nudgeSelectedPianoNotes(0, key === "ArrowUp" ? 1 : -1);
        }
      }
      if (!isTyping && !dialogOpen && (event.ctrlKey || event.metaKey) && !event.altKey &&
        state.view === "piano-roll" && (event.key === "ArrowUp" || event.key === "ArrowDown") &&
        (state.selectedPianoNoteIds.size || state.selectedPianoNoteId)) {
        event.preventDefault();
        nudgeSelectedPianoNotes(0, event.key === "ArrowUp" ? 12 : -12);
      }
      const hasArrangementSelection = state.selectedArrangementItems.size > 0;
      if (!isTyping && !dialogOpen && !event.ctrlKey && !event.metaKey && !event.altKey &&
        state.view === "arrangement" && event.key === "ArrowLeft" && !hasArrangementSelection) {
        event.preventDefault();
        if (!event.repeat) setArrangementCursor(0);
      }
      if (!isTyping && !dialogOpen && !event.ctrlKey && !event.metaKey && !event.altKey &&
        ["arrangement", "mixer"].includes(state.view) && hasArrangementSelection &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        nudgeSelectedArrangementItems(event.key === "ArrowRight" ? 1 : -1);
      }
      if (!isTyping && !dialogOpen && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey &&
        state.view === "mixer" && !state.selectedArrangementItems.size &&
        event.key === "ArrowLeft") {
        event.preventDefault();
        setArrangementCursor(0);
      }
      if (matchesConfiguredShortcut(event, "play") && !isTextEntry) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
        const fullscreenElement = document.fullscreenElement;
        const workspaceExpanded = fullscreenElement
          ? fullscreenElement === $("#workspace-area")
          : state.trackViewHidden;
        if (workspaceExpanded) {
          toggleCurrentWorkspacePlayback();
        } else if (state.isPlaying && state.playbackMode === state.transportMode) {
          stopPlayback(false, true);
        } else {
          if (state.isPlaying) stopPlayback();
          startPlayback(state.transportMode);
        }
      }
      if (!isTyping && !dialogOpen && (event.key === "Delete" || event.key === "Backspace")) {
        if (state.selectedArrangementItems.size) {
          event.preventDefault();
          deleteSelectedArrangementItems();
        } else if (state.selectedPianoNoteIds.size || state.selectedPianoNoteId) {
          event.preventDefault();
          deleteSelectedPianoNote();
        } else if (state.view === "sequencer" && state.selectedStepCells.size) {
          event.preventDefault();
          clearSelectedStepCells();
        }
      }
      if (event.key === "Escape" && $("#help-dialog").open) $("#help-dialog").close();
    });
  }

  async function initialize() {
    initializeSettings();
    initializeUsers();
    state.currentUser = getSessionUser();
    loadEffectPresets();
    loadSoundFavorites();
    state.tracks = makeTracks();
    const initialPattern = makePatternSnapshot(makeId(), "Pattern 1", PATTERN_COLORS[0], true);
    state.patterns = [initialPattern];
    state.selectedPatternId = initialPattern.id;
    initializeProjects();
    let cachedSnapshot = null;
    if (state.currentUser) {
      const project = state.projects.find((item) => item.id === state.projectId);
      let hasLocalSnapshot = false;
      try {
        hasLocalSnapshot = window.localStorage.getItem(getProjectStorageKey(state.projectId)) !== null;
      } catch (error) {
        showToast(`Could not read the local project cache: ${error.message || "browser storage is unavailable"}`);
      }
      if (project?.localSnapshotStorage === "indexedDB" && !hasLocalSnapshot) {
        let cachedSnapshotRestored = false;
        let cacheRestoreError = null;
        try {
          const cached = await readCachedProjectSnapshot(state.projectId);
          if (cached?.revision === (project.localCloudRevision ?? null) &&
            (project.localDirty === true || cached.revision === (project.cloudRevision ?? null))) {
            cachedSnapshot = cached.snapshot;
            cachedSnapshotRestored = true;
          }
        } catch (error) {
          cacheRestoreError = error;
        }
        let cloudRestoreError = null;
        if (!cachedSnapshotRestored && state.currentUser === "guest") {
          const previousProjects = state.projects;
          const previousProjectId = state.projectId;
          const previousProjectName = state.projectName;
          const previousActiveProjectIds = { ...state.activeProjectIds };
          const previousProjectCreationCounts = { ...state.projectCreationCounts };
          const guestProject = {
            id: makeId(),
            name: `New Proj ${getNextProjectNumber("guest")}`,
            ownerId: "guest",
            updatedAt: Date.now(),
          };
          state.projects = [guestProject, ...state.projects];
          state.projectId = guestProject.id;
          state.projectName = guestProject.name;
          state.activeProjectIds = { ...state.activeProjectIds, guest: guestProject.id };
          try {
            writeProjectCatalog();
            cachedSnapshotRestored = true;
            showToast(`Opened a new Guest project because "${project.name}" has no local snapshot. The existing project entry was preserved.`);
          } catch (error) {
            state.projects = previousProjects;
            state.projectId = previousProjectId;
            state.projectName = previousProjectName;
            state.activeProjectIds = previousActiveProjectIds;
            state.projectCreationCounts = previousProjectCreationCounts;
            cloudRestoreError = error;
          }
        }
        if (!cachedSnapshotRestored) {
          if (project.cloudBacked && getCloudToken()) {
            const unsyncedWarning = project.localDirty
              ? " The missing local copy may have unsynced edits, which cannot be restored."
              : "";
            const shouldRestoreCloudCopy = window.confirm(
              `The local snapshot for "${project.name}" is missing. Restore the latest cloud-saved copy?${unsyncedWarning}`,
            );
            if (shouldRestoreCloudCopy) {
              try {
                cachedSnapshot = await downloadProjectToBrowser(project);
                cachedSnapshotRestored = true;
              } catch (error) {
                cloudRestoreError = error;
              }
            } else {
              cloudRestoreError = new Error("Cloud recovery was cancelled.");
            }
          }
        }
        if (!cachedSnapshotRestored) {
          let sessionClearError = null;
          try {
            window.sessionStorage.removeItem(ACTIVE_USER_KEY);
          } catch (error) {
            sessionClearError = error.message || "session storage is unavailable";
          }
          const recoveryDetail = cloudRestoreError?.message ||
            (!project.cloudBacked
              ? "This project has no cloud backup."
              : !getCloudToken()
                ? "Sign in to restore the cloud copy."
                : cacheRestoreError?.message || "No cloud-saved copy is available.");
          $("#login-error").textContent =
            `Could not open "${project.name}": ${recoveryDetail} Choose another profile or sign in to a cloud account.` +
            (sessionClearError ? ` ${sessionClearError}` : "");
          state.currentUser = null;
        }
      }
      if (state.currentUser) restoreState(cachedSnapshot);
    }
    ensurePatternHasBlankRackTrack();
    restoreDjState(cachedSnapshot);
    restoreDansBpmSynthPatch();
    ensureMels();
    bindEvents();
    tempoValue.textContent = String(state.bpm);
    swingSlider.value = String(state.swing);
    $("#swing-value").textContent = `${state.swing}%`;
    swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
    renderHeader();
    renderPresets();
    setLength(state.steps);
    renderTracks();
    renderArrangement();
    renderMelOptions();
    state.arrangementCursor = Math.min(state.arrangementCursor, state.arrangementBars - 0.001);
    setWorkspaceView(state.view, true);
    if (state.view === "arrangement") openTrackAssetLibrary();
    seedUndoHistory();
    $("#login-screen").hidden = Boolean(state.currentUser);
    $("#active-user-label").textContent = getCurrentUserName();
  }

  initialize().then(() => {
    updateStorageIndicator();
    window.addEventListener("focus", updateStorageIndicator);
    if (state.currentUser) {
      restoreArrangement().then(() => {
        if (!undoStacks.get("track-view")?.length) {
          undoLatest.set("track-view", createUndoSnapshot("track-view"));
        }
        renderDjView();
        resumeCollaborationSession();
      });
      try {
        if (window.sessionStorage.getItem(OPEN_PROJECTS_KEY) === "true") {
          window.sessionStorage.removeItem(OPEN_PROJECTS_KEY);
          renderProjectList();
          $("#project-dialog").showModal();
        }
      } catch (error) {
        showToast(`Could not open the project list: ${error.message || "session storage is unavailable"}`);
      }
      if (getCloudToken()) {
        startCloudProjectUpdates();
      }
    }
  }).catch((error) => {
    console.error("App initialization failed:", error);
    showToast(`Could not initialize the project: ${error.message || "browser storage is unavailable"}`);
  });
