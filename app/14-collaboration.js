  let collaborationLeaveTimeout = null;
  let selectedProjectId = null;

  function renderCollaborationStatus(message = "Not connected") {
    const status = $("#collaboration-status");
    const activeRoom = $("#collaboration-active-room");
    const roomActions = $("#collaboration-room-actions");
    const code = $("#collaboration-room-code");
    const participants = $("#collaboration-participants");
    const presenceBar = $("#collaboration-presence-bar");
    const presenceText = $("#collaboration-presence-text");
    if (status) status.textContent = collaboration.conflicted ? collaboration.conflictMessage : message;
    if (activeRoom) activeRoom.hidden = !collaboration.session;
    if (roomActions) roomActions.hidden = Boolean(collaboration.session);
    if (code) code.textContent = collaboration.session?.roomCode || "";
    if (participants) {
      participants.textContent = collaboration.participantNames?.length
        ? `In this room: ${collaboration.participantNames.join(", ")}`
        : "";
    }
    if (presenceBar) presenceBar.hidden = !collaboration.session;
    if (presenceText) {
      const viewers = collaboration.viewers.length
        ? collaboration.viewers
        : [{ name: getCurrentUserName(), view: state.view }];
      presenceText.textContent = viewers
        .map(({ name, view }) => `${name} is viewing: ${getCollaborationViewName(view)}`)
        .join("  ·  ");
    }
  }

  function getCollaborationViewName(view) {
    return ({
      arrangement: "Arrangement",
      sequencer: "Step Sequencer",
      "piano-roll": "Piano Roll",
      mixer: "Mixer",
      dj: "DJ",
    })[view] || "DansBPM";
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

  function createCollaborationSnapshot() {
    return { ...createStateSnapshot(), dj: getDjUndoSnapshot() };
  }

  function getWorkspaceCollaborationScope(target = "workspace") {
    if (target === "track-view") return "track-view";
    if (state.view === "sequencer") return state.selectedPatternId ? `pattern:${state.selectedPatternId}` : null;
    if (state.view === "piano-roll") return state.selectedMelId ? `mel:${state.selectedMelId}` : null;
    if (state.view === "mixer") return "mixer";
    if (state.view === "dj") return "dj";
    return null;
  }

  function collaborationScopesConflict(left, right) {
    if (!left || !right) return false;
    return left === right || left === "mixer" || right === "mixer" ||
      left === "track-view" && right.startsWith("pattern:") ||
      right === "track-view" && left.startsWith("pattern:");
  }

  function updateCollaborationLockUi() {
    const workspaceScope = getWorkspaceCollaborationScope();
    const trackScope = "track-view";
    [
      { target: "workspace", scope: workspaceScope, area: $("#workspace-area"), status: $("#workspace-lock-status") },
      { target: "track-view", scope: trackScope, area: $("#track-view-area"), status: $("#track-view-lock-status") },
    ].forEach(({ target, scope, area, status }) => {
      const actionScope = target === "workspace" && collaboration.editScope !== "track-view"
        ? collaboration.editScope || scope
        : scope;
      const owner = collaboration.locks.find((lock) => collaborationScopesConflict(lock.scope, actionScope));
      const editing = target === "workspace"
        ? Boolean(collaboration.editScope && collaboration.editScope !== "track-view")
        : collaboration.editScope === actionScope;
      const denied = owner && owner.ownerId !== collaboration.participantId;
      const anotherEditScope = collaboration.editScope && collaboration.editScope !== scope;
      if (area) area.inert = Boolean(collaboration.session && (denied || anotherEditScope));
      if (status) {
        status.hidden = !collaboration.session;
        status.textContent = !scope ? "Select a pattern or Mel to edit" :
          denied ? `Editing: ${owner.name}` :
            editing ? `Editing: ${collaboration.editScope}` : "Private until pushed";
      }
      document.querySelectorAll(`.collaboration-workspace-action[data-collaboration-scope="${target}"]`)
        .forEach((button) => {
          button.hidden = !collaboration.session;
          button.disabled = !actionScope || collaboration.pendingPush ||
            (button.dataset.collaborationAction !== "edit" && !editing) ||
            (button.dataset.collaborationAction === "edit" &&
              (editing || Boolean(denied) || Boolean(collaboration.pendingScope) ||
                Boolean(collaboration.editScope && collaboration.editScope !== actionScope)));
        });
    });
  }

  function copyCollaborationScope(target, source, scope) {
    const [type, id] = scope.includes(":") ? scope.split(":", 2) : [scope, ""];
    const mixerFields = [
      "volume", "pan", "automation", "automationOpen", "muted", "solo",
      "effects", "effectSettings", "effectChain",
    ];
    const copyItem = (key, itemId, preserveMixer = false) => {
      const sourceItem = source[key].find((item) => item.id === itemId);
      const index = target[key].findIndex((item) => item.id === itemId);
      const existing = index < 0 ? null : target[key][index];
      if (index >= 0) target[key].splice(index, 1);
      if (!sourceItem) return null;
      const result = { ...sourceItem };
      if (preserveMixer && existing) mixerFields.forEach((field) => {
        if (Object.hasOwn(existing, field)) result[field] = existing[field];
        else delete result[field];
      });
      if (index >= 0) target[key].splice(index, 0, result);
      else target[key].push(result);
      return result;
    };
    const copyPatternDependencies = (patternIds) => {
      const trackIds = new Set();
      patternIds.forEach((patternId) => {
        const pattern = copyItem("patterns", patternId, true);
        pattern?.trackIds?.forEach((trackId) => trackIds.add(trackId));
      });
      trackIds.forEach((trackId) => { copyItem("tracks", trackId, true); });
    };
    if (type === "pattern" || type === "mel") {
      const key = type === "pattern" ? "patterns" : "mels";
      const item = copyItem(key, id, type === "pattern");
      if (type === "pattern") copyPatternDependencies(item ? [id] : []);
      return;
    }
    if (type === "track-view") {
      [
        "patternClips", "arrangementBars", "arrangementCursor", "arrangementLoopEnabled",
        "arrangementLoopStartBar", "arrangementLoopEndBar", "arrangementSnap", "bpm", "swing",
      ].forEach((key) => { target[key] = source[key]; });
      const mixerFields = [
        "volume", "pan", "automation", "automationOpen", "muted", "solo",
        "effects", "effectSettings", "effectChain",
      ];
      ["arrangementTracks", "melTracks"].forEach((key) => {
        const targetItems = new Map(target[key].map((item) => [item.id, item]));
        target[key] = source[key].map((item) => {
          const result = { ...item };
          const existing = targetItems.get(item.id);
          if (existing) mixerFields.forEach((field) => {
            if (Object.hasOwn(existing, field)) result[field] = existing[field];
            else delete result[field];
          });
          return result;
        });
      });
      const patternIds = new Set(source.patternClips.flatMap((clip) =>
        [clip.patternId, clip.trackId].filter((value) => typeof value === "string")));
      copyPatternDependencies(patternIds);
      const melIds = new Set(source.melTracks.flatMap((track) =>
        (track.clips || []).map((clip) => clip.melId).filter((value) => typeof value === "string")));
      melIds.forEach((melId) => { copyItem("mels", melId); });
      return;
    }
    if (type === "mixer") {
      ["masterTrack", "effectTracks"].forEach((key) => { target[key] = source[key]; });
      const fields = [
        "volume", "pan", "muted", "solo", "automation", "automationOpen",
        "effects", "effectSettings", "effectChain",
      ];
      ["tracks", "patterns", "arrangementTracks", "melTracks"].forEach((key) => {
        const sourceItems = new Map(source[key].map((item) => [item.id, item]));
        target[key].forEach((item) => {
          const sharedItem = sourceItems.get(item.id);
          if (sharedItem) fields.forEach((field) => {
            if (Object.hasOwn(sharedItem, field)) item[field] = sharedItem[field];
            else delete item[field];
          });
        });
      });
      return;
    }
    if (type === "dj") target.dj = source.dj;
  }

  function beginWorkspaceCollaborationEdit(target) {
    if (!collaboration.session) return;
    const scope = getWorkspaceCollaborationScope(target);
    if (!scope) {
      showToast("Select a pattern or Mel before editing.");
      return;
    }
    collaboration.pendingScope = scope;
    updateCollaborationLockUi();
    if (!sendCollaborationMessage({ type: "lockWorkspace", scope })) {
      collaboration.pendingScope = null;
      updateCollaborationLockUi();
      renderCollaborationStatus("Connect to the collaboration server before reserving this workspace.");
    }
  }

  async function pushWorkspaceCollaborationChanges(target) {
    const scope = target === "workspace" && collaboration.editScope !== "track-view"
      ? collaboration.editScope
      : getWorkspaceCollaborationScope(target);
    if (!scope || collaboration.editScope !== scope || collaboration.pendingPush) return;
    try {
      collaboration.pendingPush = true;
      updateCollaborationLockUi();
      const assets = await getCollaborationAssets();
      const snapshot = createCollaborationSnapshot();
      const updateId = (collaboration.lastUpdateId || 0) + 1;
      collaboration.lastUpdateId = updateId;
      if (!sendCollaborationMessage({
        type: "pushWorkspace",
        scope,
        snapshot,
        assets,
        updateId,
      })) {
        throw new Error("the collaboration server is not connected");
      }
      collaboration.pendingPushScope = scope;
      collaboration.sentUpdates.set(updateId, { snapshot, assets });
      renderCollaborationStatus("Pushing workspace changes…");
    } catch (error) {
      collaboration.pendingPush = false;
      updateCollaborationLockUi();
      showToast(`Could not push workspace changes: ${error.message || "project data is unavailable"}`);
    }
  }

  async function discardWorkspaceCollaborationChanges(target) {
    const scope = target === "workspace" && collaboration.editScope !== "track-view"
      ? collaboration.editScope
      : getWorkspaceCollaborationScope(target);
    if (!scope || collaboration.editScope !== scope || !collaboration.sharedSnapshot) return;
    try {
      const merged = JSON.parse(JSON.stringify(createStateSnapshot()));
      copyCollaborationScope(merged, collaboration.sharedSnapshot, scope);
      const localAssets = await getCollaborationAssets();
      const applied = await applyCollaborationSnapshot(merged, localAssets, "The shared project");
      if (!applied) return;
      collaboration.localDirty = !collaborationValuesEqual(merged, collaboration.sharedSnapshot);
      collaboration.editScope = null;
      collaboration.session.localDirty = collaboration.localDirty;
      sendCollaborationMessage({ type: "unlockWorkspace", scope });
      updateCollaborationLockUi();
    } catch (error) {
      showToast(`Could not discard workspace changes: ${error.message || "project data is unavailable"}`);
    }
  }

  function sendCollaborationView() {
    if (!collaboration.session) return;
    collaboration.viewers = collaboration.viewers.map((viewer) =>
      viewer.id === collaboration.participantId ? { ...viewer, view: state.view } : viewer,
    );
    if (!collaboration.applyingRemote) {
      sendCollaborationMessage({ type: "view", view: state.view });
    }
    renderCollaborationStatus();
  }

  const COLLABORATION_MISSING = Symbol("missing collaboration value");

  function collaborationValuesEqual(left, right) {
    if (Object.is(left, right)) return true;
    if (Array.isArray(left) && Array.isArray(right)) {
      return left.length === right.length && left.every((value, index) =>
        collaborationValuesEqual(value, right[index]),
      );
    }
    if (left && right && typeof left === "object" && typeof right === "object") {
      const leftKeys = Object.keys(left).sort();
      const rightKeys = Object.keys(right).sort();
      return leftKeys.length === rightKeys.length &&
        leftKeys.every((key, index) => key === rightKeys[index] &&
          collaborationValuesEqual(left[key], right[key]));
    }
    return false;
  }

  function collaborationArrayById(value) {
    if (!Array.isArray(value)) return null;
    const entries = new Map();
    for (const item of value) {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || entries.has(item.id)) return null;
      entries.set(item.id, item);
    }
    return entries;
  }

  function mergeCollaborationValues(base, local, remote, path, conflicts) {
    if (collaborationValuesEqual(local, base)) return remote;
    if (collaborationValuesEqual(remote, base) || collaborationValuesEqual(local, remote)) return local;

    if (Array.isArray(local) && Array.isArray(remote) &&
      (base === COLLABORATION_MISSING || Array.isArray(base))) {
      const baseArray = base === COLLABORATION_MISSING ? [] : base;
      const baseById = collaborationArrayById(baseArray);
      const localById = collaborationArrayById(local);
      const remoteById = collaborationArrayById(remote);
      if (baseById && localById && remoteById &&
        (baseArray.length + local.length + remote.length > 0)) {
        const mergedById = new Map();
        const ids = new Set([...baseById.keys(), ...localById.keys(), ...remoteById.keys()]);
        ids.forEach((id) => {
          const value = mergeCollaborationValues(
            baseById.get(id) ?? COLLABORATION_MISSING,
            localById.get(id) ?? COLLABORATION_MISSING,
            remoteById.get(id) ?? COLLABORATION_MISSING,
            `${path}[${id}]`,
            conflicts,
          );
          if (value !== COLLABORATION_MISSING) mergedById.set(id, value);
        });

        const commonBaseIds = baseArray.map(({ id }) => id)
          .filter((id) => localById.has(id) && remoteById.has(id) && mergedById.has(id));
        const localBaseOrder = local.map(({ id }) => id).filter((id) => commonBaseIds.includes(id));
        const remoteBaseOrder = remote.map(({ id }) => id).filter((id) => commonBaseIds.includes(id));
        const localReordered = !collaborationValuesEqual(localBaseOrder, commonBaseIds);
        const remoteReordered = !collaborationValuesEqual(remoteBaseOrder, commonBaseIds);
        if (localReordered && remoteReordered &&
          !collaborationValuesEqual(localBaseOrder, remoteBaseOrder)) {
          conflicts.push(`${path} order`);
        }

        const preferredOrder = localReordered && !remoteReordered
          ? local.map(({ id }) => id)
          : remote.map(({ id }) => id);
        const order = [...preferredOrder, ...local.map(({ id }) => id)];
        return [...new Set(order)].filter((id) => mergedById.has(id)).map((id) => mergedById.get(id));
      }

      if (base !== COLLABORATION_MISSING && local.length === base.length && remote.length === base.length) {
        return local.map((value, index) => mergeCollaborationValues(
          base[index],
          value,
          remote[index],
          `${path}[${index}]`,
          conflicts,
        ));
      }
    }

    const baseIsRecord = base === COLLABORATION_MISSING ||
      (base && typeof base === "object" && !Array.isArray(base));
    if (baseIsRecord && local && remote &&
      typeof local === "object" && !Array.isArray(local) &&
      typeof remote === "object" && !Array.isArray(remote)) {
      const merged = {};
      const keys = new Set([
        ...(base === COLLABORATION_MISSING ? [] : Object.keys(base)),
        ...Object.keys(local),
        ...Object.keys(remote),
      ]);
      keys.forEach((key) => {
        const value = mergeCollaborationValues(
          base !== COLLABORATION_MISSING && Object.hasOwn(base, key) ? base[key] : COLLABORATION_MISSING,
          Object.hasOwn(local, key) ? local[key] : COLLABORATION_MISSING,
          Object.hasOwn(remote, key) ? remote[key] : COLLABORATION_MISSING,
          path ? `${path}.${key}` : key,
          conflicts,
        );
        if (value !== COLLABORATION_MISSING) merged[key] = value;
      });
      return merged;
    }

    conflicts.push(path || "project");
    return local;
  }

  function scheduleCollaborationAssetSync() {
    if (!collaboration.session || collaboration.applyingRemote) return;
    collaboration.assetsDirty = true;
    collaboration.localDirty = true;
    collaboration.session.assetsDirty = true;
    collaboration.session.localDirty = true;
    saveCollaborationSession();
  }

  async function reconcileCollaborationSnapshot(snapshot, assets, revision, sender, scope = "") {
    if (!collaboration.session || collaboration.conflicted || revision <= collaboration.revision) return;
    if (!isValidCollaborativeSnapshot(snapshot) || !collaboration.sharedSnapshot ||
      !Array.isArray(collaboration.sharedAssets)) {
      markCollaborationConflict(revision, sender);
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      markCollaborationConflict(revision, sender);
      return;
    }
    if (saveState.timeout) {
      collaboration.applyingRemote = true;
      try {
        if (!flushSaveState()) {
          markCollaborationConflict(revision, sender);
          return;
        }
      } finally {
        collaboration.applyingRemote = false;
      }
    }

    let localAssets;
    try {
      localAssets = await getCollaborationAssets();
    } catch (error) {
      showToast(`Could not reconcile project audio: ${error.message || "audio storage is unavailable"}`);
      markCollaborationConflict(revision, sender);
      return;
    }
    const localSnapshot = {
      ...createStateSnapshot(),
      ...(snapshot.dj ? { dj: getDjUndoSnapshot() } : {}),
    };
    const remoteAssets = Array.isArray(assets) ? assets : collaboration.sharedAssets;
    const localMergeSnapshot = JSON.parse(JSON.stringify(localSnapshot));
    if (scope) copyCollaborationScope(localMergeSnapshot, collaboration.sharedSnapshot, scope);
    const conflicts = [];
    const mergedSnapshot = mergeCollaborationValues(
      collaboration.sharedSnapshot,
      localMergeSnapshot,
      snapshot,
      "",
      conflicts,
    );
    ["patterns", "arrangementTracks", "melTracks"].forEach((collection) => {
      mergedSnapshot[collection].forEach((track) => {
        track.automation = normalizeTrackAutomation(track.automation);
      });
    });
    const localAssetsChanged = !collaborationValuesEqual(localAssets, collaboration.sharedAssets);
    const remoteAssetsChanged = !collaborationValuesEqual(remoteAssets, collaboration.sharedAssets);
    if (localAssetsChanged && remoteAssetsChanged &&
      !collaborationValuesEqual(localAssets, remoteAssets)) {
      conflicts.push("project audio");
    }
    if (conflicts.length) {
      markCollaborationConflict(revision, sender, conflicts[0]);
      return;
    }

    const mergedAssets = localAssetsChanged ? localAssets : remoteAssets;
    if (!await applyCollaborationSnapshot(mergedSnapshot, mergedAssets, sender)) {
      markCollaborationConflict(revision, sender);
      return;
    }
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    collaboration.revision = revision;
    collaboration.sharedSnapshot = snapshot;
    collaboration.sharedAssets = remoteAssets;
    collaboration.localDirty = false;
    collaboration.assetsDirty = false;
    collaboration.session.revision = revision;
    collaboration.session.localDirty = false;
    collaboration.session.assetsDirty = false;
    saveCollaborationSession();

    collaboration.localDirty = !collaborationValuesEqual(mergedSnapshot, snapshot);
    collaboration.assetsDirty = !collaborationValuesEqual(mergedAssets, remoteAssets);
    collaboration.session.localDirty = collaboration.localDirty;
    collaboration.session.assetsDirty = collaboration.assetsDirty;
    saveCollaborationSession();
    updateCollaborationLockUi();
    renderCollaborationStatus(`Connected to room ${collaboration.session.roomCode}.`);
  }

  function markCollaborationConflict(revision, sender, detail = "") {
    collaboration.conflicted = true;
    collaboration.conflictMessage =
      `Conflict: ${sender || "A collaborator"} updated the room${detail ? ` (${detail})` : ""}. Your edits are saved locally and were not shared.`;
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
      collaboration.editScope = null;
      collaboration.pendingScope = null;
      collaboration.pendingPush = false;
      collaboration.locks = [];
      updateCollaborationLockUi();
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
    const previousProjectCreationCounts = { ...state.projectCreationCounts };
    const previousProjects = [...state.projects];
    try {
      collaboration.session = { serverUrl, roomCode, projectId, revision };
      collaboration.sharedSnapshot = snapshot;
      collaboration.sharedAssets = assets || [];
      if (!saveCollaborationSession()) throw new Error("session storage is unavailable");
      getNextProjectNumber(state.currentUser);
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
      state.projectCreationCounts = previousProjectCreationCounts;
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
      if (snapshot.dj) restoreDjUndoSnapshot({ dj: snapshot.dj });
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
    if (typeof message.hostName === "string" || Array.isArray(message.activityLog)) {
      applyCollaborationMetadata(message);
    }
    if (message.type === "left") {
      if (collaboration.manualLeave) finishLeavingCollaborationRoom(true);
      return;
    }
    if (message.type === "snapshotConflict") {
      if (Number.isInteger(message.updateId) && message.updateId !== collaboration.lastUpdateId) {
        collaboration.sentUpdates.delete(message.updateId);
        return;
      }
      collaboration.sentUpdates.delete(message.updateId);
      collaboration.applyQueue = collaboration.applyQueue.then(() =>
        reconcileCollaborationSnapshot(message.snapshot, message.assets, message.revision, message.sender),
      );
      return;
    }
    if (message.type === "error") {
      collaboration.pendingScope = null;
      collaboration.pendingPush = false;
      collaboration.pendingPushScope = null;
      updateCollaborationLockUi();
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
    if (message.type === "workspaceLockGranted") {
      collaboration.pendingScope = null;
      collaboration.editScope = message.scope;
      collaboration.locks = message.locks || collaboration.locks;
      updateCollaborationLockUi();
      renderCollaborationStatus("Workspace reserved. Changes remain private until pushed.");
      return;
    }
    if (message.type === "workspaceLockDenied") {
      collaboration.pendingScope = null;
      collaboration.locks = message.locks || collaboration.locks;
      updateCollaborationLockUi();
      renderCollaborationStatus(message.reason || `Workspace is being edited by ${message.owner || "another collaborator"}.`);
      return;
    }
    if (message.type === "workspacePushAck") {
      collaboration.pendingPush = false;
      collaboration.editScope = null;
      collaboration.locks = message.locks || [];
      collaboration.pendingScope = null;
      collaboration.pendingPushScope = null;
      collaboration.sentUpdates.delete(message.updateId);
      collaboration.applyQueue = collaboration.applyQueue.then(async () => {
        await reconcileCollaborationSnapshot(
          message.snapshot,
          message.assets,
          message.revision,
          "Your push",
          message.scope,
        );
        updateCollaborationLockUi();
      });
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
      collaboration.lastRoomCode = message.roomCode;
      collaboration.participantNames = message.participants || [];
      collaboration.participantId = message.participantId || null;
      collaboration.viewers = message.viewers || [];
      collaboration.locks = message.locks || [];
      collaboration.sharedSnapshot = pending.snapshot;
      collaboration.sharedAssets = pending.assets || [];
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
      collaboration.participantId = message.participantId || collaboration.participantId;
      collaboration.viewers = message.viewers || collaboration.viewers;
      collaboration.locks = message.locks || collaboration.locks;
      updateCollaborationLockUi();
      if (!collaboration.session) {
        const pending = collaboration.pendingJoin;
        if (!pending) return;
        collaboration.pendingJoin = null;
        collaboration.sharedSnapshot = message.snapshot;
        collaboration.sharedAssets = message.assets || [];
        collaboration.participantId = message.participantId || null;
        collaboration.viewers = message.viewers || [];
        collaboration.locks = message.locks || [];
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
      if (collaboration.localDirty || collaboration.assetsDirty || saveState.timeout) {
        if (roomRevision > collaboration.revision) {
          collaboration.applyQueue = collaboration.applyQueue.then(() =>
            reconcileCollaborationSnapshot(message.snapshot, message.assets, roomRevision, message.sender, message.scope),
          );
        } else if (!collaboration.sharedSnapshot || roomRevision >= collaboration.revision) {
          collaboration.sharedSnapshot = message.snapshot;
          collaboration.sharedAssets = message.assets || [];
        }
        return;
      }
      if (roomRevision <= collaboration.revision) {
        collaboration.sharedSnapshot = message.snapshot;
        collaboration.sharedAssets = message.assets || [];
      }
      renderCollaborationStatus(`Connected to room ${collaboration.session.roomCode}.`);
    }
    if (message.type === "presence") {
      collaboration.participantNames = message.participants || [];
      collaboration.viewers = message.viewers || [];
      collaboration.locks = message.locks || [];
      updateCollaborationLockUi();
      renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
    }
    if (message.type === "snapshotAck") {
      const sentUpdate = collaboration.sentUpdates.get(message.updateId);
      if (message.updateId === collaboration.lastUpdateId && !collaboration.conflicted) {
        collaboration.localDirty = false;
        collaboration.assetsDirty = false;
        if (collaboration.session) {
          collaboration.session.localDirty = false;
          collaboration.session.assetsDirty = false;
        }
      }
      if (Number.isInteger(message.revision)) {
        if (message.revision >= collaboration.revision) {
          collaboration.revision = message.revision;
          if (sentUpdate && !collaboration.conflicted) {
            collaboration.sharedSnapshot = sentUpdate.snapshot;
            if (sentUpdate.assets) collaboration.sharedAssets = sentUpdate.assets;
          }
        }
        if (collaboration.session && !collaboration.conflicted && message.revision >= collaboration.revision) {
          collaboration.session.revision = message.revision;
          saveCollaborationSession();
        }
      }
      collaboration.sentUpdates.delete(message.updateId);
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
            await reconcileCollaborationSnapshot(
              message.snapshot,
              message.assets,
              revision,
              message.sender,
              message.scope,
            );
            return;
          }
          const applied = await applyCollaborationSnapshot(message.snapshot, message.assets, message.sender);
          if (applied && !collaboration.localDirty) {
            collaboration.assetsDirty = false;
            collaboration.revision = revision;
            collaboration.sharedSnapshot = message.snapshot;
            if (Array.isArray(message.assets)) collaboration.sharedAssets = message.assets;
            else if (!Array.isArray(collaboration.sharedAssets)) collaboration.sharedAssets = [];
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
        snapshot: createCollaborationSnapshot(),
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
            view: state.view,
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
        view: state.view,
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
    collaboration.editScope = null;
    collaboration.pendingScope = null;
    collaboration.locks = [];
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
        view: state.view,
      }));
    });
  }

  function leaveCollaborationRoom() {
    if (!collaboration.session) return;
    flushSaveState();
    collaboration.manualLeave = true;
    if (!sendCollaborationMessage({ type: "leave" })) {
      finishLeavingCollaborationRoom();
      return;
    }
    renderCollaborationStatus("Leaving room…");
    window.clearTimeout(collaborationLeaveTimeout);
    collaborationLeaveTimeout = window.setTimeout(finishLeavingCollaborationRoom, 1800);
  }

  function finishLeavingCollaborationRoom(serverConfirmed = false) {
    window.clearTimeout(collaborationLeaveTimeout);
    collaborationLeaveTimeout = null;
    if (!collaboration.session) return;
    collaboration.lastRoomCode = collaboration.session.roomCode;
    if (!serverConfirmed) {
      recordLocalCollaborationActivity("left", getCurrentUserName());
    }
    collaboration.socket?.close();
    collaboration.socket = null;
    collaboration.session = null;
    collaboration.localDirty = false;
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    collaboration.participantId = null;
    collaboration.viewers = [];
    collaboration.locks = [];
    collaboration.editScope = null;
    collaboration.pendingScope = null;
    collaboration.pendingPush = false;
    collaboration.sharedSnapshot = null;
    collaboration.sharedAssets = null;
    collaboration.sentUpdates.clear();
    saveCollaborationSession();
    updateCollaborationLockUi();
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
      if (getCloudToken()) saveCloudProjectSnapshot(projectId, snapshot);
      else window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
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
      if (getCloudToken()) project.localDirty = true;
      try {
        writeProjectCatalog();
      } catch {
        showToast("Project saved, but its saved-project list could not be updated.");
      }
      if (collaboration.session && !collaboration.applyingRemote && projectId === state.projectId) {
        collaboration.localDirty = true;
        collaboration.session.localDirty = true;
        saveCollaborationSession();
      }
    }
    const cloudPending = Boolean(project && getCloudToken());
    $("#save-state").textContent = cloudPending ? "Local save · click Save to sync" : "All changes saved";
    $(".save-dot").style.background = cloudPending ? "#c8a95a" : "#7f9d43";
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
    if (!state.currentUser || collaboration.applyingRemote) return;
    if (state.view === "piano-roll") captureCurrentMel();
    const saveDot = $(".save-dot");
    $("#save-state").textContent = "Saving…";
    saveDot.style.background = "#c8a95a";
    const snapshot = createStateSnapshot();
    updateProjectKeyIndicator();
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
      automation: normalizeTrackAutomation(track.automation),
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
      masterMuted: djState.masterMuted,
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
          muted: deck.muted,
          filter: deck.filter,
          eqLow: deck.eqLow,
          eqMid: deck.eqMid,
          eqHigh: deck.eqHigh,
          pitch: deck.pitch,
          syncRate: deck.syncRate,
          reverse: deck.reverse,
          startOffsetBars: deck.startOffsetBars,
          loop: deck.loop ? { ...deck.loop } : null,
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
          pianoScaleRoot: saved.pianoScaleRoot,
          pianoScaleType: saved.pianoScaleType,
          pianoScaleLock: saved.pianoScaleLock,
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
      masterMuted: dj.masterMuted,
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
      state.pianoScaleRoot = saved.pianoScaleRoot;
      state.pianoScaleType = saved.pianoScaleType;
      state.pianoScaleLock = saved.pianoScaleLock;
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
    const projects = getCurrentUserProjects();
    if (!projects.some((project) => project.id === selectedProjectId)) {
      selectedProjectId = state.projectId;
    }
    list.replaceChildren();
    projects.forEach((project) => {
      const button = document.createElement("button");
      button.className = `project-list-item${project.id === state.projectId ? " is-current" : ""}${project.id === selectedProjectId ? " is-selected" : ""}`;
      button.type = "button";
      button.setAttribute("aria-pressed", String(project.id === selectedProjectId));
      const name = document.createElement("span");
      name.className = "project-list-name";
      name.textContent = project.name;
      const detail = document.createElement("span");
      detail.className = "project-list-detail";
      detail.textContent = project.cloudBacked
        ? project.cloudHasFile
          ? `CLOUD · SAVED ${new Date(project.updatedAt).toLocaleDateString()}`
          : "CLOUD · NOT SAVED YET"
        : project.id === state.projectId
          ? "CURRENT PROJECT"
          : project.updatedAt ? `SAVED ${new Date(project.updatedAt).toLocaleDateString()}` : "NOT SAVED YET";
      button.append(name, detail);
      button.addEventListener("click", () => {
        selectedProjectId = project.id;
        renderProjectList();
      });
      list.append(button);
    });
    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    const cloudNeedsDownload = projectNeedsCloudDownload(selectedProject);
    $("#enter-project-button").disabled = !selectedProject ||
      selectedProject.id === state.projectId && !cloudNeedsDownload;
    $("#delete-project-button").disabled = !selectedProject;
    $("#delete-project-button").title = "Permanently delete the selected project and its saved audio.";
  }

  function enterSelectedProject() {
    if (selectedProjectId) void switchProject(selectedProjectId);
  }

  async function deleteSelectedProject() {
    const project = state.projects.find((item) =>
      item.id === selectedProjectId && item.ownerId === state.currentUser);
    if (!project) return;
    const isCurrentProject = project.id === state.projectId;
    if (isCurrentProject && state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before deleting the current project.");
      return;
    }
    if (isCurrentProject && collaboration.session) {
      showToast("Leave the collaboration room before deleting the current project.");
      return;
    }
    if (!window.confirm(`Permanently delete "${project.name}" and its saved audio?`)) return;
    if (isCurrentProject && !flushSaveState()) {
      showToast("Could not save this project; deletion was cancelled.");
      return;
    }

    const snapshotKey = getProjectStorageKey(project.id);
    const djKey = `${snapshotKey}:dj`;
    const legacySnapshotKey = project.id === "default" ? STORAGE_KEY : null;
    const legacyNameKey = project.id === "default" ? `${STORAGE_KEY}-name` : null;
    const previousProjects = [...state.projects];
    const previousActiveProjectIds = { ...state.activeProjectIds };
    const previousProjectCreationCounts = { ...state.projectCreationCounts };
    const previousProjectId = state.projectId;
    const previousProjectName = state.projectName;
    const previousSelectedProjectId = selectedProjectId;
    let projectSnapshot = null;
    let djSnapshot = null;
    let legacySnapshot = null;
    let legacyName = null;
    try {
      if (project.cloudBacked) {
        await deleteCloudProject(project.id);
        project.cloudBacked = false;
        project.cloudHasFile = false;
        project.cloudRevision = 0;
        project.localCloudRevision = null;
        project.localDirty = true;
      }
      projectSnapshot = window.localStorage.getItem(snapshotKey);
      djSnapshot = window.localStorage.getItem(djKey);
      if (legacySnapshotKey) legacySnapshot = window.localStorage.getItem(legacySnapshotKey);
      if (legacyNameKey) legacyName = window.localStorage.getItem(legacyNameKey);
      if (isCurrentProject) {
        let replacement = getCurrentUserProjects().find((item) => item.id !== project.id);
        if (!replacement) {
          replacement = {
            id: makeId(),
            name: `New Proj ${getNextProjectNumber(state.currentUser)}`,
            ownerId: state.currentUser,
            updatedAt: Date.now(),
          };
          state.projects.unshift(replacement);
        }
        state.projectId = replacement.id;
        state.projectName = replacement.name;
        state.activeProjectIds = { ...state.activeProjectIds, [state.currentUser]: replacement.id };
        selectedProjectId = replacement.id;
        updateProjectNameLabel();
      }
      state.projects = state.projects.filter((item) => item.id !== project.id);
      window.localStorage.removeItem(snapshotKey);
      window.localStorage.removeItem(djKey);
      if (legacySnapshotKey) window.localStorage.removeItem(legacySnapshotKey);
      if (legacyNameKey) window.localStorage.removeItem(legacyNameKey);
      writeProjectCatalog();
      await replaceProjectRecordingAssets(project.id, []);
      if (isCurrentProject) {
        if (state.isPlaying) stopPlayback();
        stopAllWorkspacePlayers();
        window.location.reload();
        return;
      }
      selectedProjectId = state.projectId;
      renderProjectList();
      showToast(`${project.name} deleted`);
    } catch (error) {
      state.projects = previousProjects;
      state.projectId = previousProjectId;
      state.projectName = previousProjectName;
      state.activeProjectIds = previousActiveProjectIds;
      state.projectCreationCounts = previousProjectCreationCounts;
      selectedProjectId = previousSelectedProjectId;
      updateProjectNameLabel();
      try {
        if (projectSnapshot !== null) window.localStorage.setItem(snapshotKey, projectSnapshot);
        if (djSnapshot !== null) window.localStorage.setItem(djKey, djSnapshot);
        if (legacySnapshotKey && legacySnapshot !== null) window.localStorage.setItem(legacySnapshotKey, legacySnapshot);
        if (legacyNameKey && legacyName !== null) window.localStorage.setItem(legacyNameKey, legacyName);
        writeProjectCatalog();
      } catch (rollbackError) {
        renderProjectList();
        showToast(`Could not delete ${project.name}; rollback was incomplete: ${rollbackError.message || "browser storage is unavailable"}`);
        return;
      }
      renderProjectList();
      showToast(`Could not delete ${project.name}: ${error.message || "browser storage is unavailable"}`);
    }
  }

  async function switchProject(projectId) {
    const project = state.projects.find((item) =>
      item.id === projectId && item.ownerId === state.currentUser);
    if (!project) return;
    const cloudNeedsDownload = projectNeedsCloudDownload(project);
    if (projectId === state.projectId && !cloudNeedsDownload) return;
    if (projectId === state.projectId && cloudNeedsDownload) {
      if (project.localDirty) {
        showToast("Save this browser's changes to the cloud before opening the newer cloud copy.");
        return;
      }
      try {
        await downloadProjectToBrowser(project);
        window.location.reload();
      } catch (error) {
        showToast(`Could not download ${project.name}: ${error.message || "the cloud server is unavailable"}`);
      }
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before switching projects.");
      return;
    }
    if (!flushSaveState()) {
      if (!getCloudToken() || saveState.lastError !== "browser storage is full.") {
        showToast("Could not save this project; switching was cancelled.");
        return;
      }
      if (!await saveProjectNow()) return;
    }
    if (cloudNeedsDownload) {
      if (project.localDirty) {
        showToast(`Save ${project.name}'s local changes to the cloud before opening it.`);
        return;
      }
      try {
        await downloadProjectToBrowser(project);
      } catch (error) {
        showToast(`Could not download ${project.name}: ${error.message || "the cloud server is unavailable"}`);
        return;
      }
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

  async function createProject() {
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
    const previousProjectCreationCounts = { ...state.projectCreationCounts };
    const project = {
      id: makeId(),
      name: `New Proj ${getNextProjectNumber(state.currentUser)}`,
      ownerId: state.currentUser,
      updatedAt: 0,
    };
    const previousProjectId = state.projectId;
    state.projects.unshift(project);
    state.projectId = project.id;
    try {
      writeProjectCatalog();
      if (getCloudToken()) {
        try {
          Object.assign(project, await createCloudProjectRecord(project), { cloudBacked: true });
          project.cloudHasFile = project.hasFile === true;
          project.cloudRevision = project.revision || 0;
          writeProjectCatalog();
        } catch (error) {
          showToast(`Project created locally, but cloud registration failed: ${error.message || "the server is unavailable"}`);
        }
      }
      window.location.reload();
    } catch (error) {
      state.projects = state.projects.filter((item) => item.id !== project.id);
      state.projectId = previousProjectId;
      state.projectCreationCounts = previousProjectCreationCounts;
      showToast(`Could not create project: ${error.message || "storage is unavailable"}`);
    }
  }

