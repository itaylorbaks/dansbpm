  function getPianoTrack(trackId = state.selectedPianoTrackId) {
    return state.tracks.find((track) => track.id === trackId) || null;
  }

  function getMel(melId = state.selectedMelId) {
    return state.mels.find((mel) => mel.id === melId) || null;
  }

  function makeMel(name, instrumentId = state.selectedPianoTrackId, bars = state.pianoBars, notes = []) {
    return { id: makeId(), name, instrumentId, bars, notes: notes.map((note) => ({ ...note })), audioSourceClipId: null };
  }

  function captureCurrentMel() {
    if (state.stepPianoEditContext) return;
    const mel = getMel();
    if (!mel) return;
    mel.instrumentId = state.selectedPianoTrackId;
    mel.bars = state.pianoBars;
    mel.notes = state.pianoNotes.map((note) => ({ ...note, trackId: mel.instrumentId }));
  }

  function loadMel(melId) {
    const mel = getMel(melId);
    if (!mel) return;
    state.selectedMelId = mel.id;
    state.selectedPianoTrackId = state.tracks.some((track) => track.id === mel.instrumentId)
      ? mel.instrumentId
      : state.tracks.find((track) => track.id === "piano-grand")?.id || state.tracks[0]?.id || "";
    state.pianoBars = [1, 2, 4, 8].includes(mel.bars) ? mel.bars : 4;
    state.pianoNotes = mel.notes.map((note) => ({ ...note, trackId: state.selectedPianoTrackId }));
    state.pianoRollAudioClipId = mel.audioSourceClipId || null;
    state.selectedPianoNoteId = null;
    state.selectedPianoNoteIds.clear();
    state.pianoSelectionFromMarquee = false;
  }

  function ensureMels() {
    if (!state.mels.length) {
      const mel = makeMel("Mel 1", state.selectedPianoTrackId, state.pianoBars, state.pianoNotes);
      state.mels = [mel];
      state.selectedMelId = mel.id;
      if (mel.notes.length) {
        const track = {
          id: makeId(), name: mel.name, kind: "mel", insertAfterTrackId: getLastArrangementTrackId(),
          instrumentId: mel.instrumentId, color: "#b5a0ff",
          muted: false, solo: false, volume: 1, automation: normalizeTrackAutomation(), automationOpen: false,
          gainNode: null, effects: makeDefaultEffects(), clips: [{ id: makeId(), melId: mel.id, startBar: state.pianoStartBar }],
        };
        state.melTracks.push(track);
      }
    }
    if (!state.mels.some((mel) => mel.id === state.selectedMelId)) state.selectedMelId = state.mels[0].id;
    loadMel(state.selectedMelId);
  }

  function getMelLengthBars(mel) {
    const noteEnd = mel.notes.reduce((latest, note) => Math.max(latest, note.startTick + note.durationTicks), 0);
    return Math.max(1, Math.min(8, Math.max(mel.bars || 1, Math.ceil(noteEnd / PIANO_TICKS_PER_BAR))));
  }

  function renderMelOptions() {
    const select = $("#mel-select");
    select.replaceChildren();
    state.mels.forEach((mel) => {
      const option = document.createElement("option");
      option.value = mel.id;
      option.textContent = mel.name;
      select.append(option);
    });
    select.value = state.selectedMelId || "";
    const mel = getMel();
    const dragSource = $("#mel-drag-source");
    dragSource.textContent = mel ? `Drag ${mel.name} to Track View` : "No Mel selected";
    dragSource.title = mel ? `Drag ${mel.name} to Track View` : "";
    dragSource.setAttribute("aria-label", dragSource.title || "No Mel selected");
    dragSource.disabled = !mel;
    dragSource.style.setProperty("--pattern-color", "#b5a0ff");
  }

  function selectMel(melId) {
    if (state.keyboardRecording?.mode === "piano-roll") stopPlayback();
    captureCurrentMel();
    loadMel(melId);
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
    saveState();
  }

  function createMel() {
    captureCurrentMel();
    const mel = makeMel(`Mel ${state.mels.length + 1}`);
    state.mels.push(mel);
    loadMel(mel.id);
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
    saveState();
    showToast(`${mel.name} created`);
  }

  function renameMel() {
    const mel = getMel();
    if (!mel) return;
    const value = window.prompt("Name this Mel", mel.name);
    if (value === null) return;
    const name = value.trim();
    if (!name) {
      showToast("A Mel needs a name.");
      return;
    }
    if (state.mels.some((item) => item.id !== mel.id && item.name.toLowerCase() === name.toLowerCase())) {
      showToast("Mel names must be unique.");
      return;
    }
    const oldName = mel.name;
    mel.name = name;
    state.melTracks.forEach((track) => {
      if (track.name === oldName && track.clips.some((clip) => clip.melId === mel.id)) track.name = name;
    });
    renderMelOptions();
    renderArrangement();
    saveState();
  }

  function renderPianoInstrumentOptions() {
    const picker = $("#piano-instrument-select");
    const instruments = state.tracks.filter((track) => !track.sourceId);
    if (!instruments.some((track) => track.id === state.selectedPianoTrackId)) {
      state.selectedPianoTrackId = instruments.find((track) => track.id === "piano-grand")?.id || instruments[0]?.id || "";
    }
    const selected = instruments.find((track) => track.id === state.selectedPianoTrackId);
    $("#piano-instrument-name").textContent = selected?.name || "Choose instrument";
    picker.disabled = !selected;
    picker.setAttribute("aria-label", selected ? `Piano roll instrument: ${selected.name}` : "Choose piano roll instrument");
    picker.title = selected?.name || "Choose an instrument";
    let editButton = $("#edit-dansbpm-synth");
    if (!editButton) {
      editButton = document.createElement("button");
      editButton.id = "edit-dansbpm-synth";
      editButton.className = "quiet-button synth-edit-button";
      editButton.type = "button";
      editButton.textContent = "Edit synth";
      editButton.setAttribute("aria-haspopup", "dialog");
      editButton.addEventListener("click", openDansBpmSynthEditor);
      picker.closest(".pattern-select-control").after(editButton);
    }
    editButton.hidden = selected?.id !== "synth-dansbpm";
  }

  function getDansBpmSynthTrack() {
    return state.tracks.find((track) => track.id === "synth-dansbpm") || null;
  }

  function getDansBpmSynthStorageKey() {
    return `${STORAGE_KEY}-inhouse-synth-${state.currentUser}-${state.projectId}`;
  }

  function restoreDansBpmSynthPatch() {
    const track = getDansBpmSynthTrack();
    if (!track || !state.currentUser || !state.projectId) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(getDansBpmSynthStorageKey()) || "null");
      if (!saved || typeof saved !== "object") return;
      const waveforms = ["sine", "triangle", "sawtooth", "square"];
      track.patch = { ...track.patch };
      if (waveforms.includes(saved.wave)) track.patch.wave = saved.wave;
      if (waveforms.includes(saved.osc2Wave)) track.patch.osc2Wave = saved.osc2Wave;
      const ranges = {
        osc2Detune: [-30, 30], osc2Level: [0, 0.7], subLevel: [0, 0.7],
        cutoff: [80, 18000], resonance: [0.1, 0.95], filterEnvOctaves: [0, 5],
        attack: [0.001, 3], decay: [0.01, 4], sustain: [0, 1], release: [0.005, 5],
        filterAttack: [0.001, 3], filterDecay: [0.01, 4], filterSustain: [0, 1],
        lfoRate: [0, 12], lfoDepth: [0, 100], output: [0, 1],
      };
      Object.entries(ranges).forEach(([key, [min, max]]) => {
        if (Number.isFinite(saved[key])) track.patch[key] = Math.max(min, Math.min(max, saved[key]));
      });
    } catch (error) {
      showToast(`Could not load DansBPM Synth settings: ${error.message || "browser storage is unavailable."}`);
    }
  }

  function saveDansBpmSynthPatch(track) {
    if (!state.currentUser || !state.projectId) {
      showToast("Choose a profile and project before saving synth settings.");
      return;
    }
    try {
      window.localStorage.setItem(getDansBpmSynthStorageKey(), JSON.stringify(track.patch));
      saveState();
    } catch (error) {
      showToast(`Could not save DansBPM Synth settings: ${error.message || "browser storage is unavailable."}`);
    }
  }

  function formatDansBpmSynthValue(key, value) {
    if (key === "cutoff") return `${Math.round(value)} Hz`;
    if (key === "attack" || key === "decay" || key === "release" || key === "filterAttack" || key === "filterDecay") return `${Number(value).toFixed(2)} s`;
    if (key === "osc2Detune") return `${Math.round(value)} cents`;
    if (key === "filterEnvOctaves") return `${Number(value).toFixed(1)} oct`;
    if (key === "lfoRate") return `${Number(value).toFixed(2)} Hz`;
    if (["osc2Level", "subLevel", "sustain", "filterSustain", "output"].includes(key)) return `${Math.round(value * 100)}%`;
    if (key === "lfoDepth") return `${Math.round(value)} cents`;
    return Number(value).toFixed(2);
  }

  const dansBpmSynthPreview = {
    playing: false,
    starting: false,
    startRequestId: 0,
    timerId: null,
    animationFrame: null,
    context: null,
    output: null,
    analyser: null,
    waveform: null,
    noteIndex: 0,
    nextNoteTime: 0,
  };

  function ensureDansBpmSynthPreviewAudio() {
    const context = state.audioContext;
    if (dansBpmSynthPreview.context === context && dansBpmSynthPreview.output) return;
    dansBpmSynthPreview.output?.disconnect();
    dansBpmSynthPreview.analyser?.disconnect();
    const output = context.createGain();
    output.gain.value = 0;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;
    output.connect(analyser);
    analyser.connect(state.masterGain);
    dansBpmSynthPreview.context = context;
    dansBpmSynthPreview.output = output;
    dansBpmSynthPreview.analyser = analyser;
    dansBpmSynthPreview.waveform = new Uint8Array(analyser.fftSize);
  }

  function stopDansBpmSynthPreview(dialog) {
    const preview = dansBpmSynthPreview;
    preview.playing = false;
    preview.starting = false;
    preview.startRequestId += 1;
    if (preview.timerId !== null) window.clearInterval(preview.timerId);
    preview.timerId = null;
    if (preview.output && preview.context) {
      const now = preview.context.currentTime;
      preview.output.gain.cancelScheduledValues(now);
      preview.output.gain.setTargetAtTime(0, now, 0.015);
    }
    const button = dialog?.querySelector("#dansbpm-synth-preview-button");
    if (button) {
      button.disabled = false;
      button.textContent = "Play preview";
      button.setAttribute("aria-pressed", "false");
    }
  }

  function toggleDansBpmSynthPreview(dialog) {
    if (dansBpmSynthPreview.playing) {
      stopDansBpmSynthPreview(dialog);
      return;
    }
    if (dansBpmSynthPreview.starting) return;
    const track = getDansBpmSynthTrack();
    if (!track) {
      showToast("Select the DansBPM Synth instrument to preview it.");
      return;
    }
    dansBpmSynthPreview.starting = true;
    const requestId = dansBpmSynthPreview.startRequestId + 1;
    dansBpmSynthPreview.startRequestId = requestId;
    const previewButton = dialog.querySelector("#dansbpm-synth-preview-button");
    previewButton.disabled = true;
    ensureAudio().then(() => {
      const preview = dansBpmSynthPreview;
      if (requestId !== preview.startRequestId) return;
      preview.starting = false;
      if (!dialog.open) return;
      ensureDansBpmSynthPreviewAudio();
      const context = state.audioContext;
      preview.playing = true;
      preview.noteIndex = 0;
      preview.nextNoteTime = context.currentTime + 0.04;
      preview.output.gain.cancelScheduledValues(context.currentTime);
      preview.output.gain.setTargetAtTime(0.72, context.currentTime, 0.02);
      const button = dialog.querySelector("#dansbpm-synth-preview-button");
      button.disabled = false;
      button.textContent = "Stop preview";
      button.setAttribute("aria-pressed", "true");
      const notes = [60, 64, 67, 72, 67, 64];
      const schedulePreview = () => {
        if (!preview.playing) return;
        const currentTrack = getDansBpmSynthTrack();
        if (!currentTrack) {
          stopDansBpmSynthPreview(dialog);
          return;
        }
        try {
          while (preview.nextNoteTime < context.currentTime + 0.14) {
            const noteDuration = 30 / state.bpm;
            playInstrumentVoice(currentTrack, preview.nextNoteTime, notes[preview.noteIndex % notes.length],
              noteDuration, 0.68, currentTrack, preview.output);
            preview.noteIndex += 1;
            preview.nextNoteTime += 60 / state.bpm / 2;
          }
        } catch (error) {
          stopDansBpmSynthPreview(dialog);
          showToast(`Synth preview stopped: ${error.message || "audio is unavailable"}`);
        }
      };
      preview.timerId = window.setInterval(schedulePreview, 25);
      schedulePreview();
    }).catch((error) => {
      if (requestId !== dansBpmSynthPreview.startRequestId) return;
      dansBpmSynthPreview.starting = false;
      stopDansBpmSynthPreview(dialog);
      showToast(`Could not start synth preview: ${error.message || "audio is unavailable"}`);
    });
  }

  function drawDansBpmSynthVisualizer(dialog) {
    const preview = dansBpmSynthPreview;
    const canvas = dialog.querySelector("#dansbpm-synth-visualizer");
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * pixelRatio);
    const pixelHeight = Math.round(height * pixelRatio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = "#141518";
    context.fillRect(0, 0, width, height);
    const center = height / 2;
    context.strokeStyle = "#34363c";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, center);
    context.lineTo(width, center);
    context.stroke();
    if (preview.analyser && preview.waveform) {
      preview.analyser.getByteTimeDomainData(preview.waveform);
      context.strokeStyle = "#d3f36b";
      context.lineWidth = 1.5;
      context.beginPath();
      preview.waveform.forEach((value, index) => {
        const x = index / (preview.waveform.length - 1) * width;
        const y = (value - 128) / 128 * (height * 0.44) + center;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    }
    if (dialog.open) {
      preview.animationFrame = window.requestAnimationFrame(() => drawDansBpmSynthVisualizer(dialog));
    } else {
      preview.animationFrame = null;
    }
  }

  function createDansBpmSynthEditor() {
    const dialog = document.createElement("dialog");
    dialog.id = "dansbpm-synth-dialog";
    dialog.className = "dansbpm-synth-dialog";
    dialog.setAttribute("aria-labelledby", "dansbpm-synth-title");
    const heading = document.createElement("div");
    heading.className = "dansbpm-synth-heading";
    const title = document.createElement("div");
    const headingText = document.createElement("h2");
    headingText.id = "dansbpm-synth-title";
    headingText.textContent = "DansBPM Synth";
    const description = document.createElement("p");
    description.textContent = "Two oscillators, sub, filter envelope, and MIDI-controlled polyphonic voices.";
    title.append(headingText, description);
    const close = document.createElement("button");
    close.className = "dialog-close";
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close synth editor");
    close.addEventListener("click", () => dialog.close());
    heading.append(title, close);

    const preview = document.createElement("section");
    preview.className = "dansbpm-synth-preview";
    const previewHeading = document.createElement("div");
    previewHeading.className = "dansbpm-synth-preview-heading";
    const previewButton = document.createElement("button");
    previewButton.className = "export-button";
    previewButton.id = "dansbpm-synth-preview-button";
    previewButton.type = "button";
    previewButton.textContent = "Play preview";
    previewButton.setAttribute("aria-pressed", "false");
    previewButton.addEventListener("click", () => toggleDansBpmSynthPreview(dialog));
    const previewLabel = document.createElement("span");
    previewLabel.textContent = "Live C-major arpeggio";
    previewHeading.append(previewButton, previewLabel);
    const visualizer = document.createElement("canvas");
    visualizer.id = "dansbpm-synth-visualizer";
    visualizer.setAttribute("aria-label", "Live DansBPM Synth waveform visualizer");
    preview.append(previewHeading, visualizer);

    const controls = document.createElement("div");
    controls.className = "dansbpm-synth-controls";
    const definitions = [
      { key: "wave", label: "Oscillator 1", options: ["sine", "triangle", "sawtooth", "square"] },
      { key: "osc2Wave", label: "Oscillator 2", options: ["sine", "triangle", "sawtooth", "square"] },
      { key: "osc2Detune", label: "Oscillator 2 detune", min: -30, max: 30, step: 0.1 },
      { key: "osc2Level", label: "Oscillator 2 level", min: 0, max: 0.7, step: 0.01 },
      { key: "subLevel", label: "Sub level", min: 0, max: 0.7, step: 0.01 },
      { key: "cutoff", label: "Filter cutoff", min: 80, max: 18000, step: 10 },
      { key: "resonance", label: "Filter resonance", min: 0.1, max: 0.95, step: 0.01 },
      { key: "filterEnvOctaves", label: "Filter envelope", min: 0, max: 5, step: 0.1 },
      { key: "attack", label: "Amp attack", min: 0.001, max: 3, step: 0.001 },
      { key: "decay", label: "Amp decay", min: 0.01, max: 4, step: 0.01 },
      { key: "sustain", label: "Amp sustain", min: 0, max: 1, step: 0.01 },
      { key: "release", label: "Amp release", min: 0.005, max: 5, step: 0.01 },
      { key: "filterAttack", label: "Filter attack", min: 0.001, max: 3, step: 0.001 },
      { key: "filterDecay", label: "Filter decay", min: 0.01, max: 4, step: 0.01 },
      { key: "filterSustain", label: "Filter sustain", min: 0, max: 1, step: 0.01 },
      { key: "lfoRate", label: "LFO rate", min: 0, max: 12, step: 0.01 },
      { key: "lfoDepth", label: "LFO depth", min: 0, max: 100, step: 1 },
      { key: "output", label: "Output", min: 0, max: 1, step: 0.01 },
    ];
    definitions.forEach((definition) => {
      const control = document.createElement("label");
      control.className = "dansbpm-synth-control";
      const caption = document.createElement("span");
      caption.textContent = definition.label;
      const input = document.createElement(definition.options ? "select" : "input");
      input.dataset.patchKey = definition.key;
      input.setAttribute("aria-label", definition.label);
      if (definition.options) {
        definition.options.forEach((optionValue) => {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue;
          input.append(option);
        });
      } else {
        input.type = "range";
        input.min = String(definition.min);
        input.max = String(definition.max);
        input.step = String(definition.step);
      }
      const output = document.createElement("output");
      if (!definition.options) control.append(caption, input, output);
      else control.append(caption, input);
      const updatePatch = () => {
        const track = getDansBpmSynthTrack();
        if (!track) return;
        const value = input.tagName === "SELECT" ? input.value : Number(input.value);
        track.patch = { ...track.patch, [definition.key]: value };
        if (input.tagName !== "SELECT") output.textContent = formatDansBpmSynthValue(definition.key, value);
        saveDansBpmSynthPatch(track);
      };
      input.addEventListener(input.tagName === "SELECT" ? "change" : "input", updatePatch);
      controls.append(control);
    });

    const reset = document.createElement("button");
    reset.className = "quiet-button";
    reset.type = "button";
    reset.textContent = "Reset to factory";
    reset.addEventListener("click", () => {
      const track = getDansBpmSynthTrack();
      const factory = LIBRARY_TRACKS.find((instrument) => instrument.id === "synth-dansbpm");
      if (!track || !factory) return;
      track.patch = { ...factory.patch };
      syncDansBpmSynthEditor(dialog, track);
      saveDansBpmSynthPatch(track);
    });
    dialog.append(heading, preview, controls, reset);
    dialog.addEventListener("close", () => {
      stopDansBpmSynthPreview(dialog);
      if (dansBpmSynthPreview.animationFrame !== null) {
        window.cancelAnimationFrame(dansBpmSynthPreview.animationFrame);
        dansBpmSynthPreview.animationFrame = null;
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.append(dialog);
    return dialog;
  }

  function syncDansBpmSynthEditor(dialog, track) {
    dialog.querySelectorAll("[data-patch-key]").forEach((input) => {
      const key = input.dataset.patchKey;
      input.value = String(track.patch[key]);
      const output = input.parentElement.querySelector("output");
      if (output && input.tagName !== "SELECT") output.textContent = formatDansBpmSynthValue(key, Number(input.value));
    });
  }

  function openDansBpmSynthEditor() {
    const track = getPianoTrack();
    if (track?.id !== "synth-dansbpm") return;
    const dialog = $("#dansbpm-synth-dialog") || createDansBpmSynthEditor();
    dialog.dataset.trackId = track.id;
    syncDansBpmSynthEditor(dialog, track);
    dialog.showModal();
    if (dansBpmSynthPreview.animationFrame === null) drawDansBpmSynthVisualizer(dialog);
  }

  function selectPianoInstrument(trackId) {
    if (state.keyboardRecording?.mode === "piano-roll") stopPlayback();
    state.selectedPianoTrackId = trackId;
    state.pianoNotes = state.pianoNotes.map((note) => ({ ...note, trackId }));
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    state.pianoSelectionFromMarquee = false;
    renderPianoInstrumentOptions();
    renderPianoRoll();
    saveState();
  }

  function midiNoteName(midi) {
    const names = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
    return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
  }

  const PIANO_SCALE_INTERVALS = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    "major-pentatonic": [0, 2, 4, 7, 9],
    "minor-pentatonic": [0, 3, 5, 7, 10],
  };

  function isPianoPitchInScale(midi) {
    const intervals = PIANO_SCALE_INTERVALS[state.pianoScaleType] || PIANO_SCALE_INTERVALS.major;
    return intervals.includes(((midi - state.pianoScaleRoot) % 12 + 12) % 12);
  }

  function constrainPianoPitchToScale(midi) {
    if (!state.pianoScaleLock || isPianoPitchInScale(midi)) return midi;
    return nearestPianoPitchInScale(midi);
  }

  function isPianoAudioPassThrough(note) {
    return note.audioSlice?.pitchEdited === true && note.audioSlice.pitchEditable === false;
  }

  function nearestPianoPitchInScale(midi) {
    if (isPianoPitchInScale(midi)) return midi;
    for (let distance = 1; distance < 12; distance += 1) {
      if (midi - distance >= PIANO_BOTTOM_MIDI && isPianoPitchInScale(midi - distance)) return midi - distance;
      if (midi + distance <= PIANO_TOP_MIDI && isPianoPitchInScale(midi + distance)) return midi + distance;
    }
    return midi;
  }

  function tunePianoNotesToScale() {
    const selectedIds = new Set(state.selectedPianoNoteIds);
    if (state.selectedPianoNoteId) selectedIds.add(state.selectedPianoNoteId);
    const notes = state.pianoNotes.filter((note) =>
      (!selectedIds.size || selectedIds.has(note.id)) && !isPianoAudioPassThrough(note));
    if (!notes.length) {
      showToast("Import audio or add notes before tuning to a key.");
      return;
    }
    let changed = 0;
    notes.forEach((note) => {
      const pitch = nearestPianoPitchInScale(note.midi);
      if (pitch === note.midi) return;
      note.midi = pitch;
      changed += 1;
    });
    if (!changed) {
      showToast("The notes are already in the selected key and scale.");
      return;
    }
    renderPianoRoll();
    saveState();
    showToast(`Tuned ${changed} note${changed === 1 ? "" : "s"} to ${midiNoteName(state.pianoScaleRoot + 60).replace(/\d+$/, "")} ${state.pianoScaleType.replace("-", " ")}`);
  }

  async function importAudioToPianoRoll(file) {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before importing audio.");
      return;
    }
    const clip = await importRecording(file, null, 0, false);
    if (!clip) return;
    await transcribeAudioClipToPianoRoll(clip);
  }

  function getPianoRollAudioClipById(clipId) {
    if (!clipId) return null;
    for (const track of state.arrangementTracks) {
      const clip = track.clips.find((item) => item.id === clipId);
      if (clip) return clip;
    }
    return null;
  }

  function selectPianoRollAudioSource(clipId) {
    const clip = getPianoRollAudioClipById(clipId);
    state.pianoRollAudioClipId = clip?.id || null;
    const mel = getMel();
    if (mel) mel.audioSourceClipId = state.pianoRollAudioClipId;
    renderPianoRoll();
    saveState();
  }

  async function transcribeSelectedPianoAudio() {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before transcribing audio.");
      return;
    }
    const clip = getPianoRollAudioClipById(state.pianoRollAudioClipId);
    if (!clip?.buffer) {
      showToast("Choose an audio clip from Track View first.");
      return;
    }
    await transcribeAudioClipToPianoRoll(clip);
  }

  function getAudioPitchEditSegments(detectedNotes, durationSeconds) {
    const candidates = detectedNotes.map((note) => ({
      startSeconds: Math.max(0, note.startSeconds),
      endSeconds: Math.min(durationSeconds, note.endSeconds),
      midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
      velocity: note.velocity,
    })).filter((note) => note.endSeconds > note.startSeconds);
    const boundaries = [...new Set([
      0,
      durationSeconds,
      ...candidates.flatMap((note) => [note.startSeconds, note.endSeconds]),
    ])].sort((left, right) => left - right);
    const segments = [];
    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const startSeconds = boundaries[index];
      const endSeconds = boundaries[index + 1];
      if (endSeconds <= startSeconds) continue;
      const midpoint = (startSeconds + endSeconds) / 2;
      const pitch = candidates
        .filter((note) => note.startSeconds <= midpoint && note.endSeconds >= midpoint)
        .sort((left, right) => right.velocity - left.velocity)[0];
      const midi = pitch?.midi ?? 60;
      const pitchEditable = Boolean(pitch);
      const previous = segments.at(-1);
      if (previous && previous.midi === midi && previous.pitchEditable === pitchEditable) {
        previous.endSeconds = endSeconds;
      } else {
        segments.push({
          startSeconds,
          endSeconds,
          midi,
          velocity: pitch?.velocity ?? 0.8,
          pitchEditable,
        });
      }
    }
    return segments;
  }

  function getPianoChopperDivisionTicks() {
    const ticks = Number($("#piano-chopper-division").value);
    return [1, 2, 4, 8, 16].includes(ticks) ? ticks : 4;
  }

  function updatePianoChopperPreview() {
    const clip = getPianoRollAudioClip();
    if (!clip?.buffer) {
      $("#piano-chopper-preview").textContent = "Choose an audio clip with a loaded waveform.";
      return;
    }
    const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
    const sourceDuration = Math.max(0, Math.min(clip.buffer.duration - sourceOffset,
      clip.durationSeconds ?? clip.buffer.duration));
    const secondsPerTick = 240 / state.bpm / PIANO_TICKS_PER_BAR;
    const visibleDuration = Math.min(sourceDuration, secondsPerTick * 8 * PIANO_TICKS_PER_BAR);
    const sliceCount = Math.ceil(visibleDuration / (secondsPerTick * getPianoChopperDivisionTicks()));
    const exceedsPianoRoll = sourceDuration > secondsPerTick * 8 * PIANO_TICKS_PER_BAR;
    $("#piano-chopper-preview").textContent =
      `${sliceCount} slices · ${visibleDuration.toFixed(1)} seconds${exceedsPianoRoll ? " · only the first 8 bars fit in Piano Roll" : ""}`;
  }

  function openPianoAudioChopper() {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before chopping audio.");
      return;
    }
    const clip = getPianoRollAudioClip();
    if (!clip?.buffer) {
      showToast("Choose a loaded audio clip from Track View first.");
      return;
    }
    $("#piano-chopper-source").textContent = clip.name;
    $("#piano-chopper-source").title = clip.name;
    $("#piano-chopper-dropoff-value").textContent = `${$("#piano-chopper-dropoff").value}%`;
    $("#piano-chopper-pitch-value").textContent = `${$("#piano-chopper-pitch").value} semitones`;
    updatePianoChopperPreview();
    $("#piano-chopper-dialog").showModal();
  }

  function chopSelectedPianoAudio() {
    const clip = getPianoRollAudioClip();
    if (state.stepPianoEditContext || !clip?.buffer) {
      showToast("Choose a loaded audio clip in the Piano Roll first.");
      return;
    }
    const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
    const sourceDuration = Math.max(0, Math.min(clip.buffer.duration - sourceOffset,
      clip.durationSeconds ?? clip.buffer.duration));
    const secondsPerBar = 240 / state.bpm;
    const secondsPerTick = secondsPerBar / PIANO_TICKS_PER_BAR;
    const maximumTicks = 8 * PIANO_TICKS_PER_BAR;
    const durationTicks = Math.min(maximumTicks, sourceDuration / secondsPerTick);
    if (durationTicks <= 0) {
      showToast("This audio clip has no playable duration.");
      return;
    }
    const sliceTicks = getPianoChopperDivisionTicks();
    const pitch = Math.max(-12, Math.min(12, Number($("#piano-chopper-pitch").value) || 0));
    const dropOff = Math.max(0, Math.min(90, Number($("#piano-chopper-dropoff").value) || 0));
    const sliceCount = Math.ceil(durationTicks / sliceTicks);
    let mel = getMel();
    if (state.pianoNotes.length &&
      !state.pianoNotes.some((note) => note.audioSlice?.clipId === clip.id)) {
      captureCurrentMel();
      const baseName = `${clip.name.replace(/\.[^.]+$/, "").trim() || "Audio"} Chops`.slice(0, 48);
      let melName = baseName;
      let suffix = 2;
      while (state.mels.some((item) => item.name.toLowerCase() === melName.toLowerCase())) {
        melName = `${baseName.slice(0, 60 - String(suffix).length)} ${suffix}`;
        suffix += 1;
      }
      mel = makeMel(melName, state.selectedPianoTrackId, state.pianoBars, []);
      state.mels.push(mel);
      loadMel(mel.id);
    }
    state.pianoNotes = state.pianoNotes.filter((note) =>
      note.audioSlice?.clipId !== clip.id);
    const startIndex = state.pianoNotes.length;
    const trackId = state.selectedPianoTrackId;
    for (let index = 0; index < sliceCount; index += 1) {
      const startTick = index * sliceTicks;
      const endTick = Math.min(durationTicks, startTick + sliceTicks);
      const offsetSeconds = sourceOffset + startTick * secondsPerTick;
      const sliceDuration = Math.min((endTick - startTick) * secondsPerTick,
        sourceOffset + sourceDuration - offsetSeconds);
      if (sliceDuration <= 0) continue;
      state.pianoNotes.push({
        id: makeId(),
        trackId,
        midi: 60 + pitch,
        startTick,
        durationTicks: Math.max(0.5, endTick - startTick),
        velocity: 0.8,
        audioSlice: {
          clipId: clip.id,
          offsetSeconds,
          durationSeconds: sliceDuration,
          dropOff,
          sliceNumber: index + 1,
        },
      });
    }
    state.pianoRollAudioClipId = clip.id;
    if (mel) {
      mel.audioSourceClipId = clip.id;
      mel.bars = Math.max(mel.bars || 1, [1, 2, 4, 8].find((bars) => bars * PIANO_TICKS_PER_BAR >= durationTicks) || 8);
    }
    state.pianoBars = Math.max(state.pianoBars,
      [1, 2, 4, 8].find((bars) => bars * PIANO_TICKS_PER_BAR >= durationTicks) || 8);
    state.selectedPianoNoteId = state.pianoNotes[startIndex]?.id || null;
    state.selectedPianoNoteIds = new Set(state.selectedPianoNoteId ? [state.selectedPianoNoteId] : []);
    $("#piano-chopper-dialog").close();
    renderMelOptions();
    renderPianoRoll();
    updateArrangementLength();
    renderArrangement();
    saveState();
    const notice = sourceDuration > maximumTicks * secondsPerTick ? " Only the first 8 bars were chopped." : "";
    showToast(`Created ${sliceCount} movable audio slices from ${clip.name}.${notice}`);
  }

  async function transcribeAudioClipToPianoRoll(clip) {
    if (state.isPlaying) stopPlayback();
    state.pianoRollAudioClipId = clip.id;
    const mode = $("#piano-audio-mode-select").value === "audio" ? "audio" : "instrument";
    try {
      const tempoRatio = getAudioClipTempoRatio(clip);
      const detectedNotes = estimateAudioPitchNotes(clip.buffer, clip.sourceOffsetSeconds || 0,
        clip.durationSeconds ?? clip.buffer.duration);
      const secondsPerBar = 240 / state.bpm;
      const maxTicks = 8 * PIANO_TICKS_PER_BAR;
      const clipSourceDuration = Math.max(0, Math.min(
        clip.buffer.duration - (clip.sourceOffsetSeconds || 0),
        clip.durationSeconds ?? clip.buffer.duration,
      ));
      const analyzedDuration = Math.min(clipSourceDuration, secondsPerBar * 8 * tempoRatio);
      const sourceNotes = mode === "audio"
        ? getAudioPitchEditSegments(detectedNotes, analyzedDuration)
        : detectedNotes.map((note) => ({
          startSeconds: note.startSeconds,
          endSeconds: note.endSeconds,
          midi: note.midi,
          velocity: note.velocity,
        }));
      const notes = sourceNotes
        .map((note) => {
          const startTick = note.startSeconds / tempoRatio / secondsPerBar * PIANO_TICKS_PER_BAR;
          if (startTick >= maxTicks) return null;
          const midi = Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi));
          const startSeconds = Math.max(0, note.startSeconds);
          const endSeconds = Math.max(startSeconds, note.endSeconds);
          return {
            id: makeId(),
            trackId: state.selectedPianoTrackId,
            midi,
            startTick: Math.max(0, startTick),
            durationTicks: Math.max(0.5, Math.min(maxTicks - startTick,
              (endSeconds - startSeconds) / tempoRatio / secondsPerBar * PIANO_TICKS_PER_BAR)),
            velocity: note.velocity,
            ...(mode === "audio" ? {
              audioSlice: {
                clipId: clip.id,
                offsetSeconds: Math.max(0, clip.sourceOffsetSeconds || 0) + startSeconds,
                durationSeconds: endSeconds - startSeconds,
                dropOff: 10,
                rootMidi: note.pitchEditable ? midi : 60,
                pitchEdited: true,
                pitchEditable: note.pitchEditable === true,
              },
            } : {}),
          };
        })
        .filter(Boolean)
        .slice(0, 4096);
      const clipDurationBars = clipSourceDuration / tempoRatio / secondsPerBar;
      const bars = [1, 2, 4, 8].find((bar) => bar * PIANO_TICKS_PER_BAR >=
        Math.min(maxTicks, clipDurationBars * PIANO_TICKS_PER_BAR)) || 8;
      const name = clip.name.replace(/\.[^.]+$/, "").trim() || "Audio transcription";
      const mel = makeMel(name, state.selectedPianoTrackId, bars, notes);
      mel.audioSourceClipId = clip.id;
      state.mels.push(mel);
      state.selectedMelId = mel.id;
      loadMel(mel.id);
      const detectedKey = clip.audioMetadata?.key?.match(/^([A-G]#?) (major|minor)$/i);
      if (detectedKey) {
        const keyNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const root = keyNames.findIndex((key) => key.toLowerCase() === detectedKey[1].toLowerCase());
        if (root >= 0) {
          state.pianoScaleRoot = root;
          state.pianoScaleType = detectedKey[2].toLowerCase();
        }
      }
      renderMelOptions();
      renderPianoInstrumentOptions();
      renderPianoRoll();
      renderArrangement();
      saveState();
      if (!detectedNotes.length) {
        showToast(mode === "audio"
          ? `Kept the original audio, but found no stable pitches to edit in ${clip.name}.`
          : "No stable pitches were detected; use the waveform as a reference for manual note entry.");
      } else {
        const analysisLimit = clipSourceDuration > secondsPerBar * 8 * tempoRatio
          ? " Only the first 8 bars were analyzed." : "";
        const noteType = mode === "audio"
          ? "audio-backed segments; drag pitched notes to tune them" : "editable instrument notes";
        showToast(`Created ${notes.length} ${noteType} from ${clip.name}.${analysisLimit}`);
      }
      return mel;
    } catch (error) {
      showToast(`Could not transcribe ${clip.name}: ${error.message || "unknown error"}`);
      return null;
    }
  }

  async function openAudioClipInPianoRoll(trackId, clipId) {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before editing an audio segment.");
      return;
    }
    const track = state.arrangementTracks.find((item) => item.id === trackId);
    const clip = track?.clips.find((item) => item.id === clipId);
    if (!clip?.buffer) {
      showToast("That audio segment is no longer available.");
      return;
    }

    captureCurrentMel();
    stopAllWorkspacePlayers();
    const linkedMel = state.mels.slice().reverse().find((mel) => mel.audioSourceClipId === clip.id);
    if (linkedMel) {
      loadMel(linkedMel.id);
    } else {
      state.pianoRollAudioClipId = clip.id;
    }
    setWorkspaceView("piano-roll", true);
    $("#piano-audio-mode-select").value = "audio";
    const audioOptions = $("#piano-toolbar-audio-options");
    const audioToggle = document.querySelector('[aria-controls="piano-toolbar-audio-options"]');
    audioOptions.hidden = false;
    audioToggle?.setAttribute("aria-expanded", "true");
    if (audioToggle) audioToggle.title = "Collapse Audio options";
    if (linkedMel) {
      renderMelOptions();
      renderPianoInstrumentOptions();
      renderPianoRoll();
      saveState();
      return;
    }
    await transcribeAudioClipToPianoRoll(clip);
  }

  function updatePianoRulerViewport() {
    const view = $("#piano-roll-view");
    const workspace = $(".workspace-content");
    const scroll = $("#piano-roll-scroll");
    const placeholder = $("#piano-roll-ruler-placeholder");
    const viewport = $("#piano-roll-ruler-viewport");
    if (view.hidden) {
      viewport.hidden = true;
      return;
    }
    const workspaceBounds = workspace.getBoundingClientRect();
    const viewBounds = view.getBoundingClientRect();
    const placeholderBounds = placeholder.getBoundingClientRect();
    const scrollBounds = scroll.getBoundingClientRect();
    const top = Math.max(workspaceBounds.top, placeholderBounds.top);
    if (workspaceBounds.width <= 0 || workspaceBounds.height <= 0 ||
      Math.min(workspaceBounds.bottom, viewBounds.bottom) <= workspaceBounds.top ||
      placeholderBounds.top >= workspaceBounds.bottom) {
      viewport.hidden = true;
      return;
    }
    viewport.hidden = false;
    viewport.style.top = `${top}px`;
    viewport.style.left = `${scrollBounds.left + scroll.clientLeft + 52}px`;
    viewport.style.width = `${Math.max(0, scroll.clientWidth - 52)}px`;
  }

  function updatePianoPlayhead(keepVisible = false) {
    const marker = $("#piano-roll-playhead");
    const maxTick = getPianoLoopRange().totalBars * PIANO_TICKS_PER_BAR;
    const visibleTick = Math.max(0, Math.min(maxTick - 0.001, state.pianoCursorTick));
    const tickWidth = getPianoTickWidth();
    const playheadX = visibleTick * tickWidth;
    const scroll = $("#piano-roll-scroll");
    const visibleWidth = Math.max(0, scroll.clientWidth - 53);
    if (keepVisible && visibleWidth > 0) {
      const margin = Math.min(36, visibleWidth / 4);
      if (playheadX < scroll.scrollLeft + margin) {
        scroll.scrollLeft = Math.max(0, playheadX - margin);
      } else if (playheadX > scroll.scrollLeft + visibleWidth - margin) {
        scroll.scrollLeft = Math.min(scroll.scrollWidth - scroll.clientWidth, playheadX - visibleWidth + margin);
      }
    }
    if (marker) {
      marker.style.left = `${playheadX}px`;
      marker.setAttribute("aria-valuenow", visibleTick.toFixed(2));
    }
    $("#piano-roll-ruler").style.transform = `translateX(-${scroll.scrollLeft}px)`;
    const stickyMarker = $("#piano-roll-sticky-playhead");
    const markerInViewport = playheadX - scroll.scrollLeft;
    const clippedX = Math.max(0, Math.min(visibleWidth, markerInViewport));
    stickyMarker.style.left = `${clippedX}px`;
    stickyMarker.classList.toggle("is-offscreen-left", markerInViewport < 0);
    stickyMarker.classList.toggle("is-offscreen-right", markerInViewport > visibleWidth);
  }

  function updatePianoCursorFromTime(startTime) {
    if (!state.audioContext) return;
    const loopTicks = Math.max(1, getPianoPlaybackSource().loopBars * PIANO_TICKS_PER_BAR);
    const elapsedTicks = Math.max(0, state.audioContext.currentTime - startTime) / (240 / state.bpm) * PIANO_TICKS_PER_BAR;
    if (state.pianoLoopEnabled) {
      const { startBar, endBar } = getPianoLoopRange();
      const startTick = startBar * PIANO_TICKS_PER_BAR;
      const endTick = Math.min(loopTicks, endBar * PIANO_TICKS_PER_BAR);
      const loopTicksInRange = Math.max(1, endTick - startTick);
      state.pianoCursorTick = elapsedTicks >= endTick
        ? startTick + ((elapsedTicks - endTick) % loopTicksInRange)
        : Math.max(startTick, Math.min(endTick - 0.001, elapsedTicks));
    } else {
      state.pianoCursorTick = elapsedTicks % loopTicks;
    }
    updatePianoPlayhead(true);
  }

  function setPianoCursorTick(tick, seek = true, persist = true) {
    const loopTicks = Math.max(1, getPianoLoopRange().totalBars * PIANO_TICKS_PER_BAR);
    const maxTick = loopTicks;
    let cursorTick = Math.max(0, Math.min(maxTick - 0.001, tick));
    if (state.pianoLoopEnabled) {
      const { startBar, endBar } = getPianoLoopRange();
      const startTick = startBar * PIANO_TICKS_PER_BAR;
      const endTick = endBar * PIANO_TICKS_PER_BAR;
      if (cursorTick < startTick || cursorTick >= endTick) cursorTick = startTick;
    }
    state.pianoCursorTick = cursorTick;
    updatePianoPlayhead(true);
    if (seek && state.audioContext) {
      cursorTick = state.pianoCursorTick % loopTicks;
      const now = state.audioContext.currentTime;
      const startTime = now + 0.04 - cursorTick / PIANO_TICKS_PER_BAR * (240 / state.bpm);
      const player = state.workspacePlayers["piano-roll"];
      if (player) {
        player.startTime = startTime;
        player.startTick = cursorTick;
        player.nextStepTime = now + 0.04;
        player.stepIndex = Math.floor(cursorTick) % PIANO_TICKS_PER_BAR;
        player.scheduledMelNotes.clear();
      }
      if (state.isPlaying && state.playbackMode === "piano-roll") {
        state.playbackStartTime = startTime;
        state.pianoPlaybackStartTick = cursorTick;
        state.nextStepTime = now + 0.04;
        state.stepIndex = Math.floor(cursorTick) % PIANO_TICKS_PER_BAR;
        state.scheduledPianoNotes.clear();
      }
    }
    if (persist) saveState();
  }

  function startPianoPlayheadDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const grid = $("#piano-roll-grid");
    const update = (moveEvent) => {
      const tick = (moveEvent.clientX - grid.getBoundingClientRect().left) / getPianoTickWidth();
      setPianoCursorTick(tick, true, false);
    };
    const finish = () => {
      document.removeEventListener("pointermove", update);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      saveState();
    };
    update(event);
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function getPianoLoopRange() {
    const totalBars = getPianoPlaybackSource().loopBars;
    const startBar = Math.max(0, Math.min(totalBars - 1, state.pianoLoopStartBar));
    const endBar = Math.max(startBar + 1, Math.min(totalBars, state.pianoLoopEndBar));
    return { startBar, endBar, totalBars };
  }

  function getPianoPlaybackSource() {
    const editContext = state.stepPianoEditContext;
    const mel = editContext ? null : getMel();
    const pattern = editContext ? getPattern(editContext.patternId) : null;
    return {
      notes: editContext ? state.pianoNotes : mel?.notes,
      instrument: getPianoTrack(editContext?.trackId || mel?.instrumentId || state.selectedPianoTrackId),
      loopBars: editContext
        ? (pattern?.steps || 16) / 16
        : mel ? getMelLengthBars(mel) : state.pianoBars,
    };
  }

  function updatePianoLoopUI() {
    const { startBar, endBar } = getPianoLoopRange();
    const ruler = $("#piano-roll-ruler");
    ruler.querySelector(".piano-roll-loop-range")?.remove();
    const range = document.createElement("div");
    range.className = `piano-roll-loop-range${state.pianoLoopEnabled ? "" : " is-disabled"}`;
    const barWidth = getPianoTickWidth() * PIANO_TICKS_PER_BAR;
    range.style.left = `${startBar * barWidth}px`;
    range.style.width = `${(endBar - startBar) * barWidth}px`;
    ruler.append(range);
    const button = $("#piano-loop-button");
    button.textContent = `LOOP ${state.pianoLoopEnabled ? "ON" : "OFF"}`;
    button.setAttribute("aria-pressed", String(state.pianoLoopEnabled));
    button.title = state.pianoLoopEnabled
      ? `Loop bars ${startBar + 1}–${endBar}; drag the ruler to change the section`
      : "Drag across the bar ruler to select a section; turn looping on with this button";
  }

  function seekPianoRollFromRuler(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const scroll = $("#piano-roll-scroll");
    const viewport = $("#piano-roll-ruler-viewport");
    const rulerBounds = viewport.getBoundingClientRect();
    const getTick = (clientX) => Math.max(0, Math.min(
      getPianoLoopRange().totalBars * PIANO_TICKS_PER_BAR,
      (scroll.scrollLeft + clientX - rulerBounds.left) / getPianoTickWidth(),
    ));
    const startX = event.clientX;
    const startTick = getTick(startX);
    let hasDragged = false;
    const updateRange = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 4) hasDragged = true;
      if (!hasDragged) return;
      const currentBar = getTick(moveEvent.clientX) / PIANO_TICKS_PER_BAR;
      const anchorBar = startTick / PIANO_TICKS_PER_BAR;
      const { totalBars } = getPianoLoopRange();
      const startBar = Math.max(0, Math.min(totalBars - 1, Math.floor(Math.min(anchorBar, currentBar))));
      const endBar = Math.max(startBar + 1, Math.min(totalBars, Math.ceil(Math.max(anchorBar, currentBar))));
      state.pianoLoopStartBar = startBar;
      state.pianoLoopEndBar = endBar;
      updatePianoLoopUI();
    };
    const finish = () => {
      document.removeEventListener("pointermove", updateRange);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      if (hasDragged) {
        stopWorkspacePlayback("piano-roll");
        if (state.isPlaying && state.playbackMode === "piano-roll") stopPlayback();
        state.pianoCursorTick = state.pianoLoopStartBar * PIANO_TICKS_PER_BAR;
        state.pianoPlaybackStartTick = state.pianoCursorTick;
        updatePianoPlayhead(true);
        saveState();
      } else {
        setPianoCursorTick(startTick);
      }
    };
    document.addEventListener("pointermove", updateRange);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function renderPianoRoll() {
    updateStepPianoEditorControls();
    $("#piano-bars-select").value = String(state.pianoBars);
    $("#piano-scale-slider").value = String(Math.round(state.pianoScale * 100));
    $("#piano-scale-value").textContent = `${Math.round(state.pianoScale * 100)}%`;
    $("#piano-snap-select").value = state.pianoSnapEnabled ? String(state.pianoSnap) : "off";
    $("#piano-quantize-button").disabled = !state.pianoSnapEnabled;
    $("#piano-note-length-select").value = String(state.pianoNoteLength);
    $("#piano-scale-root").value = String(state.pianoScaleRoot);
    $("#piano-scale-type").value = state.pianoScaleType;
    $("#piano-scale-lock").checked = state.pianoScaleLock;
    const keys = $("#piano-roll-keys");
    const ruler = $("#piano-roll-ruler");
    const grid = $("#piano-roll-grid");
    const editor = $(".piano-roll-editor");
    const pianoRollScroll = $("#piano-roll-scroll");
    keys.replaceChildren();
    ruler.replaceChildren();
    grid.replaceChildren();
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    const tickWidth = getPianoTickWidth();
    const width = totalTicks * tickWidth;
    const height = (PIANO_TOP_MIDI - PIANO_BOTTOM_MIDI + 1) * PIANO_ROW_HEIGHT;
    ruler.style.width = `${width}px`;
    ruler.style.transform = `translateX(-${pianoRollScroll.scrollLeft}px)`;
    editor.style.height = `${height}px`;
    grid.style.width = `${width}px`;
    grid.style.height = `${height}px`;
    grid.style.setProperty("--piano-tick-width", `${tickWidth}px`);
    grid.style.setProperty("--piano-beat-width", `${tickWidth * 8}px`);
    grid.style.setProperty("--piano-bar-width", `${tickWidth * PIANO_TICKS_PER_BAR}px`);
    grid.classList.toggle("is-draw-mode", state.pianoDrawMode);
    renderPianoAudioSourceOptions();
    $("#piano-audio-chop-button").disabled = Boolean(state.stepPianoEditContext || !getPianoRollAudioClip()?.buffer);
    renderPianoAudioWaveform(grid, width, height, totalTicks);
    $("#piano-draw-mode-button").setAttribute("aria-pressed", String(state.pianoDrawMode));
    let playhead = $("#piano-roll-playhead");
    if (!playhead) {
      playhead = document.createElement("button");
      playhead.id = "piano-roll-playhead";
      playhead.className = "piano-roll-playhead";
      playhead.type = "button";
      playhead.setAttribute("role", "slider");
      playhead.setAttribute("tabindex", "0");
      playhead.setAttribute("aria-label", "Piano Roll playhead");
      playhead.setAttribute("aria-valuemin", "0");
      playhead.addEventListener("pointerdown", startPianoPlayheadDrag);
      playhead.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        setPianoCursorTick(state.pianoCursorTick + (event.key === "ArrowRight" ? getPianoSnapStep() : -getPianoSnapStep()));
      });
      editor.append(playhead);
    }
    playhead.setAttribute("aria-valuemax", String(totalTicks));
    for (let bar = 0; bar < state.pianoBars; bar += 1) {
      const marker = document.createElement("div");
      marker.className = "piano-roll-bar";
      marker.style.width = `${tickWidth * PIANO_TICKS_PER_BAR}px`;
      marker.style.flexBasis = `${tickWidth * PIANO_TICKS_PER_BAR}px`;
      marker.style.gridTemplateColumns = `repeat(4, ${tickWidth * 8}px)`;
      for (let beat = 0; beat < 4; beat += 1) {
        const label = document.createElement("span");
        label.textContent = beat === 0 ? `BAR ${bar + 1}` : String(beat + 1);
        marker.append(label);
      }
      ruler.append(marker);
    }
    updatePianoLoopUI();
    for (let midi = PIANO_TOP_MIDI; midi >= PIANO_BOTTOM_MIDI; midi -= 1) {
      const row = document.createElement("div");
      const pitchClass = midi % 12;
      row.className = `piano-roll-row${[1, 3, 6, 8, 10].includes(pitchClass) ? " is-black" : ""}${pitchClass === 0 ? " is-c" : ""}`;
      row.classList.toggle("is-scale-note", isPianoPitchInScale(midi));
      row.style.top = `${(PIANO_TOP_MIDI - midi) * PIANO_ROW_HEIGHT}px`;
      grid.append(row);
      const key = document.createElement("button");
      key.type = "button";
      key.className = `piano-roll-key${[1, 3, 6, 8, 10].includes(pitchClass) ? " is-black" : ""}${pitchClass === 0 ? " is-octave" : ""}`;
      key.classList.toggle("is-scale-note", isPianoPitchInScale(midi));
      key.textContent = pitchClass === 0 ? midiNoteName(midi) : "";
      key.setAttribute("aria-label", `Preview ${midiNoteName(midi)}`);
      key.addEventListener("click", async () => {
        try {
          const track = getPianoTrack();
          if (!track) throw new Error("Choose an instrument before previewing notes.");
          await ensureAudio();
          await loadLibrarySample(track);
          playPianoNote(track, state.audioContext.currentTime + 0.015, midi, 0.4, 0.75);
        } catch (error) {
          showToast(error.message || "The instrument could not be played.");
        }
      });
      keys.append(key);
    }
    state.pianoNotes
      .filter((note) => note.startTick < totalTicks)
      .forEach((note) => {
        const track = getPianoTrack(note.trackId);
        if (!track) return;
        const element = document.createElement("div");
        const isAudioPitchNote = note.audioSlice?.pitchEdited === true;
        const canEditAudioPitch = isAudioPitchNote && note.audioSlice.pitchEditable !== false;
        const isAudioPassThrough = isAudioPitchNote && !canEditAudioPitch;
        element.className = `piano-roll-note${note.audioSlice ? " is-audio-slice" : ""}${canEditAudioPitch ? " is-audio-pitch-note" : ""}${isAudioPassThrough ? " is-audio-pass-through" : ""}${state.selectedPianoNoteIds.has(note.id) || note.id === state.selectedPianoNoteId ? " is-selected" : ""}`;
        element.dataset.noteId = note.id;
        element.style.setProperty("--note-color", track.color);
        element.style.left = `${note.startTick * tickWidth + 1}px`;
        element.style.top = `${(PIANO_TOP_MIDI - note.midi) * PIANO_ROW_HEIGHT + 1}px`;
        element.style.width = `${Math.max(getPianoSnapStep() * tickWidth, note.durationTicks * tickWidth - 2)}px`;
        element.textContent = isAudioPassThrough ? "A"
          : note.audioSlice && !isAudioPitchNote ? `S${note.audioSlice.sliceNumber}` : midiNoteName(note.midi);
        element.title = canEditAudioPitch
          ? `Original audio · ${midiNoteName(note.midi)} · drag vertically to change pitch · right-click for fine-tuning`
          : isAudioPassThrough
            ? "Original audio segment · retained between detected notes"
          : note.audioSlice
          ? `Audio slice ${note.audioSlice.sliceNumber} · ${midiNoteName(note.midi)} · ${note.durationTicks}/32`
          : `${track.name} · ${midiNoteName(note.midi)} · ${note.durationTicks}/32`;
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute("aria-label", canEditAudioPitch
          ? `Original audio pitch ${midiNoteName(note.midi)}, start ${note.startTick}/32, duration ${note.durationTicks}/32`
          : isAudioPassThrough
            ? `Original audio segment, start ${note.startTick}/32, duration ${note.durationTicks}/32`
          : note.audioSlice
          ? `Audio slice ${note.audioSlice.sliceNumber}, ${midiNoteName(note.midi)}, start ${note.startTick}/32, duration ${note.durationTicks}/32`
          : `${track.name}, ${midiNoteName(note.midi)}, start ${note.startTick}/32, duration ${note.durationTicks}/32`);
        element.addEventListener("focus", () => {
          selectPianoNote(note.id, state.selectedPianoNoteIds.has(note.id));
        });
        const resize = document.createElement("span");
        resize.className = "piano-roll-note-resize";
        element.append(resize);
        element.addEventListener("pointerdown", (event) => {
          if (state.pianoDrawMode) startPianoDrawStroke(event, note);
          else startPianoNoteEdit(event, note, event.target === resize);
        });
        grid.append(element);
      });
      updatePianoRulerViewport();
      updatePianoPlayhead();
  }

  function getPianoNoteContextValue(note, property) {
    if (property === "volume") return note.volume ?? 1;
    if (property === "velocity") return note.velocity ?? 0.8;
    if (property === "pan") return note.pan ?? 0;
    if (property === "attack") {
      const track = getPianoTrack(note.trackId);
      const defaultAttack = track?.kind === "instrument" ? Number(track.patch?.attack) || 0.005 : 0;
      return (note.attack ?? defaultAttack) * 1000;
    }
    return note.detune ?? 0;
  }

  function updatePianoNoteContextOutput(property, value) {
    const output = $(`#piano-note-${property}-value`);
    if (property === "pan") {
      output.textContent = value === 0 ? "Center" : `${value < 0 ? "L" : "R"} ${Math.abs(Math.round(value))}%`;
      return;
    }
    output.textContent = property === "attack" ? `${Math.round(value)} ms`
      : property === "detune" ? `${Math.round(value)} cents`
        : `${Math.round(value)}%`;
  }

  function openPianoNoteContextMenu(event, note) {
    event.preventDefault();
    event.stopPropagation();
    if (isPianoAudioPassThrough(note)) {
      closePianoNoteContextMenu();
      showToast("This segment has no detected pitch and stays at its original pitch.");
      return;
    }
    if (!state.selectedPianoNoteIds.has(note.id)) selectPianoNote(note.id);
    state.selectedPianoNoteId = note.id;
    pianoNoteContextTargetIds = state.pianoNotes
      .filter((item) => state.selectedPianoNoteIds.has(item.id) && !isPianoAudioPassThrough(item))
      .map((item) => item.id);
    const menu = $("#piano-note-context-menu");
    ["volume", "attack", "velocity", "detune", "pan"].forEach((property) => {
      const input = $(`#piano-note-${property}`);
      const value = getPianoNoteContextValue(note, property);
      input.value = String(property === "volume" || property === "velocity" || property === "pan" ? value * 100 : value);
      updatePianoNoteContextOutput(property, Number(input.value));
    });
    menu.hidden = false;
    menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 8))}px`;
  }

  function closePianoNoteContextMenu() {
    $("#piano-note-context-menu").hidden = true;
    pianoNoteContextTargetIds = [];
  }

  function updatePianoNoteContext(event) {
    const input = event.target.closest("input[data-note-property]");
    if (!input) return;
    const property = input.dataset.noteProperty;
    const sliderValue = Number(input.value);
    const value = property === "volume" || property === "velocity" || property === "pan" ? sliderValue / 100 : sliderValue;
    const noteValue = property === "attack" ? value / 1000 : value;
    const targets = new Set(pianoNoteContextTargetIds);
    state.pianoNotes.forEach((note) => {
      if (targets.has(note.id)) note[property] = noteValue;
    });
    updatePianoNoteContextOutput(property, sliderValue);
    saveState();
  }

  function quantizePianoNotes() {
    if (!state.pianoSnapEnabled) {
      showToast("Choose a grid snap before quantizing notes.");
      return;
    }
    const selectedIds = new Set(state.selectedPianoNoteIds);
    if (state.selectedPianoNoteId) selectedIds.add(state.selectedPianoNoteId);
    const notes = state.pianoNotes.filter((note) => !selectedIds.size || selectedIds.has(note.id));
    if (!notes.length) {
      showToast("Add notes to the Piano Roll before quantizing.");
      return;
    }
    const step = state.pianoSnap;
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    let changed = false;
    notes.forEach((note) => {
      const originalStart = note.startTick;
      const originalEnd = note.startTick + note.durationTicks;
      const start = Math.max(0, Math.min(totalTicks - step, Math.round(originalStart / step) * step));
      const end = Math.max(start + step, Math.min(totalTicks, Math.round(originalEnd / step) * step));
      changed ||= start !== note.startTick || end - start !== note.durationTicks;
      note.startTick = start;
      note.durationTicks = end - start;
    });
    if (!changed) {
      showToast("The notes are already on the selected grid.");
      return;
    }
    renderPianoRoll();
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast(`Quantized ${notes.length} note${notes.length === 1 ? "" : "s"}`);
  }

  function humanizePianoNotes() {
    const selectedIds = new Set(state.selectedPianoNoteIds);
    if (state.selectedPianoNoteId) selectedIds.add(state.selectedPianoNoteId);
    const notes = state.pianoNotes.filter((note) => !selectedIds.size || selectedIds.has(note.id));
    if (!notes.length) {
      showToast("Add notes to the Piano Roll before humanizing.");
      return;
    }
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    notes.forEach((note) => {
      const timingOffset = Math.round((Math.random() * 2 - 1) * 2);
      note.startTick = Math.max(0, Math.min(totalTicks - note.durationTicks, note.startTick + timingOffset));
      note.velocity = Math.max(0, Math.min(1, (note.velocity ?? 0.8) + (Math.random() * 2 - 1) * 0.1));
    });
    closePianoNoteContextMenu();
    renderPianoRoll();
    updateArrangementLength();
    renderArrangement();
    saveState();
  }

  function getPianoRollAudioClip() {
    return getPianoRollAudioClipById(state.pianoRollAudioClipId);
  }

  function renderPianoAudioSourceOptions() {
    const select = $("#piano-audio-source-select");
    const selectedId = state.pianoRollAudioClipId || "";
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose Track View audio";
    select.append(placeholder);
    state.arrangementTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const option = document.createElement("option");
        option.value = clip.id;
        option.textContent = `${track.name} · ${clip.name}`;
        option.title = option.textContent;
        select.append(option);
      });
    });
    select.value = selectedId;
  }

  function renderPianoAudioWaveform(grid, width, height, totalTicks) {
    const clip = getPianoRollAudioClip();
    const label = $("#piano-audio-source-label");
    label.textContent = clip?.name || "No audio source";
    label.title = clip?.name || "Import audio to analyze pitches";
    if (!clip?.buffer) return;

    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.className = "piano-roll-audio-waveform";
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.setAttribute("aria-hidden", "true");
    grid.append(canvas);

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(pixelRatio, pixelRatio);
    const visibleSeconds = totalTicks / PIANO_TICKS_PER_BAR * (240 / state.bpm);
    const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
    const sourceDuration = Math.min(clip.buffer.duration - sourceOffset,
      clip.durationSeconds ?? clip.buffer.duration);
    const duration = Math.min(sourceDuration, visibleSeconds);
    const channels = Array.from({ length: clip.buffer.numberOfChannels }, (_, index) =>
      clip.buffer.getChannelData(index));
    const center = height * 0.68;
    const amplitude = height * 0.13;
    context.strokeStyle = "rgba(130, 176, 202, 0.46)";
    context.lineWidth = 1;
    context.beginPath();
    const visibleWidth = Math.min(width, duration / visibleSeconds * width);
    for (let x = 0; x < visibleWidth; x += 1) {
      const start = Math.floor(sourceOffset * clip.buffer.sampleRate +
        x / width * visibleSeconds * clip.buffer.sampleRate);
      const end = Math.min(clip.buffer.length, Math.max(start + 1,
        Math.floor(sourceOffset * clip.buffer.sampleRate +
          (x + 1) / width * visibleSeconds * clip.buffer.sampleRate)));
      let minimum = 0;
      let maximum = 0;
      for (const channel of channels) {
        for (let index = start; index < end; index += 1) {
          minimum = Math.min(minimum, channel[index]);
          maximum = Math.max(maximum, channel[index]);
        }
      }
      context.moveTo(x + 0.5, center - maximum * amplitude);
      context.lineTo(x + 0.5, center - minimum * amplitude);
    }
    context.stroke();
  }

  function makePianoNoteFromPointer(event) {
    const track = getPianoTrack();
    if (!track) return null;
    const grid = $("#piano-roll-grid");
    const rect = grid.getBoundingClientRect();
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) return null;
    const rawTick = Math.max(0, Math.min(totalTicks - 1, (event.clientX - rect.left) / getPianoTickWidth()));
    const startTick = Math.max(0, Math.min(totalTicks - 1, snapPianoTick(rawTick, Math.floor)));
    const row = Math.max(0, Math.min(PIANO_TOP_MIDI - PIANO_BOTTOM_MIDI,
      Math.floor((event.clientY - rect.top) / PIANO_ROW_HEIGHT)));
    return {
      id: makeId(),
      trackId: state.selectedPianoTrackId,
      midi: constrainPianoPitchToScale(PIANO_TOP_MIDI - row),
      startTick,
      durationTicks: Math.max(1, Math.min(state.pianoNoteLength, totalTicks - startTick)),
      velocity: 0.8,
    };
  }

  function startPianoDrawStroke(event, tappedNote = null) {
    if (event.button !== 0 || !state.pianoDrawMode || !getPianoTrack()) return;
    event.preventDefault();
    event.stopPropagation();
    $("#piano-roll-grid").setPointerCapture(event.pointerId);
    state.pianoSelectionFromMarquee = false;
    state.selectedPianoNoteId = null;
    state.selectedPianoNoteIds.clear();
    document.querySelectorAll(".piano-roll-note.is-selected").forEach((note) => note.classList.remove("is-selected"));
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    updateArrangementSelection();
    const stroke = {
      pointerId: event.pointerId,
      cells: new Set(),
      existingCells: new Set(state.pianoNotes.map((note) => `${note.trackId}:${note.startTick}:${note.midi}`)),
      lastPosition: null,
      startX: event.clientX,
      startY: event.clientY,
    };
    const placeNote = (clientX, clientY) => {
      const note = makePianoNoteFromPointer({ clientX, clientY });
      if (!note) return;
      const cellKey = `${note.trackId}:${note.startTick}:${note.midi}`;
      if (stroke.existingCells.has(cellKey) || stroke.cells.has(cellKey)) return false;
      stroke.cells.add(cellKey);
      state.pianoNotes.push(note);
      state.selectedPianoNoteIds.add(note.id);
      state.selectedPianoNoteId = note.id;
      return true;
    };
    const draw = (drawEvent) => {
      if (drawEvent.pointerId !== stroke.pointerId) return;
      const previous = stroke.lastPosition || { x: drawEvent.clientX, y: drawEvent.clientY };
      const stepsPerCell = Math.max(
        Math.abs(drawEvent.clientX - previous.x) / (getPianoTickWidth() * getPianoSnapStep()),
        Math.abs(drawEvent.clientY - previous.y) / PIANO_ROW_HEIGHT,
      );
      const segments = Math.max(1, Math.ceil(stepsPerCell * 2));
      let changed = false;
      for (let segment = 1; segment <= segments; segment += 1) {
        const ratio = segment / segments;
        changed = placeNote(
          previous.x + (drawEvent.clientX - previous.x) * ratio,
          previous.y + (drawEvent.clientY - previous.y) * ratio,
        ) || changed;
      }
      stroke.lastPosition = { x: drawEvent.clientX, y: drawEvent.clientY };
      if (changed) renderPianoRoll();
    };
    const finish = (finishEvent) => {
      if (finishEvent.pointerId !== stroke.pointerId) return;
      document.removeEventListener("pointermove", draw);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      if (finishEvent.type === "pointerup" && tappedNote && !stroke.cells.size &&
        Math.hypot(finishEvent.clientX - stroke.startX, finishEvent.clientY - stroke.startY) < 4) {
        deleteSelectedPianoNotes(new Set([tappedNote.id]));
        return;
      }
      if (!stroke.cells.size) return;
      updateArrangementLength();
      renderArrangement();
      saveState();
    };
    draw(event);
    document.addEventListener("pointermove", draw);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function addPianoNoteFromPointer(event) {
    if (event.button !== 0 || !getPianoTrack()) return;
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      deleteSelectedPianoNotes(new Set(state.selectedPianoNoteIds));
      return;
    }
    const note = makePianoNoteFromPointer(event);
    if (!note) return;
    state.pianoNotes.push(note);
    state.selectedPianoNoteId = note.id;
    state.selectedPianoNoteIds = event.shiftKey
      ? new Set([...state.selectedPianoNoteIds, note.id])
      : new Set([note.id]);
    state.pianoSelectionFromMarquee = false;
    state.selectedArrangementItems.clear();
    updateArrangementSelection();
    renderPianoRoll();
    updateArrangementLength();
    renderArrangement();
    saveState();
    const track = getPianoTrack(note.trackId);
    if (track) {
      void (async () => {
        await ensureAudio();
        await loadLibrarySample(track);
        playPianoNote(track, state.audioContext.currentTime + 0.015,
          note.midi, note.durationTicks / PIANO_TICKS_PER_BAR * (240 / state.bpm), note.velocity, track, null, note);
      })().catch((error) => showToast(error.message || "The instrument could not be played."));
    }
  }

  function scaleSelectedPianoNoteDurations(originals, anchorId, requestedDuration, totalTicks) {
    const anchor = originals.find((original) => original.note.id === anchorId);
    if (!anchor || originals.length < 2) return false;
    const snap = getPianoSnapStep();
    const minimumScale = Math.max(...originals.map((original) => snap / original.durationTicks));
    const maximumScale = Math.min(...originals.map((original) =>
      (totalTicks - original.startTick) / original.durationTicks));
    const scale = Math.max(minimumScale, Math.min(maximumScale, requestedDuration / anchor.durationTicks));
    let changed = false;
    originals.forEach((original) => {
      const duration = Math.max(snap, Math.min(
        totalTicks - original.startTick,
        snapPianoTick(original.durationTicks * scale),
      ));
      changed ||= duration !== original.note.durationTicks;
      original.note.durationTicks = duration;
    });
    return changed;
  }

  function startPianoNoteEdit(event, note, resizing) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    state.pianoSelectionFromMarquee = false;
    if (event.shiftKey) {
      if (event.ctrlKey || event.metaKey) {
        deleteSelectedPianoNotes(new Set([...state.selectedPianoNoteIds, note.id]));
      } else {
        selectPianoNote(note.id, true);
        renderPianoRoll();
      }
      return;
    }
    if (!state.selectedPianoNoteIds.has(note.id)) selectPianoNote(note.id);
    state.selectedPianoNoteId = note.id;
    const editNotes = state.selectedPianoNoteIds.size > 1
      ? state.pianoNotes.filter((item) => state.selectedPianoNoteIds.has(item.id))
      : [note];
    const originals = editNotes.map((item) => ({
      note: item,
      startTick: item.startTick,
      durationTicks: item.durationTicks,
      midi: item.midi,
    }));
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    pianoDragPreviewSequence += 1;
    let previewedMidi = note.midi;
    const durationTicks = note.durationTicks;
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    const noteElements = new Map(Array.from(document.querySelectorAll(".piano-roll-note"), (item) => [item.dataset.noteId, item]));
    const previewPitch = (midi) => {
      previewedMidi = midi;
      const request = ++pianoDragPreviewSequence;
      Promise.resolve().then(async () => {
        await ensureAudio();
        const track = getPianoTrack(note.trackId);
        if (!track) return;
        await loadLibrarySample(track);
        if (request !== pianoDragPreviewSequence) return;
        const duration = Math.max(0.12, Math.min(0.3,
          note.durationTicks / PIANO_TICKS_PER_BAR * (240 / state.bpm)));
        playPianoNote(track, state.audioContext.currentTime + 0.01, midi, duration,
          note.velocity ?? 0.8, track, null, note);
      }).catch((error) => {
        if (request === pianoDragPreviewSequence) showToast(error.message || "The instrument could not be played.");
      });
    };
    const update = (moveEvent) => {
      moved ||= Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) >= 4;
      if (!moved) return;
      const delta = snapPianoTick((moveEvent.clientX - startX) / getPianoTickWidth());
      if (resizing) {
        if (originals.length > 1) {
          scaleSelectedPianoNoteDurations(
            originals,
            note.id,
            Math.max(getPianoSnapStep(), snapPianoTick(durationTicks + delta)),
            totalTicks,
          );
        } else {
          note.durationTicks = Math.max(getPianoSnapStep(), Math.min(totalTicks - note.startTick,
            snapPianoTick(durationTicks + delta)));
        }
      } else {
        const minStart = Math.min(...originals.map((item) => item.startTick));
        const maxEnd = Math.max(...originals.map((item) => item.startTick + item.durationTicks));
        const minPitch = Math.min(...originals.map((item) => item.midi));
        const maxPitch = Math.max(...originals.map((item) => item.midi));
        const deltaTicks = Math.max(-minStart, Math.min(totalTicks - maxEnd, delta));
        const hasLockedAudio = originals.some((original) => isPianoAudioPassThrough(original.note));
        const deltaPitch = hasLockedAudio ? 0 : Math.max(PIANO_BOTTOM_MIDI - minPitch, Math.min(PIANO_TOP_MIDI - maxPitch,
          -Math.round((moveEvent.clientY - startY) / PIANO_ROW_HEIGHT)));
        originals.forEach((original) => {
          original.note.startTick = original.startTick + deltaTicks;
          original.note.midi = original.midi + deltaPitch;
        });
        if (note.midi !== previewedMidi) previewPitch(note.midi);
      }
      originals.forEach((original) => {
        const target = noteElements.get(original.note.id);
        if (!target) return;
        target.style.left = `${original.note.startTick * getPianoTickWidth() + 1}px`;
        target.style.top = `${(PIANO_TOP_MIDI - original.note.midi) * PIANO_ROW_HEIGHT + 1}px`;
        target.style.width = `${Math.max(getPianoSnapStep() * getPianoTickWidth(),
          original.note.durationTicks * getPianoTickWidth() - 2)}px`;
        const resizeHandle = target.querySelector(".piano-roll-note-resize");
        target.textContent = midiNoteName(original.note.midi);
        if (resizeHandle) target.append(resizeHandle);
      });
    };
    const finish = (finishEvent) => {
      document.removeEventListener("pointermove", update);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      moved ||= Math.hypot(finishEvent.clientX - startX, finishEvent.clientY - startY) >= 4;
      if (finishEvent.type === "pointerup" && !resizing && !moved) {
        state.suppressPianoGridClick = true;
        window.setTimeout(() => { state.suppressPianoGridClick = false; }, 0);
        deleteSelectedPianoNotes(new Set([note.id]));
        return;
      }
      state.suppressPianoGridClick = true;
      window.setTimeout(() => { state.suppressPianoGridClick = false; }, 0);
      updateArrangementLength();
      renderPianoRoll();
      renderArrangement();
      saveState();
    };
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function selectPianoNote(noteId, additive = false) {
    state.pianoSelectionFromMarquee = false;
    state.selectedArrangementItems.clear();
    updateArrangementSelection();
    state.selectedPianoNoteIds = additive
      ? new Set([...state.selectedPianoNoteIds, noteId])
      : new Set([noteId]);
    state.selectedPianoNoteId = noteId;
    document.querySelectorAll(".piano-roll-note").forEach((item) =>
      item.classList.toggle("is-selected", state.selectedPianoNoteIds.has(item.dataset.noteId)));
  }

  function deleteSelectedPianoNotes(noteIds) {
    if (!noteIds.size) return false;
    const existingIds = new Set(state.pianoNotes.filter((note) => noteIds.has(note.id)).map((note) => note.id));
    if (!existingIds.size) return false;
    state.selectedArrangementItems.clear();
    updateArrangementSelection();
    state.pianoNotes = state.pianoNotes.filter((note) => !existingIds.has(note.id));
    state.pianoSelectionFromMarquee = false;
    existingIds.forEach((id) => {
      [...state.scheduledPianoNotes].filter((key) => key.startsWith(`${id}:`)).forEach((key) => state.scheduledPianoNotes.delete(key));
    });
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    renderPianoRoll();
    updateArrangementLength();
    renderArrangement();
    saveState();
    return true;
  }

  function deleteSelectedPianoNote() {
    const selected = new Set(state.selectedPianoNoteIds);
    if (state.selectedPianoNoteId) selected.add(state.selectedPianoNoteId);
    deleteSelectedPianoNotes(selected);
  }

  function nudgeSelectedPianoNotes(horizontal, vertical = 0, resize = false) {
    const selected = state.pianoNotes.filter((note) =>
      state.selectedPianoNoteIds.has(note.id) || note.id === state.selectedPianoNoteId);
    if (!selected.length) return false;
    const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
    const snapStep = getPianoSnapStep();
    if (resize) {
      const delta = horizontal * snapStep;
      if (selected.length > 1) {
        const anchor = selected.find((note) => note.id === state.selectedPianoNoteId) || selected.at(-1);
        const originals = selected.map((note) => ({
          note,
          startTick: note.startTick,
          durationTicks: note.durationTicks,
        }));
        const requestedDuration = Math.max(snapStep, snapPianoTick(anchor.durationTicks + delta));
        if (!scaleSelectedPianoNoteDurations(originals, anchor.id, requestedDuration, totalTicks)) return false;
      } else {
        const minimum = Math.max(...selected.map((note) => snapStep - note.durationTicks));
        const maximum = Math.min(...selected.map((note) => totalTicks - note.startTick - note.durationTicks));
        const boundedDelta = Math.max(minimum, Math.min(maximum, delta));
        if (!boundedDelta || Math.sign(boundedDelta) !== Math.sign(delta)) return false;
        selected.forEach((note) => { note.durationTicks += boundedDelta; });
      }
    } else {
      const minStart = Math.min(...selected.map((note) => note.startTick));
      const maxEnd = Math.max(...selected.map((note) => note.startTick + note.durationTicks));
      const minPitch = Math.min(...selected.map((note) => note.midi));
      const maxPitch = Math.max(...selected.map((note) => note.midi));
      const deltaTicks = Math.max(-minStart, Math.min(totalTicks - maxEnd, horizontal * snapStep));
      const hasLockedAudio = selected.some(isPianoAudioPassThrough);
      const deltaPitch = hasLockedAudio ? 0 : Math.max(PIANO_BOTTOM_MIDI - minPitch,
        Math.min(PIANO_TOP_MIDI - maxPitch, vertical));
      if (!deltaTicks && !deltaPitch) return false;
      selected.forEach((note) => {
        note.startTick += deltaTicks;
        note.midi += deltaPitch;
      });
    }
    renderPianoRoll();
    saveState();
    return true;
  }

  function startPianoSelection(event) {
    if (state.pianoDrawMode) {
      startPianoDrawStroke(event);
      return;
    }
    if (event.button !== 0 || event.target.closest(".piano-roll-note")) return;
    const grid = $("#piano-roll-grid");
    const startX = event.clientX;
    const startY = event.clientY;
    const subtractive = event.altKey;
    const additive = event.shiftKey && !subtractive;
    let marquee = null;
    let moved = false;
    const update = (moveEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
      moved = true;
      moveEvent.preventDefault();
      if (!marquee) {
        marquee = document.createElement("div");
        marquee.className = "selection-marquee";
        grid.append(marquee);
      }
      const bounds = grid.getBoundingClientRect();
      marquee.style.left = `${Math.min(startX, moveEvent.clientX) - bounds.left}px`;
      marquee.style.top = `${Math.min(startY, moveEvent.clientY) - bounds.top}px`;
      marquee.style.width = `${Math.abs(moveEvent.clientX - startX)}px`;
      marquee.style.height = `${Math.abs(moveEvent.clientY - startY)}px`;
    };
    const finish = () => {
      document.removeEventListener("pointermove", update);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      if (!moved) return;
      const selection = marquee.getBoundingClientRect();
      const next = new Set(additive || subtractive ? state.selectedPianoNoteIds : []);
      document.querySelectorAll(".piano-roll-note").forEach((note) => {
        const bounds = note.getBoundingClientRect();
        if (bounds.left <= selection.right && bounds.right >= selection.left &&
          bounds.top <= selection.bottom && bounds.bottom >= selection.top) {
          if (subtractive) next.delete(note.dataset.noteId);
          else next.add(note.dataset.noteId);
        }
      });
      state.selectedPianoNoteIds = next;
      state.selectedPianoNoteId = [...next].at(-1) || null;
      state.pianoSelectionFromMarquee = true;
      state.selectedArrangementItems.clear();
      state.arrangementSelectionFromMarquee = false;
      updateArrangementSelection();
      state.suppressPianoGridClick = true;
      window.setTimeout(() => { state.suppressPianoGridClick = false; }, 0);
      renderPianoRoll();
    };
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function clearMarqueeSelectionOnOutsidePointer(event) {
    if (event.button !== 0 || event.shiftKey || event.altKey) return;
    const target = event.target;
    const pianoNote = target instanceof Element ? target.closest(".piano-roll-note") : null;
    const clickedSelectedPianoNote = pianoNote &&
      (state.selectedPianoNoteIds.has(pianoNote.dataset.noteId) || pianoNote.dataset.noteId === state.selectedPianoNoteId);
    if (state.pianoSelectionFromMarquee && !clickedSelectedPianoNote) {
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      state.pianoSelectionFromMarquee = false;
      if (target instanceof Element && target.closest("#piano-roll-grid")) state.suppressPianoGridClick = true;
      document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    }
    const arrangementItem = target instanceof Element
      ? target.closest("[data-selectable-type][data-clip-id]")
      : null;
    const clickedSelectedArrangementItem = arrangementItem && state.selectedArrangementItems.has(
      arrangementSelectionKey(arrangementItem.dataset.selectableType, arrangementItem.dataset.clipId));
    const clickedControl = target instanceof Element &&
      target.closest("button, input, select, textarea, [role='button'], [role='slider']");
    if (state.arrangementSelectionFromMarquee && !clickedSelectedArrangementItem && !clickedControl) {
      arrangementMarqueeDeselectPending = true;
    }
    if (state.selectedArrangementItems.size && !clickedSelectedArrangementItem && !clickedControl) {
      state.selectedArrangementItems.clear();
      state.arrangementSelectionFromMarquee = false;
      updateArrangementSelection();
    }
  }

  function finishArrangementMarqueeDeselect(event) {
    if (!arrangementMarqueeDeselectPending) return;
    arrangementMarqueeDeselectPending = false;
    const target = event.target;
    if (target instanceof Element && target.closest(".clip-resize-handle")) return;
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    updateArrangementSelection();
    if (target instanceof Element && target.closest("[data-selectable-type][data-clip-id]")) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

