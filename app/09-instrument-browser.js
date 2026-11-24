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

  function matchesInstrumentTitle(track, query) {
    const terms = normalizeSoundSearch(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const title = normalizeSoundSearch(track.name);
    return terms.every((term) => title.includes(term));
  }

  function filterAssetLibrary(query = $("#asset-library-search-input").value) {
    const terms = normalizeSoundSearch(query).split(/\s+/).filter(Boolean);
    const matches = (item) => {
      if (!terms.length) return true;
      const text = normalizeSoundSearch(item.textContent);
      return terms.every((term) => text.includes(term));
    };
    const items = $("#source-browser-dialog").querySelectorAll(
      ".asset-source, .recording-source, .pattern-component-row, .instrument-source",
    );
    items.forEach((item) => { item.hidden = !matches(item); });
    $("#source-browser-dialog").querySelectorAll(
      ".recording-source-group, .pattern-component-group, .instrument-family-group, .instrument-kind-group",
    ).forEach((group) => {
      const hasMatch = Array.from(group.querySelectorAll(
        ".asset-source, .recording-source, .pattern-component-row, .instrument-source",
      )).some((item) => !item.hidden);
      group.hidden = !hasMatch;
      if (terms.length && hasMatch) group.open = true;
    });
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
    row.title = track.vstPluginId
      ? `Drag ${track.name} onto a Rack row or Piano Roll`
      : track.kind === "sample"
        ? `Drag ${track.name} to Piano Roll to add a one-shot note, or to Track View to create an instrument track`
        : `Drag ${track.name} to Track View to create an instrument track`;
    row.setAttribute("aria-label", track.vstPluginId
      ? `${track.name}, drag to a Rack row or Piano Roll`
      : track.kind === "sample"
        ? `${track.name}, drag to Piano Roll to add a one-shot note or to Track View to create an instrument track`
        : `${track.name}, drag to Track View to create an instrument track`);
    row.addEventListener("dragstart", (event) => {
      if (!event.dataTransfer) return;
      event.dataTransfer.setData("application/x-pulsegrid-instrument-source", JSON.stringify({
        instrumentId: track.id,
      }));
      if (track.kind === "sample") {
        event.dataTransfer.setData("application/x-pulsegrid-sample-source", track.id);
      }
      if (track.vstPluginId) {
        event.dataTransfer.setData("application/x-pulsegrid-vst", JSON.stringify({
          instrumentId: track.id,
          vstPluginId: track.vstPluginId,
        }));
      }
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

  function renderVstBrowser() {
    const browser = $("#vst-browser");
    const plugins = state.tracks.filter((track) => !track.sourceId && track.vstPluginId);
    browser.replaceChildren();
    $("#vst-count").textContent = String(plugins.length);
    if (!plugins.length) {
      const empty = document.createElement("div");
      empty.className = "instrument-search-empty";
      empty.textContent = "No VST instruments are available";
      browser.append(empty);
      return;
    }
    plugins.forEach((plugin) => browser.append(makeInstrumentSourceRow(plugin)));
  }

  function renderInstrumentBrowser(query = "", force = false) {
    if (!$("#source-browser-dialog").open && !force) return;
    const browser = $("#instrument-browser");
    browser.replaceChildren();
    const allInstruments = state.tracks.filter((track) => !track.sourceId && !track.vstPluginId);
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
      const familyGroup = document.createElement("details");
      familyGroup.className = "instrument-family-group";
      familyGroup.dataset.family = "Favorites";
      familyGroup.open = Boolean(query);
      const heading = document.createElement("summary");
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
        familyGroup = document.createElement("details");
        familyGroup.className = "instrument-family-group";
        familyGroup.dataset.family = family;
        familyGroup.open = Boolean(query);
        const heading = document.createElement("summary");
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
          subsection = document.createElement("details");
          subsection.className = "instrument-kind-group";
          subsection.dataset.subsection = subsectionKey;
          subsection.dataset.category = kind;
          subsection.open = Boolean(query);
          const heading = document.createElement("summary");
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
        item.dataset.assetType = type.toLowerCase();
        item.dataset.assetId = asset.id;
        item.classList.toggle(
          "is-selected",
          state.selectedAsset?.type === type.toLowerCase() && state.selectedAsset.id === asset.id,
        );
        const name = document.createElement("span");
        name.className = "asset-source-name";
        name.textContent = asset.name;
        const kind = document.createElement("span");
        kind.className = "asset-source-kind";
        kind.textContent = type;
        item.append(name, kind);
        item.addEventListener("click", () => {
          setSelectedAsset({ type: type.toLowerCase(), id: asset.id, name: asset.name });
        });
        item.addEventListener("dragstart", (event) => {
          if (!event.dataTransfer) return;
          event.dataTransfer.setData(dataType, JSON.stringify(getPayload(asset)));
          event.dataTransfer.effectAllowed = "copy";
        });
        item.addEventListener("contextmenu", (event) =>
          openAssetContextMenu(type.toLowerCase(), asset.id, event));
        browser.append(item);
      });
    };
    const patterns = getPatternLibraryAssets();
    const patternBrowser = $("#pattern-asset-browser");
    patternBrowser.replaceChildren();
    patternBrowser.setAttribute("role", "list");
    $("#pattern-asset-count").textContent = String(patterns.length);
    if (!patterns.length) {
      const empty = document.createElement("div");
      empty.className = "asset-source-empty";
      empty.textContent = "No saved patterns yet";
      patternBrowser.append(empty);
    }
    patterns.forEach((pattern) => {
      const details = document.createElement("details");
      details.className = "pattern-component-group";
      const summary = document.createElement("summary");
      summary.className = "asset-source pattern-asset-summary";
      summary.dataset.assetType = "pattern";
      summary.dataset.assetId = pattern.id;
      summary.setAttribute("aria-label", `${pattern.name}, drag to Track View or expand components`);
      summary.draggable = true;
      summary.classList.toggle(
        "is-selected",
        state.selectedAsset?.type === "pattern" && state.selectedAsset.id === pattern.id,
      );
      const name = document.createElement("span");
      name.className = "asset-source-name";
      name.textContent = pattern.name;
      const kind = document.createElement("span");
      kind.className = "asset-source-kind";
      kind.textContent = "Pattern";
      summary.append(name, kind);
      summary.addEventListener("click", () => {
        setSelectedAsset({ type: "pattern", id: pattern.id, name: pattern.name });
      });
      summary.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("application/x-pulsegrid-pattern-source",
          JSON.stringify({ patternId: pattern.id }));
      });
      summary.addEventListener("contextmenu", (event) =>
        openAssetContextMenu("pattern", pattern.id, event));
      details.append(summary);
      getPatternTrackIds(pattern).forEach((trackId) => {
        const sourceTrack = state.tracks.find((track) => track.id === trackId);
        if (!sourceTrack) return;
        const component = document.createElement("div");
        component.className = "pattern-component-row";
        component.draggable = true;
        component.dataset.assetType = "pattern-component";
        component.dataset.assetId = `${pattern.id}:${trackId}`;
        component.textContent = sourceTrack.name;
        component.addEventListener("dragstart", (event) => {
          event.dataTransfer?.setData("application/x-pulsegrid-pattern-component",
            JSON.stringify({ patternId: pattern.id, trackId }));
        });
        component.addEventListener("click", () => {
          setSelectedAsset({
            type: "pattern-component",
            id: `${pattern.id}:${trackId}`,
            patternId: pattern.id,
            trackId,
            name: sourceTrack.name,
          });
        });
        details.append(component);
      });
      patternBrowser.append(details);
    });
    renderList(
      "mel-asset-browser",
      "mel-asset-count",
      state.mels,
      "Mel",
      "application/x-pulsegrid-mel-source",
      (mel) => ({ melId: mel.id }),
    );
  }

  function setSelectedAsset(asset) {
    state.selectedAsset = asset ? { ...asset } : null;
    $("#selected-asset-name").textContent = asset?.name || "None";
    document.querySelectorAll(".asset-source, .recording-source, .pattern-component-row").forEach((item) => {
      const selected = asset && item.dataset.assetType === asset.type && item.dataset.assetId === asset.id;
      item.classList.toggle("is-selected", Boolean(selected));
    });
    $("#selected-asset-menu").hidden = true;
  }

  function renderSelectedAssetMenu() {
    const menu = $("#selected-asset-menu");
    const items = [
      ...getPatternLibraryAssets().map((asset) => ({ type: "pattern", id: asset.id, name: asset.name })),
      ...state.mels.map((asset) => ({ type: "mel", id: asset.id, name: asset.name })),
      ...state.audioAssets.map((asset) => ({
        type: "audio", id: asset.id, clipId: asset.id, sourceTrackId: "", name: asset.name, assetOnly: true,
      })),
      ...state.arrangementTracks.flatMap((track) => track.clips.map((clip) => ({
        type: "audio", id: clip.id, clipId: clip.id, sourceTrackId: track.id, name: clip.name || track.name,
      }))),
    ];
    menu.replaceChildren();
    const clear = document.createElement("button");
    clear.type = "button";
    clear.setAttribute("role", "menuitem");
    clear.textContent = "Clear selection";
    clear.addEventListener("click", () => setSelectedAsset(null));
    menu.append(clear);
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "selected-asset-empty";
      empty.textContent = "No patterns, Mels, or audio assets yet.";
      menu.append(empty);
    }
    items.forEach((asset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.textContent = `${asset.type.toUpperCase()} · ${asset.name}`;
      button.addEventListener("click", () => setSelectedAsset(asset));
      menu.append(button);
    });
  }

  let assetContextMenuHome = null;

  function openAssetContextMenu(type, id, event) {
    event.preventDefault();
    closeArrangementTrackContextMenu();
    const menu = $("#asset-context-menu");
    const dialog = event.currentTarget.closest("dialog");
    if (dialog && menu.parentElement !== dialog) {
      assetContextMenuHome = { parent: menu.parentElement, nextSibling: menu.nextSibling };
      dialog.append(menu);
    }
    menu.dataset.assetType = type;
    menu.dataset.assetId = id;
    const openAsset = $("#open-library-asset");
    openAsset.hidden = type === "audio" || !["pattern", "mel"].includes(type);
    openAsset.textContent = type === "pattern" ? "Open in Rack" : "Open in Piano Roll";
    $("#open-audio-as-instrument").hidden = type !== "audio";
    $("#open-audio-as-pitch").hidden = type !== "audio";
    $("#draw-pattern-components").hidden = type !== "pattern";
    menu.hidden = false;
    positionContextMenuAtTarget(menu, event.currentTarget);
  }

  function closeAssetContextMenu() {
    const menu = $("#asset-context-menu");
    menu.hidden = true;
    if (assetContextMenuHome) {
      const { parent, nextSibling } = assetContextMenuHome;
      parent.insertBefore(menu, nextSibling?.parentNode === parent ? nextSibling : null);
      assetContextMenuHome = null;
    }
    delete menu.dataset.assetType;
    delete menu.dataset.assetId;
    $("#open-library-asset").hidden = true;
    $("#open-audio-as-instrument").hidden = true;
    $("#open-audio-as-pitch").hidden = true;
  }

  function getArrangementAsset(type, id) {
    if (type === "mel") {
      const clip = state.melTracks.flatMap((track) => track.clips).find((item) => item.id === id);
      return state.mels.find((mel) => mel.id === id) || (clip ? getMel(clip.melId) : null);
    }
    if (type === "pattern") {
      const clip = state.patternClips.find((item) => item.id === id);
      return state.patterns.find((pattern) => pattern.id === id) || (clip ? getPattern(clip.patternId) : null);
    }
    const audio = state.audioAssets.find((asset) => asset.id === id ||
      asset.isSourceAudioAsset && asset.sourceAssetId === id) ||
      state.arrangementTracks.flatMap((track) => track.clips).find((clip) => clip.id === id);
    if (!audio) return null;
    if (state.audioAssets.includes(audio)) return audio;
    return state.audioAssets.find((asset) => asset.id === audio.assetId) || audio;
  }

  function renameArrangementAsset(type, id) {
    const asset = getArrangementAsset(type, id);
    if (!asset) {
      showToast("That asset is no longer available.");
      return;
    }
    const oldName = asset.name;
    const name = window.prompt(`Rename ${type}`, oldName)?.trim();
    if (!name) return;
    if (type !== "audio" && (type === "mel" ? state.mels : state.patterns)
      .some((item) => item.id !== asset.id && item.name.toLowerCase() === name.toLowerCase())) {
      showToast(`${type === "mel" ? "Mel" : "Pattern"} names must be unique.`);
      return;
    }
    if (type === "audio") {
      const assetId = asset.assetId || asset.id;
      if (asset.segmentSourceAssetId) asset.segmentNameEdited = true;
      state.audioAssets.filter((item) => (item.assetId || item.id) === assetId)
        .forEach((item) => { item.name = name; });
      state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
        if ((clip.assetId || clip.id) !== assetId) return;
        clip.name = name;
        persistClip(track, clip).catch(() => showToast("Audio was renamed, but browser storage could not be updated."));
      }));
      const audioAsset = state.audioAssets.find((item) => item.id === asset.id);
      if (audioAsset) persistAudioAsset(audioAsset).catch(() =>
        showToast("Audio was renamed, but browser storage could not be updated."));
      if (audioAsset?.isSourceAudioAsset) {
        renumberAudioSegments(audioAsset.sourceAssetId);
        state.audioAssets.filter((item) => item.segmentSourceAssetId === audioAsset.sourceAssetId)
          .forEach((item) => persistAudioAsset(item).catch(() =>
            showToast("Audio was renamed, but browser storage could not be updated.")));
        state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
          if (clip.segmentSourceAssetId === audioAsset.sourceAssetId) {
            persistClip(track, clip).catch(() => showToast("Audio was renamed, but browser storage could not be updated."));
          }
        }));
      }
    } else {
      asset.name = name;
      if (type === "mel") {
        if (asset.segmentSourceMelId) asset.segmentNameEdited = true;
        state.melTracks.forEach((track) => {
          if (track.name === oldName && track.clips.some((clip) => clip.melId === asset.id)) {
            track.name = name;
          }
        });
        refreshMelSegments(asset);
        renderMelOptions();
      } else {
        if (asset.segmentSourcePatternId) asset.segmentNameEdited = true;
        refreshPatternSegments(asset);
        renderPatternSelectors();
      }
    }
    renderArrangementAssetBrowser();
    renderArrangement();
    saveState();
  }

  function nextBranchName(name) {
    const branch = /^Branch (\d+) - (.+)$/.exec(name);
    return `Branch ${branch ? Number(branch[1]) + 1 : 1} - ${branch ? branch[2] : name}`;
  }

  function branchArrangementAsset(type, id) {
    const source = getArrangementAsset(type, id);
    if (!source) {
      showToast("That asset is no longer available.");
      return;
    }
    const branchName = nextBranchName(source.name);
    if (type === "mel") {
      const branch = {
        ...source,
        id: makeId(),
        name: branchName,
        notes: source.notes.map((note) => ({ ...note, id: makeId() })),
      };
      delete branch.segmentSourceMelId;
      delete branch.segmentStartTick;
      delete branch.segmentEndTick;
      delete branch.segmentEdited;
      delete branch.segmentSnapshot;
      delete branch.segmentNameEdited;
      delete branch.audioSourceClipId;
      delete branch.audioSourceAssetId;
      state.mels.push(branch);
      renderMelOptions();
    } else if (type === "pattern") {
      const branch = {
        ...source,
        id: makeId(),
        name: branchName,
        arrangementCopy: false,
        trackIds: [...getPatternTrackIds(source)],
        cells: Object.fromEntries(Object.entries(source.cells || {}).map(([trackId, cells]) =>
          [trackId, [...cells]])),
        variants: { ...(source.variants || {}) },
        ...(source.stepPianoNotes ? {
          stepPianoNotes: Object.fromEntries(Object.entries(source.stepPianoNotes).map(([trackId, notes]) =>
            [trackId, notes.map((note) => ({ ...note, id: makeId() }))])),
        } : {}),
      };
      delete branch.segmentSourcePatternId;
      delete branch.segmentStartBar;
      delete branch.segmentEndBar;
      delete branch.segmentEdited;
      delete branch.segmentSnapshot;
      delete branch.segmentNameEdited;
      state.patterns.push(branch);
      renderPatternSelectors();
    } else {
      const branch = {
        ...source,
        id: makeId(),
        assetId: makeId(),
        name: branchName,
        sourceAssetId: null,
        segmentSourceAssetId: null,
        segmentNameEdited: false,
        isSourceAudioAsset: false,
      };
      state.audioAssets.push(branch);
      persistAudioAsset(branch).catch((error) =>
        showToast(`Audio branch created, but browser storage could not be updated: ${error.message || "storage unavailable"}`));
    }
    renderArrangementAssetBrowser();
    renderArrangement();
    saveState();
    showToast(`${branchName} added to the asset library`);
  }

  function renameArrangementTrack(trackId) {
    const track = state.arrangementTracks.find((item) => item.id === trackId) ||
      state.melTracks.find((item) => item.id === trackId) ||
      state.patterns.find((item) => item.id === trackId &&
        state.patternClips.some((clip) => (clip.trackId || clip.patternId) === trackId));
    if (!track) return;
    const currentName = track.arrangementName || track.name;
    const name = window.prompt("Rename track", currentName)?.trim();
    if (!name || name === currentName) return;
    if (track.kind === "pattern") track.arrangementName = name;
    else track.name = name;
    renderArrangement();
    saveState();
  }

  function duplicateArrangementTrack(trackId) {
    const audioTrack = state.arrangementTracks.find((item) => item.id === trackId);
    const melTrack = state.melTracks.find((item) => item.id === trackId);
    const patternTrack = state.patterns.find((item) => item.id === trackId &&
      state.patternClips.some((clip) => (clip.trackId || clip.patternId) === trackId));
    const name = `Copy - ${(audioTrack || melTrack || patternTrack)?.arrangementName ||
      (audioTrack || melTrack || patternTrack)?.name || "Track"}`;
    let destinationId;
    if (audioTrack) {
      const duplicate = {
        ...audioTrack,
        id: makeId(),
        name,
        insertAfterTrackId: trackId,
        gainNode: null,
        fxRuntime: null,
        analyser: null,
        sourceGains: null,
        automationGainNode: null,
        panNode: null,
        sidechainInputNode: null,
        sidechainSourceNode: null,
        clips: audioTrack.clips.map((clip) => ({ ...clip, id: makeId(), assetId: clip.assetId || clip.id })),
        automation: normalizeTrackAutomation(audioTrack.automation),
        effects: makeDefaultEffects(audioTrack.effects),
        effectSettings: makeDefaultEffectSettings(audioTrack.effectSettings),
        effectChain: Array.isArray(audioTrack.effectChain) ? [...audioTrack.effectChain] : [],
      };
      state.arrangementTracks.push(duplicate);
      ensureArrangementTrackAudio(duplicate);
      duplicate.clips.forEach((clip) => {
        if (clip.blob) persistClip(duplicate, clip).catch(() =>
          showToast("Track duplicated, but a recording could not be saved."));
      });
      destinationId = duplicate.id;
    } else if (melTrack) {
      const duplicate = {
        ...melTrack,
        id: makeId(),
        name,
        insertAfterTrackId: trackId,
        gainNode: null,
        fxRuntime: null,
        analyser: null,
        sourceGains: null,
        automationGainNode: null,
        panNode: null,
        sidechainInputNode: null,
        sidechainSourceNode: null,
        clips: melTrack.clips.map((clip) => ({ ...clip, id: makeId() })),
        automation: normalizeTrackAutomation(melTrack.automation),
        effects: makeDefaultEffects(melTrack.effects),
        effectSettings: makeDefaultEffectSettings(melTrack.effectSettings),
        effectChain: Array.isArray(melTrack.effectChain) ? [...melTrack.effectChain] : [],
      };
      state.melTracks.push(duplicate);
      destinationId = duplicate.id;
    } else if (patternTrack) {
      const duplicate = createPatternLaneCopy(patternTrack);
      duplicate.arrangementName = name;
      duplicate.insertAfterTrackId = trackId;
      state.patternClips.filter((clip) => (clip.trackId || clip.patternId) === trackId).forEach((clip) => {
        state.patternClips.push({ ...clip, id: makeId(), patternId: clip.patternId, trackId: duplicate.id });
      });
      destinationId = duplicate.id;
    } else {
      return;
    }

    state.selectedMixerTrackId = destinationId;
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast(`${name} duplicated`);
  }

  function openArrangementAssetInEditor(type, id) {
    if (!type || !id) return;
    if (type === "mel") {
      captureCurrentMel();
      if (!getMel(id)) {
        showToast("That Mel is no longer available.");
        return;
      }
      loadMel(id);
      renderMelOptions();
      renderPianoInstrumentOptions();
      renderPianoRoll();
      setWorkspaceView("piano-roll");
      return;
    }
    if (type === "pattern") {
      if (!getPattern(id)) {
        showToast("That pattern is no longer available.");
        return;
      }
      selectPattern(id);
      setWorkspaceView("sequencer");
      return;
    }
    const asset = getArrangementAsset(type, id);
    if (asset && state.audioAssets.includes(asset)) {
      void openAudioAssetInPianoRoll(asset);
      return;
    }
    const track = state.arrangementTracks.find((candidate) =>
      candidate.clips.some((clip) => clip.id === id));
    if (track) void openAudioClipInPianoRoll(track.id, id);
    else showToast("That audio asset is no longer available.");
  }

  function renderRecordingBrowser() {
    const browser = $("#recording-browser");
    browser.replaceChildren();
    const roots = [];
    const rootKeys = new Set();
    const addRoot = (root, track = null, fullSource = false, assetOnly = false) => {
      const sourceId = root?.segmentSourceAssetId
        ? root.segmentSourceAssetId
        : root?.isSourceAudioAsset
          ? root.sourceAssetId
          : root?.sourceAssetId || root?.assetId || root?.id;
      if (!sourceId || rootKeys.has(sourceId)) return;
      rootKeys.add(sourceId);
      roots.push({ track, clip: root, fullSource, assetOnly });
    };
    state.arrangementTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.segmentSourceAssetId) return;
        if (clip.isMelSlice) addRoot(clip, track, true, false);
        else addRoot(clip, track, false, false);
      });
    });
    state.audioAssets.forEach((asset) => {
      if (asset.segmentSourceAssetId) return;
      addRoot(asset, null, false, true);
    });
    $("#recording-source-count").textContent = String(roots.length);
    if (!roots.length) {
      const empty = document.createElement("div");
      empty.className = "recording-source-empty";
      empty.textContent = "No audio imported yet";
      browser.append(empty);
      return;
    }
    roots.forEach(({ track, clip, fullSource, assetOnly = false }) => {
      const sourceId = clip.segmentSourceAssetId
        ? clip.segmentSourceAssetId
        : clip.isSourceAudioAsset
          ? clip.sourceAssetId
          : clip.sourceAssetId || clip.assetId || clip.id;
      const sourceKeys = new Set([sourceId, clip.id, clip.assetId, clip.sourceAssetId].filter(Boolean));
      const segments = state.audioAssets.filter((asset) =>
        sourceKeys.has(asset.segmentSourceAssetId));
      const item = document.createElement("button");
      item.className = "recording-source";
      item.type = "button";
      item.draggable = true;
      item.dataset.assetType = "audio";
      item.dataset.assetId = clip.id;
      item.classList.toggle(
        "is-selected",
        state.selectedAsset?.type === "audio" && state.selectedAsset.id === clip.id,
      );
      item.title = assetOnly
        ? `Drag ${clip.name} to Track View`
        : fullSource
        ? `Drag the original ${clip.name || track.name} source to Track View`
        : `Drag ${clip.name || track.name} to Track View`;
      const color = document.createElement("span");
      color.className = "source-color";
      color.style.background = track?.color || "#b5a0ff";
      const name = document.createElement("span");
      name.className = "recording-source-name";
      name.textContent = clip.name || track.name;
      const count = document.createElement("span");
      count.className = "recording-source-count";
      count.textContent = assetOnly ? "Audio" : track.name;
      item.append(color, name, count);
      item.addEventListener("click", () => setSelectedAsset({
        type: "audio",
        id: clip.id,
        clipId: clip.id,
        sourceTrackId: track?.id || "",
        fullSource,
        assetOnly,
        name: clip.name || track?.name || "Audio",
      }));
      item.addEventListener("dragstart", (event) => {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData("application/x-pulsegrid-audio-source", JSON.stringify({
          sourceTrackId: track?.id || "",
          clipId: clip.id,
          fullSource,
          assetOnly,
        }));
        event.dataTransfer.effectAllowed = "copy";
      });
      item.addEventListener("contextmenu", (event) => openAssetContextMenu("audio", clip.id, event));
      if (!fullSource && !assetOnly) item.addEventListener("click", () => {
        setArrangementCursor(clip.startBar);
        $("#timeline-scroll").scrollLeft = clip.startBar * BAR_WIDTH;
        $("#source-browser-dialog").close();
      });
      if (!segments.length) {
        browser.append(item);
        return;
      }
      const group = document.createElement("details");
      group.className = "recording-source-group";
      group.open = false;
      const summary = document.createElement("summary");
      summary.className = "recording-source";
      summary.draggable = true;
      summary.title = `Click to show ${segments.length} segment${segments.length === 1 ? "" : "s"}; drag to Track View`;
      summary.addEventListener("dragstart", (event) => {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData("application/x-pulsegrid-audio-source", JSON.stringify({
          sourceTrackId: track?.id || "",
          clipId: clip.id,
          fullSource,
          assetOnly,
        }));
        event.dataTransfer.effectAllowed = "copy";
      });
      summary.addEventListener("contextmenu", (event) => openAssetContextMenu("audio", clip.id, event));
      const summaryColor = document.createElement("span");
      summaryColor.className = "source-color";
      summaryColor.style.background = track?.color || "#b5a0ff";
      const summaryName = document.createElement("span");
      summaryName.className = "recording-source-name";
      summaryName.textContent = clip.name || track?.name;
      const summaryCount = document.createElement("span");
      summaryCount.className = "recording-source-count";
      summaryCount.textContent = `${segments.length} segment${segments.length === 1 ? "" : "s"}`;
      summary.append(summaryColor, summaryName, summaryCount);
      group.append(summary);
      segments
        .slice()
        .sort((left, right) => (left.segmentStartSeconds || 0) - (right.segmentStartSeconds || 0))
        .forEach((segment) => {
          const segmentItem = document.createElement("button");
          segmentItem.className = "recording-source recording-source-segment";
          segmentItem.type = "button";
          segmentItem.draggable = true;
          segmentItem.title = `Drag ${segment.name} to Track View`;
          const segmentName = document.createElement("span");
          segmentName.className = "recording-source-name";
          segmentName.textContent = segment.name;
          const segmentKind = document.createElement("span");
          segmentKind.className = "recording-source-count";
          segmentKind.textContent = "Segment";
          segmentItem.append(segmentName, segmentKind);
          segmentItem.addEventListener("dragstart", (event) => {
            if (!event.dataTransfer) return;
            event.dataTransfer.setData("application/x-pulsegrid-audio-source", JSON.stringify({
              sourceTrackId: "",
              clipId: segment.id,
              fullSource: false,
              assetOnly: true,
            }));
            event.dataTransfer.effectAllowed = "copy";
          });
          segmentItem.addEventListener("contextmenu", (event) =>
            openAssetContextMenu("audio", segment.id, event));
          group.append(segmentItem);
        });
      browser.append(group);
    });
  }

  let assetLibraryDialogHome = null;
  let trackAssetLaneHome = null;

  function isTrackAssetLibraryOpen() {
    return Boolean(trackAssetLaneHome);
  }

  function closeTrackAssetLibrary() {
    if (!trackAssetLaneHome) return;
    stopInstrumentSoundPreview();
    const sidebar = $(".source-sidebar");
    const lane = $("#track-view-asset-lane");
    const { parent, nextSibling } = trackAssetLaneHome;
    parent.insertBefore(sidebar, nextSibling?.parentNode === parent ? nextSibling : null);
    lane.hidden = true;
    $("#track-asset-resizer").hidden = true;
    trackAssetLaneHome = null;
  }

  function prepareAssetLibrary() {
    captureCurrentPattern();
    captureCurrentMel();
    renderArrangementAssetBrowser();
    renderRecordingBrowser();
    renderVstBrowser();
    renderInstrumentBrowser("", true);
    filterAssetLibrary();
  }

  function openTrackAssetLibrary() {
    if (trackAssetLaneHome) {
      closeTrackAssetLibrary();
      return;
    }
    if ($("#source-browser-dialog").open) $("#source-browser-dialog").close();
    prepareAssetLibrary();
    const sidebar = $(".source-sidebar");
    const lane = $("#track-view-asset-lane");
    trackAssetLaneHome = { parent: sidebar.parentElement, nextSibling: sidebar.nextSibling };
    lane.append(sidebar);
    lane.hidden = false;
    $("#track-asset-resizer").hidden = false;
    setTrackAssetLibraryWidth(state.trackAssetLibraryWidth, false);
  }

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
    closeTrackAssetLibrary();
    prepareAssetLibrary();
    const dialog = $("#source-browser-dialog");
    dialog.classList.remove("is-docked");
    document.body.classList.remove("asset-library-docked");
    if (!dialog.open) dialog.show();
    syncAssetLibraryDialogFullscreen();
  }

  function openDockedAssetLibrary() {
    closeTrackAssetLibrary();
    prepareAssetLibrary();
    const dialog = $("#source-browser-dialog");
    dialog.classList.add("is-docked");
    document.body.classList.add("asset-library-docked");
    if (!dialog.open) dialog.show();
  }

  function routePatternLaneToMixer(trackId) {
    const mixerIndex = getMixerSourceTracks().findIndex(({ track }) => track.id === trackId);
    if (mixerIndex < 0) return;
    while (state.effectTracks.length <= mixerIndex) {
      const number = state.effectTracks.length + 1;
      state.effectTracks.push(makeMixerBusTrack("mixer-effects", {
        id: makeId(),
        name: `Mixer ${String(number).padStart(2, "0")}`,
      }));
    }
    state.effectTracks.forEach((bus) => {
      bus.routedTrackIds = bus.routedTrackIds.filter((id) => id !== trackId);
    });
    state.effectTracks[mixerIndex].routedTrackIds = [trackId];
    if (state.audioContext) rebuildMixerAudioRouting();
  }

  function syncPatternLanesToMixer() {
    let changed = false;
    getMixerSourceTracks().forEach(({ track, type }, mixerIndex) => {
      if (type !== "Pattern") return;
      while (state.effectTracks.length <= mixerIndex) {
        const number = state.effectTracks.length + 1;
        state.effectTracks.push(makeMixerBusTrack("mixer-effects", {
          id: makeId(),
          name: `Mixer ${String(number).padStart(2, "0")}`,
        }));
      }
      const target = state.effectTracks[mixerIndex];
      if (target.routedTrackIds.length === 1 && target.routedTrackIds[0] === track.id &&
        state.effectTracks.every((bus) => bus === target || !bus.routedTrackIds.includes(track.id))) return;
      state.effectTracks.forEach((bus) => {
        bus.routedTrackIds = bus.routedTrackIds.filter((id) => id !== track.id);
      });
      target.routedTrackIds = [track.id];
      changed = true;
    });
    if (changed && state.audioContext) rebuildMixerAudioRouting();
  }

  function addPatternClip(startBar = state.arrangementCursor, patternId = state.selectedPatternId, trackId = patternId) {
    const pattern = getPattern(patternId);
    if (!pattern) return;
    const trackPattern = getPattern(trackId);
    const trackHasClips = state.patternClips.some((clip) => (clip.trackId || clip.patternId) === trackId);
    if (trackPattern && !trackHasClips) {
      trackPattern.name = pattern.name;
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
    routePatternLaneToMixer(trackId);
    state.patternClips.sort((left, right) => left.startBar - right.startBar);
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast("Drum pattern added to the arrangement");
  }

  function addPatternComponentClip(startBar, patternId, trackId) {
    if (!createPatternComponentClip(startBar, patternId, trackId)) return false;
    updateArrangementLength();
    renderArrangement();
    saveState();
    return true;
  }

  function createPatternComponentClip(startBar, patternId, trackId) {
    const component = makePatternComponentSnapshot(patternId, trackId);
    if (!component) {
      showToast("That pattern component is no longer available.");
      return null;
    }
    component.insertAfterTrackId = getLastArrangementTrackId();
    state.patterns.push(component);
    state.patternClips.push({
      id: makeId(),
      patternId: component.id,
      trackId: component.id,
      repeatCount: 1,
      sourceOffsetBars: 0,
      startBar: clampArrangementStart(startBar, component.steps / 16),
    });
    routePatternLaneToMixer(component.id);
    return component;
  }

  function drawPatternComponentsIntoTrack(patternId, startBar = state.arrangementCursor) {
    const pattern = getPattern(patternId);
    if (!pattern) return;
    const trackIds = getPatternTrackIds(pattern);
    if (!trackIds.length) {
      showToast("This pattern has no instrument rows to draw.");
      return;
    }
    let added = 0;
    trackIds.forEach((trackId) => {
      if (createPatternComponentClip(startBar, pattern.id, trackId)) added += 1;
    });
    if (added) {
      updateArrangementLength();
      renderArrangement();
      saveState();
      showToast(`Added ${added} ${pattern.name} component${added === 1 ? "" : "s"} to Track View`);
    }
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
    if (!track.clips.length) {
      track.name = mel.name;
      track.instrumentId = mel.instrumentId;
    }
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

  function addAudioAssetClip(sourceTrackId, clipId, destinationTrackId, startBar, fullSource = false) {
    const sourceTrack = state.arrangementTracks.find((track) => track.id === sourceTrackId);
    const sourceClip = sourceTrack?.clips.find((clip) => clip.id === clipId) ||
      state.audioAssets.find((asset) => asset.id === clipId);
    if (!sourceTrack || !sourceClip) {
      if (!sourceClip) {
        showToast("That audio asset is no longer available.");
        return;
      }
    }
    const clip = {
      ...sourceClip,
      id: makeId(),
      assetId: sourceClip.assetId || sourceClip.id,
    };
    if (fullSource) {
      clip.durationSeconds = clip.buffer.duration;
      clip.sourceOffsetSeconds = 0;
      clip.repeatCount = 1;
      clip.clipGain = 1;
      clip.fadeInSeconds = 0;
      clip.fadeOutSeconds = 0;
      clip.reversed = false;
      delete clip.repeatStartSeconds;
      delete clip.repeatLengthSeconds;
      delete clip.isMelSlice;
      delete clip.sourceAssetId;
    }
    if (sourceClip.segmentSourceAssetId) {
      clip.assetId = sourceClip.assetId || sourceClip.id;
      clip.sourceAssetId = sourceClip.segmentSourceAssetId;
    }
    clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("audio", clip));
    const destination = state.arrangementTracks.find((track) => track.id === destinationTrackId)
      || createArrangementTrack(clip.name || sourceTrack?.name);
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
      name: currentSource.name,
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

