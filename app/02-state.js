  let pianoNoteContextTargetIds = [];
  let pianoDragPreviewSequence = 0;
  function normalizeTrackAutomation(automation) {
    const result = {};
    [["volume", 0, 1], ["pan", -1, 1]].forEach(([property, minimum, maximum]) => {
      const points = Array.isArray(automation?.[property]) ? automation[property]
        .filter((point) => Number.isFinite(point?.bar) && Number.isFinite(point?.value))
        .slice(0, 512)
        .map((point) => ({
          bar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS, point.bar)),
          value: Math.max(minimum, Math.min(maximum, point.value)),
        }))
        .sort((left, right) => left.bar - right.bar)
        : [];
      result[property] = points.reduce((unique, point) => {
        if (unique.length && unique[unique.length - 1].bar === point.bar) unique[unique.length - 1] = point;
        else unique.push(point);
        return unique;
      }, []);
    });
    return result;
  }

  function hasTrackAutomation(automation) {
    return ["volume", "pan"].some((property) => Array.isArray(automation?.[property]) && automation[property].length > 0);
  }

  const state = {
    tracks: [],
    patterns: [],
    selectedPatternId: null,
    arrangementTracks: [],
    patternClips: [],
    arrangementScale: 1,
    mels: [],
    selectedMelId: null,
    melTracks: [],
    pianoNotes: [],
    pianoStartBar: 0,
    pianoCursorTick: 0,
    pianoLoopEnabled: false,
    pianoLoopStartBar: 0,
    pianoLoopEndBar: 4,
    pianoPlaybackStartTick: 0,
    pianoBars: 4,
    pianoScale: 1,
    pianoDrawMode: false,
    stepPianoEditContext: null,
    pianoSnap: 2,
    pianoSnapEnabled: true,
    pianoNoteLength: 2,
    soundDurationEdits: {},
    soundReverseEdits: {},
    selectedPianoTrackId: "piano-grand",
    selectedPianoNoteId: null,
    selectedPianoNoteIds: new Set(),
    selectedArrangementItems: new Set(),
    selectedStepCells: new Set(),
    sequencerScale: 1,
    selectedMixerTrackId: null,
    selectedMixerEffectId: null,
    mixerRoutingDialogTrackId: null,
    arrangementDrag: null,
    mixerMeterAnimation: null,
    mixerEffectAnimation: null,
    mixerEffectDialogTrackId: null,
    clipboard: null,
    projectId: "default",
    projectName: "Untitled session",
    projects: [],
    users: [],
    currentUser: null,
    activeProjectIds: {},
    suppressArrangementClick: false,
    pianoSelectionFromMarquee: false,
    arrangementSelectionFromMarquee: false,
    workspaceRatio: 50,
    workspaceHidden: false,
    trackViewHidden: false,
    scheduledPianoNotes: new Set(),
    scheduledArrangementSteps: new Set(),
    scheduledArrangementClicks: new Set(),
    arrangementLoopIteration: 0,
    preScheduledArrangementIteration: null,
    liveRecordedHits: new Set(),
    keyboardRecording: null,
    keyboardRecordingCountdown: null,
    suppressPianoGridClick: false,
    steps: 16,
    view: "arrangement",
    bpm: 124,
    swing: 0,
    arrangementBars: 32,
    arrangementCursor: 0,
    arrangementLoopEnabled: false,
    arrangementLoopStartBar: 0,
    arrangementLoopEndBar: 4,
    arrangementSnap: true,
    arrangementSources: new Set(),
    isSchedulingArrangementVoice: false,
    isStartingPlayback: false,
    playbackRequestId: 0,
    playbackStartTime: 0,
    playbackStartBar: 0,
    playbackEndTime: 0,
    selectedPreset: "warehouse",
    isPlaying: false,
    playbackMode: "arrangement",
    isExporting: false,
    metronome: false,
    currentStep: -1,
    audioContext: null,
    masterGain: null,
    masterTrack: null,
    effectTracks: [],
    effectPresets: [],
    schedulerId: null,
    nextStepTime: 0,
    stepIndex: 0,
    stepTimers: new Set(),
    noiseBuffer: null,
    toastTimer: null,
    sampleTrackId: null,
    pendingImportTrackId: null,
    mediaRecorder: null,
    recordingStream: null,
    recordingChunks: [],
    recordingStartBar: 0,
    recordingCountdownTimer: null,
    recordingMetronomeTimer: null,
    recordingClickIndex: 0,
    nextRecordingClickTime: 0,
    recordingPreview: null,
    recordingPreviewTimer: null,
    workspacePlayers: {
      sequencer: null,
      "piano-roll": null,
    },
  };
  let stepPaint = null;
  let stepSelectionDrag = null;
  let stepSelectionAnchor = null;
  let arrangementMarqueeDeselectPending = false;
  let suppressStepClick = false;
  const undoStacks = new Map();
  const undoLatest = new Map();
  let isApplyingUndo = false;
  const collaboration = {
    socket: null,
    session: null,
    revision: 0,
    applyingRemote: false,
    localDirty: false,
    conflicted: false,
    conflictMessage: "",
    participantId: null,
    viewers: [],
    sharedSnapshot: null,
    sharedAssets: null,
    sentUpdates: new Map(),
    reconnectTimer: null,
    manualLeave: false,
    pendingCreate: null,
    applyQueue: Promise.resolve(),
  };
  const MAX_UNDO_STEPS = 50;

  const $ = (selector) => document.querySelector(selector);
  const trackList = $("#track-list");
  const stepsHeader = $("#steps-header");
  const sequencerGridScroll = $("#sequencer-grid-scroll");
  const playButton = $("#play-button");
  const tempoValue = $("#tempo-value");
  const swingSlider = $("#swing-slider");
  const sampleInput = $("#sample-input");
  const drumSamplesInput = $("#drum-samples-input");
  const toast = $("#toast");
  let stepInstrumentTargetTrackId = null;
  let stepInstrumentPickerMode = "step";
  let stepInstrumentPendingId = null;
  const librarySampleLoads = new Map();
  const reversedLibrarySampleBuffers = new WeakMap();

  function makeTracks() {
    const tracks = [...TRACKS, ...LIBRARY_TRACKS].map((definition) => {
      const cells = Array(STEP_COUNT).fill(false);
      definition.hits?.forEach((step) => { cells[step] = true; });
      return {
        ...definition, patch: definition.patch ? { ...definition.patch } : definition.patch,
        cells, variant: definition.variant || "classic", muted: false, solo: false, pitch: 0, swing: null,
        sample: null, gainNode: null, effects: makeDefaultEffects(),
      };
    });
    tracks.forEach(ensureSequencerTrackAudio);
    return tracks;
  }

  const EFFECT_NAMES = [
    ["reverb", "Reverb"], ["delay", "Delay"], ["chorus", "Chorus"], ["distortion", "Distortion"],
    ["compressor", "Compressor"], ["tremolo", "Tremolo"], ["bitcrusher", "Bitcrusher"],
    ["pitchShifter", "Pitch shifter"], ["harmonizer", "Harmonizer"], ["noiseGate", "Noise gate"],
    ["vocoder", "Vocoder"], ["transientShaper", "Transient shaper"], ["autopan", "Auto-pan"],
    ["phaser", "Phaser"],
  ];
  const EFFECT_PARAMETERS = {
    reverb: [["decay", "Decay", 0.2, 6, 0.1, " s", 1.8], ["preDelay", "Pre-delay", 0, 100, 1, " ms", 20]],
    delay: [["time", "Time", 0.05, 1, 0.01, " s", 0.28], ["feedback", "Feedback", 0, 90, 1, "%", 42]],
    chorus: [["rate", "Rate", 0.05, 5, 0.05, " Hz", 0.28], ["depth", "Depth", 1, 30, 1, " ms", 12]],
    distortion: [["drive", "Drive", 1, 20, 0.5, "×", 8]],
    compressor: [["threshold", "Threshold", -60, 0, 1, " dB", -18], ["ratio", "Ratio", 1, 20, 0.5, ":1", 4], ["attack", "Attack", 1, 100, 1, " ms", 3], ["release", "Release", 10, 1000, 10, " ms", 180]],
    tremolo: [["rate", "Rate", 0.1, 12, 0.1, " Hz", 5], ["depth", "Depth", 0, 100, 1, "%", 45]],
    bitcrusher: [["bits", "Bit depth", 2, 16, 1, " bit", 8]],
    pitchShifter: [["semitones", "Pitch", -12, 12, 1, " st", 0]],
    harmonizer: [["interval", "Interval", 1, 12, 1, " st", 7]],
    noiseGate: [["threshold", "Threshold", -70, 0, 1, " dB", -42], ["release", "Release", 10, 500, 10, " ms", 180]],
    vocoder: [["carrier", "Carrier", 55, 440, 1, " Hz", 110]],
    transientShaper: [["attack", "Attack", -12, 12, 1, " dB", 3], ["sustain", "Sustain", -12, 12, 1, " dB", -2]],
    autopan: [["rate", "Rate", 0.05, 8, 0.05, " Hz", 0.35], ["depth", "Depth", 0, 100, 1, "%", 100]],
    phaser: [["rate", "Rate", 0.05, 5, 0.05, " Hz", 0.18], ["depth", "Depth", 100, 3000, 50, " Hz", 900]],
  };
  const EFFECT_IDS = new Set(EFFECT_NAMES.map(([id]) => id));

  function makeDefaultEffects(effects) {
    const defaults = {
      eqSub: 0, eqLow: 0, eqMid: 0, eqHigh: 0, eqAir: 0,
      ...Object.fromEntries(EFFECT_NAMES.map(([id]) => [id, 0])),
    };
    if (!effects || typeof effects !== "object") return defaults;
    Object.keys(defaults).forEach((id) => {
      if (Number.isFinite(effects[id])) defaults[id] = Math.max(-12, Math.min(12, effects[id]));
    });
    EFFECT_NAMES.forEach(([id]) => { defaults[id] = Math.max(0, Math.min(100, defaults[id])); });
    return defaults;
  }

  function makeDefaultEffectSettings(settings) {
    return Object.fromEntries(Object.entries(EFFECT_PARAMETERS).map(([effectId, parameters]) => [
      effectId,
      Object.fromEntries(parameters.map(([id, , min, max, , , defaultValue]) => {
        const savedValue = settings?.[effectId]?.[id];
        return [id, Number.isFinite(savedValue) ? Math.max(min, Math.min(max, savedValue)) : defaultValue];
      })),
    ]));
  }

  function ensureTrackMixerState(track) {
    track.volume = Number.isFinite(track.volume) ? Math.max(0, Math.min(1, track.volume)) : 1;
    track.pan = Number.isFinite(track.pan) ? Math.max(-1, Math.min(1, track.pan)) : 0;
    track.effects = makeDefaultEffects(track.effects);
    track.effectSettings = makeDefaultEffectSettings(track.effectSettings);
    const activeEffects = Array.isArray(track.effectChain)
      ? track.effectChain.filter((id) => EFFECT_IDS.has(id))
      : EFFECT_NAMES.filter(([id]) => track.effects[id] > 0).map(([id]) => id);
    track.effectChain = [...new Set(activeEffects)];
    return track.effectChain;
  }

  function makeMixerBusTrack(kind, saved = {}) {
    const isMaster = kind === "mixer-master";
    return {
      id: isMaster ? MASTER_MIXER_TRACK_ID : saved.id || makeId(),
      name: isMaster ? "Master" : (typeof saved.name === "string" && saved.name.trim() ? saved.name : "Effects Track"),
      kind,
      volume: Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : 1,
      pan: Number.isFinite(saved.pan) ? Math.max(-1, Math.min(1, saved.pan)) : 0,
      muted: false,
      solo: false,
      gainNode: null,
      effects: makeDefaultEffects(saved.effects),
      effectSettings: makeDefaultEffectSettings(saved.effectSettings),
      effectChain: Array.isArray(saved.effectChain) ? saved.effectChain : undefined,
      ...(isMaster ? {} : {
        routedTrackIds: Array.isArray(saved.routedTrackIds)
          ? [...new Set(saved.routedTrackIds.filter((trackId) => typeof trackId === "string"))]
          : [],
      }),
    };
  }

  state.masterTrack = makeMixerBusTrack("mixer-master");

