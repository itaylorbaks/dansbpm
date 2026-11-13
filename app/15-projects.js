  function normalizePianoAudioSlice(slice) {
    if (!slice || typeof slice.clipId !== "string" || !slice.clipId ||
      !Number.isFinite(slice.offsetSeconds) ||
      !Number.isFinite(slice.durationSeconds) || slice.durationSeconds <= 0) return null;
    return {
      clipId: slice.clipId.slice(0, 128),
      offsetSeconds: Math.max(0, slice.offsetSeconds),
      durationSeconds: Math.max(0.001, slice.durationSeconds),
      dropOff: Number.isFinite(slice.dropOff) ? Math.max(0, Math.min(90, slice.dropOff)) : 10,
      sliceNumber: Number.isInteger(slice.sliceNumber) ? Math.max(1, Math.min(4096, slice.sliceNumber)) : 1,
      rootMidi: Number.isInteger(slice.rootMidi)
        ? Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, slice.rootMidi)) : 60,
      pitchEdited: slice.pitchEdited === true,
      pitchEditable: slice.pitchEditable === true,
    };
  }

  async function renameProject() {
    const project = state.projects.find((item) =>
      item.id === selectedProjectId && item.ownerId === state.currentUser);
    if (!project) return;
    const name = window.prompt("Rename project", project.name);
    const trimmed = name?.trim();
    if (!trimmed) return;
    const previousName = project.name;
    project.name = trimmed;
    const isCurrentProject = project.id === state.projectId;
    if (isCurrentProject) {
      state.projectName = trimmed;
      updateProjectNameLabel();
    }
    try {
      writeProjectCatalog();
      if (project.cloudBacked) {
        Object.assign(project, await renameCloudProject(project));
        writeProjectCatalog();
      }
      renderProjectList();
    } catch (error) {
      project.name = previousName;
      if (isCurrentProject) {
        state.projectName = previousName;
        updateProjectNameLabel();
      }
      try {
        writeProjectCatalog();
      } catch {
        showToast("The project name could not be restored in this browser.");
      }
      showToast(`Could not rename project: ${error.message || "storage is unavailable"}`);
    }
  }

  async function saveProjectNow() {
    const locallySaved = flushSaveState();
    const cloudToken = getCloudToken();
    const browserStorageFull = !locallySaved && saveState.lastError === "browser storage is full.";
    if (!locallySaved && !(cloudToken && browserStorageFull)) {
      showToast(`Could not save this project: ${saveState.lastError || "storage is unavailable."}`);
      return false;
    }
    const project = state.projects.find((item) => item.id === state.projectId);
    if (!project || !cloudToken) {
      renderProjectList();
      showToast(`${state.projectName} saved`);
      return locallySaved;
    }
    try {
      if (!project.cloudBacked) {
        Object.assign(project, await createCloudProjectRecord(project), { cloudBacked: true });
      }
      const remote = await uploadCloudProject(project.id, await createCloudProjectFile());
      Object.assign(project, remote, {
        cloudBacked: true,
        cloudHasFile: true,
        cloudRevision: remote.revision,
        localCloudRevision: locallySaved ? remote.revision : null,
        localDirty: false,
      });
      let catalogSaved = true;
      try {
        writeProjectCatalog();
      } catch {
        catalogSaved = false;
      }
      renderProjectList();
      $("#save-state").textContent = "Saved to cloud";
      $(".save-dot").style.background = "#7f9d43";
      showToast(!locallySaved
        ? `${state.projectName} saved to the cloud; browser storage is full, so reopen it from the cloud if needed`
        : catalogSaved
          ? `${state.projectName} saved to the cloud`
          : `${state.projectName} saved to the cloud, but the browser project list could not be updated`);
      return true;
    } catch (error) {
      renderProjectList();
      showToast(locallySaved
        ? `${state.projectName} saved in this browser, but cloud save failed: ${error.message || "the server is unavailable"}`
        : `Could not save ${state.projectName} to the cloud: ${error.message || "the server is unavailable"}; browser storage is full`);
      return false;
    }
  }

  function persistImportedProjectAssets(projectId, assets) {
    if (!assets.length) return Promise.resolve();
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      transaction.oncomplete = () => {
        database.close();
        resolve();
        if (projectId === state.projectId) scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Could not save imported project audio."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Project audio import was cancelled."));
      };
      try {
        assets.forEach(({ metadata, blob }) => {
          store.put({
            ...metadata,
            id: metadata.recordType === "drum-sample"
              ? getDrumSampleRecordId(metadata.trackId, projectId)
              : makeId(),
            projectId,
            blob,
          });
        });
      } catch (error) {
        try { transaction.abort(); } catch { database.close(); }
        reject(error);
      }
    }));
  }

  function replaceProjectRecordingAssets(projectId, assets) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Could not update shared project audio."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Shared project audio update was cancelled."));
      };
      const request = store.getAll();
      request.onerror = () => {
        try { transaction.abort(); } catch { database.close(); }
      };
      request.onsuccess = () => {
        try {
          request.result
            .filter((record) => record.projectId === projectId || (!record.projectId && projectId === "default"))
            .forEach((record) => store.delete(record.id));
          assets.forEach(({ metadata, blob }) => {
            store.put({
              ...metadata,
              id: metadata.recordType === "drum-sample"
                ? getDrumSampleRecordId(metadata.trackId, projectId)
                : makeId(),
              projectId,
              blob,
            });
          });
        } catch (error) {
          try { transaction.abort(); } catch { database.close(); }
          reject(error);
        }
      };
    }));
  }

  function parseProjectFileContents(contents) {
    let projectFile;
    let snapshot;
    let assets;
    try {
      projectFile = JSON.parse(contents);
      snapshot = projectFile?.project?.snapshot;
      if (projectFile?.app !== "DansBPM" || projectFile.format !== "dansbpm-project" ||
        projectFile.version !== 1 || typeof projectFile.project?.name !== "string" ||
        !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot) ||
        !Array.isArray(snapshot.tracks) || !Array.isArray(snapshot.patterns) ||
        !Array.isArray(snapshot.patternClips) || !Array.isArray(snapshot.mels) ||
        !Array.isArray(snapshot.melTracks) || !Array.isArray(snapshot.arrangementTracks) ||
        !Array.isArray(projectFile.assets)) {
        throw new Error("This is not a supported DansBPM project file.");
      }
      const trackIds = new Set(snapshot.tracks
        .filter((track) => typeof track?.id === "string")
        .map((track) => track.id));
      assets = projectFile.assets.map((asset) => {
        const metadata = asset?.metadata;
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) ||
          typeof metadata.trackId !== "string" || !metadata.trackId || typeof asset.dataUrl !== "string") {
          throw new Error("The project contains an invalid audio attachment.");
        }
        if (metadata.recordType !== undefined && metadata.recordType !== "drum-sample") {
          throw new Error("The project contains an unsupported audio attachment.");
        }
        if (metadata.recordType === "drum-sample" && !trackIds.has(metadata.trackId)) {
          throw new Error("The project contains a drum sample for a missing track.");
        }
        return { metadata, blob: dataUrlToBlob(asset.dataUrl) };
      });
    } catch (error) {
      throw new Error(error.message || "the file is invalid");
    }
    return { projectFile, snapshot, assets };
  }

  async function downloadProjectToBrowser(project) {
    const { projectFile, revision } = await downloadCloudProject(project.id);
    const { snapshot, assets } = parseProjectFileContents(JSON.stringify(projectFile));
    const storageKey = getProjectStorageKey(project.id);
    const previousSnapshot = window.localStorage.getItem(storageKey);
    try {
      saveCloudProjectSnapshot(project.id, snapshot);
      await replaceProjectRecordingAssets(project.id, assets);
    } catch (error) {
      if (previousSnapshot === null) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, previousSnapshot);
      throw error;
    }
    project.localCloudRevision = revision;
    project.cloudRevision = revision;
    project.cloudHasFile = true;
    project.cloudBacked = true;
    project.localDirty = false;
    try {
      writeProjectCatalog();
    } catch {
      showToast("Project downloaded, but its local project list could not be updated.");
    }
  }

  async function importProjectFile(file) {
    if (!file) return;
    if (!state.currentUser) {
      showToast("Choose a profile before importing a project.");
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before importing a project.");
      return;
    }

    let projectFile;
    let snapshot;
    let assets;
    try {
      ({ projectFile, snapshot, assets } = parseProjectFileContents(await file.text()));
    } catch (error) {
      showToast(`Could not read the project: ${error.message || "the file is invalid"}`);
      return;
    }

    if (!flushSaveState()) {
      showToast("Could not save the current project; import was cancelled.");
      return;
    }
    const previousProjectId = state.projectId;
    const previousProjectName = state.projectName;
    const previousActiveProjectIds = { ...state.activeProjectIds };
    const previousProjectCreationCounts = { ...state.projectCreationCounts };
    const projectId = makeId();
    const projectName = projectFile.project.name.trim().slice(0, 64) || "Imported project";
    const project = { id: projectId, name: projectName, ownerId: state.currentUser, updatedAt: Date.now() };
    let snapshotSaved = false;
    try {
      getNextProjectNumber(state.currentUser);
      window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
      snapshotSaved = true;
      state.projects.unshift(project);
      state.projectId = projectId;
      state.projectName = projectName;
      writeProjectCatalog();
      await persistImportedProjectAssets(projectId, assets);
      showToast(`${projectName} imported`);
      window.location.reload();
    } catch (error) {
      state.projects = state.projects.filter((item) => item.id !== projectId);
      state.projectId = previousProjectId;
      state.projectName = previousProjectName;
      state.activeProjectIds = previousActiveProjectIds;
      state.projectCreationCounts = previousProjectCreationCounts;
      try {
        if (snapshotSaved) window.localStorage.removeItem(getProjectStorageKey(projectId));
        writeProjectCatalog();
      } catch (rollbackError) {
        showToast(`Project import failed and cleanup was incomplete: ${rollbackError.message || "browser storage is unavailable"}`);
        return;
      }
      showToast(`Could not import the project: ${error.message || "browser storage is unavailable"}`);
    }
  }

  function switchUser() {
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before switching users.");
      return;
    }
    if (!flushSaveState()) {
      showToast("Could not save this project; switching users was cancelled.");
      return;
    }
    if (state.isPlaying) stopPlayback();
    stopAllWorkspacePlayers();
    try {
      if (getCloudToken()) endCloudSession();
      window.sessionStorage.removeItem(ACTIVE_USER_KEY);
      window.sessionStorage.removeItem(OPEN_PROJECTS_KEY);
      window.location.reload();
    } catch (error) {
      showToast(`Could not switch users: ${error.message || "session storage is unavailable"}`);
    }
  }

  function restoreState() {
    state.masterPitch = 0;
    state.soundDurationEdits = {};
    state.soundReverseEdits = {};
    state.soundProcessingEdits = {};
    try {
      const saved = JSON.parse(window.localStorage.getItem(getProjectStorageKey(state.projectId)) || "null");
      if (!saved || typeof saved !== "object") return;
      if (saved.masterTrack && typeof saved.masterTrack === "object") {
        state.masterTrack = makeMixerBusTrack("mixer-master", saved.masterTrack);
      }
      if (Array.isArray(saved.effectTracks)) {
        const ids = new Set([MASTER_MIXER_TRACK_ID, ...state.tracks.map((track) => track.id)]);
        state.effectTracks = saved.effectTracks
          .filter((track) => {
            if (typeof track?.id !== "string" || ids.has(track.id)) return false;
            ids.add(track.id);
            return true;
          })
          .map((track) => makeMixerBusTrack("mixer-effects", track));
      }
      if (Number.isFinite(saved.bpm)) state.bpm = Math.max(60, Math.min(180, roundBpm(saved.bpm)));
      state.masterPitch = Number.isFinite(saved.masterPitch)
        ? Math.max(-12, Math.min(12, Math.round(saved.masterPitch)))
        : 0;
      if (Number.isFinite(saved.swing)) state.swing = Math.max(0, Math.min(45, Math.round(saved.swing)));
      if (Number.isFinite(saved.steps)) state.steps = normalizePatternSteps(saved.steps);
      if (Number.isFinite(saved.arrangementScale)) state.arrangementScale = Math.max(0.1, Math.min(4, saved.arrangementScale));
      if (Number.isFinite(saved.pianoScale)) state.pianoScale = Math.max(0.5, Math.min(4, saved.pianoScale));
      if (Number.isFinite(saved.sequencerScale)) state.sequencerScale = Math.max(0.5, Math.min(4, saved.sequencerScale));
      if (Number.isFinite(saved.arrangementBars)) state.arrangementBars = Math.max(32, Math.min(MAX_ARRANGEMENT_BARS, Math.round(saved.arrangementBars)));
      if (Number.isFinite(saved.arrangementCursor)) state.arrangementCursor = Math.max(0, Math.min(state.arrangementBars - 0.001, saved.arrangementCursor));
      if (typeof saved.arrangementLoopEnabled === "boolean") state.arrangementLoopEnabled = saved.arrangementLoopEnabled;
      if (Number.isFinite(saved.arrangementLoopStartBar)) {
        state.arrangementLoopStartBar = Math.max(0, Math.min(state.arrangementBars - 1, saved.arrangementLoopStartBar));
      }
      if (Number.isFinite(saved.arrangementLoopEndBar)) {
        state.arrangementLoopEndBar = Math.max(
          state.arrangementLoopStartBar + 1,
          Math.min(state.arrangementBars, saved.arrangementLoopEndBar),
        );
      }
      if (typeof saved.arrangementSnap === "boolean") state.arrangementSnap = saved.arrangementSnap;
      if (Number.isFinite(saved.workspaceRatio)) state.workspaceRatio = Math.max(20, Math.min(80, Math.round(saved.workspaceRatio)));
      if (typeof saved.workspaceHidden === "boolean") state.workspaceHidden = saved.workspaceHidden;
      if (typeof saved.trackViewHidden === "boolean") state.trackViewHidden = saved.trackViewHidden;
      if (state.workspaceHidden && state.trackViewHidden) state.trackViewHidden = false;
      if (["sequencer", "arrangement", "piano-roll", "mixer", "dj"].includes(saved.view)) state.view = saved.view;
      if (saved.selectedPreset === null) state.selectedPreset = null;
      else if (PRESETS.some((preset) => preset.id === saved.selectedPreset)) state.selectedPreset = saved.selectedPreset;
      if (Array.isArray(saved.tracks)) {
        saved.tracks.forEach((savedTrack) => {
          let track = state.tracks.find((item) => item.id === savedTrack.id);
          if (!track && typeof savedTrack.sourceId === "string") {
            const source = state.tracks.find((item) => item.id === savedTrack.sourceId);
            if (source) {
              track = makePatternInstrumentLayer(source, {
                id: savedTrack.id,
                name: savedTrack.name,
                cells: savedTrack.cells,
                volume: savedTrack.volume,
                muted: savedTrack.muted,
                solo: savedTrack.solo,
                pitch: savedTrack.pitch,
                swing: savedTrack.swing,
                variant: savedTrack.variant,
                effects: savedTrack.effects,
              });
              state.tracks.push(track);
            }
          }
          if (!track && !savedTrack.sourceId && savedTrack.kind === "sample" && typeof savedTrack.id === "string" && typeof savedTrack.name === "string") {
            track = makeDrumSampleTrack({
              id: savedTrack.id,
              name: savedTrack.name,
              color: savedTrack.color,
              volume: savedTrack.volume,
              muted: savedTrack.muted,
              solo: savedTrack.solo,
              pitch: savedTrack.pitch,
              swing: savedTrack.swing,
              cells: savedTrack.cells,
              effects: savedTrack.effects,
              audioMetadata: savedTrack.audioMetadata,
            });
            state.tracks.push(track);
          }
          if (!track) return;
          if (Array.isArray(savedTrack.cells)) {
            track.cells = Array.from({ length: STEP_COUNT }, (_, index) => savedTrack.cells[index] === true);
          }
          if (Number.isFinite(savedTrack.volume)) track.volume = Math.max(0, Math.min(1, savedTrack.volume));
          if (Number.isFinite(savedTrack.pan)) track.pan = Math.max(-1, Math.min(1, savedTrack.pan));
          if (Number.isFinite(savedTrack.pitch)) track.pitch = Math.max(-12, Math.min(12, savedTrack.pitch));
          if (Number.isFinite(savedTrack.swing)) track.swing = Math.max(0, Math.min(45, savedTrack.swing));
          if (savedTrack.audioMetadata) track.audioMetadata = normalizeAudioMetadata(savedTrack.audioMetadata);
          track.effects = makeDefaultEffects(savedTrack.effects);
          track.effectSettings = makeDefaultEffectSettings(savedTrack.effectSettings);
          track.effectChain = Array.isArray(savedTrack.effectChain) ? savedTrack.effectChain : undefined;
          if (SOUND_VARIANTS[track.kind]?.some((sound) => sound.id === savedTrack.variant)) track.variant = savedTrack.variant;
          track.muted = savedTrack.muted === true;
          track.solo = savedTrack.solo === true;
        });
      }
      if (Array.isArray(saved.arrangementTracks)) {
        state.arrangementTracks = saved.arrangementTracks
          .filter((track) => typeof track?.id === "string" && typeof track.name === "string")
          .map((track) => ({
            id: track.id,
            name: track.name,
            insertAfterTrackId: typeof track.insertAfterTrackId === "string" ? track.insertAfterTrackId : null,
            color: isPatternColor(track.color) ? track.color : TRACK_COLORS[0],
            clips: [],
            volume: Number.isFinite(track.volume) ? Math.max(0, Math.min(1, track.volume)) : 0.8,
            pan: Number.isFinite(track.pan) ? Math.max(-1, Math.min(1, track.pan)) : 0,
            automation: normalizeTrackAutomation(track.automation),
            automationOpen: typeof track.automationOpen === "boolean"
              ? track.automationOpen
              : hasTrackAutomation(track.automation),
            muted: track.muted === true,
            solo: track.solo === true,
            gainNode: null,
            effects: makeDefaultEffects(track.effects),
            effectSettings: makeDefaultEffectSettings(track.effectSettings),
            effectChain: Array.isArray(track.effectChain) ? track.effectChain : undefined,
          }));
      }
      if (Array.isArray(saved.patterns)) {
        const restoredPatterns = saved.patterns
          .filter((pattern) => typeof pattern?.id === "string" && typeof pattern.name === "string")
          .map((pattern, index) => {
            const cells = {};
            const variants = {};
            const gridResolution = getPatternGridResolution(pattern);
            const isLegacyGrid = !GRID_RESOLUTIONS.includes(pattern.gridResolution);
            const patternSteps = normalizePatternSteps(pattern.steps);
            const bars = patternSteps / 16;
            state.tracks.forEach((track) => {
              const storedCells = Array.from({ length: STEP_COUNT }, (_, cellIndex) => pattern.cells?.[track.id]?.[cellIndex] === true);
              cells[track.id] = isLegacyGrid
                ? remapGridCells(storedCells, bars, 16, GRID_STEPS_PER_BAR[gridResolution])
                : storedCells;
              const variant = pattern.variants?.[track.id];
              if (SOUND_VARIANTS[track.kind]?.some((sound) => sound.id === variant)) variants[track.id] = variant;
            });
            return {
              id: pattern.id,
              name: pattern.name,
              kind: "pattern",
              insertAfterTrackId: typeof pattern.insertAfterTrackId === "string" ? pattern.insertAfterTrackId : null,
              color: isPatternColor(pattern.color) ? pattern.color : getPatternColor(index),
              steps: patternSteps,
              trackIds: Array.isArray(pattern.trackIds)
                ? [...new Set(pattern.trackIds.filter((trackId) => state.tracks.some((track) => track.id === trackId)))]
                : state.tracks.filter((track) => !track.libraryOnly).map((track) => track.id),
              cells,
              variants,
              ...(pattern.stepPianoNotes && typeof pattern.stepPianoNotes === "object" ? {
                stepPianoNotes: Object.fromEntries(Object.entries(pattern.stepPianoNotes)
                  .filter(([trackId, notes]) => state.tracks.some((track) => track.id === trackId) && Array.isArray(notes))
                  .map(([trackId, notes]) => [trackId, notes
                    .filter((note) => note && typeof note.id === "string" && Number.isFinite(note.startTick) &&
                      Number.isFinite(note.durationTicks) && Number.isInteger(note.midi))
                    .slice(0, 4096)
                    .map((note) => {
                      const startTick = Math.max(0, Math.min(patternSteps * 2 - 0.5, note.startTick));
                      return {
                        id: note.id,
                        startTick,
                        durationTicks: Math.max(0.5, Math.min(patternSteps * 2 - startTick, note.durationTicks)),
                        midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
                        velocity: Number.isFinite(note.velocity) ? Math.max(0.1, Math.min(1, note.velocity)) : 0.8,
                        pan: Number.isFinite(note.pan) ? Math.max(-1, Math.min(1, note.pan)) : 0,
                      };
                    })])),
              } : {}),
              gridResolution,
              volume: Number.isFinite(pattern.volume) ? Math.max(0, Math.min(1, pattern.volume)) : 1,
              pan: Number.isFinite(pattern.pan) ? Math.max(-1, Math.min(1, pattern.pan)) : 0,
              automation: normalizeTrackAutomation(pattern.automation),
              automationOpen: typeof pattern.automationOpen === "boolean"
                ? pattern.automationOpen
                : hasTrackAutomation(pattern.automation),
              muted: pattern.muted === true,
              solo: pattern.solo === true,
              effects: makeDefaultEffects(pattern.effects),
              effectSettings: makeDefaultEffectSettings(pattern.effectSettings),
              effectChain: Array.isArray(pattern.effectChain) ? pattern.effectChain : undefined,
              gainNode: null,
              fxRuntime: null,
              analyser: null,
            };
          });
        state.patterns = restoredPatterns.length
          ? restoredPatterns
          : [makePatternSnapshot(state.patterns[0]?.id || makeId(), state.patterns[0]?.name || "Pattern 1", PATTERN_COLORS[0])];
      } else {
        const initialPattern = state.patterns[0];
        state.patterns = [makePatternSnapshot(initialPattern?.id || makeId(), initialPattern?.name || "Pattern 1", initialPattern?.color || PATTERN_COLORS[0])];
      }
      if (!state.patterns.length) state.patterns = [makePatternSnapshot(makeId(), "Pattern 1", PATTERN_COLORS[0])];
      state.selectedPatternId = state.patterns.some((pattern) => pattern.id === saved.selectedPatternId)
        ? saved.selectedPatternId
        : state.patterns[0].id;
      const activePattern = getPattern();
      if (activePattern) applyPattern(activePattern);
      if (Array.isArray(saved.patternClips)) {
        state.patternClips = saved.patternClips
          .filter((clip) => typeof clip?.id === "string" && Number.isFinite(clip.startBar))
          .map((clip) => {
            const patternId = state.patterns.some((pattern) => pattern.id === clip.patternId) ? clip.patternId : state.selectedPatternId;
            const pattern = getPattern(patternId);
            const requestedRepeats = Number.isInteger(clip.repeatCount) ? Math.max(1, clip.repeatCount) : 1;
            const repeatCount = pattern
              ? Math.min(requestedRepeats, Math.max(1, Math.floor(MAX_ARRANGEMENT_BARS / (pattern.steps / 16))))
              : 1;
            const durationBars = Number.isFinite(clip.durationBars)
              ? Math.max(0.01, Math.min(MAX_ARRANGEMENT_BARS, clip.durationBars))
              : (pattern?.steps || 16) / 16 * repeatCount;
            return {
              id: clip.id,
              patternId,
              trackId: state.patterns.some((item) => item.id === clip.trackId) ? clip.trackId : patternId,
              repeatCount,
              ...(Number.isFinite(clip.durationBars) ? { durationBars } : {}),
              sourceOffsetBars: Number.isFinite(clip.sourceOffsetBars) ? Math.max(0, clip.sourceOffsetBars) : 0,
              startBar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - durationBars, clip.startBar)),
            };
          });
      }
      if (Number.isFinite(saved.pianoBars) && [1, 2, 4, 8].includes(saved.pianoBars)) state.pianoBars = saved.pianoBars;
      if (Number.isFinite(saved.pianoCursorTick)) state.pianoCursorTick = Math.max(0, Math.min(state.pianoBars * PIANO_TICKS_PER_BAR - 0.001, saved.pianoCursorTick));
      if (typeof saved.pianoLoopEnabled === "boolean") state.pianoLoopEnabled = saved.pianoLoopEnabled;
      if (Number.isFinite(saved.pianoLoopStartBar)) {
        state.pianoLoopStartBar = Math.max(0, Math.min(7, saved.pianoLoopStartBar));
      }
      if (Number.isFinite(saved.pianoLoopEndBar)) {
        state.pianoLoopEndBar = Math.max(state.pianoLoopStartBar + 1, Math.min(8, saved.pianoLoopEndBar));
      }
      if (Number.isFinite(saved.pianoStartBar)) state.pianoStartBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 1, Math.floor(saved.pianoStartBar)));
      if (Number.isInteger(saved.pianoSnap) && [1, 2, 4, 8].includes(saved.pianoSnap)) state.pianoSnap = saved.pianoSnap;
      if (typeof saved.pianoSnapEnabled === "boolean") state.pianoSnapEnabled = saved.pianoSnapEnabled;
      state.pianoScaleRoot = Number.isInteger(saved.pianoScaleRoot) && saved.pianoScaleRoot >= 0 && saved.pianoScaleRoot < 12
        ? saved.pianoScaleRoot : 0;
      state.pianoScaleType = ["major", "minor", "major-pentatonic", "minor-pentatonic"].includes(saved.pianoScaleType)
        ? saved.pianoScaleType : "major";
      state.pianoScaleLock = saved.pianoScaleLock === true;
      if (saved.soundDurationEdits && typeof saved.soundDurationEdits === "object" && !Array.isArray(saved.soundDurationEdits)) {
        state.soundDurationEdits = Object.fromEntries(Object.entries(saved.soundDurationEdits)
          .filter(([soundId, scale]) => typeof soundId === "string" && Number.isFinite(scale) && scale >= 0.01 && scale < 1));
      }
      if (saved.soundReverseEdits && typeof saved.soundReverseEdits === "object" && !Array.isArray(saved.soundReverseEdits)) {
        state.soundReverseEdits = Object.fromEntries(Object.entries(saved.soundReverseEdits)
          .filter(([soundId, isReversed]) => typeof soundId === "string" && isReversed === true));
      }
      if (saved.soundProcessingEdits && typeof saved.soundProcessingEdits === "object" &&
        !Array.isArray(saved.soundProcessingEdits)) {
        state.soundProcessingEdits = Object.fromEntries(Object.entries(saved.soundProcessingEdits)
          .filter(([soundId, edits]) => typeof soundId === "string" && edits && typeof edits === "object" &&
            !Array.isArray(edits))
          .map(([soundId, edits]) => [soundId, normalizeSoundProcessingEdits(edits)]));
      }
      if (Number.isInteger(saved.pianoNoteLength) && [1, 2, 4, 8].includes(saved.pianoNoteLength)) state.pianoNoteLength = saved.pianoNoteLength;
      if (typeof saved.selectedPianoTrackId === "string" && state.tracks.some((track) => track.id === saved.selectedPianoTrackId)) {
        state.selectedPianoTrackId = saved.selectedPianoTrackId;
      }
      if (Array.isArray(saved.pianoNotes)) {
        state.pianoNotes = saved.pianoNotes
          .filter((note) => note && typeof note.id === "string" && Number.isFinite(note.startTick) && Number.isFinite(note.durationTicks) &&
            Number.isInteger(note.midi) && state.tracks.some((track) => track.id === note.trackId))
          .slice(0, 4096)
          .map((note) => {
            const startTick = Math.max(0, Math.min(8 * PIANO_TICKS_PER_BAR - 0.5, note.startTick));
            return {
              id: note.id,
              trackId: note.trackId,
              midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
              startTick,
              durationTicks: Math.max(0.5, Math.min(8 * PIANO_TICKS_PER_BAR - startTick, note.durationTicks)),
              velocity: Number.isFinite(note.velocity) ? Math.max(0.1, Math.min(1, note.velocity)) : 0.8,
              detune: Number.isFinite(note.detune) ? Math.max(-100, Math.min(100, note.detune)) : 0,
              pan: Number.isFinite(note.pan) ? Math.max(-1, Math.min(1, note.pan)) : 0,
              audioSlice: normalizePianoAudioSlice(note.audioSlice),
            };
          });
      }
      if (Array.isArray(saved.mels)) {
        state.mels = saved.mels
          .filter((mel) => typeof mel?.id === "string" && typeof mel.name === "string")
          .map((mel) => {
            const instrumentId = state.tracks.some((track) => track.id === mel.instrumentId)
              ? mel.instrumentId
              : state.tracks.find((track) => track.id === "piano-grand")?.id || state.tracks[0]?.id || "";
            const notes = Array.isArray(mel.notes) ? mel.notes
              .filter((note) => note && typeof note.id === "string" && Number.isFinite(note.startTick) &&
                Number.isFinite(note.durationTicks) && Number.isInteger(note.midi))
              .slice(0, 4096)
              .map((note) => {
                const startTick = Math.max(0, Math.min(8 * PIANO_TICKS_PER_BAR - 0.5, note.startTick));
                return {
                  id: note.id,
                  trackId: instrumentId,
                  midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
                  startTick,
                  durationTicks: Math.max(0.5, Math.min(8 * PIANO_TICKS_PER_BAR - startTick, note.durationTicks)),
                  velocity: Number.isFinite(note.velocity) ? Math.max(0.1, Math.min(1, note.velocity)) : 0.8,
                  detune: Number.isFinite(note.detune) ? Math.max(-100, Math.min(100, note.detune)) : 0,
                  pan: Number.isFinite(note.pan) ? Math.max(-1, Math.min(1, note.pan)) : 0,
                  audioSlice: normalizePianoAudioSlice(note.audioSlice),
                };
              })
              : [];
            return {
              id: mel.id,
              name: mel.name.trim() || "Mel",
              instrumentId,
              bars: [1, 2, 4, 8].includes(mel.bars) ? mel.bars : 4,
              notes,
              audioSourceClipId: typeof mel.audioSourceClipId === "string" ? mel.audioSourceClipId : null,
            };
          });
      }
      if (Array.isArray(saved.melTracks)) {
        const fallbackInstrumentId = state.tracks.find((item) => item.id === "piano-grand")?.id || state.tracks[0]?.id || "";
        state.melTracks = saved.melTracks
          .filter((track) => typeof track?.id === "string" && typeof track.name === "string" && Array.isArray(track.clips))
          .map((track) => ({
            id: track.id,
            name: track.name,
            insertAfterTrackId: typeof track.insertAfterTrackId === "string" ? track.insertAfterTrackId : null,
            kind: "mel",
            instrumentId: state.tracks.some((item) => item.id === track.instrumentId) ? track.instrumentId : fallbackInstrumentId,
            color: isPatternColor(track.color) ? track.color : "#b5a0ff",
            volume: Number.isFinite(track.volume) ? Math.max(0, Math.min(1, track.volume)) : 1,
            pan: Number.isFinite(track.pan) ? Math.max(-1, Math.min(1, track.pan)) : 0,
            automation: normalizeTrackAutomation(track.automation),
            automationOpen: typeof track.automationOpen === "boolean"
              ? track.automationOpen
              : hasTrackAutomation(track.automation),
            muted: track.muted === true,
            solo: track.solo === true,
            gainNode: null,
            effects: makeDefaultEffects(track.effects),
            effectSettings: makeDefaultEffectSettings(track.effectSettings),
            effectChain: Array.isArray(track.effectChain) ? track.effectChain : undefined,
            clips: track.clips
              .filter((clip) => typeof clip?.id === "string" && state.mels.some((mel) => mel.id === clip.melId) && Number.isFinite(clip.startBar))
              .map((clip) => {
                const mel = getMel(clip.melId);
                const durationBars = Number.isFinite(clip.durationBars)
                  ? Math.max(0.01, Math.min(MAX_ARRANGEMENT_BARS, clip.durationBars))
                  : mel ? getMelLengthBars(mel) : 1;
                return {
                  id: clip.id,
                  melId: clip.melId,
                  repeatCount: Number.isInteger(clip.repeatCount) ? Math.max(1, clip.repeatCount) : 1,
                  ...(Number.isFinite(clip.durationBars) ? { durationBars } : {}),
                  sourceOffsetBars: Number.isFinite(clip.sourceOffsetBars) ? Math.max(0, clip.sourceOffsetBars) : 0,
                  startBar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - durationBars, clip.startBar)),
                };
              }),
          }));
      }
      const availableMixerTrackIds = new Set(getMixerSourceTracks().map(({ track }) => track.id));
      const reservedTrackIds = new Set([MASTER_MIXER_TRACK_ID, ...availableMixerTrackIds]);
      state.effectTracks = state.effectTracks.filter((track) => {
        if (reservedTrackIds.has(track.id)) return false;
        reservedTrackIds.add(track.id);
        return true;
      });
      const routedMixerTrackIds = new Set();
      state.effectTracks.forEach((track) => {
        track.routedTrackIds = track.routedTrackIds.filter((trackId) => {
          if (!availableMixerTrackIds.has(trackId) || routedMixerTrackIds.has(trackId)) return false;
          routedMixerTrackIds.add(trackId);
          return true;
        });
      });
      if (typeof saved.selectedMelId === "string") state.selectedMelId = saved.selectedMelId;
    } catch {
      try { window.localStorage.removeItem(getProjectStorageKey(state.projectId)); } catch { /* Storage may be disabled. */ }
    }
  }

  function exportPattern() {
    const activePattern = getPattern();
    const pattern = {
      app: "DansBPM",
      version: 1,
      exportedAt: new Date().toISOString(),
      tempo: state.bpm,
      swing: state.swing,
      bars: state.steps / 16,
      steps: getGridStepCount(activePattern),
      gridResolution: getPatternGridResolution(activePattern),
      pattern: activePattern?.name || "Pattern",
      tracks: state.tracks.filter((track) => getPatternTrackIds(activePattern).includes(track.id)).map((track) => ({
        name: track.name,
        sample: track.sample?.name || null,
        sound: track.variant || null,
        steps: track.cells.slice(0, getGridStepCount(activePattern)).map((active) => active ? 1 : 0),
      })),
    };
    const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dansbpm-pattern.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Pattern exported as JSON");
  }

  function exportMel() {
    captureCurrentMel();
    const mel = getMel();
    if (!mel) {
      showToast("Choose a Mel before exporting.");
      return;
    }
    const instrument = state.tracks.find((track) => track.id === mel.instrumentId);
    const exportedMel = {
      app: "DansBPM",
      format: "dansbpm-mel",
      version: 1,
      exportedAt: new Date().toISOString(),
      tempo: state.bpm,
      swing: state.swing,
      mel: {
        name: mel.name,
        bars: getMelLengthBars(mel),
        instrumentId: mel.instrumentId,
        instrumentName: instrument?.name || "Instrument",
        notes: mel.notes.map((note) => ({ ...note })),
      },
    };
    downloadBlob(new Blob([JSON.stringify(exportedMel, null, 2)], { type: "application/json" }),
      `${sanitizeFilename(mel.name)}.mel.json`);
    showToast("Mel exported as JSON");
  }

  function openSongExportMenu() {
    if (!$("#export-song-dialog").open) $("#export-song-dialog").showModal();
  }

  async function exportArrangementAudio(format = "wav") {
    if (state.isExporting) return;
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before exporting the song.");
      return;
    }
    const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineAudioContext) {
      showToast(`${format.toUpperCase()} export is not supported in this browser.`);
      return;
    }
    if (state.isPlaying) stopPlayback();
    const sampleRate = 44100;
    const secondsPerBar = 240 / state.bpm;
    const duration = state.arrangementBars * secondsPerBar;
    if (duration > 600) {
      showToast("Song export is limited to 10 minutes. Shorten the arrangement or raise the tempo.");
      return;
    }
    if (format === "mp3" && !window.lamejs?.Mp3Encoder) {
      showToast("MP3 export is unavailable because its encoder did not load.");
      return;
    }

    const button = $(`#export-song-${format}-button`);
    state.isExporting = true;
    button.disabled = true;
    document.body.classList.add("is-exporting");
    $("#export-song-dialog").close();
    showToast(`Preparing samples for ${format.toUpperCase()} export…`);
    try {
      await ensureAudio();
      await loadLibrarySamplesForPlayback("arrangement");
    } catch (error) {
      state.isExporting = false;
      button.disabled = false;
      document.body.classList.remove("is-exporting");
      showToast(`Could not prepare audio for export: ${error.message || "a sample could not be loaded"}`);
      return;
    }

    const previousContext = state.audioContext;
    const previousMaster = state.masterGain;
    const previousMasterLimiter = state.masterLimiter;
    const previousMasterPitchNode = state.masterPitchNode;
    const previousMasterPitchSupported = state.masterPitchSupported;
    const previousNoise = state.noiseBuffer;
    const allTracks = [
      ...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
      ...state.effectTracks, state.masterTrack,
    ];
    const previousGains = allTracks.map((track) => track.gainNode);
    const previousAutomationGains = allTracks.map((track) => track.automationGainNode);
    const previousPanners = allTracks.map((track) => track.panNode);
    const previousFxRuntimes = allTracks.map((track) => track.fxRuntime);
    const previousAnalysers = allTracks.map((track) => track.analyser);
    const previousSourceGains = allTracks.map((track) => track.sourceGains);
    const previousSidechainInputs = allTracks.map((track) => track.sidechainInputNode);
    const previousSidechainSources = allTracks.map((track) => track.sidechainSourceNode);
    showToast(`Rendering your song to ${format.toUpperCase()}…`);
    try {
      const context = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
      state.audioContext = context;
      state.masterGain = context.createGain();
      state.masterGain.gain.value = 0.88;
      state.masterLimiter = createMasterLimiter(context);
      await connectMasterPitchProcessor(context);
      state.noiseBuffer = createNoiseBuffer(context);
      const hasSolo = [...state.tracks, ...state.arrangementTracks].some((track) => track.solo);
      const hasArrangementSolo = [...state.patterns, ...state.melTracks, ...state.arrangementTracks]
        .some((track) => track.solo);
      allTracks.forEach((track) => {
        ensureTrackMixerState(track);
        track.gainNode = context.createGain();
        track.automationGainNode = context.createGain();
        track.automationGainNode.gain.value = 1;
        track.panNode = context.createStereoPanner();
        track.panNode.pan.value = track.pan;
        const isBus = track.kind === "mixer-master" || track.kind === "mixer-effects";
        const isArrangementTrack = track.kind === "pattern" || track.kind === "mel" ||
          state.arrangementTracks.includes(track);
        const isSilent = track.muted ||
          (isArrangementTrack && hasArrangementSolo && !track.solo) ||
          (!isBus && !isArrangementTrack && hasSolo && !track.solo) ||
          (state.arrangementTracks.includes(track) && hasSolo && !track.solo);
        track.gainNode.gain.value = isSilent ? 0 : track.volume;
        track.fxRuntime = null;
        track.analyser = null;
        track.sourceGains = null;
        track.effects = makeDefaultEffects(track.effects);
      });
      allTracks.forEach((track) => {
        rebuildTrackEffectChain(track);
      });

      state.arrangementTracks.forEach((track) => {
        track.clips.forEach((clip) => {
          getAudioClipSegments(clip, clip.startBar, duration / secondsPerBar).forEach((segment) => {
            const startTime = segment.startBar * secondsPerBar;
            createAudioClipPlaybackSource(context, track, clip, segment, startTime, secondsPerBar);
          });
        });
      });

      state.patternClips.forEach((clip) => {
        const pattern = getPattern(clip.patternId);
        if (!pattern) return;
        const patternTrackIds = new Set(getPatternTrackIds(pattern));
        const patternSources = allTracks.filter((track) => patternTrackIds.has(track.id) && track.kind !== "pattern");
        const patternTrack = state.patterns.find((item) => item.id === (clip.trackId || clip.patternId)) || pattern;
        const stepsPerBar = getStepsPerBar(pattern);
        const ticksPerGridStep = getGridTicksPerStep(pattern);
        const gridStepCount = getGridStepCount(pattern);
        const sourceOffset = clip.sourceOffsetBars || 0;
        const sourceBars = pattern.steps / 16 * (clip.repeatCount || 1);
        const clipDuration = getArrangementClipDuration("pattern", clip);
        const firstStep = Math.max(0, Math.ceil(sourceOffset * stepsPerBar - 0.0001));
        const lastStep = Math.min(sourceBars * stepsPerBar, Math.ceil((sourceOffset + clipDuration) * stepsPerBar - 0.0001));
        for (let sourceStep = firstStep; sourceStep < lastStep; sourceStep += 1) {
          const sourcePosition = sourceStep / stepsPerBar;
          const relativePosition = sourcePosition - sourceOffset;
          const patternStep = sourceStep % gridStepCount;
          const tick = patternStep * ticksPerGridStep;
          const time = (clip.startBar + relativePosition) * secondsPerBar +
            (Math.floor(tick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
          if (time >= duration) continue;
          patternSources.forEach((track) => {
            if (pattern.cells[track.id]?.[patternStep] && !Array.isArray(pattern.stepPianoNotes?.[track.id]) &&
              !track.muted && (!hasSolo || track.solo)) {
              const trackTime = getTrackStepTime(track, patternStep, pattern, time);
              triggerTrack(track, trackTime, pattern.variants[track.id] || track.variant,
                getNoteDuration(pattern), patternTrack, getPatternSourceGain(patternTrack, track));
            }
          });
        }
        patternSources.forEach((track) => {
          const notes = pattern.stepPianoNotes?.[track.id];
          if (!Array.isArray(notes) || track.muted || (hasSolo && !track.solo)) return;
          const patternBars = pattern.steps / 16;
          const loopCount = Math.ceil(sourceBars / patternBars);
          for (let loop = 0; loop < loopCount; loop += 1) {
            notes.forEach((note) => {
              const sourcePosition = loop * patternBars + note.startTick / PIANO_TICKS_PER_BAR;
              if (sourcePosition < sourceOffset || sourcePosition >= sourceOffset + clipDuration) return;
              const startTime = (clip.startBar + sourcePosition - sourceOffset) * secondsPerBar +
                (Math.floor(note.startTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
              if (startTime >= duration) return;
              const clipEndDuration = (sourceOffset + clipDuration - sourcePosition) * secondsPerBar;
              const noteDuration = Math.min(note.durationTicks * getSchedulerTickDuration(), clipEndDuration, duration - startTime);
              if (noteDuration > 0) {
                playPianoNote(track, startTime, note.midi, noteDuration, note.velocity ?? 0.8,
                  patternTrack, getPatternSourceGain(patternTrack, track), note);
              }
            });
          }
        });
      });
      state.melTracks.forEach((melTrack) => {
        const instrument = state.tracks.find((track) => track.id === melTrack.instrumentId);
        if (!instrument || melTrack.muted || (hasArrangementSolo && !melTrack.solo) ||
          instrument.muted || (hasSolo && !instrument.solo)) return;
        melTrack.clips.forEach((clip) => {
          const mel = getMel(clip.melId);
          if (!mel) return;
          getMelClipNoteEvents(mel, clip).forEach(({ note, startBar, endBar }) => {
            if (startBar >= duration / secondsPerBar || endBar <= startBar) return;
            const startTime = startBar * secondsPerBar;
            const noteDuration = Math.min((endBar - startBar) * secondsPerBar, duration - startTime);
            if (noteDuration > 0) playPianoNote(instrument, startTime, note.midi, noteDuration,
              note.velocity ?? 0.8, melTrack, null, note);
          });
        });
      });
      if (state.metronome) {
        for (let step = 0; step < Math.ceil(duration / stepDuration); step += 4) {
          const time = step * stepDuration;
          triggerClick(time, step % 16 === 0);
        }
      }

      const rendered = await context.startRendering();
      const extension = format === "mp3" ? "mp3" : "wav";
      const audioFile = format === "mp3" ? await encodeMp3(rendered) : encodeWav(rendered);
      downloadBlob(audioFile, `dansbpm-song.${extension}`);
      showToast(`Song exported as ${format.toUpperCase()}`);
    } catch (error) {
      showToast(`Could not export the song: ${error.message || "render failed"}`);
    } finally {
      state.audioContext = previousContext;
      state.masterGain = previousMaster;
      state.masterLimiter = previousMasterLimiter;
      state.masterPitchNode = previousMasterPitchNode;
      state.masterPitchSupported = previousMasterPitchSupported;
      state.noiseBuffer = previousNoise;
      allTracks.forEach((track, index) => {
        track.fxRuntime?.forEach(({ nodes, sources }) => {
          sources.forEach((source) => {
            try { source.stop(); } catch { /* already stopped */ }
          });
          nodes.forEach((node) => node.disconnect());
        });
        track.gainNode = previousGains[index];
        track.automationGainNode = previousAutomationGains[index];
        track.panNode?.disconnect();
        track.panNode = previousPanners[index];
        track.fxRuntime = previousFxRuntimes[index];
        track.analyser = previousAnalysers[index];
        track.sourceGains = previousSourceGains[index];
        track.sidechainInputNode = previousSidechainInputs[index];
        track.sidechainSourceNode = previousSidechainSources[index];
      });
      state.isExporting = false;
      button.disabled = false;
      document.body.classList.remove("is-exporting");
      updateProjectKeyIndicator();
    }
  }

  async function encodeMp3(audioBuffer) {
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const encoder = new window.lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, 192);
    const pcmChannels = Array.from({ length: channels }, (_, channel) => {
      const samples = audioBuffer.getChannelData(channel);
      return Int16Array.from(samples, (sample) => {
        const clamped = Math.max(-1, Math.min(1, sample));
        return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      });
    });
    const chunks = [];
    for (let offset = 0; offset < audioBuffer.length; offset += 1152) {
      const left = pcmChannels[0].subarray(offset, Math.min(offset + 1152, audioBuffer.length));
      const encoded = channels === 1
        ? encoder.encodeBuffer(left)
        : encoder.encodeBuffer(left, pcmChannels[1].subarray(offset, Math.min(offset + 1152, audioBuffer.length)));
      if (encoded.length) chunks.push(encoded);
      if (offset > 0 && offset % (1152 * 256) === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    }
    const finalChunk = encoder.flush();
    if (finalChunk.length) chunks.push(finalChunk);
    return new Blob(chunks, { type: "audio/mpeg" });
  }

  function encodeWav(audioBuffer) {
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const frames = audioBuffer.length;
    const dataBytes = frames * channels * 2;
    const wav = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(wav);
    const writeText = (offset, text) => {
      for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, dataBytes, true);
    const channelData = Array.from({ length: channels }, (_, channel) => audioBuffer.getChannelData(channel));
    let offset = 44;
    for (let frame = 0; frame < frames; frame += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([wav], { type: "audio/wav" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function sanitizeFilename(name) {
    return name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, "-").slice(0, 80) || "dansbpm";
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("Could not encode project audio."));
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(",");
    if (comma < 0 || !dataUrl.slice(0, comma).endsWith(";base64")) {
      throw new Error("The project contains an invalid audio attachment.");
    }
    const mediaType = dataUrl.slice(5, comma).split(";")[0] || "application/octet-stream";
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mediaType });
  }

  async function getProjectRecordingRecords(projectId = state.projectId) {
    const database = await openRecordingDb();
    return new Promise((resolve, reject) => {
      let records = [];
      const transaction = database.transaction("recordings", "readonly");
      const request = transaction.objectStore("recordings").getAll();
      request.onsuccess = () => { records = request.result; };
      request.onerror = () => {
        database.close();
        reject(request.error || new Error("Could not read saved project audio."));
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(records.filter((record) =>
          record.projectId === projectId || (!record.projectId && projectId === "default")));
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Could not read saved project audio."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Project audio export was cancelled."));
      };
    });
  }

  async function createProjectFile(snapshot = createStateSnapshot()) {
    const recordings = window.indexedDB ? await getProjectRecordingRecords() : [];
    const assets = await Promise.all(recordings.map(async (record) => {
      if (!(record.blob instanceof Blob)) {
        throw new Error(`Could not export ${record.name || record.trackName || "a project audio file"}.`);
      }
      const { blob, ...metadata } = record;
      return { metadata, dataUrl: await blobToDataUrl(blob) };
    }));
    return {
      app: "DansBPM",
      format: "dansbpm-project",
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        name: state.projectName,
        snapshot,
      },
      assets,
    };
  }

  async function createCloudProjectFile() {
    const projectFile = await createProjectFile();
    const project = state.projects.find((item) => item.id === state.projectId);
    if (project) projectFile.project.name = project.name;
    const savedDj = JSON.parse(window.localStorage.getItem(getDjStorageKey()) || "null");
    if (savedDj && typeof savedDj === "object" && !Array.isArray(savedDj)) {
      projectFile.project.snapshot.dj = savedDj;
    }
    return projectFile;
  }

  async function exportProjectFile() {
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before exporting the project.");
      return;
    }
    const snapshot = createStateSnapshot();
    const button = $("#export-project-button");
    button.disabled = true;
    $("#export-song-dialog").close();
    state.isExporting = true;
    document.body.classList.add("is-exporting");
    showToast("Packing your project and audio…");
    try {
      const projectFile = await createProjectFile(snapshot);
      const file = new Blob([JSON.stringify(projectFile)], { type: "application/vnd.dansbpm.project+json" });
      downloadBlob(file, `${sanitizeFilename(state.projectName)}.bpm`);
      showToast("Project exported as a BPM file");
    } catch (error) {
      showToast(`Could not export the project: ${error.message || "project data could not be read"}`);
    } finally {
      button.disabled = false;
      state.isExporting = false;
      document.body.classList.remove("is-exporting");
    }
  }

  function clearPattern() {
    state.tracks.forEach((track) => track.cells.fill(false));
    const pattern = getPattern();
    Object.keys(pattern?.stepPianoNotes || {}).forEach((trackId) => {
      pattern.stepPianoNotes[trackId] = [];
      pattern.cells[trackId] = Array(STEP_COUNT).fill(false);
    });
    state.selectedPreset = null;
    renderTracks();
    renderPresets();
    saveState();
    showToast("Pattern cleared");
  }

  function toggleMetronome() {
    state.metronome = !state.metronome;
    const button = $("#metronome-button");
    button.classList.toggle("is-active", state.metronome);
    button.setAttribute("aria-pressed", String(state.metronome));
    showToast(state.metronome ? "Metronome on" : "Metronome off");
  }

