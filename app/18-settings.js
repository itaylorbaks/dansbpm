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
    fontSize: 100,
    fontFamily: "system",
    contrast: 50,
    density: "comfortable",
    quickActionEnabled: false,
    quickActionView: "mixer",
    shortcuts: {},
    recordingTrackId: "",
    recordingMode: "new-take",
    inputMonitoring: false,
    pauseBehavior: "maintain",
    blueprintLayout: "workspace-top",
  };
  const SHORTCUTS = [
    { id: "play", label: "Play / stop", group: "Global", views: null, default: { code: "Space" } },
    { id: "workspace-play", label: "Play current Workspace", group: "Global", views: null, default: { code: "Space", ctrl: true } },
    { id: "fullscreen", label: "Toggle fullscreen", group: "Global", views: null, default: { code: "KeyF" } },
    { id: "undo", label: "Undo", group: "Global", views: null, default: { code: "KeyZ", ctrl: true } },
    { id: "redo", label: "Redo", group: "Global", views: null, default: { code: "KeyY", ctrl: true } },
    { id: "select-all", label: "Select all", group: "Arrangement / Mixer", views: ["arrangement", "mixer"], default: { code: "KeyA", ctrl: true } },
    { id: "copy", label: "Copy", group: "Arrangement / Mixer", views: ["arrangement", "mixer"], default: { code: "KeyC", ctrl: true } },
    { id: "paste", label: "Paste", group: "Arrangement / Mixer", views: ["arrangement", "mixer"], default: { code: "KeyV", ctrl: true } },
    { id: "cut", label: "Cut", group: "Arrangement / Mixer", views: ["arrangement", "mixer"], default: { code: "KeyX", ctrl: true } },
    { id: "select-all-editor", label: "Select all", group: "Step Grid / Piano Roll", views: ["sequencer", "piano-roll"], default: { code: "KeyA", ctrl: true } },
    { id: "copy-editor", label: "Copy", group: "Step Grid / Piano Roll", views: ["piano-roll"], default: { code: "KeyC", ctrl: true } },
    { id: "paste-editor", label: "Paste", group: "Step Grid / Piano Roll", views: ["piano-roll"], default: { code: "KeyV", ctrl: true } },
    { id: "cut-editor", label: "Cut", group: "Step Grid / Piano Roll", views: ["piano-roll"], default: { code: "KeyX", ctrl: true } },
    { id: "split", label: "Split selected clips", group: "Track View", views: ["arrangement", "mixer"], default: { code: "KeyS" } },
    { id: "slice", label: "Toggle slice tool", group: "Track View", views: ["track-view"], default: { code: "KeyT" } },
    { id: "place", label: "Place editor at playhead", group: "Step Grid / Piano Roll", views: ["sequencer", "piano-roll"], default: { code: "KeyP" } },
  ];
  let drummerAudio = null;
  let drummerDestination = null;
  let drummerGainNode = null;
  let drummerConnected = false;
  let quickMixerEffectsOpen = false;

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
          fontSize: Number.isFinite(saved.fontSize) ? Math.round(Math.max(85, Math.min(125, saved.fontSize))) : 100,
          fontFamily: ["system", "arial", "verdana", "georgia"].includes(saved.fontFamily) ? saved.fontFamily : "system",
          contrast: Number.isFinite(saved.contrast) ? Math.round(Math.max(0, Math.min(100, saved.contrast))) : 50,
          density: ["compact", "comfortable", "spacious"].includes(saved.density) ? saved.density : "comfortable",
          quickActionEnabled: saved.quickActionEnabled === true,
          quickActionView: ["mixer", "sequencer", "piano-roll"].includes(saved.quickActionView) ? saved.quickActionView : "mixer",
          shortcuts: normalizeShortcuts(saved.shortcuts),
          recordingTrackId: typeof saved.recordingTrackId === "string" ? saved.recordingTrackId : "",
          recordingMode: saved.recordingMode === "replace" ? "replace" : "new-take",
          inputMonitoring: saved.inputMonitoring === true,
          pauseBehavior: ["maintain", "playback-start", "track-origin"].includes(saved.pauseBehavior)
            ? saved.pauseBehavior
            : saved.rewindOnPause === true ? "playback-start" : "maintain",
          blueprintLayout: ["workspace-top", "track-top", "side-by-side"].includes(saved.blueprintLayout)
            ? saved.blueprintLayout
            : "workspace-top",
        });
      }
    } catch (error) {
      showToast(`Could not load settings: ${error.message || "browser storage is unavailable"}`);
    }

    function shortcutHasLegacyConflict(binding, shortcut) {
      if (userSettings.shortcuts[shortcut.id]) return false;
      if (shortcut.id === "redo" && binding.code === "KeyZ" &&
        binding.ctrl && binding.shift && !binding.alt) return true;
      const defaultBinding = shortcut.default;
      return binding.code === defaultBinding.code &&
        binding.ctrl === (defaultBinding.ctrl === true) &&
        binding.alt === (defaultBinding.alt === true) && binding.shift && !defaultBinding.shift;
    }

    document.documentElement.dataset.theme = userSettings.theme;
    document.documentElement.dataset.accent = userSettings.accent;
    applyDisplayPreferences();
    $("#settings-theme").value = userSettings.theme;
    $("#settings-accent").value = userSettings.accent;
    $("#settings-font-size").value = String(userSettings.fontSize);
    $("#settings-font-size-value").textContent = `${userSettings.fontSize}%`;
    $("#settings-font-family").value = userSettings.fontFamily;
    $("#settings-contrast").value = String(userSettings.contrast);
    $("#settings-contrast-value").textContent = `${userSettings.contrast}%`;
    $("#settings-density").value = userSettings.density;
    $("#settings-quick-action-enabled").checked = userSettings.quickActionEnabled;
    $("#settings-quick-action-view").value = userSettings.quickActionView;
    $("#quick-action-view-select").value = userSettings.quickActionView;
    $("#settings-recording-mode").value = userSettings.recordingMode;
    $("#settings-input-monitoring").checked = userSettings.inputMonitoring;
    renderSettingsShortcuts();
    $("#settings-pause-behavior").value = userSettings.pauseBehavior;
    updateBlueprintLayoutButtons();
    activateSettingsPage("display");
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
      renderRecordingTrackOptions();
    });
    $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
    const settingsNav = $("#settings-nav");
    settingsNav.addEventListener("click", (event) => {
      const tab = event.target instanceof Element ? event.target.closest("[data-settings-page]") : null;
      if (tab) activateSettingsPage(tab.dataset.settingsPage);
    });
    settingsNav.addEventListener("keydown", (event) => {
      const tabs = Array.from(settingsNav.querySelectorAll("[data-settings-page]"));
      const currentIndex = tabs.indexOf(event.target);
      if (currentIndex < 0) return;
      let nextIndex;
      if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
      else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      activateSettingsPage(tabs[nextIndex].dataset.settingsPage, true);
    });
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
    $("#settings-font-size").addEventListener("input", (event) => {
      userSettings.fontSize = Number(event.target.value);
      applyDisplayPreferences();
    });
    $("#settings-font-size").addEventListener("change", persistUserSettings);
    $("#settings-font-family").addEventListener("change", (event) => {
      userSettings.fontFamily = ["system", "arial", "verdana", "georgia"].includes(event.target.value)
        ? event.target.value : "system";
      applyDisplayPreferences();
      persistUserSettings();
    });
    $("#settings-contrast").addEventListener("input", (event) => {
      userSettings.contrast = Number(event.target.value);
      applyDisplayPreferences();
    });
    $("#settings-contrast").addEventListener("change", persistUserSettings);
    $("#settings-density").addEventListener("change", (event) => {
      userSettings.density = ["compact", "comfortable", "spacious"].includes(event.target.value)
        ? event.target.value : "comfortable";
      applyDisplayPreferences();
      persistUserSettings();
    });
    $("#settings-quick-action-enabled").addEventListener("change", (event) => {
      userSettings.quickActionEnabled = event.target.checked;
      renderQuickActionPanel();
      persistUserSettings();
    });
    $("#settings-quick-action-view").addEventListener("change", (event) => {
      setQuickActionView(event.target.value);
    });
    $("#quick-action-view-select").addEventListener("change", (event) => {
      setQuickActionView(event.target.value);
    });
    $("#quick-action-play-button").addEventListener("click", (event) => {
      const workspace = event.currentTarget.dataset.workspacePlay;
      if (workspace) toggleQuickActionPlayback(workspace);
    });
    $("#settings-recording-track").addEventListener("change", (event) => {
      userSettings.recordingTrackId = event.target.value;
      persistUserSettings();
    });
    $("#settings-recording-mode").addEventListener("change", (event) => {
      userSettings.recordingMode = event.target.value === "replace" ? "replace" : "new-take";
      persistUserSettings();
    });
    $("#settings-input-monitoring").addEventListener("change", (event) => {
      userSettings.inputMonitoring = event.target.checked;
      try {
        setRecordingInputMonitoring(userSettings.inputMonitoring);
      } catch (error) {
        showToast(`Could not update input monitoring: ${error.message || "unknown error"}`);
      }
      persistUserSettings();
    });
    $("#settings-pause-behavior").addEventListener("change", (event) => {
      userSettings.pauseBehavior = ["maintain", "playback-start", "track-origin"].includes(event.target.value)
        ? event.target.value
        : "maintain";
      persistUserSettings();
    });
    document.querySelectorAll("[data-blueprint-layout]").forEach((button) => {
      button.addEventListener("click", () => {
        const layout = button.dataset.blueprintLayout;
        if (!["workspace-top", "track-top", "side-by-side"].includes(layout)) return;
        userSettings.blueprintLayout = layout;
        updateBlueprintLayoutButtons();
        renderViewLayout();
        persistUserSettings();
      });
    });
    $("#settings-create-room").addEventListener("click", () => {
      $("#settings-dialog").close();
      openCollaborationDialog();
      void startCollaborationRoom("create");
    });
    $("#settings-join-room").addEventListener("click", () => {
      $("#settings-dialog").close();
      openCollaborationDialog();
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

  function updateBlueprintLayoutButtons() {
    document.querySelectorAll("[data-blueprint-layout]").forEach((button) => {
      const selected = button.dataset.blueprintLayout === userSettings.blueprintLayout;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    });
  }

  function normalizeShortcuts(saved) {
    if (!saved || typeof saved !== "object") return {};
    return Object.fromEntries(SHORTCUTS.flatMap(({ id }) => {
      const binding = saved[id];
      if (!binding || typeof binding.code !== "string" || !binding.code || binding.code.length > 40) return [];
      return [[id, {
        code: binding.code,
        ctrl: binding.ctrl === true,
        shift: binding.shift === true,
        alt: binding.alt === true,
      }]];
    }));
  }

  function applyDisplayPreferences() {
    const root = document.documentElement;
    root.style.setProperty("--ui-font-scale", String(userSettings.fontSize / 100));
    root.style.setProperty("--ui-contrast-level", `${Math.round(userSettings.contrast * 0.5)}%`);
    root.style.setProperty("--density-scale", ({
      compact: "0.85",
      comfortable: "1",
      spacious: "1.15",
    })[userSettings.density]);
    root.style.setProperty("--sans", ({
      system: "ui-sans-serif, system-ui, sans-serif",
      arial: "Arial, sans-serif",
      verdana: "Verdana, sans-serif",
      georgia: "Georgia, serif",
    })[userSettings.fontFamily]);
    $("#settings-font-size-value").textContent = `${userSettings.fontSize}%`;
    $("#settings-contrast-value").textContent = `${userSettings.contrast}%`;
  }

  function setQuickActionView(view) {
    userSettings.quickActionView = ["mixer", "sequencer", "piano-roll"].includes(view) ? view : "mixer";
    $("#settings-quick-action-view").value = userSettings.quickActionView;
    $("#quick-action-view-select").value = userSettings.quickActionView;
    renderQuickActionPanel();
    persistUserSettings();
  }

  function getShortcutBinding(actionId) {
    const shortcut = SHORTCUTS.find(({ id }) => id === actionId);
    return userSettings.shortcuts[actionId] || shortcut?.default;
  }

  function shortcutBindingMatches(left, right) {
    return left?.code === right?.code && left?.ctrl === (right?.ctrl === true) &&
      left?.shift === (right?.shift === true) && left?.alt === (right?.alt === true);
  }

  function shortcutScopesOverlap(left, right) {
    if (!left.views || !right.views) return true;
    if (left.views.includes("track-view") || right.views.includes("track-view")) return true;
    return left.views.some((view) => right.views.includes(view));
  }

  function getShortcutLabel(binding) {
    if (!binding) return "Unassigned";
    const parts = [];
    if (binding.ctrl) parts.push("Ctrl");
    if (binding.alt) parts.push("Alt");
    if (binding.shift) parts.push("Shift");
    const key = binding.code === "Space" ? "Space"
      : binding.code.startsWith("Key") ? binding.code.slice(3)
        : binding.code.startsWith("Digit") ? binding.code.slice(5)
          : binding.code;
    return [...parts, key].join(" + ");
  }

  function renderSettingsShortcuts() {
    const root = $("#settings-shortcuts");
    if (!root) return;
    const groups = new Map();
    SHORTCUTS.forEach((shortcut) => {
      if (!groups.has(shortcut.group)) groups.set(shortcut.group, []);
      groups.get(shortcut.group).push(shortcut);
    });
    root.replaceChildren();
    groups.forEach((shortcuts, groupName) => {
      const group = document.createElement("section");
      group.className = "settings-shortcut-group";
      const heading = document.createElement("h5");
      heading.textContent = groupName;
      group.append(heading);
      shortcuts.forEach((shortcut) => {
        const row = document.createElement("div");
        row.className = "settings-shortcut-row";
        const label = document.createElement("span");
        label.textContent = shortcut.label;
        const button = document.createElement("button");
        button.className = "quiet-button settings-shortcut-binding";
        button.type = "button";
        button.textContent = getShortcutLabel(getShortcutBinding(shortcut.id));
        button.setAttribute("aria-label", `${shortcut.label} shortcut. Press a key combination to change it.`);
        button.addEventListener("keydown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
          const binding = {
            code: event.code || event.key,
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey,
          };
          const conflict = SHORTCUTS.find((candidate) =>
            candidate.id !== shortcut.id &&
            shortcutScopesOverlap(shortcut, candidate) &&
            (shortcutBindingMatches(binding, getShortcutBinding(candidate.id)) ||
              shortcutHasLegacyConflict(binding, candidate)));
          const status = $("#settings-shortcuts-status");
          if (conflict) {
            status.textContent = `${getShortcutLabel(binding)} is already assigned to ${conflict.label} in an overlapping view.`;
            status.dataset.state = "error";
            return;
          }
          userSettings.shortcuts[shortcut.id] = binding;
          status.textContent = `${shortcut.label} is now ${getShortcutLabel(binding)}.`;
          status.dataset.state = "success";
          renderSettingsShortcuts();
          persistUserSettings();
        });
        row.append(label, button);
        group.append(row);
      });
      root.append(group);
    });
  }

  function matchesConfiguredShortcut(event, actionId) {
    const shortcut = SHORTCUTS.find(({ id }) => id === actionId);
    if (!shortcut) return false;
    if (actionId === "slice" && getLastInteractedViewArea() !== "track-view") return false;
    const activeView = ["select-all", "copy", "paste", "cut"].includes(actionId)
      ? getClipboardEditorView()
      : state.view;
    if (shortcut.views && !shortcut.views.includes(activeView) &&
      !(shortcut.views.includes("track-view") && getLastInteractedViewArea() === "track-view")) return false;
    if (actionId === "redo" && event.code === "KeyZ" &&
      (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey) return true;
    const binding = getShortcutBinding(actionId);
    if (actionId === "play" && !userSettings.shortcuts.play && event.code === "Space" &&
      !event.ctrlKey && !event.metaKey && !event.altKey) return true;
    return event.code === binding.code &&
      (event.ctrlKey || event.metaKey) === (binding.ctrl === true) &&
      event.shiftKey === (binding.shift === true) &&
      event.altKey === (binding.alt === true);
  }

  function matchesLegacyShiftShortcut(event, actionId) {
    const shortcut = SHORTCUTS.find(({ id }) => id === actionId);
    const activeView = ["select-all", "copy", "paste", "cut"].includes(actionId)
      ? getClipboardEditorView()
      : state.view;
    if (shortcut?.views && !shortcut.views.includes(activeView)) return false;
    return !userSettings.shortcuts[actionId] && Boolean(shortcut?.default.ctrl) &&
      event.code === shortcut.default.code && (event.ctrlKey || event.metaKey) &&
      event.shiftKey && !event.altKey;
  }

  function renderRecordingTrackOptions() {
    const select = $("#settings-recording-track");
    if (!select) return;
    select.replaceChildren(new Option("New track for each take", ""));
    state.arrangementTracks.forEach((track) => {
      select.add(new Option(track.name, track.id));
    });
    if (userSettings.recordingTrackId && !state.arrangementTracks.some((track) =>
      track.id === userSettings.recordingTrackId)) {
      select.add(new Option("Saved track unavailable", userSettings.recordingTrackId));
    }
    select.value = userSettings.recordingTrackId;
  }

  function renderQuickActionPanel() {
    const panel = $("#quick-action-panel");
    const content = $("#quick-action-content");
    if (!panel || !content) return;
    panel.hidden = !userSettings.quickActionEnabled;
    $("#quick-action-view-select").value = userSettings.quickActionView;
    const workspace = userSettings.quickActionView === "sequencer" ||
      userSettings.quickActionView === "piano-roll" ? userSettings.quickActionView : null;
    const playButton = $("#quick-action-play-button");
    playButton.hidden = !workspace;
    playButton.dataset.workspacePlay = workspace || "";
    if (workspace) updateWorkspacePlayButton(workspace, isQuickActionPlaybackActive(workspace), true);
    if (!userSettings.quickActionEnabled) return;
    content.replaceChildren();
    content.dataset.quickView = userSettings.quickActionView;
    if (userSettings.quickActionView === "mixer") renderQuickMixer(content);
    else if (userSettings.quickActionView === "sequencer") renderQuickStepGrid(content);
    else renderQuickPianoRoll(content);
  }

  function renderQuickMixer(root) {
    const effects = document.createElement("details");
    effects.className = "quick-mixer-effect-picker";
    effects.open = quickMixerEffectsOpen;
    effects.addEventListener("toggle", () => { quickMixerEffectsOpen = effects.open; });
    const summary = document.createElement("summary");
    summary.textContent = "ADD EFFECT";
    effects.append(summary);
    const effectList = document.createElement("div");
    effectList.className = "quick-mixer-effect-list";
    EFFECT_CATEGORIES.forEach((category) => {
      category.effects.forEach(([id, name]) => {
        const button = document.createElement("button");
        button.className = "mixer-library-effect";
        button.type = "button";
        button.draggable = true;
        button.textContent = name;
        button.title = `${category.name}: ${name}`;
        button.addEventListener("dragstart", (event) => {
          event.dataTransfer?.setData("application/x-dansbpm-effect", id);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
        });
        button.addEventListener("click", () => {
          const channels = getMixerTracks();
          const target = channels.find(({ track }) => track.id === state.selectedMixerTrackId)?.track ||
            channels.find(({ type }) => type === "Master")?.track;
          if (target) addMixerEffect(target, id);
        });
        effectList.append(button);
      });
    });
    effects.append(effectList);
    root.append(effects);

    const trackList = document.createElement("div");
    trackList.className = "quick-mixer-track-list";
    getMixerTracks().forEach(({ track, type }) => {
      ensureTrackMixerState(track);
      const lane = document.createElement("section");
      lane.className = "quick-mixer-lane";
      lane.dataset.trackId = track.id;
      const title = document.createElement("button");
      title.className = "quick-mixer-lane-title";
      title.type = "button";
      title.textContent = track.arrangementName || track.name;
      title.title = `Select ${type} mixer lane`;
      title.addEventListener("click", () => {
        selectArrangementTrack(track.id);
        renderMixer();
      });
      const controls = document.createElement("div");
      controls.className = "quick-mixer-knobs";
      controls.append(makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track), makeMixerPanKnob(track));
      const effectTarget = document.createElement("div");
      effectTarget.className = "mixer-track-effects quick-mixer-effects";
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
      effectTarget.append(makeMixerEffectSlots(track));
      lane.append(title, controls, effectTarget);
      trackList.append(lane);
    });
    root.append(trackList);
    syncMixerMeters();
  }

  function syncQuickMixerControls(track) {
    const lane = Array.from(document.querySelectorAll(".quick-mixer-lane"))
      .find((item) => item.dataset.trackId === track.id);
    if (!lane) return;
    lane.querySelectorAll(".mixer-track-knob").forEach((wrapper) => {
      const label = wrapper.querySelector("span")?.textContent;
      const knob = wrapper.querySelector(".mixer-volume-knob");
      const output = wrapper.querySelector("output");
      if (!knob || !output || !["VOL", "PAN"].includes(label)) return;
      const percent = label === "VOL" ? track.volume * 100 : (track.pan + 1) * 50;
      const value = label === "VOL" ? track.volume : track.pan;
      const text = label === "VOL" ? `${Math.round(value * 100)}%`
        : Math.round(value * 100) === 0 ? "C"
          : `${value < 0 ? "L" : "R"}${Math.abs(Math.round(value * 100))}`;
      knob.setAttribute("aria-valuenow", String(Math.round(value * 100)));
      knob.setAttribute("aria-valuetext", text);
      knob.style.setProperty("--knob-angle", `${-135 + percent * 2.7}deg`);
      knob.style.setProperty("--knob-fill", `${percent * 0.75}%`);
      output.textContent = text;
    });
  }

  function renderQuickStepGrid(root) {
    const pattern = getPattern();
    if (!pattern) {
      root.textContent = "Create a pattern to edit it here.";
      return;
    }
    const menuRow = document.createElement("div");
    menuRow.className = "quick-action-menu-row";
    const toolbar = document.createElement("details");
    toolbar.className = "quick-action-toolbar";
    const summary = document.createElement("summary");
    summary.textContent = "PATTERN";
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Quick Action pattern");
    state.patterns.forEach((item) => select.add(new Option(item.name, item.id)));
    select.value = pattern.id;
    select.addEventListener("change", () => selectPattern(select.value));
    toolbar.append(summary, select);
    menuRow.append(toolbar);

    const gridToolbar = document.createElement("details");
    gridToolbar.className = "quick-action-toolbar";
    const gridSummary = document.createElement("summary");
    gridSummary.textContent = "GRID";
    const lengthSelect = document.createElement("select");
    lengthSelect.setAttribute("aria-label", "Quick Action step grid length");
    [1, 2, 4, 8].forEach((bars) => lengthSelect.add(new Option(`${bars} BAR${bars === 1 ? "" : "S"}`, String(bars))));
    lengthSelect.value = String(pattern.steps / 16);
    lengthSelect.addEventListener("change", () => setLength(Number(lengthSelect.value) * 16));
    const resolutionSelect = document.createElement("select");
    resolutionSelect.setAttribute("aria-label", "Quick Action step grid subdivision");
    ["1/4", "1/8", "1/16", "1/32", "1/64"].forEach((resolution) =>
      resolutionSelect.add(new Option(resolution, resolution)));
    resolutionSelect.value = getPatternGridResolution(pattern);
    resolutionSelect.addEventListener("change", () => setPatternGridResolution(resolutionSelect.value));
    gridToolbar.append(gridSummary, lengthSelect, resolutionSelect);
    menuRow.append(gridToolbar);
    root.append(menuRow);

    const grid = document.createElement("div");
    grid.className = "quick-step-grid";
    const trackIds = new Set(getPatternTrackIds(pattern));
    const tracks = state.tracks.filter((track) => trackIds.has(track.id));
    const stepCount = getGridStepCount(pattern);
    const stepsPerBar = getStepsPerBar(pattern);
    if (tracks.length) grid.style.gridTemplateRows = `repeat(${tracks.length}, minmax(13px, 1fr))`;
    const viewport = document.createElement("div");
    viewport.className = "quick-step-viewport";
    const ruler = document.createElement("div");
    ruler.className = "quick-action-bar-meter quick-step-bar-meter";
    ruler.style.gridTemplateColumns = `42px repeat(${stepCount}, 12px)`;
    const rulerSpacer = document.createElement("span");
    rulerSpacer.className = "quick-action-bar-meter-spacer";
    ruler.append(rulerSpacer);
    for (let bar = 0; bar < pattern.steps / 16; bar += 1) {
      const marker = document.createElement("span");
      marker.className = "quick-action-bar-marker";
      marker.dataset.bar = String(bar + 1);
      marker.style.gridColumn = `span ${Math.max(1, Math.round(stepsPerBar))}`;
      marker.textContent = String(bar + 1);
      ruler.append(marker);
    }
    viewport.append(ruler);
    tracks.forEach((track) => {
      const row = document.createElement("div");
      row.className = "quick-step-row";
      const name = document.createElement("span");
      name.className = "quick-step-track-name";
      name.textContent = track.name;
      row.append(name);
      const cells = document.createElement("div");
      cells.className = "quick-step-cells";
      cells.style.gridTemplateColumns = `repeat(${stepCount}, 10px)`;
      for (let step = 0; step < stepCount; step += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.dataset.step = String(step);
        cell.className = `quick-step-cell${track.cells[step] ? " is-on" : ""}${step % stepsPerBar === 0 ? " is-bar" : ""}`;
        cell.setAttribute("aria-label", `${track.name}, step ${step + 1}${track.cells[step] ? ", on" : ", off"}`);
        cell.setAttribute("aria-pressed", String(Boolean(track.cells[step])));
        cell.addEventListener("click", () => {
          const value = !track.cells[step];
          track.cells[step] = value;
          updatePatternStepPianoCell(pattern, track, step, value);
          captureCurrentPattern();
          renderTracks();
          renderArrangement();
          saveState();
        });
        cells.append(cell);
      }
      row.append(cells);
      grid.append(row);
    });
    viewport.append(grid);
    root.append(viewport);
  }

  function renderQuickPianoRoll(root) {
    const menuRow = document.createElement("div");
    menuRow.className = "quick-action-menu-row";
    const toolbar = document.createElement("details");
    toolbar.className = "quick-action-toolbar";
    const summary = document.createElement("summary");
    summary.textContent = "MELODY";
    const melSelect = document.createElement("select");
    melSelect.setAttribute("aria-label", "Quick Action Mel");
    state.mels.forEach((mel) => melSelect.add(new Option(mel.name, mel.id)));
    melSelect.value = state.selectedMelId || "";
    melSelect.addEventListener("change", () => {
      loadMel(melSelect.value);
      renderPianoRoll();
      saveState();
    });
    toolbar.append(summary, melSelect);
    menuRow.append(toolbar);

    const gridToolbar = document.createElement("details");
    gridToolbar.className = "quick-action-toolbar";
    const gridSummary = document.createElement("summary");
    gridSummary.textContent = "GRID";
    const barsSelect = document.createElement("select");
    barsSelect.setAttribute("aria-label", "Quick Action Piano Roll length");
    [1, 2, 4, 8].forEach((bars) => barsSelect.add(new Option(`${bars} BAR${bars === 1 ? "" : "S"}`, String(bars))));
    barsSelect.value = String(state.pianoBars);
    barsSelect.addEventListener("change", () => {
      state.pianoBars = Number(barsSelect.value);
      renderPianoRoll();
      saveState();
    });
    const snapSelect = document.createElement("select");
    snapSelect.setAttribute("aria-label", "Quick Action Piano Roll snap");
    [["off", "Off"], ["1", "1/32"], ["2", "1/16"], ["4", "1/8"], ["8", "1/4"]]
      .forEach(([value, label]) => snapSelect.add(new Option(label, value)));
    snapSelect.value = state.pianoSnapEnabled ? String(state.pianoSnap) : "off";
    snapSelect.addEventListener("change", () => {
      state.pianoSnapEnabled = snapSelect.value !== "off";
      if (state.pianoSnapEnabled) state.pianoSnap = Number(snapSelect.value);
      renderPianoRoll();
      saveState();
    });
    gridToolbar.append(gridSummary, barsSelect, snapSelect);
    menuRow.append(gridToolbar);
    root.append(menuRow);

    const track = getPianoTrack(state.stepPianoEditContext?.trackId || state.selectedPianoTrackId);
    if (!track) {
      const message = document.createElement("p");
      message.className = "settings-note";
      message.textContent = "Choose an instrument in Piano Roll before adding notes.";
      root.append(message);
      return;
    }
    const snapTicks = state.pianoSnapEnabled ? Math.max(1, getPianoSnapStep()) : 1;
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    const noteSteps = Math.ceil(totalTicks / snapTicks);
    const viewport = document.createElement("div");
    viewport.className = "quick-piano-viewport";
    const ruler = document.createElement("div");
    ruler.className = "quick-action-bar-meter quick-piano-bar-meter";
    const notesPerBar = Math.ceil(PIANO_TICKS_PER_BAR / snapTicks);
    ruler.style.gridTemplateColumns = `34px repeat(${state.pianoBars}, ${notesPerBar * 12}px)`;
    for (let bar = 0; bar < state.pianoBars; bar += 1) {
      const marker = document.createElement("span");
      marker.className = "quick-action-bar-marker";
      marker.dataset.bar = String(bar + 1);
      marker.textContent = String(bar + 1);
      ruler.append(marker);
    }
    viewport.append(ruler);
    const grid = document.createElement("div");
    grid.className = "quick-piano-grid";
    for (let midi = 84; midi >= 61; midi -= 1) {
      const row = document.createElement("div");
      row.className = `quick-piano-row${[1, 3, 6, 8, 10].includes(midi % 12) ? " is-black" : ""}`;
      const key = document.createElement("span");
      key.className = "quick-piano-key";
      key.textContent = midi % 12 === 0 ? midiNoteName(midi) : "";
      row.append(key);
      const cells = document.createElement("div");
      cells.className = "quick-piano-cells";
      for (let index = 0; index < noteSteps; index += 1) {
        const startTick = index * snapTicks;
        const existing = state.pianoNotes.find((note) =>
          note.midi === midi && startTick >= note.startTick &&
          startTick < note.startTick + note.durationTicks && !note.audioSlice);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `quick-piano-cell${existing ? " is-on" : ""}${startTick % PIANO_TICKS_PER_BAR === 0 ? " is-bar" : ""}`;
        cell.setAttribute("aria-label", `${midiNoteName(midi)}, step ${index + 1}${existing ? ", note on" : ", note off"}`);
        cell.setAttribute("aria-pressed", String(Boolean(existing)));
        cell.addEventListener("click", () => {
          if (existing) {
            state.pianoNotes = state.pianoNotes.filter((note) => note.id !== existing.id);
          } else {
            state.pianoNotes.push({
              id: makeId(),
              trackId: state.stepPianoEditContext?.trackId || state.selectedPianoTrackId,
              midi,
              startTick,
              durationTicks: Math.max(1, Math.min(state.pianoNoteLength, totalTicks - startTick)),
              velocity: 0.8,
            });
          }
          renderPianoRoll();
          updateArrangementLength();
          renderArrangement();
          saveState();
        });
        cells.append(cell);
      }
      row.append(cells);
      grid.append(row);
    }
    viewport.append(grid);
    root.append(viewport);
  }

  function activateSettingsPage(page, focus = false) {
    const tabs = Array.from(document.querySelectorAll("[data-settings-page]"));
    const selectedTab = tabs.find((tab) => tab.dataset.settingsPage === page);
    if (!selectedTab) return;
    tabs.forEach((tab) => {
      const selected = tab === selectedTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle("is-selected", selected);
    });
    document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.settingsPanel !== page;
    });
    if (focus) selectedTab.focus();
  }

  function openCollaborationDialog() {
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
  }

  function persistUserSettings() {
    try {
      window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userSettings));
      return true;
    } catch (error) {
      showToast(`Could not save settings: ${error.message || "browser storage is unavailable"}`);
      return false;
    }
  }

  function updateMetronomeVolumeUI() {
    const volume = userSettings.metronomeVolume;
    $("#metronome-volume-value").textContent = `${volume}%`;
    $("#metronome-volume").style.setProperty("--range-progress", `${volume}%`);
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
