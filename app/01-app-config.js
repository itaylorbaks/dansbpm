  const STORAGE_KEY = "pulsegrid-session-v1";
  const PROJECTS_KEY = `${STORAGE_KEY}-projects`;
  const PROJECT_STORAGE_PREFIX = `${STORAGE_KEY}-project-`;
  const USERS_KEY = `${STORAGE_KEY}-users`;
  const EFFECT_PRESETS_STORAGE_PREFIX = `${STORAGE_KEY}-effect-presets-`;
  const ACTIVE_USER_KEY = `${STORAGE_KEY}-active-user`;
  const OPEN_PROJECTS_KEY = `${STORAGE_KEY}-open-projects`;
  const COLLABORATION_URL_KEY = `${STORAGE_KEY}-collaboration-url`;
  const DEFAULT_COLLABORATION_SERVER_URL = "wss://bpmcollab.onrender.com/collaboration";
  const COLLABORATION_SESSION_KEY = `${STORAGE_KEY}-collaboration-room`;
  const DEFAULT_USERS = [
    { id: "taylor", name: "Taylor" },
    { id: "guest", name: "Guest" },
  ];
  const MAX_PATTERN_BARS = 32;
  const MAX_PATTERN_STEPS = MAX_PATTERN_BARS * 16;
  const STEP_COUNT = MAX_PATTERN_BARS * 64;
  const BASE_BAR_WIDTH = 116;
  let BAR_WIDTH = BASE_BAR_WIDTH;
  const PIANO_TICK_WIDTH = 16;
  const MAX_ARRANGEMENT_BARS = 256;
  const DEFAULT_ARRANGEMENT_TRACK_ID = "default-track";
  const MASTER_MIXER_TRACK_ID = "mixer-master";
  const TRACK_COLORS = ["#7cc9ff", "#ff9178", "#ee9df6", "#f6ca74", "#93e2bd"];
  const PATTERN_COLORS = ["#d3f36b", "#7cc9ff", "#ff9178", "#ee9df6", "#f6ca74", "#93e2bd", "#b5a0ff", "#f28dba"];
  const GRID_RESOLUTIONS = ["1/64", "1/32", "1/16", "1/8", "1/4"];
  const GRID_STEPS_PER_BAR = { "1/64": 64, "1/32": 32, "1/16": 16, "1/8": 8, "1/4": 4 };
  const LIVE_KEY_CODES = [
    ..."1234567890".split("").map((key) => `Digit${key}`),
    ..."qwertyuiopasdfghjklzxcvbnm".split("").map((key) => `Key${key.toUpperCase()}`),
    "Minus", "Equal", "BracketLeft", "BracketRight", "Semicolon", "Quote", "Backslash", "Comma", "Period", "Slash",
  ];
  const PIANO_KEY_MIDI = new Map([
    ["KeyZ", 60], ["KeyS", 61], ["KeyX", 62], ["KeyD", 63], ["KeyC", 64], ["KeyV", 65],
    ["KeyG", 66], ["KeyB", 67], ["KeyH", 68], ["KeyN", 69], ["KeyJ", 70], ["KeyM", 71],
    ["KeyQ", 72], ["Digit2", 73], ["KeyW", 74], ["Digit3", 75], ["KeyE", 76], ["KeyR", 77],
    ["Digit5", 78], ["KeyT", 79], ["Digit6", 80], ["KeyY", 81], ["Digit7", 82], ["KeyU", 83],
  ]);
  const PIANO_TICKS_PER_BAR = 32;
  const PIANO_ROW_HEIGHT = 18;
  const PIANO_TOP_MIDI = 83;
  const PIANO_BOTTOM_MIDI = 35;
