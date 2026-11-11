  function stopRecordingPreview() {
    if (state.recordingPreviewTimer !== null) window.clearInterval(state.recordingPreviewTimer);
    state.recordingPreviewTimer = null;
    const preview = state.recordingPreview;
    state.recordingPreview = null;
    preview?.source.disconnect();
    preview?.analyser.disconnect();
    return preview;
  }

  function removeEmptyRecordingTrack(track) {
    if (track.clips.length) return;
    state.arrangementTracks = state.arrangementTracks.filter((item) => item !== track);
    renderArrangement();
  }

  function cancelRecordingCountdown() {
    if (state.recordingCountdownTimer !== null) window.clearTimeout(state.recordingCountdownTimer);
    state.recordingCountdownTimer = null;
    stopRecordingMetronome();
    state.recordingStream?.getTracks().forEach((track) => track.stop());
    state.recordingStream = null;
    state.mediaRecorder = null;
    resetRecordingControls();
    showToast("Recording cancelled before it started.");
  }

  function startRecordingAfterCountIn(recorder) {
    let beatsRemaining = 4;
    const countBeat = () => {
      beatsRemaining -= 1;
      if (beatsRemaining === 0) {
        state.recordingCountdownTimer = null;
        try {
          state.recordingStartBar = state.arrangementCursor;
          recorder.start();
          try {
            startRecordingPreview(state.recordingStream);
          } catch (error) {
            showToast(`Recording started, but the live track preview is unavailable: ${error.message || "unknown error"}`);
          }
          $("#record-button-label").textContent = "Stop recording";
          showToast(`Recording from bar ${Math.floor(state.recordingStartBar) + 1}`);
        } catch (error) {
          stopRecordingMetronome();
          state.recordingStream?.getTracks().forEach((track) => track.stop());
          state.recordingStream = null;
          state.mediaRecorder = null;
          resetRecordingControls();
          showToast(`Could not start recording: ${error.message || "unknown error"}`);
        }
        return;
      }
      $("#record-button-label").textContent = `Count-in ${beatsRemaining}`;
      state.recordingCountdownTimer = window.setTimeout(countBeat, 60000 / state.bpm);
    };
    state.recordingCountdownTimer = window.setTimeout(countBeat, 60000 / state.bpm);
  }

  async function toggleAudioRecording() {
    if (state.recordingCountdownTimer !== null) {
      cancelRecordingCountdown();
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      $("#record-audio-button").disabled = true;
      $("#record-button-label").textContent = "Saving recording…";
      stopRecordingMetronome();
      state.mediaRecorder.stop();
      return;
    }
    if (!window.navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast("Microphone recording is not supported in this browser.");
      return;
    }
    try {
      $("#record-audio-button").disabled = true;
      $("#record-button-label").textContent = "Requesting mic…";
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      state.recordingStream = stream;
      await ensureAudio();
      state.recordingChunks = [];
      const mimeType = window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      state.mediaRecorder = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) state.recordingChunks.push(event.data);
      });
      recorder.addEventListener("error", () => showToast("Microphone recording stopped because of an error."));
      recorder.addEventListener("stop", async () => {
        state.recordingCountdownTimer = null;
        stopRecordingMetronome();
        const preview = stopRecordingPreview();
        stream.getTracks().forEach((track) => track.stop());
        state.recordingStream = null;
        state.mediaRecorder = null;
        const chunks = state.recordingChunks;
        state.recordingChunks = [];
        resetRecordingControls();
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) {
          if (preview) removeEmptyRecordingTrack(preview.track);
          showToast("No audio was captured.");
          return;
        }
        const extension = blob.type.includes("ogg") ? "ogg" : "webm";
        const name = `Recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
        try {
          await importRecording(
            new File([blob], name, { type: blob.type }),
            preview?.track.id || null,
            state.recordingStartBar,
            false,
          );
          if (preview && !preview.track.clips.length) removeEmptyRecordingTrack(preview.track);
        } catch (error) {
          if (preview) removeEmptyRecordingTrack(preview.track);
          showToast(`Could not add recording: ${error.message || "unknown error"}`);
        }
      });
      $("#record-audio-button").classList.add("is-recording");
      $("#record-audio-button").disabled = false;
      $("#record-audio-button").setAttribute("aria-pressed", "true");
      $("#record-button-label").textContent = "Count-in 4";
      startRecordingMetronome();
      startRecordingAfterCountIn(recorder);
      showToast("Count-in: 4 beats before recording starts");
    } catch (error) {
      stopRecordingMetronome();
      if (state.recordingCountdownTimer !== null) window.clearTimeout(state.recordingCountdownTimer);
      state.recordingCountdownTimer = null;
      state.recordingStream?.getTracks().forEach((track) => track.stop());
      state.recordingStream = null;
      state.mediaRecorder = null;
      resetRecordingControls();
      showToast(`Microphone unavailable: ${error.message || "permission was denied"}`);
    }
  }

  function moveArrangementClip(clipId, sourceTrackId, destinationTrackId, startBar) {
    const source = state.arrangementTracks.find((track) => track.id === sourceTrackId);
    const destination = state.arrangementTracks.find((track) => track.id === destinationTrackId);
    const clipIndex = source?.clips.findIndex((clip) => clip.id === clipId) ?? -1;
    if (!source || !destination || clipIndex < 0) return;
    const [clip] = source.clips.splice(clipIndex, 1);
    clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("audio", clip));
    destination.clips.push(clip);
    destination.clips.sort((left, right) => left.startBar - right.startBar);
    if (source !== destination && source.clips.length === 0) {
      state.arrangementTracks = state.arrangementTracks.filter((track) => track !== source);
    }
    updateArrangementLength();
    renderArrangement();
    saveState();
    persistClip(destination, clip).catch(() => showToast("Clip moved, but browser storage could not be updated."));
    if (source !== destination) persistTrackClips(source);
  }

  function moveArrangementClipToNewTrack(clipId, sourceTrackId, startBar) {
    const source = state.arrangementTracks.find((track) => track.id === sourceTrackId);
    if (!source?.clips.some((clip) => clip.id === clipId)) return;
    const destination = {
      ...source,
      id: makeId(),
      clips: [],
      gainNode: null,
      fxRuntime: null,
      analyser: null,
      sourceGains: null,
      effectChain: [...(source.effectChain || [])],
      automation: normalizeTrackAutomation(source.automation),
      automationOpen: source.automationOpen === true,
      effects: makeDefaultEffects(source.effects),
      effectSettings: makeDefaultEffectSettings(source.effectSettings),
    };
    state.arrangementTracks.push(destination);
    ensureArrangementTrackAudio(destination);
    moveArrangementClip(clipId, source.id, destination.id, startBar);
  }

  function openRecordingDb() {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open("pulsegrid-recordings", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("recordings")) request.result.createObjectStore("recordings", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open recording storage"));
    });
  }

  function formatStorageSize(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(unitIndex > 0 && size < 10 ? 1 : 0)} ${units[unitIndex]}`;
  }

  async function updateStorageIndicator() {
    const indicator = $("#storage-indicator");
    const value = $("#storage-usage");
    const fill = $("#storage-meter-fill");
    if (!indicator || !value || !fill) return;

    if (!navigator.storage?.estimate) {
      value.textContent = "Storage unavailable";
      indicator.title = "This browser does not provide storage estimates.";
      indicator.setAttribute("aria-label", indicator.title);
      return;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota;
      const indexedDbUsage = estimate.usageDetails?.indexedDB;
      const hasIndexedDbUsage = Number.isFinite(indexedDbUsage);
      const usage = hasIndexedDbUsage ? indexedDbUsage : estimate.usage;
      if (!Number.isFinite(usage) || !Number.isFinite(quota) || quota <= 0) {
        throw new Error("The browser did not provide a valid storage estimate.");
      }

      const percent = Math.min(100, Math.max(0, usage / quota * 100));
      const usageLabel = `${hasIndexedDbUsage ? "IDB" : "Site"} ${formatStorageSize(usage)} / ${formatStorageSize(quota)}`;
      value.textContent = usageLabel;
      fill.style.width = `${percent}%`;
      indicator.dataset.level = percent >= 90 ? "critical" : percent >= 70 ? "warning" : "normal";
      indicator.title = hasIndexedDbUsage
        ? `IndexedDB uses ${formatStorageSize(usage)} of an estimated ${formatStorageSize(quota)} browser storage quota.`
        : `IndexedDB usage is not reported separately; showing total site storage (${formatStorageSize(usage)} of ${formatStorageSize(quota)} estimated).`;
      indicator.setAttribute("aria-label", indicator.title);
    } catch (error) {
      value.textContent = "Storage unavailable";
      fill.style.width = "0";
      indicator.title = `Could not estimate browser storage: ${error.message || "unknown error"}`;
      indicator.setAttribute("aria-label", indicator.title);
    }
  }

  function persistClip(track, clip) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      transaction.objectStore("recordings").put({
        id: clip.id,
        projectId: state.projectId,
        trackId: track.id,
        trackName: track.name,
        color: track.color,
        name: clip.name,
        startBar: clip.startBar,
        durationSeconds: clip.durationSeconds,
        sourceOffsetSeconds: clip.sourceOffsetSeconds || 0,
        repeatCount: clip.repeatCount || 1,
        clipGain: Number.isFinite(clip.clipGain) ? Math.max(0, Math.min(2, clip.clipGain)) : 1,
        fadeInSeconds: clip.fadeInSeconds || 0,
        fadeOutSeconds: clip.fadeOutSeconds || 0,
        reversed: clip.reversed === true,
        audioMetadata: normalizeAudioMetadata(clip.audioMetadata),
        volume: track.volume,
        muted: track.muted,
        blob: clip.blob,
      });
      transaction.oncomplete = () => {
        database.close();
        resolve();
        updateStorageIndicator();
        scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save recording")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Recording save was cancelled")); };
    }));
  }

  function getDrumSampleRecordId(trackId, projectId = state.projectId) {
    return `drum-sample:${projectId}:${trackId}`;
  }

  function persistDrumSample(track, file) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      store.put({
        id: getDrumSampleRecordId(track.id),
        projectId: state.projectId,
        recordType: "drum-sample",
        trackId: track.id,
        trackName: track.name,
        fileName: file.name,
        color: track.color,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        pitch: track.pitch || 0,
        swing: Number.isFinite(track.swing) ? track.swing : null,
        cells: track.cells,
        audioMetadata: normalizeAudioMetadata(track.audioMetadata),
        blob: file,
      });
      const legacyRecord = store.get(`drum-sample:${track.id}`);
      legacyRecord.onsuccess = () => {
        const record = legacyRecord.result;
        if (record && (record.projectId === state.projectId ||
          (!record.projectId && state.projectId === "default"))) {
          store.delete(record.id);
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve();
        updateStorageIndicator();
        scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save drum sample")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Drum sample save was cancelled")); };
    }));
  }

  function deletePersistedDrumSample(trackId) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      store.delete(getDrumSampleRecordId(trackId));
      const legacyRecord = store.get(`drum-sample:${trackId}`);
      legacyRecord.onsuccess = () => {
        const record = legacyRecord.result;
        if (record && (record.projectId === state.projectId ||
          (!record.projectId && state.projectId === "default"))) {
          store.delete(record.id);
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve();
        updateStorageIndicator();
        scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not remove drum sample")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Drum sample removal was cancelled")); };
    }));
  }

  function persistTrackClips(track) {
    track.clips.forEach((clip) => persistClip(track, clip).catch(() => {
      showToast("Could not save the latest track changes.");
    }));
  }

  function deletePersistedClip(clipId) {
    openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      transaction.objectStore("recordings").delete(clipId);
      transaction.oncomplete = () => { database.close(); resolve(); updateStorageIndicator(); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not remove recording")); };
    })).then(() => scheduleCollaborationAssetSync())
      .catch(() => showToast("The clip was removed, but browser storage could not be updated."));
  }

  async function restoreArrangement() {
    if (!window.indexedDB) return;
    try {
      const database = await openRecordingDb();
      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction("recordings", "readonly");
        const request = transaction.objectStore("recordings").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Could not read saved recordings"));
        transaction.oncomplete = () => database.close();
      });
      const projectRecords = records.filter((record) =>
        record.projectId === state.projectId || (!record.projectId && state.projectId === "default"));
      if (!projectRecords.length) return;
      initializeAudio();
      const sampleRecords = projectRecords.filter((record) => record.recordType === "drum-sample");
      for (const record of sampleRecords) {
        try {
          const buffer = await state.audioContext.decodeAudioData(await record.blob.arrayBuffer());
          let track = state.tracks.find((item) => item.id === record.trackId);
          if (!track) {
            track = makeDrumSampleTrack({
              id: record.trackId,
              name: record.trackName,
              fileName: record.fileName,
              color: record.color,
              volume: record.volume,
              muted: record.muted,
              solo: record.solo,
              pitch: record.pitch,
              swing: record.swing,
              cells: record.cells,
              audioMetadata: record.audioMetadata || detectAudioMetadata(buffer),
              buffer,
            });
            state.tracks.push(track);
            const pattern = getPattern();
            if (pattern) {
              pattern.trackIds = [...getPatternTrackIds(pattern), track.id];
              pattern.cells[track.id] = Array.from({ length: STEP_COUNT }, (_, index) => record.cells?.[index] === true);
            }
          } else {
            track.sample = { name: record.fileName || record.trackName, buffer };
            track.audioMetadata = record.audioMetadata
              ? normalizeAudioMetadata(record.audioMetadata)
              : detectAudioMetadata(buffer);
            ensureSequencerTrackAudio(track);
            if (track.kind === "sample") track.subtitle = "Imported drum sample";
          }
        } catch {
          showToast(`Could not restore ${record.fileName || record.trackName || "a drum sample"}.`);
        }
      }
      const sampleRecordIds = new Set(sampleRecords.map((record) => record.trackId));
      state.tracks.filter((track) => track.sourceId && !sampleRecordIds.has(track.id)).forEach((layer) => {
        const source = state.tracks.find((track) => track.id === layer.sourceId);
        layer.sample = source?.sample ? { ...source.sample } : null;
        ensureSequencerTrackAudio(layer);
      });

      const clipRecords = projectRecords.filter((record) => record.recordType !== "drum-sample");
      for (const record of clipRecords) {
        let track = state.arrangementTracks.find((item) => item.id === record.trackId);
        if (!track) {
          track = {
            id: record.trackId,
            name: record.trackName,
            color: record.color,
            clips: [],
            volume: record.volume,
            automation: normalizeTrackAutomation(),
            automationOpen: false,
            muted: record.muted,
            solo: false,
            effects: makeDefaultEffects(),
            gainNode: null,
          };
          state.arrangementTracks.push(track);
          ensureArrangementTrackAudio(track);
        }
        try {
          const buffer = await state.audioContext.decodeAudioData(await record.blob.arrayBuffer());
          track.clips.push({
            id: record.id,
            name: record.name,
            startBar: record.startBar,
            durationSeconds: Number.isFinite(record.durationSeconds) ? record.durationSeconds : buffer.duration,
            sourceOffsetSeconds: Number.isFinite(record.sourceOffsetSeconds) ? record.sourceOffsetSeconds : 0,
            repeatCount: Number.isInteger(record.repeatCount) ? Math.max(1, record.repeatCount) : 1,
            clipGain: Number.isFinite(record.clipGain) ? Math.max(0, Math.min(2, record.clipGain)) : 1,
            fadeInSeconds: Number.isFinite(record.fadeInSeconds)
              ? Math.max(0, Math.min(10, record.fadeInSeconds)) : 0,
            fadeOutSeconds: Number.isFinite(record.fadeOutSeconds)
              ? Math.max(0, Math.min(10, record.fadeOutSeconds)) : 0,
            reversed: record.reversed === true,
            buffer,
            blob: record.blob,
            audioMetadata: record.audioMetadata
              ? normalizeAudioMetadata(record.audioMetadata)
              : detectAudioMetadata(buffer),
          });
        } catch {
          showToast(`Could not restore ${record.name}.`);
        }
      }
      if (sampleRecords.length) renderTracks();
      updateArrangementLength();
      renderArrangement();
      if (state.arrangementTracks.length) showToast("Your saved recordings are ready.");
      else if (sampleRecords.length) showToast("Your saved drum sounds are ready.");
    } catch {
      showToast("Saved recordings could not be restored.");
    }
  }

  function updateTrackGains() {
    if (!state.audioContext) return;
    const allTracks = [
      ...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
      ...state.effectTracks, state.masterTrack,
    ].filter(Boolean);
    const hasSolo = [...state.tracks, ...state.arrangementTracks].some((track) => track.solo);
    const hasArrangementSolo = [...state.patterns, ...state.melTracks, ...state.arrangementTracks]
      .some((track) => track.solo);
    allTracks.forEach((track) => {
      track.panNode?.pan.setTargetAtTime(track.pan, state.audioContext.currentTime, 0.015);
      if (!track.gainNode) return;
      const isBus = track.kind === "mixer-master" || track.kind === "mixer-effects";
      const isArrangementTrack = track.kind === "pattern" || track.kind === "mel" ||
        state.arrangementTracks.includes(track);
      const isSilent = track.muted ||
        (isArrangementTrack && hasArrangementSolo && !track.solo) ||
        (!isBus && !isArrangementTrack && hasSolo && !track.solo) ||
        (state.arrangementTracks.includes(track) && hasSolo && !track.solo);
      track.gainNode.gain.setTargetAtTime(isSilent ? 0 : track.volume, state.audioContext.currentTime, 0.015);
    });
  }

