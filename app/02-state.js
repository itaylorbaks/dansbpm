  let pianoNoteContextTargetIds = [];
  let pianoDragPreviewSequence = 0;
  function normalizeTrackAutomation(automation) {
    const result = {};
    [["volume", 0, 1], ["pan", -1, 1]].forEach(([property, minimum, maximum]) => {
      const usedIds = new Set();
      const points = Array.isArray(automation?.[property]) ? automation[property]
        .filter((point) => Number.isFinite(point?.bar) && Number.isFinite(point?.value))
        .slice(0, 512)
        .map((point, index) => {
          let id = typeof point.id === "string" && point.id.length <= 128 ? point.id : "";
          if (!id || usedIds.has(id)) {
            id = `automation-${property}-${index}`;
            let suffix = 1;
            while (usedIds.has(id)) id = `automation-${property}-${index}-${suffix++}`;
          }
          usedIds.add(id);
          return {
            id,
            bar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS, point.bar)),
            value: Math.max(minimum, Math.min(maximum, point.value)),
          };
        })
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

  function normalizeSoundProcessingEdits(edits = {}) {
    const clamp = (value, minimum, maximum, fallback) =>
      Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
    const trimStart = Math.round(clamp(edits.trimStart, 0, 99, 0));
    return {
      normalize: edits.normalize === true,
      reversePolarity: edits.reversePolarity === true,
      swapStereo: edits.swapStereo === true,
      fadeIn: clamp(edits.fadeIn, 0, 50, 0),
      fadeOut: clamp(edits.fadeOut, 0, 50, 0),
      playbackStartOffset: clamp(edits.playbackStartOffset, 0, 5000, 0),
      sampleStart: clamp(edits.sampleStart, 0, 100, 0),
      trimStart,
      trimEnd: Math.max(trimStart + 1, Math.round(clamp(edits.trimEnd, 1, 100, 100))),
      arpeggiatorLength: Math.round(clamp(edits.arpeggiatorLength, 1, 16, 1)),
      crossfade: clamp(edits.crossfade, 0, 500, 0),
      pitch: clamp(edits.pitch, -12, 12, 0),
      playbackMultiplier: clamp(edits.playbackMultiplier, 0.25, 4, 1),
      time: clamp(edits.time, 25, 400, 100),
      boost: clamp(edits.boost, -12, 24, 0),
      reverb: clamp(edits.reverb, 0, 100, 0),
      eqLowHz: clamp(edits.eqLowHz, 30, 250, 120),
      eqLowGain: clamp(edits.eqLowGain, -12, 12, 0),
      eqMidHz: clamp(edits.eqMidHz, 250, 4000, 1000),
      eqMidGain: clamp(edits.eqMidGain, -12, 12, 0),
      eqHighHz: clamp(edits.eqHighHz, 2000, 18000, 8000),
      eqHighGain: clamp(edits.eqHighGain, -12, 12, 0),
    };
  }

  const state = {
    tracks: [],
    patterns: [],
    selectedPatternId: null,
    arrangementTracks: [],
    audioAssets: [],
    patternClips: [],
    arrangementScale: 1,
    mels: [],
    selectedMelId: null,
    pianoRollAudioClipId: null,
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
    pianoScaleRoot: 0,
    pianoScaleType: "major",
    pianoScaleLock: false,
    soundDurationEdits: {},
    soundReverseEdits: {},
    soundProcessingEdits: {},
    favoriteSoundIds: [],
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
    projectName: "New Proj 1",
    projects: [],
    projectCreationCounts: {},
    users: [],
    currentUser: null,
    activeProjectIds: {},
    suppressArrangementClick: false,
    pianoSelectionFromMarquee: false,
    arrangementSelectionFromMarquee: false,
    workspaceRatio: 50,
    workspaceHidden: false,
    trackViewHidden: false,
    lastInteractedViewArea: "track-view",
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
    masterPitch: 0,
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
    masterLimiter: null,
    masterPitchNode: null,
    masterPitchSupported: null,
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
  const redoStacks = new Map();
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
    locks: [],
    editScope: null,
    pendingScope: null,
    hostName: "",
    lastUpdatedBy: "",
    lastUpdatedAt: null,
    lastRoomCode: "",
    activityLog: [],
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
  const stepInstrumentUploadInput = $("#step-instrument-upload-input");
  const toast = $("#toast");
  let stepInstrumentTargetTrackId = null;
  let stepInstrumentPickerMode = "step";
  let stepInstrumentPendingId = null;
  const librarySampleLoads = new Map();
  const masterPitchProcessorModules = new WeakMap();
  const masterPitchProcessorSetups = new WeakMap();
  const masterPitchDirectConnections = new WeakSet();
  const processedLibrarySampleBuffers = new WeakMap();
  const soundProcessingOutputNodes = new WeakMap();

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
    tracks.filter((track) => !track.libraryOnly).forEach(ensureSequencerTrackAudio);
    return tracks;
  }

  const EFFECT_CATEGORIES = [
    { name: "Flanger", effects: [["flanger", "Flanger"], ["chorus", "Chorus"], ["phaser", "Phaser"], ["vibrato", "Vibrato"]] },
    { name: "Gain", effects: [["gain", "Gain"], ["distortion", "Distortion"], ["guitarDistortion", "Guitar Distortion"], ["bloodOverdrive", "Blood Overdrive"], ["saturator", "Saturator"], ["softClipper", "Soft clipper"]] },
    { name: "Delay", effects: [["delay", "Delay"], ["delayBank", "Delay Bank"], ["pingPong", "Ping-pong delay"], ["slapback", "Slapback"], ["tapeDelay", "Tape delay"]] },
    { name: "Reverb", effects: [["reverb", "Reverb"], ["room", "Room"], ["hall", "Hall"], ["plate", "Plate"]] },
    { name: "Controllers", effects: [["autopan", "Auto-pan"], ["panOMatic", "PanOMatic"], ["grossBeat", "Gross Beat"], ["tremolo", "Tremolo"], ["autoFilter", "Auto-filter"], ["lfoGain", "LFO gain"]] },
    { name: "Dynamics", effects: [["compressor", "Compressor"], ["multibandCompressor", "Multiband compressor"], ["limiter", "Limiter"], ["noiseGate", "Noise gate"], ["transientShaper", "Transient shaper"], ["sidechain", "Sidechain"], ["crossfadeLimiter", "Crossfade limiter"]] },
    { name: "Miscellaneous", effects: [["bitcrusher", "Bitcrusher"], ["pitchShifter", "Pitch shifter"], ["harmonizer", "Harmonizer"], ["vocoder", "Vocoder"]] },
    { name: "Stereo tools", effects: [["stereoEnhancer", "Stereo Enhancer"], ["midSideMonitor", "Mid/side monitor"], ["midSidePanner", "Mid/side panner"], ["midSideFilter", "Mid/side filter"], ["midSideEq", "Mid/side EQ"]] },
    { name: "Vocoder", effects: [["vocoder3Band", "3-band vocoder"]] },
    { name: "Equalization", effects: [["steepEq", "Steep EQ"]] },
  ];
  const EFFECT_NAMES = EFFECT_CATEGORIES.flatMap(({ effects }) => effects);
  const EFFECT_PARAMETERS = {
    reverb: [["decay", "Decay", 0.2, 6, 0.1, " s", 1.8], ["preDelay", "Pre-delay", 0, 100, 1, " ms", 20]],
    room: [["decay", "Decay", 0.1, 2.5, 0.1, " s", 0.7], ["preDelay", "Pre-delay", 0, 60, 1, " ms", 8]],
    hall: [["decay", "Decay", 1, 8, 0.1, " s", 3.2], ["preDelay", "Pre-delay", 0, 120, 1, " ms", 35]],
    plate: [["decay", "Decay", 0.3, 5, 0.1, " s", 2.2], ["preDelay", "Pre-delay", 0, 100, 1, " ms", 15]],
    delay: [["time", "Time", 0.05, 1, 0.01, " s", 0.28], ["feedback", "Feedback", 0, 90, 1, "%", 42]],
    pingPong: [["time", "Time", 0.05, 1, 0.01, " s", 0.32], ["feedback", "Feedback", 0, 90, 1, "%", 45]],
    slapback: [["time", "Time", 0.03, 0.25, 0.005, " s", 0.11], ["feedback", "Feedback", 0, 60, 1, "%", 18]],
    tapeDelay: [["time", "Time", 0.05, 1, 0.01, " s", 0.36], ["feedback", "Feedback", 0, 90, 1, "%", 48]],
    chorus: [["rate", "Rate", 0.05, 5, 0.05, " Hz", 0.28], ["depth", "Depth", 1, 30, 1, " ms", 12]],
    flanger: [["rate", "Rate", 0.05, 5, 0.05, " Hz", 0.22], ["depth", "Depth", 0.1, 10, 0.1, " ms", 3], ["feedback", "Feedback", -90, 90, 1, "%", 20]],
    vibrato: [["rate", "Rate", 0.1, 10, 0.1, " Hz", 5], ["depth", "Depth", 1, 20, 1, " ms", 5]],
    gain: [["gainDb", "Gain", -24, 24, 0.5, " dB", 6]],
    distortion: [["drive", "Drive", 1, 20, 0.5, "×", 8]],
    guitarDistortion: [
      ["drive", "Drive", 1, 30, 0.5, "×", 8],
      ["tone", "Tone", 200, 12000, 100, " Hz", 4200],
      ["level", "Level", -24, 6, 0.5, " dB", -6],
    ],
    bloodOverdrive: [
      ["drive", "Drive", 1, 30, 0.5, "×", 10],
      ["tone", "Tone", 200, 12000, 100, " Hz", 5200],
      ["bias", "Bias", -0.5, 0.5, 0.01, "", 0.08],
      ["level", "Level", -24, 6, 0.5, " dB", -8],
    ],
    grossBeat: [
      ["rate", "Rate", 0.5, 4, 0.25, "× beat", 1],
      ["gate", "Chop", 0, 100, 1, "%", 55],
      ["feedback", "Repeat", 0, 80, 1, "%", 35],
    ],
    stereoEnhancer: [
      ["width", "Width", 0, 200, 1, "%", 125],
      ["bassMono", "Bass mono", 40, 500, 10, " Hz", 120],
    ],
    delayBank: [
      ["time", "Time", 0.05, 0.8, 0.01, " s", 0.24],
      ["feedback", "Feedback", 0, 80, 1, "%", 34],
      ["spread", "Spread", 0, 100, 1, "%", 65],
    ],
    panOMatic: [
      ["rate", "Rate", 0.05, 8, 0.05, " Hz", 0.35],
      ["depth", "Depth", 0, 100, 1, "%", 100],
      ["phase", "Phase", 0, 180, 1, "°", 0],
    ],
    saturator: [["drive", "Drive", 1, 12, 0.5, "×", 3]],
    softClipper: [["drive", "Drive", 1, 12, 0.5, "×", 2]],
    compressor: [["threshold", "Threshold", -60, 0, 1, " dB", -18], ["ratio", "Ratio", 1, 20, 0.5, ":1", 4], ["attack", "Attack", 1, 100, 1, " ms", 3], ["release", "Release", 10, 1000, 10, " ms", 180]],
    sidechain: [],
    multibandCompressor: [
      ["lowCrossover", "Low crossover", 60, 400, 10, " Hz", 180],
      ["highCrossover", "High crossover", 800, 8000, 100, " Hz", 3500],
      ["lowThreshold", "Low threshold", -60, 0, 1, " dB", -20],
      ["lowRatio", "Low ratio", 1, 20, 0.5, ":1", 3],
      ["midThreshold", "Mid threshold", -60, 0, 1, " dB", -18],
      ["midRatio", "Mid ratio", 1, 20, 0.5, ":1", 3],
      ["highThreshold", "High threshold", -60, 0, 1, " dB", -16],
      ["highRatio", "High ratio", 1, 20, 0.5, ":1", 2],
      ["attack", "Attack", 1, 100, 1, " ms", 10],
      ["release", "Release", 10, 1000, 10, " ms", 180],
      ["lowGain", "Low makeup", -12, 12, 0.5, " dB", 0],
      ["midGain", "Mid makeup", -12, 12, 0.5, " dB", 0],
      ["highGain", "High makeup", -12, 12, 0.5, " dB", 0],
    ],
    limiter: [["threshold", "Ceiling", -12, 0, 0.1, " dB", -1], ["release", "Release", 10, 500, 10, " ms", 80]],
    tremolo: [["rate", "Rate", 0.1, 12, 0.1, " Hz", 5], ["depth", "Depth", 0, 100, 1, "%", 45]],
    autoFilter: [["rate", "Rate", 0.05, 8, 0.05, " Hz", 0.4], ["depth", "Depth", 100, 8000, 100, " Hz", 2200]],
    lfoGain: [["rate", "Rate", 0.05, 12, 0.05, " Hz", 2], ["depth", "Depth", 0, 100, 1, "%", 50]],
    bitcrusher: [["bits", "Bit depth", 2, 16, 1, " bit", 8]],
    pitchShifter: [["semitones", "Pitch", -12, 12, 1, " st", 0]],
    harmonizer: [["interval", "Interval", 1, 12, 1, " st", 7]],
    noiseGate: [["threshold", "Threshold", -70, 0, 1, " dB", -42], ["release", "Release", 10, 500, 10, " ms", 180]],
    vocoder: [["carrier", "Carrier", 55, 440, 1, " Hz", 110]],
    transientShaper: [["attack", "Attack", -12, 12, 1, " dB", 3], ["sustain", "Sustain", -12, 12, 1, " dB", -2]],
    autopan: [["rate", "Rate", 0.05, 8, 0.05, " Hz", 0.35], ["depth", "Depth", 0, 100, 1, "%", 100]],
    phaser: [["rate", "Rate", 0.05, 5, 0.05, " Hz", 0.18], ["depth", "Depth", 100, 3000, 50, " Hz", 900]],
    crossfadeLimiter: [
      ["depth", "Duck depth", 0, 80, 1, "%", 45],
      ["threshold", "Ceiling", -12, 0, 0.1, " dB", -1],
      ["release", "Release", 10, 500, 10, " ms", 120],
    ],
    midSidePanner: [["width", "Side width", 0, 200, 1, "%", 100], ["pan", "Pan", -100, 100, 1, "%", 0]],
    midSideFilter: [
      ["midCutoff", "Mid low-pass", 100, 8000, 10, " Hz", 800],
      ["sideCutoff", "Side high-pass", 50, 8000, 10, " Hz", 800],
      ["order", "Slope", 1, 4, 1, "", 2],
    ],
    midSideEq: [
      ["midSub", "Mid sub", -12, 12, 0.5, " dB", 0],
      ["midLow", "Mid low", -12, 12, 0.5, " dB", 0],
      ["midMid", "Mid mid", -12, 12, 0.5, " dB", 0],
      ["midHigh", "Mid high", -12, 12, 0.5, " dB", 0],
      ["midAir", "Mid air", -12, 12, 0.5, " dB", 0],
      ["sideSub", "Side sub", -12, 12, 0.5, " dB", 0],
      ["sideLow", "Side low", -12, 12, 0.5, " dB", 0],
      ["sideMid", "Side mid", -12, 12, 0.5, " dB", 0],
      ["sideHigh", "Side high", -12, 12, 0.5, " dB", 0],
      ["sideAir", "Side air", -12, 12, 0.5, " dB", 0],
    ],
    vocoder3Band: [
      ["lowCrossover", "Low crossover", 100, 1000, 10, " Hz", 300],
      ["highCrossover", "High crossover", 800, 8000, 50, " Hz", 3000],
      ["envelopeRelease", "Envelope release", 10, 300, 5, " ms", 80],
    ],
    steepEq: [
      ["frequency", "Frequency", 20, 20000, 10, " Hz", 1000],
      ["gain", "Gain", -12, 12, 0.5, " dB", 0],
      ["q", "Width", 0.2, 12, 0.1, "", 1],
      ["order", "Order", 1, 4, 1, "", 4],
    ],
  };
  const EFFECT_IDS = new Set(EFFECT_NAMES.map(([id]) => id));
  const FL_PRESET_SOURCE = "https://github.com/MysteryPancake/FL-Studio-Presets";
  const MIXER_PRESETS = [
    {
      id: "doom-compressor", name: "Doom Compressor",
      description: "Parallel native compression with a restrained blend to keep transients intact.",
      source: FL_PRESET_SOURCE,
      effects: { compressor: 35 },
      effectSettings: { compressor: { threshold: -18, ratio: 6, attack: 8, release: 160 } },
      effectChain: ["compressor"],
    },
    {
      id: "doom-compressor-2", name: "Doom Compressor 2",
      description: "A gentler compressor/transient-shaper chain with independent attack and sustain controls.",
      source: FL_PRESET_SOURCE,
      effects: { compressor: 25, transientShaper: 20 },
      effectSettings: {
        compressor: { threshold: -18, ratio: 4, attack: 15, release: 220 },
        transientShaper: { attack: 2, sustain: -1 },
      },
      effectChain: ["compressor", "transientShaper"],
    },
    {
      id: "good-master", name: "Good Master",
      description: "The app's master output limiter is already active; this preset adds no extra limiting.",
      source: FL_PRESET_SOURCE,
      target: "master",
      effects: {}, effectSettings: {}, effectChain: [],
    },
    {
      id: "mid-side-monitor", name: "Mid/Side Monitor",
      description: "Pass-through stereo monitor with live mid and side level meters.",
      source: FL_PRESET_SOURCE,
      operation: "append",
      effects: { midSideMonitor: 100 }, effectSettings: {}, effectChain: ["midSideMonitor"],
    },
    {
      id: "mid-side-panner", name: "Mid/Side Panner",
      description: "Adjust stereo width and balance with a transparent neutral setting.",
      source: FL_PRESET_SOURCE,
      effects: { midSidePanner: 35 },
      effectSettings: { midSidePanner: { width: 100, pan: 0 } },
      effectChain: ["midSidePanner"],
    },
    {
      id: "mid-side-filter", name: "Mid/Side Filter",
      description: "Low-pass the center and high-pass the sides around a shared crossover.",
      source: FL_PRESET_SOURCE,
      effects: { midSideFilter: 25 },
      effectSettings: { midSideFilter: { midCutoff: 800, sideCutoff: 800, order: 2 } },
      effectChain: ["midSideFilter"],
    },
    {
      id: "mid-side-eq", name: "Mid/Side EQ",
      description: "Independent five-band mid and side equalization, initially flat.",
      source: FL_PRESET_SOURCE,
      effects: { midSideEq: 35 }, effectSettings: {}, effectChain: ["midSideEq"],
    },
    {
      id: "steep-eq", name: "Steep EQ",
      description: "Four-stage native parametric EQ with linked frequency, width, and gain.",
      source: FL_PRESET_SOURCE,
      effects: { steepEq: 35 },
      effectSettings: { steepEq: { frequency: 1000, gain: 0, q: 1, order: 4 } },
      effectChain: ["steepEq"],
    },
    {
      id: "three-band-vocoder", name: "3-Band Vocoder",
      description: "Three-band carrier/modulator vocoder. Choose a modulator track in its effect window.",
      source: FL_PRESET_SOURCE,
      effects: { vocoder3Band: 45 },
      effectSettings: { vocoder3Band: { lowCrossover: 300, highCrossover: 3000, envelopeRelease: 80 } },
      effectChain: ["vocoder3Band"],
    },
    {
      id: "three-band-vocoder-2", name: "3-Band Vocoder 2",
      description: "Three-band vocoder with steeper band separation and a faster envelope.",
      source: FL_PRESET_SOURCE,
      effects: { vocoder3Band: 45 },
      effectSettings: { vocoder3Band: { lowCrossover: 350, highCrossover: 2800, envelopeRelease: 45 } },
      effectChain: ["vocoder3Band"],
    },
    {
      id: "reverb-delay", name: "Reverb Delay",
      description: "Low-feedback delay into a short room reverb for spaced reflections.",
      source: FL_PRESET_SOURCE,
      effects: { delay: 24, room: 20 },
      effectSettings: { delay: { time: 0.18, feedback: 24 }, room: { decay: 0.5, preDelay: 8 } },
      effectChain: ["delay", "room"],
    },
    {
      id: "reverb-metallic", name: "Reverb Metallic",
      description: "Short plate reflections for a compact, metallic resonance.",
      source: FL_PRESET_SOURCE,
      effects: { plate: 30 },
      effectSettings: { plate: { decay: 0.3, preDelay: 12 } },
      effectChain: ["plate"],
    },
    {
      id: "reverb-squeaky", name: "Reverb Squeaky",
      description: "Modulated vibrato into a short room reverb; reduce either blend for a subtler effect.",
      source: FL_PRESET_SOURCE,
      effects: { vibrato: 18, room: 18 },
      effectSettings: { vibrato: { rate: 5, depth: 12 }, room: { decay: 0.5, preDelay: 10 } },
      effectChain: ["vibrato", "room"],
    },
    {
      id: "crossfade-limiter", name: "Crossfade Limiter",
      description: "Sidechain ducking plus limiting. Choose the source track in the effect window.",
      source: "https://github.com/kisoqual/crossfadelimiter",
      effects: { crossfadeLimiter: 35 },
      effectSettings: { crossfadeLimiter: { depth: 45, threshold: -1, release: 120 } },
      effectChain: ["crossfadeLimiter"],
    },
  ];

  function makeDefaultEffects(effects) {
    const defaults = {
      eqSub: 0, eqLow: 0, eqMid: 0, eqHigh: 0, eqAir: 0,
      ...Object.fromEntries(EFFECT_NAMES.map(([id]) => [id, 0])),
    };
    if (!effects || typeof effects !== "object") return defaults;
    ["eqSub", "eqLow", "eqMid", "eqHigh", "eqAir"].forEach((id) => {
      if (Number.isFinite(effects[id])) defaults[id] = Math.max(-12, Math.min(12, effects[id]));
    });
    EFFECT_NAMES.forEach(([id]) => {
      if (Number.isFinite(effects[id])) defaults[id] = Math.max(0, Math.min(100, effects[id]));
    });
    return defaults;
  }

  function makeDefaultEffectSettings(settings) {
    const defaults = Object.fromEntries(Object.entries(EFFECT_PARAMETERS).map(([effectId, parameters]) => [
      effectId,
      Object.fromEntries(parameters.map(([id, , min, max, , , defaultValue]) => {
        const savedValue = settings?.[effectId]?.[id];
        return [id, Number.isFinite(savedValue) ? Math.max(min, Math.min(max, savedValue)) : defaultValue];
      })),
    ]));
    if (typeof settings?.sidechain?.sourceTrackId === "string") {
      defaults.sidechain.sourceTrackId = settings.sidechain.sourceTrackId;
    }
    defaults.crossfadeLimiter.sourceTrackId = typeof settings?.crossfadeLimiter?.sourceTrackId === "string"
      ? settings.crossfadeLimiter.sourceTrackId : "";
    defaults.vocoder3Band.modulatorTrackId = typeof settings?.vocoder3Band?.modulatorTrackId === "string"
      ? settings.vocoder3Band.modulatorTrackId : "";
    return defaults;
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
        sidechainInputNode: null,
        sidechainSourceNode: null,
      }),
    };
  }

  state.masterTrack = makeMixerBusTrack("mixer-master");

