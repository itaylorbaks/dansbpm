  const DJ_DECK_IDS = ["A", "B"];
  const DJ_ARRANGEMENT_BARS = 8;
  const DJ_MAX_OFFSET_BARS = MAX_ARRANGEMENT_BARS - DJ_ARRANGEMENT_BARS;
  const DJ_MAX_CENTERED_OFFSET_BARS = MAX_ARRANGEMENT_BARS - DJ_ARRANGEMENT_BARS / 2;
  const DJ_PAD_KEYS = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyA", "KeyS", "KeyD", "KeyF",
    "KeyZ", "KeyX", "KeyC", "KeyV", "Digit1", "Digit2", "Digit3", "Digit4"];
  const DJ_KNOB_KEYS = {
    KeyU: "filter",
    KeyI: "low",
    KeyO: "mid",
    KeyP: "high",
    Backslash: "volume",
  };
  const DJ_PAD_NOTES = [36, 39, 42, 46, 37, 38, 40, 44, 41, 43, 45, 47, 48, 50, 49, 51];
  const DJ_PAD_NAMES = ["Kick", "Clap", "Closed hat", "Open hat", "Rim", "Snare", "Snare 2", "Pedal hat",
    "Low tom", "Mid tom", "High tom", "Low tom 2", "Tom", "Tom 2", "Crash", "Ride"];
  const djState = {
    activeDeck: "A",
    arrangementStartTime: null,
    arrangementStopTime: null,
    arrangementPositionBar: 0,
    arrangementViewStartBar: 0,
    crossfader: 50,
    masterMuted: false,
    masterVolume: 1,
    masterLow: 0,
    masterMid: 0,
    masterHigh: 0,
    masterFilter: 20000,
    liveSlots: Array(8).fill(null),
    decks: {
      A: { sourceKey: "", volume: 0.8, muted: false, filter: 20000, eqLow: 0, eqMid: 0, eqHigh: 0, pitch: 0, syncRate: 1, reverse: false, startOffsetBars: 0, loop: null, playing: false, isStarting: false, startRequestId: 0, timerId: null, audioSource: null, songSources: new Set(), songGains: new Map(), songEvents: new Set(), songAnchorTime: 0, songPositionBar: 0, songRate: 1, songDurationBars: 0, songEndTime: 0, filterNode: null, eqLowNode: null, eqMidNode: null, eqHighNode: null, gainNode: null, audioContext: null, djMasterInput: null, nextStepTime: 0, stepIndex: 0, scratchRate: 1, nudgeRate: 1, isScratching: false },
      B: { sourceKey: "", volume: 0.8, muted: false, filter: 20000, eqLow: 0, eqMid: 0, eqHigh: 0, pitch: 0, syncRate: 1, reverse: false, startOffsetBars: 0, loop: null, playing: false, isStarting: false, startRequestId: 0, timerId: null, audioSource: null, songSources: new Set(), songGains: new Map(), songEvents: new Set(), songAnchorTime: 0, songPositionBar: 0, songRate: 1, songDurationBars: 0, songEndTime: 0, filterNode: null, eqLowNode: null, eqMidNode: null, eqHighNode: null, gainNode: null, audioContext: null, djMasterInput: null, nextStepTime: 0, stepIndex: 0, scratchRate: 1, nudgeRate: 1, isScratching: false },
    },
  };
  let djOpenLiveSlot = null;

  function getDjArrangementPositionBar() {
    if (Number.isFinite(djState.arrangementStopTime) ||
      !state.audioContext || !Number.isFinite(djState.arrangementStartTime)) {
      return djState.arrangementPositionBar;
    }
    return Math.max(0, (state.audioContext.currentTime - djState.arrangementStartTime) / (240 / state.bpm));
  }

  let djVisualTimer = null;
  let djViewExpanded = false;
  let djMasterChain = null;
  const djHeldKeys = new Set();
  const djDeckChordUsed = new Set();
  let djMuteKeyPending = false;
  let djLoopKeyPending = false;
  const reversedDjBuffers = new WeakMap();

  function setDjViewExpanded(expanded) {
    if (expanded && state.view !== "dj") return;
    djViewExpanded = expanded;
    if (!expanded) {
      djHeldKeys.clear();
      djDeckChordUsed.clear();
      djMuteKeyPending = false;
      djLoopKeyPending = false;
    }
    document.body.classList.toggle("is-dj-expanded", expanded);
    if (expanded) {
      const shell = document.querySelector(".app-shell");
      if (shell?.requestFullscreen) {
        shell.requestFullscreen().catch((error) => {
          if (djViewExpanded) showToast(`Browser fullscreen unavailable: ${error.message || "permission was denied"}`);
        });
      } else {
        showToast("Browser fullscreen is unavailable; DJ View will fill the app window.");
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch((error) => {
        showToast(`Could not exit browser fullscreen: ${error.message || "browser denied the request"}`);
      });
    }
    window.requestAnimationFrame(drawDjLiveView);
  }

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && djViewExpanded) setDjViewExpanded(false);
  });

  function getDjStorageKey() {
    return `${getProjectStorageKey(state.projectId)}:dj`;
  }

  function saveDjState() {
    if (!isApplyingUndo) recordUndoSnapshot("dj");
    try {
      const saved = {
        activeDeck: djState.activeDeck,
        crossfader: djState.crossfader,
        masterMuted: djState.masterMuted,
        masterVolume: djState.masterVolume,
        masterLow: djState.masterLow,
        masterMid: djState.masterMid,
        masterHigh: djState.masterHigh,
        masterFilter: djState.masterFilter,
        arrangementViewStartBar: djState.arrangementViewStartBar,
        liveSlots: djState.liveSlots,
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
            loop: deck.loop,
          }];
        })),
      };
      window.localStorage.setItem(getDjStorageKey(), JSON.stringify(saved));
    } catch (error) {
      showToast(`Could not save DJ set: ${error.message || "browser storage is unavailable"}`);
    }
  }

  function restoreDjState() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(getDjStorageKey()) || "null");
      if (!saved || typeof saved !== "object") return;
      if (saved.activeDeck === "A" || saved.activeDeck === "B") djState.activeDeck = saved.activeDeck;
      if (Number.isFinite(saved.crossfader)) djState.crossfader = Math.max(0, Math.min(100, saved.crossfader));
      djState.masterMuted = saved.masterMuted === true;
      if (Number.isFinite(saved.masterVolume)) djState.masterVolume = Math.max(0, Math.min(1, saved.masterVolume));
      if (Number.isFinite(saved.masterLow)) djState.masterLow = Math.max(-12, Math.min(12, saved.masterLow));
      if (Number.isFinite(saved.masterMid)) djState.masterMid = Math.max(-12, Math.min(12, saved.masterMid));
      if (Number.isFinite(saved.masterHigh)) djState.masterHigh = Math.max(-12, Math.min(12, saved.masterHigh));
      if (Number.isFinite(saved.masterFilter)) djState.masterFilter = Math.max(200, Math.min(20000, saved.masterFilter));
      if (Number.isFinite(saved.arrangementViewStartBar)) {
        djState.arrangementViewStartBar = Math.max(-DJ_ARRANGEMENT_BARS / 2,
          Math.min(DJ_MAX_CENTERED_OFFSET_BARS, saved.arrangementViewStartBar));
      }
      if (Array.isArray(saved.liveSlots)) {
        djState.liveSlots = Array.from({ length: 8 }, (_, index) => {
          const slot = saved.liveSlots[index];
          return typeof slot?.sourceKey === "string" && typeof slot?.name === "string"
            ? { sourceKey: slot.sourceKey, name: slot.name }
            : null;
        });
      }
      DJ_DECK_IDS.forEach((deckId) => {
        const savedDeck = saved.decks?.[deckId];
        if (!savedDeck || typeof savedDeck !== "object") return;
        const deck = djState.decks[deckId];
        if (typeof savedDeck.sourceKey === "string") deck.sourceKey = savedDeck.sourceKey;
        if (Number.isFinite(savedDeck.volume)) deck.volume = Math.max(0, Math.min(1, savedDeck.volume));
        deck.muted = savedDeck.muted === true;
        if (Number.isFinite(savedDeck.filter)) deck.filter = Math.max(200, Math.min(20000, savedDeck.filter));
        if (Number.isFinite(savedDeck.eqLow)) deck.eqLow = Math.max(-12, Math.min(12, savedDeck.eqLow));
        if (Number.isFinite(savedDeck.eqMid)) deck.eqMid = Math.max(-12, Math.min(12, savedDeck.eqMid));
        if (Number.isFinite(savedDeck.eqHigh)) deck.eqHigh = Math.max(-12, Math.min(12, savedDeck.eqHigh));
        if (Number.isFinite(savedDeck.pitch)) deck.pitch = Math.max(-8, Math.min(8, savedDeck.pitch));
        if (Number.isFinite(savedDeck.syncRate)) deck.syncRate = Math.max(0.25, Math.min(4, savedDeck.syncRate));
        deck.reverse = savedDeck.reverse === true;
        if (Number.isFinite(savedDeck.startOffsetBars)) {
          deck.startOffsetBars = Math.max(0, Math.min(DJ_MAX_OFFSET_BARS, savedDeck.startOffsetBars));
        }
        const loop = savedDeck.loop;
        if (loop && Number.isFinite(loop.startBar) && Number.isFinite(loop.endBar) &&
          Number.isFinite(loop.contentStart) && Number.isFinite(loop.contentEnd) &&
          Number.isFinite(loop.unitsPerBar) && loop.endBar > loop.startBar &&
          loop.contentEnd > loop.contentStart && loop.unitsPerBar > 0) {
          deck.loop = {
            startBar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 1, loop.startBar)),
            endBar: Math.max(1, Math.min(MAX_ARRANGEMENT_BARS, loop.endBar)),
            contentStart: Math.max(0, loop.contentStart),
            contentEnd: Math.max(0, loop.contentEnd),
            unitsPerBar: loop.unitsPerBar,
          };
        }
      });
    } catch (error) {
      showToast(`Could not restore DJ set: ${error.message || "saved data is unavailable"}`);
    }
  }

  function getDjArrangementDurationBars() {
    const patternEnd = state.patternClips.reduce((end, clip) =>
      Math.max(end, clip.startBar + getArrangementClipDuration("pattern", clip)), 0);
    const melEnd = state.melTracks.reduce((end, track) => track.clips.reduce((latest, clip) =>
      Math.max(latest, clip.startBar + getArrangementClipDuration("mel", clip)), end), 0);
    const audioEnd = state.arrangementTracks.reduce((end, track) => track.clips.reduce((latest, clip) => {
      const duration = clip.durationSeconds ?? clip.buffer?.duration ?? 0;
      return Math.max(latest, clip.startBar + duration / (240 / state.bpm));
    }, end), 0);
    return Math.max(patternEnd, melEnd, audioEnd);
  }

  function getDjSource(sourceKey) {
    if (typeof sourceKey !== "string" || !sourceKey) return null;
    const separator = sourceKey.indexOf(":");
    if (separator < 0) return null;
    const type = sourceKey.slice(0, separator);
    const id = sourceKey.slice(separator + 1);
    if (type === "pattern") {
      const pattern = getPattern(id);
      return pattern ? { type, id, name: pattern.name, item: pattern } : null;
    }
    if (type === "mel") {
      const mel = getMel(id);
      return mel ? { type, id, name: mel.name, item: mel } : null;
    }
    if (type === "audio") {
      const [trackId, clipId] = id.split(":");
      const track = state.arrangementTracks.find((item) => item.id === trackId);
      if (!track) return null;
      const clip = clipId
        ? track.clips.find((item) => item.id === clipId && item.buffer)
        : track.clips.find((item) => item.buffer);
      return clip ? {
        type,
        id: track.id,
        name: clip.name || track.name,
        item: { ...track, clips: [clip] },
      } : null;
    }
    if (type === "sample") {
      const track = state.tracks.find((item) => item.id === id && item.sample?.buffer);
      if (!track) return null;
      const clip = {
        id: track.id,
        name: track.sample.name || track.name,
        buffer: track.sample.buffer,
        durationSeconds: track.sample.buffer.duration,
        sourceOffsetSeconds: 0,
        audioMetadata: track.audioMetadata,
      };
      return {
        type: "audio",
        id: track.id,
        name: clip.name,
        item: { ...track, clips: [clip] },
      };
    }
    if (type === "song" && id === "current" && getDjArrangementDurationBars() > 0) {
      return { type, id, name: `${state.projectName || "Current Song"} (Full Song)`, item: state };
    }
    return null;
  }

  function getDjCycleTicks(source) {
    if (source?.type === "pattern") return Math.max(1, (source.item.steps || 16) * 2);
    if (source?.type === "mel") return Math.max(1, Math.round(getMelLengthBars(source.item) * PIANO_TICKS_PER_BAR));
    if (source?.type === "song") return Math.max(1, Math.ceil(getDjArrangementDurationBars() * PIANO_TICKS_PER_BAR));
    return 0;
  }

  function getDjLoopContentPosition(deck, position) {
    const loop = deck.loop;
    if (!loop || !Number.isFinite(position)) return position;
    const length = loop.contentEnd - loop.contentStart;
    if (length <= 0) return position;
    return loop.contentStart + ((position - loop.contentStart) % length + length) % length;
  }

  function getDjLoopStepBounds(deck, source) {
    if (!deck.loop || source?.type === "song") return null;
    const cycleTicks = getDjCycleTicks(source);
    if (!cycleTicks) return null;
    const start = deck.reverse ? cycleTicks - deck.loop.contentEnd : deck.loop.contentStart;
    const end = deck.reverse ? cycleTicks - deck.loop.contentStart : deck.loop.contentEnd;
    const startStep = Math.max(0, Math.min(cycleTicks - 1, Math.ceil(start - 1e-7)));
    const endStep = Math.max(startStep + 1, Math.min(cycleTicks, Math.ceil(end - 1e-7)));
    return { start: startStep, end: endStep };
  }

  function getDjNextStep(deck, source, clockStep) {
    const cycleTicks = getDjCycleTicks(source);
    const direction = deck.reverse ? -1 : 1;
    const nextStep = clockStep + direction;
    const bounds = getDjLoopStepBounds(deck, source);
    if (bounds) {
      if (direction < 0 && (nextStep < bounds.start || nextStep >= bounds.end)) return bounds.end - 1;
      if (direction > 0 && (nextStep < bounds.start || nextStep >= bounds.end)) return bounds.start;
    }
    return (nextStep + cycleTicks) % cycleTicks;
  }

  function getDjLoopSourceInfo(deckId) {
    const source = getDjSource(djState.decks[deckId].sourceKey);
    const timeline = source && getDjTimelineData(deckId);
    if (!source || !timeline) return null;
    if (timeline.kind === "audio") {
      const bpm = getDjSourceMetadata(source).bpm || state.bpm;
      return { source, cycle: timeline.loopSeconds, unitsPerBar: 240 / bpm };
    }
    return {
      source,
      cycle: timeline.loopTicks,
      unitsPerBar: PIANO_TICKS_PER_BAR,
    };
  }

  function clampDjLoopToSource(deckId) {
    const deck = djState.decks[deckId];
    if (!deck.loop) return;
    const info = getDjLoopSourceInfo(deckId);
    if (!info || info.cycle <= 0) {
      deck.loop = null;
      return;
    }
    let start = Math.max(0, deck.loop.contentStart);
    let end = Math.max(start + Number.EPSILON, deck.loop.contentEnd);
    if (info.source.type === "audio" || info.source.type === "song") {
      const length = Math.min(end - start, info.cycle);
      if (length <= 0) {
        deck.loop = null;
        return;
      }
      start = Math.min(start, info.cycle - length);
      end = start + length;
    } else {
      const length = end - start;
      start = ((start % info.cycle) + info.cycle) % info.cycle;
      end = start + length;
    }
    const startBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 1, Math.floor(deck.loop.startBar)));
    deck.loop = {
      startBar,
      endBar: Math.max(startBar + 1, Math.min(MAX_ARRANGEMENT_BARS, Math.floor(deck.loop.endBar))),
      contentStart: start,
      contentEnd: end,
      unitsPerBar: info.unitsPerBar,
    };
  }

  function getDjSourceOptions() {
    const groups = [
      { label: "Patterns", items: (state.patterns || []).map((item) => ({ key: `pattern:${item.id}`, name: item.name })) },
      { label: "Mels", items: (state.mels || []).map((item) => ({ key: `mel:${item.id}`, name: item.name })) },
      { label: "Audio files", items: state.arrangementTracks.flatMap((track) =>
        track.clips.filter((clip) => clip.buffer).map((clip, index) => ({
          key: index === 0 ? `audio:${track.id}` : `audio:${track.id}:${clip.id}`,
          name: clip.name || track.name,
        }))) },
      { label: "Uploaded samples", items: state.tracks
        .filter((track) => track.sample?.buffer &&
          (track.kind === "sample" || track.sample.name !== track.name))
        .map((track) => ({ key: `sample:${track.id}`, name: track.sample.name || track.name })) },
    ];
    if (getDjArrangementDurationBars() > 0) {
      groups.unshift({ label: "Arrangement", items: [{ key: "song:current", name: `${state.projectName || "Current Song"} (Full Song)` }] });
    }
    return groups;
  }

  async function loadDjSourceSamples(source) {
    let tracks = [];
    if (source.type === "pattern") {
      tracks = getPatternTrackIds(source.item)
        .map((trackId) => state.tracks.find((track) => track.id === trackId));
    } else if (source.type === "mel") {
      const instrument = getPianoTrack(source.item.instrumentId);
      if (instrument) tracks = [instrument];
    }
    const samples = new Map();
    tracks.filter((track) => track?.sampleUrl).forEach((track) => samples.set(track.sampleUrl, track));
    await Promise.all([...samples.values()].map(loadLibrarySample));
  }

  function getDjSourceMetadata(source) {
    if (!source) return { bpm: null, key: null };
    if (source.type === "audio") {
      const clip = source.item.clips.find((item) => item.buffer);
      const metadata = normalizeAudioMetadata(clip?.audioMetadata || source.item.audioMetadata);
      return metadata;
    }

    const noteGroups = [];
    if (source.type === "pattern") {
      noteGroups.push(...Object.values(source.item.stepPianoNotes || {}));
    } else if (source.type === "mel") {
      noteGroups.push(source.item.notes || []);
    } else if (source.type === "song") {
      state.patternClips.forEach((clip) => {
        const pattern = getPattern(clip.patternId);
        if (pattern) noteGroups.push(...Object.values(pattern.stepPianoNotes || {}));
      });
      state.melTracks.forEach((track) => track.clips.forEach((clip) => {
        const mel = getMel(clip.melId);
        if (mel) noteGroups.push(mel.notes || []);
      }));
      const keyVotes = state.arrangementTracks
        .flatMap((track) => track.clips)
        .map((clip) => normalizeAudioMetadata(clip.audioMetadata).key)
        .filter(Boolean);
      if (keyVotes.length) {
        const counts = new Map();
        keyVotes.forEach((key) => counts.set(key, (counts.get(key) || 0) + 1));
        return { bpm: state.bpm, key: [...counts].sort((a, b) => b[1] - a[1])[0][0] };
      }
    }

    const chroma = Array(12).fill(0);
    noteGroups.flat().forEach((note) => {
      if (!Number.isFinite(note.midi)) return;
      const pitchClass = (Math.round(note.midi) % 12 + 12) % 12;
      chroma[pitchClass] += Math.max(0.01, note.durationTicks || 1) * (note.velocity || 1);
    });
    return { bpm: state.bpm, key: getKeyFromChroma(chroma) };
  }

  function getDjSyncTempo(source, deck) {
    const baseBpm = getDjSourceMetadata(source).bpm || state.bpm;
    return baseBpm * getDjRate(deck);
  }

  function updateDjDial(input, formatValue) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const ratio = Math.max(0, Math.min(1, (Number(input.value) - min) / (max - min)));
    const dial = input.closest(".dj-dial");
    dial.style.setProperty("--dj-dial-angle", `${-135 + ratio * 270}deg`);
    dial.style.setProperty("--dj-dial-fill", `${ratio * 270}deg`);
    input.closest(".dj-dial-control").querySelector("output").textContent = formatValue(Number(input.value));
  }

  function formatDjDialValue(type, value) {
    if (type === "volume") return `${Math.round(value)}%`;
    if (type === "frequency") return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 ? 1 : 0)} kHz` : `${value} Hz`;
    return `${value > 0 ? "+" : ""}${Math.round(value)} dB`;
  }

  function bindDjDial(id, type, onInput) {
    const input = $(`#${id}`);
    input.addEventListener("input", () => {
      const value = Number(input.value);
      updateDjDial(input, (dialValue) => formatDjDialValue(type, dialValue));
      onInput(value);
    });
    input.addEventListener("change", saveDjState);
  }

  function renderDjView() {
    const groups = getDjSourceOptions();
    DJ_DECK_IDS.forEach((deckId) => {
      const deck = djState.decks[deckId];
      const suffix = deckId.toLowerCase();
      const select = $(`#dj-source-${suffix}`);
      select.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Choose a song, pattern, Mel, or audio file";
      select.append(placeholder);
      groups.forEach((group) => {
        if (!group.items.length) return;
        const optionGroup = document.createElement("optgroup");
        optionGroup.label = group.label;
        group.items.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.key;
          option.textContent = item.name;
          optionGroup.append(option);
        });
        select.append(optionGroup);
      });
      select.value = deck.sourceKey;
      if (select.value !== deck.sourceKey) {
        deck.sourceKey = "";
        deck.loop = null;
      }
      $(`#dj-volume-${suffix}`).value = String(Math.round(deck.volume * 100));
      $(`#dj-filter-${suffix}`).value = String(deck.filter);
      $(`#dj-eq-low-${suffix}`).value = String(deck.eqLow);
      $(`#dj-eq-mid-${suffix}`).value = String(deck.eqMid);
      $(`#dj-eq-high-${suffix}`).value = String(deck.eqHigh);
      updateDjDial($(`#dj-volume-${suffix}`), (value) => formatDjDialValue("volume", value));
      updateDjDial($(`#dj-filter-${suffix}`), (value) => formatDjDialValue("frequency", value));
      updateDjDial($(`#dj-eq-low-${suffix}`), (value) => formatDjDialValue("eq", value));
      updateDjDial($(`#dj-eq-mid-${suffix}`), (value) => formatDjDialValue("eq", value));
      updateDjDial($(`#dj-eq-high-${suffix}`), (value) => formatDjDialValue("eq", value));
      $(`#dj-pitch-${suffix}`).value = String(deck.pitch);
      updateDjDeckUI(deckId);
    });
    const masterControls = [
      ["dj-master-volume", djState.masterVolume, "volume"],
      ["dj-master-low", djState.masterLow, "eq"],
      ["dj-master-mid", djState.masterMid, "eq"],
      ["dj-master-high", djState.masterHigh, "eq"],
      ["dj-master-filter", djState.masterFilter, "frequency"],
    ];
    masterControls.forEach(([id, value, type]) => {
      const input = $(`#${id}`);
      input.value = String(type === "volume" ? Math.round(value * 100) : value);
      updateDjDial(input, (dialValue) => formatDjDialValue(type, dialValue));
    });
    $("#dj-view").classList.toggle("is-master-muted", djState.masterMuted);
    $("#dj-crossfader").value = String(djState.crossfader);

    const slots = $("#dj-live-slots");
    slots.replaceChildren();
    djState.liveSlots.forEach((slot, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "dj-live-slot-wrap";
      const trigger = document.createElement("button");
      trigger.className = `dj-live-slot${slot ? " is-filled" : ""}`;
      trigger.type = "button";
      trigger.dataset.slot = String(index);
      trigger.title = slot ? `Load ${slot.name} to the active deck` : "Choose a source for this cue slot";
      const key = document.createElement("strong");
      key.textContent = `F${index + 1}`;
      const name = document.createElement("span");
      name.textContent = slot?.name || "Tap to add";
      trigger.append(key, name);
      if (!slot && djOpenLiveSlot === index) {
        const picker = document.createElement("select");
        picker.className = "dj-live-slot-picker";
        picker.dataset.slotPicker = String(index);
        picker.setAttribute("aria-label", `Choose a source for cue slot ${index + 1}`);
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose source...";
        picker.append(placeholder);
        groups.forEach((group) => {
          if (!group.items.length) return;
          const optionGroup = document.createElement("optgroup");
          optionGroup.label = group.label;
          group.items.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.key;
            option.textContent = item.name;
            optionGroup.append(option);
          });
          picker.append(optionGroup);
        });
        if (!groups.some((group) => group.items.length)) {
          placeholder.textContent = "No sources available";
        }
        picker.addEventListener("keydown", (event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          djOpenLiveSlot = null;
          renderDjView();
          $(`#dj-live-slots [data-slot="${index}"]`)?.focus();
        });
        wrapper.append(picker);
      } else {
        wrapper.append(trigger);
      }
      if (slot) {
        const clear = document.createElement("button");
        clear.className = "dj-live-slot-clear";
        clear.type = "button";
        clear.dataset.clearSlot = String(index);
        clear.setAttribute("aria-label", `Clear live slot ${index + 1}`);
        clear.textContent = "×";
        wrapper.append(clear);
      }
      slots.append(wrapper);
    });

    const padGrid = $("#dj-pad-grid");
    padGrid.replaceChildren();
    DJ_PAD_NAMES.forEach((name, index) => {
      const pad = document.createElement("button");
      pad.className = "dj-pad";
      pad.type = "button";
      pad.dataset.pad = String(index);
      pad.setAttribute("aria-label", `Drum pad ${index + 1}: ${name}`);
      pad.append(document.createTextNode(name));
      const key = document.createElement("kbd");
      key.textContent = DJ_PAD_KEYS[index].replace(/^Key/, "").replace(/^Digit/, "");
      pad.append(key);
      padGrid.append(pad);
    });
    applyDjMixer();
    renderDjLiveView();
  }

  function getDjTimelineData(deckId) {
    const source = getDjSource(djState.decks[deckId].sourceKey);
    if (!source) return null;
    if (source.type === "song") {
      const notes = [
        ...state.patternClips.map((clip) => ({
          startTick: clip.startBar * PIANO_TICKS_PER_BAR,
          durationTicks: getArrangementClipDuration("pattern", clip) * PIANO_TICKS_PER_BAR,
          velocity: 0.7,
        })),
        ...state.melTracks.flatMap((track) => track.clips.map((clip) => ({
          startTick: clip.startBar * PIANO_TICKS_PER_BAR,
          durationTicks: getArrangementClipDuration("mel", clip) * PIANO_TICKS_PER_BAR,
          velocity: 0.7,
        }))),
        ...state.arrangementTracks.flatMap((track) => track.clips.map((clip) => ({
          startTick: clip.startBar * PIANO_TICKS_PER_BAR,
          durationTicks: (clip.durationSeconds ?? clip.buffer?.duration ?? 0) /
            (240 / state.bpm) * PIANO_TICKS_PER_BAR,
          velocity: 0.7,
        }))),
      ];
      return {
        source,
        kind: "ticks",
        loopTicks: Math.max(1, Math.ceil(getDjArrangementDurationBars() * PIANO_TICKS_PER_BAR)),
        lanes: [{ name: source.name, color: "#9bc6ff", notes }],
      };
    }
    if (source.type === "pattern") {
      const pattern = source.item;
      const stepCount = getGridStepCount(pattern);
      const ticksPerStep = getGridTicksPerStep(pattern);
      const lanes = getPatternTrackIds(pattern).map((trackId) => {
        const track = state.tracks.find((item) => item.id === trackId);
        return {
          name: track?.name || "Track",
          color: track?.color || "#d3f36b",
          cells: pattern.cells?.[trackId] || [],
          stepCount,
          ticksPerStep,
          notes: pattern.stepPianoNotes?.[trackId] || [],
        };
      });
      return { source, kind: "ticks", loopTicks: Math.max(1, (pattern.steps || 16) * 2), lanes };
    }
    if (source.type === "mel") {
      return {
        source,
        kind: "ticks",
        loopTicks: Math.max(1, Math.round(getMelLengthBars(source.item) * PIANO_TICKS_PER_BAR)),
        lanes: [{ name: source.item.name, color: "#9bc6ff", notes: source.item.notes || [] }],
      };
    }
    const clip = source.item.clips.find((item) => item.buffer);
    const offset = Math.max(0, clip?.sourceOffsetSeconds || 0);
    const duration = clip ? Math.max(0, Math.min(clip.buffer.duration - offset,
      clip.durationSeconds ?? clip.buffer.duration)) : 0;
    return {
      source,
      kind: "audio",
      clip,
      offset,
      loopSeconds: duration,
      lanes: [{ name: clip?.name || source.item.name, color: "#9bc6ff" }],
    };
  }

  function updateDjArrangementViewportUI() {
    const scroll = $("#dj-arrangement-scroll");
    const range = $("#dj-arrangement-range");
    scroll.min = String(-DJ_ARRANGEMENT_BARS / 2);
    scroll.max = String(DJ_MAX_CENTERED_OFFSET_BARS);
    scroll.value = String(djState.arrangementViewStartBar);
    const formatBar = (bar) => Number.isInteger(bar) ? String(bar) : String(Number(bar.toFixed(2)));
    const firstBar = Math.max(1, Math.floor(djState.arrangementViewStartBar) + 1);
    const lastBar = Math.max(firstBar, Math.min(MAX_ARRANGEMENT_BARS,
      Math.floor(djState.arrangementViewStartBar + DJ_ARRANGEMENT_BARS)));
    range.textContent = `BARS ${formatBar(firstBar)}–${formatBar(lastBar)}`;
  }

  function renderDjLiveView() {
    updateDjArrangementViewportUI();
    DJ_DECK_IDS.forEach((deckId) => {
      const data = getDjTimelineData(deckId);
      const suffix = deckId.toLowerCase();
      const name = data?.source.name || "No track loaded";
      $(`#dj-track-name-${suffix}`).textContent = name;
      updateDjDeckDisplays(deckId);
      const offset = djState.decks[deckId].startOffsetBars;
      $(`#dj-live-offset-${suffix}`).textContent = `+${Number.isInteger(offset) ? offset : offset.toFixed(2)} bars`;
      [`dj-deck-waveform-${suffix}`, `dj-live-waveform-${suffix}`].forEach((id) => {
        const canvas = $(`#${id}`);
        canvas.setAttribute("aria-label", `${name}, Deck ${deckId} scrolling waveform`);
      });
    });
    drawDjLiveView();
  }

  function updateDjArrangementAutoScroll() {
    if (!DJ_DECK_IDS.some((deckId) => djState.decks[deckId].playing)) return;
    const positionBar = getDjArrangementPositionBar();
    const targetViewStartBar = positionBar - DJ_ARRANGEMENT_BARS / 2;
    const nextViewStartBar = Math.max(-DJ_ARRANGEMENT_BARS / 2,
      Math.min(DJ_MAX_CENTERED_OFFSET_BARS, targetViewStartBar));
    if (Math.abs(nextViewStartBar - djState.arrangementViewStartBar) < 0.01) return;
    djState.arrangementViewStartBar = nextViewStartBar;
    updateDjArrangementViewportUI();
  }

  function setDjArrangementPositionBar(bar) {
    djState.arrangementPositionBar = Number.isFinite(bar)
      ? Math.max(0, Math.min(MAX_ARRANGEMENT_BARS, bar))
      : djState.arrangementPositionBar;
    djState.arrangementStopTime = state.audioContext?.currentTime ?? 0;
    DJ_DECK_IDS.forEach((deckId) => {
      djState.decks[deckId].resumeContentPosition = null;
      djState.decks[deckId].resumeArrangementBar = null;
      djState.decks[deckId].pausedViewStartBar = null;
      djState.decks[deckId].visualSegments = [];
      updateDjDeckUI(deckId);
    });
    renderDjLiveView();
  }

  function seekDjArrangementToBar(bar) {
    const resumeDeckIds = DJ_DECK_IDS.filter((deckId) => djState.decks[deckId].playing);
    resumeDeckIds.forEach(stopDjDeck);
    setDjArrangementPositionBar(bar);
    resumeDeckIds.forEach(startDjDeck);
  }

  function drawDjArrangementRuler() {
    const canvas = $("#dj-arrangement-ruler");
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
    context.fillStyle = "#17181b";
    context.fillRect(0, 0, width, height);

    const timelineWidth = Math.max(1, width - 16);
    const firstBar = Math.floor(djState.arrangementViewStartBar);
    const lastBar = Math.min(MAX_ARRANGEMENT_BARS,
      Math.ceil(djState.arrangementViewStartBar + DJ_ARRANGEMENT_BARS));
    for (let bar = firstBar; bar <= lastBar; bar += 1) {
      if (bar < 0) continue;
      const x = 8 + (bar - djState.arrangementViewStartBar) / DJ_ARRANGEMENT_BARS * timelineWidth;
      if (x < 0 || x > width) continue;
      context.strokeStyle = bar % 4 === 0 ? "#60636b" : "#3c3e44";
      context.beginPath();
      context.moveTo(x, 2);
      context.lineTo(x, height);
      context.stroke();
    }

    const playheadBar = getDjArrangementPositionBar();
    canvas.setAttribute("aria-valuenow", String(Math.round(playheadBar * 100) / 100));
    canvas.setAttribute("aria-valuetext", `Bar ${Math.floor(playheadBar) + 1}`);
    const playheadX = 8 + Math.max(0, Math.min(1,
      (playheadBar - djState.arrangementViewStartBar) / DJ_ARRANGEMENT_BARS)) * timelineWidth;
    context.fillStyle = "#f3f5e8";
    context.beginPath();
    context.moveTo(playheadX - 4, 0);
    context.lineTo(playheadX + 4, 0);
    context.lineTo(playheadX, 5);
    context.closePath();
    context.fill();
    context.strokeStyle = "#f3f5e8";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(playheadX, 5);
    context.lineTo(playheadX, height);
    context.stroke();
  }

  function getDjTickWaveformPeak(lanes, tick) {
    let peak = 0;
    lanes.forEach((lane) => {
      if (Array.isArray(lane.cells) && lane.ticksPerStep) {
        const stepPosition = tick / lane.ticksPerStep;
        const step = Math.floor(stepPosition);
        if (lane.cells[step]) {
          const phase = stepPosition - step;
          const envelope = 0.28 + 0.72 * Math.exp(-phase * 4);
          const texture = 0.4 + 0.6 * Math.abs(Math.sin((phase * 3 + step) * Math.PI));
          peak = Math.max(peak, 0.82 * envelope * texture);
        }
      }
      (lane.notes || []).forEach((note) => {
        const duration = note.durationTicks || 1;
        if (tick >= note.startTick && tick < note.startTick + duration) {
          const phase = (tick - note.startTick) / duration;
          const envelope = Math.min(1, phase * 12, (1 - phase) * 8);
          const texture = 0.45 + 0.55 * Math.abs(Math.sin(phase * Math.PI * 8));
          peak = Math.max(peak, (note.velocity ?? 0.8) * envelope * texture);
        }
      });
    });
    return peak;
  }

  function drawDjLiveView() {
    scheduleDjMetronome();
    updateDjArrangementAutoScroll();
    drawDjArrangementRuler();
    DJ_DECK_IDS.forEach(updateDjDeckDisplays);
    document.querySelectorAll(".dj-live-timeline").forEach((canvas) => {
      const deckId = canvas.dataset.deck;
      const data = getDjTimelineData(deckId);
      if (!data) return;
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
      context.fillStyle = "#17181b";
      context.fillRect(0, 0, width, height);

      const deck = djState.decks[deckId];
      const now = state.audioContext?.currentTime || 0;
      const labelWidth = Math.min(132, Math.max(78, width * 0.23));
      const timelineWidth = Math.max(1, width - labelWidth);
      const rowHeight = 34;
      let position;
      let visibleSpan;
      let start;
      if (data.kind === "ticks") {
        const tickRate = state.bpm / 60 * 8 * getDjRate(deck);
        position = (deck.visualStartTick || 0) +
          (deck.playing ? Math.max(0, now - (deck.visualStartTime || now)) * tickRate : 0);
        visibleSpan = data.loopTicks * 2;
        start = Math.max(0, position - visibleSpan * 0.75);
      } else {
        const playbackRate = getDjRate(deck);
        position = deck.playing ? Math.max(0, now - (deck.visualStartTime || now)) * playbackRate : 0;
        visibleSpan = Math.max(1, data.loopSeconds * 2);
        start = Math.max(0, position - visibleSpan * 0.75);
      }

      data.lanes.forEach((lane, index) => {
        const top = index * rowHeight;
        context.fillStyle = index % 2 ? "#1b1c20" : "#1e1f23";
        context.fillRect(0, top, width, rowHeight);
        context.fillStyle = "#aeb0b6";
        context.font = "9px sans-serif";
        context.textBaseline = "middle";
        context.save();
        context.beginPath();
        context.rect(6, top, labelWidth - 12, rowHeight);
        context.clip();
        context.fillText(lane.name, 9, top + rowHeight / 2);
        context.restore();

        const toX = (value) => labelWidth + (value - start) / visibleSpan * timelineWidth;
        if (data.kind === "ticks") {
          const firstBar = Math.floor(start / PIANO_TICKS_PER_BAR);
          const lastBar = Math.ceil((start + visibleSpan) / PIANO_TICKS_PER_BAR);
          for (let bar = firstBar; bar <= lastBar; bar += 1) {
            const x = toX(bar * PIANO_TICKS_PER_BAR);
            context.strokeStyle = bar % 4 === 0 ? "#45474d" : "#303137";
            context.beginPath();
            context.moveTo(x, top);
            context.lineTo(x, top + rowHeight);
            context.stroke();
            if (index === 0) {
              context.fillStyle = "#74767d";
              context.font = "8px monospace";
              context.fillText(String(bar + 1), x + 3, 8);
            }
          }
          const loop = data.loopTicks;
          const binCount = Math.max(48, Math.min(900, Math.floor(timelineWidth)));
          const binWidth = timelineWidth / binCount;
          context.strokeStyle = lane.color;
          context.globalAlpha = 0.88;
          context.lineWidth = Math.max(1, binWidth * 0.5);
          for (let bin = 0; bin < binCount; bin += 1) {
            const timelineTick = start + (bin + 0.5) / binCount * visibleSpan;
            const phase = ((timelineTick % loop) + loop) % loop;
            const sourceTick = deck.reverse ? loop - 1 - phase : phase;
            const peak = getDjTickWaveformPeak([lane], sourceTick);
            if (peak <= 0) continue;
            const amplitude = Math.max(1.5, peak * (rowHeight - 12) / 2);
            const x = labelWidth + (bin + 0.5) * binWidth;
            context.beginPath();
            context.moveTo(x, top + rowHeight / 2 - amplitude);
            context.lineTo(x, top + rowHeight / 2 + amplitude);
            context.stroke();
          }
          context.globalAlpha = 1;
        } else if (data.clip && data.loopSeconds > 0) {
          const clip = data.clip;
          const samples = clip.buffer.getChannelData(0);
          const firstSample = Math.floor(data.offset / clip.buffer.duration * samples.length);
          const sampleCount = Math.max(1, Math.floor(data.loopSeconds / clip.buffer.duration * samples.length));
          const binCount = Math.max(24, Math.min(128, Math.floor(timelineWidth / 3)));
          const firstLoop = Math.floor(start / data.loopSeconds);
          const lastLoop = Math.ceil((start + visibleSpan) / data.loopSeconds);
          context.strokeStyle = lane.color;
          context.lineWidth = 1;
          for (let loopIndex = firstLoop; loopIndex <= lastLoop; loopIndex += 1) {
            const loopStart = loopIndex * data.loopSeconds;
            for (let bin = 0; bin < binCount; bin += 1) {
              const absoluteTime = loopStart + bin / binCount * data.loopSeconds;
              if (absoluteTime < start || absoluteTime > start + visibleSpan) continue;
              const sourceBin = deck.reverse ? binCount - 1 - bin : bin;
              const sampleStart = firstSample + Math.floor(sourceBin / binCount * sampleCount);
              const sampleEnd = Math.min(samples.length, firstSample + Math.floor((sourceBin + 1) / binCount * sampleCount));
              const sampleStride = Math.max(1, Math.floor((sampleEnd - sampleStart) / 24));
              let peak = 0;
              for (let sample = sampleStart; sample < Math.max(sampleStart + 1, sampleEnd); sample += sampleStride) {
                peak = Math.max(peak, Math.abs(samples[Math.min(sample, samples.length - 1)]));
              }
              const x = toX(absoluteTime);
              const amplitude = Math.max(2, peak * (rowHeight - 12) / 2);
              context.beginPath();
              context.moveTo(x, top + rowHeight / 2 - amplitude);
              context.lineTo(x, top + rowHeight / 2 + amplitude);
              context.stroke();
            }
          }
        }
      });

      const playheadX = labelWidth + Math.max(0, Math.min(1, (position - start) / visibleSpan)) * timelineWidth;
      context.strokeStyle = "#f3f5e8";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(playheadX, 0);
      context.lineTo(playheadX, Math.min(height, data.lanes.length * rowHeight));
      context.stroke();
    });
    drawDjWaveforms();
  }

  function drawDjWaveforms() {
    document.querySelectorAll(".dj-waveform").forEach((canvas) => {
      const deckId = canvas.dataset.deck;
      const deck = djState.decks[deckId];
      const data = getDjTimelineData(deckId);
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
      context.fillStyle = "#121316";
      context.fillRect(0, 0, width, height);
      const center = height / 2;
      const centerColor = "#3b3d43";
      context.strokeStyle = centerColor;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, center);
      context.lineTo(width, center);
      context.stroke();
      const color = deckId === "A" ? "#d3f36b" : "#8ebdff";
      if (!data || (data.kind === "audio" && (!data.clip || data.loopSeconds <= 0))) {
        context.fillStyle = "#777980";
        context.font = "9px monospace";
        context.textBaseline = "middle";
        context.fillText(data ? "AUDIO UNAVAILABLE" : "LOAD A TRACK", 8, center - 10);
        return;
      }

      const isAudio = data.kind === "audio";
      const isSong = data.source.type === "song";
      const loopSpan = isAudio ? data.loopSeconds : data.loopTicks;
      const now = state.audioContext?.currentTime || 0;
      const position = getDjVisualPosition(deck);
      const isLive = canvas.dataset.waveform === "live";
      const liveSpan = DJ_ARRANGEMENT_BARS * 240 / state.bpm;
      const visibleSpan = isLive ? liveSpan : isSong ? loopSpan : loopSpan * 2;
      const barSeconds = 240 / state.bpm;
      const viewStartBar = isLive && !deck.playing && Number.isFinite(deck.pausedViewStartBar)
        ? deck.pausedViewStartBar
        : djState.arrangementViewStartBar;
      const arrangementStart = Number.isFinite(djState.arrangementStartTime)
        ? djState.arrangementStartTime
        : now;
      const start = isLive
        ? arrangementStart + viewStartBar * barSeconds
        : Math.max(0, position - visibleSpan * 0.75);
      const pausedAtBar = isLive && !deck.playing && Number.isFinite(deck.resumeArrangementBar)
        ? deck.resumeArrangementBar
        : null;
      const playheadBar = pausedAtBar ?? getDjArrangementPositionBar();
      const playheadPosition = isLive
        ? arrangementStart + playheadBar * barSeconds
        : position;
      const isDragPreview = Number.isFinite(deck.dragPreviewStartTime);
      const unitsPerSecond = isAudio ? 1 : state.bpm / 60 * 8;
      const timelineWidth = Math.max(1, width - 16);
      const binCount = Math.max(48, Math.min(900, Math.floor(timelineWidth)));
      const stepWidth = timelineWidth / binCount;

      if (isAudio) {
        const samples = data.clip.buffer.getChannelData(0);
        const firstSample = Math.floor(data.offset / data.clip.buffer.duration * samples.length);
        const sampleCount = Math.max(1, Math.floor(data.loopSeconds / data.clip.buffer.duration * samples.length));
        const firstBar = isLive ? Math.max(0, Math.floor(viewStartBar)) : Math.floor(start / barSeconds);
        const lastBar = isLive
          ? Math.min(MAX_ARRANGEMENT_BARS, Math.ceil(viewStartBar + DJ_ARRANGEMENT_BARS))
          : Math.ceil((start + visibleSpan) / barSeconds);
        for (let bar = firstBar; bar <= lastBar; bar += 1) {
          const x = isLive
            ? 8 + (bar - viewStartBar) / DJ_ARRANGEMENT_BARS * timelineWidth
            : 8 + ((bar * barSeconds - start) / visibleSpan) * timelineWidth;
          context.strokeStyle = "#2d3035";
          context.beginPath();
          context.moveTo(x, 2);
          context.lineTo(x, height - 2);
          context.stroke();
        }
        for (let bin = 0; bin < binCount; bin += 1) {
          const timelineTime = start + (bin + 0.5) / binCount * visibleSpan;
          const sourcePosition = isLive
            ? getDjVisualPositionAtTime(deck, timelineTime, unitsPerSecond, isDragPreview)
            : timelineTime;
          if (sourcePosition === null) continue;
          const localTime = ((sourcePosition % loopSpan) + loopSpan) % loopSpan;
          const sourceTime = deck.reverse ? loopSpan - localTime : localTime;
          const sourceBin = Math.min(binCount - 1, Math.floor(sourceTime / loopSpan * binCount));
          const sampleStart = firstSample + Math.floor(sourceBin / binCount * sampleCount);
          const sampleEnd = Math.min(samples.length, firstSample + Math.floor((sourceBin + 1) / binCount * sampleCount));
          const sampleStride = Math.max(1, Math.floor((sampleEnd - sampleStart) / 18));
          let peak = 0;
          for (let sample = sampleStart; sample < Math.max(sampleStart + 1, sampleEnd); sample += sampleStride) {
            peak = Math.max(peak, Math.abs(samples[Math.min(sample, samples.length - 1)]));
          }
          const amplitude = Math.max(1.5, peak * (height * 0.43));
          context.strokeStyle = color;
          context.globalAlpha = 0.9;
          context.lineWidth = Math.max(1, stepWidth * 0.45);
          context.beginPath();
          context.moveTo(8 + (bin + 0.5) * stepWidth, center - amplitude);
          context.lineTo(8 + (bin + 0.5) * stepWidth, center + amplitude);
          context.stroke();
          context.globalAlpha = 1;
        }
      } else {
        const barSpan = isLive ? 240 / state.bpm : PIANO_TICKS_PER_BAR;
        const firstBar = isLive ? Math.max(0, Math.floor(viewStartBar)) : Math.floor(start / barSpan);
        const lastBar = isLive
          ? Math.min(MAX_ARRANGEMENT_BARS, Math.ceil(viewStartBar + DJ_ARRANGEMENT_BARS))
          : Math.ceil((start + visibleSpan) / barSpan);
        for (let bar = firstBar; bar <= lastBar; bar += 1) {
          const x = isLive
            ? 8 + (bar - viewStartBar) / DJ_ARRANGEMENT_BARS * timelineWidth
            : 8 + ((bar * barSpan - start) / visibleSpan) * timelineWidth;
          context.strokeStyle = "#2d3035";
          context.beginPath();
          context.moveTo(x, 2);
          context.lineTo(x, height - 2);
          context.stroke();
        }
        for (let bin = 0; bin < binCount; bin += 1) {
          const timelineValue = start + (bin + 0.5) / binCount * visibleSpan;
          const timelineTick = isLive
            ? getDjVisualPositionAtTime(deck, timelineValue, unitsPerSecond, isDragPreview)
            : timelineValue;
          if (timelineTick === null) continue;
          if (isSong && (timelineTick < 0 || timelineTick >= loopSpan)) continue;
          const phase = isSong ? timelineTick : ((timelineTick % loopSpan) + loopSpan) % loopSpan;
          const sourceTick = !isSong && deck.reverse ? loopSpan - 1 - phase : phase;
          const peak = getDjTickWaveformPeak(data.lanes, sourceTick);
          if (peak <= 0) continue;
          const amplitude = Math.max(2, peak * (height * 0.43));
          context.strokeStyle = color;
          context.globalAlpha = 0.9;
          context.lineWidth = Math.max(1, stepWidth * 0.45);
          context.beginPath();
          context.moveTo(8 + (bin + 0.5) * stepWidth, center - amplitude);
          context.lineTo(8 + (bin + 0.5) * stepWidth, center + amplitude);
          context.stroke();
          context.globalAlpha = 1;
        }
      }
      if (isLive && deck.loop) {
        const loopLeft = 8 + (deck.loop.startBar - viewStartBar) / DJ_ARRANGEMENT_BARS * timelineWidth;
        const loopRight = 8 + (deck.loop.endBar - viewStartBar) / DJ_ARRANGEMENT_BARS * timelineWidth;
        const visibleLeft = Math.max(8, loopLeft);
        const visibleRight = Math.min(width - 8, loopRight);
        if (visibleRight > visibleLeft) {
          context.save();
          context.globalAlpha = 0.1;
          context.fillStyle = color;
          context.fillRect(visibleLeft, 1, visibleRight - visibleLeft, height - 2);
          context.globalAlpha = 0.85;
          context.strokeStyle = color;
          context.setLineDash([3, 2]);
          [visibleLeft, visibleRight].forEach((x) => {
            context.beginPath();
            context.moveTo(x, 1);
            context.lineTo(x, height - 1);
            context.stroke();
          });
          context.restore();
        }
      }
      const playheadX = 8 + Math.max(0, Math.min(1, (playheadPosition - start) / visibleSpan)) * timelineWidth;
      const isPausedPosition = pausedAtBar !== null;
      context.strokeStyle = isPausedPosition ? color : "#f3f5e8";
      context.lineWidth = isLive ? 2 : 1.5;
      if (isPausedPosition) context.setLineDash([3, 3]);
      context.beginPath();
      context.moveTo(playheadX, 1);
      context.lineTo(playheadX, height - 1);
      context.stroke();
      context.setLineDash([]);
      if (isLive) {
        const label = `BAR ${Math.floor(playheadBar) + 1}`;
        context.font = "8px monospace";
        context.textBaseline = "middle";
        const labelWidth = context.measureText(label).width + 8;
        const labelHeight = 13;
        const labelX = Math.max(2, playheadX - labelWidth - 4);
        context.fillStyle = "#f3f5e8";
        context.fillRect(labelX, 3, labelWidth, labelHeight);
        context.fillStyle = "#17181b";
        context.fillText(label, labelX + 4, 3 + labelHeight / 2);
      }
    });
  }

  function refreshDjVisualTimer() {
    const isPlaying = state.view === "dj" && DJ_DECK_IDS.some((deckId) => djState.decks[deckId].playing);
    if (isPlaying && djVisualTimer === null) {
      djVisualTimer = window.setInterval(drawDjLiveView, 33);
    } else if (!isPlaying && djVisualTimer !== null) {
      window.clearInterval(djVisualTimer);
      djVisualTimer = null;
      drawDjLiveView();
    }
  }

  function updateDjDeckUI(deckId) {
    const deck = djState.decks[deckId];
    const suffix = deckId.toLowerCase();
    const source = getDjSource(deck.sourceKey);
    $(`#dj-deck-${suffix}`).classList.toggle("is-active", djState.activeDeck === deckId);
    $(`#dj-deck-${suffix}`).classList.toggle("is-playing", deck.playing);
    $(`#dj-deck-${suffix}`).classList.toggle("is-muted", deck.muted);
    document.querySelector(`.dj-live-waveform-row[data-deck="${deckId}"]`)
      ?.classList.toggle("is-paused", !deck.playing && Number.isFinite(deck.resumeArrangementBar));
    $(`#dj-focus-${suffix}`).setAttribute("aria-pressed", String(djState.activeDeck === deckId));
    document.querySelector(`.dj-live-waveform-row[data-deck="${deckId}"]`)
      ?.classList.toggle("is-playing", deck.playing);
    document.querySelector(`.dj-live-waveform-row[data-deck="${deckId}"]`)
      ?.classList.toggle("is-muted", deck.muted);
    const playButton = $(`#dj-play-${suffix}`);
    playButton.textContent = deck.playing ? "Pause" : "Play";
    playButton.classList.toggle("is-playing", deck.playing);
    playButton.setAttribute("aria-pressed", String(deck.playing));
    const platter = $(`#dj-platter-${suffix}`);
    platter.classList.toggle("is-playing", deck.playing);
    platter.classList.toggle("is-reverse", source?.type !== "song" && deck.reverse);
    platter.classList.toggle("is-scratching", deck.isScratching);
    platter.style.setProperty("--dj-spin-duration", `${1.8 / Math.max(0.25, getDjRate(deck))}s`);
    const reverseButton = $(`#dj-reverse-${suffix}`);
    reverseButton.disabled = source?.type === "song";
    reverseButton.title = source?.type === "song" ? "Reverse is unavailable for full-song arrangements." : "";
    reverseButton.setAttribute("aria-pressed", String(source?.type !== "song" && deck.reverse));
    updateDjDeckDisplays(deckId);
  }

  function getDjRate(deck) {
    return Math.max(0.25, (1 + deck.pitch / 100) * (deck.scratchRate || 1) *
      (deck.nudgeRate || 1) * (deck.syncRate || 1));
  }

  function getDjVisualPositionAtTime(deck, time, unitsPerSecond, isDragPreview) {
    let position;
    if (isDragPreview) {
      if (time < deck.dragPreviewStartTime) return null;
      position = (time - deck.dragPreviewStartTime) * unitsPerSecond * getDjRate(deck);
    } else if (!deck.playing && Number.isFinite(deck.visualStopTime) &&
      Number.isFinite(deck.resumeContentPosition) && time >= deck.visualStopTime) {
      position = deck.resumeContentPosition + (time - deck.visualStopTime) *
        unitsPerSecond * (deck.resumeRate || getDjRate(deck));
    } else {
      const segments = deck.visualSegments || [];
      let low = 0;
      let high = segments.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (segments[middle].startTime <= time) low = middle + 1;
        else high = middle;
      }
      const segment = segments[low - 1];
      if (!segment || (Number.isFinite(segment.endTime) && time > segment.endTime)) return null;
      position = segment.startPosition + (time - segment.startTime) * unitsPerSecond * segment.rate;
    }
    return getDjLoopContentPosition(deck, position);
  }

  function startDjVisualSegment(deck, startTime, startPosition) {
    if (!Array.isArray(deck.visualSegments)) deck.visualSegments = [];
    const previousSegment = deck.visualSegments[deck.visualSegments.length - 1];
    const segmentStartTime = previousSegment
      ? Math.max(startTime, previousSegment.startTime,
        Number.isFinite(previousSegment.endTime) ? previousSegment.endTime : previousSegment.startTime)
      : startTime;
    if (previousSegment && !Number.isFinite(previousSegment.endTime)) {
      previousSegment.endTime = segmentStartTime;
    }
    deck.visualSegments.push({
      startTime: segmentStartTime,
      startPosition,
      rate: getDjRate(deck),
      endTime: null,
    });
  }

  function updateDjAudioRate(deck, updateRate, timeConstant = 0.015) {
    const now = state.audioContext?.currentTime ?? 0;
    const sourceType = getDjSource(deck.sourceKey)?.type;
    const position = deck.playing && sourceType !== "song"
      ? getDjVisualPosition(deck)
      : null;
    const fromRate = deck.audioSource ? getDjAudioRateAt(deck, now) : getDjRate(deck);
    updateRate();
    if (position === null || !state.audioContext) return;
    deck.visualPosition = position;
    deck.visualStartPosition = position;
    deck.visualStartTime = now;
    startDjVisualSegment(deck, now, position);
    if (!deck.audioSource) return;
    deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck), now, timeConstant);
    deck.audioRateFrom = fromRate;
    deck.audioRateTarget = getDjRate(deck);
    deck.audioRateStartTime = now;
    deck.audioRateTimeConstant = timeConstant;
  }

  function getDjAudioRateAt(deck, time) {
    const fromRate = Number.isFinite(deck.audioRateFrom) ? deck.audioRateFrom : getDjRate(deck);
    const targetRate = Number.isFinite(deck.audioRateTarget) ? deck.audioRateTarget : getDjRate(deck);
    const timeConstant = deck.audioRateTimeConstant || 0;
    if (!timeConstant || !Number.isFinite(deck.audioRateStartTime)) return targetRate;
    return targetRate + (fromRate - targetRate) *
      Math.exp(-Math.max(0, time - deck.audioRateStartTime) / timeConstant);
  }

  function getDjVisualPosition(deck) {
    const source = getDjSource(deck.sourceKey);
    const startPosition = Number.isFinite(deck.visualStartPosition) ? deck.visualStartPosition : 0;
    if (source?.type === "song" && deck.playing && state.audioContext) {
      const secondsPerBar = 240 / state.bpm / deck.songRate;
      let currentBar = deck.songPositionBar + Math.max(0, state.audioContext.currentTime - deck.songAnchorTime) / secondsPerBar;
      if (deck.loop) {
        const startBar = deck.loop.contentStart / PIANO_TICKS_PER_BAR;
        const endBar = deck.loop.contentEnd / PIANO_TICKS_PER_BAR;
        if (endBar > startBar && currentBar >= endBar) {
          currentBar = startBar + ((currentBar - startBar) % (endBar - startBar));
        }
      }
      return getDjLoopContentPosition(deck,
        Math.min(deck.songDurationBars * PIANO_TICKS_PER_BAR, currentBar * PIANO_TICKS_PER_BAR));
    }
    if (!deck.playing || !state.audioContext || !Number.isFinite(deck.visualStartTime)) {
      return getDjLoopContentPosition(deck,
        Number.isFinite(deck.visualPosition) ? deck.visualPosition : startPosition);
    }
    const elapsed = Math.max(0, state.audioContext.currentTime - deck.visualStartTime);
    if (source?.type === "audio") {
      const timeConstant = deck.audioRateTimeConstant || 0;
      const targetRate = Number.isFinite(deck.audioRateTarget) ? deck.audioRateTarget : getDjRate(deck);
      const fromRate = Number.isFinite(deck.audioRateFrom) ? deck.audioRateFrom : targetRate;
      const advance = timeConstant
        ? targetRate * elapsed + (fromRate - targetRate) * timeConstant *
          (1 - Math.exp(-elapsed / timeConstant))
        : targetRate * elapsed;
      return getDjLoopContentPosition(deck, startPosition + advance);
    }
    return getDjLoopContentPosition(deck, startPosition + elapsed * state.bpm / 60 * 8 * getDjRate(deck));
  }

  function getReversedDjBuffer(buffer) {
    const cached = reversedDjBuffers.get(buffer);
    if (cached) return cached;
    const reversed = state.audioContext.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const source = buffer.getChannelData(channel);
      const destination = reversed.getChannelData(channel);
      for (let index = 0; index < source.length; index += 1) {
        destination[index] = source[source.length - 1 - index];
      }
    }
    reversedDjBuffers.set(buffer, reversed);
    return reversed;
  }

  function updateDjDeckDisplays(deckId) {
    const deck = djState.decks[deckId];
    const suffix = deckId.toLowerCase();
    const source = getDjSource(deck.sourceKey);
    $(`#dj-track-name-${suffix}`).textContent = source?.name || "No track loaded";
    const metadata = getDjSourceMetadata(source);
    const displayedBpm = Number.isFinite(metadata.bpm) ? Math.round(metadata.bpm * getDjRate(deck)) : "—";
    $(`#dj-metadata-${suffix}`).textContent = `BPM ${displayedBpm} · KEY ${metadata.key || "—"}`;
    $(`#dj-pitch-value-${suffix}`).textContent = `${deck.pitch >= 0 ? "+" : ""}${deck.pitch.toFixed(1)}%`;
    const timeline = source ? getDjTimelineData(deckId) : null;
    let display = "00:00";
    if (timeline?.kind === "ticks") {
      const progress = getDjVisualPosition(deck);
      const loopTick = source?.type === "song"
        ? Math.min(timeline.loopTicks, progress)
        : deck.reverse
          ? timeline.loopTicks - 1 - (progress % timeline.loopTicks)
          : progress % timeline.loopTicks;
      const bar = Math.floor(loopTick / PIANO_TICKS_PER_BAR) + 1;
      const beat = Math.floor(loopTick % PIANO_TICKS_PER_BAR / 8) + 1;
      display = `B${bar} · ${beat}`;
    } else if (timeline?.loopSeconds > 0) {
      const loopPosition = getDjVisualPosition(deck) % timeline.loopSeconds;
      const seconds = deck.reverse
        ? timeline.offset + timeline.loopSeconds - loopPosition
        : timeline.offset + loopPosition;
      const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
      display = `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
    }
    $(`#dj-time-${suffix}`).textContent = display;
  }

  function toggleDjReverse(deckId) {
    const deck = djState.decks[deckId];
    if (getDjSource(deck.sourceKey)?.type === "song") {
      showToast("Reverse is unavailable for full-song arrangements.");
      return;
    }
    const wasPlaying = deck.playing;
    if (wasPlaying) stopDjDeck(deckId);
    deck.reverse = !deck.reverse;
    if (wasPlaying) startDjDeck(deckId);
    updateDjDeckUI(deckId);
    renderDjLiveView();
    saveDjState();
  }

  function setActiveDjDeck(deckId) {
    if (!DJ_DECK_IDS.includes(deckId)) return;
    djState.activeDeck = deckId;
    DJ_DECK_IDS.forEach(updateDjDeckUI);
    saveDjState();
  }

  function createDjEqNodes(context) {
    const lowNode = context.createBiquadFilter();
    lowNode.type = "lowshelf";
    lowNode.frequency.value = 250;
    const midNode = context.createBiquadFilter();
    midNode.type = "peaking";
    midNode.frequency.value = 1000;
    midNode.Q.value = 0.8;
    const highNode = context.createBiquadFilter();
    highNode.type = "highshelf";
    highNode.frequency.value = 6500;
    lowNode.connect(midNode);
    midNode.connect(highNode);
    return { lowNode, midNode, highNode };
  }

  function ensureDjMasterAudio() {
    if (djMasterChain?.context === state.audioContext && djMasterChain.output === state.masterGain) return djMasterChain;
    if (djMasterChain) {
      [djMasterChain.lowNode, djMasterChain.midNode, djMasterChain.highNode,
        djMasterChain.filterNode, djMasterChain.gainNode].forEach((node) => node.disconnect());
    }
    const context = state.audioContext;
    const eqNodes = createDjEqNodes(context);
    const filterNode = context.createBiquadFilter();
    filterNode.type = "lowpass";
    const gainNode = context.createGain();
    eqNodes.highNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(state.masterGain);
    djMasterChain = { context, output: state.masterGain, ...eqNodes, filterNode, gainNode };
    return djMasterChain;
  }

  function ensureDjDeckAudio(deck) {
    const masterChain = ensureDjMasterAudio();
    if (deck.audioContext !== state.audioContext || deck.djMasterInput !== masterChain.lowNode || !deck.filterNode) {
      [deck.eqLowNode, deck.eqMidNode, deck.eqHighNode, deck.filterNode, deck.gainNode]
        .filter(Boolean).forEach((node) => node.disconnect());
      const eqNodes = createDjEqNodes(state.audioContext);
      deck.eqLowNode = eqNodes.lowNode;
      deck.eqMidNode = eqNodes.midNode;
      deck.eqHighNode = eqNodes.highNode;
      deck.filterNode = state.audioContext.createBiquadFilter();
      deck.filterNode.type = "lowpass";
      deck.gainNode = state.audioContext.createGain();
      deck.eqHighNode.connect(deck.filterNode);
      deck.filterNode.connect(deck.gainNode);
      deck.gainNode.connect(masterChain.lowNode);
      deck.audioContext = state.audioContext;
      deck.djMasterInput = masterChain.lowNode;
    }
    applyDjMixer();
  }

  function applyDjMixer() {
    if (!state.audioContext || !state.masterGain) return;
    const now = state.audioContext.currentTime;
    if (djMasterChain?.context === state.audioContext) {
      djMasterChain.lowNode.gain.setTargetAtTime(djState.masterLow, now, 0.015);
      djMasterChain.midNode.gain.setTargetAtTime(djState.masterMid, now, 0.015);
      djMasterChain.highNode.gain.setTargetAtTime(djState.masterHigh, now, 0.015);
      djMasterChain.filterNode.frequency.setTargetAtTime(djState.masterFilter, now, 0.015);
      djMasterChain.gainNode.gain.setTargetAtTime(djState.masterVolume * (djState.masterMuted ? 0 : 1), now, 0.015);
    }
    const crossfader = djState.crossfader / 100;
    const gains = [Math.cos(crossfader * Math.PI / 2), Math.sin(crossfader * Math.PI / 2)];
    DJ_DECK_IDS.forEach((deckId, index) => {
      const deck = djState.decks[deckId];
      if (!deck.filterNode || !deck.gainNode || deck.audioContext !== state.audioContext) return;
      deck.eqLowNode.gain.setTargetAtTime(deck.eqLow, now, 0.015);
      deck.eqMidNode.gain.setTargetAtTime(deck.eqMid, now, 0.015);
      deck.eqHighNode.gain.setTargetAtTime(deck.eqHigh, now, 0.015);
      deck.filterNode.frequency.setTargetAtTime(deck.filter, now, 0.015);
      deck.gainNode.gain.setTargetAtTime(deck.volume * gains[index] * (deck.muted ? 0 : 1), now, 0.015);
    });
  }

  function toggleDjDeckMute(deckId) {
    const deck = djState.decks[deckId];
    deck.muted = !deck.muted;
    applyDjMixer();
    updateDjDeckUI(deckId);
    saveDjState();
  }

  function toggleDjMasterMute() {
    djState.masterMuted = !djState.masterMuted;
    applyDjMixer();
    $("#dj-view").classList.toggle("is-master-muted", djState.masterMuted);
    saveDjState();
  }

  function stopDjDeck(deckId) {
    const deck = djState.decks[deckId];
    deck.startRequestId += 1;
    deck.isStarting = false;
    const stoppedAt = deck.playing ? state.audioContext?.currentTime : null;
    const stoppedAtBar = deck.playing ? getDjArrangementPositionBar() : null;
    if (deck.timerId !== null) window.clearInterval(deck.timerId);
    deck.timerId = null;
    if (deck.playing && state.audioContext) {
      deck.visualPosition = getDjVisualPosition(deck);
      deck.resumeContentPosition = deck.visualPosition;
      deck.visualStopTime = state.audioContext.currentTime;
      const segments = deck.visualSegments || [];
      const currentSegment = segments[segments.length - 1];
      if (currentSegment && !Number.isFinite(currentSegment.endTime)) {
        currentSegment.endTime = deck.visualStopTime;
      }
    }
    deck.isScratching = false;
    deck.scratchPointerId = null;
    deck.scratchRate = 1;
    deck.nudgeRate = 1;
    if (Number.isFinite(stoppedAtBar)) deck.resumeRate = getDjRate(deck);
    if (deck.nudgeTimer !== null) window.clearTimeout(deck.nudgeTimer);
    deck.nudgeTimer = null;
    if (deck.audioSource) {
      deck.audioSource.onended = null;
      deck.audioSource.stop();
      deck.audioSource.disconnect();
    }
    deck.audioSource = null;
    deck.songSources.forEach((source) => {
      source.onended = null;
      try { source.stop(); } catch { /* The source may have ended between scheduler ticks. */ }
      source.disconnect();
    });
    deck.songSources.clear();
    deck.songGains.forEach((gain) => gain.disconnect());
    deck.songGains.clear();
    deck.songEvents.clear();
    deck.playing = false;
    if (Number.isFinite(stoppedAtBar)) {
      deck.resumeArrangementBar = stoppedAtBar;
      deck.pausedViewStartBar = djState.arrangementViewStartBar;
    }
    if (Number.isFinite(stoppedAt) && !DJ_DECK_IDS.some((id) => djState.decks[id].playing)) {
      djState.arrangementPositionBar = stoppedAtBar;
      djState.arrangementStopTime = stoppedAt;
    }
    updateDjDeckUI(deckId);
    refreshDjVisualTimer();
  }

  async function startDjDeck(deckId) {
    const deck = djState.decks[deckId];
    if (deck.playing || deck.isStarting) return;
    const source = getDjSource(deck.sourceKey);
    if (!source) {
      showToast("Choose a live source for this deck first.");
      return;
    }
    const sourceKey = deck.sourceKey;
    const requestId = ++deck.startRequestId;
    deck.isStarting = true;
    clampDjLoopToSource(deckId);
    try {
      await ensureAudio();
      if (requestId !== deck.startRequestId) return;
      if (sourceKey !== deck.sourceKey) {
        deck.isStarting = false;
        return;
      }
      if (source.type === "song") await loadLibrarySamplesForPlayback("arrangement");
      else if (source.type === "pattern" || source.type === "mel") await loadDjSourceSamples(source);
      if (requestId !== deck.startRequestId) return;
      if (sourceKey !== deck.sourceKey) {
        deck.isStarting = false;
        return;
      }
      ensureDjDeckAudio(deck);
      const syncedStart = deck.syncedStartTime > 0;
      const anotherDeckPlaying = DJ_DECK_IDS.some((id) => id !== deckId && djState.decks[id].playing);
      const baseStartTime = Math.max(state.audioContext.currentTime + 0.04, deck.syncedStartTime || 0);
      const arrangementPositionBar = getDjArrangementPositionBar();
      const deckPositionBar = Number.isFinite(deck.resumeArrangementBar)
        ? deck.resumeArrangementBar
        : arrangementPositionBar;
      const barSeconds = 240 / state.bpm;
      const pausedContentPosition = !syncedStart && Number.isFinite(deck.resumeContentPosition)
        ? deck.resumeContentPosition
        : null;
      if (pausedContentPosition === null) deck.visualSegments = [];
      if (!anotherDeckPlaying || !Number.isFinite(djState.arrangementStartTime)) {
        const previousArrangementStart = djState.arrangementStartTime;
        const nextArrangementStart = baseStartTime - arrangementPositionBar * barSeconds;
        if (Number.isFinite(previousArrangementStart)) {
          const timeShift = nextArrangementStart - previousArrangementStart;
          DJ_DECK_IDS.forEach((id) => {
            const shiftedDeck = djState.decks[id];
            (shiftedDeck.visualSegments || []).forEach((segment) => {
              segment.startTime += timeShift;
              if (Number.isFinite(segment.endTime)) segment.endTime += timeShift;
            });
            if (Number.isFinite(shiftedDeck.visualStopTime)) shiftedDeck.visualStopTime += timeShift;
          });
        }
        djState.arrangementStartTime = nextArrangementStart;
      }
      if (!anotherDeckPlaying) djState.arrangementStopTime = null;
      const stagedStartTime = Number.isFinite(djState.arrangementStartTime)
        ? djState.arrangementStartTime + deck.startOffsetBars * barSeconds
        : baseStartTime + deck.startOffsetBars * barSeconds;
      const startTime = syncedStart
        ? baseStartTime
        : Math.max(state.audioContext.currentTime + 0.04, stagedStartTime);
      const sourceProgressBars = syncedStart
        ? 0
        : pausedContentPosition !== null
          ? pausedContentPosition / (source.type === "audio" ? barSeconds : PIANO_TICKS_PER_BAR)
          : deck.loop
            ? deck.loop.contentStart / (source.type === "audio" ? barSeconds : PIANO_TICKS_PER_BAR)
          : Math.max(0, deckPositionBar - deck.startOffsetBars) * getDjRate(deck);
      deck.syncedStartTime = 0;
      deck.dragPreviewStartTime = null;
      deck.resumeContentPosition = null;
      deck.resumeArrangementBar = null;
      deck.pausedViewStartBar = null;
      deck.resumeRate = null;
      deck.visualStopTime = null;
      deck.nextStepTime = startTime;
      deck.isStarting = false;
      deck.playing = true;
      if (source.type === "song") {
        deck.songSources = new Set();
        deck.songGains = new Map();
        deck.songEvents = new Set();
        deck.songAnchorTime = startTime;
        deck.songRate = getDjRate(deck);
        deck.songDurationBars = getDjArrangementDurationBars();
        deck.songPositionBar = Math.min(deck.songDurationBars, sourceProgressBars);
        deck.songEndTime = getDjSongTimeForBar(deck, deck.songDurationBars);
        deck.visualStartTime = startTime;
        deck.visualStartPosition = deck.songPositionBar * PIANO_TICKS_PER_BAR;
        deck.visualPosition = deck.visualStartPosition;
        startDjVisualSegment(deck, startTime, deck.visualStartPosition);
        deck.timerId = window.setInterval(() => {
          try {
            scheduleDjDeck(deckId);
          } catch (error) {
            stopDjDeck(deckId);
            showToast(error.message || "DJ song playback stopped unexpectedly.");
          }
        }, 25);
        scheduleDjDeck(deckId);
      } else if (source.type === "audio") {
        const clip = source.item.clips.find((item) => item.buffer);
        if (!clip) {
          deck.playing = false;
          deck.isStarting = false;
          showToast("This audio track has no available decoded clip.");
          updateDjDeckUI(deckId);
          return;
        }
        const offset = Math.max(0, clip.sourceOffsetSeconds || 0);
        const duration = Math.min(clip.buffer.duration - offset, clip.durationSeconds ?? clip.buffer.duration);
        if (duration <= 0) {
          deck.playing = false;
          deck.isStarting = false;
          showToast("This audio clip has no playable duration.");
          updateDjDeckUI(deckId);
          return;
        }
        const buffer = deck.reverse ? getReversedDjBuffer(clip.buffer) : clip.buffer;
        const baseLoopStart = deck.reverse ? clip.buffer.duration - (offset + duration) : offset;
        const loopStart = baseLoopStart + (deck.loop?.contentStart || 0);
        const loopEnd = baseLoopStart + (deck.loop?.contentEnd ?? duration);
        const player = state.audioContext.createBufferSource();
        player.buffer = buffer;
        player.loop = true;
        player.loopStart = loopStart;
        player.loopEnd = loopEnd;
        player.playbackRate.value = getDjRate(deck);
        player.connect(deck.eqLowNode);
        player.onended = () => {
          if (deck.audioSource === player) deck.audioSource = null;
        };
        const rawResumePosition = pausedContentPosition === null
          ? (sourceProgressBars * barSeconds) % duration
          : ((pausedContentPosition % duration) + duration) % duration;
        const resumePosition = deck.loop
          ? getDjLoopContentPosition(deck, rawResumePosition)
          : rawResumePosition;
        player.start(startTime, loopStart + (deck.loop ? resumePosition - deck.loop.contentStart : resumePosition));
        deck.audioSource = player;
        deck.audioRateFrom = getDjRate(deck);
        deck.audioRateTarget = deck.audioRateFrom;
        deck.audioRateStartTime = startTime;
        deck.audioRateTimeConstant = 0;
        deck.visualStartTime = startTime;
        deck.visualStartPosition = resumePosition;
        deck.visualPosition = resumePosition;
        startDjVisualSegment(deck, startTime, resumePosition);
      } else {
        const cycleTicks = getDjCycleTicks(source);
        const hasPendingStep = syncedStart && Number.isFinite(deck.pendingStepIndex);
        const resumePosition = pausedContentPosition === null
          ? sourceProgressBars * PIANO_TICKS_PER_BAR
          : pausedContentPosition;
        const resumePhase = ((resumePosition % cycleTicks) + cycleTicks) % cycleTicks;
        const nextPhaseTick = Math.ceil(resumePhase - 1e-7);
        const nextStepPhase = nextPhaseTick % cycleTicks;
        deck.stepIndex = hasPendingStep
          ? deck.pendingStepIndex
          : deck.reverse
            ? (cycleTicks - 1 - nextStepPhase + cycleTicks) % cycleTicks
            : nextStepPhase;
        deck.pendingStepIndex = undefined;
        deck.nextStepTime = startTime + (hasPendingStep ? 0 :
          Math.max(0, nextPhaseTick - resumePhase) * getSchedulerTickDuration() / getDjRate(deck));
        deck.visualStartTime = startTime;
        deck.visualStartPosition = hasPendingStep
          ? deck.reverse
            ? (cycleTicks - 1 - deck.stepIndex + cycleTicks) % cycleTicks
            : deck.stepIndex
          : resumePhase;
        deck.visualPosition = deck.visualStartPosition;
        startDjVisualSegment(deck, startTime, deck.visualStartPosition);
        deck.timerId = window.setInterval(() => {
          try {
            scheduleDjDeck(deckId);
          } catch (error) {
            stopDjDeck(deckId);
            showToast(error.message || "DJ deck playback stopped unexpectedly.");
          }
        }, 25);
        scheduleDjDeck(deckId);
      }
      updateDjDeckUI(deckId);
      refreshDjVisualTimer();
    } catch (error) {
      if (requestId !== deck.startRequestId) return;
      deck.isStarting = false;
      stopDjDeck(deckId);
      showToast(error.message || "DJ deck audio could not start.");
    }
  }

  function toggleDjDeck(deckId) {
    if (djState.decks[deckId].playing || djState.decks[deckId].isStarting) stopDjDeck(deckId);
    else startDjDeck(deckId);
  }

  function applyDjAudioLoop(deckId) {
    const deck = djState.decks[deckId];
    if (!deck.audioSource) return;
    const timeline = getDjTimelineData(deckId);
    if (timeline?.kind !== "audio" || !timeline.clip?.buffer) return;
    const loopStart = deck.reverse
      ? timeline.clip.buffer.duration - (timeline.offset + timeline.loopSeconds)
      : timeline.offset;
    deck.audioSource.loopStart = loopStart + (deck.loop?.contentStart || 0);
    deck.audioSource.loopEnd = loopStart + (deck.loop?.contentEnd ?? timeline.loopSeconds);
  }

  function refreshDjLoopPlayback(deckId) {
    const deck = djState.decks[deckId];
    const source = getDjSource(deck.sourceKey);
    if (deck.playing && source?.type === "audio" && state.audioContext) {
      resyncDjAudio(deck, source, deckId, 0, state.audioContext.currentTime);
    } else {
      applyDjAudioLoop(deckId);
    }
  }

  function toggleDjLoop(deckId) {
    const deck = djState.decks[deckId];
    if (!getDjSource(deck.sourceKey)) {
      showToast(`Load a track into Deck ${deckId} before adding a loop.`);
      return;
    }
    if (deck.loop) {
      const source = getDjSource(deck.sourceKey);
      const songPosition = source?.type === "song" && deck.playing
        ? getDjVisualPosition(deck) / PIANO_TICKS_PER_BAR
        : null;
      deck.loop = null;
      if (songPosition !== null) {
        deck.songPositionBar = songPosition;
        deck.songAnchorTime = state.audioContext.currentTime;
        deck.songEndTime = getDjSongTimeForBar(deck, deck.songDurationBars);
      }
      refreshDjLoopPlayback(deckId);
      updateDjDeckUI(deckId);
      renderDjLiveView();
      saveDjState();
      showToast(`Deck ${deckId} loop removed.`);
      return;
    }

    const info = getDjLoopSourceInfo(deckId);
    if (!info || !Number.isFinite(info.cycle) || info.cycle <= 0) {
      showToast(`Deck ${deckId} has no playable loop range.`);
      return;
    }
    const currentPosition = Number.isFinite(deck.resumeContentPosition)
      ? deck.resumeContentPosition
      : getDjVisualPosition(deck);
    const cyclePosition = ((currentPosition % info.cycle) + info.cycle) % info.cycle;
    const loopLength = Math.min(info.unitsPerBar, info.cycle);
    const contentStart = Math.min(
      Math.floor(cyclePosition / info.unitsPerBar) * info.unitsPerBar,
      info.cycle - loopLength,
    );
    const arrangementBar = Number.isFinite(deck.resumeArrangementBar)
      ? deck.resumeArrangementBar
      : getDjArrangementPositionBar();
    const startBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 1, Math.floor(arrangementBar)));
    const loop = {
      startBar,
      endBar: startBar + 1,
      contentStart,
      contentEnd: contentStart + loopLength,
      unitsPerBar: info.unitsPerBar,
    };
    const wasPlaying = deck.playing;
    if (wasPlaying) stopDjDeck(deckId);
    deck.loop = loop;
    deck.resumeContentPosition = loop.contentStart;
    deck.resumeArrangementBar = startBar;
    deck.pausedViewStartBar = djState.arrangementViewStartBar;
    if (wasPlaying) void startDjDeck(deckId);
    else {
      deck.visualPosition = loop.contentStart;
      deck.visualStartPosition = loop.contentStart;
    }
    updateDjDeckUI(deckId);
    renderDjLiveView();
    saveDjState();
    showToast(`Deck ${deckId} looping bar ${startBar + 1}.`);
  }

  function resizeDjLoop(deckId, direction) {
    const deck = djState.decks[deckId];
    clampDjLoopToSource(deckId);
    if (!deck.loop) return;
    const nextEndBar = deck.loop.endBar + direction;
    if (nextEndBar - deck.loop.startBar < 1) return;
    if (nextEndBar > MAX_ARRANGEMENT_BARS) return;
    const info = getDjLoopSourceInfo(deckId);
    if (!info) return;
    const nextContentEnd = Math.min(
      info.cycle,
      deck.loop.contentStart + (nextEndBar - deck.loop.startBar) * deck.loop.unitsPerBar,
    );
    if (nextContentEnd <= deck.loop.contentStart && direction < 0) return;
    deck.loop.endBar = nextEndBar;
    deck.loop.contentEnd = direction > 0
      ? Math.max(deck.loop.contentEnd, nextContentEnd)
      : nextContentEnd;
    if (!deck.playing && Number.isFinite(deck.resumeContentPosition)) {
      deck.resumeContentPosition = getDjLoopContentPosition(deck, deck.resumeContentPosition);
      deck.visualPosition = deck.resumeContentPosition;
      deck.visualStartPosition = deck.resumeContentPosition;
    }
    refreshDjLoopPlayback(deckId);
    updateDjDeckUI(deckId);
    renderDjLiveView();
    saveDjState();
    showToast(`Deck ${deckId} loop ${direction > 0 ? "extended" : "shortened"} to ${nextEndBar - deck.loop.startBar} bar${nextEndBar - deck.loop.startBar === 1 ? "" : "s"}.`);
  }

  function toggleDjDeckGroup(deckIds) {
    const loadedDeckIds = deckIds.filter((deckId) => getDjSource(djState.decks[deckId].sourceKey));
    if (!loadedDeckIds.length) {
      showToast("Load a track into a deck first.");
      return;
    }
    if (loadedDeckIds.some((deckId) =>
      djState.decks[deckId].playing || djState.decks[deckId].isStarting)) {
      const positionBar = getDjArrangementPositionBar();
      const stoppedAt = state.audioContext?.currentTime ?? 0;
      loadedDeckIds.forEach((deckId) => {
        if (djState.decks[deckId].playing || djState.decks[deckId].isStarting) stopDjDeck(deckId);
        else djState.decks[deckId].resumeContentPosition = null;
        djState.decks[deckId].resumeArrangementBar = positionBar;
        djState.decks[deckId].pausedViewStartBar = djState.arrangementViewStartBar;
        updateDjDeckUI(deckId);
      });
      djState.arrangementPositionBar = positionBar;
      djState.arrangementStopTime = stoppedAt;
      refreshDjVisualTimer();
      return;
    }
    loadedDeckIds.forEach((deckId) => {
      if (!djState.decks[deckId].playing) startDjDeck(deckId);
    });
  }

  function getDjSongTimeForBar(deck, bar) {
    return deck.songAnchorTime + (bar - deck.songPositionBar) * 240 / state.bpm / deck.songRate;
  }

  function updateDjSongRate(deck) {
    if (!deck.playing || getDjSource(deck.sourceKey)?.type !== "song" || !state.audioContext) return;
    const now = state.audioContext.currentTime;
    const secondsPerBar = 240 / state.bpm / deck.songRate;
    const position = Math.min(deck.songDurationBars,
      deck.songPositionBar + Math.max(0, now - deck.songAnchorTime) / secondsPerBar);
    deck.songPositionBar = getDjLoopContentPosition(deck, position * PIANO_TICKS_PER_BAR) /
      PIANO_TICKS_PER_BAR;
    deck.songAnchorTime = now;
    deck.visualStartTime = now;
    deck.visualStartPosition = deck.songPositionBar * PIANO_TICKS_PER_BAR;
    deck.songRate = getDjRate(deck);
    startDjVisualSegment(deck, now, deck.visualStartPosition);
    deck.songEndTime = getDjSongTimeForBar(deck, deck.songDurationBars);
    deck.songSources.forEach((source) => {
      source.playbackRate.setTargetAtTime(deck.songRate, now, 0.015);
    });
  }

  function getDjSongGain(deck, key, volume) {
    let gain = deck.songGains.get(key);
    const level = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
    if (!gain) {
      gain = state.audioContext.createGain();
      gain.gain.value = level;
      gain.connect(deck.eqLowNode);
      deck.songGains.set(key, gain);
    }
    return gain;
  }

  function scheduleDjArrangement(deckId) {
    const deck = djState.decks[deckId];
    if (!deck.playing || !state.audioContext) return;
    const now = state.audioContext.currentTime;
    if (!deck.loop && now >= deck.songEndTime) {
      if (deck.playing) stopDjDeck(deckId);
      return;
    }
    let endTime = deck.songEndTime;
    if (deck.loop) {
      const loopStartBar = Math.max(0, Math.min(deck.songDurationBars,
        deck.loop.contentStart / PIANO_TICKS_PER_BAR));
      const loopEndBar = Math.max(loopStartBar, Math.min(deck.songDurationBars,
        deck.loop.contentEnd / PIANO_TICKS_PER_BAR));
      let loopEndTime = getDjSongTimeForBar(deck, loopEndBar);
      if (now >= loopEndTime) {
        deck.songPositionBar = loopStartBar;
        deck.songAnchorTime = loopEndTime;
        deck.songRate = getDjRate(deck);
        deck.songEvents.clear();
        loopEndTime = getDjSongTimeForBar(deck, loopEndBar);
      }
      endTime = loopEndTime;
    }
    const lookAhead = AUDIO_SCHEDULER_LOOKAHEAD;
    const secondsPerBar = 240 / state.bpm / deck.songRate;
    const currentBar = deck.songPositionBar + Math.max(0, now - deck.songAnchorTime) / secondsPerBar;
    const lookAheadBars = lookAhead / secondsPerBar;
    const hasArrangementSolo = [...state.tracks, ...state.patterns, ...state.melTracks, ...state.arrangementTracks]
      .some((track) => track.solo);
    const hasViewTrackSolo = [...state.patterns, ...state.melTracks, ...state.arrangementTracks]
      .some((track) => track.solo);
    const hasInstrumentSolo = state.tracks.some((track) => track.solo);
    const isInLookAhead = (time) => time >= now && time < now + lookAhead && time < endTime;

    state.arrangementTracks.forEach((track) => {
      if (track.muted || (hasArrangementSolo && !track.solo)) return;
      track.clips.forEach((clip) => {
        getAudioClipSegments(clip, deck.songPositionBar, clip.startBar + getArrangementClipDuration("audio", clip))
          .forEach((segment) => {
            const key = `audio:${clip.id}:${segment.loopIndex}`;
            if (deck.songEvents.has(key)) return;
            const time = getDjSongTimeForBar(deck, segment.startBar);
            if (!isInLookAhead(time)) return;
            const duration = Math.min(segment.durationSeconds, Math.max(0, (endTime - time) * deck.songRate));
            if (duration <= 0) return;
            const player = state.audioContext.createBufferSource();
            player.buffer = clip.buffer;
            player.playbackRate.value = deck.songRate;
            player.connect(getDjSongGain(deck, `audio:${track.id}`, track.volume));
            player.onended = () => {
              deck.songSources.delete(player);
              player.disconnect();
            };
            player.start(time, segment.sourceOffsetSeconds, duration);
            deck.songSources.add(player);
            deck.songEvents.add(key);
          });
      });
    });

    state.patternClips.forEach((clip) => {
      const pattern = getPattern(clip.patternId);
      if (!pattern) return;
      const patternTrack = state.patterns.find((item) => item.id === (clip.trackId || clip.patternId)) || pattern;
      if (patternTrack.muted || (hasViewTrackSolo && !patternTrack.solo)) return;
      const stepsPerBar = getStepsPerBar(pattern);
      const sourceOffset = clip.sourceOffsetBars || 0;
      const sourceBars = pattern.steps / 16 * (clip.repeatCount || 1);
      const clipDuration = getArrangementClipDuration("pattern", clip);
      const sourceEndStep = Math.min(sourceBars * stepsPerBar,
        Math.ceil((sourceOffset + clipDuration) * stepsPerBar - 0.0001));
      const currentSourceStep = (sourceOffset + currentBar - clip.startBar) * stepsPerBar;
      const firstStep = Math.max(0, Math.ceil(sourceOffset * stepsPerBar - 0.0001), Math.floor(currentSourceStep) - 3);
      const lastStep = Math.min(sourceEndStep,
        Math.ceil((sourceOffset + currentBar + lookAheadBars - clip.startBar) * stepsPerBar) + 4);
      const gridStepCount = getGridStepCount(pattern);
      const ticksPerGridStep = getGridTicksPerStep(pattern);
      const patternTrackIds = getPatternTrackIds(pattern);

      for (let sourceStep = firstStep; sourceStep < lastStep; sourceStep += 1) {
        const sourcePosition = sourceStep / stepsPerBar;
        const sourceOffsetBars = sourcePosition - sourceOffset;
        const patternStep = sourceStep % gridStepCount;
        const tick = patternStep * ticksPerGridStep;
        const bar = clip.startBar + sourceOffsetBars;
        const time = getDjSongTimeForBar(deck, bar) +
          (Math.floor(tick / 2) % 2 === 1 ? getStepDuration() * state.swing / 100 / deck.songRate : 0);
        if (!isInLookAhead(time)) continue;
        state.tracks.forEach((track) => {
          if (!patternTrackIds.includes(track.id) || !pattern.cells?.[track.id]?.[patternStep] ||
            track.muted || (hasInstrumentSolo && !track.solo) ||
            Array.isArray(pattern.stepPianoNotes?.[track.id])) return;
          const eventKey = `pattern:${clip.id}:${sourceStep}:${track.id}`;
          if (deck.songEvents.has(eventKey)) return;
          const trackTime = time + (getTrackStepTime(track, patternStep, pattern, time) - time) / deck.songRate;
          const volume = (patternTrack.volume ?? 1) * (track.volume ?? 1);
          triggerTrack(track, trackTime, patternStep, pattern.variants?.[track.id] || track.variant,
            getNoteDuration(pattern) / deck.songRate, patternTrack,
            getDjSongGain(deck, `pattern:${clip.id}:${track.id}`, volume));
          deck.songEvents.add(eventKey);
        });
      }

      const patternBars = pattern.steps / 16;
      const loopCount = Math.ceil(sourceBars / patternBars);
      Object.entries(pattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
        const track = state.tracks.find((item) => item.id === trackId);
        if (!track || !Array.isArray(notes) || !patternTrackIds.includes(trackId) ||
          patternTrack.muted || (hasViewTrackSolo && !patternTrack.solo) ||
          track.muted || (hasInstrumentSolo && !track.solo)) return;
        for (let loop = 0; loop < loopCount; loop += 1) {
          notes.forEach((note) => {
            const sourcePosition = loop * patternBars + note.startTick / PIANO_TICKS_PER_BAR;
            if (sourcePosition < sourceOffset || sourcePosition >= sourceOffset + clipDuration) return;
            const bar = clip.startBar + sourcePosition - sourceOffset;
            const time = getDjSongTimeForBar(deck, bar) +
              (Math.floor(note.startTick / 2) % 2 === 1 ? getStepDuration() * state.swing / 100 / deck.songRate : 0);
            const eventKey = `pattern-piano:${clip.id}:${trackId}:${loop}:${note.id}`;
            if (deck.songEvents.has(eventKey) || !isInLookAhead(time)) return;
            const clipEnd = (sourceOffset + clipDuration - sourcePosition) * secondsPerBar;
            const duration = Math.min(note.durationTicks * getSchedulerTickDuration() / deck.songRate, clipEnd);
            if (duration > 0) {
              playPianoNote(track, time, note.midi, duration, note.velocity ?? 0.8, patternTrack,
                getDjSongGain(deck, `pattern:${clip.id}:${trackId}`, (patternTrack.volume ?? 1) * (track.volume ?? 1)), note);
              deck.songEvents.add(eventKey);
            }
          });
        }
      });
    });

    state.melTracks.forEach((melTrack) => {
      const instrument = getPianoTrack(melTrack.instrumentId);
      if (!instrument || melTrack.muted || (hasViewTrackSolo && !melTrack.solo) ||
        instrument.muted || (hasInstrumentSolo && !instrument.solo)) return;
      melTrack.clips.forEach((clip) => {
        const mel = getMel(clip.melId);
        if (!mel) return;
        getMelClipNoteEvents(mel, clip).forEach(({ note, loop, startBar, endBar }) => {
          const time = getDjSongTimeForBar(deck, startBar);
          const eventKey = `mel:${melTrack.id}:${clip.id}:${loop}:${note.id}`;
          if (deck.songEvents.has(eventKey) || !isInLookAhead(time)) return;
          const duration = Math.min((endBar - startBar) * secondsPerBar, endTime - time);
          if (duration > 0) {
            playPianoNote(instrument, time, note.midi, duration, note.velocity ?? 0.8, melTrack,
              getDjSongGain(deck, `mel:${melTrack.id}:${clip.id}`, melTrack.volume), note);
            deck.songEvents.add(eventKey);
          }
        });
      });
    });
  }

  function scheduleDjDeck(deckId) {
    const deck = djState.decks[deckId];
    if (!deck.playing || !state.audioContext) return;
    const source = getDjSource(deck.sourceKey);
    if (source?.type === "song") {
      scheduleDjArrangement(deckId);
      return;
    }
    if (!source || source.type === "audio") return;
    const now = state.audioContext.currentTime;
    const tickDuration = getSchedulerTickDuration() / getDjRate(deck);
    while (deck.nextStepTime < now + 0.12) {
      const bounds = getDjLoopStepBounds(deck, source);
      let clockStep = deck.stepIndex;
      if (bounds && (clockStep < bounds.start || clockStep >= bounds.end)) {
        clockStep = deck.reverse ? bounds.end - 1 : bounds.start;
        deck.stepIndex = clockStep;
      }
      if (source.type === "pattern") {
        const pattern = source.item;
        getGridEventsForTick(pattern, clockStep).forEach(({ step, tickOffset }) => {
          const eventTime = deck.nextStepTime + tickOffset * tickDuration;
          const eventStep = step % getGridStepCount(pattern);
          const hasSolo = state.tracks.some((track) => track.solo);
          getPatternTrackIds(pattern).forEach((trackId) => {
            const track = state.tracks.find((item) => item.id === trackId);
            if (!track || !pattern.cells?.[trackId]?.[eventStep] ||
              track.muted || (hasSolo && !track.solo) ||
              Array.isArray(pattern.stepPianoNotes?.[trackId])) return;
            const variant = pattern.variants?.[trackId] || "classic";
            triggerTrack(track, getTrackStepTime(track, eventStep, pattern, eventTime),
              eventStep, variant, getNoteDuration(pattern) / getDjRate(deck), track, deck.eqLowNode);
          });
        });
        Object.entries(source.item.stepPianoNotes || {}).forEach(([trackId, notes]) => {
          const track = state.tracks.find((item) => item.id === trackId);
          if (!track || !Array.isArray(notes)) return;
          notes.filter((note) => Math.floor(note.startTick) === clockStep).forEach((note) => {
            playPianoNote(track, deck.nextStepTime, note.midi,
              note.durationTicks * tickDuration, note.velocity ?? 0.8,
              track, deck.eqLowNode, note);
          });
        });
      } else {
        const mel = source.item;
        const instrument = getPianoTrack(mel.instrumentId);
        if (instrument) {
          mel.notes.filter((note) => Math.floor(note.startTick) === clockStep).forEach((note) => {
            playPianoNote(instrument, deck.nextStepTime, note.midi,
              note.durationTicks * tickDuration, note.velocity ?? 0.8,
              instrument, deck.eqLowNode, note);
          });
        }
      }
      deck.stepIndex = getDjNextStep(deck, source, clockStep);
      deck.nextStepTime += tickDuration;
    }
  }

  function getDjBeatPhase(deck) {
    const source = getDjSource(deck.sourceKey);
    if (!source) return 0;
    if (source.type === "audio") {
      const deckId = DJ_DECK_IDS.find((id) => djState.decks[id] === deck);
      const timeline = deckId ? getDjTimelineData(deckId) : null;
      if (!timeline?.loopSeconds) return 0;
      const loopPosition = getDjVisualPosition(deck) % timeline.loopSeconds;
      const sourcePosition = timeline.offset + (deck.reverse
        ? timeline.loopSeconds - loopPosition
        : loopPosition);
      const bpm = getDjSourceMetadata(source).bpm || state.bpm;
      return ((sourcePosition * bpm / 60) % 1 + 1) % 1;
    }
    const cycleTicks = getDjCycleTicks(source);
    if (!cycleTicks) return 0;
    const progress = getDjVisualPosition(deck) % cycleTicks;
    const contentPosition = deck.reverse ? cycleTicks - 1 - progress : progress;
    return ((contentPosition / 8) % 1 + 1) % 1;
  }

  function getDjNextBeatTime(other, otherBpm, now) {
    if (other.playing) {
      const untilBeat = (1 - getDjBeatPhase(other)) % 1;
      return Math.max(now + 0.04, now + untilBeat * 60 / otherBpm);
    }
    const beatDuration = 60 / otherBpm;
    return Math.ceil((now + 0.02) / beatDuration) * beatDuration;
  }

  function resyncDjAudio(deck, source, deckId, deltaBeats, now) {
    const timeline = getDjTimelineData(deckId);
    const clip = timeline?.clip;
    if (!clip?.buffer || !timeline.loopSeconds || !state.audioContext) return;
    const bpm = getDjSourceMetadata(source).bpm || state.bpm;
    const progressAdjustment = deltaBeats * (deck.reverse ? -1 : 1) * 60 / bpm;
    const rawPosition = getDjVisualPosition(deck) + progressAdjustment;
    const position = getDjLoopContentPosition(deck,
      ((rawPosition % timeline.loopSeconds) + timeline.loopSeconds) % timeline.loopSeconds);
    const buffer = deck.reverse ? getReversedDjBuffer(clip.buffer) : clip.buffer;
    const loopStart = deck.reverse
      ? clip.buffer.duration - (timeline.offset + timeline.loopSeconds)
      : timeline.offset;
    const player = state.audioContext.createBufferSource();
    player.buffer = buffer;
    player.loop = true;
    player.loopStart = loopStart + (deck.loop?.contentStart || 0);
    player.loopEnd = loopStart + (deck.loop?.contentEnd ?? timeline.loopSeconds);
    player.playbackRate.value = getDjRate(deck);
    player.connect(deck.eqLowNode);
    player.onended = () => {
      if (deck.audioSource === player) deck.audioSource = null;
      player.disconnect();
    };
    const startTime = now + 0.04;
    player.start(startTime, player.loopStart + (deck.loop ? position - deck.loop.contentStart : position));
    if (deck.audioSource) {
      const previousSource = deck.audioSource;
      previousSource.onended = () => previousSource.disconnect();
      previousSource.stop(startTime);
    }
    deck.audioSource = player;
    deck.audioRateFrom = getDjRate(deck);
    deck.audioRateTarget = deck.audioRateFrom;
    deck.audioRateStartTime = startTime;
    deck.audioRateTimeConstant = 0;
    deck.visualStartTime = startTime;
    deck.visualStartPosition = position;
    deck.visualPosition = position;
    startDjVisualSegment(deck, startTime, position);
  }

  function resyncDjTimeline(deck, source, deckId, deltaBeats, now) {
    const cycleTicks = getDjCycleTicks(source);
    if (!cycleTicks || !state.audioContext) return;
    const progress = getDjVisualPosition(deck);
    const contentPosition = deck.reverse
      ? cycleTicks - 1 - (progress % cycleTicks)
      : progress % cycleTicks;
    const correctedContentPosition = ((contentPosition + deltaBeats * 8) % cycleTicks + cycleTicks) % cycleTicks;

    if (source.type === "song") {
      const positionBar = Math.max(0, Math.min(deck.songDurationBars,
        getDjLoopContentPosition(deck, correctedContentPosition) / PIANO_TICKS_PER_BAR));
      const startTime = now + 0.04;
      deck.songPositionBar = positionBar;
      deck.songAnchorTime = startTime;
      deck.songRate = getDjRate(deck);
      deck.songEndTime = getDjSongTimeForBar(deck, deck.songDurationBars);
      deck.visualStartTime = startTime;
      deck.visualStartPosition = positionBar * PIANO_TICKS_PER_BAR;
      deck.visualPosition = deck.visualStartPosition;
      startDjVisualSegment(deck, startTime, deck.visualStartPosition);
      deck.songSources.forEach((player) => {
        player.onended = () => {
          deck.songSources.delete(player);
          player.disconnect();
        };
        try { player.stop(startTime); } catch { /* A scheduled source may already have stopped. */ }
      });
      deck.songEvents.clear();
      window.setTimeout(() => {
        if (deck.playing) scheduleDjDeck(deckId);
      }, 45);
      return;
    }

    deck.stepIndex = ((deck.stepIndex + Math.round(deltaBeats * 8)) % cycleTicks + cycleTicks) % cycleTicks;
    deck.nextStepTime = Math.max(now + 0.04, deck.nextStepTime);
    deck.visualStartTime = now;
    deck.visualStartPosition = deck.reverse
      ? ((cycleTicks - 1 - correctedContentPosition) % cycleTicks + cycleTicks) % cycleTicks
      : correctedContentPosition;
    deck.visualPosition = deck.visualStartPosition;
    startDjVisualSegment(deck, now, deck.visualStartPosition);
  }

  function syncDjDeck(deckId) {
    const deck = djState.decks[deckId];
    const otherId = deckId === "A" ? "B" : "A";
    const other = djState.decks[otherId];
    const source = getDjSource(deck.sourceKey);
    const otherSource = getDjSource(other.sourceKey);
    if (!source) {
      showToast("Choose a live source for this deck first.");
      return;
    }
    const now = state.audioContext?.currentTime || 0;
    const otherBpm = otherSource ? getDjSyncTempo(otherSource, other) : state.bpm;
    const otherPhase = other.playing ? getDjBeatPhase(other) : 0;
    const targetPhase = deck.playing ? getDjBeatPhase(deck) : 0;
    let deltaBeats = otherPhase - targetPhase;
    deltaBeats = ((deltaBeats + 0.5) % 1 + 1) % 1 - 0.5;

    if (deck.nudgeTimer !== null) window.clearTimeout(deck.nudgeTimer);
    deck.nudgeTimer = null;
    const baseBpm = getDjSourceMetadata(source).bpm || state.bpm;
    const manualRate = (1 + deck.pitch / 100) * (deck.scratchRate || 1);
    updateDjAudioRate(deck, () => {
      deck.nudgeRate = 1;
      deck.syncRate = Math.max(0.25, Math.min(4, otherBpm / (baseBpm * manualRate)));
    });
    if (source.type === "song") updateDjSongRate(deck);

    if (deck.playing) {
      if (source.type === "audio") resyncDjAudio(deck, source, deckId, deltaBeats, now);
      else resyncDjTimeline(deck, source, deckId, deltaBeats, now);
      deck.syncedStartTime = 0;
    } else {
      const cycleTicks = getDjCycleTicks(source);
      if (cycleTicks) deck.pendingStepIndex = deck.reverse ? cycleTicks - 1 : 0;
      deck.resumeContentPosition = null;
      deck.resumeArrangementBar = null;
      deck.pausedViewStartBar = null;
      deck.syncedStartTime = getDjNextBeatTime(other, otherBpm, now);
    }
    updateDjDeckUI(deckId);
    saveDjState();
    showToast(`Deck ${deckId} synced${otherSource ? ` to Deck ${otherId}` : " to the next beat"}.`);
  }

  function nudgeDjDeck(deckId, direction) {
    const deck = djState.decks[deckId];
    if (getDjSource(deck.sourceKey)?.type === "song" && deck.playing && state.audioContext) {
      deck.nudgeRate = direction > 0 ? 1.02 : 0.98;
      updateDjSongRate(deck);
      if (deck.nudgeTimer !== null) window.clearTimeout(deck.nudgeTimer);
      deck.nudgeTimer = window.setTimeout(() => {
        deck.nudgeRate = 1;
        updateDjSongRate(deck);
        deck.nudgeTimer = null;
      }, 250);
    } else if (deck.audioSource && state.audioContext) {
      updateDjAudioRate(deck, () => {
        deck.nudgeRate = direction > 0 ? 1.02 : 0.98;
      }, 0.01);
      if (deck.nudgeTimer !== null) window.clearTimeout(deck.nudgeTimer);
      deck.nudgeTimer = window.setTimeout(() => {
        updateDjAudioRate(deck, () => { deck.nudgeRate = 1; }, 0.04);
        deck.nudgeTimer = null;
      }, 250);
    } else if (deck.timerId !== null) {
      deck.nextStepTime -= direction * getSchedulerTickDuration() / getDjRate(deck);
      const now = state.audioContext.currentTime;
      const currentTick = getDjVisualPosition(deck);
      deck.visualStartPosition = Math.max(0, currentTick + direction);
      deck.visualPosition = deck.visualStartPosition;
      deck.visualStartTime = now;
      startDjVisualSegment(deck, now, deck.visualStartPosition);
    }
  }

  function assignDjLiveSlot(index, sourceKey) {
    if (!Number.isInteger(index) || index < 0 || index >= djState.liveSlots.length) return;
    const source = getDjSource(sourceKey);
    if (!source) {
      showToast("Choose a valid source for this cue slot.");
      return;
    }
    djState.liveSlots[index] = { sourceKey, name: source.name };
    djOpenLiveSlot = null;
    saveDjState();
    renderDjView();
  }

  function openDjLiveSlotPicker(index) {
    djOpenLiveSlot = index;
    renderDjView();
    const picker = $(`#dj-live-slots [data-slot-picker="${index}"]`);
    if (typeof picker?.showPicker === "function") picker.showPicker();
    else picker?.focus();
  }

  function activateDjLiveSlot(index) {
    if (djState.liveSlots[index]) loadDjLiveSlot(index);
    else openDjLiveSlotPicker(index);
  }

  function addDjLiveSlot(deckId) {
    const sourceKey = djState.decks[deckId].sourceKey;
    if (!getDjSource(sourceKey)) {
      showToast("Choose a live source before adding it to a cue slot.");
      return;
    }
    const index = djState.liveSlots.findIndex((slot) => !slot);
    if (index < 0) {
      showToast("All cue slots are full.");
      return;
    }
    assignDjLiveSlot(index, sourceKey);
  }

  function loadDjLiveSlot(index) {
    const slot = djState.liveSlots[index];
    if (!slot) return;
    djOpenLiveSlot = null;
    const deckId = djState.activeDeck;
    stopDjDeck(deckId);
    djState.decks[deckId].sourceKey = slot.sourceKey;
    djState.decks[deckId].loop = null;
    djState.decks[deckId].syncRate = 1;
    djState.decks[deckId].resumeContentPosition = null;
    djState.decks[deckId].resumeArrangementBar = null;
    djState.decks[deckId].pausedViewStartBar = null;
    djState.decks[deckId].visualStartTime = null;
    djState.decks[deckId].visualStopTime = null;
    djState.decks[deckId].visualStartPosition = 0;
    djState.decks[deckId].visualPosition = 0;
    djState.decks[deckId].visualSegments = [];
    saveDjState();
    renderDjView();
    startDjDeck(deckId);
  }

  async function playDjPad(index) {
    try {
      await ensureAudio();
      const deck = djState.decks[djState.activeDeck];
      ensureDjDeckAudio(deck);
      const source = getDjSource(deck.sourceKey);
      const patternTrackIds = source?.type === "pattern" ? getPatternTrackIds(source.item) : [];
      const track = state.tracks.find((item) => patternTrackIds.includes(item.id) && item.kind === "drumkit") ||
        state.tracks.find((item) => item.kind === "drumkit");
      if (!track) {
        showToast("Add a drum-kit instrument track to use the DJ pads.");
        return;
      }
      playPianoNote(track, state.audioContext.currentTime + 0.01, DJ_PAD_NOTES[index],
        getStepDuration(), 0.85, track, deck.eqLowNode);
    } catch (error) {
      showToast(error.message || "DJ drum pad could not play.");
    }
  }

  function getDjKnobInputId(knob, deckId) {
    if (deckId) {
      const suffix = deckId.toLowerCase();
      return {
        filter: `dj-filter-${suffix}`,
        low: `dj-eq-low-${suffix}`,
        mid: `dj-eq-mid-${suffix}`,
        high: `dj-eq-high-${suffix}`,
        volume: `dj-volume-${suffix}`,
      }[knob];
    }
    return {
      filter: "dj-master-filter",
      low: "dj-master-low",
      mid: "dj-master-mid",
      high: "dj-master-high",
      volume: "dj-master-volume",
    }[knob];
  }

  function adjustDjKnobFromKeyboard(knobKey, direction, deckId) {
    const input = $(`#${getDjKnobInputId(DJ_KNOB_KEYS[knobKey], deckId)}`);
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const step = Number(input.step) || 1;
    const value = Math.max(min, Math.min(max, Number(input.value) + direction * step));
    if (value === Number(input.value)) return;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function handleDjKeyup(event) {
    if (event.code === "KeyL") {
      djHeldKeys.delete("KeyL");
      if (djLoopKeyPending) {
        djLoopKeyPending = false;
        toggleDjLoop(djState.activeDeck);
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    if (event.code === "KeyM") {
      djHeldKeys.delete("KeyM");
      if (djMuteKeyPending) {
        djMuteKeyPending = false;
        toggleDjMasterMute();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    const isDeckSelector = event.code === "BracketLeft" || event.code === "BracketRight";
    const djControlFocused = event.target instanceof Element &&
      event.target.closest("input, select, textarea, [contenteditable='true']");
    const shouldToggleDeck = isDeckSelector && djViewExpanded && state.view === "dj" &&
      djHeldKeys.has(event.code) && !djDeckChordUsed.has(event.code) &&
      !djControlFocused && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey &&
      !$("#help-dialog").open && !$("#project-dialog").open &&
      !$("#source-browser-dialog").open && !$("#step-instrument-dialog").open &&
      !$("#step-track-mix-dialog").open;
    djHeldKeys.delete(event.code);
    const chordUsed = djDeckChordUsed.has(event.code);
    djDeckChordUsed.delete(event.code);
    if (shouldToggleDeck) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const deckId = event.code === "BracketLeft" ? "A" : "B";
      setActiveDjDeck(deckId);
      toggleDjDeck(deckId);
    } else if (chordUsed) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function handleDjKeydown(event) {
    if (state.view !== "dj") return;
    djHeldKeys.add(event.code);
    if (djViewExpanded) {
      if ((event.code === "BracketLeft" || event.code === "BracketRight") &&
        (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
        djDeckChordUsed.add(event.code);
      }
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      const knobKeyHeld = Object.keys(DJ_KNOB_KEYS).some((code) => djHeldKeys.has(code));
      if (selectors.length > 1 || (selectors.length && (knobKeyHeld || djHeldKeys.has("Space")))) {
        selectors.forEach((code) => djDeckChordUsed.add(code));
      }
    }
    const dialogOpen = $("#help-dialog").open || $("#project-dialog").open || $("#source-browser-dialog").open ||
      $("#step-instrument-dialog").open || $("#step-track-mix-dialog").open;
    const djControlFocused = event.target instanceof Element &&
      event.target.closest("input, select, textarea, [contenteditable='true']");
    const djShortcutAllowed = djViewExpanded && !dialogOpen && !djControlFocused &&
      !state.workspaceHidden && !event.ctrlKey && !event.altKey && !event.metaKey;
    const muteShortcutAllowed = djShortcutAllowed;
    if (muteShortcutAllowed && event.code === "KeyM") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      if (selectors.length === 1) {
        const deckId = selectors[0] === "BracketLeft" ? "A" : "B";
        djDeckChordUsed.add(selectors[0]);
        toggleDjDeckMute(deckId);
      } else {
        selectors.forEach((code) => djDeckChordUsed.add(code));
        djMuteKeyPending = true;
      }
      return;
    }
    if (muteShortcutAllowed && ["BracketLeft", "BracketRight"].includes(event.code) &&
      djHeldKeys.has("KeyM") && djMuteKeyPending) {
      const deckId = event.code === "BracketLeft" ? "A" : "B";
      djDeckChordUsed.add(event.code);
      djMuteKeyPending = false;
      toggleDjDeckMute(deckId);
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (djShortcutAllowed && ["BracketLeft", "BracketRight"].includes(event.code) &&
      djHeldKeys.has("KeyL") && djLoopKeyPending) {
      const deckId = event.code === "BracketLeft" ? "A" : "B";
      djDeckChordUsed.add(event.code);
      djLoopKeyPending = false;
      toggleDjLoop(deckId);
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (djShortcutAllowed && event.code === "KeyL") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      if (selectors.length === 1) {
        const deckId = selectors[0] === "BracketLeft" ? "A" : "B";
        djDeckChordUsed.add(selectors[0]);
        toggleDjLoop(deckId);
      } else if (selectors.length > 1) {
        selectors.forEach((code) => djDeckChordUsed.add(code));
      } else {
        djLoopKeyPending = true;
      }
      return;
    }
    if (djShortcutAllowed && (event.code === "Equal" || event.code === "Minus")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      if (selectors.length <= 1) {
        const deckId = selectors[0] === "BracketLeft" ? "A"
          : selectors[0] === "BracketRight" ? "B"
            : djState.activeDeck;
        selectors.forEach((code) => djDeckChordUsed.add(code));
        resizeDjLoop(deckId, event.code === "Equal" ? 1 : -1);
      } else {
        selectors.forEach((code) => djDeckChordUsed.add(code));
      }
      return;
    }
    if (event.target === $("#dj-arrangement-ruler") && !event.ctrlKey && !event.altKey && !event.metaKey) {
      let nextBar = getDjArrangementPositionBar();
      if (event.key === "ArrowLeft") nextBar -= event.shiftKey ? 1 : 0.25;
      else if (event.key === "ArrowRight") nextBar += event.shiftKey ? 1 : 0.25;
      else if (event.key === "Home") nextBar = 0;
      else if (event.key === "End") nextBar = MAX_ARRANGEMENT_BARS;
      else nextBar = null;
      if (nextBar !== null) {
        seekDjArrangementToBar(nextBar);
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    if (djViewExpanded && !dialogOpen && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey &&
      (event.code === "ArrowUp" || event.code === "ArrowDown")) {
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      const knobKeys = Object.keys(DJ_KNOB_KEYS).filter((code) => djHeldKeys.has(code));
      if (selectors.length <= 1 && knobKeys.length === 1) {
        const deckId = selectors[0] === "BracketLeft" ? "A" : selectors[0] === "BracketRight" ? "B" : null;
        selectors.forEach((code) => djDeckChordUsed.add(code));
        adjustDjKnobFromKeyboard(knobKeys[0], event.code === "ArrowUp" ? 1 : -1, deckId);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (djViewExpanded && !dialogOpen && DJ_KNOB_KEYS[event.code] &&
      !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (djViewExpanded && event.code === "Escape" && !dialogOpen && !djControlFocused) {
      event.preventDefault();
      setDjViewExpanded(false);
      return;
    }
    if (event.code === "Space") {
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      if (dialogOpen || (djControlFocused && !selectors.length &&
        !(event.ctrlKey || event.altKey || event.metaKey))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (selectors.length) {
        selectors.forEach((code) => djDeckChordUsed.add(code));
        if (selectors.length === 1) {
          const deckId = selectors[0] === "BracketLeft" ? "A" : "B";
          setActiveDjDeck(deckId);
          toggleDjDeck(deckId);
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.altKey) return;
      if (event.altKey) toggleDjDeck("B");
      else if (event.ctrlKey || event.metaKey) toggleDjDeck("A");
      else toggleDjDeckGroup(DJ_DECK_IDS);
      return;
    }
    if (state.workspaceHidden || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest("input, select, textarea, [contenteditable='true']")) return;
    const padIndex = DJ_PAD_KEYS.indexOf(event.code);
    const slotIndex = /^F[1-8]$/.test(event.code) ? Number(event.code.slice(1)) - 1 : -1;
    let handled = true;
    if (padIndex >= 0) {
      if (!event.repeat) playDjPad(padIndex);
    } else if (slotIndex >= 0) {
      if (!event.repeat) activateDjLiveSlot(slotIndex);
    } else if (event.code === "BracketLeft") {
      if (!djViewExpanded) setActiveDjDeck("A");
    } else if (event.code === "BracketRight") {
      if (!djViewExpanded) setActiveDjDeck("B");
    } else if (event.code === "KeyY") {
      if (!event.repeat) syncDjDeck(djState.activeDeck);
    } else if (event.code === "Comma") {
      nudgeDjDeck(djState.activeDeck, -1);
    } else if (event.code === "Period") {
      nudgeDjDeck(djState.activeDeck, 1);
    } else if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      djState.crossfader = Math.max(0, Math.min(100, djState.crossfader + (event.code === "ArrowLeft" ? -3 : 3)));
      $("#dj-crossfader").value = String(djState.crossfader);
      applyDjMixer();
      saveDjState();
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function bindDjEvents() {
    $("#dj-arrangement-scroll").addEventListener("input", (event) => {
      djState.arrangementViewStartBar = Math.max(-DJ_ARRANGEMENT_BARS / 2,
        Math.min(DJ_MAX_CENTERED_OFFSET_BARS, Number(event.target.value)));
      DJ_DECK_IDS.forEach((deckId) => {
        const deck = djState.decks[deckId];
        if (!deck.playing && Number.isFinite(deck.resumeArrangementBar)) {
          deck.pausedViewStartBar = djState.arrangementViewStartBar;
        }
      });
      renderDjLiveView();
    });
    $("#dj-arrangement-scroll").addEventListener("change", saveDjState);
    const ruler = $("#dj-arrangement-ruler");
    let seekPointerId = null;
    let resumeAfterSeek = [];
    const getSeekBar = (event) => {
      const bounds = ruler.getBoundingClientRect();
      const timelineWidth = Math.max(1, bounds.width - 16);
      const x = Math.max(0, Math.min(timelineWidth, event.clientX - bounds.left - 8));
      return djState.arrangementViewStartBar + x / timelineWidth * DJ_ARRANGEMENT_BARS;
    };
    const updateSeek = (event) => setDjArrangementPositionBar(getSeekBar(event));
    ruler.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      seekPointerId = event.pointerId;
      resumeAfterSeek = DJ_DECK_IDS.filter((deckId) => djState.decks[deckId].playing);
      resumeAfterSeek.forEach(stopDjDeck);
      ruler.setPointerCapture(seekPointerId);
      updateSeek(event);
      event.preventDefault();
    });
    ruler.addEventListener("pointermove", (event) => {
      if (event.pointerId === seekPointerId) updateSeek(event);
    });
    const finishSeek = (event) => {
      if (event.pointerId !== seekPointerId) return;
      updateSeek(event);
      seekPointerId = null;
      resumeAfterSeek.forEach(startDjDeck);
      resumeAfterSeek = [];
      ruler.focus();
    };
    ruler.addEventListener("pointerup", finishSeek);
    ruler.addEventListener("pointercancel", finishSeek);
    document.querySelectorAll(".dj-live-waveform-row").forEach((row) => {
      const deckId = row.dataset.deck;
      if (!DJ_DECK_IDS.includes(deckId)) return;
      let pointerId = null;
      let dragStartX = 0;
      let dragStartOffset = 0;

      row.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        const deck = djState.decks[deckId];
        pointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartOffset = deck.startOffsetBars;
        row.setPointerCapture(pointerId);
        row.classList.add("is-dragging");
        setActiveDjDeck(deckId);
        event.preventDefault();
      });
      row.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) return;
        const deck = djState.decks[deckId];
        const canvas = row.querySelector("canvas");
        const width = Math.max(1, canvas?.getBoundingClientRect().width || row.getBoundingClientRect().width);
        const offset = dragStartOffset +
          (event.clientX - dragStartX) / width * DJ_ARRANGEMENT_BARS;
        const now = state.audioContext?.currentTime || 0;
        const arrangementStart = Number.isFinite(djState.arrangementStartTime)
          ? djState.arrangementStartTime
          : now;
        const earliestBar = deck.playing
          ? Math.max(0, Math.ceil(((now - arrangementStart) / (240 / state.bpm)) * 4) / 4)
          : 0;
        deck.startOffsetBars = Math.min(DJ_MAX_OFFSET_BARS, Math.max(earliestBar,
          Math.min(DJ_MAX_OFFSET_BARS, Math.round(offset * 4) / 4)));
        deck.dragPreviewStartTime = arrangementStart + deck.startOffsetBars * 240 / state.bpm;
        renderDjLiveView();
      });
      const finishArrangementDrag = (event) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        row.classList.remove("is-dragging");
        const deck = djState.decks[deckId];
        const wasPlaying = deck.playing;
        if (wasPlaying) {
          stopDjDeck(deckId);
        }
        deck.resumeContentPosition = null;
        deck.resumeArrangementBar = null;
        deck.pausedViewStartBar = null;
        deck.syncedStartTime = 0;
        deck.dragPreviewStartTime = null;
        updateDjDeckUI(deckId);
        saveDjState();
        renderDjLiveView();
        if (wasPlaying) startDjDeck(deckId);
      };
      row.addEventListener("pointerup", finishArrangementDrag);
      row.addEventListener("pointercancel", finishArrangementDrag);
    });

    DJ_DECK_IDS.forEach((deckId) => {
      const suffix = deckId.toLowerCase();
      $(`#dj-deck-${suffix}`).addEventListener("click", () => setActiveDjDeck(deckId));
      $(`#dj-source-${suffix}`).addEventListener("change", (event) => {
        stopDjDeck(deckId);
        djState.decks[deckId].sourceKey = event.target.value;
        djState.decks[deckId].loop = null;
        djState.decks[deckId].syncRate = 1;
        djState.decks[deckId].resumeContentPosition = null;
        djState.decks[deckId].resumeArrangementBar = null;
        djState.decks[deckId].pausedViewStartBar = null;
        djState.decks[deckId].pendingStepIndex = 0;
        djState.decks[deckId].syncedStartTime = 0;
        djState.decks[deckId].visualStartTime = null;
        djState.decks[deckId].visualStopTime = null;
        djState.decks[deckId].visualStartPosition = 0;
        djState.decks[deckId].visualPosition = 0;
        djState.decks[deckId].visualSegments = [];
        setActiveDjDeck(deckId);
        saveDjState();
        renderDjLiveView();
      });
      $(`#dj-play-${suffix}`).addEventListener("click", () => {
        setActiveDjDeck(deckId);
        toggleDjDeck(deckId);
      });
      $(`#dj-sync-${suffix}`).addEventListener("click", () => syncDjDeck(deckId));
      $(`#dj-focus-${suffix}`).addEventListener("click", () => setActiveDjDeck(deckId));
      bindDjDial(`dj-volume-${suffix}`, "volume", (value) => {
        djState.decks[deckId].volume = value / 100;
        applyDjMixer();
      });
      bindDjDial(`dj-filter-${suffix}`, "frequency", (value) => {
        djState.decks[deckId].filter = value;
        applyDjMixer();
      });
      bindDjDial(`dj-eq-low-${suffix}`, "eq", (value) => {
        djState.decks[deckId].eqLow = value;
        applyDjMixer();
      });
      bindDjDial(`dj-eq-mid-${suffix}`, "eq", (value) => {
        djState.decks[deckId].eqMid = value;
        applyDjMixer();
      });
      bindDjDial(`dj-eq-high-${suffix}`, "eq", (value) => {
        djState.decks[deckId].eqHigh = value;
        applyDjMixer();
      });
      $(`#dj-pitch-${suffix}`).addEventListener("input", (event) => {
        const deck = djState.decks[deckId];
        updateDjAudioRate(deck, () => { deck.pitch = Number(event.target.value); });
        updateDjSongRate(deck);
        updateDjDeckUI(deckId);
      });
      $(`#dj-pitch-${suffix}`).addEventListener("change", saveDjState);
    });
    bindDjDial("dj-master-volume", "volume", (value) => {
      djState.masterVolume = value / 100;
      applyDjMixer();
    });
    bindDjDial("dj-master-low", "eq", (value) => {
      djState.masterLow = value;
      applyDjMixer();
    });
    bindDjDial("dj-master-mid", "eq", (value) => {
      djState.masterMid = value;
      applyDjMixer();
    });
    bindDjDial("dj-master-high", "eq", (value) => {
      djState.masterHigh = value;
      applyDjMixer();
    });
    bindDjDial("dj-master-filter", "frequency", (value) => {
      djState.masterFilter = value;
      applyDjMixer();

      const platter = $(`#dj-platter-${suffix}`);
      platter.addEventListener("focus", () => setActiveDjDeck(deckId));
      platter.addEventListener("click", (event) => {
        if (event.detail === 0) toggleDjDeck(deckId);
      });
      platter.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || !djState.decks[deckId].playing) return;
        event.preventDefault();
        setActiveDjDeck(deckId);
        const bounds = platter.getBoundingClientRect();
        const angle = Math.atan2(event.clientY - bounds.top - bounds.height / 2,
          event.clientX - bounds.left - bounds.width / 2);
        const deck = djState.decks[deckId];
        deck.isScratching = true;
        deck.scratchPointerId = event.pointerId;
        deck.scratchLastAngle = angle;
        deck.scratchRate = 1;
        platter.setPointerCapture(event.pointerId);
        updateDjDeckUI(deckId);
      });
      platter.addEventListener("pointermove", (event) => {
        const deck = djState.decks[deckId];
        if (!deck.isScratching || deck.scratchPointerId !== event.pointerId) return;
        const bounds = platter.getBoundingClientRect();
        const angle = Math.atan2(event.clientY - bounds.top - bounds.height / 2,
          event.clientX - bounds.left - bounds.width / 2);
        let delta = angle - deck.scratchLastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        else if (delta < -Math.PI) delta += Math.PI * 2;
        deck.scratchLastAngle = angle;
        updateDjAudioRate(deck, () => {
          deck.scratchRate = Math.max(0.25, Math.min(2.5, 1 + delta * 1.5));
        }, 0.005);
        updateDjSongRate(deck);
        updateDjDeckUI(deckId);
      });
      const finishScratch = (event) => {
        const deck = djState.decks[deckId];
        if (!deck.isScratching || deck.scratchPointerId !== event.pointerId) return;
        deck.isScratching = false;
        deck.scratchPointerId = null;
        updateDjAudioRate(deck, () => { deck.scratchRate = 1; }, 0.04);
        updateDjSongRate(deck);
        updateDjDeckUI(deckId);
      };
      platter.addEventListener("pointerup", finishScratch);
      platter.addEventListener("pointercancel", finishScratch);
      $(`#dj-reverse-${suffix}`).addEventListener("click", () => toggleDjReverse(deckId));
    });
    document.querySelectorAll(".dj-nudge").forEach((button) => {
      button.addEventListener("click", () => nudgeDjDeck(button.dataset.deck, Number(button.dataset.direction)));
    });
    document.querySelectorAll(".dj-add-slot").forEach((button) => {
      button.addEventListener("click", () => addDjLiveSlot(button.dataset.deck));
    });
    $("#dj-crossfader").addEventListener("input", (event) => {
      djState.crossfader = Number(event.target.value);
      applyDjMixer();
    });
    $("#dj-crossfader").addEventListener("change", saveDjState);
    $("#dj-live-slots").addEventListener("click", (event) => {
      const clearButton = event.target.closest("[data-clear-slot]");
      if (clearButton) {
        djState.liveSlots[Number(clearButton.dataset.clearSlot)] = null;
        saveDjState();
        renderDjView();
        return;
      }
      if (event.target.closest("[data-slot-picker]")) return;
      const slotButton = event.target.closest("[data-slot]");
      if (slotButton) activateDjLiveSlot(Number(slotButton.dataset.slot));
    });
    $("#dj-live-slots").addEventListener("change", (event) => {
      const picker = event.target.closest("[data-slot-picker]");
      if (picker?.value) assignDjLiveSlot(Number(picker.dataset.slotPicker), picker.value);
    });
    $("#dj-pad-grid").addEventListener("click", (event) => {
      const pad = event.target.closest("[data-pad]");
      if (pad) playDjPad(Number(pad.dataset.pad));
    });
    document.addEventListener("click", (event) => {
      if (djOpenLiveSlot === null ||
        (event.target instanceof Element && event.target.closest("#dj-live-slots"))) return;
      djOpenLiveSlot = null;
      renderDjView();
    });
    document.addEventListener("keydown", handleDjKeydown, true);
    document.addEventListener("keyup", handleDjKeyup, true);
    window.addEventListener("blur", () => {
      djHeldKeys.clear();
      djDeckChordUsed.clear();
      djMuteKeyPending = false;
      djLoopKeyPending = false;
    });
  }

  function getTrackStepTime(track, step, pattern, time) {
    const ticksPerStep = getGridTicksPerStep(pattern);
    const isSwingStep = ticksPerStep === 1
      ? Math.floor(step / 2) % 2 === 1
      : ticksPerStep <= 4 && step % 2 === 1;
    const swingAmount = Number.isFinite(track.swing) ? track.swing : state.swing;
    const swingDelta = swingAmount - (ticksPerStep <= 2 ? state.swing : 0);
    return time + (isSwingStep ? getStepDuration() * swingDelta / 100 : 0);
  }

  function getPatternSourceGain(patternTrack, sourceTrack) {
    ensureTrackAudio(patternTrack);
    patternTrack.sourceGains ||= new Map();
    let gain = patternTrack.sourceGains.get(sourceTrack.id);
    if (!gain) {
      gain = state.audioContext.createGain();
      gain.connect(patternTrack.gainNode);
      patternTrack.sourceGains.set(sourceTrack.id, gain);
    }
    gain.gain.setTargetAtTime(sourceTrack.volume, state.audioContext.currentTime, 0.015);
    return gain;
  }

  function schedulePatternPianoNotes(pattern, tick, time, outputTrack = null) {
    const patternTrackIds = new Set(getPatternTrackIds(pattern));
    const hasSolo = state.tracks.some((track) => track.solo);
    Object.entries(pattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
      if (!patternTrackIds.has(trackId) || !Array.isArray(notes)) return;
      const track = state.tracks.find((item) => item.id === trackId);
      if (!track || track.muted || (hasSolo && !track.solo)) return;
      notes.filter((note) => note.startTick >= tick && note.startTick < tick + 1).forEach((note) => {
        const destination = outputTrack && outputTrack !== track ? outputTrack : track;
        const outputNode = destination !== track ? getPatternSourceGain(destination, track) : null;
        const noteTime = time + (note.startTick - tick) * getSchedulerTickDuration() +
          (Math.floor(note.startTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
        playPianoNote(track, noteTime, note.midi,
          note.durationTicks * getSchedulerTickDuration(), note.velocity ?? 0.8, destination, outputNode, note);
      });
    });
  }

  function scheduleStep(step, time, pattern = null, loopIndex = null, updatePlayhead = true, highlightPlayer = null, outputTrack = null) {
    const activeTracks = pattern
      ? state.tracks.filter((track) => getPatternTrackIds(pattern).includes(track.id))
      : state.tracks;
    const hasSolo = state.tracks.some((track) => track.solo);
    activeTracks.forEach((track) => {
      const cells = pattern ? pattern.cells?.[track.id] || [] : track.cells;
      const variant = pattern ? pattern.variants?.[track.id] || "classic" : track.variant;
      if (cells[step] && !Array.isArray(pattern?.stepPianoNotes?.[track.id]) &&
        !track.muted && (!hasSolo || track.solo)) {
        if (pattern && loopIndex !== null &&
          state.liveRecordedHits.delete(`${pattern.id}:${loopIndex}:${track.id}:${step}`)) return;
        const gridPattern = pattern || getPattern();
        const trackTime = getTrackStepTime(track, step, gridPattern, time);
        const outputNode = outputTrack && outputTrack !== track ? getPatternSourceGain(outputTrack, track) : null;
        triggerTrack(track, trackTime, step, variant, getNoteDuration(gridPattern), outputTrack || track, outputNode);
      }
    });
    if (!updatePlayhead && !highlightPlayer) return;
    const playheadTimers = highlightPlayer?.playheadTimers || state.stepTimers;
    const displayDelay = Math.max(0, (time - state.audioContext.currentTime) * 1000);
    const timerId = window.setTimeout(() => {
      playheadTimers.delete(timerId);
      if (highlightPlayer
        ? state.workspacePlayers.sequencer === highlightPlayer && !(state.isPlaying && state.view === "sequencer")
        : state.isPlaying) setPlayhead(step);
    }, displayDelay);
    playheadTimers.add(timerId);
  }

  function scheduler() {
    const arrangementPlayback = state.playbackMode === "arrangement";
    const sequencerPlayback = state.playbackMode === "sequencer";
    const pianoLoopPlayback = state.playbackMode === "piano-roll";
    if (arrangementPlayback && state.isPlaying) {
      if (state.audioContext.currentTime >= state.playbackEndTime) {
        if (state.arrangementLoopEnabled) {
          while (state.audioContext.currentTime >= state.playbackEndTime) advanceArrangementLoop();
        } else {
          stopPlayback();
          return;
        }
      }
      const elapsed = Math.max(0, state.audioContext.currentTime - state.playbackStartTime);
      state.arrangementCursor = Math.min(state.arrangementBars, state.playbackStartBar + elapsed / (240 / state.bpm));
      updateArrangementCursorMarker();
    }
    if (pianoLoopPlayback && state.isPlaying) updatePianoCursorFromTime(state.playbackStartTime);
    const lookAhead = AUDIO_SCHEDULER_LOOKAHEAD;
    if (arrangementPlayback && state.isPlaying) {
      const now = state.audioContext.currentTime;
      scheduleArrangementPatternClips(now, lookAhead);
      if (state.arrangementLoopEnabled) scheduleUpcomingArrangementLoop(now, lookAhead);
    }
    while (
      state.nextStepTime < state.audioContext.currentTime + lookAhead &&
      (!arrangementPlayback || state.nextStepTime < state.playbackEndTime)
    ) {
      const clockStep = state.stepIndex;
      const swingOffset = Math.floor(clockStep / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0;
      if (arrangementPlayback) {
        scheduleArrangementMetronomeClick(
          state.arrangementLoopIteration, clockStep, state.nextStepTime + swingOffset,
        );
      } else if (sequencerPlayback) {
        const pattern = getPattern();
        const gridStepCount = getGridStepCount(pattern);
        const absoluteTick = Math.round((state.nextStepTime - state.playbackStartTime) / getSchedulerTickDuration());
        const patternTicks = pattern.steps * 2;
        if (absoluteTick > 0 && absoluteTick % patternTicks === 0) state.liveRecordedHits.clear();
        const loopIndex = Math.floor(absoluteTick / patternTicks);
        getGridEventsForTick(pattern, clockStep).forEach(({ step, tickOffset }) => {
          const eventTick = clockStep + tickOffset;
          const eventSwingOffset = Math.floor(eventTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0;
          const eventTime = state.nextStepTime + tickOffset * getSchedulerTickDuration();
          scheduleStep(step % gridStepCount, eventTime + eventSwingOffset, pattern, loopIndex);
        });
        schedulePatternPianoNotes(pattern, clockStep % (pattern.steps * 2), state.nextStepTime, null);
        if (state.metronome && state.recordingMetronomeTimer === null && clockStep % 8 === 0) {
          triggerClick(state.nextStepTime, clockStep % 32 === 0);
        }
      }
      state.nextStepTime += getSchedulerTickDuration();
      state.stepIndex = (clockStep + 1) % (state.steps * 2);
    }
    if (pianoLoopPlayback) scheduleCurrentMelLoop(lookAhead);
  }

  function scheduleArrangementPatternClips(now, lookAhead, notBefore = now) {
    const secondsPerBar = 240 / state.bpm;
    state.patternClips.forEach((clip) => {
      const pattern = getPattern(clip.patternId);
      if (!pattern) return;
      const stepsPerBar = getStepsPerBar(pattern);
      const sourceOffset = clip.sourceOffsetBars || 0;
      const sourceBars = pattern.steps / 16 * (clip.repeatCount || 1);
      const sourceEndStep = Math.min(sourceBars * stepsPerBar,
        Math.ceil((sourceOffset + getArrangementClipDuration("pattern", clip)) * stepsPerBar - 0.0001));
      const clipStartTime = state.playbackStartTime + (clip.startBar - state.playbackStartBar) * secondsPerBar;
      const currentSourceStep = (sourceOffset + (now - clipStartTime) / secondsPerBar) * stepsPerBar;
      const firstStep = Math.max(0, Math.ceil(sourceOffset * stepsPerBar - 0.0001), Math.floor(currentSourceStep) - 3);
      const lastStep = Math.min(sourceEndStep,
        Math.ceil((sourceOffset + (now + lookAhead - clipStartTime) / secondsPerBar) * stepsPerBar) + 4);
      const gridStepCount = getGridStepCount(pattern);
      const ticksPerGridStep = getGridTicksPerStep(pattern);
      const patternTrack = state.patterns.find((item) => item.id === (clip.trackId || clip.patternId)) || pattern;
      for (let sourceStep = firstStep; sourceStep < lastStep; sourceStep += 1) {
        const sourcePosition = sourceStep / stepsPerBar;
        const relativePosition = sourcePosition - sourceOffset;
        const patternStep = sourceStep % gridStepCount;
        const tick = patternStep * ticksPerGridStep;
        const time = clipStartTime + relativePosition * secondsPerBar +
          (Math.floor(tick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
        if (time < now || time < notBefore || time >= now + lookAhead || time >= state.playbackEndTime) continue;
        const key = `${state.arrangementLoopIteration}:${clip.id}:${sourceStep}`;
        if (state.scheduledArrangementSteps.has(key)) continue;
        scheduleArrangementVoice(() =>
          scheduleStep(patternStep, time, pattern, null, false, null, patternTrack));
        state.scheduledArrangementSteps.add(key);
      }
      const hasSolo = state.tracks.some((track) => track.solo);
      Object.entries(pattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
        const track = state.tracks.find((item) => item.id === trackId);
        if (!track || !Array.isArray(notes) || !getPatternTrackIds(pattern).includes(trackId) ||
          track.muted || (hasSolo && !track.solo)) return;
        const patternBars = pattern.steps / 16;
        const loopCount = Math.ceil(sourceBars / patternBars);
        for (let loop = 0; loop < loopCount; loop += 1) {
          notes.forEach((note) => {
            const sourcePosition = loop * patternBars + note.startTick / PIANO_TICKS_PER_BAR;
            if (sourcePosition < sourceOffset || sourcePosition >= sourceOffset + getArrangementClipDuration("pattern", clip)) return;
            const when = clipStartTime + (sourcePosition - sourceOffset) * secondsPerBar +
              (Math.floor(note.startTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
            if (when < now || when < notBefore || when >= now + lookAhead || when >= state.playbackEndTime) return;
            const key = `${state.arrangementLoopIteration}:${clip.id}:piano:${trackId}:${loop}:${note.id}`;
            if (state.scheduledArrangementSteps.has(key)) return;
            const clipEnd = (sourceOffset + getArrangementClipDuration("pattern", clip) - sourcePosition) * secondsPerBar;
            const noteDuration = Math.min(note.durationTicks * getSchedulerTickDuration(), clipEnd);
            if (noteDuration > 0) {
              scheduleArrangementVoice(() =>
                playPianoNote(track, when, note.midi, noteDuration, note.velocity ?? 0.8,
                  patternTrack, getPatternSourceGain(patternTrack, track), note));
            }
            state.scheduledArrangementSteps.add(key);
          });
        }

      });
    });
  }

  function scheduleArrangementMetronomeClick(iteration, clockStep, time) {
    if (!state.metronome || state.recordingMetronomeTimer !== null || clockStep % 8 !== 0) return;
    const key = `${iteration}:${clockStep}`;
    if (state.scheduledArrangementClicks.has(key)) return;
    scheduleArrangementVoice(() => triggerClick(time, clockStep % 32 === 0));
    state.scheduledArrangementClicks.add(key);
  }

  function scheduleUpcomingArrangementLoop(now, lookAhead) {
    const nextIteration = state.arrangementLoopIteration + 1;
    const nextStartTime = state.playbackEndTime;
    if (state.preScheduledArrangementIteration === nextIteration || now + lookAhead < nextStartTime) return;

    const { startBar, endBar } = getArrangementLoopRange();
    const previousStartTime = state.playbackStartTime;
    const previousStartBar = state.playbackStartBar;
    const previousEndTime = state.playbackEndTime;
    const previousIteration = state.arrangementLoopIteration;
    try {
      state.playbackStartTime = nextStartTime;
      state.playbackStartBar = startBar;
      state.playbackEndTime = nextStartTime + (endBar - startBar) * (240 / state.bpm);
      state.arrangementLoopIteration = nextIteration;
      state.scheduledPianoNotes.clear();
      scheduleArrangementClips(nextStartTime, startBar);
      scheduleArrangementPatternClips(now, lookAhead, nextStartTime);

      const ticksPerBar = Math.max(1, Math.round((240 / state.bpm) / getSchedulerTickDuration()));
      const loopTicks = Math.ceil((endBar - startBar) * ticksPerBar);
      for (let clockStep = 0; clockStep < loopTicks; clockStep += 8) {
        const time = nextStartTime + clockStep * getSchedulerTickDuration();
        if (time >= now && time < now + lookAhead) {
          scheduleArrangementMetronomeClick(nextIteration, clockStep, time);
        }
      }
      state.preScheduledArrangementIteration = nextIteration;
    } finally {
      state.playbackStartTime = previousStartTime;
      state.playbackStartBar = previousStartBar;
      state.playbackEndTime = previousEndTime;
      state.arrangementLoopIteration = previousIteration;
    }
  }

  function advanceArrangementLoop() {
    const { startBar, endBar } = getArrangementLoopRange();
    const nextStartTime = state.playbackEndTime;
    state.arrangementLoopIteration += 1;
    state.playbackStartTime = nextStartTime;
    state.playbackStartBar = startBar;
    state.playbackEndTime = nextStartTime + (endBar - startBar) * (240 / state.bpm);
    state.nextStepTime = nextStartTime;
    state.stepIndex = 0;
    state.arrangementCursor = startBar;
    const currentPrefix = `${state.arrangementLoopIteration}:`;
    state.scheduledArrangementSteps.forEach((key) => {
      if (!key.startsWith(currentPrefix)) state.scheduledArrangementSteps.delete(key);
    });
    state.scheduledArrangementClicks.forEach((key) => {
      if (!key.startsWith(currentPrefix)) state.scheduledArrangementClicks.delete(key);
    });
    updateArrangementCursorMarker();
  }

  function scheduleCurrentMelLoop(lookAhead) {
    const { notes, instrument, loopBars } = getPianoPlaybackSource();
    if (!notes || !instrument) return;
    const secondsPerBar = 240 / state.bpm;
    const now = state.audioContext.currentTime;
    schedulePianoMelLoopNotes(
      notes, instrument, state.playbackStartTime, now, lookAhead, state.scheduledPianoNotes,
      loopBars, state.pianoPlaybackStartTick,
    );
  }

  function schedulePianoMelLoopNotes(notes, instrument, startTime, now, lookAhead, scheduledNotes, loopBars, startTick) {
    const secondsPerBar = 240 / state.bpm;
    const totalTicks = loopBars * PIANO_TICKS_PER_BAR;
    if (!state.pianoLoopEnabled) {
      const loopSeconds = loopBars * secondsPerBar;
      const firstLoop = Math.max(0, Math.floor((now - startTime) / loopSeconds));
      notes.forEach((note) => {
        const noteOffset = note.startTick / PIANO_TICKS_PER_BAR * secondsPerBar;
        const duration = note.durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar;
        for (let loop = firstLoop; loop <= firstLoop + 1; loop += 1) {
          const key = `${note.id}:${loop}`;
          if (scheduledNotes.has(key)) continue;
          const when = startTime + loop * loopSeconds + noteOffset;
          if (when < now || when >= now + lookAhead) continue;
          playPianoNote(instrument, when, note.midi, duration, note.velocity ?? 0.8, instrument, null, note);
          scheduledNotes.add(key);
        }
      });
      return;
    }

    const { startBar, endBar } = getPianoLoopRange();
    const rangeStartTick = Math.max(0, Math.min(totalTicks - 1, startBar * PIANO_TICKS_PER_BAR));
    const rangeEndTick = Math.max(rangeStartTick + 1, Math.min(totalTicks, endBar * PIANO_TICKS_PER_BAR));
    const firstPassStartTick = Math.max(rangeStartTick, Math.min(rangeEndTick - 1, startTick));
    const rangeStartTime = startTime + rangeStartTick / PIANO_TICKS_PER_BAR * secondsPerBar;
    const firstPassEndTime = startTime + rangeEndTick / PIANO_TICKS_PER_BAR * secondsPerBar;
    const cycleDuration = (rangeEndTick - rangeStartTick) / PIANO_TICKS_PER_BAR * secondsPerBar;
    const firstCycle = now < firstPassEndTime
      ? 0
      : 1 + Math.floor((now - firstPassEndTime) / cycleDuration);
    notes.forEach((note) => {
      for (let cycle = firstCycle; cycle <= firstCycle + 1; cycle += 1) {
        const minimumTick = cycle === 0 ? firstPassStartTick : rangeStartTick;
        if (note.startTick < minimumTick || note.startTick >= rangeEndTick) continue;
        const key = `${note.id}:${cycle}`;
        if (scheduledNotes.has(key)) continue;
        const when = cycle === 0
          ? startTime + note.startTick / PIANO_TICKS_PER_BAR * secondsPerBar
          : firstPassEndTime + (cycle - 1) * cycleDuration +
            (note.startTick - rangeStartTick) / PIANO_TICKS_PER_BAR * secondsPerBar;
        if (when < now || when >= now + lookAhead) continue;
        const durationTicks = Math.min(note.durationTicks, rangeEndTick - note.startTick);
        playPianoNote(instrument, when, note.midi,
          durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar, note.velocity ?? 0.8, instrument, null, note);
        scheduledNotes.add(key);
      }
    });
    if (scheduledNotes.size > notes.length * 3) {
      const nextCycle = firstCycle + 1;
      scheduledNotes.forEach((key) => {
        const cycle = Number(key.slice(key.lastIndexOf(":") + 1));
        if (cycle !== firstCycle && cycle !== nextCycle) scheduledNotes.delete(key);
      });
    }
  }

  const WORKSPACE_PLAY_BUTTONS = {
    sequencer: "sequencer-workspace-play-button",
    "piano-roll": "piano-workspace-play-button",
  };

  function updateWorkspacePlayButton(workspace, playing) {
    const button = $(`#${WORKSPACE_PLAY_BUTTONS[workspace]}`);
    const label = playing ? "Stop" : "Play";
    button.querySelector(".workspace-play-label").textContent = label;
    button.setAttribute("aria-label", `${playing ? "Stop" : "Play"} ${workspace === "piano-roll" ? "piano roll" : workspace} workspace`);
    button.setAttribute("aria-pressed", String(playing));
    button.classList.toggle("is-playing", playing);
  }

  function stopWorkspacePlayback(workspace) {
    const player = state.workspacePlayers[workspace];
    if (!player) return;
    if (player.timerId !== null) window.clearInterval(player.timerId);
    player.timerId = null;
    player.playheadTimers.forEach((timerId) => window.clearTimeout(timerId));
    player.playheadTimers.clear();
    player.scheduledMelNotes.clear();
    state.workspacePlayers[workspace] = null;
    if (workspace === "sequencer" && !(state.isPlaying && state.view === "sequencer")) setPlayhead(-1);
    updateWorkspacePlayButton(workspace, false);
  }

  function stopAllWorkspacePlayers() {
    Object.keys(WORKSPACE_PLAY_BUTTONS).forEach(stopWorkspacePlayback);
  }

  async function toggleWorkspacePlayback(workspace) {
    const existingPlayer = state.workspacePlayers[workspace];
    if (existingPlayer) {
      stopWorkspacePlayback(workspace);
      return;
    }
    const player = {
      timerId: null,
      playheadTimers: new Set(),
      scheduledMelNotes: new Set(),
      startTime: 0,
      nextStepTime: 0,
      stepIndex: 0,
    };
    state.workspacePlayers[workspace] = player;
    updateWorkspacePlayButton(workspace, true);
    try {
      await ensureAudio();
      await loadLibrarySamplesForPlayback(workspace);
      if (state.workspacePlayers[workspace] !== player) return;
      player.startTime = state.audioContext.currentTime + 0.04;
      if (workspace === "piano-roll") {
        const loopTicks = Math.max(1, getPianoPlaybackSource().loopBars * PIANO_TICKS_PER_BAR);
        const { startBar, endBar } = getPianoLoopRange();
        const loopStartTick = state.pianoLoopEnabled ? startBar * PIANO_TICKS_PER_BAR : 0;
        const loopEndTick = state.pianoLoopEnabled ? endBar * PIANO_TICKS_PER_BAR : loopTicks;
        const cursorTick = state.pianoLoopEnabled &&
          (state.pianoCursorTick < loopStartTick || state.pianoCursorTick >= loopEndTick)
          ? loopStartTick
          : state.pianoCursorTick % loopTicks;
        state.pianoCursorTick = cursorTick;
        player.startTick = cursorTick;
        player.startTime -= cursorTick / PIANO_TICKS_PER_BAR * (240 / state.bpm);
        player.nextStepTime = state.audioContext.currentTime + 0.04;
        player.stepIndex = Math.floor(cursorTick) % PIANO_TICKS_PER_BAR;
      } else {
        player.nextStepTime = player.startTime;
      }
      updateTrackGains();
      updateWorkspacePlayButton(workspace, true);
      workspacePlaybackScheduler(workspace);
      player.timerId = window.setInterval(() => {
        try {
          workspacePlaybackScheduler(workspace);
        } catch (error) {
          stopWorkspacePlayback(workspace);
          showToast(error.message || "Workspace playback stopped unexpectedly.");
        }
      }, 25);
    } catch (error) {
      if (state.workspacePlayers[workspace] === player) {
        stopWorkspacePlayback(workspace);
        showToast(error.message || "Workspace audio could not start.");
      }
    }
  }

