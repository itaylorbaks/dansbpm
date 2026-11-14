  function getInstrumentCategory(track) {
    if (track.sampleCategory) return track.sampleCategory;
    const labels = {
      kick: "Kicks",
      snare: "Snares",
      clap: "Claps",
      hat: "Closed Hi-Hats",
      openhat: "Open Hi-Hats",
      rim: "Rims & Percussion",
    };
    return labels[track.kind] || (track.family === "Live Drums" ? "Other Drums" : "");
  }

  function normalizeSoundSearch(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function matchesInstrumentSearch(track, query) {
    const terms = normalizeSoundSearch(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const searchable = normalizeSoundSearch([
      track.name,
      track.family,
      getInstrumentCategory(track),
      track.kind,
      track.subtitle,
      track.id,
      track.sampleUrl,
      track.searchTerms,
      getStepInstrumentGroup(track),
      getInstrumentCategory(track) === "Kicks" ? "kick kicks kick drum bass drum acoustic live" : "",
      track.sampleOneShot ? "one shot" : "",
    ].filter(Boolean).join(" "));
    return terms.every((term) => searchable.includes(term));
  }

  function getStepPickerInstruments() {
    return state.tracks.filter((track) =>
      !track.sourceId && (["piano-roll", "mel-track"].includes(stepInstrumentPickerMode) || track.kind !== "drumkit"));
  }

  function renderSoundSearchSuggestions(query) {
    const results = $("#sound-library-search-results");
    results.replaceChildren();
    const normalizedQuery = normalizeSoundSearch(query);
    const input = $("#sound-library-search-input");
    if (!normalizedQuery) {
      results.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return;
    }

    const instruments = getStepPickerInstruments();
    const categories = [...new Set(instruments.map(getStepInstrumentGroup))];
    const matchingCategories = categories.filter((category) => {
      const text = normalizeSoundSearch(category);
      return normalizedQuery.split(" ").every((term) => text.includes(term));
    }).slice(0, 4);
    const matchingInstruments = instruments.filter((track) => matchesInstrumentSearch(track, query)).slice(0, 7);
    const addHeading = (text) => {
      const heading = document.createElement("div");
      heading.className = "sound-library-search-heading";
      heading.textContent = text;
      results.append(heading);
    };
    const addResult = (title, detail, searchQuery, type, soundId = "") => {
      const button = document.createElement("button");
      button.className = "sound-library-search-result";
      button.type = "button";
      button.dataset.searchQuery = searchQuery;
      button.dataset.searchType = type;
      if (soundId) button.dataset.soundId = soundId;
      button.setAttribute("role", "option");
      const name = document.createElement("span");
      name.className = "sound-library-search-result-name";
      name.textContent = title;
      const description = document.createElement("span");
      description.className = "sound-library-search-result-detail";
      description.textContent = detail;
      button.append(name, description);
      results.append(button);
    };

    if (matchingCategories.length) {
      addHeading("CATEGORIES");
      matchingCategories.forEach((category) => {
        const count = instruments.filter((track) => getStepInstrumentGroup(track) === category).length;
        addResult(category, `${count} sound${count === 1 ? "" : "s"}`, category, "category");
      });
    }
    if (matchingInstruments.length) {
      addHeading("SOUNDS");
      matchingInstruments.forEach((track) => {
        addResult(track.name, [track.family, getInstrumentCategory(track)].filter(Boolean).join(" · "), track.name, "sound", track.id);
      });
    }
    if (!matchingCategories.length && !matchingInstruments.length) {
      const empty = document.createElement("div");
      empty.className = "sound-library-search-empty";
      empty.textContent = "No matching sounds or categories. Press Enter to search the library.";
      results.append(empty);
    }
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function navigateToSoundSearchResult(result) {
    const query = result.dataset.searchQuery || "";
    $("#sound-library-search-input").value = query;
    renderSoundSearchSuggestions("");
    renderStepInstrumentLibrary(query);
    window.requestAnimationFrame(() => {
      const target = result.dataset.searchType === "sound"
        ? Array.from(document.querySelectorAll("#step-instrument-library .step-instrument-choice")).find((row) =>
          row.dataset.soundId === result.dataset.soundId)
        : Array.from(document.querySelectorAll("#step-instrument-library .step-instrument-group")).find((group) =>
          group.dataset.instrumentGroup === query);
      if (!target) return;
      target.scrollIntoView({ block: "start", behavior: "smooth" });
      target.classList.add("is-search-target");
      window.setTimeout(() => target.classList.remove("is-search-target"), 1200);
    });
  }

  function makeInstrumentSourceRow(track) {
    const row = document.createElement("div");
    row.className = "instrument-source";
    row.dataset.soundId = track.id;
    row.tabIndex = 0;
    row.draggable = true;
    row.title = `Drag ${track.name} to Track View to create an instrument track`;
    row.setAttribute("aria-label", `${track.name}, drag to Track View to create an instrument track`);
    row.addEventListener("dragstart", (event) => {
      if (!event.dataTransfer) return;
      event.dataTransfer.setData("application/x-pulsegrid-instrument-source", JSON.stringify({
        instrumentId: track.id,
      }));
      event.dataTransfer.effectAllowed = "copy";
    });
    const color = document.createElement("span");
    color.className = "source-color";
    color.style.background = track.color;
    const name = document.createElement("button");
    name.className = "instrument-source-name";
    name.type = "button";
    name.textContent = track.name;
    name.title = track.sample?.name || track.subtitle;
    name.setAttribute("aria-label", `Preview ${track.name}`);
    name.addEventListener("click", () => previewInstrumentSound(track));
    name.addEventListener("contextmenu", (event) => openSoundDurationMenu(track, event));
    row.append(color, name);
    const soundSelect = makeSoundSelect(track, true);
    if (soundSelect) row.append(soundSelect);
    return row;
  }

  function renderInstrumentBrowser(query = "", force = false) {
    if (!$("#source-browser-dialog").open && !force) return;
    const browser = $("#instrument-browser");
    browser.replaceChildren();
    const allInstruments = state.tracks.filter((track) => !track.sourceId);
    const instruments = allInstruments.filter((track) => matchesInstrumentSearch(track, query));
    $("#drum-sound-count").textContent = String(instruments.length);
    if (!instruments.length && query) {
      const empty = document.createElement("div");
      empty.className = "instrument-search-empty";
      empty.textContent = `No sounds found for "${query}".`;
      browser.append(empty);
      return;
    }
    const favorites = instruments.filter(isFavoriteSound);
    if (favorites.length) {
      const familyGroup = document.createElement("section");
      familyGroup.className = "instrument-family-group";
      familyGroup.dataset.family = "Favorites";
      const heading = document.createElement("h3");
      heading.className = "instrument-family-heading";
      heading.textContent = "Favorites";
      familyGroup.append(heading);
      favorites.forEach((track) => familyGroup.append(makeInstrumentSourceRow(track)));
      browser.append(familyGroup);
    }
    const families = new Map();
    instruments.forEach((track) => {
      const family = track.family || (track.kind === "sample" ? "Imported Sounds" : "Drums");
      let familyGroup = families.get(family);
      if (!familyGroup) {
        familyGroup = document.createElement("section");
        familyGroup.className = "instrument-family-group";
        familyGroup.dataset.family = family;
        const heading = document.createElement("h3");
        heading.className = "instrument-family-heading";
        heading.textContent = family;
        familyGroup.append(heading);
        families.set(family, familyGroup);
        browser.append(familyGroup);
      }

      let container = familyGroup;
      if (track.sampleCategory || family === "Drums" || family === "Live Drums") {
        const kind = getInstrumentCategory(track) || "Other Drums";
        const subsectionKey = `drum-kind-${kind.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        let subsection = familyGroup.querySelector(`[data-subsection="${subsectionKey}"]`);
        if (!subsection) {
          subsection = document.createElement("section");
          subsection.className = "instrument-kind-group";
          subsection.dataset.subsection = subsectionKey;
          subsection.dataset.category = kind;
          const heading = document.createElement("h4");
          heading.className = "instrument-kind-heading";
          heading.textContent = kind;
          subsection.append(heading);
          familyGroup.append(subsection);
        }
        container = subsection;
      }
      container.append(makeInstrumentSourceRow(track));
    });
  }

  function renderArrangementAssetBrowser() {
    const renderList = (containerId, countId, assets, type, dataType, getPayload) => {
      const browser = $(`#${containerId}`);
      browser.replaceChildren();
      browser.setAttribute("role", "list");
      $(`#${countId}`).textContent = String(assets.length);
      if (!assets.length) {
        const empty = document.createElement("div");
        empty.className = "asset-source-empty";
        empty.textContent = `No saved ${type.toLowerCase()} yet`;
        browser.append(empty);
        return;
      }
      assets.forEach((asset) => {
        const item = document.createElement("div");
        item.className = "asset-source";
        item.draggable = true;
        item.tabIndex = 0;
        item.setAttribute("role", "listitem");
        item.setAttribute("aria-label", `${asset.name}, drag to Track View`);
        const name = document.createElement("span");
        name.className = "asset-source-name";
        name.textContent = asset.name;
        const kind = document.createElement("span");
        kind.className = "asset-source-kind";
        kind.textContent = type;
        item.append(name, kind);
        item.addEventListener("dragstart", (event) => {
          if (!event.dataTransfer) return;
          event.dataTransfer.setData(dataType, JSON.stringify(getPayload(asset)));
          event.dataTransfer.effectAllowed = "copy";
        });
        browser.append(item);
      });
    };
    renderList(
      "pattern-asset-browser",
      "pattern-asset-count",
      getPatternLibraryAssets(),
      "Pattern",
      "application/x-pulsegrid-pattern-source",
      (pattern) => ({ patternId: pattern.id }),
    );
    renderList(
      "mel-asset-browser",
      "mel-asset-count",
      state.mels,
      "Mel",
      "application/x-pulsegrid-mel-source",
      (mel) => ({ melId: mel.id }),
    );
  }

  function renderRecordingBrowser() {
    const browser = $("#recording-browser");
    browser.replaceChildren();
    const clips = state.arrangementTracks.flatMap((track) =>
      track.clips.map((clip) => ({ track, clip })));
    $("#recording-source-count").textContent = String(clips.length);
    if (!clips.length) {
      const empty = document.createElement("div");
      empty.className = "recording-source-empty";
      empty.textContent = "No audio imported yet";
      browser.append(empty);
      return;
    }
    clips.forEach(({ track, clip }) => {
      const item = document.createElement("button");
      item.className = "recording-source";
      item.type = "button";
      item.draggable = true;
      item.title = `Drag ${clip.name || track.name} to Track View`;
      const color = document.createElement("span");
      color.className = "source-color";
      color.style.background = track.color;
      const name = document.createElement("span");
      name.className = "recording-source-name";
      name.textContent = clip.name || track.name;
      const count = document.createElement("span");
      count.className = "recording-source-count";
      count.textContent = track.name;
      item.append(color, name, count);
      item.addEventListener("dragstart", (event) => {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData("application/x-pulsegrid-audio-source", JSON.stringify({
          sourceTrackId: track.id,
          clipId: clip.id,
        }));
        event.dataTransfer.effectAllowed = "copy";
      });
      item.addEventListener("click", () => {
        setArrangementCursor(clip.startBar);
        $("#timeline-scroll").scrollLeft = clip.startBar * BAR_WIDTH;
        $("#source-browser-dialog").close();
      });
      browser.append(item);
    });
  }

  let assetLibraryDialogHome = null;

  function restoreAssetLibraryDialogPosition() {
    if (!assetLibraryDialogHome) return;
    const dialog = $("#source-browser-dialog");
    const { parent, nextSibling } = assetLibraryDialogHome;
    parent.insertBefore(dialog, nextSibling?.parentNode === parent ? nextSibling : null);
    assetLibraryDialogHome = null;
  }

  function syncAssetLibraryDialogFullscreen() {
    const dialog = $("#source-browser-dialog");
    const trackView = $("#track-view-area");
    if (document.fullscreenElement !== trackView || !dialog.open) {
      restoreAssetLibraryDialogPosition();
      return;
    }
    if (trackView.contains(dialog)) return;
    assetLibraryDialogHome = { parent: dialog.parentNode, nextSibling: dialog.nextSibling };
    trackView.append(dialog);
  }

  function openAssetLibrary() {
    captureCurrentPattern();
    captureCurrentMel();
    renderArrangementAssetBrowser();
    renderRecordingBrowser();
    renderInstrumentBrowser("", true);
    const dialog = $("#source-browser-dialog");
    if (!dialog.open) dialog.show();
    syncAssetLibraryDialogFullscreen();
  }

  function addPatternClip(startBar = state.arrangementCursor, patternId = state.selectedPatternId, trackId = patternId) {
    const pattern = getPattern(patternId);
    if (!pattern) return;
    const trackPattern = getPattern(trackId);
    if (trackPattern && !state.patternClips.some((clip) => (clip.trackId || clip.patternId) === trackId)) {
      trackPattern.insertAfterTrackId = getLastArrangementTrackId();
    }
    const durationBars = pattern.steps / 16;
    state.patternClips.push({
      id: makeId(),
      patternId: pattern.id,
      trackId,
      repeatCount: 1,
      sourceOffsetBars: 0,
      startBar: clampArrangementStart(startBar, durationBars),
    });
    state.patternClips.sort((left, right) => left.startBar - right.startBar);
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast("Drum pattern added to the arrangement");
  }

  function addMelTrack(melId, startBar) {
    const mel = getMel(melId);
    if (!mel) return null;
    const track = {
      id: makeId(),
      name: mel.name,
      kind: "mel",
      insertAfterTrackId: getLastArrangementTrackId(),
      instrumentId: mel.instrumentId,
      color: TRACK_COLORS[state.melTracks.length % TRACK_COLORS.length],
      muted: false,
      solo: false,
      volume: 1,
      automation: normalizeTrackAutomation(),
      automationOpen: false,
      gainNode: null,
      effects: makeDefaultEffects(),
      clips: [],
    };
    state.melTracks.push(track);
    addMelClip(mel.id, track.id, startBar);
    return track;
  }

  function createEmptyMelTrack(instrumentId = null) {
    const selectedInstrumentId = state.tracks.some((track) => track.id === instrumentId)
      ? instrumentId
      : state.tracks.some((track) => track.id === state.selectedPianoTrackId)
        ? state.selectedPianoTrackId
        : state.tracks[0]?.id;
    if (!selectedInstrumentId) {
      showToast("Add an instrument before creating an instrument track.");
      return;
    }
    let number = 1;
    while (state.melTracks.some((track) => track.name === `Instrument Track ${number}`)) number += 1;
    const track = {
      id: makeId(),
      name: `Instrument Track ${number}`,
      kind: "mel",
      insertAfterTrackId: getLastArrangementTrackId(),
      instrumentId: selectedInstrumentId,
      color: TRACK_COLORS[state.melTracks.length % TRACK_COLORS.length],
      muted: false,
      solo: false,
      volume: 1,
      automation: normalizeTrackAutomation(),
      automationOpen: false,
      gainNode: null,
      effects: makeDefaultEffects(),
      clips: [],
    };
    state.melTracks.push(track);
    renderArrangement();
    selectArrangementTrack(track.id);
    saveState();
    return track;
  }

  function addMelClip(melId, trackId, startBar) {
    const mel = getMel(melId);
    const track = state.melTracks.find((item) => item.id === trackId);
    if (!mel || !track) return;
    const length = getMelLengthBars(mel);
    track.clips.push({
      id: makeId(),
      melId,
      repeatCount: 1,
      sourceOffsetBars: 0,
      startBar: clampArrangementStart(startBar, length),
    });
    track.clips.sort((left, right) => left.startBar - right.startBar);
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast(`${mel.name} added to Track View`);
  }

  function addAudioAssetClip(sourceTrackId, clipId, destinationTrackId, startBar) {
    const sourceTrack = state.arrangementTracks.find((track) => track.id === sourceTrackId);
    const sourceClip = sourceTrack?.clips.find((clip) => clip.id === clipId);
    if (!sourceTrack || !sourceClip) {
      showToast("That audio asset is no longer available.");
      return;
    }
    const clip = {
      ...sourceClip,
      id: makeId(),
      startBar: clampArrangementStart(startBar, getArrangementClipDuration("audio", sourceClip)),
    };
    const destination = state.arrangementTracks.find((track) => track.id === destinationTrackId)
      || createArrangementTrack(clip.name || sourceTrack.name);
    if (!destination.clips.length && /^Track \d+$/.test(destination.name)) {
      destination.name = clip.name || sourceTrack.name;
    }
    destination.clips.push(clip);
    destination.clips.sort((left, right) => left.startBar - right.startBar);
    updateArrangementLength();
    renderArrangement();
    saveState();
    if (destinationTrackId === DEFAULT_ARRANGEMENT_TRACK_ID) selectArrangementTrack(destination.id);
    if (clip.blob) {
      persistClip(destination, clip).catch(() => showToast("Audio was added, but browser storage could not be updated."));
    }
    showToast(`${clip.name || sourceTrack.name} added to Track View`);
  }

  function moveMelClip(clipId, sourceTrackId, destinationTrackId, startBar) {
    const source = state.melTracks.find((track) => track.id === sourceTrackId);
    const destination = state.melTracks.find((track) => track.id === destinationTrackId);
    const clipIndex = source?.clips.findIndex((clip) => clip.id === clipId) ?? -1;
    const clip = clipIndex >= 0 ? source.clips[clipIndex] : null;
    const mel = clip ? getMel(clip.melId) : null;
    if (!source || !destination || !clip || !mel) return;
    if (source !== destination) source.clips.splice(clipIndex, 1);
    clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("mel", clip));
    if (source !== destination) destination.clips.push(clip);
    destination.clips.sort((left, right) => left.startBar - right.startBar);
    if (source !== destination && !source.clips.length) {
      state.melTracks = state.melTracks.filter((item) => item !== source);
      disconnectTrackAudio(source);
    }
    updateArrangementLength();
    renderArrangement();
    saveState();
  }

  function moveMelClipToNewTrack(clipId, sourceTrackId, startBar) {
    const source = state.melTracks.find((track) => track.id === sourceTrackId);
    const clip = source?.clips.find((item) => item.id === clipId);
    const mel = clip ? getMel(clip.melId) : null;
    if (!source || !clip || !mel) return;
    const destination = {
      ...source,
      id: makeId(),
      name: mel.name,
      kind: "mel",
      insertAfterTrackId: getLastArrangementTrackId(),
      instrumentId: source.instrumentId,
      gainNode: null,
      fxRuntime: null,
      analyser: null,
      sourceGains: null,
      automation: normalizeTrackAutomation(source.automation),
      automationOpen: source.automationOpen === true,
      effects: makeDefaultEffects(source.effects),
      clips: [],
    };
    state.melTracks.push(destination);
    moveMelClip(clip.id, source.id, destination.id, startBar);
  }

  function movePatternClip(clipId, startBar, trackId) {
    const clip = state.patternClips.find((item) => item.id === clipId);
    if (!clip) return;
    const pattern = getPattern(clip.patternId);
    if (!pattern) return;
    clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("pattern", clip));
    if (state.patterns.some((item) => item.id === trackId)) clip.trackId = trackId;
    state.patternClips.sort((left, right) => left.startBar - right.startBar);
    updateArrangementLength();
    renderArrangement();
    saveState();
  }

  function createPatternLaneCopy(source) {
    captureCurrentPattern();
    const currentSource = getPattern(source.id) || source;
    const pattern = {
      id: makeId(),
      name: getNextPatternName(),
      kind: "pattern",
      arrangementCopy: true,
      color: getPatternColor(state.patterns.length),
      steps: currentSource.steps,
      trackIds: [...getPatternTrackIds(currentSource)],
      cells: Object.fromEntries(Object.entries(currentSource.cells).map(([trackId, cells]) => [trackId, [...cells]])),
      variants: { ...currentSource.variants },
      automation: normalizeTrackAutomation(currentSource.automation),
      automationOpen: currentSource.automationOpen === true,
      ...(currentSource.stepPianoNotes ? {
        stepPianoNotes: Object.fromEntries(Object.entries(currentSource.stepPianoNotes).map(([trackId, notes]) =>
          [trackId, notes.map((note) => ({ ...note }))])),
      } : {}),
      gridResolution: getPatternGridResolution(currentSource),
      volume: 1,
      effects: makeDefaultEffects(),
      effectSettings: makeDefaultEffectSettings(),
      effectChain: [],
    };
    state.patterns.push(pattern);
    return pattern;
  }

  function addPatternClipToNewTrack(startBar, patternId) {
    const source = getPattern(patternId);
    if (!source) return;
    const destination = createPatternLaneCopy(source);
    addPatternClip(startBar, source.id, destination.id);
  }

  function movePatternClipToNewTrack(clipId, startBar) {
    const clip = state.patternClips.find((item) => item.id === clipId);
    const source = clip ? getPattern(clip.patternId) : null;
    if (!clip || !source) return;
    const destination = createPatternLaneCopy(source);
    destination.insertAfterTrackId = getLastArrangementTrackId();
    clip.trackId = destination.id;
    clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("pattern", clip));
    state.patternClips.sort((left, right) => left.startBar - right.startBar);
    updateArrangementLength();
    renderArrangement();
    saveState();
  }

  function beginArrangementItemDrag(event, element, type, durationBars, startBar) {
    clearArrangementDragPreview();
    const preview = element.cloneNode(true);
    preview.classList.remove("is-selected");
    preview.querySelectorAll(".clip-resize-handle").forEach((handle) => handle.remove());
    preview.classList.add("arrangement-drag-preview");
    preview.setAttribute("aria-hidden", "true");
    preview.draggable = false;
    const lane = element.closest(".timeline-lane");
    const pointerBar = lane
      ? (event.clientX - lane.getBoundingClientRect().left) / BAR_WIDTH
      : startBar;
    state.arrangementDrag = {
      type,
      durationBars,
      grabOffsetBars: Math.max(0, Math.min(durationBars, pointerBar - startBar)),
      preview,
      dragImage: null,
    };
    if (event.dataTransfer) {
      const transparentImage = document.createElement("canvas");
      transparentImage.width = 1;
      transparentImage.height = 1;
      transparentImage.style.position = "fixed";
      transparentImage.style.left = "-2px";
      document.body.append(transparentImage);
      event.dataTransfer.setDragImage(transparentImage, 0, 0);
      state.arrangementDrag.dragImage = transparentImage;
    }
    element.addEventListener("dragend", clearArrangementDragPreview, { once: true });
  }

  function updateArrangementDragPreview(event, lane) {
    const drag = state.arrangementDrag;
    if (!drag) return;
    let preview = lane.querySelector(":scope > .arrangement-drag-preview");
    if (!preview) {
      preview = drag.preview.cloneNode(true);
      lane.append(preview);
    }
    const startBar = arrangementDropStartAtPointer(event, lane);
    preview.style.left = `${startBar * BAR_WIDTH}px`;
    preview.style.width = `${Math.max(12, drag.durationBars * BAR_WIDTH)}px`;
  }

  function clearArrangementDragPreview() {
    state.arrangementDrag?.dragImage?.remove();
    document.querySelectorAll(".arrangement-drag-preview").forEach((preview) => preview.remove());
    document.querySelectorAll(".timeline-lane.is-drop-target").forEach((lane) => lane.classList.remove("is-drop-target"));
    state.arrangementDrag = null;
  }

