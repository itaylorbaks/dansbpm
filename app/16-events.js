  function bindEvents() {
    document.addEventListener("pointermove", paintStepAtPointer);
    document.addEventListener("pointermove", updateStepSelectionDrag);
    document.addEventListener("pointerup", finishStepPaint);
    document.addEventListener("pointerup", finishStepSelectionDrag);
    document.addEventListener("pointercancel", finishStepPaint);
    document.addEventListener("pointercancel", finishStepSelectionDrag);
    playButton.addEventListener("click", () => {
      if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
      if (state.isStartingPlayback || state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      else {
        if (state.isPlaying) stopPlayback();
        startPlayback("arrangement");
      }
    });
    Object.entries(WORKSPACE_PLAY_BUTTONS).forEach(([workspace, buttonId]) => {
      $(`#${buttonId}`).addEventListener("click", () => toggleWorkspacePlayback(workspace));
    });
    $("#stop-button").addEventListener("click", stopPlayback);
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
    $("#tempo-control").addEventListener("click", () => {
      const entry = window.prompt("Set tempo (60–180 BPM)", String(state.bpm));
      if (entry === null || !entry.trim()) return;
      const value = Number(entry);
      if (!Number.isFinite(value) || value < 60 || value > 180) {
        showToast("Tempo must be between 60 and 180 BPM.");
        return;
      }
      const resumeBar = state.arrangementCursor;
      if (state.isPlaying && isSongWorkspace()) stopPlayback();
      state.bpm = roundBpm(value);
      tempoValue.textContent = String(state.bpm);
      updateArrangementLength();
      if (isSongWorkspace()) renderArrangement();
      if (resumeBar > 0) setArrangementCursor(resumeBar);
      saveState();
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
    $("#decrease-pattern-bars").addEventListener("click", () => setLength(state.steps - 16));
    $("#increase-pattern-bars").addEventListener("click", () => setLength(state.steps + 16));
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
    $("#help-button").addEventListener("click", () => $("#help-dialog").showModal());
    $("#sequencer-tab").addEventListener("click", () => setWorkspaceView("sequencer"));
    $("#arrangement-tab").addEventListener("click", () => setWorkspaceView("arrangement"));
    $("#piano-roll-tab").addEventListener("click", () => setWorkspaceView("piano-roll"));
    $("#step-piano-return").addEventListener("click", () => {
      closeStepInstrumentPianoRoll();
      setWorkspaceView("sequencer");
    });
    $("#mixer-tab").addEventListener("click", () => setWorkspaceView("mixer"));
    $("#dj-tab").addEventListener("click", () => setWorkspaceView("dj"));
    bindDjEvents();
    $("#add-effects-track").addEventListener("click", createEffectTrack);
    $("#hide-workspace-button").addEventListener("click", () => setViewVisibility(true, false));
    $("#show-workspace-button").addEventListener("click", () => setViewVisibility(false, false, "hide-workspace-button"));
    $("#hide-track-view-button").addEventListener("click", () => setViewVisibility(false, true));
    $("#show-track-view-button").addEventListener("click", () => setViewVisibility(false, false, "hide-track-view-button"));
    $("#workspace-fullscreen-button").addEventListener("click", toggleWorkspaceFullscreen);
    $("#track-view-fullscreen-button").addEventListener("click", toggleTrackViewFullscreen);
    const viewResizer = $("#view-resizer");
    viewResizer.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const main = $("#arrangement-main");
      const updateRatio = (moveEvent) => {
        const bounds = main.getBoundingClientRect();
        const available = bounds.height - viewResizer.offsetHeight;
        if (available <= 0) return;
        const pointerOffset = moveEvent.clientY - bounds.top - viewResizer.offsetHeight / 2;
        state.workspaceRatio = Math.max(20, Math.min(80, Math.round(pointerOffset / available * 100)));
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
      if (event.key === "ArrowUp") setWorkspaceRatio(state.workspaceRatio + 5);
      else if (event.key === "ArrowDown") setWorkspaceRatio(state.workspaceRatio - 5);
      else if (event.key === "Home") setWorkspaceRatio(20);
      else if (event.key === "End") setWorkspaceRatio(80);
      else return;
      event.preventDefault();
    });
    $("#open-beat-grid-button").addEventListener("click", () => setWorkspaceView(state.view === "sequencer" && !state.workspaceHidden ? "arrangement" : "sequencer"));
    $("#open-piano-roll-button").addEventListener("click", () => setWorkspaceView(state.view === "piano-roll" && !state.workspaceHidden ? "arrangement" : "piano-roll"));
    $("#step-keyboard-record-button").addEventListener("click", () => toggleKeyboardRecording("sequencer"));
    $("#piano-keyboard-record-button").addEventListener("click", () => toggleKeyboardRecording("piano-roll"));
    $("#mel-select").addEventListener("change", (event) => selectMel(event.target.value));
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
      saveState();
    });
    $("#piano-scale-slider").addEventListener("input", (event) => {
      state.pianoScale = Number(event.target.value) / 100;
      renderPianoRoll();
    });
    $("#piano-scale-slider").addEventListener("change", saveState);
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
    });
    $("#piano-roll-view").addEventListener("scroll", updatePianoRulerViewport);
    window.addEventListener("scroll", updatePianoRulerViewport, true);
    window.addEventListener("resize", updatePianoRulerViewport);
    $("#clear-piano-roll-button").addEventListener("click", () => {
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
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#arrangement-track-context-menu").hidden) {
        closeArrangementTrackContextMenu();
      }
    }, true);
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
    $("#sequencer-pattern-select").addEventListener("change", (event) => selectPattern(event.target.value));
    $("#rename-pattern-sequencer-button").addEventListener("click", renamePattern);
    $("#new-pattern-sequencer-button").addEventListener("click", () => createPattern());
    $("#grid-resolution-select").addEventListener("change", (event) => {
      setPatternGridResolution(event.target.value);
    });
    $("#sequencer-scale-slider").addEventListener("input", (event) => {
      state.sequencerScale = Number(event.target.value) / 100;
      $("#sequencer-scale-value").textContent = `${event.target.value}%`;
      setSequencerGridDimensions(getGridStepCount(), getStepsPerBar());
      renderStepPianoPreviews();
    });
    $("#sequencer-scale-slider").addEventListener("change", saveState);
    $("#assets-button").addEventListener("click", () => openAssetLibrary());
    $("#sequencer-browser-button").addEventListener("click", () => openAssetLibrary());
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
        const firstResult = $("#sound-library-search-results").querySelector(".sound-library-search-result");
        if (firstResult instanceof HTMLButtonElement) navigateToSoundSearchResult(firstResult);
        else {
          renderSoundSearchSuggestions("");
          renderStepInstrumentLibrary(soundSearchInput.value.trim());
        }
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
    $("#sound-duration-slider").addEventListener("input", (event) => {
      setSoundDurationFromMenu(Number(event.currentTarget.value));
    });
    $("#sound-reverse-toggle").addEventListener("change", (event) => {
      setSoundReverseFromMenu(event.currentTarget.checked);
    });
    $("#sound-duration-play").addEventListener("click", () => {
      const track = state.tracks.find((item) => item.id === $("#sound-duration-menu").dataset.trackId);
      if (!track) {
        showToast("This sound is no longer available.");
        return;
      }
      previewInstrumentSound(track);
    });
    $("#sound-duration-reset").addEventListener("click", () => {
      $("#sound-duration-slider").value = "100";
      setSoundDurationFromMenu(100);
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
    $("#step-track-mix-dialog").addEventListener("click", (event) => {
      if (event.target === $("#step-track-mix-dialog")) $("#step-track-mix-dialog").close();
    });
    $("#mixer-effect-close").addEventListener("click", () => $("#mixer-effect-dialog").close());
    $("#mixer-effect-dialog").addEventListener("close", () => {
      if ($("#mixer-effect-dialog").open) return;
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
    $("#source-browser-button").addEventListener("click", () => openAssetLibrary());
    $("#source-browser-close").addEventListener("click", () => $("#source-browser-dialog").close());
    $("#source-browser-dialog").addEventListener("close", () => {
      closeSoundDurationMenu();
      restoreAssetLibraryDialogPosition();
    });
    $("#empty-import-button").addEventListener("click", () => requestRecordingImport());
    $("#side-add-recording").addEventListener("click", () => requestRecordingImport());
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
    $("#arrangement-slice-button").addEventListener("click", () => setArrangementSliceMode(!arrangementSliceMode));
    $("#record-audio-button").addEventListener("click", toggleAudioRecording);
    $("#project-name").addEventListener("click", () => {
      renderProjectList();
      $("#project-dialog").showModal();
    });
    $("#project-dialog-close").addEventListener("click", () => $("#project-dialog").close());
    $("#save-project-button").addEventListener("click", saveProjectNow);
    $("#enter-project-button").addEventListener("click", enterSelectedProject);
    $("#delete-project-button").addEventListener("click", () => { void deleteSelectedProject(); });
    $("#top-save-project-button").addEventListener("click", saveProjectNow);
    $("#rename-project-button").addEventListener("click", renameProject);
    $("#new-project-button").addEventListener("click", createProject);
    $("#import-project-button").addEventListener("click", () => $("#project-import-input").click());
    $("#project-import-input").addEventListener("change", async (event) => {
      const input = event.currentTarget;
      try {
        await importProjectFile(input.files?.[0]);
      } finally {
        input.value = "";
      }
    });
    $("#switch-user-button").addEventListener("click", switchUser);
    $("#collaborate-button").addEventListener("click", () => {
      $("#project-dialog").close();
      try {
        $("#collaboration-server-url").value =
          window.localStorage.getItem(COLLABORATION_URL_KEY) || DEFAULT_COLLABORATION_SERVER_URL;
      } catch {
        $("#collaboration-server-url").value = DEFAULT_COLLABORATION_SERVER_URL;
      }
      renderCollaborationStatus(collaboration.session
        ? `Connected to room ${collaboration.session.roomCode}.`
        : "Not connected");
      $("#collaboration-dialog").showModal();
    });
    $("#collaboration-dialog-close").addEventListener("click", () => $("#collaboration-dialog").close());
    $("#collaboration-create-room").addEventListener("click", () => startCollaborationRoom("create"));
    $("#collaboration-join-room").addEventListener("click", () => startCollaborationRoom("join"));
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
    $("#collaboration-leave-room").addEventListener("click", leaveCollaborationRoom);
    $("#login-options").addEventListener("click", (event) => {
      const option = event.target instanceof Element ? event.target.closest("[data-user-id]") : null;
      if (option instanceof HTMLButtonElement) selectUser(option.dataset.userId);
    });
    $("#create-profile-form").addEventListener("submit", (event) => {
      event.preventDefault();
      createUser();
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
      state.effectTracks = [];
      state.tracks = makeTracks();
      state.steps = 16;
      state.patterns = [makePatternSnapshot(makeId(), "Pattern 1", PATTERN_COLORS[0])];
      state.selectedPatternId = state.patterns[0].id;
      renderPatternSelectors();
      state.patternClips = [];
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
      state.workspaceHidden = false;
      state.trackViewHidden = false;
      state.bpm = 124;
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
      const dialogOpen = $("#help-dialog").open || $("#project-dialog").open || $("#source-browser-dialog").open ||
        $("#step-instrument-dialog").open || $("#step-track-mix-dialog").open;
      if (!isTextEntry && !dialogOpen && (event.ctrlKey || event.metaKey) && !event.altKey &&
        !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (!event.repeat) undoCurrentView();
        return;
      }
      const djControlFocused = state.view === "dj" && djViewExpanded &&
        target instanceof Element && target.closest("input, select, textarea, [contenteditable='true']");
      const pianoRollSelectAll = state.view === "piano-roll" && !isTextEntry && event.key.toLowerCase() === "a";
      if (state.view === "dj" && djViewExpanded && event.code === "Space" &&
        (dialogOpen || (djControlFocused && !(event.ctrlKey || event.altKey || event.metaKey)))) return;
      if (event.code === "Space" && (event.ctrlKey || event.metaKey) && !event.altKey && !isTextEntry) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
        toggleCurrentWorkspacePlayback();
        return;
      }
      if (!isTyping && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !dialogOpen) {
        const key = event.key.toLowerCase();
        if (key === "p" && ["sequencer", "piano-roll"].includes(state.view) && !state.keyboardRecording) {
          event.preventDefault();
          placeCurrentEditorAtPlayhead();
        } else if (key === "s" && ["arrangement", "mixer"].includes(state.view)) {
          event.preventDefault();
          splitArrangementItemsAtCursor();
        }
      }
      if ((!isTyping || pianoRollSelectAll) && !dialogOpen && !event.repeat && (event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === "a" && ["arrangement", "sequencer", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          if (state.view === "arrangement" || state.view === "mixer") selectAllArrangementItems();
          else if (state.view === "sequencer") selectAllStepCells();
          else selectAllPianoNotes();
        } else if (key === "c" && ["arrangement", "sequencer", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          copyEditorSelection();
        } else if (key === "v" && ["arrangement", "sequencer", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          pasteEditorClipboard();
        } else if (key === "x" && ["arrangement", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          copyEditorSelection();
          if (state.view === "piano-roll") deleteSelectedPianoNote();
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
        } else if (key === "ArrowUp" || key === "ArrowDown") {
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
      if (event.code === "Space" && !isTextEntry && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
        if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
        else {
          if (state.isPlaying) stopPlayback();
          startPlayback("arrangement");
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

  function initialize() {
    initializeSettings();
    initializeUsers();
    state.currentUser = getSessionUser();
    loadEffectPresets();
    state.tracks = makeTracks();
    const initialPattern = makePatternSnapshot(makeId(), "Pattern 1");
    state.patterns = [initialPattern];
    state.selectedPatternId = initialPattern.id;
    initializeProjects();
    if (state.currentUser) restoreState();
    restoreDjState();
    restoreDansBpmSynthPatch();
    ensureMels();
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
    bindEvents();
    seedUndoHistory();
    $("#login-screen").hidden = Boolean(state.currentUser);
    $("#active-user-label").textContent = getCurrentUserName();
  }

  initialize();
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
  }
