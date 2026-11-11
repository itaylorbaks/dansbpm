  function renderCollaborationStatus(message = "Not connected") {
    const status = $("#collaboration-status");
    const activeRoom = $("#collaboration-active-room");
    const roomActions = $("#collaboration-room-actions");
    const code = $("#collaboration-room-code");
    const participants = $("#collaboration-participants");
    if (status) status.textContent = collaboration.conflicted ? collaboration.conflictMessage : message;
    if (activeRoom) activeRoom.hidden = !collaboration.session;
    if (roomActions) roomActions.hidden = Boolean(collaboration.session);
    if (code) code.textContent = collaboration.session?.roomCode || "";
    if (participants) {
      participants.textContent = collaboration.participantNames?.length
        ? `In this room: ${collaboration.participantNames.join(", ")}`
        : "";
    }
  }

  function normalizeCollaborationServerUrl(value) {
    const url = new URL(value.trim());
    if (url.protocol === "https:") url.protocol = "wss:";
    else if (url.protocol === "http:") url.protocol = "ws:";
    if (!["ws:", "wss:"].includes(url.protocol)) {
      throw new Error("Use a ws:// or wss:// collaboration server URL.");
    }
    if (url.pathname === "/") url.pathname = "/collaboration";
    if (url.pathname !== "/collaboration" || url.search || url.hash) {
      throw new Error("The collaboration server URL must end in /collaboration.");
    }
    if (url.protocol === "ws:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      throw new Error("Use wss:// for collaboration servers outside this device.");
    }
    return url.toString();
  }

  function saveCollaborationSession() {
    try {
      if (collaboration.session) {
        window.sessionStorage.setItem(COLLABORATION_SESSION_KEY, JSON.stringify(collaboration.session));
      } else {
        window.sessionStorage.removeItem(COLLABORATION_SESSION_KEY);
      }
      return true;
    } catch (error) {
      showToast(`Could not save the room session: ${error.message || "session storage is unavailable"}`);
      return false;
    }
  }

  async function getCollaborationAssets(projectId = state.projectId) {
    const records = window.indexedDB ? await getProjectRecordingRecords(projectId) : [];
    return Promise.all(records.map(async (record) => {
      if (!(record.blob instanceof Blob)) {
        throw new Error(`Could not share ${record.name || record.trackName || "a project audio file"}.`);
      }
      const { blob, ...metadata } = record;
      return { metadata, dataUrl: await blobToDataUrl(blob) };
    }));
  }

  function isValidCollaborativeSnapshot(snapshot) {
    return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) &&
      Array.isArray(snapshot.tracks) && Array.isArray(snapshot.patterns) &&
      Array.isArray(snapshot.patternClips) && Array.isArray(snapshot.mels) &&
      Array.isArray(snapshot.melTracks) && Array.isArray(snapshot.arrangementTracks);
  }

  function deserializeCollaborationAssets(snapshot, assets) {
    if (!isValidCollaborativeSnapshot(snapshot) || !Array.isArray(assets)) {
      throw new Error("The shared project data is invalid.");
    }
    const trackIds = new Set(snapshot.tracks
      .filter((track) => typeof track?.id === "string")
      .map((track) => track.id));
    return assets.map((asset) => {
      const metadata = asset?.metadata;
      if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) ||
        typeof metadata.trackId !== "string" || !metadata.trackId || typeof asset.dataUrl !== "string") {
        throw new Error("The shared project contains an invalid audio attachment.");
      }
      if (metadata.recordType !== undefined && metadata.recordType !== "drum-sample") {
        throw new Error("The shared project contains an unsupported audio attachment.");
      }
      if (metadata.recordType === "drum-sample" && !trackIds.has(metadata.trackId)) {
        throw new Error("The shared project contains audio for a missing track.");
      }
      return { metadata, blob: dataUrlToBlob(asset.dataUrl) };
    });
  }

  function sendCollaborationMessage(message) {
    if (collaboration.socket?.readyState !== WebSocket.OPEN) return false;
    collaboration.socket.send(JSON.stringify(message));
    return true;
  }

  function sendCollaborationSnapshot(snapshot = createStateSnapshot()) {
    if (!collaboration.session || collaboration.applyingRemote || collaboration.conflicted) return;
    const updateId = (collaboration.lastUpdateId || 0) + 1;
    collaboration.lastUpdateId = updateId;
    sendCollaborationMessage({ type: "update", snapshot, updateId, baseRevision: collaboration.revision });
    collaboration.localDirty = true;
    collaboration.session.localDirty = true;
    saveCollaborationSession();
  }

  async function sendCollaborationAssets() {
    if (!collaboration.session || collaboration.applyingRemote || collaboration.conflicted) return;
    try {
      const assets = await getCollaborationAssets();
      const updateId = (collaboration.lastUpdateId || 0) + 1;
      collaboration.lastUpdateId = updateId;
      const sent = sendCollaborationMessage({
        type: "updateAssets",
        snapshot: createStateSnapshot(),
        assets,
        updateId,
        baseRevision: collaboration.revision,
      });
      collaboration.localDirty = true;
      collaboration.assetsDirty = !sent;
      collaboration.session.localDirty = true;
      collaboration.session.assetsDirty = !sent;
      saveCollaborationSession();
      if (!sent) renderCollaborationStatus("Offline — audio changes will sync when reconnected.");
    } catch (error) {
      showToast(`Could not share project audio: ${error.message || "audio storage is unavailable"}`);
    }
  }

  function scheduleCollaborationAssetSync() {
    if (!collaboration.session || collaboration.applyingRemote) return;
    window.clearTimeout(collaboration.assetsTimer);
    collaboration.assetsTimer = window.setTimeout(() => { void sendCollaborationAssets(); }, 500);
  }

  function markCollaborationConflict(revision, sender) {
    collaboration.conflicted = true;
    collaboration.conflictMessage =
      `Conflict: ${sender || "A collaborator"} updated the room. Your edits are saved locally and were not shared.`;
    collaboration.localDirty = true;
    if (collaboration.session) {
      collaboration.session.localDirty = true;
      saveCollaborationSession();
    }
    if (Number.isInteger(revision)) collaboration.revision = Math.max(collaboration.revision, revision);
    if (saveState.timeout) flushSaveState();
    renderCollaborationStatus();
    showToast(collaboration.conflictMessage);
  }

  function connectCollaboration(serverUrl, onOpen) {
    if (collaboration.socket) {
      collaboration.socket.close();
      collaboration.socket = null;
    }
    clearTimeout(collaboration.reconnectTimer);
    renderCollaborationStatus("Connecting…");
    let socket;
    try {
      socket = new WebSocket(serverUrl);
    } catch (error) {
      collaboration.pendingCreate = null;
      collaboration.pendingJoin = null;
      renderCollaborationStatus(`Could not connect: ${error.message || "invalid server URL"}`);
      return;
    }
    collaboration.socket = socket;
    socket.addEventListener("open", () => {
      if (collaboration.socket !== socket) return;
      onOpen(socket);
    });
    socket.addEventListener("message", (event) => {
      if (collaboration.socket === socket) void handleCollaborationMessage(event.data);
    });
    socket.addEventListener("error", () => {
      if (collaboration.socket === socket) renderCollaborationStatus("Could not reach the collaboration server.");
    });
    socket.addEventListener("close", () => {
      if (collaboration.socket !== socket) return;
      collaboration.socket = null;
      if (collaboration.session && !collaboration.manualLeave) {
        renderCollaborationStatus("Connection lost — retrying…");
        collaboration.reconnectTimer = window.setTimeout(() => {
          if (collaboration.session && !collaboration.manualLeave) resumeCollaborationSession();
        }, 2000);
      } else if (!collaboration.session) {
        collaboration.pendingCreate = null;
        collaboration.pendingJoin = null;
        renderCollaborationStatus("Not connected");
      }
    });
  }

  async function createLocalCollaborationProject({ serverUrl, roomCode, revision, snapshot, assets, projectName: sharedProjectName }) {
    if (!state.currentUser) throw new Error("Choose a profile before joining a room.");
    const projectId = makeId();
    const projectName = `${sharedProjectName || state.projectName} (Room ${roomCode.slice(0, 4)})`.slice(0, 64);
    const project = { id: projectId, name: projectName, ownerId: state.currentUser, updatedAt: Date.now() };
    const previousProjectId = state.projectId;
    const previousProjectName = state.projectName;
    const previousActiveProjectIds = { ...state.activeProjectIds };
    const previousProjects = [...state.projects];
    try {
      collaboration.session = { serverUrl, roomCode, projectId, revision };
      if (!saveCollaborationSession()) throw new Error("session storage is unavailable");
      window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
      state.projects.unshift(project);
      state.projectId = projectId;
      state.projectName = projectName;
      state.activeProjectIds[state.currentUser] = projectId;
      writeProjectCatalog();
      const importedAssets = deserializeCollaborationAssets(snapshot, assets);
      await persistImportedProjectAssets(projectId, importedAssets);
      collaboration.session.projectId = projectId;
      if (!saveCollaborationSession()) throw new Error("session storage is unavailable");
      window.location.reload();
    } catch (error) {
      collaboration.session = null;
      saveCollaborationSession();
      state.projects = previousProjects;
      state.projectId = previousProjectId;
      state.projectName = previousProjectName;
      state.activeProjectIds = previousActiveProjectIds;
      try {
        window.localStorage.removeItem(getProjectStorageKey(projectId));
        writeProjectCatalog();
      } catch {
        // Keep the original project selected if local storage is unavailable.
      }
      sendCollaborationMessage({ type: "leave" });
      showToast(`Could not create a local room copy: ${error.message || "browser storage is unavailable"}`);
    }
  }

  async function applyCollaborationSnapshot(snapshot, assets, sender) {
    if (!isValidCollaborativeSnapshot(snapshot)) {
      showToast("The collaboration server sent an invalid project snapshot.");
      return false;
    }
    collaboration.applyingRemote = true;
    try {
      stopPlayback();
      stopAllWorkspacePlayers();
      [...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
        ...state.effectTracks, state.masterTrack].forEach(disconnectTrackAudio);
      if (Array.isArray(assets) && (assets.length || window.indexedDB)) {
        const importedAssets = deserializeCollaborationAssets(snapshot, assets);
        await replaceProjectRecordingAssets(state.projectId, importedAssets);
      } else if (Array.isArray(assets) && assets.length) {
        throw new Error("This browser does not support shared project audio.");
      }
      window.localStorage.setItem(getProjectStorageKey(state.projectId), JSON.stringify(snapshot));
      state.tracks = makeTracks();
      const initialPattern = makePatternSnapshot(makeId(), "Pattern 1");
      state.patterns = [initialPattern];
      state.selectedPatternId = initialPattern.id;
      state.arrangementTracks = [];
      state.patternClips = [];
      state.mels = [];
      state.melTracks = [];
      state.pianoNotes = [];
      state.effectTracks = [];
      state.masterTrack = makeMixerBusTrack("mixer-master");
      state.selectedMelId = "";
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.selectedArrangementItems.clear();
      state.selectedStepCells.clear();
      state.selectedMixerTrackId = null;
      state.selectedMixerEffectId = null;
      state.clipboard = null;
      state.stepPianoEditContext = null;
      state.pianoSelectionFromMarquee = false;
      state.arrangementSelectionFromMarquee = false;
      restoreState();
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
      if (state.audioContext) initializeAudio();
      await restoreArrangement();
      undoStacks.clear();
      undoLatest.clear();
      seedUndoHistory();
      updateProjectNameLabel();
      updateStorageIndicator();
      showToast(`${sender || "A collaborator"} updated the shared project.`);
      return true;
    } catch (error) {
      showToast(`Could not apply the room update: ${error.message || "project data is unavailable"}`);
      return false;
    } finally {
      collaboration.applyingRemote = false;
    }
  }

  async function handleCollaborationMessage(raw) {
    let message;
    try {
      message = JSON.parse(typeof raw === "string" ? raw : await raw.text());
    } catch {
      renderCollaborationStatus("The collaboration server sent an invalid message.");
      return;
    }
    if (!message || typeof message !== "object") return;
    if (message.type === "snapshotConflict") {
      markCollaborationConflict(message.revision, message.sender);
      return;
    }
    if (message.type === "error") {
      collaboration.pendingCreate = null;
      collaboration.pendingJoin = null;
      if (!collaboration.session && collaboration.socket) {
        const socket = collaboration.socket;
        collaboration.socket = null;
        socket.close();
      }
      renderCollaborationStatus(message.message || "The collaboration server reported an error.");
      return;
    }
    if (message.type === "roomCreated") {
      const pending = collaboration.pendingCreate;
      if (!pending) return;
      collaboration.pendingCreate = null;
      collaboration.session = {
        serverUrl: pending.serverUrl,
        roomCode: message.roomCode,
        projectId: "",
        revision: message.revision,
      };
      collaboration.participantNames = message.participants || [];
      renderCollaborationStatus("Room created. Preparing a shared project copy…");
      await createLocalCollaborationProject({
        ...pending,
        roomCode: message.roomCode,
        revision: message.revision,
      });
      return;
    }
    if (message.type === "roomState") {
      collaboration.participantNames = message.participants || collaboration.participantNames || [];
      if (!collaboration.session) {
        const pending = collaboration.pendingJoin;
        if (!pending) return;
        collaboration.pendingJoin = null;
        renderCollaborationStatus("Joined. Preparing a shared project copy…");
        await createLocalCollaborationProject({
          serverUrl: pending.serverUrl,
          roomCode: message.roomCode,
          revision: message.revision,
          snapshot: message.snapshot,
          assets: message.assets || [],
          projectName: message.projectName,
        });
        return;
      }
      const roomRevision = Number.isInteger(message.revision) ? message.revision : 0;
      if (collaboration.localDirty || collaboration.assetsDirty) {
        if (roomRevision > collaboration.revision) {
          markCollaborationConflict(roomRevision, "A collaborator");
        } else if (collaboration.assetsDirty) {
          void sendCollaborationAssets();
        } else {
          sendCollaborationSnapshot(createStateSnapshot());
        }
        return;
      }
      renderCollaborationStatus(`Connected to room ${collaboration.session.roomCode}.`);
    }
    if (message.type === "presence") {
      collaboration.participantNames = message.participants || [];
      renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
    }
    if (message.type === "snapshotAck") {
      if (message.updateId === collaboration.lastUpdateId && !collaboration.conflicted) {
        collaboration.localDirty = false;
        collaboration.assetsDirty = false;
        if (collaboration.session) {
          collaboration.session.localDirty = false;
          collaboration.session.assetsDirty = false;
        }
      }
      if (Number.isInteger(message.revision)) {
        collaboration.revision = message.revision;
        if (collaboration.session && !collaboration.conflicted) {
          collaboration.session.revision = message.revision;
          saveCollaborationSession();
        }
      }
      renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
    }
    if (message.type === "transport") {
      if (message.action === "stop") {
        stopPlayback(true);
      } else if (message.action === "play" &&
        ["arrangement", "sequencer", "piano-roll"].includes(message.mode) &&
        Number.isInteger(message.startAtMs)) {
        if (state.isPlaying || state.isStartingPlayback) stopPlayback(true);
        void startPlayback(message.mode, { startAtMs: message.startAtMs, remote: true });
      }
    }
    if (message.type === "snapshot" || message.type === "roomState") {
      const revision = Number.isInteger(message.revision) ? message.revision : 0;
      if (collaboration.session && revision > collaboration.revision) {
        collaboration.applyQueue = collaboration.applyQueue.then(async () => {
          if (revision <= collaboration.revision) return;
          if (saveState.timeout || collaboration.localDirty || state.mediaRecorder?.state === "recording") {
            markCollaborationConflict(revision, message.sender);
            return;
          }
          const applied = await applyCollaborationSnapshot(message.snapshot, message.assets, message.sender);
          if (applied && !collaboration.localDirty) {
            collaboration.assetsDirty = false;
            collaboration.revision = revision;
            collaboration.session.revision = revision;
            collaboration.session.localDirty = false;
            collaboration.session.assetsDirty = false;
            saveCollaborationSession();
          }
          renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
        });
      }
    }
  }

  function beginCollaborationConnection(action, serverUrl, roomCode = "") {
    collaboration.manualLeave = false;
    if (action === "create") {
      collaboration.pendingCreate = {
        serverUrl,
        projectId: state.projectId,
        projectName: state.projectName,
        snapshot: createStateSnapshot(),
        assets: [],
      };
      renderCollaborationStatus("Packing project audio…");
      void getCollaborationAssets(collaboration.pendingCreate.projectId).then((assets) => {
        if (!collaboration.pendingCreate) return;
        collaboration.pendingCreate.assets = assets;
        connectCollaboration(serverUrl, (socket) => {
          socket.send(JSON.stringify({
            type: "create",
            name: getCurrentUserName(),
            projectName: collaboration.pendingCreate.projectName,
            snapshot: collaboration.pendingCreate.snapshot,
            assets: collaboration.pendingCreate.assets,
          }));
        });
      }).catch((error) => {
        collaboration.pendingCreate = null;
        renderCollaborationStatus(`Could not prepare this project: ${error.message || "audio storage is unavailable"}`);
      });
      return;
    }
    collaboration.pendingJoin = { serverUrl };
    connectCollaboration(serverUrl, (socket) => {
      socket.send(JSON.stringify({
        type: "join",
        roomCode: roomCode.trim().toUpperCase(),
        name: getCurrentUserName(),
      }));
    });
  }

  function startCollaborationRoom(action) {
    if (!state.currentUser) {
      showToast("Choose a profile before starting collaboration.");
      return;
    }
    void ensureAudio().catch((error) => {
      renderCollaborationStatus(`Room editing is available, but audio could not be unlocked: ${error.message || "audio is unavailable"}`);
    });
    let serverUrl;
    try {
      serverUrl = normalizeCollaborationServerUrl($("#collaboration-server-url").value);
      window.localStorage.setItem(COLLABORATION_URL_KEY, serverUrl);
    } catch (error) {
      renderCollaborationStatus(error.message || "Enter a valid collaboration server URL.");
      return;
    }
    if (collaboration.session) {
      renderCollaborationStatus("Leave the current room before joining another.");
      return;
    }
    if (collaboration.socket || collaboration.pendingCreate || collaboration.pendingJoin) {
      renderCollaborationStatus("A room connection is already in progress.");
      return;
    }
    if (!flushSaveState()) {
      renderCollaborationStatus("Could not save the current project; collaboration was not started.");
      return;
    }
    if (action === "join") {
      const roomCode = $("#collaboration-room-code-input").value.trim().toUpperCase();
      if (!/^[0-9A-F]{20}$/.test(roomCode)) {
        renderCollaborationStatus("Enter the 20-character room code.");
        return;
      }
      beginCollaborationConnection("join", serverUrl, roomCode);
      return;
    }
    beginCollaborationConnection("create", serverUrl);
  }

  function resumeCollaborationSession() {
    let session;
    try {
      session = JSON.parse(window.sessionStorage.getItem(COLLABORATION_SESSION_KEY) || "null");
    } catch {
      renderCollaborationStatus("Room sessions are unavailable in this browser.");
      return;
    }
    if (!session || session.projectId !== state.projectId || !session.serverUrl || !session.roomCode) {
      if (session) {
        try { window.sessionStorage.removeItem(COLLABORATION_SESSION_KEY); } catch { /* Session storage may be unavailable. */ }
      }
      return;
    }
    collaboration.session = session;
    collaboration.revision = Number.isInteger(session.revision) ? session.revision : 0;
    collaboration.localDirty = session.localDirty === true;
    collaboration.assetsDirty = session.assetsDirty === true;
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    collaboration.manualLeave = false;
    $("#collaboration-dialog").showModal();
    const serverUrl = session.serverUrl;
    connectCollaboration(serverUrl, (socket) => {
      socket.send(JSON.stringify({
        type: "join",
        roomCode: session.roomCode,
        name: getCurrentUserName(),
      }));
    });
  }

  function leaveCollaborationRoom() {
    if (!collaboration.session) return;
    flushSaveState();
    collaboration.manualLeave = true;
    sendCollaborationMessage({ type: "leave" });
    collaboration.socket?.close();
    collaboration.socket = null;
    collaboration.session = null;
    collaboration.localDirty = false;
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    saveCollaborationSession();
    renderCollaborationStatus("Room left. This project's local copy is saved.");
  }

  function persistStateSnapshot(snapshot, projectId = state.projectId) {
    if (!state.currentUser) {
      saveState.lastError = "No active profile is selected.";
      return false;
    }
    if (!state.projects.some((project) => project.id === projectId && project.ownerId === state.currentUser)) {
      saveState.lastError = "The active project is not available for this profile.";
      return false;
    }
    try {
      window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
    } catch (error) {
      saveState.lastError = error?.name === "QuotaExceededError"
        ? "browser storage is full."
        : error?.message || "browser storage is unavailable.";
      $("#save-state").textContent = "Session-only changes";
      $(".save-dot").style.background = "#d3a34b";
      return false;
    }
    saveState.lastError = "";
    const project = state.projects.find((item) => item.id === projectId);
    if (project) {
      project.updatedAt = Date.now();
      try {
        writeProjectCatalog();
      } catch {
        showToast("Project saved, but its saved-project list could not be updated.");
      }
      if (collaboration.session && !collaboration.applyingRemote && projectId === state.projectId) {
        sendCollaborationSnapshot(snapshot);
      }
    }
    $("#save-state").textContent = "All changes saved";
    $(".save-dot").style.background = "#7f9d43";
    return true;
  }

  function flushSaveState() {
    window.clearTimeout(saveState.timeout);
    saveState.timeout = null;
    if (!state.currentUser) {
      saveState.lastError = "No active profile is selected.";
      return false;
    }
    return persistStateSnapshot(createStateSnapshot(), state.projectId);
  }

  function saveState() {
    if (!state.currentUser) return;
    const saveDot = $(".save-dot");
    $("#save-state").textContent = "Saving…";
    saveDot.style.background = "#c8a95a";
    const snapshot = createStateSnapshot();
    if (!isApplyingUndo) recordUndoSnapshot(getUndoScope(), snapshot);
    const projectId = state.projectId;
    window.clearTimeout(saveState.timeout);
    saveState.timeout = window.setTimeout(() => {
      persistStateSnapshot(snapshot, projectId);
    }, 250);
  }

  function getUndoScope() {
    if (state.view === "piano-roll") return "piano-roll";
    if (state.view === "sequencer") return "step-grid";
    if (state.view === "dj") return "dj";
    return "track-view";
  }

  function cloneHistoryTrack(track) {
    return {
      ...track,
      cells: Array.isArray(track.cells) ? [...track.cells] : track.cells,
      clips: Array.isArray(track.clips) ? track.clips.map((clip) => ({ ...clip })) : track.clips,
      effects: makeDefaultEffects(track.effects),
      effectSettings: makeDefaultEffectSettings(track.effectSettings),
      effectChain: Array.isArray(track.effectChain) ? track.effectChain.map((effect) => ({ ...effect })) : track.effectChain,
    };
  }

  function cloneHistoryPattern(pattern) {
    return {
      ...cloneHistoryTrack(pattern),
      trackIds: [...(pattern.trackIds || [])],
      cells: Object.fromEntries(Object.entries(pattern.cells || {}).map(([trackId, cells]) =>
        [trackId, Array.isArray(cells) ? [...cells] : []])),
      variants: { ...(pattern.variants || {}) },
      stepPianoNotes: pattern.stepPianoNotes
        ? Object.fromEntries(Object.entries(pattern.stepPianoNotes).map(([trackId, notes]) =>
          [trackId, notes.map((note) => ({ ...note }))]))
        : undefined,
    };
  }

  function cloneHistoryMel(mel) {
    return { ...mel, notes: mel.notes.map((note) => ({ ...note })) };
  }

  function getDjUndoSnapshot() {
    return {
      activeDeck: djState.activeDeck,
      crossfader: djState.crossfader,
      masterVolume: djState.masterVolume,
      masterLow: djState.masterLow,
      masterMid: djState.masterMid,
      masterHigh: djState.masterHigh,
      masterFilter: djState.masterFilter,
      arrangementViewStartBar: djState.arrangementViewStartBar,
      liveSlots: djState.liveSlots.map((slot) => slot ? { ...slot } : null),
      decks: Object.fromEntries(DJ_DECK_IDS.map((deckId) => {
        const deck = djState.decks[deckId];
        return [deckId, {
          sourceKey: deck.sourceKey,
          volume: deck.volume,
          filter: deck.filter,
          eqLow: deck.eqLow,
          eqMid: deck.eqMid,
          eqHigh: deck.eqHigh,
          pitch: deck.pitch,
          syncRate: deck.syncRate,
          reverse: deck.reverse,
          startOffsetBars: deck.startOffsetBars,
        }];
      })),
    };
  }

  function createUndoSnapshot(scope, serialized = null) {
    const saved = serialized || createStateSnapshot();
    if (scope === "dj") {
      const dj = getDjUndoSnapshot();
      return { fingerprint: JSON.stringify(dj), dj };
    }
    if (scope === "piano-roll") {
      return {
        fingerprint: JSON.stringify({
          pianoNotes: saved.pianoNotes,
          mels: saved.mels,
          selectedMelId: saved.selectedMelId,
          pianoLoopEnabled: saved.pianoLoopEnabled,
          pianoLoopStartBar: saved.pianoLoopStartBar,
          pianoLoopEndBar: saved.pianoLoopEndBar,
        }),
        serialized: saved,
        mels: state.mels.map(cloneHistoryMel),
      };
    }
    if (scope === "step-grid") {
      const patternGridState = saved.patterns.map(({ volume, muted, solo, ...pattern }) => pattern);
      return {
        fingerprint: JSON.stringify({
          patterns: patternGridState,
          tracks: saved.tracks,
          steps: saved.steps,
          selectedPatternId: saved.selectedPatternId,
          bpm: saved.bpm,
          swing: saved.swing,
        }),
        serialized: saved,
        patterns: state.patterns.map(cloneHistoryPattern),
        tracks: state.tracks.map(cloneHistoryTrack),
      };
    }
    const audioClipState = state.arrangementTracks.map((track) => ({
      id: track.id,
      clips: track.clips.map(({ buffer, ...clip }) => clip),
    }));
    const patterns = state.patterns.map(({ id, volume, muted, solo }) => ({ id, volume, muted, solo }));
    const trackViewState = {
      patterns,
      patternClips: state.patternClips,
      melTracks: saved.melTracks,
      arrangementTracks: saved.arrangementTracks.map((track) => ({
        ...track,
        clips: audioClipState.find((item) => item.id === track.id)?.clips || [],
      })),
      arrangementBars: saved.arrangementBars,
      arrangementCursor: saved.arrangementCursor,
      arrangementLoopEnabled: saved.arrangementLoopEnabled,
      arrangementLoopStartBar: saved.arrangementLoopStartBar,
      arrangementLoopEndBar: saved.arrangementLoopEndBar,
      bpm: saved.bpm,
      swing: saved.swing,
      selectedMixerTrackId: state.selectedMixerTrackId,
    };
    return {
      fingerprint: JSON.stringify(trackViewState),
      serialized: saved,
      patterns,
      patternClips: state.patternClips.map((clip) => ({ ...clip })),
      melTracks: state.melTracks.map(cloneHistoryTrack),
      arrangementTracks: state.arrangementTracks.map(cloneHistoryTrack),
      selectedMixerTrackId: state.selectedMixerTrackId,
    };
  }

  function recordUndoSnapshot(scope, serialized = null) {
    if (isApplyingUndo) return;
    const next = createUndoSnapshot(scope, serialized);
    const previous = undoLatest.get(scope);
    if (previous && previous.fingerprint !== next.fingerprint) {
      const history = undoStacks.get(scope) || [];
      history.push(previous);
      if (history.length > MAX_UNDO_STEPS) history.shift();
      undoStacks.set(scope, history);
    }
    undoLatest.set(scope, next);
  }

  function seedUndoHistory() {
    ["track-view", "piano-roll", "step-grid", "dj"].forEach((scope) => {
      undoLatest.set(scope, createUndoSnapshot(scope));
    });
  }

  function restoreDjUndoSnapshot(snapshot) {
    const dj = snapshot.dj;
    const restartDecks = [];
    Object.assign(djState, {
      activeDeck: dj.activeDeck,
      crossfader: dj.crossfader,
      masterVolume: dj.masterVolume,
      masterLow: dj.masterLow,
      masterMid: dj.masterMid,
      masterHigh: dj.masterHigh,
      masterFilter: dj.masterFilter,
      arrangementViewStartBar: dj.arrangementViewStartBar,
      liveSlots: dj.liveSlots.map((slot) => slot ? { ...slot } : null),
    });
    DJ_DECK_IDS.forEach((deckId) => {
      const deck = djState.decks[deckId];
      const savedDeck = dj.decks[deckId];
      if (deck.playing && (deck.sourceKey !== savedDeck.sourceKey || deck.reverse !== savedDeck.reverse)) {
        stopDjDeck(deckId);
        restartDecks.push(deckId);
      }
      Object.assign(deck, savedDeck);
    });
    DJ_DECK_IDS.forEach((deckId) => {
      const deck = djState.decks[deckId];
      updateDjAudioRate(deck, () => {}, 0.015);
      updateDjSongRate(deck);
    });
    applyDjMixer();
    renderDjView();
    restartDecks.forEach((deckId) => { void startDjDeck(deckId); });
    saveDjState();
  }

  function applyUndoSnapshot(scope, snapshot) {
    const saved = snapshot.serialized;
    if (scope === "dj") {
      restoreDjUndoSnapshot(snapshot);
      return;
    }
    if (scope === "piano-roll") {
      state.mels = snapshot.mels.map(cloneHistoryMel);
      state.selectedMelId = saved.selectedMelId;
      state.pianoNotes = saved.pianoNotes.map((note) => ({ ...note }));
      state.pianoBars = saved.pianoBars;
      state.pianoCursorTick = saved.pianoCursorTick;
      state.pianoLoopEnabled = saved.pianoLoopEnabled;
      state.pianoLoopStartBar = saved.pianoLoopStartBar;
      state.pianoLoopEndBar = saved.pianoLoopEndBar;
      state.selectedPianoTrackId = saved.selectedPianoTrackId;
      renderMelOptions();
      renderPianoRoll();
    } else if (scope === "step-grid") {
      const currentPatternControls = new Map(state.patterns.map((pattern) => [pattern.id, pattern]));
      state.patterns = snapshot.patterns.map((pattern) => {
        const current = currentPatternControls.get(pattern.id);
        return {
          ...cloneHistoryPattern(pattern),
          volume: current?.volume ?? pattern.volume,
          muted: current?.muted ?? pattern.muted,
          solo: current?.solo ?? pattern.solo,
        };
      });
      state.tracks = snapshot.tracks.map(cloneHistoryTrack);
      state.steps = saved.steps;
      state.bpm = saved.bpm;
      state.swing = saved.swing;
      state.selectedPatternId = saved.selectedPatternId;
      applyPattern(getPattern());
      tempoValue.textContent = String(state.bpm);
      swingSlider.value = String(state.swing);
      $("#swing-value").textContent = `${state.swing}%`;
      swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
      setLength(state.steps);
      renderTracks();
      renderPatternSelectors();
      renderArrangement();
    } else {
      const savedPatternControls = new Map(snapshot.patterns.map((pattern) => [pattern.id, pattern]));
      state.patterns.forEach((pattern) => {
        const savedPattern = savedPatternControls.get(pattern.id);
        if (!savedPattern) return;
        pattern.volume = savedPattern.volume;
        pattern.muted = savedPattern.muted;
        pattern.solo = savedPattern.solo;
      });
      state.patternClips = snapshot.patternClips.map((clip) => ({ ...clip }));
      state.melTracks = snapshot.melTracks.map(cloneHistoryTrack);
      state.arrangementTracks = snapshot.arrangementTracks.map(cloneHistoryTrack);
      state.selectedMixerTrackId = snapshot.selectedMixerTrackId;
      state.arrangementBars = saved.arrangementBars;
      state.arrangementCursor = saved.arrangementCursor;
      state.arrangementLoopEnabled = saved.arrangementLoopEnabled;
      state.arrangementLoopStartBar = saved.arrangementLoopStartBar;
      state.arrangementLoopEndBar = saved.arrangementLoopEndBar;
      state.bpm = saved.bpm;
      state.swing = saved.swing;
      tempoValue.textContent = String(state.bpm);
      swingSlider.value = String(state.swing);
      $("#swing-value").textContent = `${state.swing}%`;
      swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
      updateArrangementLength();
      updateTrackGains();
      renderArrangement();
      renderMixer();
      renderDjView();
    }
    recordUndoSnapshot(scope);
    if (scope === "track-view") {
      state.arrangementTracks.forEach(persistTrackClips);
    }
    saveState();
  }

  function undoCurrentView() {
    const scope = getUndoScope();
    const history = undoStacks.get(scope);
    const snapshot = history?.pop();
    if (!snapshot) {
      showToast("Nothing to undo in this view.");
      return;
    }
    isApplyingUndo = true;
    let restored = false;
    try {
      applyUndoSnapshot(scope, snapshot);
      undoLatest.set(scope, createUndoSnapshot(scope));
      restored = true;
    } catch (error) {
      history.push(snapshot);
      showToast(`Could not undo that action: ${error.message || "the previous state could not be restored"}`);
    } finally {
      isApplyingUndo = false;
    }
    if (!restored) return;
  }

  function renderProjectList() {
    const list = $("#project-list");
    list.replaceChildren();
    getCurrentUserProjects().forEach((project) => {
      const button = document.createElement("button");
      button.className = `project-list-item${project.id === state.projectId ? " is-current" : ""}`;
      button.type = "button";
      button.disabled = project.id === state.projectId;
      const name = document.createElement("span");
      name.className = "project-list-name";
      name.textContent = project.name;
      const detail = document.createElement("span");
      detail.className = "project-list-detail";
      detail.textContent = project.id === state.projectId
        ? "CURRENT PROJECT"
        : project.updatedAt ? `SAVED ${new Date(project.updatedAt).toLocaleDateString()}` : "NOT SAVED YET";
      button.append(name, detail);
      button.addEventListener("click", () => switchProject(project.id));
      list.append(button);
    });
  }

  function switchProject(projectId) {
    if (projectId === state.projectId || !state.projects.some((project) =>
      project.id === projectId && project.ownerId === state.currentUser)) return;
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before switching projects.");
      return;
    }
    if (!flushSaveState()) {
      showToast("Could not save this project; switching was cancelled.");
      return;
    }
    if (state.isPlaying) stopPlayback();
    stopAllWorkspacePlayers();
    const previousProjectId = state.projectId;
    state.projectId = projectId;
    try {
      writeProjectCatalog();
      window.location.reload();
    } catch (error) {
      state.projectId = previousProjectId;
      showToast(`Could not switch projects: ${error.message || "storage is unavailable"}`);
    }
  }

  function createProject() {
    if (!state.currentUser) return;
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before creating a project.");
      return;
    }
    if (!flushSaveState()) {
      showToast("Could not save this project; a new project was not created.");
      return;
    }
    stopAllWorkspacePlayers();
    const project = {
      id: makeId(),
      name: `New Project ${getCurrentUserProjects().length + 1}`,
      ownerId: state.currentUser,
      updatedAt: 0,
    };
    const previousProjectId = state.projectId;
    state.projects.unshift(project);
    state.projectId = project.id;
    try {
      writeProjectCatalog();
      window.location.reload();
    } catch (error) {
      state.projects = state.projects.filter((item) => item.id !== project.id);
      state.projectId = previousProjectId;
      showToast(`Could not create project: ${error.message || "storage is unavailable"}`);
    }
  }

