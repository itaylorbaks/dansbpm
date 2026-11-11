  const USER_SETTINGS_KEY = "dansbpm-user-settings-v1";
  const COLLABORATION_ACTIVITY_KEY = "dansbpm-collaboration-activity-v1";
  const MAX_COLLABORATION_ACTIVITY = 100;
  const userSettings = {
    audioInputDeviceId: "",
    audioOutputDeviceId: "",
    drummerDeviceId: "",
    metronomeVolume: 100,
    theme: "dark",
    accent: "lime",
  };
  let drummerAudio = null;
  let drummerDestination = null;
  let drummerGainNode = null;
  let drummerConnected = false;

  function initializeSettings() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(USER_SETTINGS_KEY) || "null");
      if (saved && typeof saved === "object") {
        Object.assign(userSettings, {
          audioInputDeviceId: typeof saved.audioInputDeviceId === "string" ? saved.audioInputDeviceId : "",
          audioOutputDeviceId: typeof saved.audioOutputDeviceId === "string" ? saved.audioOutputDeviceId : "",
          drummerDeviceId: typeof saved.drummerDeviceId === "string" ? saved.drummerDeviceId : "",
          metronomeVolume: Number.isFinite(saved.metronomeVolume)
            ? Math.round(Math.max(0, Math.min(100, saved.metronomeVolume)))
            : 100,
          theme: saved.theme === "light" ? "light" : "dark",
          accent: ["lime", "blue", "violet", "coral"].includes(saved.accent) ? saved.accent : "lime",
        });
      }
    } catch (error) {
      showToast(`Could not load settings: ${error.message || "browser storage is unavailable"}`);
    }

    document.documentElement.dataset.theme = userSettings.theme;
    document.documentElement.dataset.accent = userSettings.accent;
    $("#settings-theme").value = userSettings.theme;
    $("#settings-accent").value = userSettings.accent;
    $("#settings-audio-input").value = userSettings.audioInputDeviceId;
    $("#settings-audio-output").value = userSettings.audioOutputDeviceId;
    $("#settings-drummer-output").value = userSettings.drummerDeviceId;
    const metronomeVolume = $("#metronome-volume");
    metronomeVolume.value = String(userSettings.metronomeVolume);
    updateMetronomeVolumeUI();
    metronomeVolume.addEventListener("input", () => {
      userSettings.metronomeVolume = Number(metronomeVolume.value);
      updateMetronomeVolumeUI();
    });
    metronomeVolume.addEventListener("change", persistUserSettings);
    $("#settings-button").addEventListener("click", () => {
      $("#settings-dialog").showModal();
      void refreshAudioDevices();
      renderCollaborationActivityLog();
    });
    $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
    $("#settings-theme").addEventListener("change", (event) => {
      userSettings.theme = event.target.value === "light" ? "light" : "dark";
      document.documentElement.dataset.theme = userSettings.theme;
      persistUserSettings();
    });
    $("#settings-accent").addEventListener("change", (event) => {
      userSettings.accent = ["lime", "blue", "violet", "coral"].includes(event.target.value)
        ? event.target.value
        : "lime";
      document.documentElement.dataset.accent = userSettings.accent;
      persistUserSettings();
    });
    $("#settings-audio-input").addEventListener("change", (event) => {
      userSettings.audioInputDeviceId = event.target.value;
      persistUserSettings();
      $("#settings-audio-status").textContent = "Input selection applies to the next recording.";
    });
    $("#settings-audio-output").addEventListener("change", (event) => {
      userSettings.audioOutputDeviceId = event.target.value;
      persistUserSettings();
      void applySelectedAudioOutput().then((applied) => {
        if (applied) {
          $("#settings-audio-status").textContent = userSettings.audioOutputDeviceId
            ? "Audio output updated."
            : "Using the system default output.";
        }
      }).catch((error) => {
        $("#settings-audio-status").textContent = error.message || "Could not change the audio output.";
      });
    });
    $("#settings-drummer-output").addEventListener("change", (event) => {
      userSettings.drummerDeviceId = event.target.value;
      persistUserSettings();
    });
    $("#settings-refresh-devices").addEventListener("click", () => void refreshAudioDevices());
    $("#settings-choose-output").addEventListener("click", () => void chooseAudioOutput("audioOutputDeviceId"));
    $("#settings-choose-drummer").addEventListener("click", () => void chooseAudioOutput("drummerDeviceId"));
    $("#settings-connect-drummer").addEventListener("click", () => {
      if (drummerConnected) {
        disconnectDrummerOutput();
        return;
      }
      void connectDrummerOutput();
    });
    loadCollaborationActivity();
    renderCollaborationActivityLog();
  }

  function persistUserSettings() {
    try {
      window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userSettings));
      return true;
    } catch (error) {
      showToast(`Could not save settings: ${error.message || "browser storage is unavailable"}`);
      return false;
    }

    function updateMetronomeVolumeUI() {
      const volume = userSettings.metronomeVolume;
      $("#metronome-volume-value").textContent = `${volume}%`;
      $("#metronome-volume").style.setProperty("--range-progress", `${volume}%`);
    }
  }

  function getRecordingAudioConstraints() {
    return userSettings.audioInputDeviceId
      ? { deviceId: { exact: userSettings.audioInputDeviceId } }
      : true;
  }

  async function refreshAudioDevices() {
    const mediaDevices = window.navigator.mediaDevices;
    if (!mediaDevices?.enumerateDevices) {
      $("#settings-audio-status").textContent = "Audio device selection is not supported in this browser.";
      return;
    }
    try {
      const devices = await mediaDevices.enumerateDevices();
      populateDeviceSelect($("#settings-audio-input"), devices.filter(({ kind }) => kind === "audioinput"),
        "System default", userSettings.audioInputDeviceId);
      populateDeviceSelect($("#settings-audio-output"), devices.filter(({ kind }) => kind === "audiooutput"),
        "System default", userSettings.audioOutputDeviceId);
      populateDeviceSelect($("#settings-drummer-output"), devices.filter(({ kind }) => kind === "audiooutput"),
        "Choose an audio output", userSettings.drummerDeviceId);
      $("#settings-drummer-status").textContent = drummerConnected
        ? "Connected — metronome routed to the selected device."
        : "Not connected";
    } catch (error) {
      $("#settings-audio-status").textContent = `Could not list audio devices: ${error.message || "permission denied"}`;
    }
  }

  function populateDeviceSelect(select, devices, defaultLabel, selectedId) {
    const previousValue = selectedId || "";
    select.replaceChildren(new Option(defaultLabel, ""));
    devices.forEach((device, index) => {
      select.add(new Option(device.label || `${device.kind === "audioinput" ? "Microphone" : "Audio output"} ${index + 1}`,
        device.deviceId));
    });
    if (previousValue && ![...select.options].some(({ value }) => value === previousValue)) {
      select.add(new Option("Saved device (not currently available)", previousValue));
    }
    select.value = previousValue;
  }

  async function chooseAudioOutput(settingName) {
    const chooser = window.navigator.mediaDevices?.selectAudioOutput;
    if (!chooser) {
      $("#settings-audio-status").textContent = "Separate audio output selection is not supported in this browser.";
      return;
    }
    try {
      const currentDeviceId = userSettings[settingName];
      const device = await chooser.call(window.navigator.mediaDevices,
        currentDeviceId ? { deviceId: currentDeviceId } : {});
      userSettings[settingName] = device.deviceId;
      persistUserSettings();
      await refreshAudioDevices();
      if (settingName === "audioOutputDeviceId") {
        const applied = await applySelectedAudioOutput();
        if (applied) {
          $("#settings-audio-status").textContent = `Audio output selected: ${device.label || "chosen device"}.`;
        }
      } else {
        $("#settings-drummer-status").textContent = `${device.label || "Output selected"} — connect Drummer to route the metronome.`;
      }
    } catch (error) {
      $("#settings-audio-status").textContent = error.name === "NotAllowedError"
        ? "Audio output permission was not granted."
        : `Could not select an audio output: ${error.message || "device unavailable"}`;
    }
  }

  async function applySelectedAudioOutput(context = state.audioContext) {
    if (!context) return true;
    if (typeof context.setSinkId !== "function") {
      if (userSettings.audioOutputDeviceId) {
        $("#settings-audio-status").textContent = "This browser cannot route the main mix to a selected output; using the system default.";
        return false;
      }
      return true;
    }
    await context.setSinkId(userSettings.audioOutputDeviceId || "");
    return true;
  }

  async function connectDrummerOutput() {
    const deviceId = userSettings.drummerDeviceId;
    if (!deviceId) {
      $("#settings-drummer-status").textContent = "Choose a Bluetooth audio output first.";
      return;
    }
    try {
      await ensureAudio();
      const context = state.audioContext;
      if (typeof window.HTMLMediaElement?.prototype.setSinkId !== "function") {
        throw new Error("This browser cannot route a separate Drummer output.");
      }
      if (!drummerAudio) {
        drummerAudio = document.createElement("audio");
        drummerAudio.className = "settings-audio-sink";
        drummerAudio.setAttribute("aria-hidden", "true");
        document.body.append(drummerAudio);
      }
      if (drummerDestination?.stream.getAudioTracks()[0]?.readyState !== "live" ||
        drummerGainNode?.context !== context) {
        drummerGainNode?.disconnect();
        drummerDestination = context.createMediaStreamDestination();
        drummerGainNode = context.createGain();
        drummerGainNode.connect(drummerDestination);
        drummerAudio.srcObject = drummerDestination.stream;
      }
      await drummerAudio.setSinkId(deviceId);
      await drummerAudio.play();
      drummerConnected = true;
      $("#settings-connect-drummer").textContent = "Disconnect Drummer";
      $("#settings-drummer-status").textContent = "Connected — Track View metronome is routed here while playing.";
    } catch (error) {
      drummerConnected = false;
      $("#settings-drummer-status").textContent = error.message || "Could not connect Drummer output.";
    }
  }

  function disconnectDrummerOutput() {
    drummerConnected = false;
    drummerAudio?.pause();
    $("#settings-connect-drummer").textContent = "Connect Drummer";
    $("#settings-drummer-status").textContent = "Disconnected — metronome uses the main output.";
  }

  function getMetronomeOutputNode(routeToDrummer = false) {
    if (routeToDrummer && drummerConnected && drummerGainNode?.context === state.audioContext) {
      return drummerGainNode;
    }
    return state.masterTrack.gainNode || state.masterGain;
  }

  function scheduleDjMetronome() {
    if (!state.metronome || !state.audioContext) return;
    const activeDeck = djState.decks[djState.activeDeck]?.playing
      ? djState.decks[djState.activeDeck]
      : Object.values(djState.decks).find((deck) => deck.playing);
    if (!activeDeck) return;
    const source = getDjSource(activeDeck.sourceKey);
    const sourceBpm = Number(getDjSourceMetadata(source).bpm) || state.bpm;
    const bpm = Math.max(30, Math.min(300, sourceBpm * getDjRate(activeDeck)));
    const interval = 60 / bpm;
    const now = state.audioContext.currentTime;
    if (!Number.isFinite(activeDeck.metronomeNextTime) || activeDeck.metronomeNextTime < now - interval) {
      activeDeck.metronomeNextTime = now + 0.02;
      activeDeck.metronomeBeat = 0;
    }
    while (activeDeck.metronomeNextTime < now + 0.1) {
      const pitchRatio = Math.pow(2, Math.max(-2, Math.min(2, (bpm - 120) / 30)) / 12);
      triggerDjMetronomeClick(activeDeck.metronomeNextTime, activeDeck.metronomeBeat % 4 === 0, pitchRatio);
      activeDeck.metronomeNextTime += interval;
      activeDeck.metronomeBeat += 1;
    }
  }

  function triggerDjMetronomeClick(time, downbeat, pitchRatio) {
    const oscillator = state.audioContext.createOscillator();
    const envelope = state.audioContext.createGain();
    const peakGain = Math.max(0.0001, 0.2 * userSettings.metronomeVolume / 100);
    oscillator.frequency.setValueAtTime((downbeat ? 1350 : 950) * pitchRatio, time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(peakGain, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
    oscillator.connect(envelope);
    envelope.connect(getMetronomeOutputNode(drummerConnected));
    oscillator.start(time);
    oscillator.stop(time + 0.035);
  }

  function loadCollaborationActivity() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(COLLABORATION_ACTIVITY_KEY) || "null");
      if (!saved || typeof saved !== "object") return;
      applyCollaborationMetadata(saved);
    } catch (error) {
      showToast(`Could not load collaboration history: ${error.message || "browser storage is unavailable"}`);
    }
  }

  function applyCollaborationMetadata(message) {
    if (typeof message.roomCode === "string") collaboration.lastRoomCode = message.roomCode;
    if (typeof message.hostName === "string") collaboration.hostName = message.hostName;
    if (typeof message.lastUpdatedBy === "string") collaboration.lastUpdatedBy = message.lastUpdatedBy;
    if (Object.hasOwn(message, "lastUpdatedAt")) {
      collaboration.lastUpdatedAt = Number.isFinite(message.lastUpdatedAt) ? message.lastUpdatedAt : null;
    }
    if (Array.isArray(message.activityLog)) {
      collaboration.activityLog = message.activityLog
        .filter((entry) => entry && typeof entry.action === "string" &&
          typeof entry.name === "string" && Number.isFinite(entry.timestamp))
        .slice(-MAX_COLLABORATION_ACTIVITY);
    }
    persistCollaborationActivity();
    renderCollaborationActivityLog();
  }

  function recordLocalCollaborationActivity(action, name) {
    collaboration.activityLog = [...collaboration.activityLog, {
      action,
      name,
      timestamp: Date.now(),
    }].slice(-MAX_COLLABORATION_ACTIVITY);
    persistCollaborationActivity();
    renderCollaborationActivityLog();
  }

  function persistCollaborationActivity() {
    if (!collaboration.activityLog.length) return;
    try {
      window.localStorage.setItem(COLLABORATION_ACTIVITY_KEY, JSON.stringify({
        roomCode: collaboration.session?.roomCode || collaboration.lastRoomCode || "",
        hostName: collaboration.hostName,
        lastUpdatedBy: collaboration.lastUpdatedBy,
        lastUpdatedAt: collaboration.lastUpdatedAt,
        activityLog: collaboration.activityLog,
      }));
    } catch (error) {
      showToast(`Could not save collaboration history: ${error.message || "browser storage is unavailable"}`);
    }
  }

  function renderCollaborationActivityLog() {
    const section = $("#settings-collaboration-log");
    if (!section) return;
    const history = collaboration.activityLog || [];
    section.hidden = !history.length && !collaboration.session;
    const roomCode = collaboration.session?.roomCode || collaboration.lastRoomCode;
    $("#settings-room-host").textContent = collaboration.hostName
      ? `Host: ${collaboration.hostName}${roomCode ? ` · Room ${roomCode}` : ""}`
      : "Room host: unavailable";
    const lastEdit = [...history].reverse().find(({ action }) => action === "edit");
    const lastEditName = lastEdit?.name || collaboration.lastUpdatedBy;
    const lastEditTimestamp = lastEdit?.timestamp || collaboration.lastUpdatedAt;
    $("#settings-last-edit").textContent = lastEditName && Number.isFinite(lastEditTimestamp)
      ? `Last edit: ${lastEditName} · ${formatCollaborationTimestamp(lastEditTimestamp)}`
      : "Last edit: no edits recorded";
    const list = $("#settings-activity-list");
    list.replaceChildren(...history.slice().reverse().map((entry) => {
      const item = document.createElement("li");
      const descriptions = {
        created: "created the room",
        joined: "joined the room",
        left: "left the room",
        edit: "edited the project",
      };
      item.append(document.createTextNode(`${entry.name} ${descriptions[entry.action] || "updated the room"}`));
      const time = document.createElement("time");
      time.dateTime = new Date(entry.timestamp).toISOString();
      time.textContent = formatCollaborationTimestamp(entry.timestamp);
      item.append(time);
      return item;
    }));
  }

  function formatCollaborationTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
