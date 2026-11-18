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
    { id: "select-all-editor", label: "Select all", group: "Rack / Piano Roll", views: ["sequencer", "piano-roll"], default: { code: "KeyA", ctrl: true } },
    { id: "copy-editor", label: "Copy", group: "Rack / Piano Roll", views: ["piano-roll"], default: { code: "KeyC", ctrl: true } },
    { id: "paste-editor", label: "Paste", group: "Rack / Piano Roll", views: ["piano-roll"], default: { code: "KeyV", ctrl: true } },
    { id: "cut-editor", label: "Cut", group: "Rack / Piano Roll", views: ["piano-roll"], default: { code: "KeyX", ctrl: true } },
    { id: "split", label: "Split selected clips", group: "Track View", views: ["arrangement", "mixer"], default: { code: "KeyS" } },
    { id: "slice", label: "Toggle slice tool", group: "Track View", views: ["track-view"], default: { code: "KeyT" } },
    { id: "place", label: "Place editor at playhead", group: "Rack / Piano Roll", views: ["sequencer", "piano-roll"], default: { code: "KeyP" } },
  ];
  let drummerAudio = null;
  let drummerDestination = null;
  let drummerGainNode = null;
  let drummerConnected = false;
  let quickMixerEffectsOpen = false;
  let quickActionStepPlayhead = -1;
  let quickActionPianoPlayheadTick = 0;
  let quickActionPanelHome = null;
  let quickActionFloatingBounds = null;
  let quickActionDockedWidth = 290;
  let quickActionDockedHeight = 250;
  let quickActionDragClickSuppressed = false;

  function initializeSettings() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(USER_SETTINGS_KEY) || "null");
      if (saved && typeof saved === "object") {
        Object.assign(userSettings, {
          audioInputDeviceId: typeof saved.audioInputDeviceId === "string" ? saved.audioInputDeviceId : "",
          audioOutputDeviceId: typeof saved.audioOutputDeviceId === "string" ? saved.audioOutputDeviceId : "",
          drummerDeviceId: typeof saved.drummerDeviceId === "string" ? saved.drummerDeviceId : "",
          metronomeVolume: Number.isFinite(saved.metronomeVolume)
            ? Math.round(Math.max(0, Math.min(200, saved.metronomeVolume)))
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
    bindQuickActionPanelInteractions();
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
    if (view === "none") {
      userSettings.quickActionEnabled = false;
      $("#settings-quick-action-enabled").checked = false;
      renderQuickActionPanel();
      persistUserSettings();
      return;
    }
    userSettings.quickActionView = ["mixer", "sequencer", "piano-roll"].includes(view) ? view : "mixer";
    $("#settings-quick-action-view").value = userSettings.quickActionView;
    $("#quick-action-view-select").value = userSettings.quickActionView;
    renderQuickActionPanel();
    persistUserSettings();
  }

  function applyQuickActionFloatingBounds(bounds) {
    const panel = $("#quick-action-panel");
    const width = Math.min(Math.max(250, bounds.width), Math.max(250, window.innerWidth - 16));
    const height = Math.min(Math.max(190, bounds.height), Math.max(190, window.innerHeight - 16));
    const left = Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(bounds.top, window.innerHeight - height - 8));
    quickActionFloatingBounds = { left, top, width, height };
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  }

  function setQuickActionFloating(floating) {
    const panel = $("#quick-action-panel");
    const divider = $("#quick-action-divider");
    const dockButton = $("#quick-action-dock-button");
    if (floating === panel.classList.contains("is-floating")) return;
    if (floating) {
      const bounds = panel.getBoundingClientRect();
      quickActionDockedWidth = bounds.width || quickActionDockedWidth;
      quickActionPanelHome = { parent: panel.parentElement, nextSibling: panel.nextSibling };
      document.body.append(panel);
      panel.classList.add("is-floating");
      if (!quickActionFloatingBounds) {
        const width = Math.min(380, Math.max(280, bounds.width || 320), window.innerWidth - 16);
        const height = Math.min(420, Math.max(260, Math.round(window.innerHeight * 0.62)), window.innerHeight - 16);
        quickActionFloatingBounds = {
          left: Math.max(8, window.innerWidth - width - 24),
          top: Math.max(8, Math.round((window.innerHeight - height) / 2)),
          width,
          height,
        };
      }
      applyQuickActionFloatingBounds(quickActionFloatingBounds);
    } else {
      if (quickActionPanelHome) {
        const { parent, nextSibling } = quickActionPanelHome;
        parent.insertBefore(panel, nextSibling?.parentNode === parent ? nextSibling : null);
      }
      quickActionPanelHome = null;
      panel.classList.remove("is-floating");
      panel.style.removeProperty("left");
      panel.style.removeProperty("top");
      syncQuickActionDockedSize();
    }
    divider.hidden = !userSettings.quickActionEnabled || floating;
    dockButton.hidden = !floating;
  }

  function bindQuickActionPanelInteractions() {
    const panel = $("#quick-action-panel");
    const dragHandle = $("#quick-action-drag-handle");
    const dockButton = $("#quick-action-dock-button");
    const divider = $("#quick-action-divider");
    dragHandle.addEventListener("click", () => {
      if (quickActionDragClickSuppressed) {
        quickActionDragClickSuppressed = false;
        return;
      }
      setQuickActionFloating(!panel.classList.contains("is-floating"));
    });
    dragHandle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const start = { x: event.clientX, y: event.clientY };
      const bounds = panel.getBoundingClientRect();
      const offset = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      let moved = false;
      const move = (moveEvent) => {
        if (!moved && Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) < 5) return;
        if (!moved) {
          moved = true;
          if (!panel.classList.contains("is-floating")) setQuickActionFloating(true);
        }
        applyQuickActionFloatingBounds({
          ...quickActionFloatingBounds,
          left: moveEvent.clientX - offset.x,
          top: moveEvent.clientY - offset.y,
        });
      };
      const finish = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        if (moved) {
          quickActionDragClickSuppressed = true;
          window.setTimeout(() => { quickActionDragClickSuppressed = false; }, 0);
        }
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    });
    dockButton.addEventListener("click", () => setQuickActionFloating(false));

    divider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || panel.classList.contains("is-floating")) return;
      event.preventDefault();
      const parent = $("#track-view-content");
      const vertical = window.getComputedStyle(parent).flexDirection !== "column";
      divider.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
      const resize = (moveEvent) => {
        const bounds = parent.getBoundingClientRect();
        if (vertical) {
          quickActionDockedWidth = Math.max(190, Math.min(bounds.width * 0.62, bounds.right - moveEvent.clientX));
          panel.style.width = `${quickActionDockedWidth}px`;
          panel.style.flexBasis = `${quickActionDockedWidth}px`;
          divider.setAttribute("aria-valuenow", String(Math.round(quickActionDockedWidth)));
        } else {
          quickActionDockedHeight = Math.max(120, Math.min(bounds.height * 0.7, bounds.bottom - moveEvent.clientY));
          panel.style.height = `${quickActionDockedHeight}px`;
          panel.style.flexBasis = `${quickActionDockedHeight}px`;
          divider.setAttribute("aria-valuenow", String(Math.round(quickActionDockedHeight)));
        }
      };
      const finish = () => {
        document.removeEventListener("pointermove", resize);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
      };
      document.addEventListener("pointermove", resize);
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    });
    divider.addEventListener("keydown", (event) => {
      const parent = $("#track-view-content");
      const vertical = window.getComputedStyle(parent).flexDirection !== "column";
      divider.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
      const direction = vertical
        ? event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0
        : event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
      if (direction) {
        event.preventDefault();
        if (vertical) {
          quickActionDockedWidth = Math.max(190, Math.min(parent.clientWidth * 0.62,
            quickActionDockedWidth - direction * 20));
          panel.style.width = `${quickActionDockedWidth}px`;
          panel.style.flexBasis = `${quickActionDockedWidth}px`;
        } else {
          quickActionDockedHeight = Math.max(120, Math.min(parent.clientHeight * 0.7,
            (panel.getBoundingClientRect().height || quickActionDockedHeight) - direction * 20));
          panel.style.height = `${quickActionDockedHeight}px`;
          panel.style.flexBasis = `${quickActionDockedHeight}px`;
        }
      }
    });
    panel.querySelectorAll(".quick-action-resize-handle").forEach((handle) => {
      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || !panel.classList.contains("is-floating")) return;
        event.preventDefault();
        const edge = handle.dataset.resizeEdge;
        const start = panel.getBoundingClientRect();
        const resize = (moveEvent) => {
          const bounds = {
            left: start.left,
            top: start.top,
            width: start.width,
            height: start.height,
          };
          if (edge === "left") {
            bounds.width = start.right - moveEvent.clientX;
            bounds.left = start.right - bounds.width;
          } else if (edge === "right") bounds.width = moveEvent.clientX - start.left;
          else if (edge === "top") {
            bounds.height = start.bottom - moveEvent.clientY;
            bounds.top = start.bottom - bounds.height;
          } else if (edge === "bottom") bounds.height = moveEvent.clientY - start.top;
          applyQuickActionFloatingBounds(bounds);
        };
        const finish = () => {
          document.removeEventListener("pointermove", resize);
          document.removeEventListener("pointerup", finish);
          document.removeEventListener("pointercancel", finish);
        };
        document.addEventListener("pointermove", resize);
        document.addEventListener("pointerup", finish);
        document.addEventListener("pointercancel", finish);
      });
    });
    window.addEventListener("resize", () => {
      if (panel.classList.contains("is-floating") && quickActionFloatingBounds) {
        applyQuickActionFloatingBounds(quickActionFloatingBounds);
      } else {
        syncQuickActionDockedSize();
      }
    });
  }

  function syncQuickActionDockedSize() {
    const panel = $("#quick-action-panel");
    const parent = $("#track-view-content");
    if (!panel || !parent || panel.classList.contains("is-floating")) return;
    const vertical = window.getComputedStyle(parent).flexDirection !== "column";
    const divider = $("#quick-action-divider");
    divider.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
    if (vertical) {
      quickActionDockedWidth = Math.max(190, Math.min(quickActionDockedWidth, parent.clientWidth * 0.62));
      panel.style.removeProperty("height");
      panel.style.width = `${quickActionDockedWidth}px`;
      panel.style.flexBasis = `${quickActionDockedWidth}px`;
    } else {
      panel.style.width = "100%";
      panel.style.height = `${quickActionDockedHeight}px`;
      panel.style.flexBasis = `${quickActionDockedHeight}px`;
    }
  }

  function makeQuickActionMenuStrip(root) {
    const toolbar = document.createElement("div");
    toolbar.className = "quick-action-menu-strip";
    root.append(toolbar);
    return toolbar;
  }

  function addQuickActionButton(toolbar, text, action, title = text) {
    const button = document.createElement("button");
    button.className = "quick-action-menu-button";
    button.type = "button";
    button.textContent = text;
    button.title = title;
    button.addEventListener("click", action);
    toolbar.append(button);
    return button;
  }

  function addQuickActionSelect(toolbar, label, options, value, action) {
    const select = document.createElement("select");
    select.className = "quick-action-menu-select";
    select.setAttribute("aria-label", label);
    select.title = label;
    options.forEach(([optionValue, optionLabel]) => select.add(new Option(optionLabel, optionValue)));
    select.value = String(value ?? "");
    select.addEventListener("change", () => action(select.value));
    toolbar.append(select);
    return select;
  }

  function addQuickActionProxyButton(toolbar, label, selector, title = label) {
    const source = $(selector);
    const button = addQuickActionButton(toolbar, label, () => source.click(), title);
    button.disabled = source.disabled || source.hidden;
    return button;
  }

  function addQuickActionProxySelect(toolbar, label, selector) {
    const source = $(selector);
    return addQuickActionSelect(toolbar, label,
      Array.from(source.options, (option) => [option.value, option.textContent]),
      source.value,
      (value) => {
        source.value = value;
        source.dispatchEvent(new Event("change", { bubbles: true }));
      });
  }

  function addQuickActionProxyRange(toolbar, label, selector) {
    const source = $(selector);
    const range = document.createElement("input");
    range.className = "quick-action-menu-range";
    range.type = "range";
    range.min = source.min;
    range.max = source.max;
    range.step = source.step;
    range.value = source.value;
    range.setAttribute("aria-label", label);
    range.title = label;
    range.addEventListener("input", () => {
      source.value = range.value;
      source.dispatchEvent(new Event("input", { bubbles: true }));
    });
    range.addEventListener("change", () => {
      source.value = range.value;
      source.dispatchEvent(new Event("change", { bubbles: true }));
    });
    toolbar.append(range);
    return range;
  }

  function addQuickActionProxyCheckbox(toolbar, label, selector) {
    const source = $(selector);
    const wrapper = document.createElement("label");
    wrapper.className = "quick-action-menu-check";
    wrapper.title = label;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = source.checked;
    input.setAttribute("aria-label", label);
    input.addEventListener("change", () => {
      source.checked = input.checked;
      source.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const text = document.createElement("span");
    text.textContent = label;
    wrapper.append(input, text);
    toolbar.append(wrapper);
    return input;
  }

  function addQuickActionSeparator(toolbar) {
    const separator = document.createElement("span");
    separator.className = "quick-action-menu-separator";
    separator.setAttribute("aria-hidden", "true");
    toolbar.append(separator);
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
    syncQuickActionDockedSize();
    $("#quick-action-divider").hidden = !userSettings.quickActionEnabled || panel.classList.contains("is-floating");
    $("#quick-action-dock-button").hidden = !panel.classList.contains("is-floating");
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
    const toolbar = makeQuickActionMenuStrip(root);
    addQuickActionButton(toolbar, "+ Effects Track", createEffectTrack);
    const effects = document.createElement("details");
    effects.className = "quick-action-menu-dropdown";
    effects.open = quickMixerEffectsOpen;
    const summary = document.createElement("summary");
    summary.textContent = "ADD EFFECT";
    effects.append(summary);
    const effectList = document.createElement("div");
    effectList.className = "quick-mixer-effect-list";
    const presetGroup = document.createElement("section");
    presetGroup.className = "quick-mixer-effect-category";
    const presetHeading = document.createElement("span");
    presetHeading.textContent = "Included presets";
    presetGroup.append(presetHeading);
    MIXER_PRESETS.forEach((preset) => {
      const button = addQuickActionButton(presetGroup, preset.name,
        () => applyMixerPreset(preset), preset.description);
      button.classList.add("mixer-library-effect");
    });
    effectList.append(presetGroup);
    EFFECT_CATEGORIES.forEach((category) => {
      const categoryGroup = document.createElement("section");
      categoryGroup.className = "quick-mixer-effect-category";
      const categoryHeading = document.createElement("span");
      categoryHeading.textContent = category.name;
      categoryGroup.append(categoryHeading);
      category.effects.forEach(([id, name]) => {
        const button = document.createElement("button");
        button.className = "mixer-library-effect quick-action-menu-button";
        button.type = "button";
        button.textContent = name;
        button.title = `${category.name}: ${name}`;
        button.addEventListener("click", () => {
          const channels = getMixerTracks();
          const target = channels.find(({ track }) => track.id === state.selectedMixerTrackId)?.track ||
            channels.find(({ type }) => type === "Master")?.track;
          if (target) addMixerEffect(target, id, true);
        });
        categoryGroup.append(button);
      });
      effectList.append(categoryGroup);
    });
    effects.append(effectList);
    const positionEffectList = () => {
      if (!effects.open) return;
      const bounds = summary.getBoundingClientRect();
      const width = Math.min(250, window.innerWidth - 16);
      const height = Math.min(360, window.innerHeight * 0.5);
      const top = bounds.bottom + height + 8 > window.innerHeight
        ? Math.max(8, bounds.top - height - 3)
        : bounds.bottom + 3;
      effectList.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
      effectList.style.top = `${top}px`;
    };
    effects.addEventListener("toggle", () => {
      quickMixerEffectsOpen = effects.open;
      positionEffectList();
    });
    toolbar.append(effects);
    positionEffectList();

    const trackList = document.createElement("div");
    trackList.className = "quick-mixer-track-list";
    trackList.setAttribute("aria-label", "Mixer lanes; scroll vertically from Master");
    trackList.tabIndex = 0;
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
      const titleGroup = document.createElement("div");
      titleGroup.className = "quick-mixer-title-group";
      titleGroup.append(title);
      if (track.kind === "mixer-effects") {
        addQuickActionButton(titleGroup, "Rename", () => renameEffectTrack(track));
        addQuickActionButton(titleGroup, "Route", () => openMixerRoutingDialog(track));
        addQuickActionButton(titleGroup, "Delete", () => removeEffectTrack(track));
      }
      const effectTarget = document.createElement("div");
      effectTarget.className = "mixer-track-effects quick-mixer-effects";
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
        presetControls.className = "quick-mixer-preset-controls";
        addQuickActionButton(presetControls, "Save preset", () => saveEffectTrackPreset(track));
        const presetSelect = document.createElement("select");
        presetSelect.setAttribute("aria-label", `Saved effects presets for ${track.name}`);
        presetSelect.add(new Option(state.effectPresets.length ? "Choose preset…" : "No saved presets", ""));
        state.effectPresets.forEach((preset) => presetSelect.add(new Option(preset.name, preset.id)));
        presetSelect.disabled = state.effectPresets.length === 0;
        const applyButton = addQuickActionButton(presetControls, "Apply", () => {
          if (presetSelect.value) applyEffectTrackPreset(track, presetSelect.value);
        });
        applyButton.disabled = true;
        presetSelect.addEventListener("change", () => { applyButton.disabled = !presetSelect.value; });
        presetControls.insertBefore(presetSelect, applyButton);
        effectTarget.append(presetControls);
      }
      effectTarget.append(makeMixerEffectSlots(track));
      lane.append(titleGroup, controls, effectTarget);
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
    const toolbar = makeQuickActionMenuStrip(root);
    addQuickActionSelect(toolbar, "Pattern", state.patterns.map((item) => [item.id, item.name]),
      pattern.id, selectPattern);
    addQuickActionButton(toolbar, "Rename", renamePattern);
    addQuickActionButton(toolbar, "New", () => createPattern());
    addQuickActionSelect(toolbar, "Step size",
      ["1/4", "1/8", "1/16", "1/32", "1/64"].map((item) => [item, item]),
      getPatternGridResolution(pattern), setPatternGridResolution);
    addQuickActionButton(toolbar, "− Bar", () => setLength(state.steps - 16), "Remove one Rack bar");
    addQuickActionButton(toolbar, "+ Bar", () => setLength(state.steps + 16), "Add one Rack bar");
    const scale = document.createElement("input");
    scale.className = "quick-action-menu-range";
    scale.type = "range";
    scale.min = "50";
    scale.max = "400";
    scale.step = "1";
    scale.value = String(Math.round(state.sequencerScale * 100));
    scale.setAttribute("aria-label", "Rack scale");
    scale.title = "Rack scale";
    scale.addEventListener("input", () => setSequencerScale(Number(scale.value) / 100));
    toolbar.append(scale);
    const recordButton = addQuickActionButton(toolbar, "Record keys",
      () => toggleKeyboardRecording("sequencer"), "Record keyboard notes into the Rack");
    recordButton.setAttribute("aria-pressed", String(state.keyboardRecording?.mode === "sequencer"));
    addQuickActionButton(toolbar, "Browser", openAssetLibrary, "Open the asset library");
    addQuickActionButton(toolbar, "Export", exportPattern);
    addQuickActionButton(toolbar, "Clear", clearPattern);
    addQuickActionButton(toolbar, "Reset", () => $("#reset-session").click(), "Reset session");
    addQuickActionSelect(toolbar, "Preload pattern",
      [["", "Preload"], ...PRESETS.map((preset) => [preset.id, preset.title])],
      "", (presetId) => {
        const preset = PRESETS.find((item) => item.id === presetId);
        if (preset) loadPreset(preset);
      });

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
    const labelWidth = 94;
    const cellWidth = 20 * state.sequencerScale;
    const gap = 3 * state.sequencerScale;
    ruler.style.gridTemplateColumns = `${labelWidth}px repeat(${stepCount}, ${cellWidth}px)`;
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
      row.style.gridTemplateColumns = `${labelWidth}px max-content`;
      const name = document.createElement("span");
      name.className = "quick-step-track-name";
      name.textContent = track.name;
      name.style.setProperty("--quick-track-color", track.color);
      row.append(name);
      const cells = document.createElement("div");
      cells.className = "quick-step-cells";
      cells.style.gridTemplateColumns = `repeat(${stepCount}, ${cellWidth}px)`;
      cells.style.gap = `${gap}px`;
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
    setQuickActionStepPlayhead(quickActionStepPlayhead);
  }

  function renderQuickPianoRoll(root) {
    const toolbar = makeQuickActionMenuStrip(root);
    addQuickActionProxyButton(toolbar, "Loop", "#piano-loop-button");
    addQuickActionProxyButton(toolbar, "Record keys", "#piano-keyboard-record-button");
    addQuickActionSeparator(toolbar);
    addQuickActionProxyButton(toolbar, "Draw", "#piano-draw-mode-button");
    addQuickActionProxyButton(toolbar, "Humanize", "#piano-humanize-button");
    addQuickActionProxyButton(toolbar, "Quantize", "#piano-quantize-button");
    addQuickActionProxyButton(toolbar, "Clear", "#clear-piano-roll-button", "Clear notes");
    addQuickActionSeparator(toolbar);
    addQuickActionProxyButton(toolbar, "Import audio", "#piano-audio-import-button");
    addQuickActionProxySelect(toolbar, "Audio source", "#piano-audio-source-select");
    addQuickActionProxySelect(toolbar, "Transcription mode", "#piano-audio-mode-select");
    addQuickActionProxyButton(toolbar, "Transcribe", "#piano-audio-transcribe-button");
    addQuickActionProxyButton(toolbar, "Scan", "#piano-audio-scan-button");
    addQuickActionProxyButton(toolbar, "Chop", "#piano-audio-chop-button");
    ["melody", "vocals", "percussion", "bass"].forEach((stem) => {
      const source = $(`#piano-audio-stems [data-audio-stem="${stem}"]`);
      const wrapper = document.createElement("label");
      wrapper.className = "quick-action-menu-check";
      wrapper.title = `Use ${stem} stem`;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = source.checked;
      input.setAttribute("aria-label", `${stem} audio stem`);
      input.addEventListener("change", () => {
        source.checked = input.checked;
        source.dispatchEvent(new Event("change", { bubbles: true }));
      });
      const text = document.createElement("span");
      text.textContent = stem;
      wrapper.append(input, text);
      toolbar.append(wrapper);
    });
    addQuickActionSeparator(toolbar);
    addQuickActionProxySelect(toolbar, "Key", "#piano-scale-root");
    addQuickActionProxySelect(toolbar, "Scale", "#piano-scale-type");
    addQuickActionProxyCheckbox(toolbar, "Scale lock", "#piano-scale-lock");
    addQuickActionProxyButton(toolbar, "Tune", "#piano-autotune-button", "Tune notes to the selected key");
    addQuickActionSeparator(toolbar);
    addQuickActionProxySelect(toolbar, "Melody", "#mel-select");
    addQuickActionProxyButton(toolbar, "New Mel", "#new-mel-button");
    addQuickActionProxyButton(toolbar, "Rename Mel", "#rename-mel-button");
    addQuickActionProxyButton(toolbar, "Export Mel", "#export-mel-button");
    const dragMel = addQuickActionButton(toolbar, "Drag Mel", () => {}, "Drag the selected Mel to Track View");
    dragMel.draggable = true;
    dragMel.disabled = $("#mel-drag-source").disabled;
    dragMel.addEventListener("dragstart", (event) => {
      if (!event.dataTransfer) return;
      if (state.stepPianoEditContext) {
        syncStepPianoEdit();
        const pattern = getPattern(state.stepPianoEditContext.patternId);
        if (!pattern) return;
        event.dataTransfer.setData("application/x-pulsegrid-pattern-source", JSON.stringify({ patternId: pattern.id }));
      } else {
        const mel = getMel();
        if (!mel) return;
        event.dataTransfer.setData("application/x-pulsegrid-mel-source", JSON.stringify({ melId: mel.id }));
      }
      event.dataTransfer.effectAllowed = "copy";
    });
    addQuickActionSeparator(toolbar);
    addQuickActionProxyButton(toolbar, "Instrument", "#piano-instrument-select");
    addQuickActionProxyButton(toolbar, "Mix", "#piano-track-mix-button");
    addQuickActionProxySelect(toolbar, "Snap", "#piano-snap-select");
    addQuickActionProxySelect(toolbar, "Note length", "#piano-note-length-select");
    addQuickActionProxySelect(toolbar, "Bars", "#piano-bars-select");
    addQuickActionProxyRange(toolbar, "Piano Roll scale", "#piano-scale-slider");
    addQuickActionSeparator(toolbar);
    addQuickActionProxyButton(toolbar, "Import MIDI", "#import-midi-button");
    addQuickActionProxyButton(toolbar, "Export MIDI", "#export-midi-button");

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
    const pianoCellWidth = Math.max(6, Math.min(20, 12 * state.pianoScale));
    const viewport = document.createElement("div");
    viewport.className = "quick-piano-viewport";
    const ruler = document.createElement("div");
    ruler.className = "quick-action-bar-meter quick-piano-bar-meter";
    const notesPerBar = Math.ceil(PIANO_TICKS_PER_BAR / snapTicks);
    ruler.style.gridTemplateColumns = `34px repeat(${state.pianoBars}, ${notesPerBar * pianoCellWidth}px)`;
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
    grid.dataset.snapTicks = String(snapTicks);
    for (let midi = PIANO_TOP_MIDI; midi >= PIANO_BOTTOM_MIDI; midi -= 1) {
      const row = document.createElement("div");
      row.className = `quick-piano-row${[1, 3, 6, 8, 10].includes(midi % 12) ? " is-black" : ""}`;
      const key = document.createElement("span");
      key.className = "quick-piano-key";
      key.textContent = midi % 12 === 0 ? midiNoteName(midi) : "";
      row.append(key);
      const cells = document.createElement("div");
      cells.className = "quick-piano-cells";
      cells.style.gridTemplateColumns = `repeat(${noteSteps}, ${pianoCellWidth}px)`;
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
          markPianoRollAudioEdited();
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
    setQuickActionPianoPlayhead(quickActionPianoPlayheadTick);
  }

  function setQuickActionStepPlayhead(step) {
    quickActionStepPlayhead = Number.isFinite(step) ? Math.floor(step) : -1;
    const grid = document.querySelector("#quick-action-content .quick-step-grid");
    if (!grid) return;
    grid.querySelectorAll(".quick-step-cell.is-playhead").forEach((cell) => {
      cell.classList.remove("is-playhead");
    });
    if (quickActionStepPlayhead < 0) return;
    grid.querySelectorAll(`.quick-step-cell[data-step="${quickActionStepPlayhead}"]`).forEach((cell) => {
      cell.classList.add("is-playhead");
    });
  }

  function setQuickActionPianoPlayhead(tick) {
    quickActionPianoPlayheadTick = Math.max(0, Number.isFinite(tick) ? tick : 0);
    const grid = document.querySelector("#quick-action-content .quick-piano-grid");
    if (!grid) return;
    const snapTicks = Math.max(1, Number(grid.dataset.snapTicks) || 1);
    grid.style.setProperty("--quick-piano-playhead-x",
      `${34 + quickActionPianoPlayheadTick / snapTicks * 12}px`);
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
    $("#metronome-volume").style.setProperty("--range-progress", `${volume / 2}%`);
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
