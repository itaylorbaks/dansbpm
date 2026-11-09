(() => {
  "use strict";

  const TRACKS = [
    { id: "kick", name: "Kick", kind: "kick", color: "#d4f16c", subtitle: "Low-end foundation", volume: 0.8, hits: [0, 4, 8, 12] },
    { id: "snare", name: "Snare", kind: "snare", color: "#ff9178", subtitle: "Backbeat", volume: 0.57, hits: [4, 12] },
    { id: "clap", name: "Clap", kind: "clap", color: "#ee9df6", subtitle: "Layer & texture", volume: 0.42, hits: [4, 12] },
    { id: "closed-hat", name: "Closed hat", kind: "hat", color: "#7cc9ff", subtitle: "16th-note shimmer", volume: 0.42, hits: [2, 6, 10, 14] },
    { id: "open-hat", name: "Open hat", kind: "openhat", color: "#f6ca74", subtitle: "Air & movement", volume: 0.33, hits: [6, 14] },
    { id: "rim", name: "Rim / perc", kind: "rim", color: "#93e2bd", subtitle: "Add a little syncopation", volume: 0.48, hits: [3, 11] },
  ];

  const SOUND_VARIANTS = {
    kick: [
      { id: "classic", name: "909 Classic" },
      { id: "deep", name: "808 Deep" },
      { id: "punch", name: "Tight Punch" },
      { id: "sub", name: "Sub Drop" },
      { id: "industrial", name: "Industrial Thud" },
    ],
    snare: [
      { id: "classic", name: "909 Snare" },
      { id: "tight", name: "Tight Snap" },
      { id: "noise", name: "Noise Burst" },
      { id: "body", name: "Deep Body" },
      { id: "metal", name: "Metal Snare" },
    ],
    clap: [
      { id: "classic", name: "Wide Clap" },
      { id: "tight", name: "Short Clap" },
      { id: "layered", name: "Layered Clap" },
      { id: "room", name: "Room Clap" },
    ],
    hat: [
      { id: "classic", name: "Bright Closed" },
      { id: "soft", name: "Soft Closed" },
      { id: "bright", name: "Sharp Closed" },
      { id: "vinyl", name: "Vinyl Tick" },
    ],
    openhat: [
      { id: "classic", name: "Open Hat" },
      { id: "shimmer", name: "Shimmer" },
      { id: "dark", name: "Dark Open" },
      { id: "wash", name: "Long Wash" },
    ],
    rim: [
      { id: "classic", name: "Rim Click" },
      { id: "low", name: "Low Tom" },
      { id: "high", name: "High Tick" },
      { id: "wood", name: "Wood Block" },
    ],
  };

  const DRUM_KIT_PROFILES = {
    "909": { kick: "classic", snare: "classic", altSnare: "tight", clap: "classic", hat: "bright", pedalHat: "soft", openhat: "classic", cymbal: "shimmer", ride: "classic", rim: "high" },
    "808": { kick: "deep", snare: "body", altSnare: "noise", clap: "room", hat: "soft", pedalHat: "soft", openhat: "dark", cymbal: "dark", ride: "shimmer", rim: "low" },
    industrial: { kick: "industrial", snare: "metal", altSnare: "body", clap: "layered", hat: "vinyl", pedalHat: "vinyl", openhat: "wash", cymbal: "wash", ride: "shimmer", rim: "wood" },
  };
  const EXTRA_KIT_NAMES = [
    "Vintage Room", "Neon House", "Dusty Breaks", "Jungle Circuit", "Lo-Fi Pocket", "Electro Pulse",
    "Acoustic Studio", "Deep Minimal", "Chrome Machine", "Tape Drum Box", "Festival Stack", "Late Night",
    "Analog Heat", "Broken Circuit", "Soft Focus", "Rave Signal", "Dub Echo", "Dry Studio",
    "Midnight Drive", "Pocket Funk", "Heavy Weather", "Crystal Steps", "Basement Breaks", "Future Garage",
  ];
  const EXTRA_KIT_TRACKS = EXTRA_KIT_NAMES.map((name, index) => {
    const id = `kit-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    DRUM_KIT_PROFILES[id] = {
      kick: SOUND_VARIANTS.kick[(index * 2) % SOUND_VARIANTS.kick.length].id,
      snare: SOUND_VARIANTS.snare[(index * 2 + 1) % SOUND_VARIANTS.snare.length].id,
      altSnare: SOUND_VARIANTS.snare[(index * 3 + 2) % SOUND_VARIANTS.snare.length].id,
      clap: SOUND_VARIANTS.clap[(index * 3) % SOUND_VARIANTS.clap.length].id,
      hat: SOUND_VARIANTS.hat[index % SOUND_VARIANTS.hat.length].id,
      pedalHat: SOUND_VARIANTS.hat[(index + 2) % SOUND_VARIANTS.hat.length].id,
      openhat: SOUND_VARIANTS.openhat[(index * 3 + 1) % SOUND_VARIANTS.openhat.length].id,
      cymbal: SOUND_VARIANTS.openhat[(index * 2 + 2) % SOUND_VARIANTS.openhat.length].id,
      ride: SOUND_VARIANTS.openhat[(index + 1) % SOUND_VARIANTS.openhat.length].id,
      rim: SOUND_VARIANTS.rim[(index * 3 + 1) % SOUND_VARIANTS.rim.length].id,
    };
    return {
      id, name, kind: "drumkit", family: "Drum Kits", color: ["#ff9178", "#d3f36b", "#b5a0ff", "#78d2df"][index % 4],
      volume: 0.72, patch: { kit: id },
    };
  });
  const EXTRA_DRUM_VARIANT_DATA = {
    kick: [
      ["studio-thump", "Studio Thump", { start: 166, end: 48, duration: 0.31, sweep: 0.38, clickCutoff: 2400, clickPeak: 0.08 }],
      ["tape-punch", "Tape Punch", { start: 198, end: 56, duration: 0.24, sweep: 0.28, clickCutoff: 4200, clickPeak: 0.18 }],
      ["sub-bloom", "Sub Bloom", { start: 84, end: 27, duration: 0.62, sweep: 0.46 }],
      ["club-knock", "Club Knock", { start: 154, end: 51, duration: 0.29, sweep: 0.32, clickCutoff: 1800, clickPeak: 0.1 }],
      ["round-909", "Round 909", { start: 142, end: 43, duration: 0.4, sweep: 0.4 }],
      ["dusty-808", "Dusty 808", { start: 102, end: 32, duration: 0.52, sweep: 0.52, clickCutoff: 1300, clickPeak: 0.04 }],
      ["hard-click", "Hard Click", { start: 215, end: 72, duration: 0.2, sweep: 0.22, clickCutoff: 6200, clickPeak: 0.24 }],
      ["soft-felt", "Soft Felt", { start: 132, end: 38, duration: 0.48, sweep: 0.56, wave: "triangle" }],
      ["long-drop", "Long Drop", { start: 126, end: 24, duration: 0.72, sweep: 0.64 }],
      ["grit-pulse", "Grit Pulse", { start: 185, end: 49, duration: 0.34, sweep: 0.3, wave: "triangle", clickCutoff: 3300, clickPeak: 0.14 }],
      ["deep-plate", "Deep Plate", { start: 74, end: 22, duration: 0.68, sweep: 0.5 }],
      ["tight-driver", "Tight Driver", { start: 202, end: 61, duration: 0.22, sweep: 0.26, clickCutoff: 5000, clickPeak: 0.16 }],
      ["thunder-low", "Thunder Low", { start: 96, end: 28, duration: 0.76, sweep: 0.58, wave: "triangle" }],
    ],
    snare: [
      ["dry-studio", "Dry Studio", { noiseDuration: 0.13, cutoff: 1750, noisePeak: 0.32, bodyHz: 190, bodyDuration: 0.09, bodyPeak: 0.2 }],
      ["wire-snap", "Wire Snap", { noiseDuration: 0.09, cutoff: 3900, noisePeak: 0.42, bodyHz: 260, bodyDuration: 0.065, bodyPeak: 0.14 }],
      ["dusty-break", "Dusty Break", { noiseDuration: 0.24, cutoff: 1200, noisePeak: 0.38, bodyHz: 155, bodyDuration: 0.15, bodyPeak: 0.24 }],
      ["wide-room", "Wide Room", { noiseDuration: 0.32, cutoff: 2100, noisePeak: 0.34, bodyHz: 205, bodyDuration: 0.2, bodyPeak: 0.16 }],
      ["paper-crack", "Paper Crack", { noiseDuration: 0.075, cutoff: 5200, noisePeak: 0.46, bodyHz: 310, bodyDuration: 0.05, bodyPeak: 0.12 }],
      ["metal-pop", "Metal Pop", { noiseDuration: 0.2, cutoff: 6200, noisePeak: 0.38, bodyHz: 420, bodyDuration: 0.12, bodyPeak: 0.22, bodyWave: "square" }],
      ["low-body", "Low Body", { noiseDuration: 0.18, cutoff: 980, noisePeak: 0.28, bodyHz: 112, bodyDuration: 0.22, bodyPeak: 0.3 }],
      ["bright-rim", "Bright Rim", { noiseDuration: 0.12, cutoff: 4600, noisePeak: 0.44, bodyHz: 350, bodyDuration: 0.075, bodyPeak: 0.16 }],
      ["soft-brush", "Soft Brush", { noiseDuration: 0.28, cutoff: 2600, noisePeak: 0.22, bodyHz: 175, bodyDuration: 0.18, bodyPeak: 0.1 }],
      ["tape-snap", "Tape Snap", { noiseDuration: 0.16, cutoff: 3200, noisePeak: 0.34, bodyHz: 225, bodyDuration: 0.12, bodyPeak: 0.2 }],
      ["big-chamber", "Big Chamber", { noiseDuration: 0.38, cutoff: 1450, noisePeak: 0.42, bodyHz: 165, bodyDuration: 0.24, bodyPeak: 0.2 }],
      ["gated-noise", "Gated Noise", { noiseDuration: 0.065, cutoff: 2500, noisePeak: 0.5, bodyHz: 185, bodyDuration: 0.06, bodyPeak: 0.16 }],
      ["crunch-hit", "Crunch Hit", { noiseDuration: 0.15, cutoff: 5800, noisePeak: 0.48, bodyHz: 280, bodyDuration: 0.1, bodyPeak: 0.24, bodyWave: "square" }],
    ],
    clap: [
      ["finger-snap", "Finger Snap", { offsets: [0, 0.012], tail: 0.09, cutoff: 2800, peak: 0.34, resonance: 0.8 }],
      ["crowd-stack", "Crowd Stack", { offsets: [0, 0.018, 0.034, 0.052], tail: 0.26, cutoff: 1600, peak: 0.38, resonance: 0.7 }],
      ["tight-hand", "Tight Hand", { offsets: [0, 0.01], tail: 0.08, cutoff: 1900, peak: 0.3 }],
      ["vinyl-clap", "Vinyl Clap", { offsets: [0, 0.02, 0.045], tail: 0.16, cutoff: 1150, peak: 0.24, resonance: 0.9 }],
      ["wide-palm", "Wide Palm", { offsets: [0, 0.016, 0.039, 0.067], tail: 0.21, cutoff: 2300, peak: 0.34 }],
      ["short-room", "Short Room", { offsets: [0, 0.022, 0.046], tail: 0.12, cutoff: 950, peak: 0.26, resonance: 1.1 }],
      ["plate-clap", "Plate Clap", { offsets: [0, 0.014, 0.03], tail: 0.31, cutoff: 3600, peak: 0.28, resonance: 0.6 }],
      ["dusty-group", "Dusty Group", { offsets: [0, 0.024, 0.055], tail: 0.2, cutoff: 1350, peak: 0.3, resonance: 1.2 }],
      ["bright-gang", "Bright Gang", { offsets: [0, 0.011, 0.029, 0.047], tail: 0.17, cutoff: 4800, peak: 0.32 }],
      ["soft-double", "Soft Double", { offsets: [0, 0.031], tail: 0.22, cutoff: 1750, peak: 0.2, resonance: 0.7 }],
      ["gated-crowd", "Gated Crowd", { offsets: [0, 0.012, 0.026, 0.041], tail: 0.095, cutoff: 3000, peak: 0.4 }],
      ["neon-clap", "Neon Clap", { offsets: [0, 0.02, 0.045], tail: 0.25, cutoff: 5200, peak: 0.3, resonance: 0.5 }],
      ["deep-room", "Deep Room", { offsets: [0, 0.03, 0.058], tail: 0.34, cutoff: 820, peak: 0.28, resonance: 1.3 }],
    ],
    hat: [
      ["soft-tick", "Soft Tick", { duration: 0.075, cutoff: 3900, peak: 0.11, resonance: 0.7 }],
      ["razor-closed", "Razor Closed", { duration: 0.038, cutoff: 11800, peak: 0.22, resonance: 0.45 }],
      ["dusty-closed", "Dusty Closed", { duration: 0.095, cutoff: 4800, peak: 0.13, resonance: 1.2 }],
      ["coin-shaker", "Coin Shaker", { duration: 0.11, cutoff: 7200, peak: 0.17, resonance: 0.9 }],
      ["short-white", "Short White", { duration: 0.032, cutoff: 9600, peak: 0.2, resonance: 0.6 }],
      ["bright-metal", "Bright Metal", { duration: 0.062, cutoff: 13200, peak: 0.24, resonance: 0.8 }],
      ["muted-vinyl", "Muted Vinyl", { duration: 0.12, cutoff: 3000, peak: 0.15, resonance: 1.4 }],
      ["needle-hat", "Needle Hat", { duration: 0.042, cutoff: 14500, peak: 0.19, resonance: 0.5 }],
      ["sand-shaker", "Sand Shaker", { duration: 0.14, cutoff: 6400, peak: 0.13, resonance: 1.7 }],
      ["dry-click", "Dry Click", { duration: 0.028, cutoff: 8200, peak: 0.18, resonance: 0.4 }],
      ["glass-tick", "Glass Tick", { duration: 0.052, cutoff: 11200, peak: 0.2, resonance: 1.1 }],
      ["wide-tss", "Wide Tss", { duration: 0.085, cutoff: 8900, peak: 0.21, resonance: 0.65 }],
      ["crisp-16th", "Crisp 16th", { duration: 0.047, cutoff: 10500, peak: 0.16, resonance: 0.55 }],
    ],
    openhat: [
      ["airy-open", "Airy Open", { duration: 0.42, cutoff: 7600, peak: 0.22, resonance: 0.7 }],
      ["long-silver", "Long Silver", { duration: 0.68, cutoff: 10500, peak: 0.2, resonance: 0.6 }],
      ["dark-breath", "Dark Breath", { duration: 0.38, cutoff: 3400, peak: 0.25, resonance: 1.1 }],
      ["loose-wash", "Loose Wash", { duration: 0.8, cutoff: 5100, peak: 0.3, resonance: 0.9 }],
      ["room-open", "Room Open", { duration: 0.48, cutoff: 6200, peak: 0.19, resonance: 1.3 }],
      ["tape-sizzle", "Tape Sizzle", { duration: 0.56, cutoff: 8300, peak: 0.23, resonance: 1.5 }],
      ["wide-air", "Wide Air", { duration: 0.72, cutoff: 12000, peak: 0.18, resonance: 0.55 }],
      ["chrome-wash", "Chrome Wash", { duration: 0.64, cutoff: 9800, peak: 0.26, resonance: 0.8 }],
      ["soft-open", "Soft Open", { duration: 0.36, cutoff: 4400, peak: 0.16, resonance: 0.7 }],
      ["deep-shimmer", "Deep Shimmer", { duration: 0.74, cutoff: 6900, peak: 0.24, resonance: 1.4 }],
      ["crash-hat", "Crash Hat", { duration: 0.9, cutoff: 11200, peak: 0.28, resonance: 0.65 }],
      ["broken-metal", "Broken Metal", { duration: 0.5, cutoff: 3900, peak: 0.3, resonance: 2 }],
      ["cloud-hat", "Cloud Hat", { duration: 0.88, cutoff: 5600, peak: 0.2, resonance: 1.6 }],
    ],
  };
  const DRUM_VARIANT_SETTINGS = {};
  Object.entries(EXTRA_DRUM_VARIANT_DATA).forEach(([kind, variants]) => {
    DRUM_VARIANT_SETTINGS[kind] = {};
    SOUND_VARIANTS[kind].push(...variants.map(([id, name, settings]) => {
      DRUM_VARIANT_SETTINGS[kind][id] = settings;
      return { id, name };
    }));
  });
  const VOICE_FAMILIES = [
    { family: "Synths", cutoff: 3600, names: ["Neon Saw", "Pulse Lead", "Sync Lead", "Hollow Square", "Vector Brass", "Digital Choir", "Drift Pad", "Orbit Sequence"] },
    { family: "Bass", cutoff: 1150, names: ["Rubber Bass", "Reese Bass", "Mono Pulse", "Glass Sub", "Round Finger", "Dirty Square", "Deep Triangle", "Resonant Bass"] },
    { family: "Keys", cutoff: 4800, names: ["Soft Bell Keys", "FM Tines", "Velvet Keys", "Digital EP", "Muted Chord", "Bright Mallet", "Lo-Fi Keys", "Wide Chimes"] },
    { family: "Strings", cutoff: 4200, names: ["Slow Strings", "Pizzicato", "Glass Strings", "Warm Ensemble", "Short Spiccato", "Dream Section", "Dark Cello", "Airy Violin"] },
    { family: "Brass", cutoff: 3400, names: ["Soft Trumpet", "Synth Horn", "Muted Brass", "Wide Trombone", "Bright Stabs", "Warm Tuba", "Glass Horn", "Brass Ensemble"] },
    { family: "Winds", cutoff: 5200, names: ["Breathy Flute", "Reed Lead", "Soft Clarinet", "Air Recorder", "Hollow Oboe", "Woodwind Pad", "Bright Piccolo", "Warm Sax"] },
    { family: "Guitars", cutoff: 3600, names: ["Nylon Guitar", "Chorus Electric", "Muted Pluck", "Glass Guitar", "Warm Twelve String", "Clean Chords", "Folk Picking", "Ambient Guitar"] },
    { family: "Mallets", cutoff: 7000, names: ["Celesta", "Marimba", "Vibraphone", "Kalimba", "Music Box", "Soft Bells", "Steel Tongue", "Crystal Mallet"] },
  ];
  const VOICE_WAVES = ["triangle", "sine", "sawtooth", "square"];
  const VOICE_COLORS = ["#7cc9ff", "#76c6ad", "#b5a0ff", "#f0ca75", "#78d2df", "#e2d3b1", "#d29b79", "#c5a6ed"];
  const EXTRA_VOICE_TRACKS = VOICE_FAMILIES.flatMap((group, familyIndex) =>
    group.names.map((name, index) => {
      const id = `${group.family.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const harmonic = index % 3 === 0 ? 2 + (index % 4) * 0.25 : undefined;
      return {
        id, name, kind: "instrument", family: group.family, color: VOICE_COLORS[(familyIndex + index) % VOICE_COLORS.length],
        volume: group.family === "Bass" ? 0.68 : 0.62,
        patch: {
          wave: VOICE_WAVES[(familyIndex + index) % VOICE_WAVES.length],
          cutoff: Math.max(220, Math.min(10000, group.cutoff * [0.55, 0.72, 0.9, 1, 1.18, 1.35, 1.55, 1.8][index])),
          attack: [0.003, 0.008, 0.018, 0.04, 0.08, 0.14, 0.22, 0.012][(index + familyIndex) % 8],
          decay: [0.12, 0.24, 0.42, 0.7, 0.9, 0.18, 0.34, 0.56][index],
          sustain: [0.18, 0.32, 0.5, 0.68, 0.12, 0.42, 0.76, 0.25][(index + familyIndex) % 8],
          release: [0.08, 0.14, 0.22, 0.34, 0.48, 0.62, 0.18, 0.28][(index + familyIndex) % 8],
          detune: (index % 4) * 3,
          ...(harmonic ? { harmonic, harmonicLevel: 0.1 + (index % 4) * 0.07 } : {}),
        },
      };
    }),
  );
  const EXISTING_DRUM_VARIANTS = new Set([
    "kick:deep", "kick:industrial", "snare:tight", "snare:metal", "clap:room",
    "hat:vinyl", "openhat:wash", "rim:wood",
  ]);
  const DRUM_KIND_NAMES = { kick: "Kick", snare: "Snare", clap: "Clap", hat: "Closed Hat", openhat: "Open Hat", rim: "Rim" };
  const EXTRA_DRUM_TRACKS = Object.entries(SOUND_VARIANTS).flatMap(([kind, variants]) =>
    variants
      .filter((variant) => !EXISTING_DRUM_VARIANTS.has(`${kind}:${variant.id}`))
      .map((variant) => ({
        id: `${kind}-${variant.id}`, name: `${variant.name} ${DRUM_KIND_NAMES[kind]}`, kind,
        variant: variant.id, family: "Drums", color: VOICE_COLORS[Object.keys(SOUND_VARIANTS).indexOf(kind) % VOICE_COLORS.length],
        volume: kind === "kick" ? 0.72 : kind === "snare" ? 0.58 : 0.42,
      })),
  );

  const BASE_LIBRARY_TRACKS = [
    { id: "kick-808", name: "808 Sub Kick", kind: "kick", variant: "deep", family: "Drums", color: "#b8dc67", volume: 0.72 },
    { id: "kick-industrial", name: "Industrial Kick", kind: "kick", variant: "industrial", family: "Drums", color: "#d48b68", volume: 0.72 },
    { id: "snare-tight", name: "Tight Snare", kind: "snare", variant: "tight", family: "Drums", color: "#e58b7a", volume: 0.58 },
    { id: "snare-metal", name: "Metal Snare", kind: "snare", variant: "metal", family: "Drums", color: "#a6a4c6", volume: 0.58 },
    { id: "clap-room", name: "Room Clap", kind: "clap", variant: "room", family: "Drums", color: "#d09bdb", volume: 0.42 },
    { id: "hat-vinyl", name: "Vinyl Hat", kind: "hat", variant: "vinyl", family: "Drums", color: "#78b8cf", volume: 0.4 },
    { id: "openhat-wash", name: "Long Wash Hat", kind: "openhat", variant: "wash", family: "Drums", color: "#d5b677", volume: 0.34 },
    { id: "rim-wood", name: "Wood Block", kind: "rim", variant: "wood", family: "Drums", color: "#89c5a5", volume: 0.48 },
    { id: "kit-909", name: "909 Drum Kit", kind: "drumkit", family: "Drum Kits", color: "#ff9178", volume: 0.72, patch: { kit: "909" } },
    { id: "kit-808", name: "808 Drum Kit", kind: "drumkit", family: "Drum Kits", color: "#d3f36b", volume: 0.72, patch: { kit: "808" } },
    { id: "kit-industrial", name: "Industrial Kit", kind: "drumkit", family: "Drum Kits", color: "#b5a0ff", volume: 0.72, patch: { kit: "industrial" } },
    { id: "synth-analog-lead", name: "Analog Lead", kind: "instrument", family: "Synths", color: "#7cc9ff", volume: 0.68, patch: { wave: "sawtooth", cutoff: 3600, attack: 0.008, decay: 0.12, sustain: 0.5, release: 0.12, detune: 7 } },
    { id: "synth-acid-bass", name: "Acid Bass", kind: "instrument", family: "Synths", color: "#76c6ad", volume: 0.7, patch: { wave: "sawtooth", cutoff: 1150, attack: 0.004, decay: 0.16, sustain: 0.18, release: 0.08, detune: 3 } },
    { id: "synth-warm-pad", name: "Warm Pad", kind: "instrument", family: "Synths", color: "#b5a0ff", volume: 0.62, patch: { wave: "triangle", cutoff: 2200, attack: 0.22, decay: 0.4, sustain: 0.62, release: 0.5, detune: 11 } },
    { id: "synth-fm-bell", name: "FM Bell", kind: "instrument", family: "Synths", color: "#f0ca75", volume: 0.58, patch: { wave: "sine", cutoff: 9000, attack: 0.002, decay: 0.7, sustain: 0.06, release: 0.35, harmonic: 2.01, harmonicLevel: 0.35 } },
    { id: "synth-glass-pluck", name: "Glass Pluck", kind: "instrument", family: "Synths", color: "#78d2df", volume: 0.62, patch: { wave: "triangle", cutoff: 6200, attack: 0.003, decay: 0.48, sustain: 0.08, release: 0.22, harmonic: 3, harmonicLevel: 0.16 } },
    { id: "piano-grand", name: "Concert Grand", kind: "instrument", family: "Pianos", color: "#e2d3b1", volume: 0.68, patch: { wave: "triangle", cutoff: 4200, attack: 0.004, decay: 0.72, sustain: 0.16, release: 0.42, harmonic: 2, harmonicLevel: 0.2 } },
    { id: "piano-soft", name: "Soft Felt Piano", kind: "instrument", family: "Pianos", color: "#d8c6a9", volume: 0.62, patch: { wave: "sine", cutoff: 2200, attack: 0.012, decay: 0.9, sustain: 0.12, release: 0.34, harmonic: 2, harmonicLevel: 0.08 } },
    { id: "piano-electric", name: "Electric Piano", kind: "instrument", family: "Pianos", color: "#c5a6ed", volume: 0.64, patch: { wave: "sine", cutoff: 5200, attack: 0.003, decay: 0.58, sustain: 0.25, release: 0.28, harmonic: 3, harmonicLevel: 0.22 } },
    { id: "organ-tonewheel", name: "Tonewheel Organ", kind: "instrument", family: "Pianos", color: "#9db4dc", volume: 0.58, patch: { wave: "sine", cutoff: 7000, attack: 0.012, decay: 0.04, sustain: 0.82, release: 0.08, harmonic: 2, harmonicLevel: 0.26 } },
    { id: "guitar-acoustic", name: "Steel Acoustic", kind: "instrument", family: "Guitars", color: "#d29b79", volume: 0.62, patch: { wave: "triangle", cutoff: 3600, attack: 0.003, decay: 0.5, sustain: 0.08, release: 0.2, harmonic: 2.76, harmonicLevel: 0.13 } },
    { id: "guitar-clean", name: "Clean Electric Guitar", kind: "instrument", family: "Guitars", color: "#97c9b0", volume: 0.58, patch: { wave: "triangle", cutoff: 4800, attack: 0.006, decay: 0.32, sustain: 0.18, release: 0.24, harmonic: 2, harmonicLevel: 0.24, detune: 3 } },
    { id: "guitar-muted", name: "Muted Guitar", kind: "instrument", family: "Guitars", color: "#c9ab7d", volume: 0.62, patch: { wave: "square", cutoff: 1800, attack: 0.002, decay: 0.16, sustain: 0.04, release: 0.08, harmonic: 2.7, harmonicLevel: 0.08 } },
    { id: "bass-finger", name: "Finger Bass", kind: "instrument", family: "Bass", color: "#89ad75", volume: 0.72, patch: { wave: "triangle", cutoff: 950, attack: 0.008, decay: 0.22, sustain: 0.35, release: 0.13, harmonic: 2, harmonicLevel: 0.16 } },
    { id: "bass-sub", name: "Sub Bass", kind: "instrument", family: "Bass", color: "#78a6d4", volume: 0.72, patch: { wave: "sine", cutoff: 420, attack: 0.01, decay: 0.2, sustain: 0.48, release: 0.16 } },
    { id: "bass-fuzz", name: "Fuzz Bass", kind: "instrument", family: "Bass", color: "#d47e78", volume: 0.68, patch: { wave: "sawtooth", cutoff: 1500, attack: 0.004, decay: 0.18, sustain: 0.32, release: 0.12, detune: 5 } },
    {
      id: "synth-dansbpm", name: "DansBPM Synth", kind: "instrument", family: "In-house Synth", color: "#93e2bd", volume: 0.68,
      patch: {
        engine: "dansbpm", wave: "sawtooth", osc2Wave: "square", osc2Detune: 8, osc2Level: 0.28, subLevel: 0.2,
        cutoff: 3200, resonance: 0.2, filterEnvOctaves: 2.5,
        attack: 0.01, decay: 0.25, sustain: 0.55, release: 0.25,
        filterAttack: 0.02, filterDecay: 0.35, filterSustain: 0.25,
        lfoRate: 0.18, lfoDepth: 4, output: 0.72,
      },
    },
  ];
  function makeLiveSampleTracks(family, category, color, entries, volume = 0.68) {
    return entries.map(([id, name, file, rootMidi]) => ({
      id: `${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`,
      name,
      kind: "sample",
      family,
      sampleCategory: category,
      sampleUrl: `assets/sounds/live/${file}`,
      sampleRootMidi: rootMidi,
      sampleHumanized: true,
      sampleOneShot: true,
      subtitle: "Recorded live performance",
      color,
      volume,
    }));
  }
  const LIVE_SAMPLE_TRACKS = [
    ...makeLiveSampleTracks("Live Drums", "Kicks", "#d4f16c", [
      ["virtuosity-kick-dry-soft", "Virtuosity Kick · Soft · Snare Off", "virtuosity/oh_kick_snoff_vl1_rr1.ogg", 36],
      ["virtuosity-kick-dry-medium", "Virtuosity Kick · Medium · Snare Off", "virtuosity/oh_kick_snoff_vl2_rr1.ogg", 36],
      ["virtuosity-kick-dry-strong", "Virtuosity Kick · Strong · Snare Off", "virtuosity/oh_kick_snoff_vl3_rr1.ogg", 36],
      ["virtuosity-kick-dry-hard", "Virtuosity Kick · Hard · Snare Off", "virtuosity/oh_kick_snoff_vl4_rr1.ogg", 36],
      ["virtuosity-kick-bleed-soft", "Virtuosity Kick · Soft · Snare Bleed", "virtuosity/oh_kick_snon_vl1_rr1.ogg", 36],
      ["virtuosity-kick-bleed-medium", "Virtuosity Kick · Medium · Snare Bleed", "virtuosity/oh_kick_snon_vl2_rr1.ogg", 36],
      ["virtuosity-kick-bleed-strong", "Virtuosity Kick · Strong · Snare Bleed", "virtuosity/oh_kick_snon_vl3_rr1.ogg", 36],
      ["virtuosity-kick-bleed-hard", "Virtuosity Kick · Hard · Snare Bleed", "virtuosity/oh_kick_snon_vl4_rr1.ogg", 36],
    ], 0.86),
    ...makeLiveSampleTracks("Live Drums", "Kicks", "#d4f16c", [
      ["double-kick-1", "Live Double Kick Take 1", "double_kick1.mp3", 36],
      ["double-kick-2", "Live Double Kick Take 2", "double_kick2.mp3", 36],
    ], 0.86),
    ...makeLiveSampleTracks("Live Drums", "Claps", "#e58b7a", [
      ["clap-1", "Studio Clap Take 1", "Clap1.mp3", 60],
      ["clap-2", "Studio Clap Take 2", "Clap2.mp3", 60],
      ["clap-3", "Studio Clap Take 3", "Clap3.mp3", 60],
      ["clap-4", "Hand Clap", "clap_1.mp3", 60],
    ]),
    ...makeLiveSampleTracks("Live Drums", "Congas", "#d09bdb", [
      ["conga-1", "Conga Slap 1", "conga_1.mp3", 60],
      ["conga-2", "Conga Slap 2", "conga_2.mp3", 60],
      ["conga-3", "Conga Open 1", "conga_3.mp3", 60],
      ["conga-4", "Conga Open 2", "conga_4.mp3", 60],
      ["conga-roll-1", "Conga Roll 1", "conga_roll_1.mp3", 60],
      ["conga-roll-2", "Conga Roll 2", "conga_roll_2.mp3", 60],
    ]),
    ...makeLiveSampleTracks("Live Drums", "Cymbals", "#d5b677", [
      ["china-1", "China Cymbal 1", "china_cymbal1.mp3", 60],
      ["china-2", "China Cymbal 2", "china_cymbal2.mp3", 60],
      ["china-3", "China Cymbal 3", "china_cymbal3.mp3", 60],
      ["crash-1", "Crash Cymbal 1", "crash_cymbal1.mp3", 60],
      ["crash-2", "Crash Cymbal 2", "crash_cymbal2.mp3", 60],
      ["crash-3", "Crash Cymbal 3", "crash_cymbal3.mp3", 60],
      ["cymbal-1", "Ride Cymbal 1", "cymbal1.mp3", 60],
      ["cymbal-2", "Ride Cymbal 2", "cymbal2.mp3", 60],
      ["bowed-cymbal-1", "Bowed Cymbal Swell 1", "bowed_cymbal_1.mp3", 60],
      ["bowed-cymbal-1b", "Bowed Cymbal Swell 1B", "bowed_cymbal_1b.mp3", 60],
      ["bowed-cymbal-2", "Bowed Cymbal Swell 2", "bowed_cymbal_2.mp3", 60],
      ["bowed-cymbal-2b", "Bowed Cymbal Swell 2B", "bowed_cymbal_2b.mp3", 60],
      ["bowed-cymbal-3", "Bowed Cymbal Swell 3", "bowed_cymbal_3.mp3", 60],
      ["cymbal-drop-1", "Cymbal Drop 1", "cymbal_drop1.mp3", 60],
      ["cymbal-drop-2", "Cymbal Drop 2", "cymbal_drop2.mp3", 60],
    ]),
    ...makeLiveSampleTracks("Live Drums", "Percussion", "#89c5a5", [
      ["low-drum-1", "Low Drum 1", "drum_low_1.mp3", 60],
      ["low-drum-2", "Low Drum 2", "drum_low_2.mp3", 60],
      ["balloon-drum-1", "Balloon Percussion Take 1", "balloon_drumming1.mp3", 60],
      ["balloon-drum-2", "Balloon Percussion Take 2", "balloon_drumming2.mp3", 60],
      ["balloon-drum-3", "Balloon Percussion Take 3", "balloon_drumming3.mp3", 60],
      ["balloon-drum-4", "Balloon Percussion Take 4", "balloon_drumming4.mp3", 60],
      ["balloon-drum-5", "Balloon Percussion Take 5", "balloondrumming1.mp3", 60],
      ["balloon-drum-6", "Balloon Percussion Take 6", "balloondrumming2.mp3", 60],
      ["metal-drum-1", "Metal Drum Hit 1", "drumming_clanks.mp3", 60],
      ["metal-drum-2", "Metal Drum Hit 2", "drumming_clanks2.mp3", 60],
      ["metal-drum-3", "Metal Drum Hit 3", "drumming_clanks3.mp3", 60],
      ["fiberboard-1", "Fiberboard Percussion 1", "fiberboard_percussive1.mp3", 60],
      ["fiberboard-2", "Fiberboard Percussion 2", "fiberboard_percussive2.mp3", 60],
    ]),
    ...makeLiveSampleTracks("Live Drums", "Shakers", "#78b8cf", [
      ["shaker-1", "Egg Shaker 1", "egg_shaker1.mp3", 60],
      ["shaker-2", "Egg Shaker 2", "egg_shaker2.mp3", 60],
    ]),
    ...makeLiveSampleTracks("Live Guitars", "Strings & Chords", "#d29b79", [
      ["a-string", "Guitar A String", "guitar_Astring.mp3", 45],
      ["b-string", "Guitar B String", "guitar_Bstring.mp3", 59],
      ["d-string", "Guitar D String", "guitar_Dstring.mp3", 50],
      ["g-string", "Guitar G String", "guitar_Gstring.mp3", 55],
      ["low-e-1", "Guitar Low E Take 1", "guitar_LowEstring1.mp3", 40],
      ["low-e-2", "Guitar Low E Take 2", "guitar_LowEstring2.mp3", 40],
      ["high-e", "Guitar High E String", "guitar_highEstring.mp3", 64],
      ["chord-1", "Guitar Chord Take 1", "guitar_chord1.mp3", 60],
      ["chord-2", "Guitar Chord Take 2", "guitar_chord2.mp3", 60],
      ["chord-3", "Guitar Chord Take 3", "guitar_chord3.mp3", 60],
      ["chord-4", "Guitar Chord Take 4", "guitar_chord4.mp3", 60],
      ["hit-1", "Guitar Body Hit 1", "guitar_hit_!.mp3", 60],
      ["hit-2", "Guitar Body Hit 2", "guitar_hit_2.mp3", 60],
      ["pick-1", "Guitar Pick 1", "guitar_pick_1.mp3", 60],
      ["pick-2", "Guitar Pick 2", "guitar_pick_2.mp3", 60],
      ["pick-3", "Guitar Pick 3", "guitar_pick_3.mp3", 60],
      ["riff", "Guitar Riff Cutup", "guitar_riff_cutup1.mp3", 60],
    ]),
    ...makeLiveSampleTracks("Live Bass", "Strings & Tones", "#89ad75", [
      ["string-1", "Bass String Take 1", "bass_string1.mp3", 28],
      ["string-2", "Bass String Take 2", "bass_string2.mp3", 33],
      ["string-3", "Bass String Take 3", "bass_string3.mp3", 38],
      ["string-4", "Bass String Take 4", "bass_string4.mp3", 43],
      ["string-5", "Bass String Take 5", "bass_string5.mp3", 48],
      ["string-6", "Bass String Take 6", "bass_string6.mp3", 53],
      ["doublebass-1", "Double Bass Tone 1", "FM_doublebass.mp3", 40],
      ["doublebass-2", "Double Bass Tone 2", "FM_doublebass2.mp3", 40],
      ["doublebass-3", "Double Bass Tone 3", "FM_doublebass3.mp3", 40],
      ["doublebass-4", "Double Bass Tone 4", "FM_doublebass4.mp3", 40],
      ["balloon-1", "Balloon Bass 1", "balloonbass1.mp3", 40],
      ["balloon-2", "Balloon Bass 2", "balloonbass2.mp3", 40],
      ["fuzz-1", "Fuzz Bass Take 1", "fuzz_bass_1.mp3", 40],
      ["fuzz-2", "Fuzz Bass Take 2", "fuzz_bass_2.mp3", 40],
    ]),
  ];
  const LIBRARY_TRACKS = [
    ...BASE_LIBRARY_TRACKS,
    ...EXTRA_DRUM_TRACKS,
    ...EXTRA_KIT_TRACKS,
    ...EXTRA_VOICE_TRACKS,
    ...LIVE_SAMPLE_TRACKS,
  ].map((track) => ({ ...track, libraryOnly: true, subtitle: track.subtitle || track.family }));

  const PRESETS = [
    {
      id: "warehouse", title: "Warehouse", tag: "04 / FLOOR", description: "Driving, no-nonsense techno", color: "#d4f16c", bpm: 128,
      hits: { kick: [0, 4, 8, 12], snare: [4, 12], clap: [4, 12], "closed-hat": [2, 6, 10, 14], "open-hat": [6, 14], rim: [3, 11] },
    },
    {
      id: "hypnotic", title: "Hypnotic", tag: "LATE NIGHT", description: "A steady pulse with space", color: "#93e2bd", bpm: 122,
      hits: { kick: [0, 6, 8, 14], snare: [4, 12], clap: [12], "closed-hat": [2, 6, 10, 14], "open-hat": [7, 15], rim: [3, 11] },
    },
    {
      id: "broken", title: "Broken beat", tag: "OFF-GRID", description: "Let the kick skip a step", color: "#ff9178", bpm: 116,
      hits: { kick: [0, 3, 7, 10, 14], snare: [4, 12], clap: [12], "closed-hat": [2, 5, 6, 10, 13, 14], "open-hat": [7, 15], rim: [3, 11] },
    },
    {
      id: "minimal", title: "Minimal", tag: "LESS IS MORE", description: "Room to build something", color: "#7cc9ff", bpm: 124,
      hits: { kick: [0, 4, 8, 12], snare: [12], clap: [], "closed-hat": [2, 6, 10, 14], "open-hat": [14], rim: [7] },
    },
  ];
  const STORAGE_KEY = "pulsegrid-session-v1";
  const PROJECTS_KEY = `${STORAGE_KEY}-projects`;
  const PROJECT_STORAGE_PREFIX = `${STORAGE_KEY}-project-`;
  const USERS_KEY = `${STORAGE_KEY}-users`;
  const EFFECT_PRESETS_STORAGE_PREFIX = `${STORAGE_KEY}-effect-presets-`;
  const ACTIVE_USER_KEY = `${STORAGE_KEY}-active-user`;
  const OPEN_PROJECTS_KEY = `${STORAGE_KEY}-open-projects`;
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
  let pianoNoteContextTargetIds = [];
  let pianoDragPreviewSequence = 0;
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
    pianoBars: 4,
    pianoScale: 1,
    pianoDrawMode: false,
    stepPianoEditContext: null,
    pianoSnap: 2,
    pianoSnapEnabled: true,
    pianoNoteLength: 2,
    soundDurationEdits: {},
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
    arrangementSnap: true,
    arrangementSources: new Set(),
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

  function getPattern(patternId = state.selectedPatternId) {
    return state.patterns.find((pattern) => pattern.id === patternId) || null;
  }

  function getPatternGridResolution(pattern) {
    if (GRID_RESOLUTIONS.includes(pattern?.gridResolution)) return pattern.gridResolution;
    if (GRID_RESOLUTIONS.includes(pattern?.noteLength)) return pattern.noteLength;
    const counts = Object.fromEntries(GRID_RESOLUTIONS.map((resolution) => [resolution, 0]));
    Object.values(pattern?.noteLengths || {}).forEach((length) => {
      if (GRID_RESOLUTIONS.includes(length)) counts[length] += 1;
    });
    return GRID_RESOLUTIONS.reduce((selected, resolution) =>
      counts[resolution] > counts[selected] ? resolution : selected, "1/16");
  }

  function getStepsPerBar(pattern = getPattern()) {
    return GRID_STEPS_PER_BAR[getPatternGridResolution(pattern)] || 16;
  }

  function getGridStepCount(pattern = getPattern()) {
    const bars = pattern ? pattern.steps / 16 : state.steps / 16;
    return bars * getStepsPerBar(pattern);
  }

  function normalizePatternSteps(steps) {
    const bars = Number.isFinite(steps) ? Math.round(steps / 16) : 1;
    return Math.max(1, Math.min(MAX_PATTERN_BARS, bars)) * 16;
  }

  function renderPatternLengthControls() {
    const bars = state.steps / 16;
    const label = `${bars} ${bars === 1 ? "BAR" : "BARS"}`;
    $("#pattern-bars-value").textContent = label;
    $("#decrease-pattern-bars").disabled = bars <= 1;
    $("#increase-pattern-bars").disabled = bars >= MAX_PATTERN_BARS;
  }

  function getPianoTickWidth() {
    return PIANO_TICK_WIDTH * state.pianoScale;
  }

  function getPianoSnapStep() {
    return state.pianoSnapEnabled ? state.pianoSnap : 0.5;
  }

  function snapPianoTick(tick, round = Math.round) {
    return state.pianoSnapEnabled ? round(tick / state.pianoSnap) * state.pianoSnap : tick;
  }

  function setSequencerGridDimensions(stepCount, slotsPerBar = getStepsPerBar()) {
    const scale = state.sequencerScale;
    const cellWidth = 20 * scale;
    const gap = 3 * scale;
    const beatSpace = 4 * scale;
    const padding = 12;
    sequencerGridScroll.style.setProperty("--grid-step-count", String(stepCount));
    sequencerGridScroll.style.setProperty("--grid-step-size", `${cellWidth}px`);
    sequencerGridScroll.style.setProperty("--grid-step-gap", `${gap}px`);
    sequencerGridScroll.style.setProperty("--grid-beat-space", `${beatSpace}px`);
    sequencerGridScroll.style.setProperty("--grid-content-width",
      `${stepCount * cellWidth + Math.max(0, stepCount - 1) * gap +
        Math.max(0, Math.round(stepCount / slotsPerBar) * 3) * beatSpace + padding}px`);
  }

  function getDefaultStepMidi(track) {
    if (Number.isFinite(track.sampleRootMidi)) return track.sampleRootMidi;
    return {
      kick: 36,
      snare: 38,
      clap: 39,
      hat: 42,
      openhat: 46,
      rim: 37,
      drumkit: 36,
    }[track.kind] || 60;
  }

  function getStepPianoNotes(pattern, track) {
    const savedNotes = pattern.stepPianoNotes?.[track.id];
    if (Array.isArray(savedNotes)) return savedNotes.map((note) => ({ ...note, trackId: track.id }));
    const ticksPerStep = getGridTicksPerStep(pattern);
    return Array.from({ length: getGridStepCount(pattern) }, (_, step) => {
      if (!pattern.cells?.[track.id]?.[step]) return null;
      return {
        id: makeId(),
        trackId: track.id,
        midi: getDefaultStepMidi(track),
        startTick: step * ticksPerStep,
        durationTicks: ticksPerStep,
        velocity: 0.8,
      };
    }).filter(Boolean);
  }

  function stepPianoNoteSignature(notes) {
    return JSON.stringify(notes
      .map((note) => [note.startTick, note.durationTicks, note.midi, note.velocity, note.volume, note.attack, note.detune])
      .sort((left, right) => left[0] - right[0] || left[2] - right[2] || left[1] - right[1]));
  }

  function updatePatternStepPianoCell(pattern, track, step, value, midi = getDefaultStepMidi(track)) {
    if (!pattern) return;
    const savedNotes = pattern.stepPianoNotes?.[track.id];
    if (!Array.isArray(savedNotes)) return;
    const ticksPerStep = getGridTicksPerStep(pattern);
    const notesInStep = (note) => Math.floor(note.startTick / ticksPerStep) === step;
    if (value) {
      if (!savedNotes.some(notesInStep)) {
        const startTick = step * ticksPerStep;
        savedNotes.push({
          id: makeId(),
          startTick,
          durationTicks: Math.min(ticksPerStep, pattern.steps * 2 - startTick),
          midi,
          velocity: 0.8,
        });
      }
    } else {
      pattern.stepPianoNotes[track.id] = savedNotes.filter((note) => !notesInStep(note));
    }
    pattern.cells[track.id] ||= Array(STEP_COUNT).fill(false);
    pattern.cells[track.id][step] = value;
  }

  function syncStepPianoEdit() {
    const context = state.stepPianoEditContext;
    if (!context) return false;
    const pattern = getPattern(context.patternId);
    const track = getPianoTrack(context.trackId);
    if (!pattern || !track) return false;
    if (!context.hasChanges && stepPianoNoteSignature(state.pianoNotes) === context.initialSignature) return false;
    context.hasChanges = true;
    pattern.stepPianoNotes ||= {};
    pattern.stepPianoNotes[track.id] = state.pianoNotes.map((note) => ({
      id: note.id,
      startTick: note.startTick,
      durationTicks: note.durationTicks,
      midi: note.midi,
      velocity: note.velocity,
      volume: note.volume,
      attack: note.attack,
      detune: note.detune,
    }));
    const cells = Array(STEP_COUNT).fill(false);
    const ticksPerStep = getGridTicksPerStep(pattern);
    const stepCount = getGridStepCount(pattern);
    state.pianoNotes.forEach((note) => {
      const step = Math.floor(note.startTick / ticksPerStep);
      if (step >= 0 && step < stepCount) cells[step] = true;
    });
    pattern.cells[track.id] = cells;
    if (getPattern()?.id === pattern.id) track.cells = [...cells];
    if (state.view === "sequencer" && getPattern()?.id === pattern.id) renderTracks();
    return true;
  }

  function updateStepPianoEditorControls() {
    const active = Boolean(state.stepPianoEditContext);
    $("#step-piano-context").hidden = !active;
    $("#step-piano-context-label").textContent = active
      ? `${getPianoTrack(state.stepPianoEditContext.trackId)?.name || "Instrument"} · Step progression`
      : "";
    if (active) {
      const pattern = getPattern(state.stepPianoEditContext.patternId);
      const dragSource = $("#mel-drag-source");
      dragSource.textContent = pattern ? `Drag full ${pattern.name} to Track View` : "No pattern selected";
      dragSource.title = pattern ? `Drag the full ${pattern.name} pattern to Track View` : "";
      dragSource.setAttribute("aria-label", dragSource.title || "No pattern selected");
      dragSource.disabled = !pattern;
      dragSource.style.setProperty("--pattern-color", pattern?.color || "var(--accent)");
    }
    ["#mel-select", "#piano-instrument-select", "#piano-bars-select"].forEach((selector) => {
      $(selector).closest("label").hidden = active;
    });
    ["#new-mel-button", "#rename-mel-button", "#piano-keyboard-record-button"].forEach((selector) => {
      $(selector).hidden = active;
    });
    $("#mel-drag-source").hidden = false;
  }

  function openStepInstrumentPianoRoll(trackId) {
    const pattern = getPattern();
    const track = getPianoTrack(trackId);
    if (!pattern || !track || !getPatternTrackIds(pattern).includes(trackId)) return;
    captureCurrentMel();
    const notes = getStepPianoNotes(pattern, track);
    state.stepPianoEditContext = {
      patternId: pattern.id,
      trackId,
      initialSignature: stepPianoNoteSignature(notes),
      hasChanges: Array.isArray(pattern.stepPianoNotes?.[trackId]),
      previousCursorTick: state.pianoCursorTick,
      previousView: state.view,
    };
    state.selectedPianoTrackId = trackId;
    state.pianoNotes = notes;
    state.pianoBars = pattern.steps / 16;
    state.pianoCursorTick = 0;
    state.selectedPianoNoteId = null;
    state.selectedPianoNoteIds.clear();
    state.pianoSelectionFromMarquee = false;
    updateStepPianoEditorControls();
    $("#step-track-mix-dialog").close();
    setWorkspaceView("piano-roll");
  }

  function closeStepInstrumentPianoRoll() {
    const context = state.stepPianoEditContext;
    if (!context) return;
    syncStepPianoEdit();
    state.stepPianoEditContext = null;
    loadMel(state.selectedMelId);
    state.pianoCursorTick = context.previousCursorTick;
    updateStepPianoEditorControls();
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
  }

  function renderStepPianoPreview(row, pattern, track) {
    row.querySelector(".step-piano-preview")?.remove();
    const notes = pattern.stepPianoNotes?.[track.id];
    const grid = row.querySelector(".steps-grid");
    if (!Array.isArray(notes)) {
      grid?.classList.remove("has-piano-preview");
      return;
    }
    if (!grid) return;
    grid.classList.add("has-piano-preview");
    const preview = document.createElement("div");
    preview.className = "step-piano-preview";
    preview.setAttribute("aria-hidden", "true");
    grid.append(preview);
    const cells = [...grid.querySelectorAll(".step-cell")];
    const previewBounds = preview.getBoundingClientRect();
    const ticksPerStep = getGridTicksPerStep(pattern);
    const tickToX = (tick) => {
      const step = Math.min(cells.length - 1, Math.max(0, Math.floor(tick / ticksPerStep)));
      const fraction = Math.min(1, Math.max(0, tick / ticksPerStep - step));
      const cellBounds = cells[step].getBoundingClientRect();
      const nextX = cells[step + 1]?.getBoundingClientRect().left ?? cellBounds.right;
      return cellBounds.left - previewBounds.left + (nextX - cellBounds.left) * fraction;
    };
    for (let bar = 1; bar < pattern.steps / 16; bar += 1) {
      const line = document.createElement("span");
      line.className = "step-piano-preview-bar";
      line.style.left = `${tickToX(bar * 32)}px`;
      preview.append(line);
    }
    notes.forEach((note) => {
      const item = document.createElement("span");
      const midiRange = PIANO_TOP_MIDI - PIANO_BOTTOM_MIDI;
      const pitch = Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi));
      item.className = "step-piano-preview-note";
      const left = tickToX(note.startTick);
      item.style.left = `${left}px`;
      item.style.width = `${Math.max(2, tickToX(note.startTick + note.durationTicks) - left)}px`;
      item.style.top = `${(PIANO_TOP_MIDI - pitch) / (midiRange + 1) * 100}%`;
      preview.append(item);
    });
  }

  function renderStepPianoPreviews() {
    const pattern = getPattern();
    if (!pattern) return;
    trackList.querySelectorAll(".track-row").forEach((row) => {
      const track = state.tracks.find((item) => item.id === row.dataset.trackId);
      if (track) renderStepPianoPreview(row, pattern, track);
    });
  }

  function setArrangementScale(scale) {
    const timeline = $("#timeline-scroll");
    const barOffset = timeline.scrollLeft / BAR_WIDTH;
    state.arrangementScale = Math.max(0.5, Math.min(4, scale));
    BAR_WIDTH = BASE_BAR_WIDTH * state.arrangementScale;
    renderArrangement();
    timeline.scrollLeft = barOffset * BAR_WIDTH;
  }

  function setStepCellValue(track, step, cell, value) {
    if (track.cells[step] === value) return;
    track.cells[step] = value;
    const pattern = getPattern();
    updatePatternStepPianoCell(pattern, track, step, value);
    if (Array.isArray(pattern.stepPianoNotes?.[track.id])) {
      renderStepPianoPreview(cell.closest(".track-row"), pattern, track);
    }
    cell.classList.toggle("is-on", value);
    cell.setAttribute("aria-pressed", String(value));
    cell.setAttribute("aria-label", `${track.name}, step ${step + 1}${value ? ", on" : ", off"}`);
    if (stepPaint) stepPaint.changed = true;
  }

  function clearStepCellSelection() {
    if (!state.selectedStepCells.size) return;
    state.selectedStepCells.clear();
    document.querySelectorAll(".step-cell.is-selected").forEach((cell) => cell.classList.remove("is-selected"));
  }

  function clearStepSelectionOnPointerDown(event) {
    if (state.view !== "sequencer" || event.shiftKey) return;
    clearStepCellSelection();
  }

  function paintStepAtPointer(event) {
    if (!stepPaint || event.pointerId !== stepPaint.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target instanceof Element ? target.closest(".step-cell") : null;
    const row = cell?.closest(".track-row");
    const track = row && state.tracks.find((item) => item.id === row.dataset.trackId);
    const step = Number(cell?.dataset.step);
    if (cell && track && Number.isInteger(step)) {
      event.preventDefault();
      setStepCellValue(track, step, cell, stepPaint.value);
    }
  }

  function updateStepSelectionDrag(event) {
    const drag = stepSelectionDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return;
    drag.moved = true;
    if (!drag.marquee) {
      drag.marquee = document.createElement("div");
      drag.marquee.className = "selection-marquee";
      drag.marquee.style.position = "fixed";
      document.body.append(drag.marquee);
    }
    const left = Math.min(drag.startX, event.clientX);
    const top = Math.min(drag.startY, event.clientY);
    const right = Math.max(drag.startX, event.clientX);
    const bottom = Math.max(drag.startY, event.clientY);
    Object.assign(drag.marquee.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
    });
    const selection = new Set(drag.initialSelection);
    document.querySelectorAll(".step-cell").forEach((cell) => {
      const bounds = cell.getBoundingClientRect();
      if (bounds.left <= right && bounds.right >= left && bounds.top <= bottom && bounds.bottom >= top) {
        const trackId = cell.closest(".track-row")?.dataset.trackId;
        if (trackId) selection.add(`${trackId}:${cell.dataset.step}`);
      }
    });
    state.selectedStepCells = selection;
    document.querySelectorAll(".step-cell").forEach((cell) => {
      const key = `${cell.closest(".track-row")?.dataset.trackId}:${cell.dataset.step}`;
      cell.classList.toggle("is-selected", state.selectedStepCells.has(key));
    });
  }

  function finishStepSelectionDrag(event) {
    const drag = stepSelectionDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    updateStepSelectionDrag(event);
    if (!drag.moved) state.selectedStepCells.add(`${drag.trackId}:${drag.step}`);
    drag.marquee?.remove();
    stepSelectionDrag = null;
    document.querySelectorAll(".step-cell").forEach((cell) => {
      const key = `${cell.closest(".track-row")?.dataset.trackId}:${cell.dataset.step}`;
      cell.classList.toggle("is-selected", state.selectedStepCells.has(key));
    });
    window.setTimeout(() => { suppressStepClick = false; }, 0);
  }

  function finishStepPaint(event) {
    if (!stepPaint || event.pointerId !== stepPaint.pointerId) return;
    const changed = stepPaint.changed;
    stepPaint = null;
    if (changed) saveState();
    window.setTimeout(() => { suppressStepClick = false; }, 0);
  }

  function remapGridCells(cells, bars, previousSlotsPerBar, nextSlotsPerBar) {
    const remapped = Array(STEP_COUNT).fill(false);
    for (let index = 0; index < bars * previousSlotsPerBar; index += 1) {
      if (!cells[index]) continue;
      const bar = Math.floor(index / previousSlotsPerBar);
      const stepInBar = index % previousSlotsPerBar;
      const nextStepInBar = Math.min(nextSlotsPerBar - 1, Math.round(stepInBar * nextSlotsPerBar / previousSlotsPerBar));
      remapped[bar * nextSlotsPerBar + nextStepInBar] = true;
    }
    return remapped;
  }

  function getGridTicksPerStep(pattern = getPattern()) {
    return 32 / getStepsPerBar(pattern);
  }

  function getGridEventsForTick(pattern, clockTick) {
    const ticksPerStep = getGridTicksPerStep(pattern);
    const subdivisions = Math.max(1, Math.round(1 / ticksPerStep));
    const stepCount = getGridStepCount(pattern);
    return Array.from({ length: subdivisions }, (_, subdivision) => {
      const tickOffset = subdivision / subdivisions;
      const step = (clockTick + tickOffset) / ticksPerStep;
      return Number.isInteger(step) ? { step: step % stepCount, tickOffset } : null;
    }).filter(Boolean);
  }

  function isSongWorkspace() {
    return state.view === "arrangement" || state.view === "piano-roll" || state.view === "mixer";
  }

  function renderViewLayout() {
    const main = $("#arrangement-main");
    $("#workspace-area").hidden = state.workspaceHidden;
    $("#track-view-area").hidden = state.trackViewHidden;
    $("#view-resizer").hidden = state.workspaceHidden || state.trackViewHidden;
    if (state.workspaceHidden) main.style.gridTemplateRows = "0px 0px minmax(0, 1fr)";
    else if (state.trackViewHidden) main.style.gridTemplateRows = "minmax(0, 1fr) 0px 0px";
    else main.style.gridTemplateRows = `minmax(0, ${state.workspaceRatio}fr) 9px minmax(0, ${100 - state.workspaceRatio}fr)`;
    $("#view-resizer").setAttribute("aria-valuenow", String(state.workspaceRatio));
    $("#view-resizer").setAttribute("aria-valuetext", `Workspace ${state.workspaceRatio}%, Track View ${100 - state.workspaceRatio}%`);
    $("#hide-workspace-button").hidden = state.workspaceHidden;
    $("#show-track-view-button").hidden = !state.trackViewHidden;
    $("#hide-track-view-button").hidden = state.trackViewHidden;
    $("#show-workspace-button").hidden = !state.workspaceHidden;
    updatePianoRulerViewport();
  }

  function setViewVisibility(workspaceHidden, trackViewHidden) {
    state.workspaceHidden = workspaceHidden;
    state.trackViewHidden = trackViewHidden;
    renderViewLayout();
    saveState();
    if (workspaceHidden) $("#show-workspace-button").focus();
    if (trackViewHidden) $("#show-track-view-button").focus();
  }

  function setWorkspaceRatio(ratio) {
    state.workspaceRatio = Math.max(20, Math.min(80, Math.round(ratio)));
    renderViewLayout();
    saveState();
  }

  function getPatternColor(index) {
    if (index < PATTERN_COLORS.length) return PATTERN_COLORS[index];
    return `hsl(${Math.round(index * 137.508 % 360)} 68% 66%)`;
  }

  function isPatternColor(color) {
    return typeof color === "string" && (/^#[\da-f]{6}$/i.test(color) || /^hsl\(\d{1,3} 68% 66%\)$/.test(color));
  }

  function getPatternTrackIds(pattern) {
    const trackIds = Array.isArray(pattern?.trackIds)
      ? pattern.trackIds
      : state.tracks.filter((track) => !track.libraryOnly).map((track) => track.id);
    return trackIds.filter((trackId) => {
      const track = state.tracks.find((item) => item.id === trackId);
      return track && !track.libraryOnly && track.kind !== "drumkit";
    });
  }

  function makePatternSnapshot(id, name, color = getPatternColor(state.patterns.length)) {
    const cells = {};
    const variants = {};
    state.tracks.forEach((track) => {
      cells[track.id] = Array.from({ length: STEP_COUNT }, (_, index) => track.cells[index] === true);
      if (SOUND_VARIANTS[track.kind]) variants[track.id] = track.variant || "classic";
    });
    return {
      id,
      name,
      kind: "pattern",
      color,
      steps: state.steps,
      trackIds: state.tracks.filter((track) => !track.libraryOnly && track.kind !== "drumkit").map((track) => track.id),
      cells,
      variants,
      gridResolution: "1/16",
      volume: 1,
      effects: makeDefaultEffects(),
      effectSettings: makeDefaultEffectSettings(),
      effectChain: [],
    };
  }

  function captureCurrentPattern() {
    const pattern = getPattern();
    if (!pattern) return;
    pattern.steps = state.steps;
    const trackIds = getPatternTrackIds(pattern).filter((id) => state.tracks.some((track) => track.id === id));
    pattern.trackIds = trackIds;
    pattern.cells = {};
    pattern.variants = {};
    pattern.gridResolution = getPatternGridResolution(pattern);
    state.tracks.filter((track) => trackIds.includes(track.id)).forEach((track) => {
      pattern.cells[track.id] = Array.from({ length: STEP_COUNT }, (_, index) => track.cells[index] === true);
      if (SOUND_VARIANTS[track.kind]) pattern.variants[track.id] = track.variant || "classic";
    });
  }

  function clearSelectedStepCells() {
    const selected = new Set(state.selectedStepCells);
    let changed = false;
    state.tracks.forEach((track) => track.cells.forEach((active, step) => {
      if (active && selected.has(`${track.id}:${step}`)) {
        track.cells[step] = false;
        updatePatternStepPianoCell(getPattern(), track, step, false);
        changed = true;
      }
    }));
    state.selectedStepCells.clear();
    if (changed) {
      renderTracks();
      saveState();
    } else {
      document.querySelectorAll(".step-cell.is-selected").forEach((cell) => cell.classList.remove("is-selected"));
    }
  }

  function applyPattern(pattern) {
    state.selectedPatternId = pattern.id;
    state.steps = normalizePatternSteps(pattern.steps);
    const patternTrackIds = new Set(getPatternTrackIds(pattern));
    state.tracks.forEach((track) => {
      track.cells = patternTrackIds.has(track.id)
        ? Array.from({ length: STEP_COUNT }, (_, index) => pattern.cells?.[track.id]?.[index] === true)
        : Array(STEP_COUNT).fill(false);
      const variant = pattern.variants?.[track.id];
      if (patternTrackIds.has(track.id) && SOUND_VARIANTS[track.kind]) {
        track.variant = SOUND_VARIANTS[track.kind].some((sound) => sound.id === variant) ? variant : "classic";
      }
    });
    renderPatternLengthControls();
    $("#grid-resolution-select").value = getPatternGridResolution(pattern);
    renderHeader();
  }

  function renderPatternSelectors() {
    [$("#sequencer-pattern-select"), $("#arrangement-pattern-select")].forEach((select) => {
      select.replaceChildren();
      state.patterns.forEach((pattern) => {
        const option = document.createElement("option");
        option.value = pattern.id;
        option.textContent = pattern.name;
        select.append(option);
      });
      select.value = state.selectedPatternId;
    });
    const selected = getPattern();
    const dragSource = $("#pattern-drag-source");
    dragSource.textContent = selected ? `Drag ${selected.name} to timeline` : "No pattern selected";
    dragSource.disabled = !selected;
    dragSource.style.setProperty("--pattern-color", selected?.color || "var(--accent)");
    $("#grid-resolution-select").value = getPatternGridResolution(selected);
  }

  function getPianoTrack(trackId = state.selectedPianoTrackId) {
    return state.tracks.find((track) => track.id === trackId) || null;
  }

  function getMel(melId = state.selectedMelId) {
    return state.mels.find((mel) => mel.id === melId) || null;
  }

  function makeMel(name, instrumentId = state.selectedPianoTrackId, bars = state.pianoBars, notes = []) {
    return { id: makeId(), name, instrumentId, bars, notes: notes.map((note) => ({ ...note })) };
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
          id: makeId(), name: mel.name, kind: "mel", instrumentId: mel.instrumentId, color: "#b5a0ff",
              muted: false, solo: false, volume: 1, gainNode: null, effects: makeDefaultEffects(),
              clips: [{ id: makeId(), melId: mel.id, startBar: state.pianoStartBar }],
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
    const maxTick = state.pianoBars * PIANO_TICKS_PER_BAR;
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
    const mel = getMel();
    const loopTicks = Math.max(1, (mel ? getMelLengthBars(mel) : 1) * PIANO_TICKS_PER_BAR);
    const elapsedTicks = Math.max(0, state.audioContext.currentTime - startTime) / (240 / state.bpm) * PIANO_TICKS_PER_BAR;
    state.pianoCursorTick = elapsedTicks % loopTicks;
    updatePianoPlayhead(true);
  }

  function setPianoCursorTick(tick, seek = true, persist = true) {
    const maxTick = state.pianoBars * PIANO_TICKS_PER_BAR;
    state.pianoCursorTick = Math.max(0, Math.min(maxTick - 0.001, tick));
    updatePianoPlayhead(true);
    if (seek && state.audioContext) {
      const mel = getMel();
      const loopTicks = Math.max(1, (mel ? getMelLengthBars(mel) : 1) * PIANO_TICKS_PER_BAR);
      const cursorTick = state.pianoCursorTick % loopTicks;
      const now = state.audioContext.currentTime;
      const startTime = now + 0.04 - cursorTick / PIANO_TICKS_PER_BAR * (240 / state.bpm);
      const player = state.workspacePlayers["piano-roll"];
      if (player) {
        player.startTime = startTime;
        player.nextStepTime = now + 0.04;
        player.stepIndex = Math.floor(cursorTick) % PIANO_TICKS_PER_BAR;
        player.scheduledMelNotes.clear();
      }
      if (state.isPlaying && state.playbackMode === "piano-roll") {
        state.playbackStartTime = startTime;
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

  function renderPianoRoll() {
    updateStepPianoEditorControls();
    $("#piano-bars-select").value = String(state.pianoBars);
    $("#piano-scale-slider").value = String(Math.round(state.pianoScale * 100));
    $("#piano-scale-value").textContent = `${Math.round(state.pianoScale * 100)}%`;
    $("#piano-snap-select").value = state.pianoSnapEnabled ? String(state.pianoSnap) : "off";
    $("#piano-note-length-select").value = String(state.pianoNoteLength);
    const keys = $("#piano-roll-keys");
    const ruler = $("#piano-roll-ruler");
    const grid = $("#piano-roll-grid");
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
    grid.style.width = `${width}px`;
    grid.style.height = `${height}px`;
    grid.style.setProperty("--piano-tick-width", `${tickWidth}px`);
    grid.style.setProperty("--piano-beat-width", `${tickWidth * 8}px`);
    grid.style.setProperty("--piano-bar-width", `${tickWidth * PIANO_TICKS_PER_BAR}px`);
    grid.classList.toggle("is-draw-mode", state.pianoDrawMode);
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
      $(".piano-roll-editor").append(playhead);
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
    for (let midi = PIANO_TOP_MIDI; midi >= PIANO_BOTTOM_MIDI; midi -= 1) {
      const row = document.createElement("div");
      const pitchClass = midi % 12;
      row.className = `piano-roll-row${[1, 3, 6, 8, 10].includes(pitchClass) ? " is-black" : ""}${pitchClass === 0 ? " is-c" : ""}`;
      row.style.top = `${(PIANO_TOP_MIDI - midi) * PIANO_ROW_HEIGHT}px`;
      grid.append(row);
      const key = document.createElement("button");
      key.type = "button";
      key.className = `piano-roll-key${[1, 3, 6, 8, 10].includes(pitchClass) ? " is-black" : ""}${pitchClass === 0 ? " is-octave" : ""}`;
      key.textContent = pitchClass === 0 ? midiNoteName(midi) : "";
      key.setAttribute("aria-label", `Preview ${midiNoteName(midi)}`);
      key.addEventListener("click", async () => {
        try {
          await ensureAudio();
          playPianoNote(getPianoTrack(), state.audioContext.currentTime + 0.015, midi, 0.4, 0.75);
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
        element.className = `piano-roll-note${state.selectedPianoNoteIds.has(note.id) || note.id === state.selectedPianoNoteId ? " is-selected" : ""}`;
        element.dataset.noteId = note.id;
        element.style.setProperty("--note-color", track.color);
        element.style.left = `${note.startTick * tickWidth + 1}px`;
        element.style.top = `${(PIANO_TOP_MIDI - note.midi) * PIANO_ROW_HEIGHT + 1}px`;
        element.style.width = `${Math.max(getPianoSnapStep() * tickWidth, note.durationTicks * tickWidth - 2)}px`;
        element.textContent = midiNoteName(note.midi);
        element.title = `${track.name} · ${midiNoteName(note.midi)} · ${note.durationTicks}/32`;
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute("aria-label", `${track.name}, ${midiNoteName(note.midi)}, start ${note.startTick}/32, duration ${note.durationTicks}/32`);
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
    if (property === "attack") {
      const track = getPianoTrack(note.trackId);
      const defaultAttack = track?.kind === "instrument" ? Number(track.patch?.attack) || 0.005 : 0;
      return (note.attack ?? defaultAttack) * 1000;
    }
    return note.detune ?? 0;
  }

  function updatePianoNoteContextOutput(property, value) {
    const output = $(`#piano-note-${property}-value`);
    output.textContent = property === "attack" ? `${Math.round(value)} ms`
      : property === "detune" ? `${Math.round(value)} cents`
        : `${Math.round(value)}%`;
  }

  function openPianoNoteContextMenu(event, note) {
    event.preventDefault();
    event.stopPropagation();
    if (!state.selectedPianoNoteIds.has(note.id)) selectPianoNote(note.id);
    state.selectedPianoNoteId = note.id;
    pianoNoteContextTargetIds = state.pianoNotes
      .filter((item) => state.selectedPianoNoteIds.has(item.id))
      .map((item) => item.id);
    const menu = $("#piano-note-context-menu");
    ["volume", "attack", "velocity", "detune"].forEach((property) => {
      const input = $(`#piano-note-${property}`);
      const value = getPianoNoteContextValue(note, property);
      input.value = String(property === "volume" || property === "velocity" ? value * 100 : value);
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
    const value = property === "volume" || property === "velocity" ? sliderValue / 100 : sliderValue;
    const noteValue = property === "attack" ? value / 1000 : value;
    const targets = new Set(pianoNoteContextTargetIds);
    state.pianoNotes.forEach((note) => {
      if (targets.has(note.id)) note[property] = noteValue;
    });
    updatePianoNoteContextOutput(property, sliderValue);
    saveState();
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
      midi: PIANO_TOP_MIDI - row,
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
    ensureAudio().then(() => playPianoNote(getPianoTrack(note.trackId), state.audioContext.currentTime + 0.015,
      note.midi, note.durationTicks / PIANO_TICKS_PER_BAR * (240 / state.bpm), note.velocity, getPianoTrack(note.trackId), null, note))
      .catch((error) => showToast(error.message || "The instrument could not be played."));
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
        const deltaPitch = Math.max(PIANO_BOTTOM_MIDI - minPitch, Math.min(PIANO_TOP_MIDI - maxPitch,
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
      const deltaPitch = Math.max(PIANO_BOTTOM_MIDI - minPitch,
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

  function addPatternInstrument(trackId) {
    const pattern = getPattern();
    const source = state.tracks.find((item) => item.id === trackId && !item.sourceId && item.kind !== "drumkit");
    if (!pattern || !source) return false;
    captureCurrentPattern();
    const layerCount = getPatternTrackIds(pattern).filter((id) => {
      const layer = state.tracks.find((item) => item.id === id);
      return layer && (layer.id === source.id || layer.sourceId === source.id);
    }).length;
    const track = makePatternInstrumentLayer(source, {
      name: layerCount ? `${source.name} ${layerCount + 1}` : source.name,
    });
    state.tracks.push(track);
    pattern.trackIds.push(track.id);
    pattern.cells[track.id] = Array(STEP_COUNT).fill(false);
    if (SOUND_VARIANTS[track.kind]) pattern.variants[track.id] = track.variant || "classic";
    renderTracks();
    renderPatternSelectors();
    saveState();
    showToast(`${track.name} added to ${pattern.name}`);
    return true;
  }

  function getStepInstrumentGroup(track) {
    if (track.sampleCategory && track.family) return `${track.family} · ${track.sampleCategory}`;
    if (track.kind === "sample") return "User Samples";
    if (track.family === "Drums" || !track.family) {
      const groups = {
        kick: "Drums · Kicks",
        snare: "Drums · Snares",
        clap: "Drums · Claps",
        hat: "Drums · Closed Hi-Hats",
        openhat: "Drums · Open Hi-Hats",
        rim: "Drums · Rims & Percussion",
        drumkit: "Drum Kits",
      };
      return groups[track.kind] || "Drums · Other";
    }
    return track.family;
  }

  function renderStepInstrumentLibrary(query = "") {
    const library = $("#step-instrument-library");
    library.replaceChildren();
    const groups = new Map();
    getStepPickerInstruments()
      .filter((track) => matchesInstrumentSearch(track, query))
      .forEach((track) => {
        const groupName = getStepInstrumentGroup(track);
        if (!groups.has(groupName)) groups.set(groupName, []);
        groups.get(groupName).push(track);
      });
    Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([groupName, instruments]) => {
        const group = document.createElement("section");
        group.className = "step-instrument-group";
        group.dataset.instrumentGroup = groupName;
        const heading = document.createElement("h3");
        heading.textContent = groupName;
        const choices = document.createElement("div");
        choices.className = "step-instrument-choices";
        instruments
          .sort((left, right) => left.name.localeCompare(right.name))
          .forEach((instrument) => {
            const choice = document.createElement("button");
            choice.className = "step-instrument-choice";
            choice.type = "button";
            choice.dataset.soundId = instrument.id;
            choice.style.setProperty("--instrument-color", instrument.color);
            choice.textContent = instrument.name;
            choice.addEventListener("contextmenu", (event) => openSoundDurationMenu(instrument, event));
            choice.addEventListener("click", () => {
              library.querySelectorAll(".step-instrument-choice.is-selected").forEach((selectedChoice) => {
                selectedChoice.classList.remove("is-selected");
                selectedChoice.setAttribute("aria-pressed", "false");
              });
              choice.classList.add("is-selected");
              choice.setAttribute("aria-pressed", "true");
              stepInstrumentPendingId = instrument.id;
              const selectButton = $("#step-instrument-select");
              selectButton.disabled = true;
              loadLibrarySample(instrument).then(() => {
                if (stepInstrumentPendingId !== instrument.id || !$("#step-instrument-dialog").open) return;
                selectButton.disabled = false;
                previewInstrumentSound(instrument);
              }).catch((error) => {
                if (stepInstrumentPendingId === instrument.id) {
                  showToast(error.message || `Could not load ${instrument.name}.`);
                }
              });
            });
            choice.setAttribute("aria-pressed", "false");
            choices.append(choice);
          });
        group.append(heading, choices);
        library.append(group);
      });
    if (!library.childElementCount && query) {
      const empty = document.createElement("div");
      empty.className = "instrument-search-empty";
      empty.textContent = `No sounds found for "${query}".`;
      library.append(empty);
    }
  }

  function openStepInstrumentPicker(targetTrackId = null, pickerMode = "step") {
    stepInstrumentTargetTrackId = targetTrackId;
    stepInstrumentPickerMode = pickerMode;
    stepInstrumentPendingId = null;
    $("#step-instrument-select").disabled = true;
    const searchInput = $("#sound-library-search-input");
    searchInput.value = "";
    renderSoundSearchSuggestions("");
    renderStepInstrumentLibrary();
    $("#step-instrument-title").textContent = pickerMode === "piano-roll"
      ? "Choose a piano roll instrument"
      : targetTrackId ? "Choose a row instrument" : "Choose an instrument";
    $("#step-instrument-dialog").showModal();
  }

  function getSoundDurationKey(track) {
    return track.sourceId || track.id;
  }

  function getSoundDurationScale(track) {
    return state.soundDurationEdits[getSoundDurationKey(track)] ?? 1;
  }

  function closeSoundDurationMenu() {
    const menu = $("#sound-duration-menu");
    menu.hidden = true;
    delete menu.dataset.soundId;
    delete menu.dataset.trackId;
  }

  function openSoundDurationMenu(track, event) {
    if (track.kind === "drumkit") return;
    event.preventDefault();
    const menu = $("#sound-duration-menu");
    const dialog = event.currentTarget.closest("dialog");
    if (dialog && menu.parentElement !== dialog) dialog.append(menu);
    const soundId = getSoundDurationKey(track);
    const slider = $("#sound-duration-slider");
    slider.value = String(Math.round((state.soundDurationEdits[soundId] ?? 1) * 100));
    $("#sound-duration-title").textContent = track.name;
    $("#sound-duration-value").textContent = `${slider.value}%`;
    menu.dataset.soundId = soundId;
    menu.dataset.trackId = track.id;
    menu.hidden = false;
    const bounds = dialog?.getBoundingClientRect() || {
      left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight,
    };
    menu.style.left = `${Math.max(bounds.left + 8, Math.min(event.clientX, bounds.right - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(bounds.top + 8, Math.min(event.clientY, bounds.bottom - menu.offsetHeight - 8))}px`;
  }

  function setSoundDurationFromMenu(value) {
    const menu = $("#sound-duration-menu");
    const soundId = menu.dataset.soundId;
    if (!soundId) return;
    const durationScale = Math.max(0.01, Math.min(1, value / 100));
    if (durationScale === 1) delete state.soundDurationEdits[soundId];
    else state.soundDurationEdits[soundId] = durationScale;
    $("#sound-duration-value").textContent = `${Math.round(durationScale * 100)}%`;
    saveState();
  }

  async function applyStepInstrumentSelection() {
    const instrument = state.tracks.find((track) => track.id === stepInstrumentPendingId && !track.sourceId);
    if (!instrument) {
      showToast("Choose an instrument before selecting.");
      return;
    }
    const selectButton = $("#step-instrument-select");
    selectButton.disabled = true;
    try {
      await loadLibrarySample(instrument);
    } catch (error) {
      showToast(error.message || `Could not load ${instrument.name}.`);
      selectButton.disabled = false;
      return;
    }
    if (stepInstrumentPendingId !== instrument.id) return;
    if (stepInstrumentPickerMode === "piano-roll") {
      selectPianoInstrument(instrument.id);
    } else {
      const applied = stepInstrumentTargetTrackId
        ? replacePatternInstrument(stepInstrumentTargetTrackId, instrument.id)
        : addPatternInstrument(instrument.id);
      if (!applied) return;
    }
    $("#step-instrument-dialog").close();
  }

  function replacePatternInstrument(trackId, sourceId) {
    const pattern = getPattern();
    const oldTrack = state.tracks.find((track) => track.id === trackId);
    const source = state.tracks.find((track) => track.id === sourceId && !track.sourceId && track.kind !== "drumkit");
    if (!pattern || !oldTrack || !source || oldTrack.kind === "drumkit") return false;
    if (oldTrack.id === source.id || oldTrack.sourceId === source.id) return true;
    captureCurrentPattern();
    pattern.trackIds = getPatternTrackIds(pattern);
    const rowIndex = pattern.trackIds.indexOf(oldTrack.id);
    if (rowIndex < 0) return false;
    const replacement = makePatternInstrumentLayer(source, {
      name: source.name,
      cells: oldTrack.cells,
      volume: oldTrack.volume,
      muted: oldTrack.muted,
      solo: oldTrack.solo,
      pitch: oldTrack.pitch,
      swing: oldTrack.swing,
      effects: oldTrack.effects,
    });
    state.tracks.push(replacement);
    pattern.trackIds[rowIndex] = replacement.id;
    delete pattern.cells[oldTrack.id];
    delete pattern.variants[oldTrack.id];
    if (pattern.stepPianoNotes?.[oldTrack.id]) {
      pattern.stepPianoNotes[replacement.id] = pattern.stepPianoNotes[oldTrack.id].map((note) => ({ ...note }));
      delete pattern.stepPianoNotes[oldTrack.id];
    }
    pattern.cells[replacement.id] = [...replacement.cells];
    if (SOUND_VARIANTS[replacement.kind]) pattern.variants[replacement.id] = replacement.variant || "classic";
    state.selectedStepCells.clear();
    state.selectedPreset = null;
    const isUsedElsewhere = state.patterns.some((item) => item.id !== pattern.id && getPatternTrackIds(item).includes(oldTrack.id));
    if (oldTrack.sourceId && !isUsedElsewhere) {
      disconnectTrackAudio(oldTrack);
      state.tracks = state.tracks.filter((track) => track !== oldTrack);
    }
    renderTracks();
    renderPatternSelectors();
    renderPresets();
    saveState();
    showToast(`${oldTrack.name} replaced with ${source.name}`);
    return true;
  }

  function openStepTrackMix(track) {
    $("#step-track-mix-title").textContent = `${track.name} mix`;
    const controls = $("#step-track-mix-controls");
    controls.replaceChildren();
    const soundGroup = document.createElement("div");
    soundGroup.className = "step-mix-group";
    const soundHeading = document.createElement("h3");
    soundHeading.textContent = "Sound";
    soundGroup.append(
      soundHeading,
      makeStepTrackMixRange(track, "pitch", "Pitch", -12, 12, 1, " st"),
      makeStepTrackMixRange(track, "volume", "Volume", 0, 100, 1, "%"),
      makeStepTrackMixRange(track, "swing", "Swing", 0, 45, 1, "%"),
    );
    const eqGroup = document.createElement("div");
    eqGroup.className = "step-mix-group";
    const eqHeading = document.createElement("h3");
    eqHeading.textContent = "3-band EQ";
    eqGroup.append(
      eqHeading,
      makeMixerRange(track, "eqLow", "Low", -12, 12, 1, " dB"),
      makeMixerRange(track, "eqMid", "Mid", -12, 12, 1, " dB"),
      makeMixerRange(track, "eqHigh", "High", -12, 12, 1, " dB"),
    );
    const editButton = document.createElement("button");
    editButton.className = "quiet-button step-piano-edit-button";
    editButton.type = "button";
    editButton.textContent = "Edit progression in Piano Roll";
    editButton.addEventListener("click", () => openStepInstrumentPianoRoll(track.id));
    controls.append(soundGroup, eqGroup, editButton);
    $("#step-track-mix-dialog").showModal();
  }

  function makeStepTrackMixRange(track, id, label, min, max, step, unit) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control step-mix-control";
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    const currentValue = id === "volume"
      ? Math.round(track.volume * 100)
      : id === "swing" && !Number.isFinite(track.swing) ? state.swing : track[id];
    input.value = String(currentValue);
    input.setAttribute("aria-label", `${track.name} ${label}`);
    const value = document.createElement("output");
    value.textContent = `${currentValue}${unit}`;
    input.addEventListener("input", () => {
      const nextValue = Number(input.value);
      if (id === "volume") {
        track.volume = nextValue / 100;
        updateTrackGains();
      } else {
        track[id] = nextValue;
      }
      value.textContent = `${input.value}${unit}`;
      saveState();
    });
    control.append(caption, input, value);
    return control;
  }

  function removePatternInstrument(track) {
    const pattern = getPattern();
    if (!pattern) return;
    captureCurrentPattern();
    pattern.trackIds = getPatternTrackIds(pattern).filter((id) => id !== track.id);
    delete pattern.cells[track.id];
    delete pattern.variants[track.id];
    if (pattern.stepPianoNotes) delete pattern.stepPianoNotes[track.id];
    track.cells = Array(STEP_COUNT).fill(false);
    track.solo = false;
    if (track.sourceId && !state.patterns.some((item) => item.id !== pattern.id && getPatternTrackIds(item).includes(track.id))) {
      track.gainNode?.disconnect();
      state.tracks = state.tracks.filter((item) => item !== track);
      if (track.kind === "sample" || track.sample) {
        deletePersistedDrumSample(track.id).catch(() => showToast("Layer removed, but its saved sample could not be deleted."));
      }
    }
    updateTrackGains();
    renderTracks();
    renderPatternSelectors();
    saveState();
    showToast(`${track.name} removed from ${pattern.name}`);
  }

  function selectPattern(patternId) {
    const pattern = getPattern(patternId);
    if (!pattern) return;
    if (pattern.id === state.selectedPatternId) return;
    if (state.keyboardRecording?.mode === "sequencer") stopPlayback();
    state.selectedStepCells.clear();
    captureCurrentPattern();
    applyPattern(pattern);
    state.selectedPreset = null;
    renderTracks();
    renderPresets();
    renderPatternSelectors();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    saveState();
  }

  function createPattern(showNotification = true, selectCreated = true) {
    captureCurrentPattern();
    const source = getPattern();
    if (!source) return;
    let number = state.patterns.length + 1;
    while (state.patterns.some((pattern) => pattern.name === `Pattern ${number}`)) number += 1;
    const pattern = {
      id: makeId(),
      name: `Pattern ${number}`,
      kind: "pattern",
      color: getPatternColor(state.patterns.length),
      steps: source.steps,
      trackIds: [...getPatternTrackIds(source)],
      cells: Object.fromEntries(Object.entries(source.cells).map(([trackId, cells]) => [trackId, [...cells]])),
      variants: { ...source.variants },
      ...(source.stepPianoNotes ? {
        stepPianoNotes: Object.fromEntries(Object.entries(source.stepPianoNotes).map(([trackId, notes]) =>
          [trackId, notes.map((note) => ({ ...note }))])),
      } : {}),
      gridResolution: getPatternGridResolution(source),
      volume: 1,
      effects: makeDefaultEffects(),
      effectSettings: makeDefaultEffectSettings(),
      effectChain: [],
    };
    state.patterns.push(pattern);
    if (selectCreated) {
      state.selectedStepCells.clear();
      applyPattern(pattern);
      state.selectedPreset = null;
      renderTracks();
    }
    renderPresets();
    renderPatternSelectors();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    saveState();
    if (showNotification) showToast(`${pattern.name} created from the selected pattern`);
    return pattern;
  }

  function renamePattern() {
    const pattern = getPattern();
    if (!pattern) return;
    const name = window.prompt("Rename pattern", pattern.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Pattern name cannot be empty.");
      return;
    }
    if (state.patterns.some((item) => item.id !== pattern.id && item.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast("A pattern with that name already exists.");
      return;
    }
    pattern.name = trimmed;
    renderPatternSelectors();
    if (isSongWorkspace()) renderArrangement();
    saveState();
  }

  function renderHeader() {
    stepsHeader.innerHTML = "";
    $("#sequencer-scale-slider").value = String(Math.round(state.sequencerScale * 100));
    $("#sequencer-scale-value").textContent = `${Math.round(state.sequencerScale * 100)}%`;
    const slotsPerBar = getStepsPerBar();
    const stepCount = getGridStepCount();
    setSequencerGridDimensions(stepCount, slotsPerBar);
    for (let step = 0; step < stepCount; step += 1) {
      const barStep = step % slotsPerBar;
      const stepsPerBeat = slotsPerBar / 4;
      const number = document.createElement("span");
      number.className = `step-number${barStep % stepsPerBeat === 0 ? " is-beat" : ""}${barStep === 0 ? " is-bar" : ""}`;
      number.textContent = String(barStep + 1).padStart(2, "0");
      stepsHeader.append(number);
    }
  }

  function renderTracks() {
    trackList.innerHTML = "";
    const includedTrackIds = new Set(getPatternTrackIds(getPattern()));
    const visibleTracks = state.tracks.filter((track) => includedTrackIds.has(track.id));
    const liveKeys = state.keyboardRecording?.mode === "sequencer" ? getStepKeyboardMap() : null;
    setSequencerGridDimensions(getGridStepCount(), getStepsPerBar());
    visibleTracks.forEach((track) => {
      const row = document.createElement("div");
      row.className = "track-row";
      row.dataset.trackId = track.id;
      row.style.setProperty("--track-color", track.color);
      const slotsPerBar = getStepsPerBar();
      const stepCount = getGridStepCount();
      const cellHeight = 21;
      row.style.minHeight = "44px";

      const meta = document.createElement("div");
      meta.className = "track-meta";
      const color = document.createElement("span");
      color.className = "track-color";
      color.setAttribute("aria-hidden", "true");
      const info = document.createElement("div");
      info.className = "track-info";
      const name = document.createElement("div");
      name.className = "track-name";
      const nameText = document.createElement("span");
      nameText.className = "track-name-text";
      nameText.textContent = track.name;
      const chooseInstrument = document.createElement("button");
      chooseInstrument.className = "track-instrument-picker";
      chooseInstrument.type = "button";
      chooseInstrument.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>';
      chooseInstrument.setAttribute("aria-label", `Choose instrument for ${track.name}`);
      chooseInstrument.setAttribute("aria-haspopup", "dialog");
      chooseInstrument.setAttribute("aria-controls", "step-instrument-dialog");
      chooseInstrument.title = "Choose row instrument";
      chooseInstrument.addEventListener("click", () => openStepInstrumentPicker(track.id));
      name.append(nameText, chooseInstrument);
      const liveKey = liveKeys?.get(track.id);
      if (liveKey) {
        const keyHint = document.createElement("kbd");
        keyHint.className = "live-key-hint";
        keyHint.textContent = liveKey.label;
        name.append(keyHint);
        name.title = `${track.name} · press ${liveKey.label} to record`;
      }
      const subtitle = document.createElement("div");
      subtitle.className = `track-subtitle${track.sample ? " has-sample" : ""}`;
      subtitle.title = track.sample?.name || track.subtitle;
      subtitle.textContent = track.sample?.name || track.subtitle;
      info.append(name, subtitle);
      const controls = document.createElement("div");
      controls.className = "track-controls";
      controls.append(
        makeTrackButton("mute", "Mute track", track),
        makeTrackButton("solo", "Solo track", track),
        makeTrackButton("sample", track.sample ? "Replace loaded sample" : "Load an audio sample", track),
        makeTrackButton("remove-from-pattern", "Remove instrument from this pattern", track),
        makeTrackButton("mix", `Open ${track.name} mix`, track),
      );
      if (track.kind === "sample" && !track.sourceId) controls.append(makeTrackButton("remove", "Remove imported drum sound", track));
      meta.append(color, info, controls);

      const grid = document.createElement("div");
      grid.className = "steps-grid";
      grid.style.setProperty("--step-cell-height", `${cellHeight}px`);
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", `${track.name} steps`);
      for (let step = 0; step < stepCount; step += 1) {
        const cell = document.createElement("button");
        const stepInBar = step % slotsPerBar;
        const stepsPerBeat = slotsPerBar / 4;
        cell.className = `step-cell${track.cells[step] ? " is-on" : ""}${state.selectedStepCells.has(`${track.id}:${step}`) ? " is-selected" : ""}${stepInBar === 0 ? " is-bar" : stepInBar % stepsPerBeat === 0 ? " is-beat" : ""}`;
        cell.type = "button";
        cell.dataset.step = String(step);
        cell.setAttribute("aria-label", `${track.name}, step ${step + 1}${track.cells[step] ? ", on" : ", off"}`);
        cell.setAttribute("aria-pressed", String(track.cells[step]));
        if (state.currentStep === step) cell.classList.add("is-playhead");
        cell.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          stepSelectionAnchor = { trackId: track.id, step };
          if (event.shiftKey) {
            event.preventDefault();
            state.selectedArrangementItems.clear();
            state.arrangementSelectionFromMarquee = false;
            state.selectedPianoNoteIds.clear();
            state.selectedPianoNoteId = null;
            state.pianoSelectionFromMarquee = false;
            updateArrangementSelection();
            document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
            stepSelectionDrag = {
              pointerId: event.pointerId,
              trackId: track.id,
              step,
              startX: event.clientX,
              startY: event.clientY,
              initialSelection: new Set(state.selectedStepCells),
              moved: false,
              marquee: null,
            };
            suppressStepClick = true;
            return;
          }
          if (event.pointerType !== "mouse") return;
          stepPaint = { pointerId: event.pointerId, value: !track.cells[step], changed: false };
          suppressStepClick = true;
          setStepCellValue(track, step, cell, stepPaint.value);
        });
        cell.addEventListener("click", (event) => {
          const cellKey = `${track.id}:${step}`;
          if (suppressStepClick) {
            suppressStepClick = false;
            return;
          }
          stepSelectionAnchor = { trackId: track.id, step };
          if (event.shiftKey) {
            state.selectedArrangementItems.clear();
            state.arrangementSelectionFromMarquee = false;
            state.selectedPianoNoteIds.clear();
            state.selectedPianoNoteId = null;
            state.pianoSelectionFromMarquee = false;
            updateArrangementSelection();
            document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
            state.selectedStepCells.add(cellKey);
            cell.classList.add("is-selected");
            return;
          }
          clearStepCellSelection();
          setStepCellValue(track, step, cell, !track.cells[step]);
          saveState();
        });
        grid.append(cell);
      }
      row.append(meta, grid);
      trackList.append(row);
      renderStepPianoPreview(row, getPattern(), track);
    });
    const addInstrument = document.createElement("button");
    addInstrument.className = "add-step-instrument-row";
    addInstrument.type = "button";
    addInstrument.innerHTML = '<span aria-hidden="true">＋</span> Add instrument';
    addInstrument.setAttribute("aria-haspopup", "dialog");
    addInstrument.setAttribute("aria-controls", "step-instrument-dialog");
    addInstrument.addEventListener("click", () => openStepInstrumentPicker());
    trackList.append(addInstrument);
    $("#track-count").textContent = String(visibleTracks.length).padStart(2, "0");
    if (state.view === "mixer") renderMixer();
    renderInstrumentBrowser();
    renderPianoInstrumentOptions();
  }

  function makeSoundSelect(track, compact = false) {
    const sounds = SOUND_VARIANTS[track.kind];
    if (!sounds) return null;
    const select = document.createElement("select");
    select.className = `sound-variant${compact ? " is-compact" : ""}`;
    select.setAttribute("aria-label", `${track.name} sound`);
    sounds.forEach((sound) => {
      const option = document.createElement("option");
      option.value = sound.id;
      option.textContent = sound.name;
      select.append(option);
    });
    select.value = track.variant || "classic";
    select.addEventListener("change", () => {
      track.variant = select.value;
      saveState();
      renderTracks();
      if (isSongWorkspace()) renderArrangement();
      previewInstrumentSound(track);
    });
    return select;
  }

  async function loadLibrarySample(track) {
    if (!track.sampleUrl || track.sample?.buffer) return;
    await ensureAudio();
    let load = librarySampleLoads.get(track.sampleUrl);
    if (!load) {
      load = (async () => {
        const response = await fetch(track.sampleUrl);
        if (!response.ok) throw new Error(`Could not load ${track.name} (${response.status}).`);
        const buffer = await state.audioContext.decodeAudioData(await response.arrayBuffer());
        state.tracks.filter((item) => item.sampleUrl === track.sampleUrl).forEach((item) => {
          item.sample = { name: item.name, buffer };
        });
      })();
      librarySampleLoads.set(track.sampleUrl, load);
    }
    try {
      await load;
    } catch (error) {
      librarySampleLoads.delete(track.sampleUrl);
      throw error;
    }
  }

  async function loadLibrarySamplesForPlayback(workspace) {
    let tracks = [];
    if (workspace === "sequencer") {
      tracks = getPatternTrackIds(getPattern()).map((trackId) => state.tracks.find((track) => track.id === trackId));
    } else if (workspace === "piano-roll") {
      const trackId = state.stepPianoEditContext?.trackId || getMel()?.instrumentId || state.selectedPianoTrackId;
      const track = getPianoTrack(trackId);
      if (track) tracks = [track];
    } else if (workspace === "arrangement") {
      const trackIds = state.patterns.flatMap((pattern) => getPatternTrackIds(pattern));
      tracks = trackIds.map((trackId) => state.tracks.find((track) => track.id === trackId));
      tracks.push(...state.melTracks.map((track) => getPianoTrack(track.instrumentId)));
    }
    const uniqueSamples = new Map();
    tracks.filter((track) => track?.sampleUrl).forEach((track) => uniqueSamples.set(track.sampleUrl, track));
    await Promise.all(Array.from(uniqueSamples.values(), loadLibrarySample));
  }

  async function previewInstrumentSound(track) {
    try {
      await ensureAudio();
      await loadLibrarySample(track);
      if (track.kind === "sample" && !track.sample) {
        throw new Error("This sample is not ready to preview.");
      }
      const startTime = state.audioContext.currentTime + 0.015;
      if (track.kind === "drumkit") {
        [36, 42, 38, 42, 36, 46, 38, 42].forEach((midi, index) => {
          playPianoNote(track, startTime + index * 0.18, midi, 0.15, 0.8, track, state.masterTrack.gainNode || state.masterGain);
        });
        return;
      }
      const duration = track.sample?.buffer.duration || (track.kind === "instrument" ? 0.65 : getStepDuration());
      playPianoNote(
        track,
        startTime,
        getDefaultStepMidi(track),
        duration,
        0.8,
        track,
        state.masterTrack.gainNode || state.masterGain,
      );
    } catch (error) {
      showToast(error.message || `Could not preview ${track.name}.`);
    }
  }

  function makeTrackButton(type, label, track) {
    const button = document.createElement("button");
    button.className = `track-icon-button${(type === "mute" && track.muted) || (type === "solo" && track.solo) ? " is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    if (type === "mix") {
      button.classList.add("track-mix-button");
      button.textContent = "MIX";
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", "step-track-mix-dialog");
      button.addEventListener("click", () => openStepTrackMix(track));
      return button;
    }
    if (type === "sample") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>';
      button.addEventListener("click", () => {
        state.sampleTrackId = track.id;
        sampleInput.click();
      });
      return button;
    }
    if (type === "remove") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12m-10 0 .7 10h6.6L14 6M8 6V4h4v2m-3 3v4m2-4v4" /></svg>';
      button.addEventListener("click", () => removeImportedDrumTrack(track));
      return button;
    }
    if (type === "remove-from-pattern") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12" /></svg>';
      button.addEventListener("click", () => removePatternInstrument(track));
      return button;
    }
    if (type === "mute") {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" /><path d="m14 8 4 4m0-4-4 4" /></svg>';
    } else {
      button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" /><path d="M10 7v6m-2-3h4" /></svg>';
    }
    button.setAttribute("aria-pressed", String(type === "mute" ? track.muted : track.solo));
    button.addEventListener("click", () => {
      if (type === "mute") track.muted = !track.muted;
      else track.solo = !track.solo;
      renderTracks();
      updateTrackGains();
      saveState();
    });
    return button;
  }

  function renderPresets() {
    const select = $("#preload-pattern-select");
    select.replaceChildren(new Option("Preload", ""));
    PRESETS.forEach((preset) => {
      select.add(new Option(`${preset.title} — ${preset.description}`, preset.id));
    });
  }

  function loadPreset(preset) {
    state.selectedPreset = preset.id;
    state.bpm = preset.bpm;
    tempoValue.textContent = String(state.bpm);
    const includedTrackIds = new Set(getPatternTrackIds(getPattern()));
    const slotsPerBar = getStepsPerBar();
    state.tracks.forEach((track) => {
      track.cells.fill(false);
      if (includedTrackIds.has(track.id)) {
        (preset.hits[track.sourceId || track.id] || []).forEach((sixteenthStep) => {
          const step = Math.min(slotsPerBar - 1, Math.round(sixteenthStep * slotsPerBar / 16));
          track.cells[step] = true;
        });
      }
    });
    const pattern = getPattern();
    Object.entries(pattern?.stepPianoNotes || {}).forEach(([trackId, notes]) => {
      const track = state.tracks.find((item) => item.id === trackId);
      if (!track || !Array.isArray(notes)) return;
      pattern.stepPianoNotes[trackId] = [];
      track.cells.slice(0, getGridStepCount(pattern)).forEach((active, step) => {
        if (active) updatePatternStepPianoCell(pattern, track, step, true);
      });
    });
    renderTracks();
    renderPresets();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    saveState();
    showToast(`${preset.title} pattern loaded`);
  }

  function setLength(steps) {
    state.steps = normalizePatternSteps(steps);
    state.liveRecordedHits.clear();
    const activePattern = getPattern();
    if (activePattern) {
      activePattern.steps = state.steps;
      Object.entries(activePattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
        const totalTicks = activePattern.steps * 2;
        activePattern.stepPianoNotes[trackId] = notes
          .filter((note) => note.startTick < totalTicks)
          .map((note) => ({ ...note, durationTicks: Math.min(note.durationTicks, totalTicks - note.startTick) }));
        const ticksPerStep = getGridTicksPerStep(activePattern);
        const cells = Array(STEP_COUNT).fill(false);
        activePattern.stepPianoNotes[trackId].forEach((note) => { cells[Math.floor(note.startTick / ticksPerStep)] = true; });
        activePattern.cells[trackId] = cells;
        const track = state.tracks.find((item) => item.id === trackId);
        if (track) track.cells = [...cells];
      });
    }
    state.patternClips.forEach((clip) => {
      if (getPattern(clip.patternId)) {
        clip.startBar = clampArrangementStart(clip.startBar, getArrangementClipDuration("pattern", clip));
      }
    });
    renderPatternLengthControls();
    renderHeader();
    renderTracks();
    updateArrangementLength();
    if (isSongWorkspace()) renderArrangement();
    if (state.currentStep >= getGridStepCount()) state.currentStep = -1;
    saveState();
  }

  function setPatternGridResolution(gridResolution) {
    const pattern = getPattern();
    if (!pattern || !GRID_RESOLUTIONS.includes(gridResolution)) return;
    captureCurrentPattern();
    const previousSlotsPerBar = getStepsPerBar(pattern);
    if (previousSlotsPerBar === GRID_STEPS_PER_BAR[gridResolution]) return;
    state.liveRecordedHits.clear();
    const nextSlotsPerBar = GRID_STEPS_PER_BAR[gridResolution];
    const bars = pattern.steps / 16;
    const cells = {};
    getPatternTrackIds(pattern).forEach((trackId) => {
      cells[trackId] = remapGridCells(pattern.cells[trackId] || [], bars, previousSlotsPerBar, nextSlotsPerBar);
    });
    pattern.cells = { ...pattern.cells, ...cells };
    pattern.gridResolution = gridResolution;
    Object.entries(pattern.stepPianoNotes || {}).forEach(([trackId, notes]) => {
      const noteCells = Array(STEP_COUNT).fill(false);
      const ticksPerStep = getGridTicksPerStep(pattern);
      notes.forEach((note) => { noteCells[Math.floor(note.startTick / ticksPerStep)] = true; });
      pattern.cells[trackId] = noteCells;
    });
    applyPattern(pattern);
    renderTracks();
    renderPatternSelectors();
    if (isSongWorkspace()) renderArrangement();
    saveState();
  }

  function getStepKeyboardMap(pattern = getPattern()) {
    return new Map(getPatternTrackIds(pattern).map((trackId, index) => {
      const code = LIVE_KEY_CODES[index % LIVE_KEY_CODES.length];
      const shift = index >= LIVE_KEY_CODES.length;
      return [trackId, { code, label: `${shift ? "Shift+" : ""}${liveKeyLabel(code)}` }];
    }));
  }

  function liveKeyLabel(code) {
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    return ({
      Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Semicolon: ";",
      Quote: "'", Backslash: "\\", Comma: ",", Period: ".", Slash: "/",
    })[code] || code;
  }

  function updateKeyboardRecordButtons() {
    [
      ["#step-keyboard-record-button", "sequencer"],
      ["#piano-keyboard-record-button", "piano-roll"],
    ].forEach(([selector, mode]) => {
      const button = $(selector);
      const isRecording = state.keyboardRecording?.mode === mode;
      const countdown = state.keyboardRecordingCountdown?.mode === mode
        ? state.keyboardRecordingCountdown.beatsRemaining
        : null;
      button.classList.toggle("is-recording", isRecording || countdown !== null);
      button.setAttribute("aria-pressed", String(isRecording || countdown !== null));
      button.textContent = isRecording ? "Stop recording" : countdown !== null ? `Count-in ${countdown}` : "Record keys";
    });
  }

  function createLivePattern() {
    captureCurrentPattern();
    const source = getPattern();
    if (!source) return null;
    let number = 1;
    while (state.patterns.some((pattern) => pattern.name === `Live Pattern ${number}`)) number += 1;
    const trackIds = [...getPatternTrackIds(source)];
    const pattern = {
      id: makeId(),
      name: `Live Pattern ${number}`,
      color: getPatternColor(state.patterns.length),
      steps: source.steps,
      trackIds,
      cells: Object.fromEntries(trackIds.map((trackId) => [trackId, Array(STEP_COUNT).fill(false)])),
      variants: { ...source.variants },
      gridResolution: getPatternGridResolution(source),
    };
    state.patterns.push(pattern);
    applyPattern(pattern);
    state.selectedPreset = null;
    renderTracks();
    renderPresets();
    renderPatternSelectors();
    addPatternClip(state.arrangementCursor, pattern.id);
    return pattern;
  }

  async function toggleKeyboardRecording(mode) {
    if (state.keyboardRecordingCountdown) {
      cancelKeyboardRecordingCountdown();
      return;
    }
    if (state.keyboardRecording) {
      stopPlayback();
      return;
    }
    if (state.isPlaying) stopPlayback();
    if (mode === "piano-roll") stopWorkspacePlayback("piano-roll");
    try {
      await ensureAudio();
      if (mode === "piano-roll") {
        state.keyboardRecordingCountdown = { mode, beatsRemaining: 4, timerId: null };
        updateKeyboardRecordButtons();
        startRecordingMetronome();
        scheduleKeyboardRecordingCountIn();
        showToast("Count-in: 4 beats before piano recording starts");
        return;
      }
      let targetId;
      if (mode === "sequencer") {
        const pattern = createLivePattern();
        if (!pattern) return;
        targetId = pattern.id;
      } else {
        createMel();
        const mel = getMel();
        if (!mel) return;
        targetId = mel.id;
        addMelTrack(mel.id, state.arrangementCursor);
        renderPianoRoll();
      }
      state.keyboardRecording = { mode, targetId };
      updateKeyboardRecordButtons();
      if (mode === "sequencer") renderTracks();
      await startPlayback(mode);
      if (!state.isPlaying) {
        state.keyboardRecording = null;
        updateKeyboardRecordButtons();
        renderTracks();
        return;
      }
      showToast(mode === "sequencer"
        ? "Recording keys: use the shortcuts shown on each instrument."
        : "Recording keys: use Z/S/X… and Q/2/W… to play notes.");
    } catch (error) {
      state.keyboardRecording = null;
      updateKeyboardRecordButtons();
      showToast(error.message || "Keyboard recording could not start.");
    }
  }

  function scheduleKeyboardRecordingCountIn() {
    const countdown = state.keyboardRecordingCountdown;
    if (!countdown) return;
    countdown.timerId = window.setTimeout(async () => {
      if (state.keyboardRecordingCountdown !== countdown) return;
      countdown.beatsRemaining -= 1;
      if (countdown.beatsRemaining > 0) {
        updateKeyboardRecordButtons();
        scheduleKeyboardRecordingCountIn();
        return;
      }
      state.keyboardRecordingCountdown = null;
      try {
        createMel();
        const mel = getMel();
        if (!mel) throw new Error("A Mel could not be created for recording.");
        addMelTrack(mel.id, state.arrangementCursor);
        renderPianoRoll();
        state.keyboardRecording = { mode: "piano-roll", targetId: mel.id };
        updateKeyboardRecordButtons();
        await startPlayback("piano-roll");
        if (!state.isPlaying) {
          state.keyboardRecording = null;
          stopRecordingMetronome();
          updateKeyboardRecordButtons();
          return;
        }
        showToast("Recording keys: use Z/S/X… and Q/2/W… to play notes.");
      } catch (error) {
        state.keyboardRecording = null;
        stopRecordingMetronome();
        updateKeyboardRecordButtons();
        showToast(error.message || "Keyboard recording could not start.");
      }
    }, 60000 / state.bpm);
  }

  function cancelKeyboardRecordingCountdown() {
    const countdown = state.keyboardRecordingCountdown;
    if (!countdown) return;
    if (countdown.timerId !== null) window.clearTimeout(countdown.timerId);
    state.keyboardRecordingCountdown = null;
    stopRecordingMetronome();
    updateKeyboardRecordButtons();
    showToast("Piano recording cancelled.");
  }

  function recordStepKeyboardHit(event) {
    if (!state.keyboardRecording || state.keyboardRecording.mode !== "sequencer" ||
      state.view !== "sequencer" || !state.audioContext || event.repeat) return false;
    const keyIndex = LIVE_KEY_CODES.indexOf(event.code);
    if (keyIndex < 0) return false;
    const trackIndex = keyIndex + (event.shiftKey ? LIVE_KEY_CODES.length : 0);
    const pattern = getPattern(state.keyboardRecording.targetId);
    if (!pattern) return false;
    const trackId = getPatternTrackIds(pattern)[trackIndex];
    const track = state.tracks.find((item) => item.id === trackId);
    if (!track) return false;
    event.preventDefault();
    const ticksPerStep = getGridTicksPerStep(pattern);
    const elapsed = Math.max(0, state.audioContext.currentTime - state.playbackStartTime);
    const gridStepCount = getGridStepCount(pattern);
    const gridStepDuration = getSchedulerTickDuration() * ticksPerStep;
    const absoluteGridStep = Math.max(0, Math.ceil(elapsed / gridStepDuration - 0.000001));
    const loopIndex = Math.floor(absoluteGridStep / gridStepCount);
    const gridStep = absoluteGridStep % gridStepCount;
    pattern.cells[track.id] ||= Array(STEP_COUNT).fill(false);
    pattern.cells[track.id][gridStep] = true;
    updatePatternStepPianoCell(pattern, track, gridStep, true);
    state.liveRecordedHits.add(`${pattern.id}:${loopIndex}:${track.id}:${gridStep}`);
    track.cells[gridStep] = true;
    const hasSolo = state.tracks.some((item) => item.solo);
    if (!track.muted && (!hasSolo || track.solo)) {
      const time = state.audioContext.currentTime + 0.01;
      const midi = track.kind === "drumkit" ? 36 : 60 + (keyIndex % 24) + (track.kind === "instrument" ? track.pitch || 0 : 0);
      if (track.kind === "instrument" || track.kind === "drumkit") {
        playPianoNote(track, time, midi, getStepDuration(), 0.85);
      } else {
        triggerTrack(track, time, gridStep, pattern.variants[track.id] || track.variant, getNoteDuration());
      }
    }
    renderTracks();
    saveState();
    return true;
  }

  function recordPianoKeyboardNote(event) {
    if (!state.keyboardRecording || state.keyboardRecording.mode !== "piano-roll" ||
      state.view !== "piano-roll" || !state.audioContext || event.repeat) return false;
    const midi = PIANO_KEY_MIDI.get(event.code);
    if (midi === undefined) return false;
    const mel = getMel(state.keyboardRecording.targetId);
    const instrument = mel ? getPianoTrack(mel.instrumentId) : null;
    if (!mel || !instrument) return false;
    event.preventDefault();
    const secondsPerBar = 240 / state.bpm;
    const loopTicks = getMelLengthBars(mel) * PIANO_TICKS_PER_BAR;
    const elapsedSeconds = Math.max(0, state.audioContext.currentTime - state.playbackStartTime);
    const elapsedTicks = elapsedSeconds / secondsPerBar * PIANO_TICKS_PER_BAR;
    const startTick = Math.max(0, Math.min(loopTicks - 0.5, snapPianoTick(elapsedTicks % loopTicks, Math.floor)));
    const durationTicks = Math.max(0.5, Math.min(state.pianoNoteLength, loopTicks - startTick));
    const note = { id: makeId(), trackId: instrument.id, midi, startTick, durationTicks, velocity: 0.8 };
    mel.notes.push(note);
    mel.notes.sort((left, right) => left.startTick - right.startTick);
    state.pianoNotes = mel.notes.map((item) => ({ ...item, trackId: instrument.id }));
    state.selectedPianoNoteId = note.id;
    state.selectedPianoNoteIds = new Set([note.id]);
    state.selectedArrangementItems.clear();
    updateArrangementSelection();
    const loopIndex = Math.floor(elapsedSeconds / (loopTicks / PIANO_TICKS_PER_BAR * secondsPerBar));
    state.scheduledPianoNotes.add(`${note.id}:${loopIndex}`);
    playPianoNote(instrument, state.audioContext.currentTime + 0.01, midi, durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar, note.velocity);
    renderPianoRoll();
    renderArrangement();
    saveState();
    return true;
  }

  function initializeAudio() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Web Audio is not supported in this browser.");
      state.audioContext = new AudioContext();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.gain.value = 0.82;
      state.masterGain.connect(state.audioContext.destination);
      ensureTrackAudio(state.masterTrack);
      state.effectTracks.forEach(ensureTrackAudio);
      state.tracks.forEach(ensureSequencerTrackAudio);
      state.noiseBuffer = createNoiseBuffer(state.audioContext);
    }
    ensureTrackAudio(state.masterTrack);
    state.effectTracks.forEach(ensureTrackAudio);
    state.arrangementTracks.forEach(ensureArrangementTrackAudio);
    state.melTracks.forEach(ensureTrackAudio);
    state.patterns.forEach(ensureTrackAudio);
    return state.audioContext;
  }

  function ensureAudio() {
    const context = initializeAudio();
    return context.resume();
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    return buffer;
  }

  function getStepDuration() {
    return 60 / state.bpm / 4;
  }

  function getSchedulerTickDuration() {
    return getStepDuration() / 2;
  }

  function getNoteDuration() {
    return getStepDuration();
  }

  const DJ_DECK_IDS = ["A", "B"];
  const DJ_ARRANGEMENT_BARS = 8;
  const DJ_MAX_OFFSET_BARS = MAX_ARRANGEMENT_BARS - DJ_ARRANGEMENT_BARS;
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
    masterVolume: 1,
    masterLow: 0,
    masterMid: 0,
    masterHigh: 0,
    masterFilter: 20000,
    liveSlots: Array(8).fill(null),
    decks: {
      A: { sourceKey: "", volume: 0.8, filter: 20000, eqLow: 0, eqMid: 0, eqHigh: 0, pitch: 0, syncRate: 1, reverse: false, startOffsetBars: 0, playing: false, timerId: null, audioSource: null, songSources: new Set(), songGains: new Map(), songEvents: new Set(), songAnchorTime: 0, songPositionBar: 0, songRate: 1, songDurationBars: 0, songEndTime: 0, filterNode: null, eqLowNode: null, eqMidNode: null, eqHighNode: null, gainNode: null, audioContext: null, djMasterInput: null, nextStepTime: 0, stepIndex: 0, scratchRate: 1, nudgeRate: 1, isScratching: false },
      B: { sourceKey: "", volume: 0.8, filter: 20000, eqLow: 0, eqMid: 0, eqHigh: 0, pitch: 0, syncRate: 1, reverse: false, startOffsetBars: 0, playing: false, timerId: null, audioSource: null, songSources: new Set(), songGains: new Map(), songEvents: new Set(), songAnchorTime: 0, songPositionBar: 0, songRate: 1, songDurationBars: 0, songEndTime: 0, filterNode: null, eqLowNode: null, eqMidNode: null, eqHighNode: null, gainNode: null, audioContext: null, djMasterInput: null, nextStepTime: 0, stepIndex: 0, scratchRate: 1, nudgeRate: 1, isScratching: false },
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
  const reversedDjBuffers = new WeakMap();

  function setDjViewExpanded(expanded, restoreFocus = true) {
    if (expanded && state.view !== "dj") return;
    djViewExpanded = expanded;
    if (!expanded) {
      djHeldKeys.clear();
      djDeckChordUsed.clear();
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
    const button = $("#dj-expand-button");
    button.textContent = expanded ? "Exit full screen" : "Expand";
    button.setAttribute("aria-label", expanded ? "Exit expanded DJ view" : "Expand DJ view");
    button.setAttribute("aria-pressed", String(expanded));
    if (!expanded && restoreFocus) button.focus();
    window.requestAnimationFrame(drawDjLiveView);
  }

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && djViewExpanded) setDjViewExpanded(false, false);
  });

  function getDjStorageKey() {
    return `${getProjectStorageKey(state.projectId)}:dj`;
  }

  function saveDjState() {
    try {
      const saved = {
        activeDeck: djState.activeDeck,
        crossfader: djState.crossfader,
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
            filter: deck.filter,
            eqLow: deck.eqLow,
            eqMid: deck.eqMid,
            eqHigh: deck.eqHigh,
            pitch: deck.pitch,
            syncRate: deck.syncRate,
            reverse: deck.reverse,
            startOffsetBars: deck.startOffsetBars,
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
      if (Number.isFinite(saved.masterVolume)) djState.masterVolume = Math.max(0, Math.min(1, saved.masterVolume));
      if (Number.isFinite(saved.masterLow)) djState.masterLow = Math.max(-12, Math.min(12, saved.masterLow));
      if (Number.isFinite(saved.masterMid)) djState.masterMid = Math.max(-12, Math.min(12, saved.masterMid));
      if (Number.isFinite(saved.masterHigh)) djState.masterHigh = Math.max(-12, Math.min(12, saved.masterHigh));
      if (Number.isFinite(saved.masterFilter)) djState.masterFilter = Math.max(200, Math.min(20000, saved.masterFilter));
      if (Number.isFinite(saved.arrangementViewStartBar)) {
        djState.arrangementViewStartBar = Math.max(0, Math.min(DJ_MAX_OFFSET_BARS, saved.arrangementViewStartBar));
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
      const track = state.arrangementTracks.find((item) => item.id === id);
      return track ? { type, id, name: track.name, item: track } : null;
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

  function getDjSourceOptions() {
    const groups = [
      { label: "Patterns", items: (state.patterns || []).map((item) => ({ key: `pattern:${item.id}`, name: item.name })) },
      { label: "Mels", items: (state.mels || []).map((item) => ({ key: `mel:${item.id}`, name: item.name })) },
      { label: "Imported audio", items: state.arrangementTracks.filter((item) => item.clips.length)
        .map((item) => ({ key: `audio:${item.id}`, name: item.name })) },
    ];
    if (getDjArrangementDurationBars() > 0) {
      groups.unshift({ label: "Arrangement", items: [{ key: "song:current", name: `${state.projectName || "Current Song"} (Full Song)` }] });
    }
    return groups;
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
      placeholder.textContent = "Choose a song, pattern, Mel, or audio track";
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
      if (select.value !== deck.sourceKey) deck.sourceKey = "";
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
    scroll.max = String(DJ_MAX_OFFSET_BARS);
    scroll.value = String(djState.arrangementViewStartBar);
    const formatBar = (bar) => Number.isInteger(bar) ? String(bar) : String(Number(bar.toFixed(2)));
    const firstBar = djState.arrangementViewStartBar + 1;
    range.textContent = `BARS ${formatBar(firstBar)}–${formatBar(firstBar + DJ_ARRANGEMENT_BARS - 1)}`;
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
    const viewStartBar = djState.arrangementViewStartBar;
    const positionBar = getDjArrangementPositionBar();
    if (positionBar < viewStartBar - 0.001 ||
      positionBar > viewStartBar + DJ_ARRANGEMENT_BARS + 0.001) return;
    const followThreshold = viewStartBar + DJ_ARRANGEMENT_BARS - 1;
    if (positionBar < followThreshold) return;
    const targetViewStartBar = positionBar - (DJ_ARRANGEMENT_BARS - 1);
    const nextViewStartBar = Math.min(DJ_MAX_OFFSET_BARS,
      Math.max(viewStartBar, targetViewStartBar));
    if (nextViewStartBar <= viewStartBar) return;
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

    context.font = "8px monospace";
    context.textBaseline = "top";
    for (let bar = 0; bar <= DJ_ARRANGEMENT_BARS; bar += 1) {
      const x = 8 + bar / DJ_ARRANGEMENT_BARS * timelineWidth;
      if (x < 0 || x > width) continue;
      context.strokeStyle = bar % 4 === 0 ? "#60636b" : "#3c3e44";
      context.beginPath();
      context.moveTo(x, 12);
      context.lineTo(x, height);
      context.stroke();
      if (bar % 2 === 0) {
        context.fillStyle = "#aeb0b6";
        context.fillText(`BAR ${Math.floor(djState.arrangementViewStartBar + bar) + 1}`,
          Math.min(width - 36, x + 3), 1);
      }
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

  function drawDjLiveView() {
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
        const playbackRate = deck.audioSource?.playbackRate.value || 1;
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
          const firstLoop = Math.floor(start / loop);
          const lastLoop = Math.ceil((start + visibleSpan) / loop);
          const events = [];
          if (Array.isArray(lane.cells)) {
            for (let step = 0; step < Math.min(lane.stepCount || lane.cells.length, lane.cells.length); step += 1) {
              if (lane.cells[step]) events.push({ tick: step * lane.ticksPerStep, duration: Math.max(1, lane.ticksPerStep), color: lane.color });
            }
          }
          (lane.notes || []).forEach((note) => events.push({
            tick: note.startTick,
            duration: note.durationTicks || 1,
            color: lane.color,
          }));
          events.forEach((event) => {
            for (let loopIndex = firstLoop; loopIndex <= lastLoop; loopIndex += 1) {
              const eventTick = deck.reverse ? Math.max(0, loop - 1 - event.tick) : event.tick;
              const absoluteTick = loopIndex * loop + eventTick;
              if (absoluteTick + event.duration < start || absoluteTick > start + visibleSpan) continue;
              const x = toX(absoluteTick);
              const eventWidth = Math.max(3, event.duration / visibleSpan * timelineWidth);
              context.globalAlpha = 0.86;
              context.fillStyle = event.color;
              context.fillRect(x, top + 11, Math.min(eventWidth, timelineWidth), 12);
              context.globalAlpha = 1;
            }
          });
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
      const rate = isAudio ? (deck.audioSource?.playbackRate.value || getDjRate(deck)) : getDjRate(deck);
      const position = getDjVisualPosition(deck);
      const isLive = canvas.dataset.waveform === "live";
      const liveSpan = DJ_ARRANGEMENT_BARS * 240 / state.bpm;
      const visibleSpan = isLive ? liveSpan : isSong ? loopSpan : loopSpan * 2;
      const barSeconds = 240 / state.bpm;
      const viewStartBar = djState.arrangementViewStartBar;
      const arrangementStart = Number.isFinite(djState.arrangementStartTime)
        ? djState.arrangementStartTime
        : now;
      const start = isLive
        ? arrangementStart + viewStartBar * barSeconds
        : Math.max(0, position - visibleSpan * 0.75);
      const playheadPosition = isLive
        ? arrangementStart + getDjArrangementPositionBar() * barSeconds
        : position;
      const isDragPreview = Number.isFinite(deck.dragPreviewStartTime);
      const liveStartTime = isDragPreview
        ? deck.dragPreviewStartTime
        : arrangementStart + deck.startOffsetBars * barSeconds;
      const playbackStartTime = Number.isFinite(deck.visualStartTime) ? deck.visualStartTime : liveStartTime;
      const unitsPerSecond = isAudio ? rate : state.bpm / 60 * 8 * rate;
      const pausedAtBar = Number.isFinite(deck.resumeArrangementBar)
        ? deck.resumeArrangementBar
        : getDjArrangementPositionBar();
      const liveStartPosition = isDragPreview
        ? 0
        : deck.playing
          ? (deck.visualStartPosition || 0) + (liveStartTime - playbackStartTime) * unitsPerSecond
          : Number.isFinite(deck.resumeContentPosition)
            ? deck.resumeContentPosition - (pausedAtBar - deck.startOffsetBars) * barSeconds * unitsPerSecond
            : 0;
      const timelineWidth = Math.max(1, width - 16);
      const binCount = Math.max(48, Math.min(900, Math.floor(timelineWidth)));
      const stepWidth = timelineWidth / binCount;

      if (isAudio) {
        const samples = data.clip.buffer.getChannelData(0);
        const firstSample = Math.floor(data.offset / data.clip.buffer.duration * samples.length);
        const sampleCount = Math.max(1, Math.floor(data.loopSeconds / data.clip.buffer.duration * samples.length));
        const firstBar = isLive ? Math.floor(viewStartBar) : Math.floor(start / barSeconds);
        const lastBar = isLive ? Math.ceil(viewStartBar + DJ_ARRANGEMENT_BARS) : Math.ceil((start + visibleSpan) / barSeconds);
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
          if (isLive && timelineTime < liveStartTime) continue;
          const sourcePosition = isLive
            ? liveStartPosition + (timelineTime - liveStartTime) * rate
            : timelineTime;
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
          context.fillStyle = color;
          context.globalAlpha = 0.82;
          context.fillRect(8 + bin * stepWidth, center - amplitude, Math.max(1, stepWidth * 0.72), amplitude * 2);
          context.globalAlpha = 1;
        }
      } else {
        const barSpan = isLive ? 240 / state.bpm : PIANO_TICKS_PER_BAR;
        const firstBar = isLive ? Math.floor(viewStartBar) : Math.floor(start / barSpan);
        const lastBar = isLive ? Math.ceil(viewStartBar + DJ_ARRANGEMENT_BARS) : Math.ceil((start + visibleSpan) / barSpan);
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
          if (isLive && timelineValue < liveStartTime) continue;
          const timelineTick = isLive
            ? liveStartPosition + (timelineValue - liveStartTime) * state.bpm / 60 * 8 * rate
            : timelineValue;
          if (isSong && (timelineTick < 0 || timelineTick >= loopSpan)) continue;
          const phase = isSong ? timelineTick : ((timelineTick % loopSpan) + loopSpan) % loopSpan;
          const sourceTick = !isSong && deck.reverse ? loopSpan - 1 - phase : phase;
          let peak = 0;
          data.lanes.forEach((lane) => {
            if (Array.isArray(lane.cells) && lane.ticksPerStep) {
              const step = Math.floor(sourceTick / lane.ticksPerStep);
              if (lane.cells[step]) peak = Math.max(peak, 0.82);
            }
            (lane.notes || []).forEach((note) => {
              if (sourceTick >= note.startTick && sourceTick < note.startTick + note.durationTicks) {
                peak = Math.max(peak, note.velocity ?? 0.8);
              }
            });
          });
          if (peak <= 0) continue;
          const amplitude = Math.max(2, peak * (height * 0.43));
          context.fillStyle = color;
          context.globalAlpha = 0.82;
          context.fillRect(8 + bin * stepWidth, center - amplitude, Math.max(1, stepWidth * 0.72), amplitude * 2);
          context.globalAlpha = 1;
        }
      }
      const playheadX = 8 + Math.max(0, Math.min(1, (playheadPosition - start) / visibleSpan)) * timelineWidth;
      context.strokeStyle = "#f3f5e8";
      context.lineWidth = isLive ? 2 : 1.5;
      context.beginPath();
      context.moveTo(playheadX, 1);
      context.lineTo(playheadX, height - 1);
      context.stroke();
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
    $(`#dj-focus-${suffix}`).setAttribute("aria-pressed", String(djState.activeDeck === deckId));
    document.querySelector(`.dj-live-waveform-row[data-deck="${deckId}"]`)
      ?.classList.toggle("is-playing", deck.playing);
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

  function getDjVisualPosition(deck) {
    const source = getDjSource(deck.sourceKey);
    const startPosition = Number.isFinite(deck.visualStartPosition) ? deck.visualStartPosition : 0;
    if (source?.type === "song" && deck.playing && state.audioContext) {
      const secondsPerBar = 240 / state.bpm / deck.songRate;
      const currentBar = deck.songPositionBar + Math.max(0, state.audioContext.currentTime - deck.songAnchorTime) / secondsPerBar;
      return Math.min(deck.songDurationBars * PIANO_TICKS_PER_BAR, currentBar * PIANO_TICKS_PER_BAR);
    }
    if (!deck.playing || !state.audioContext || !Number.isFinite(deck.visualStartTime)) {
      return Number.isFinite(deck.visualPosition) ? deck.visualPosition : startPosition;
    }
    const elapsed = Math.max(0, state.audioContext.currentTime - deck.visualStartTime);
    const rate = source?.type === "audio"
      ? (deck.audioSource?.playbackRate.value || getDjRate(deck))
      : getDjRate(deck);
    const unitsPerSecond = source?.type === "audio" ? 1 : state.bpm / 60 * 8;
    return startPosition + elapsed * unitsPerSecond * rate;
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
      djMasterChain.gainNode.gain.setTargetAtTime(djState.masterVolume, now, 0.015);
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
      deck.gainNode.gain.setTargetAtTime(deck.volume * gains[index], now, 0.015);
    });
  }

  function stopDjDeck(deckId) {
    const deck = djState.decks[deckId];
    const stoppedAt = deck.playing ? state.audioContext?.currentTime : null;
    const stoppedAtBar = deck.playing ? getDjArrangementPositionBar() : null;
    if (deck.timerId !== null) window.clearInterval(deck.timerId);
    deck.timerId = null;
    if (deck.playing && state.audioContext) {
      deck.visualPosition = getDjVisualPosition(deck);
      deck.resumeContentPosition = deck.visualPosition;
      deck.visualStopTime = state.audioContext.currentTime;
    }
    deck.isScratching = false;
    deck.scratchPointerId = null;
    deck.scratchRate = 1;
    deck.nudgeRate = 1;
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
    if (Number.isFinite(stoppedAtBar)) deck.resumeArrangementBar = stoppedAtBar;
    if (Number.isFinite(stoppedAt) && !DJ_DECK_IDS.some((id) => djState.decks[id].playing)) {
      djState.arrangementPositionBar = stoppedAtBar;
      djState.arrangementStopTime = stoppedAt;
    }
    updateDjDeckUI(deckId);
    refreshDjVisualTimer();
  }

  async function startDjDeck(deckId) {
    const deck = djState.decks[deckId];
    const source = getDjSource(deck.sourceKey);
    if (!source) {
      showToast("Choose a live source for this deck first.");
      return;
    }
    try {
      await ensureAudio();
      if (source.type === "song") await loadLibrarySamplesForPlayback("arrangement");
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
      if (!anotherDeckPlaying || !Number.isFinite(djState.arrangementStartTime)) {
        djState.arrangementStartTime = baseStartTime - arrangementPositionBar * barSeconds;
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
          : Math.max(0, deckPositionBar - deck.startOffsetBars) * getDjRate(deck);
      deck.syncedStartTime = 0;
      deck.dragPreviewStartTime = null;
      deck.resumeContentPosition = null;
      deck.resumeArrangementBar = null;
      deck.visualStopTime = null;
      deck.nextStepTime = startTime;
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
          showToast("This audio track has no available decoded clip.");
          updateDjDeckUI(deckId);
          return;
        }
        const offset = Math.max(0, clip.sourceOffsetSeconds || 0);
        const duration = Math.min(clip.buffer.duration - offset, clip.durationSeconds ?? clip.buffer.duration);
        if (duration <= 0) {
          deck.playing = false;
          showToast("This audio clip has no playable duration.");
          updateDjDeckUI(deckId);
          return;
        }
        const buffer = deck.reverse ? getReversedDjBuffer(clip.buffer) : clip.buffer;
        const loopStart = deck.reverse ? clip.buffer.duration - (offset + duration) : offset;
        const loopEnd = loopStart + duration;
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
        const resumePosition = pausedContentPosition === null
          ? (sourceProgressBars * barSeconds) % duration
          : ((pausedContentPosition % duration) + duration) % duration;
        player.start(startTime, loopStart + resumePosition);
        deck.audioSource = player;
        deck.visualStartTime = startTime;
        deck.visualStartPosition = resumePosition;
        deck.visualPosition = resumePosition;
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
      stopDjDeck(deckId);
      showToast(error.message || "DJ deck audio could not start.");
    }
  }

  function toggleDjDeck(deckId) {
    if (djState.decks[deckId].playing) stopDjDeck(deckId);
    else startDjDeck(deckId);
  }

  function toggleDjDeckGroup(deckIds) {
    const loadedDeckIds = deckIds.filter((deckId) => getDjSource(djState.decks[deckId].sourceKey));
    if (!loadedDeckIds.length) {
      showToast("Load a track into a deck first.");
      return;
    }
    if (loadedDeckIds.some((deckId) => djState.decks[deckId].playing)) {
      const positionBar = getDjArrangementPositionBar();
      const stoppedAt = state.audioContext?.currentTime ?? 0;
      loadedDeckIds.forEach((deckId) => {
        if (djState.decks[deckId].playing) stopDjDeck(deckId);
        else djState.decks[deckId].resumeContentPosition = null;
        djState.decks[deckId].resumeArrangementBar = positionBar;
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
    deck.songPositionBar = Math.min(deck.songDurationBars,
      deck.songPositionBar + Math.max(0, now - deck.songAnchorTime) / secondsPerBar);
    deck.songAnchorTime = now;
    deck.visualStartTime = now;
    deck.visualStartPosition = deck.songPositionBar * PIANO_TICKS_PER_BAR;
    deck.songRate = getDjRate(deck);
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
    if (!deck.playing || !state.audioContext || state.audioContext.currentTime >= deck.songEndTime) {
      if (deck.playing) stopDjDeck(deckId);
      return;
    }
    const now = state.audioContext.currentTime;
    const lookAhead = 0.12;
    const endTime = deck.songEndTime;
    const secondsPerBar = 240 / state.bpm / deck.songRate;
    const currentBar = deck.songPositionBar + Math.max(0, now - deck.songAnchorTime) / secondsPerBar;
    const lookAheadBars = lookAhead / secondsPerBar;
    const hasArrangementSolo = [...state.tracks, ...state.arrangementTracks].some((track) => track.solo);
    const hasMelSolo = state.melTracks.some((track) => track.solo);
    const hasInstrumentSolo = state.tracks.some((track) => track.solo);
    const isInLookAhead = (time) => time >= now && time < now + lookAhead && time < endTime;

    state.arrangementTracks.forEach((track) => {
      if (track.muted || (hasArrangementSolo && !track.solo)) return;
      track.clips.forEach((clip) => {
        const key = `audio:${clip.id}`;
        if (deck.songEvents.has(key) || !clip.buffer) return;
        const time = getDjSongTimeForBar(deck, clip.startBar);
        if (!isInLookAhead(time)) return;
        const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
        const duration = Math.min(clip.buffer.duration - sourceOffset,
          clip.durationSeconds ?? clip.buffer.duration, Math.max(0, (endTime - time) * deck.songRate));
        if (duration <= 0) return;
        const player = state.audioContext.createBufferSource();
        player.buffer = clip.buffer;
        player.playbackRate.value = deck.songRate;
        player.connect(getDjSongGain(deck, `audio:${track.id}`, track.volume));
        player.onended = () => {
          deck.songSources.delete(player);
          player.disconnect();
        };
        player.start(time, sourceOffset, duration);
        deck.songSources.add(player);
        deck.songEvents.add(key);
      });
    });

    state.patternClips.forEach((clip) => {
      const pattern = getPattern(clip.patternId);
      if (!pattern) return;
      const patternTrack = state.patterns.find((item) => item.id === (clip.trackId || clip.patternId)) || pattern;
      if (patternTrack.muted) return;
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
          patternTrack.muted || track.muted || (hasInstrumentSolo && !track.solo)) return;
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
      if (!instrument || melTrack.muted || (hasMelSolo && !melTrack.solo) ||
        instrument.muted || (hasInstrumentSolo && !instrument.solo)) return;
      melTrack.clips.forEach((clip) => {
        const mel = getMel(clip.melId);
        if (!mel) return;
        const sourceOffset = clip.sourceOffsetBars || 0;
        const sourceEnd = Math.min(getMelLengthBars(mel), sourceOffset + getArrangementClipDuration("mel", clip));
        mel.notes.forEach((note) => {
          const noteStartSource = note.startTick / PIANO_TICKS_PER_BAR;
          const noteEndSource = noteStartSource + note.durationTicks / PIANO_TICKS_PER_BAR;
          const audibleStart = Math.max(sourceOffset, noteStartSource);
          const audibleEnd = Math.min(sourceEnd, noteEndSource);
          if (audibleEnd <= audibleStart) return;
          const noteStartBar = clip.startBar + audibleStart - sourceOffset;
          const noteEndBar = clip.startBar + audibleEnd - sourceOffset;
          const time = getDjSongTimeForBar(deck, noteStartBar);
          const eventKey = `mel:${melTrack.id}:${clip.id}:${note.id}`;
          if (deck.songEvents.has(eventKey) || !isInLookAhead(time)) return;
          const duration = Math.min((noteEndBar - noteStartBar) * secondsPerBar, endTime - time);
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
      const clockStep = deck.stepIndex;
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
        const loopTicks = Math.max(1, Math.round(getMelLengthBars(mel) * PIANO_TICKS_PER_BAR));
        if (instrument) {
          mel.notes.filter((note) => Math.floor(note.startTick) === clockStep).forEach((note) => {
            playPianoNote(instrument, deck.nextStepTime, note.midi,
              note.durationTicks * tickDuration, note.velocity ?? 0.8,
              instrument, deck.eqLowNode, note);
          });
        }
        deck.stepIndex = (clockStep + (deck.reverse ? -1 : 1) + loopTicks) % loopTicks;
      }
      if (source.type === "pattern") {
        const cycleTicks = Math.max(1, (source.item.steps || 16) * 2);
        deck.stepIndex = (clockStep + (deck.reverse ? -1 : 1) + cycleTicks) % cycleTicks;
      }
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
    const position = ((rawPosition % timeline.loopSeconds) + timeline.loopSeconds) % timeline.loopSeconds;
    const buffer = deck.reverse ? getReversedDjBuffer(clip.buffer) : clip.buffer;
    const loopStart = deck.reverse
      ? clip.buffer.duration - (timeline.offset + timeline.loopSeconds)
      : timeline.offset;
    const player = state.audioContext.createBufferSource();
    player.buffer = buffer;
    player.loop = true;
    player.loopStart = loopStart;
    player.loopEnd = loopStart + timeline.loopSeconds;
    player.playbackRate.value = getDjRate(deck);
    player.connect(deck.eqLowNode);
    player.onended = () => {
      if (deck.audioSource === player) deck.audioSource = null;
      player.disconnect();
    };
    const startTime = now + 0.04;
    player.start(startTime, loopStart + position);
    if (deck.audioSource) {
      const previousSource = deck.audioSource;
      previousSource.onended = () => previousSource.disconnect();
      previousSource.stop(startTime);
    }
    deck.audioSource = player;
    deck.visualStartTime = startTime;
    deck.visualStartPosition = position;
    deck.visualPosition = position;
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
      const positionBar = Math.max(0, Math.min(deck.songDurationBars, correctedContentPosition / PIANO_TICKS_PER_BAR));
      const startTime = now + 0.04;
      deck.songPositionBar = positionBar;
      deck.songAnchorTime = startTime;
      deck.songRate = getDjRate(deck);
      deck.songEndTime = getDjSongTimeForBar(deck, deck.songDurationBars);
      deck.visualStartTime = startTime;
      deck.visualStartPosition = positionBar * PIANO_TICKS_PER_BAR;
      deck.visualPosition = deck.visualStartPosition;
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
    deck.nudgeRate = 1;
    const baseBpm = getDjSourceMetadata(source).bpm || state.bpm;
    const manualRate = (1 + deck.pitch / 100) * (deck.scratchRate || 1);
    deck.syncRate = Math.max(0.25, Math.min(4, otherBpm / (baseBpm * manualRate)));
    if (source.type === "song") updateDjSongRate(deck);
    if (deck.audioSource) {
      deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck), now, 0.015);
    }

    if (deck.playing) {
      if (source.type === "audio") resyncDjAudio(deck, source, deckId, deltaBeats, now);
      else resyncDjTimeline(deck, source, deckId, deltaBeats, now);
      deck.syncedStartTime = 0;
    } else {
      const cycleTicks = getDjCycleTicks(source);
      if (cycleTicks) deck.pendingStepIndex = deck.reverse ? cycleTicks - 1 : 0;
      deck.resumeContentPosition = null;
      deck.resumeArrangementBar = null;
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
      deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck) * (direction > 0 ? 1.02 : 0.98), state.audioContext.currentTime, 0.01);
      if (deck.nudgeTimer !== null) window.clearTimeout(deck.nudgeTimer);
      deck.nudgeTimer = window.setTimeout(() => {
        if (deck.audioSource && state.audioContext) {
          deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck), state.audioContext.currentTime, 0.04);
        }
        deck.nudgeTimer = null;
      }, 250);
    } else if (deck.timerId !== null) {
      deck.nextStepTime -= direction * getSchedulerTickDuration() / getDjRate(deck);
      const now = state.audioContext.currentTime;
      const currentTick = getDjVisualPosition(deck);
      deck.visualStartPosition = Math.max(0, currentTick + direction);
      deck.visualPosition = deck.visualStartPosition;
      deck.visualStartTime = now;
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
    djState.decks[deckId].syncRate = 1;
    djState.decks[deckId].resumeContentPosition = null;
    djState.decks[deckId].resumeArrangementBar = null;
    djState.decks[deckId].visualStartTime = null;
    djState.decks[deckId].visualStopTime = null;
    djState.decks[deckId].visualStartPosition = 0;
    djState.decks[deckId].visualPosition = 0;
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
    if (djViewExpanded) {
      djHeldKeys.add(event.code);
      if ((event.code === "BracketLeft" || event.code === "BracketRight") &&
        (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
        djDeckChordUsed.add(event.code);
      }
      const selectors = ["BracketLeft", "BracketRight"].filter((code) => djHeldKeys.has(code));
      const knobKeyHeld = Object.keys(DJ_KNOB_KEYS).some((code) => djHeldKeys.has(code));
      if (selectors.length > 1 || (selectors.length && (knobKeyHeld || djHeldKeys.has("Space")))) {
        selectors.forEach((code) => djDeckChordUsed.add(code));
      }
    } else {
      djHeldKeys.clear();
      djDeckChordUsed.clear();
    }
    const dialogOpen = $("#help-dialog").open || $("#project-dialog").open || $("#source-browser-dialog").open ||
      $("#step-instrument-dialog").open || $("#step-track-mix-dialog").open;
    const djControlFocused = event.target instanceof Element &&
      event.target.closest("input, select, textarea, [contenteditable='true']");
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
    if (djViewExpanded && event.code === "Space") {
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
    } else if (event.code === "Space") {
      if (!event.repeat) toggleDjDeck(djState.activeDeck);
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
    } else if (event.code === "KeyL") {
      if (!event.repeat) addDjLiveSlot(djState.activeDeck);
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function bindDjEvents() {
    $("#dj-expand-button").addEventListener("click", () => setDjViewExpanded(!djViewExpanded));
    $("#dj-arrangement-scroll").addEventListener("input", (event) => {
      djState.arrangementViewStartBar = Math.max(0, Math.min(DJ_MAX_OFFSET_BARS, Number(event.target.value)));
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
        deck.syncedStartTime = 0;
        deck.dragPreviewStartTime = null;
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
        djState.decks[deckId].syncRate = 1;
        djState.decks[deckId].resumeContentPosition = null;
        djState.decks[deckId].resumeArrangementBar = null;
        djState.decks[deckId].pendingStepIndex = 0;
        djState.decks[deckId].syncedStartTime = 0;
        djState.decks[deckId].visualStartTime = null;
        djState.decks[deckId].visualStopTime = null;
        djState.decks[deckId].visualStartPosition = 0;
        djState.decks[deckId].visualPosition = 0;
        setActiveDjDeck(deckId);
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
        deck.pitch = Number(event.target.value);
        updateDjSongRate(deck);
        if (deck.audioSource && state.audioContext) {
          deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck), state.audioContext.currentTime, 0.015);
        }
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
        deck.scratchRate = Math.max(0.25, Math.min(2.5, 1 + delta * 1.5));
        updateDjSongRate(deck);
        if (deck.audioSource && state.audioContext) {
          deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck), state.audioContext.currentTime, 0.005);
        }
        updateDjDeckUI(deckId);
      });
      const finishScratch = (event) => {
        const deck = djState.decks[deckId];
        if (!deck.isScratching || deck.scratchPointerId !== event.pointerId) return;
        deck.isScratching = false;
        deck.scratchPointerId = null;
        deck.scratchRate = 1;
        updateDjSongRate(deck);
        if (deck.audioSource && state.audioContext) {
          deck.audioSource.playbackRate.setTargetAtTime(getDjRate(deck), state.audioContext.currentTime, 0.04);
        }
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
        stopPlayback();
        return;
      }
      const elapsed = Math.max(0, state.audioContext.currentTime - state.playbackStartTime);
      state.arrangementCursor = Math.min(state.arrangementBars, state.playbackStartBar + elapsed / (240 / state.bpm));
      updateArrangementCursorMarker();
    }
    if (pianoLoopPlayback && state.isPlaying) updatePianoCursorFromTime(state.playbackStartTime);
    const lookAhead = 0.12;
    if (arrangementPlayback && state.isPlaying) scheduleArrangementPatternClips(state.audioContext.currentTime, lookAhead);
    while (
      state.nextStepTime < state.audioContext.currentTime + lookAhead &&
      (!arrangementPlayback || state.nextStepTime < state.playbackEndTime)
    ) {
      const clockStep = state.stepIndex;
      const swingOffset = Math.floor(clockStep / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0;
      if (arrangementPlayback) {
        if (state.metronome && state.recordingMetronomeTimer === null && clockStep % 8 === 0) {
          triggerClick(state.nextStepTime + swingOffset, clockStep % 32 === 0);
        }
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

  function scheduleArrangementPatternClips(now, lookAhead) {
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
        if (time < now || time >= now + lookAhead || time >= state.playbackEndTime) continue;
        const key = `${clip.id}:${sourceStep}`;
        if (state.scheduledArrangementSteps.has(key)) continue;
        scheduleStep(patternStep, time, pattern, null, false, null, patternTrack);
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
            if (when < now || when >= now + lookAhead || when >= state.playbackEndTime) return;
            const key = `${clip.id}:piano:${trackId}:${loop}:${note.id}`;
            if (state.scheduledArrangementSteps.has(key)) return;
            const clipEnd = (sourceOffset + getArrangementClipDuration("pattern", clip) - sourcePosition) * secondsPerBar;
            const noteDuration = Math.min(note.durationTicks * getSchedulerTickDuration(), clipEnd);
            if (noteDuration > 0) {
              playPianoNote(track, when, note.midi, noteDuration, note.velocity ?? 0.8,
                patternTrack, getPatternSourceGain(patternTrack, track), note);
            }
            state.scheduledArrangementSteps.add(key);
          });
        }
      });
    });
  }

  function scheduleCurrentMelLoop(lookAhead) {
    const mel = getMel();
    const instrument = getPianoTrack();
    if (!mel || !instrument) return;
    const secondsPerBar = 240 / state.bpm;
    const now = state.audioContext.currentTime;
    const loopSeconds = getMelLengthBars(mel) * secondsPerBar;
    const firstLoop = Math.max(0, Math.floor((now - state.playbackStartTime) / loopSeconds));
    mel.notes.forEach((note) => {
      const noteOffset = note.startTick / PIANO_TICKS_PER_BAR * secondsPerBar;
      const duration = note.durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar;
      for (let loop = firstLoop; loop <= firstLoop + 1; loop += 1) {
        const key = `${note.id}:${loop}`;
        if (state.scheduledPianoNotes.has(key)) continue;
        const when = state.playbackStartTime + loop * loopSeconds + noteOffset;
        if (when < now || when >= now + lookAhead) continue;
        playPianoNote(instrument, when, note.midi, duration, note.velocity ?? 0.8, instrument, null, note);
        state.scheduledPianoNotes.add(key);
      }
    });
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
        const mel = state.stepPianoEditContext ? null : getMel();
        const editPattern = state.stepPianoEditContext ? getPattern(state.stepPianoEditContext.patternId) : null;
        const loopTicks = state.stepPianoEditContext
          ? (editPattern?.steps || 16) * 2
          : mel ? getMelLengthBars(mel) * PIANO_TICKS_PER_BAR : PIANO_TICKS_PER_BAR;
        const cursorTick = state.pianoCursorTick % loopTicks;
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

  function toggleCurrentWorkspacePlayback() {
    const workspace = !state.workspaceHidden && ["sequencer", "piano-roll"].includes(state.view)
      ? state.view
      : null;
    const currentPlaybackActive = workspace
      ? Boolean(state.workspacePlayers[workspace])
      : state.isPlaying && state.playbackMode === "arrangement";
    if (currentPlaybackActive) {
      stopAllWorkspacePlayers();
      if (state.isPlaying) stopPlayback();
      return;
    }
    stopAllWorkspacePlayers();
    if (state.isPlaying) stopPlayback();
    if (workspace) toggleWorkspacePlayback(workspace);
    else startPlayback("arrangement");
  }

  function workspacePlaybackScheduler(workspace) {
    const player = state.workspacePlayers[workspace];
    if (!player || !state.audioContext) return;
    const now = state.audioContext.currentTime;
    const lookAhead = 0.12;
    while (player.nextStepTime < now + lookAhead) {
      const clockStep = player.stepIndex;
      if (workspace === "sequencer") {
        const pattern = getPattern();
        if (pattern) {
          getGridEventsForTick(pattern, clockStep).forEach(({ step, tickOffset }) => {
            const eventTick = clockStep + tickOffset;
            const swingOffset = Math.floor(eventTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0;
            const eventTime = player.nextStepTime + tickOffset * getSchedulerTickDuration();
            scheduleStep(step % getGridStepCount(pattern), eventTime + swingOffset, pattern, null, false, player);
          });
          schedulePatternPianoNotes(pattern, clockStep % (pattern.steps * 2), player.nextStepTime);
        }
      } else {
        scheduleWorkspaceMelLoop(player, now, lookAhead);
        updatePianoCursorFromTime(player.startTime);
      }
      if (state.metronome && state.recordingMetronomeTimer === null && clockStep % 8 === 0) {
        triggerClick(player.nextStepTime, clockStep % 32 === 0);
      }
      player.nextStepTime += getSchedulerTickDuration();
      const cycleTicks = workspace === "sequencer" ? (getPattern()?.steps || state.steps) * 2 : 32;
      player.stepIndex = (clockStep + 1) % cycleTicks;
    }
  }

  function scheduleWorkspaceMelLoop(player, now, lookAhead) {
    const editContext = state.stepPianoEditContext;
    const mel = editContext ? null : getMel();
    const editPattern = editContext ? getPattern(editContext.patternId) : null;
    const notes = editContext ? state.pianoNotes : mel?.notes;
    const instrument = getPianoTrack(editContext?.trackId || mel?.instrumentId || state.selectedPianoTrackId);
    if (!notes || !instrument) return;
    const secondsPerBar = 240 / state.bpm;
    const loopBars = editContext ? (editPattern?.steps || 16) / 16 : getMelLengthBars(mel);
    const loopSeconds = loopBars * secondsPerBar;
    const firstLoop = Math.max(0, Math.floor((now - player.startTime) / loopSeconds));
    notes.forEach((note) => {
      for (let loop = firstLoop; loop <= firstLoop + 1; loop += 1) {
        const key = `${note.id}:${loop}`;
        const when = player.startTime + loop * loopSeconds + note.startTick / PIANO_TICKS_PER_BAR * secondsPerBar;
        if (player.scheduledMelNotes.has(key) || when < now || when >= now + lookAhead) continue;
        playPianoNote(instrument, when, note.midi, note.durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar,
          note.velocity ?? 0.8, instrument, null, note);
        player.scheduledMelNotes.add(key);
      }
    });
    const nextLoop = firstLoop + 1;
    if (player.scheduledMelNotes.size > notes.length * 3) {
      player.scheduledMelNotes = new Set([...player.scheduledMelNotes].filter((key) => key.endsWith(`:${firstLoop}`) || key.endsWith(`:${nextLoop}`)));
    }
  }

  function setPlayhead(step) {
    state.currentStep = step;
    document.querySelectorAll(".step-cell.is-playhead").forEach((cell) => cell.classList.remove("is-playhead"));
    document.querySelectorAll(`.step-cell[data-step="${step}"]`).forEach((cell) => cell.classList.add("is-playhead"));
  }

  function makeId() {
    return window.crypto?.randomUUID?.() || `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function isAudioFile(file) {
    return file.type.startsWith("audio/") || /\.(wav|wave|mp3|m4a|aac|flac|ogg|opus|webm|aiff?)$/i.test(file.name);
  }

  const MUSICAL_KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const MUSICAL_KEY_PROFILES = [
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  ];

  function getKeyFromChroma(chroma) {
    const total = chroma.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return null;
    const distribution = chroma.map((value) => value / total);
    const entropy = -distribution.reduce((sum, value) => sum + (value > 0 ? value * Math.log2(value) : 0), 0);
    const contrast = Math.max(...chroma) / (total / chroma.length);
    if (entropy > 3.45 || contrast < 1.7) return null;
    const mean = total / chroma.length;
    let best = { score: -Infinity, tonic: 0, mode: 0 };
    let secondScore = -Infinity;
    MUSICAL_KEY_PROFILES.forEach((profile, mode) => {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        const profileMean = profile.reduce((sum, value) => sum + value, 0) / 12;
        let numerator = 0;
        let chromaVariance = 0;
        let profileVariance = 0;
        for (let pitch = 0; pitch < 12; pitch += 1) {
          const observed = chroma[(pitch + tonic) % 12] - mean;
          const expected = profile[pitch] - profileMean;
          numerator += observed * expected;
          chromaVariance += observed * observed;
          profileVariance += expected * expected;
        }
        const score = numerator / Math.sqrt(chromaVariance * profileVariance || 1);
        if (score > best.score) {
          secondScore = best.score;
          best = { score, tonic, mode };
        } else if (score > secondScore) {
          secondScore = score;
        }
      }
    });
    if (best.score < 0.25 || best.score - secondScore < 0.02) return null;
    return `${MUSICAL_KEY_NAMES[best.tonic]} ${best.mode === 0 ? "major" : "minor"}`;
  }

  function detectAudioMetadata(buffer) {
    // Analyze a bounded local window; spectral flux estimates tempo and chroma estimates key.
    const stride = Math.max(1, Math.floor(buffer.sampleRate / 11025));
    const sampleRate = buffer.sampleRate / stride;
    const sampleCount = Math.min(Math.floor(buffer.length / stride), Math.floor(sampleRate * 45));
    const frameSize = 2048;
    const hopSize = 256;
    if (sampleCount < frameSize) return { bpm: null, key: null };
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const mono = new Float32Array(sampleCount);
    for (let index = 0; index < sampleCount; index += 1) {
      let sample = 0;
      channels.forEach((channel) => { sample += channel[index * stride] || 0; });
      mono[index] = sample / channels.length;
    }

    const cosine = new Float64Array(frameSize / 2);
    const sine = new Float64Array(frameSize / 2);
    const reversedIndices = new Uint16Array(frameSize);
    for (let index = 0; index < frameSize / 2; index += 1) {
      cosine[index] = Math.cos(2 * Math.PI * index / frameSize);
      sine[index] = Math.sin(2 * Math.PI * index / frameSize);
    }
    for (let index = 0; index < frameSize; index += 1) {
      let reversed = 0;
      for (let bit = 1, source = index; bit < frameSize; bit <<= 1, source >>= 1) {
        reversed = (reversed << 1) | (source & 1);
      }
      reversedIndices[index] = reversed;
    }
    const window = Float32Array.from({ length: frameSize }, (_, index) =>
      0.5 - 0.5 * Math.cos(2 * Math.PI * index / (frameSize - 1)));
    const real = new Float64Array(frameSize);
    const imaginary = new Float64Array(frameSize);
    const previousMagnitudes = new Float32Array(frameSize / 2);
    const chroma = Array(12).fill(0);
    const onsets = [];
    const frameRate = sampleRate / hopSize;

    for (let offset = 0; offset + frameSize <= sampleCount; offset += hopSize) {
      for (let index = 0; index < frameSize; index += 1) {
        real[reversedIndices[index]] = mono[offset + index] * window[index];
        imaginary[reversedIndices[index]] = 0;
      }
      for (let size = 2; size <= frameSize; size <<= 1) {
        const halfSize = size >> 1;
        const tableStep = frameSize / size;
        for (let start = 0; start < frameSize; start += size) {
          for (let index = 0; index < halfSize; index += 1) {
            const tableIndex = index * tableStep;
            const cosineValue = cosine[tableIndex];
            const sineValue = -sine[tableIndex];
            const even = start + index;
            const odd = even + halfSize;
            const oddReal = real[odd] * cosineValue - imaginary[odd] * sineValue;
            const oddImaginary = real[odd] * sineValue + imaginary[odd] * cosineValue;
            real[odd] = real[even] - oddReal;
            imaginary[odd] = imaginary[even] - oddImaginary;
            real[even] += oddReal;
            imaginary[even] += oddImaginary;
          }
        }
      }

      let spectralFlux = 0;
      for (let bin = 1; bin < frameSize / 2; bin += 1) {
        const magnitude = Math.hypot(real[bin], imaginary[bin]);
        const frequency = bin * frameRate * hopSize / frameSize;
        if (frequency >= 55 && frequency <= 5000) {
          const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
          chroma[(midi % 12 + 12) % 12] += magnitude;
          spectralFlux += Math.max(0, magnitude - previousMagnitudes[bin]);
        }
        previousMagnitudes[bin] = magnitude;
      }
      onsets.push(spectralFlux);
    }

    let bpm = null;
    if (buffer.duration >= 4 && onsets.length > 12) {
      const onsetMean = onsets.reduce((sum, value) => sum + value, 0) / onsets.length;
      const centeredOnsets = onsets.map((value) => value - onsetMean);
      const minLag = Math.max(2, Math.floor(frameRate * 60 / 200));
      const maxLag = Math.min(onsets.length - 2, Math.ceil(frameRate * 60 / 60));
      const correlations = new Map();
      const totalOnsetEnergy = centeredOnsets.reduce((sum, value) => sum + value * value, 0);
      const correlationAt = (lag) => {
        if (lag < minLag || lag > maxLag) return 0;
        if (correlations.has(lag)) return correlations.get(lag);
        let product = 0;
        for (let index = lag; index < centeredOnsets.length; index += 1) {
          product += centeredOnsets[index] * centeredOnsets[index - lag];
        }
        const score = product / (totalOnsetEnergy || 1);
        correlations.set(lag, score);
        return score;
      };
      let bestLag = 0;
      let bestScore = -Infinity;
      for (let lag = minLag; lag <= maxLag; lag += 1) {
        const score = correlationAt(lag);
        if (score > bestScore) {
          bestLag = lag;
          bestScore = score;
        }
      }
      if (bestLag && bestScore > 0.08) {
        const leftScore = correlationAt(bestLag - 1);
        const rightScore = correlationAt(bestLag + 1);
        const curvature = leftScore - 2 * bestScore + rightScore;
        const fractionalLag = bestLag + (curvature ? 0.5 * (leftScore - rightScore) / curvature : 0);
        let detected = 60 * frameRate / fractionalLag;
        if (detected < 85 && detected * 2 <= 200 &&
          correlationAt(Math.round(bestLag / 2)) >= bestScore * 0.8) detected *= 2;
        bpm = Math.round(detected);
      }
    }
    return { bpm, key: getKeyFromChroma(chroma) };
  }

  function normalizeAudioMetadata(metadata) {
    return {
      bpm: Number.isFinite(metadata?.bpm) && metadata.bpm >= 40 && metadata.bpm <= 240
        ? Math.round(metadata.bpm) : null,
      key: typeof metadata?.key === "string" && /^[A-G]#? (major|minor)$/.test(metadata.key)
        ? metadata.key : null,
    };
  }

  function makeDrumSampleTrack(options) {
    const name = options.name?.trim() || "Imported drum";
    const track = {
      id: options.id || makeId(),
      name,
      kind: "sample",
      color: /^#[\da-f]{6}$/i.test(options.color || "") ? options.color : TRACK_COLORS[state.tracks.length % TRACK_COLORS.length],
      subtitle: "Imported drum sample",
      volume: Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : 0.72,
      cells: Array.from({ length: STEP_COUNT }, (_, index) => options.cells?.[index] === true),
      variant: null,
      muted: options.muted === true,
      solo: options.solo === true,
      pitch: Number.isFinite(options.pitch) ? Math.max(-12, Math.min(12, options.pitch)) : 0,
      swing: Number.isFinite(options.swing) ? Math.max(0, Math.min(45, options.swing)) : null,
      sample: options.buffer ? { name: options.fileName || name, buffer: options.buffer } : null,
      audioMetadata: normalizeAudioMetadata(options.audioMetadata),
      gainNode: null,
      effects: makeDefaultEffects(options.effects),
    };
    ensureSequencerTrackAudio(track);
    return track;
  }

  function makePatternInstrumentLayer(source, options = {}) {
    const layer = {
      ...source,
      id: options.id || makeId(),
      sourceId: source.sourceId || source.id,
      name: options.name || source.name,
      libraryOnly: false,
      patch: source.patch ? { ...source.patch } : undefined,
      cells: Array.from({ length: STEP_COUNT }, (_, index) => options.cells?.[index] === true),
      volume: Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : source.volume,
      muted: options.muted === true,
      solo: options.solo === true,
      pitch: Number.isFinite(options.pitch) ? Math.max(-12, Math.min(12, options.pitch)) : source.pitch || 0,
      swing: Number.isFinite(options.swing) ? Math.max(0, Math.min(45, options.swing)) : source.swing ?? null,
      variant: options.variant ?? source.variant,
      sample: source.sample ? { ...source.sample } : null,
      gainNode: null,
      fxRuntime: null,
      effects: makeDefaultEffects(options.effects),
    };
    ensureSequencerTrackAudio(layer);
    return layer;
  }

  async function importDrumSamples(files) {
    if (!files.length) return;
    const imported = [];
    const failures = [];
    try {
      await ensureAudio();
      captureCurrentPattern();
      for (const file of files) {
        if (!isAudioFile(file)) {
          failures.push(file.name);
          continue;
        }
        try {
          const buffer = await state.audioContext.decodeAudioData(await file.arrayBuffer());
          const track = makeDrumSampleTrack({
            name: file.name.replace(/\.[^.]+$/, "") || file.name,
            fileName: file.name,
            buffer,
            audioMetadata: detectAudioMetadata(buffer),
          });
          state.tracks.push(track);
          const pattern = getPattern();
          if (pattern) {
            pattern.trackIds = [...getPatternTrackIds(pattern), track.id];
            pattern.cells[track.id] = Array(STEP_COUNT).fill(false);
          }
          imported.push({ track, file });
        } catch {
          failures.push(file.name);
        }
      }

      if (imported.length) {
        renderTracks();
        if (isSongWorkspace()) renderArrangement();
        saveState();
        const saves = await Promise.allSettled(imported.map(({ track, file }) => persistDrumSample(track, file)));
        const storageFailed = saves.some((result) => result.status === "rejected");
        const summary = `${imported.length} drum sound${imported.length === 1 ? "" : "s"} imported`;
        showToast(`${summary}${failures.length ? `; ${failures.length} could not be decoded` : ""}${storageFailed ? "; some couldn't be saved" : ""}.`);
      } else {
        showToast(failures.length ? `Could not import ${failures.join(", ")}.` : "Choose one or more audio files.");
      }
    } catch (error) {
      showToast(`Could not import drum sounds: ${error.message || "audio is unavailable"}`);
    } finally {
      drumSamplesInput.value = "";
    }
  }

  function removeImportedDrumTrack(track) {
    if (state.isPlaying) stopPlayback();
    const removedTracks = track.sourceId
      ? [track]
      : state.tracks.filter((item) => item === track || item.sourceId === track.id);
    const removedIds = new Set(removedTracks.map((item) => item.id));
    removedTracks.forEach(disconnectTrackAudio);
    state.tracks = state.tracks.filter((item) => !removedIds.has(item.id));
    const fallbackInstrumentId = state.tracks.find((item) => !item.sourceId)?.id || state.tracks[0]?.id || "";
    if (removedIds.has(state.selectedPianoTrackId)) state.selectedPianoTrackId = fallbackInstrumentId;
    state.pianoNotes = state.pianoNotes.map((note) => ({
      ...note,
      trackId: removedIds.has(note.trackId) ? fallbackInstrumentId : note.trackId,
    }));
    state.mels.forEach((mel) => {
      if (removedIds.has(mel.instrumentId)) mel.instrumentId = fallbackInstrumentId;
      mel.notes = mel.notes.map((note) => ({ ...note, trackId: mel.instrumentId }));
    });
    state.melTracks.forEach((melTrack) => {
      if (removedIds.has(melTrack.instrumentId)) {
        melTrack.instrumentId = fallbackInstrumentId;
        if (state.audioContext) {
          const fallbackTrack = getPianoTrack(fallbackInstrumentId);
          if (fallbackTrack) ensureTrackAudio(fallbackTrack);
          rebuildTrackEffectChain(melTrack);
        }
      }
    });
    if (!state.pianoNotes.some((note) => note.id === state.selectedPianoNoteId)) state.selectedPianoNoteId = null;
    state.patterns.forEach((pattern) => {
      pattern.trackIds = getPatternTrackIds(pattern).filter((id) => !removedIds.has(id));
      removedIds.forEach((id) => {
        delete pattern.cells[id];
        delete pattern.variants[id];
      });
    });
    renderTracks();
    renderMelOptions();
    renderPianoInstrumentOptions();
    renderPianoRoll();
    if (isSongWorkspace()) renderArrangement();
    updateTrackGains();
    saveState();
    removedTracks.filter((item) => item.kind === "sample" || item.sample).forEach((item) => {
      deletePersistedDrumSample(item.id).catch(() => showToast("Track removed, but its saved sample could not be deleted."));
    });
    showToast(`${track.name} removed`);
  }

  function getNextArrangementTrackName() {
    let number = 1;
    while (state.arrangementTracks.some((track) => track.name === `Track ${number}`)) number += 1;
    return `Track ${number}`;
  }

  function createArrangementTrack(name = getNextArrangementTrackName(), insertAfterTrackId = null) {
    const track = {
      id: makeId(),
      name,
      insertAfterTrackId,
      color: TRACK_COLORS[state.arrangementTracks.length % TRACK_COLORS.length],
      clips: [],
      volume: 0.8,
      muted: false,
      solo: false,
      gainNode: null,
      effects: makeDefaultEffects(),
    };
    state.arrangementTracks.push(track);
    ensureArrangementTrackAudio(track);
    return track;
  }

  function ensureArrangementTrackAudio(track) {
    ensureTrackAudio(track);
  }

  function ensureSequencerTrackAudio(track) {
    ensureTrackAudio(track);
  }

  function ensureTrackAudio(track) {
    ensureTrackMixerState(track);
    if (!state.audioContext) return;
    if (track !== state.masterTrack) ensureTrackAudio(state.masterTrack);
    if (track.kind !== "mixer-master" && track.kind !== "mixer-effects") {
      state.effectTracks.forEach(ensureTrackAudio);
    }
    if (track.kind === "mel") {
      const instrument = state.tracks.find((item) => item.id === track.instrumentId);
      if (instrument && instrument !== track) ensureTrackAudio(instrument);
    }
    if (!track.gainNode) {
      track.gainNode = state.audioContext.createGain();
      track.gainNode.gain.value = track.muted ? 0 : track.volume;
    }
    if (!track.fxRuntime) rebuildTrackEffectChain(track);
  }

  function getTrackOutputNode(track) {
    if (track === state.masterTrack) return state.masterGain;
    if (track.kind === "mixer-effects") return state.masterTrack?.gainNode || state.masterGain;
    const effectTrack = state.effectTracks.find((candidate) => candidate.routedTrackIds.includes(track.id));
    if (effectTrack) return effectTrack.gainNode || state.masterTrack?.gainNode || state.masterGain;
    if (track.kind === "mel") {
      const instrument = state.tracks.find((item) => item.id === track.instrumentId);
      if (instrument && instrument !== track) return instrument.gainNode || state.masterTrack?.gainNode || state.masterGain;
    }
    return state.masterTrack?.gainNode || state.masterGain;
  }

  function rebuildTrackEffectChain(track) {
    const context = state.audioContext;
    if (!context || !track.gainNode || !state.masterGain) return;
    clearTrackEffectNodes(track);
    track.analyser?.disconnect();
    track.analyser = null;
    ensureTrackMixerState(track);
    track.fxRuntime = [];
    track.gainNode.disconnect();
    let output = track.gainNode;

    const eq = [
      ["lowshelf", 40, track.effects.eqSub],
      ["peaking", 160, track.effects.eqLow],
      ["peaking", 1000, track.effects.eqMid],
      ["peaking", 5000, track.effects.eqHigh],
      ["highshelf", 12000, track.effects.eqAir],
    ].map(([type, frequency, gain]) => {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.gain.value = gain;
      output.connect(filter);
      output = filter;
      return filter;
    });
    track.fxRuntime.push({ nodes: eq, sources: [] });

    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    output.connect(analyser);
    output = analyser;
    track.analyser = analyser;
    track.fxRuntime.push({ nodes: [analyser], sources: [] });

    track.effectChain.forEach((id) => {
      const amount = track.effects[id];
      const module = createTrackEffect(context, id, amount, track.effectSettings[id]);
      output.connect(module.input);
      output = module.output;
      track.fxRuntime.push(module);
    });
    output.connect(getTrackOutputNode(track));
  }

  function rebuildMixerAudioRouting() {
    if (!state.audioContext) return;
    ensureTrackAudio(state.masterTrack);
    state.effectTracks.forEach(ensureTrackAudio);
    getMixerSourceTracks().forEach(({ track }) => {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    });
  }

  function clearTrackEffectNodes(track) {
    track.fxRuntime?.forEach(({ nodes, sources }) => {
      sources.forEach((source) => {
        try { source.stop(); } catch { /* already stopped */ }
      });
      nodes.forEach((node) => node.disconnect());
    });
    track.fxRuntime = null;
  }

  function disconnectTrackAudio(track) {
    clearTrackEffectNodes(track);
    track.gainNode?.disconnect();
    track.gainNode = null;
  }

  function createTrackEffect(context, id, amount, settings = {}) {
    const input = context.createGain();
    const output = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    const nodes = [input, output, dry, wet];
    const sources = [];
    const mix = amount / 100;
    const setting = (key, fallback) => Number.isFinite(settings[key]) ? settings[key] : fallback;
    dry.gain.value = 1 - mix * 0.65;
    wet.gain.value = mix * 0.65;
    input.connect(dry);
    dry.connect(output);
    let effectOutput;
    const connectWet = (node) => {
      nodes.push(node);
      input.connect(node);
      effectOutput = node;
    };

    if (id === "reverb") {
      const convolver = context.createConvolver();
      const decay = setting("decay", 1.8);
      const impulse = context.createBuffer(2, Math.floor(context.sampleRate * decay), context.sampleRate);
      for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const samples = impulse.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / samples.length, 2.8);
        }
      }
      convolver.buffer = impulse;
      const preDelay = context.createDelay(0.11);
      preDelay.delayTime.value = setting("preDelay", 20) / 1000;
      input.connect(preDelay);
      preDelay.connect(convolver);
      nodes.push(preDelay, convolver);
      effectOutput = convolver;
    } else if (id === "delay") {
      const delay = context.createDelay(1);
      delay.delayTime.value = setting("time", 0.28);
      const feedback = context.createGain();
      feedback.gain.value = setting("feedback", 42) / 100;
      delay.connect(feedback);
      feedback.connect(delay);
      nodes.push(feedback);
      connectWet(delay);
    } else if (id === "chorus" || id === "pitchShifter" || id === "harmonizer") {
      const delay = context.createDelay(0.5);
      const modulation = context.createOscillator();
      const depth = context.createGain();
      const interval = id === "pitchShifter" ? Math.abs(setting("semitones", 0)) : setting("interval", 7);
      delay.delayTime.value = id === "chorus" ? setting("depth", 12) / 1000 : 0.035 + interval * 0.006;
      modulation.frequency.value = id === "chorus" ? setting("rate", 0.28) : id === "harmonizer" ? 0.7 : 0.45;
      depth.gain.value = id === "chorus" ? setting("depth", 12) / 1000 : 0.035 * mix;
      modulation.connect(depth);
      depth.connect(delay.delayTime);
      modulation.start();
      sources.push(modulation);
      nodes.push(depth);
      connectWet(delay);
    } else if (id === "distortion" || id === "bitcrusher") {
      const shaper = context.createWaveShaper();
      const curve = new Float32Array(4096);
      const drive = setting("drive", 8);
      const levels = Math.pow(2, setting("bits", 8));
      for (let index = 0; index < curve.length; index += 1) {
        const sample = index * 2 / (curve.length - 1) - 1;
        curve[index] = id === "bitcrusher"
          ? Math.round(sample * levels) / levels
          : Math.tanh(sample * drive);
      }
      shaper.curve = curve;
      shaper.oversample = "4x";
      connectWet(shaper);
    } else if (id === "compressor" || id === "noiseGate" || id === "transientShaper") {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = id === "noiseGate" ? setting("threshold", -42)
        : id === "transientShaper" ? -18 - setting("attack", 3)
          : setting("threshold", -18);
      compressor.knee.value = id === "noiseGate" ? 0 : 12;
      compressor.ratio.value = id === "noiseGate" ? 20
        : id === "transientShaper" ? Math.max(1, 5 + setting("sustain", -2) / 3)
          : setting("ratio", 4);
      compressor.attack.value = id === "transientShaper" ? 0.003 : setting("attack", 3) / 1000;
      compressor.release.value = id === "transientShaper" ? 0.08 : setting("release", 180) / 1000;
      connectWet(compressor);
    } else if (id === "tremolo") {
      const tremolo = context.createGain();
      tremolo.gain.value = 0.55;
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 5);
      depth.gain.value = setting("depth", 45) / 100 * mix;
      oscillator.connect(depth);
      depth.connect(tremolo.gain);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(tremolo);
    } else if (id === "autopan") {
      const panner = context.createStereoPanner();
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 0.35);
      depth.gain.value = setting("depth", 100) / 100 * mix;
      oscillator.connect(depth);
      depth.connect(panner.pan);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(panner);
    } else if (id === "phaser") {
      const filters = Array.from({ length: 4 }, () => {
        const filter = context.createBiquadFilter();
        filter.type = "allpass";
        return filter;
      });
      filters.forEach((filter, index) => {
        filter.frequency.value = 400 + index * 600;
        if (index) filters[index - 1].connect(filter);
      });
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 0.18);
      depth.gain.value = setting("depth", 900) * mix;
      oscillator.connect(depth);
      filters.forEach((filter) => depth.connect(filter.frequency));
      oscillator.start();
      nodes.push(...filters, depth);
      sources.push(oscillator);
      connectWet(filters[0]);
      effectOutput = filters.at(-1);
    } else if (id === "vocoder") {
      const carrier = context.createOscillator();
      const ring = context.createGain();
      carrier.type = "sawtooth";
      carrier.frequency.value = setting("carrier", 110);
      carrier.connect(ring.gain);
      carrier.start();
      sources.push(carrier);
      nodes.push(ring);
      connectWet(ring);
    }
    effectOutput.connect(wet);
    wet.connect(output);
    return { input, output, nodes, sources };
  }

  function snapArrangementBar(bar) {
    const position = Number.isFinite(bar) ? bar : 0;
    return state.arrangementSnap ? Math.round(position * 4) / 4 : position;
  }

  function clampArrangementStart(startBar, durationBars) {
    const limit = Math.max(0, MAX_ARRANGEMENT_BARS - durationBars);
    const maxStart = state.arrangementSnap ? Math.floor(limit * 4 + 0.0001) / 4 : limit;
    return Math.max(0, Math.min(maxStart, snapArrangementBar(startBar)));
  }

  function getArrangementClipDuration(type, clip) {
    if (type === "pattern") {
      return Number.isFinite(clip.durationBars)
        ? clip.durationBars
        : (getPattern(clip.patternId)?.steps || 16) / 16 * (clip.repeatCount || 1);
    }
    if (type === "mel") {
      if (Number.isFinite(clip.durationBars)) return clip.durationBars;
      const mel = getMel(clip.melId);
      return mel ? getMelLengthBars(mel) : 1;
    }
    return Number.isFinite(clip.durationSeconds)
      ? clip.durationSeconds / (240 / state.bpm)
      : clip.buffer.duration / (240 / state.bpm);
  }

  function updateArrangementLength() {
    const secondsPerBar = 240 / state.bpm;
    const melEnd = state.melTracks.reduce((latest, track) =>
      track.clips.reduce((end, clip) => {
        return Math.max(end, clip.startBar + getArrangementClipDuration("mel", clip));
      }, latest), 0);
    const clipEnd = state.arrangementTracks.reduce((latest, track) => {
      return track.clips.reduce((end, clip) => Math.max(end, clip.startBar + getArrangementClipDuration("audio", clip)), latest);
    }, state.patternClips.reduce((end, clip) => {
      return Math.max(end, clip.startBar + getArrangementClipDuration("pattern", clip));
    }, Math.max(32, melEnd)));
    state.arrangementBars = Math.min(MAX_ARRANGEMENT_BARS, Math.max(state.arrangementBars, Math.ceil(clipEnd)));
    if (state.playbackStartTime && state.isPlaying && state.playbackMode === "arrangement") {
      state.playbackEndTime = state.playbackStartTime + (state.arrangementBars - state.playbackStartBar) * secondsPerBar;
    }
    $("#arrangement-bar-label").textContent = `${state.arrangementBars} BARS`;
  }

  function makeOpenMixerButton(track) {
    const button = document.createElement("button");
    button.className = "mixer-track-button";
    button.type = "button";
    button.textContent = "EQ";
    button.title = `Open EQ and effects for ${track.name}`;
    button.setAttribute("aria-label", `Open EQ and effects for ${track.name}`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectArrangementTrack(track.id);
      setWorkspaceView("mixer");
    });
    return button;
  }

  function selectArrangementTrack(trackId) {
    state.selectedMixerTrackId = trackId;
    document.querySelectorAll(".arrangement-label[data-track-id]").forEach((label) => {
      label.classList.toggle("is-track-selected", label.dataset.trackId === trackId);
    });
    document.querySelectorAll(".mixer-track-row").forEach((row) => {
      const selected = row.dataset.trackId === trackId;
      row.classList.toggle("is-selected", selected);
      row.querySelector(".mixer-track-title")?.setAttribute("aria-pressed", String(selected));
    });
  }

  function getArrangementTrackIdFromTarget(target) {
    if (!(target instanceof Element)) return null;
    const label = target.closest(".arrangement-label[data-track-id]");
    let trackId = label?.dataset.trackId || "";
    if (!trackId) {
      const laneId = target.closest(".timeline-lane[data-track-id]")?.dataset.trackId || "";
      trackId = laneId.startsWith("pattern:")
        ? laneId.slice("pattern:".length)
        : laneId.startsWith("mel:")
          ? laneId.slice("mel:".length)
          : laneId;
    }
    const isPatternTrack = state.patternClips.some((clip) =>
      (clip.trackId || clip.patternId) === trackId);
    return state.arrangementTracks.some((track) => track.id === trackId) ||
      state.melTracks.some((track) => track.id === trackId) || isPatternTrack
      ? trackId
      : null;
  }

  function closeArrangementTrackContextMenu() {
    const menu = $("#arrangement-track-context-menu");
    menu.hidden = true;
    delete menu.dataset.trackId;
  }

  function openArrangementTrackContextMenu(event) {
    const trackId = getArrangementTrackIdFromTarget(event.target);
    if (!trackId) {
      closeArrangementTrackContextMenu();
      return;
    }
    event.preventDefault();
    const menu = $("#arrangement-track-context-menu");
    menu.dataset.trackId = trackId;
    menu.hidden = false;
    menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 8))}px`;
  }

  function renderArrangement() {
    BAR_WIDTH = BASE_BAR_WIDTH * state.arrangementScale;
    $("#arrangement-empty").hidden = state.view !== "arrangement";
    $("#arrangement-scale-slider").value = String(Math.round(state.arrangementScale * 100));
    $("#arrangement-scale-value").textContent = `${Math.round(state.arrangementScale * 100)}%`;
    const snapButton = $("#arrangement-snap-button");
    snapButton.textContent = `SNAP ${state.arrangementSnap ? "ON" : "OFF"}`;
    snapButton.setAttribute("aria-pressed", String(state.arrangementSnap));
    $("#arrangement-tab-count").textContent = String(Math.max(
      1,
      state.arrangementTracks.length + state.melTracks.length + state.patternClips.length,
    ));
    renderPatternSelectors();
    renderInstrumentBrowser();
    renderRecordingBrowser();

    const width = state.arrangementBars * BAR_WIDTH;
    const labels = $("#arrangement-track-labels");
    const content = $("#timeline-content");
    labels.replaceChildren();
    content.replaceChildren();
    content.style.width = `${width}px`;

    const ruler = document.createElement("div");
    ruler.className = "timeline-ruler";
    ruler.style.width = `${width}px`;
    ruler.style.gridTemplateColumns = `repeat(${state.arrangementBars}, ${BAR_WIDTH}px)`;
    for (let bar = 0; bar < state.arrangementBars; bar += 1) {
      const marker = document.createElement("div");
      marker.className = "timeline-bar";
      marker.textContent = `BAR ${String(bar + 1).padStart(2, "0")}`;
      ruler.append(marker);
    }
    content.append(ruler);

    const arrangedPatternIds = new Set(state.patternClips.map((clip) => clip.trackId || clip.patternId));
    const patternTracks = state.patterns.filter((pattern) => arrangedPatternIds.has(pattern.id));
    const hasTimelineTracks = patternTracks.length > 0 || state.melTracks.length > 0 || state.arrangementTracks.length > 0;
    patternTracks.forEach((pattern) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === pattern.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = pattern.id;
      label.style.setProperty("--track-color", pattern.color || "var(--accent)");
      label.innerHTML = `<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name"></div><div class="arrangement-label-type">Beat pattern · ${getPatternTrackIds(pattern).length} instruments</div></div>`;
      label.querySelector(".arrangement-label-name").textContent = pattern.name;
      label.addEventListener("click", () => {
        selectPattern(pattern.id);
        selectArrangementTrack(pattern.id);
      });
      labels.append(label);

      const lane = createTimelineLane(`pattern:${pattern.id}`, width);
      state.patternClips
        .filter((clip) => (clip.trackId || clip.patternId) === pattern.id)
        .forEach((clip) => lane.append(createPatternClip(clip)));
      content.append(lane);
    });

    state.melTracks.forEach((track) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === track.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = track.id;
      label.style.setProperty("--track-color", track.color);
      label.innerHTML = '<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name"></div><div class="arrangement-label-type"></div></div>';
      label.querySelector(".arrangement-label-name").textContent = track.name;
      const instrument = getPianoTrack(track.instrumentId);
      label.querySelector(".arrangement-label-type").textContent = `Mel · ${instrument?.name || "Instrument"}`;
      label.addEventListener("click", (event) => {
        if (!event.target.closest(".mixer-track-button")) selectArrangementTrack(track.id);
      });
      label.append(makeOpenMixerButton(track));
      labels.append(label);
      const lane = createTimelineLane(`mel:${track.id}`, width);
      track.clips.forEach((clip) => lane.append(createMelClipElement(track, clip)));
      content.append(lane);
    });

    state.arrangementTracks.forEach((track) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === track.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = track.id;
      label.style.setProperty("--track-color", track.color);
      const color = document.createElement("span");
      color.className = "track-color";
      const info = document.createElement("div");
      info.className = "arrangement-label-info";
      const name = document.createElement("div");
      name.className = "arrangement-label-name";
      name.textContent = track.name;
      const type = document.createElement("div");
      type.className = "arrangement-label-type";
      type.textContent = `${track.clips.length} recording${track.clips.length === 1 ? "" : "s"}`;
      info.append(name, type);
      const actions = document.createElement("div");
      actions.className = "arrangement-label-actions";
      const add = document.createElement("button");
      add.type = "button";
      add.title = "Add a recording to this track";
      add.setAttribute("aria-label", `Add recording to ${track.name}`);
      add.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>';
      add.addEventListener("click", () => requestRecordingImport(track.id));
      const mute = document.createElement("button");
      mute.type = "button";
      mute.className = track.muted ? "is-active" : "";
      mute.title = track.muted ? "Unmute track" : "Mute track";
      mute.setAttribute("aria-label", mute.title);
      mute.setAttribute("aria-pressed", String(track.muted));
      mute.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" /><path d="m14 8 4 4m0-4-4 4" /></svg>';
      mute.addEventListener("click", () => {
        track.muted = !track.muted;
        updateTrackGains();
        renderArrangement();
        persistTrackClips(track);
        saveState();
      });
      actions.append(add, mute, makeOpenMixerButton(track));
      const volume = document.createElement("input");
      volume.className = "arrangement-volume";
      volume.type = "range";
      volume.min = "0";
      volume.max = "100";
      volume.value = String(Math.round(track.volume * 100));
      volume.setAttribute("aria-label", `${track.name} volume`);
      volume.addEventListener("input", () => {
        track.volume = Number(volume.value) / 100;
        updateTrackGains();
      });
      volume.addEventListener("change", () => {
        persistTrackClips(track);
        saveState();
      });
      label.append(color, info, actions, volume);
      label.addEventListener("click", (event) => {
        if (event.target.closest("button, input")) return;
        selectArrangementTrack(track.id);
      });
      labels.append(label);

      const lane = createTimelineLane(track.id, width);
      track.clips.forEach((clip) => lane.append(createAudioClip(track, clip)));
      content.append(lane);
    });

    const rows = [
      ...patternTracks.map((track) => ({ id: track.id, type: "pattern" })),
      ...state.melTracks.map((track) => ({ id: track.id, type: "mel" })),
      ...state.arrangementTracks.map((track) => ({ id: track.id, type: "audio" })),
    ];
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const childrenByParent = new Map();
    const childIds = new Set();
    state.arrangementTracks.forEach((track) => {
      const parentId = track.insertAfterTrackId;
      if (!parentId || !rowsById.has(parentId) || parentId === track.id) return;
      const children = childrenByParent.get(parentId) || [];
      children.push(rowsById.get(track.id));
      childrenByParent.set(parentId, children);
      childIds.add(track.id);
    });
    const orderedRows = [];
    const addedRowIds = new Set();
    const appendRow = (row) => {
      if (!row || addedRowIds.has(row.id)) return;
      addedRowIds.add(row.id);
      orderedRows.push(row);
      childrenByParent.get(row.id)?.forEach(appendRow);
    };
    rows.filter((row) => !childIds.has(row.id)).forEach(appendRow);
    rows.forEach(appendRow);
    const labelsById = new Map(Array.from(labels.children, (label) => [label.dataset.trackId, label]));
    const lanesById = new Map(Array.from(content.querySelectorAll(".timeline-lane"), (lane) =>
      [lane.dataset.trackId, lane]));
    const orderedLabels = orderedRows.map((row) => labelsById.get(row.id)).filter(Boolean);
    const orderedLanes = orderedRows.map((row) => lanesById.get(
      row.type === "pattern" ? `pattern:${row.id}` : row.type === "mel" ? `mel:${row.id}` : row.id,
    )).filter(Boolean);
    const timelineRuler = content.firstElementChild;
    labels.replaceChildren(...orderedLabels);
    content.replaceChildren(timelineRuler, ...orderedLanes);

    const dropLabel = document.createElement("div");
    const dropLane = createTimelineLane(hasTimelineTracks ? "new-track" : DEFAULT_ARRANGEMENT_TRACK_ID, width);
    dropLane.classList.add("new-track-drop-lane");
    const dropHint = document.createElement("span");
    if (hasTimelineTracks) {
      dropLabel.className = "arrangement-label new-track-drop-label";
      dropLabel.textContent = "Drop item for a new track";
      dropHint.textContent = "DROP AN ITEM HERE TO CREATE A TRACK";
    } else {
      dropLabel.className = "arrangement-label default-track-label";
      dropLabel.dataset.trackId = DEFAULT_ARRANGEMENT_TRACK_ID;
      dropLabel.style.setProperty("--track-color", TRACK_COLORS[0]);
      dropLabel.innerHTML = '<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name">Track 1</div><div class="arrangement-label-type">Drop an item to start</div></div>';
      dropLabel.addEventListener("click", () => selectArrangementTrack(DEFAULT_ARRANGEMENT_TRACK_ID));
      dropHint.textContent = "DROP AN ITEM HERE TO START TRACK 1";
    }
    labels.append(dropLabel);
    dropLane.append(dropHint);
    content.append(dropLane);
    $("#arrangement-track-count").textContent = String(hasTimelineTracks
      ? patternTracks.length + state.melTracks.length + state.arrangementTracks.length
      : 1).padStart(2, "0");
    updateArrangementCursorMarker();
    updateArrangementSelection();
    if (state.view === "mixer") renderMixer();
  }

  function getMixerSourceTracks() {
    const selectedPatternIsRoutedToCopy = state.patternClips.some((clip) =>
      clip.patternId === state.selectedPatternId && (clip.trackId || clip.patternId) !== clip.patternId);
    const patternTrackIds = new Set([
      ...(selectedPatternIsRoutedToCopy ? [] : [state.selectedPatternId]),
      ...state.patternClips.map((clip) => clip.trackId || clip.patternId),
    ]);
    return [
      ...state.patterns.filter((track) => patternTrackIds.has(track.id))
        .map((track) => ({ track, type: "Pattern" })),
      ...state.melTracks.map((track) => ({ track, type: "Mel" })),
      ...state.arrangementTracks.map((track) => ({ track, type: "Audio" })),
    ];
  }

  function getMixerTracks() {
    return [
      { track: state.masterTrack, type: "Master" },
      ...state.effectTracks.map((track) => ({ track, type: "Effects" })),
      ...getMixerSourceTracks(),
    ].filter(({ track }) => track);
  }

  function createEffectTrack() {
    let number = 1;
    while (state.effectTracks.some((track) => track.name === `Effects ${number}`)) number += 1;
    const track = makeMixerBusTrack("mixer-effects", { id: makeId(), name: `Effects ${number}` });
    state.effectTracks.push(track);
    state.selectedMixerTrackId = track.id;
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildMixerAudioRouting();
    }
    saveState();
    renderMixer();
  }

  function removeEffectTrack(track) {
    if (!state.effectTracks.includes(track)) return;
    if (state.mixerRoutingDialogTrackId === track.id) $("#mixer-routing-dialog").close();
    disconnectTrackAudio(track);
    state.effectTracks = state.effectTracks.filter((item) => item !== track);
    if (state.selectedMixerTrackId === track.id) state.selectedMixerTrackId = MASTER_MIXER_TRACK_ID;
    rebuildMixerAudioRouting();
    saveState();
    renderMixer();
  }

  function renameEffectTrack(track) {
    const name = window.prompt("Rename Effects Track", track.name)?.trim();
    if (!name || name === track.name) return;
    track.name = name;
    saveState();
    renderMixer();
  }

  function getEffectPresetsStorageKey() {
    return `${EFFECT_PRESETS_STORAGE_PREFIX}${state.currentUser}`;
  }

  function loadEffectPresets() {
    state.effectPresets = [];
    if (!state.currentUser) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(getEffectPresetsStorageKey()) || "[]");
      if (!Array.isArray(saved)) throw new Error("saved presets are invalid");
      state.effectPresets = saved
        .filter((preset) => typeof preset?.id === "string" && typeof preset?.name === "string" && preset.name.trim())
        .map((preset) => ({
          id: preset.id,
          name: preset.name.trim(),
          effects: makeDefaultEffects(preset.effects),
          effectSettings: makeDefaultEffectSettings(preset.effectSettings),
          effectChain: Array.isArray(preset.effectChain)
            ? [...new Set(preset.effectChain.filter((id) => EFFECT_IDS.has(id)))]
            : [],
        }));
    } catch (error) {
      showToast(`Could not load effects presets: ${error.message || "browser storage is unavailable."}`);
    }
  }

  function persistEffectPresets(presets) {
    if (!state.currentUser) {
      showToast("Choose a profile before saving effects presets.");
      return false;
    }
    try {
      window.localStorage.setItem(getEffectPresetsStorageKey(), JSON.stringify(presets));
      return true;
    } catch (error) {
      showToast(`Could not save effects preset: ${error.message || "browser storage is unavailable."}`);
      return false;
    }
  }

  function saveEffectTrackPreset(track) {
    ensureTrackMixerState(track);
    const name = window.prompt("Save effects preset", track.name)?.trim();
    if (!name) return;
    const existing = state.effectPresets.find((preset) => preset.name.toLowerCase() === name.toLowerCase());
    if (existing && !window.confirm(`Replace the "${existing.name}" effects preset?`)) return;
    const preset = {
      id: existing?.id || makeId(),
      name,
      effects: makeDefaultEffects(track.effects),
      effectSettings: makeDefaultEffectSettings(track.effectSettings),
      effectChain: [...track.effectChain],
    };
    const presets = existing
      ? state.effectPresets.map((item) => item.id === existing.id ? preset : item)
      : [...state.effectPresets, preset];
    if (!persistEffectPresets(presets)) return;
    state.effectPresets = presets;
    showToast(`Saved "${name}" effects preset.`);
    renderMixer();
  }

  function applyEffectTrackPreset(track, presetId) {
    const preset = state.effectPresets.find((item) => item.id === presetId);
    if (!state.effectTracks.includes(track) || !preset) return;
    track.effects = makeDefaultEffects(preset.effects);
    track.effectSettings = makeDefaultEffectSettings(preset.effectSettings);
    track.effectChain = [...preset.effectChain];
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    }
    saveState();
    renderMixer();
    showToast(`Applied "${preset.name}" to ${track.name}.`);
  }

  function setEffectTrackRouting(track, sourceTrackId, routed) {
    if (routed) {
      state.effectTracks.forEach((effectTrack) => {
        if (effectTrack !== track) {
          effectTrack.routedTrackIds = effectTrack.routedTrackIds.filter((id) => id !== sourceTrackId);
        }
      });
      if (!track.routedTrackIds.includes(sourceTrackId)) track.routedTrackIds.push(sourceTrackId);
    } else {
      track.routedTrackIds = track.routedTrackIds.filter((id) => id !== sourceTrackId);
    }
    rebuildMixerAudioRouting();
    saveState();
    renderMixer();
  }

  function openMixerRoutingDialog(track) {
    if (!state.effectTracks.includes(track)) return;
    state.mixerRoutingDialogTrackId = track.id;
    $("#mixer-routing-title").textContent = track.name;
    const choices = $("#mixer-routing-choices");
    choices.replaceChildren();
    const sources = getMixerSourceTracks();
    if (!sources.length) {
      const empty = document.createElement("span");
      empty.className = "mixer-routing-empty";
      empty.textContent = "Add a pattern, Mel, or audio track to route it here.";
      choices.append(empty);
    }
    sources.forEach(({ track: sourceTrack, type }) => {
      const label = document.createElement("label");
      label.className = "mixer-routing-choice";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = track.routedTrackIds.includes(sourceTrack.id);
      checkbox.addEventListener("change", () => {
        setEffectTrackRouting(track, sourceTrack.id, checkbox.checked);
      });
      const name = document.createElement("span");
      name.textContent = `${sourceTrack.name} · ${type}`;
      label.append(checkbox, name);
      choices.append(label);
    });
    $("#mixer-routing-dialog").showModal();
  }

  function renderMixer() {
    const root = $("#mixer-content");
    const channels = getMixerTracks();
    root.replaceChildren();
    channels.forEach(({ track }) => ensureTrackMixerState(track));
    if (!channels.some(({ track }) => track.id === state.selectedMixerTrackId)) {
      state.selectedMixerTrackId = state.masterTrack.id;
    }

    const trackList = document.createElement("div");
    trackList.className = "mixer-track-list";
    channels.forEach(({ track }) => {
      const row = document.createElement("section");
      row.className = `mixer-track-row${track.id === state.selectedMixerTrackId ? " is-selected" : ""}`;
      row.dataset.trackId = track.id;
      const title = document.createElement("button");
      title.className = "mixer-track-title";
      title.type = "button";
      title.textContent = track.name;
      title.setAttribute("aria-pressed", String(track.id === state.selectedMixerTrackId));
      title.addEventListener("click", () => {
        selectArrangementTrack(track.id);
        renderMixer();
      });
      if (track.kind === "mixer-effects") {
        const titleGroup = document.createElement("div");
        titleGroup.className = "mixer-track-title-group";
        const renameButton = document.createElement("button");
        renameButton.className = "mixer-track-action";
        renameButton.type = "button";
        renameButton.textContent = "Rename";
        renameButton.setAttribute("aria-label", `Rename ${track.name}`);
        renameButton.addEventListener("click", () => renameEffectTrack(track));
        const routeButton = document.createElement("button");
        routeButton.className = "mixer-track-action";
        routeButton.type = "button";
        routeButton.textContent = "Route";
        routeButton.setAttribute("aria-label", `Route tracks through ${track.name}`);
        routeButton.addEventListener("click", () => {
          selectArrangementTrack(track.id);
          renderMixer();
          openMixerRoutingDialog(track);
        });
        titleGroup.append(title, renameButton, routeButton);
        row.append(titleGroup, makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track));
      } else {
        row.append(title, makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track));
      }
      const effectTarget = document.createElement("div");
      effectTarget.className = "mixer-track-effects";
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
      if (track.kind === "mixer-effects") {
        const presetControls = document.createElement("div");
        presetControls.className = "mixer-effect-presets";
        const savePresetButton = document.createElement("button");
        savePresetButton.className = "mixer-track-action";
        savePresetButton.type = "button";
        savePresetButton.textContent = "Save preset";
        savePresetButton.setAttribute("aria-label", `Save ${track.name} effects as a preset`);
        savePresetButton.addEventListener("click", () => saveEffectTrackPreset(track));
        const presetSelect = document.createElement("select");
        presetSelect.setAttribute("aria-label", `Saved effects presets for ${track.name}`);
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = state.effectPresets.length ? "Choose preset…" : "No saved presets";
        presetSelect.append(placeholder);
        state.effectPresets.forEach((preset) => {
          const option = document.createElement("option");
          option.value = preset.id;
          option.textContent = preset.name;
          presetSelect.append(option);
        });
        presetSelect.disabled = state.effectPresets.length === 0;
        const applyPresetButton = document.createElement("button");
        applyPresetButton.className = "mixer-track-action";
        applyPresetButton.type = "button";
        applyPresetButton.textContent = "Apply";
        applyPresetButton.disabled = true;
        applyPresetButton.setAttribute("aria-label", `Apply saved effects preset to ${track.name}`);
        presetSelect.addEventListener("change", () => {
          applyPresetButton.disabled = !presetSelect.value;
        });
        applyPresetButton.addEventListener("click", () => applyEffectTrackPreset(track, presetSelect.value));
        presetControls.append(savePresetButton, presetSelect, applyPresetButton);
        effectTarget.append(presetControls);
      }
      effectTarget.append(makeMixerEffectSlots(track));
      row.append(effectTarget);
      trackList.append(row);
    });

    const library = document.createElement("aside");
    library.className = "mixer-effects-library";
    const libraryTitle = document.createElement("h2");
    libraryTitle.textContent = "Available effects";
    const libraryHint = document.createElement("p");
    libraryHint.textContent = "Drag an effect onto a track";
    const effectList = document.createElement("div");
    effectList.className = "mixer-effects-library-list";
    EFFECT_NAMES.forEach(([id, name]) => {
      const effect = document.createElement("button");
      effect.className = "mixer-library-effect";
      effect.type = "button";
      effect.draggable = true;
      effect.textContent = name;
      effect.dataset.effectId = id;
      effect.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("application/x-dansbpm-effect", id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
      });
      effect.addEventListener("click", () => {
        const track = channels.find(({ track: item }) => item.id === state.selectedMixerTrackId)?.track || channels[0].track;
        addMixerEffect(track, id, true);
      });
      effectList.append(effect);
    });
    library.append(libraryTitle, libraryHint, effectList);
    root.append(trackList, library);
    syncMixerMeters();
  }

  function makeMixerVolumeMonitor(track) {
    const meter = document.createElement("div");
    meter.className = "mixer-volume-monitor";
    meter.dataset.trackId = track.id;
    meter.dataset.level = "0";
    meter.setAttribute("role", "meter");
    meter.setAttribute("aria-label", `${track.name} active volume`);
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "100");
    meter.setAttribute("aria-valuenow", "0");
    const fill = document.createElement("span");
    fill.className = "mixer-volume-monitor-fill";
    meter.append(fill);
    return meter;
  }

  function syncMixerMeters() {
    if (state.mixerMeterAnimation !== null) {
      cancelAnimationFrame(state.mixerMeterAnimation);
      state.mixerMeterAnimation = null;
    }
    const tracksById = new Map(getMixerTracks().map(({ track }) => [track.id, track]));
    const meters = Array.from(document.querySelectorAll(".mixer-volume-monitor"), (meter) => ({
      element: meter,
      fill: meter.querySelector(".mixer-volume-monitor-fill"),
      track: tracksById.get(meter.dataset.trackId),
      samples: null,
    }));
    const resetMeters = () => meters.forEach(({ element, fill }) => {
      element.dataset.level = "0";
      element.setAttribute("aria-valuenow", "0");
      if (fill) fill.style.width = "0%";
    });
    if (state.view !== "mixer" || !state.isPlaying || state.playbackMode !== "arrangement") {
      resetMeters();
      return;
    }
    const draw = () => {
      if (state.view !== "mixer" || !state.isPlaying || state.playbackMode !== "arrangement") {
        resetMeters();
        state.mixerMeterAnimation = null;
        return;
      }
      meters.forEach((meter) => {
        const analyser = meter.track?.analyser;
        let target = 0;
        if (analyser) {
          if (!meter.samples || meter.samples.length !== analyser.fftSize) {
            meter.samples = new Uint8Array(analyser.fftSize);
          }
          analyser.getByteTimeDomainData(meter.samples);
          const sumSquares = meter.samples.reduce((sum, sample) => {
            const amplitude = (sample - 128) / 128;
            return sum + amplitude * amplitude;
          }, 0);
          const rms = Math.sqrt(sumSquares / meter.samples.length);
          if (rms > 0) {
            const decibels = 20 * Math.log10(rms);
            target = Math.max(0, Math.min(100, (decibels + 60) / 60 * 100));
          }
        }
        const previous = Number(meter.element.dataset.level) || 0;
        const level = target >= previous
          ? previous + (target - previous) * 0.65
          : Math.max(target, previous - 2.5);
        meter.element.dataset.level = String(level);
        meter.element.setAttribute("aria-valuenow", String(Math.round(level)));
        if (meter.fill) meter.fill.style.width = `${level}%`;
      });
      state.mixerMeterAnimation = requestAnimationFrame(draw);
    };
    draw();
  }

  function makeMixerVolumeKnob(track) {
    const wrapper = document.createElement("label");
    wrapper.className = "mixer-track-volume";
    const caption = document.createElement("span");
    caption.textContent = "VOL";
    const knob = document.createElement("div");
    knob.className = "mixer-volume-knob";
    knob.setAttribute("role", "slider");
    knob.tabIndex = 0;
    knob.setAttribute("aria-label", `${track.name} volume`);
    knob.setAttribute("aria-valuemin", "0");
    knob.setAttribute("aria-valuemax", "100");
    const pointer = document.createElement("span");
    pointer.className = "mixer-volume-knob-pointer";
    knob.append(pointer);
    const value = document.createElement("output");
    value.textContent = `${Math.round(track.volume * 100)}%`;
    const setValue = (next, persist = false) => {
      const percent = Math.max(0, Math.min(100, Math.round(next)));
      track.volume = percent / 100;
      knob.setAttribute("aria-valuenow", String(percent));
      knob.setAttribute("aria-valuetext", `${percent}%`);
      knob.style.setProperty("--knob-angle", `${-135 + percent * 2.7}deg`);
      knob.style.setProperty("--knob-fill", `${percent * 0.75}%`);
      value.textContent = `${percent}%`;
      updateTrackGains();
      if (persist) saveState();
    };
    const setFromPointer = (event) => {
      const bounds = knob.getBoundingClientRect();
      const angle = Math.atan2(event.clientY - bounds.top - bounds.height / 2, event.clientX - bounds.left - bounds.width / 2) * 180 / Math.PI;
      setValue(((angle - 135 + 360) % 360) / 270 * 100);
    };
    knob.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      knob.setPointerCapture(event.pointerId);
      setFromPointer(event);
      const onMove = (moveEvent) => setFromPointer(moveEvent);
      const onEnd = () => {
        knob.removeEventListener("pointermove", onMove);
        knob.removeEventListener("pointerup", onEnd);
        knob.removeEventListener("pointercancel", onEnd);
        saveState();
      };
      knob.addEventListener("pointermove", onMove);
      knob.addEventListener("pointerup", onEnd);
      knob.addEventListener("pointercancel", onEnd);
    });
    knob.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1;
      setValue(track.volume * 100 + direction * (event.shiftKey ? 5 : 1), true);
    });
    setValue(track.volume * 100);
    wrapper.append(caption, knob, value);
    return wrapper;
  }

  function makeMixerRange(track, id, label, min, max, step, unit) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control";
    control.dataset.effectId = id;
    control.classList.toggle("is-selected", state.selectedMixerEffectId === id);
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(track.effects[id] || 0);
    input.setAttribute("aria-label", `${track.name} ${label}`);
    const value = document.createElement("output");
    value.textContent = `${input.value}${unit}`;
    input.addEventListener("input", () => {
      track.effects[id] = Number(input.value);
      value.textContent = `${input.value}${unit}`;
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
      saveState();
      const channel = [...document.querySelectorAll(".mixer-channel")]
        .find((item) => item.dataset.trackId === track.id);
      channel?.querySelector(".mixer-effect-slots")?.replaceWith(makeMixerEffectSlots(track));
    });
    control.append(caption, input, value);
    return control;
  }

  function makeMixerEffectSlots(track) {
    const effects = document.createElement("div");
    effects.className = "mixer-effect-slots";
    effects.setAttribute("aria-label", `${track.name} active effects`);
    const addSlot = (id, name) => {
      const effectButton = document.createElement("button");
      effectButton.className = "mixer-effect-slot";
      effectButton.type = "button";
      effectButton.textContent = id === "eq" ? name : `${name} ${Math.round(track.effects[id])}%`;
      effectButton.title = `Open ${name} settings for ${track.name}`;
      effectButton.addEventListener("click", () => openMixerEffectDialog(track, id));
      effects.append(effectButton);
    };
    addSlot("eq", "EQ");
    track.effectChain.forEach((id) => addSlot(id, EFFECT_NAMES.find(([effectId]) => effectId === id)?.[1] || id));
    if (track.effectChain.length === 0) effects.classList.add("is-empty");
    return effects;
  }

  function addMixerEffect(track, effectId, openEditor = false) {
    if (!EFFECT_IDS.has(effectId)) return;
    ensureTrackMixerState(track);
    if (!track.effectChain.includes(effectId)) {
      track.effectChain.push(effectId);
      if (track.effects[effectId] === 0) track.effects[effectId] = 35;
      if (state.audioContext) {
        ensureTrackAudio(track);
        rebuildTrackEffectChain(track);
      }
      saveState();
      renderMixer();
    }
    selectArrangementTrack(track.id);
    if (openEditor) openMixerEffectDialog(track, effectId);
  }

  function removeMixerEffect(track, effectId) {
    track.effectChain = track.effectChain.filter((id) => id !== effectId);
    track.effects[effectId] = 0;
    if (state.audioContext) rebuildTrackEffectChain(track);
    saveState();
    $("#mixer-effect-dialog").close();
    renderMixer();
  }

  function refreshMixerEffectTrack(track) {
    ensureTrackMixerState(track);
    if (state.audioContext) {
      ensureTrackAudio(track);
      rebuildTrackEffectChain(track);
    }
    saveState();
  }

  function makeMixerSettingRange(labelText, value, min, max, step, unit, onInput) {
    const control = document.createElement("label");
    control.className = "mixer-effect-control";
    const caption = document.createElement("span");
    caption.className = "mixer-control-caption";
    caption.textContent = labelText;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    const output = document.createElement("output");
    output.textContent = `${input.value}${unit}`;
    input.addEventListener("input", () => {
      output.textContent = `${input.value}${unit}`;
      onInput(Number(input.value));
    });
    control.append(caption, input, output);
    return control;
  }

  function makeMixerEffectResetButton(track, effectId) {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "quiet-button mixer-reset-effect";
    reset.textContent = "Reset";
    reset.addEventListener("click", () => {
      if (effectId === "eq") {
        ["eqSub", "eqLow", "eqMid", "eqHigh", "eqAir"].forEach((band) => { track.effects[band] = 0; });
      } else {
        track.effects[effectId] = 0;
      }
      refreshMixerEffectTrack(track);
      openMixerEffectDialog(track, effectId);
    });
    return reset;
  }

  function openMixerEffectDialog(track, effectId) {
    ensureTrackMixerState(track);
    if (state.audioContext) ensureTrackAudio(track);
    const dialog = $("#mixer-effect-dialog");
    if (state.mixerEffectAnimation !== null) cancelAnimationFrame(state.mixerEffectAnimation);
    state.mixerEffectAnimation = null;
    if (dialog.open) dialog.close();
    state.mixerEffectDialogTrackId = track.id;
    $("#mixer-effect-track-name").textContent = track.name;
    const title = effectId === "eq" ? "EQ" : EFFECT_NAMES.find(([id]) => id === effectId)?.[1] || effectId;
    $("#mixer-effect-title").textContent = title;
    const content = $("#mixer-effect-dialog-content");
    content.replaceChildren();
    let eqCanvas = null;
    let eqBands = [];

    if (effectId === "eq") {
      const visualizer = document.createElement("div");
      visualizer.className = "mixer-eq-visualizer";
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-label", `${track.name} live EQ spectrum`);
      eqCanvas = canvas;
      visualizer.append(canvas);
      content.append(visualizer);
      eqBands = [
        ["eqSub", "Sub · 20–60 Hz", 40],
        ["eqLow", "Bass · 60–250 Hz", 160],
        ["eqMid", "Mid · 250 Hz–2 kHz", 1000],
        ["eqHigh", "Presence · 2–8 kHz", 5000],
        ["eqAir", "Air · 8–20 kHz", 12000],
      ];
      const controls = document.createElement("div");
      controls.className = "mixer-effect-controls";
      eqBands.forEach(([id, label]) => {
        controls.append(makeMixerSettingRange(label, track.effects[id], -12, 12, 1, " dB", (value) => {
          track.effects[id] = value;
          refreshMixerEffectTrack(track);
        }));
      });
      content.append(controls);
      content.append(makeMixerEffectResetButton(track, effectId));
    } else {
      const controls = document.createElement("div");
      controls.className = "mixer-effect-controls";
      controls.append(makeMixerSettingRange("Mix", track.effects[effectId], 0, 100, 1, "%", (value) => {
        track.effects[effectId] = value;
        refreshMixerEffectTrack(track);
      }));
      (EFFECT_PARAMETERS[effectId] || []).forEach(([id, label, min, max, step, unit]) => {
        controls.append(makeMixerSettingRange(label, track.effectSettings[effectId][id], min, max, step, unit, (value) => {
          track.effectSettings[effectId][id] = value;
          refreshMixerEffectTrack(track);
        }));
      });
      content.append(controls);
      content.append(makeMixerEffectResetButton(track, effectId));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "quiet-button mixer-remove-effect";
      remove.textContent = "Remove effect";
      remove.addEventListener("click", () => removeMixerEffect(track, effectId));
      content.append(remove);
    }
    dialog.showModal();
    if (eqCanvas) drawMixerEq(track, eqCanvas, eqBands.map(([id, , frequency]) => [id, frequency]));
  }

  function drawMixerEq(track, canvas, bands) {
    const context = canvas.getContext("2d");
    if (!context) return;
    const draw = () => {
      if (!canvas.isConnected || !$("#mixer-effect-dialog").open || state.mixerEffectDialogTrackId !== track.id) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        state.mixerEffectAnimation = requestAnimationFrame(draw);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const canvasWidth = Math.round(bounds.width * ratio);
      const canvasHeight = Math.round(bounds.height * ratio);
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = bounds.width;
      const height = bounds.height;
      const centerY = height / 2;
      context.fillStyle = "#141518";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "#34363b";
      context.lineWidth = 1;
      [0.2, 0.5, 0.8].forEach((ratioY) => {
        const y = height * ratioY;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      });
      const frequencies = [20, 100, 1000, 10000, 20000];
      frequencies.forEach((frequency) => {
        const x = Math.log(frequency / 20) / Math.log(1000) * width;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
        context.fillStyle = "#85868c";
        context.font = "9px sans-serif";
        context.fillText(frequency >= 1000 ? `${frequency / 1000}k` : String(frequency), x + 3, height - 5);
      });
      if (track.analyser && state.isPlaying) {
        const data = new Uint8Array(track.analyser.frequencyBinCount);
        track.analyser.getByteFrequencyData(data);
        const sampleRate = state.audioContext?.sampleRate || 44100;
        context.fillStyle = "rgba(124, 201, 255, .3)";
        for (let index = 1; index < data.length; index += 1) {
          const frequency = index * sampleRate / track.analyser.fftSize;
          if (frequency < 20 || frequency > 20000) continue;
          const x = Math.log(frequency / 20) / Math.log(1000) * width;
          const barWidth = Math.max(1, width / 180);
          const barHeight = (data[index] / 255) * height * 0.8;
          context.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      }
      const response = (frequency) => bands.reduce((sum, [id, center]) => {
        const gain = track.effects[id];
        const octaves = Math.log2(frequency / center);
        return sum + gain * Math.exp(-(octaves * octaves) / 1.8);
      }, 0);
      context.strokeStyle = "#d4f16c";
      context.lineWidth = 2;
      context.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const frequency = 20 * Math.pow(1000, x / width);
        const gain = Math.max(-12, Math.min(12, response(frequency)));
        const y = centerY - gain / 24 * height;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      state.mixerEffectAnimation = requestAnimationFrame(draw);
    };
    draw();
  }

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
      !track.sourceId && (stepInstrumentPickerMode === "piano-roll" || track.kind !== "drumkit"));
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

  function renderInstrumentBrowser(query = "") {
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
      if (family === "Drums" || family === "Live Drums") {
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

      const row = document.createElement("div");
      row.className = "instrument-source";
      row.dataset.soundId = track.id;
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
      container.append(row);
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
      state.patterns,
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

  function openAssetLibrary() {
    captureCurrentPattern();
    captureCurrentMel();
    renderArrangementAssetBrowser();
    renderRecordingBrowser();
    renderInstrumentBrowser();
    const dialog = $("#source-browser-dialog");
    if (!dialog.open) dialog.show();
  }

  function addPatternClip(startBar = state.arrangementCursor, patternId = state.selectedPatternId, trackId = patternId) {
    const pattern = getPattern(patternId);
    if (!pattern) return;
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
      instrumentId: mel.instrumentId,
      color: TRACK_COLORS[state.melTracks.length % TRACK_COLORS.length],
      muted: false,
      solo: false,
      volume: 1,
      gainNode: null,
      effects: makeDefaultEffects(),
      clips: [],
    };
    state.melTracks.push(track);
    addMelClip(mel.id, track.id, startBar);
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
      instrumentId: source.instrumentId,
      gainNode: null,
      fxRuntime: null,
      analyser: null,
      sourceGains: null,
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
      color: getPatternColor(state.patterns.length),
      steps: currentSource.steps,
      trackIds: [...getPatternTrackIds(currentSource)],
      cells: Object.fromEntries(Object.entries(currentSource.cells).map(([trackId, cells]) => [trackId, [...cells]])),
      variants: { ...currentSource.variants },
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
    preview.style.left = `${startBar * BAR_WIDTH + 4}px`;
    preview.style.width = `${Math.max(28, drag.durationBars * BAR_WIDTH - 8)}px`;
  }

  function clearArrangementDragPreview() {
    state.arrangementDrag?.dragImage?.remove();
    document.querySelectorAll(".arrangement-drag-preview").forEach((preview) => preview.remove());
    document.querySelectorAll(".timeline-lane.is-drop-target").forEach((lane) => lane.classList.remove("is-drop-target"));
    state.arrangementDrag = null;
  }

  function createTimelineLane(trackId, width) {
    const lane = document.createElement("div");
    lane.className = "timeline-lane";
    lane.dataset.trackId = trackId;
    lane.style.width = `${width}px`;
    lane.style.setProperty("--bar-width", `${BAR_WIDTH}px`);
    lane.style.setProperty("--beat-width", `${BAR_WIDTH / 4}px`);
    lane.addEventListener("click", (event) => {
      if (state.suppressArrangementClick) {
        state.suppressArrangementClick = false;
        return;
      }
      if (event.target.closest("[data-selectable-type]")) return;
      setArrangementCursor(barAtPointer(event, lane));
    });
    lane.addEventListener("dragover", (event) => {
      event.preventDefault();
      lane.classList.add("is-drop-target");
      if (event.dataTransfer) {
        const transferTypes = Array.from(event.dataTransfer.types || []);
        const isCopy = event.dataTransfer.files.length ||
          transferTypes.includes("application/x-pulsegrid-pattern-source") ||
          transferTypes.includes("application/x-pulsegrid-mel-source") ||
          transferTypes.includes("application/x-pulsegrid-audio-source");
        event.dataTransfer.dropEffect = isCopy ? "copy" : "move";
      }
      updateArrangementDragPreview(event, lane);
    });
    lane.addEventListener("dragleave", (event) => {
      if (!lane.contains(event.relatedTarget)) {
        lane.classList.remove("is-drop-target");
        lane.querySelector(":scope > .arrangement-drag-preview")?.remove();
      }
    });
    lane.addEventListener("drop", async (event) => {
      event.preventDefault();
      lane.classList.remove("is-drop-target");
      const startBar = arrangementDropStartAtPointer(event, lane);
      clearArrangementDragPreview();
      const isPatternLane = trackId.startsWith("pattern:");
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length) {
        const audioTrackId = state.arrangementTracks.some((track) => track.id === trackId) ? trackId : null;
        for (const file of files) await importRecording(file, audioTrackId, startBar);
        return;
      }
      const audioSource = event.dataTransfer?.getData("application/x-pulsegrid-audio-source");
      if (audioSource) {
        try {
          const { sourceTrackId, clipId } = JSON.parse(audioSource);
          addAudioAssetClip(sourceTrackId, clipId, trackId, startBar);
        } catch {
          showToast("That audio asset could not be added.");
        }
        return;
      }
      const melSource = event.dataTransfer?.getData("application/x-pulsegrid-mel-source");
      if (melSource) {
        try {
          const { melId } = JSON.parse(melSource);
          if (trackId.startsWith("mel:")) addMelClip(melId, trackId.slice(4), startBar);
          else {
            const melTrack = addMelTrack(melId, startBar);
            if (trackId === DEFAULT_ARRANGEMENT_TRACK_ID && melTrack) selectArrangementTrack(melTrack.id);
          }
        } catch {
          showToast("That Mel could not be added.");
        }
        return;
      }
      const melClipTransfer = event.dataTransfer?.getData("application/x-pulsegrid-mel-clip");
      if (melClipTransfer) {
        try {
          const { clipId, sourceTrackId } = JSON.parse(melClipTransfer);
          if (trackId.startsWith("mel:")) moveMelClip(clipId, sourceTrackId, trackId.slice(4), startBar);
          else moveMelClipToNewTrack(clipId, sourceTrackId, startBar);
        } catch {
          showToast("That Mel clip could not be moved.");
        }
        return;
      }
      const patternSource = event.dataTransfer?.getData("application/x-pulsegrid-pattern-source");
      if (patternSource) {
        try {
          const { patternId } = JSON.parse(patternSource);
          if (trackId === DEFAULT_ARRANGEMENT_TRACK_ID) {
            addPatternClip(startBar, patternId, patternId);
            selectArrangementTrack(patternId);
          } else if (isPatternLane) addPatternClip(startBar, patternId, trackId.slice("pattern:".length));
          else addPatternClipToNewTrack(startBar, patternId);
        } catch {
          showToast("That pattern could not be added.");
        }
        return;
      }
      const patternTransfer = event.dataTransfer?.getData("application/x-pulsegrid-pattern-clip");
      if (patternTransfer) {
        try {
          const { clipId } = JSON.parse(patternTransfer);
          if (isPatternLane) movePatternClip(clipId, startBar, trackId.slice("pattern:".length));
          else movePatternClipToNewTrack(clipId, startBar);
        } catch {
          showToast("That drum pattern could not be moved.");
        }
        return;
      }
      const audioTransfer = event.dataTransfer?.getData("application/x-pulsegrid-audio-clip");
      if (audioTransfer) {
        try {
          const { clipId, sourceTrackId } = JSON.parse(audioTransfer);
          if (state.arrangementTracks.some((track) => track.id === trackId)) {
            moveArrangementClip(clipId, sourceTrackId, trackId, startBar);
          } else {
            moveArrangementClipToNewTrack(clipId, sourceTrackId, startBar);
          }
        } catch {
          showToast("That audio clip could not be moved.");
        }
      }
    });
    const cursor = document.createElement("div");
    cursor.className = "arrangement-cursor";
    cursor.setAttribute("role", "slider");
    cursor.setAttribute("tabindex", "0");
    cursor.setAttribute("aria-label", "Track View playhead");
    cursor.setAttribute("aria-valuemin", "0");
    cursor.setAttribute("aria-valuemax", String(MAX_ARRANGEMENT_BARS));
    cursor.addEventListener("pointerdown", (event) => startArrangementCursorDrag(event, lane));
    cursor.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      setArrangementCursor(state.arrangementCursor + (event.key === "ArrowRight" ? 0.25 : -0.25));
    });
    lane.append(cursor);
    return lane;
  }

  function barAtPointer(event, lane) {
    const bar = (event.clientX - lane.getBoundingClientRect().left) / BAR_WIDTH;
    return Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 0.001, snapArrangementBar(bar)));
  }

  function arrangementDropStartAtPointer(event, lane) {
    const drag = state.arrangementDrag;
    if (!drag) return barAtPointer(event, lane);
    const pointerBar = (event.clientX - lane.getBoundingClientRect().left) / BAR_WIDTH;
    return clampArrangementStart(pointerBar - drag.grabOffsetBars, drag.durationBars);
  }

  function startArrangementCursorDrag(event, lane) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const update = (moveEvent) => {
      const bar = (moveEvent.clientX - lane.getBoundingClientRect().left) / BAR_WIDTH;
      setArrangementCursor(bar, false);
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

  function makeActivityWaveform(values) {
    const waveform = document.createElement("span");
    waveform.className = "clip-waveform clip-activity-waveform";
    values.forEach((value) => {
      const bar = document.createElement("i");
      bar.style.height = `${Math.max(5, Math.round(value * 100))}%`;
      waveform.append(bar);
    });
    return waveform;
  }

  function getPatternActivityWaveform(pattern, clip, durationBars) {
    const patternBars = pattern.steps / 16;
    const sourceOffset = clip.sourceOffsetBars || 0;
    const playableBars = Math.min(durationBars, Math.max(0, patternBars * (clip.repeatCount || 1) - sourceOffset));
    const stepsPerLoop = getGridStepCount(pattern);
    const tracks = getPatternTrackIds(pattern);
    return Array.from({ length: 48 }, (_, index) => {
      const position = (index + 0.5) / 48 * durationBars;
      if (!tracks.length || position >= playableBars) return 0;
      const sourcePosition = (sourceOffset + position) % patternBars;
      const step = Math.min(stepsPerLoop - 1, Math.floor(sourcePosition / patternBars * stepsPerLoop));
      const active = tracks.reduce((count, trackId) => count + (pattern.cells?.[trackId]?.[step] ? 1 : 0), 0);
      return active / tracks.length;
    });
  }

  function getMelActivityWaveform(mel, clip, durationBars) {
    const sourceOffset = clip.sourceOffsetBars || 0;
    return Array.from({ length: 48 }, (_, index) => {
      const position = sourceOffset + (index + 0.5) / 48 * durationBars;
      return mel.notes.reduce((level, note) => {
        const start = note.startTick / PIANO_TICKS_PER_BAR;
        const end = start + note.durationTicks / PIANO_TICKS_PER_BAR;
        return position >= start && position < end ? Math.max(level, note.velocity || 0.8) : level;
      }, 0);
    });
  }

  function updatePatternClipRepeatMarkers(element, clip, pattern, durationBars) {
    element.querySelector(".pattern-repeat-overlay")?.remove();
    const overlay = document.createElement("span");
    overlay.className = "pattern-repeat-overlay";
    const patternBars = pattern.steps / 16;
    const playbackBars = Math.min(durationBars, Math.max(0, patternBars * (clip.repeatCount || 1) - (clip.sourceOffsetBars || 0)));
    for (let boundary = patternBars - (clip.sourceOffsetBars || 0); boundary < playbackBars - 0.001; boundary += patternBars) {
      const divider = document.createElement("span");
      divider.className = "pattern-repeat-divider";
      divider.style.left = `${Math.max(0, boundary * BAR_WIDTH - 4)}px`;
      overlay.append(divider);
    }
    if (durationBars > playbackBars + 0.001) {
      const extension = document.createElement("span");
      extension.className = "pattern-extension-region";
      extension.style.left = `${Math.max(0, playbackBars * BAR_WIDTH - 4)}px`;
      extension.style.width = `${Math.max(0, (durationBars - playbackBars) * BAR_WIDTH)}px`;
      overlay.append(extension);
    }
    element.append(overlay);
  }

  function updateClipResizeIndicator(element, mode, clip, durationBars, initialDuration) {
    let indicator = element.querySelector(".clip-resize-indicator");
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "clip-resize-indicator";
      element.append(indicator);
    }
    if (mode === "repeat") indicator.textContent = `REPEAT ×${clip.repeatCount || 1}`;
    else indicator.textContent = durationBars > initialDuration + 0.001
      ? "EXTEND · SILENT"
      : durationBars < initialDuration - 0.001 ? "TRIM" : "LENGTH";
  }

  function makeArrangementResizeHandle(type, clip, track, element, labelElement, mode = "length") {
    const handle = document.createElement("button");
    const name = type === "pattern" ? getPattern(clip.patternId)?.name || "pattern"
      : type === "mel" ? getMel(clip.melId)?.name || "Mel" : clip.name;
    handle.type = "button";
    handle.className = `clip-resize-handle clip-${mode}-handle`;
    handle.setAttribute("aria-label", mode === "repeat" ? `Repeat ${name}` : `Resize ${name}`);
    handle.title = mode === "repeat"
      ? "Drag to repeat the pattern"
      : "Drag to trim or extend; extension after the source is silent";

    const updateDuration = (durationBars) => {
      if (type === "audio") clip.durationSeconds = durationBars * (240 / state.bpm);
      else clip.durationBars = durationBars;
      if (mode === "repeat" && type === "pattern") {
        const pattern = getPattern(clip.patternId);
        if (pattern) {
          const patternBars = pattern.steps / 16;
          clip.repeatCount = Math.max(1, Math.ceil(((clip.sourceOffsetBars || 0) + durationBars - 0.0001) / patternBars));
        }
      }
      const duration = getArrangementClipDuration(type, clip);
      element.style.width = `${Math.max(28, duration * BAR_WIDTH - 8)}px`;
      if (type === "mel") {
        const mel = getMel(clip.melId);
        if (mel) labelElement.textContent = `${mel.name.toUpperCase()} · ${duration.toFixed(2)} BAR${duration === 1 ? "" : "S"}`;
      } else if (type === "pattern") {
        const pattern = getPattern(clip.patternId);
        labelElement.textContent = `${(pattern?.name || "DRUM PATTERN").toUpperCase()} · ${duration.toFixed(2)} BAR${duration === 1 ? "" : "S"}`;
        if (pattern) updatePatternClipRepeatMarkers(element, clip, pattern, duration);
      }
      element.setAttribute("aria-label", `${name}, bar ${clip.startBar + 1}, ${duration.toFixed(2)} bars; drag to move or resize`);
    };

    const finishResize = (changed) => {
      if (!changed) return;
      updateArrangementLength();
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      renderArrangement();
      saveState();
      if (type === "audio" && track) {
        persistClip(track, clip).catch(() => showToast("Clip resized, but browser storage could not be updated."));
      }
    };

    handle.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      const increment = event.key === "ArrowRight" ? 0.25 : -0.25;
      const maxDuration = MAX_ARRANGEMENT_BARS - clip.startBar;
      const minDuration = Math.min(state.arrangementSnap ? 0.25 : 0.01, maxDuration);
      const next = Math.max(minDuration, Math.min(maxDuration,
        snapArrangementBar(getArrangementClipDuration(type, clip) + increment)));
      updateDuration(next);
      finishResize(true);
    });
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      const startX = event.clientX;
      const initialDuration = getArrangementClipDuration(type, clip);
      let changed = false;
      element.draggable = false;
      updateClipResizeIndicator(element, mode, clip, initialDuration, initialDuration);
      const onMove = (moveEvent) => {
        const maxDuration = MAX_ARRANGEMENT_BARS - clip.startBar;
        const minDuration = Math.min(state.arrangementSnap ? 0.25 : 0.01, maxDuration);
        const next = Math.max(minDuration, Math.min(maxDuration,
          snapArrangementBar(initialDuration + (moveEvent.clientX - startX) / BAR_WIDTH)));
        changed ||= Math.abs(next - getArrangementClipDuration(type, clip)) > 0.0001;
        updateDuration(next);
        updateClipResizeIndicator(element, mode, clip, getArrangementClipDuration(type, clip), initialDuration);
      };
      const onEnd = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onEnd);
        document.removeEventListener("pointercancel", onEnd);
        element.draggable = true;
        element.querySelector(".clip-resize-indicator")?.remove();
        finishResize(changed);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onEnd);
      document.addEventListener("pointercancel", onEnd);
    });
    return handle;
  }

  function createAudioClip(track, clip) {
    const element = document.createElement("div");
    const durationBars = getArrangementClipDuration("audio", clip);
    element.className = "audio-clip";
    element.draggable = true;
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "audio";
    element.style.setProperty("--clip-color", track.color);
    element.style.left = `${clip.startBar * BAR_WIDTH + 4}px`;
    element.style.width = `${Math.max(28, durationBars * BAR_WIDTH - 8)}px`;
    element.setAttribute("aria-label", `${clip.name}, bar ${clip.startBar + 1}, ${durationBars.toFixed(2)} bars; drag to move or resize`);

    const waveform = document.createElement("span");
    waveform.className = "clip-waveform";
    const samples = clip.buffer.getChannelData(0);
    const sourceOffset = clip.sourceOffsetSeconds || 0;
    const playableDuration = Math.max(0, Math.min(clip.buffer.duration - sourceOffset, clip.durationSeconds ?? clip.buffer.duration));
    waveform.style.right = `${Math.max(4, durationBars * BAR_WIDTH - playableDuration / (240 / state.bpm) * BAR_WIDTH + 4)}px`;
    const firstSample = Math.floor(sourceOffset / clip.buffer.duration * samples.length);
    const lastSample = Math.min(samples.length, firstSample + Math.floor(playableDuration / clip.buffer.duration * samples.length));
    const peakCount = Math.max(1, Math.min(48, Math.floor(playableDuration * 5)));
    const stride = Math.max(1, Math.floor((lastSample - firstSample) / peakCount));
    const sampleStride = Math.max(1, Math.floor(stride / 80));
    for (let index = 0; index < peakCount; index += 1) {
      let peak = 0;
      const start = firstSample + index * stride;
      for (let sample = start; sample < Math.min(lastSample, start + stride); sample += sampleStride) peak = Math.max(peak, Math.abs(samples[sample]));
      const bar = document.createElement("i");
      bar.style.height = `${Math.max(8, Math.round(peak * 82))}%`;
      waveform.append(bar);
    }
    const name = document.createElement("span");
    name.className = "clip-name";
    name.textContent = clip.name;
    const resizeHandle = makeArrangementResizeHandle("audio", clip, track, element, name);
    element.addEventListener("dragstart", (event) => {
      selectArrangementTrack(track.id);
      if (!(event.shiftKey && (event.ctrlKey || event.metaKey))) selectArrangementItem("audio", clip.id, event);
      event.dataTransfer?.setData("application/x-pulsegrid-audio-clip", JSON.stringify({ clipId: clip.id, sourceTrackId: track.id }));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      beginArrangementItemDrag(event, element, "audio", durationBars, clip.startBar);
    });
    element.addEventListener("click", (event) => {
      if (event.target.closest(".clip-resize-handle")) return;
      event.stopPropagation();
      selectArrangementTrack(track.id);
      if (!selectArrangementItem("audio", clip.id, event)) return;
      setArrangementCursor(clip.startBar);
    });
    element.append(waveform, name, resizeHandle);
    return element;
  }

  function createMelClipElement(track, clip) {
    const mel = getMel(clip.melId);
    if (!mel) return document.createElement("div");
    const bars = getArrangementClipDuration("mel", clip);
    const element = document.createElement("div");
    element.className = "mel-arrangement-clip";
    element.draggable = true;
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "mel";
    element.style.setProperty("--clip-color", track.color);
    element.style.left = `${clip.startBar * BAR_WIDTH + 4}px`;
    element.style.width = `${Math.max(28, bars * BAR_WIDTH - 8)}px`;
    const name = document.createElement("span");
    name.className = "mel-clip-name";
    name.textContent = `${mel.name.toUpperCase()} · ${Number(bars.toFixed(2))} BAR${bars === 1 ? "" : "S"}`;
    element.setAttribute("aria-label", `${mel.name}, bar ${clip.startBar + 1}, ${bars.toFixed(2)} bars; drag to move or resize`);
    const resizeHandle = makeArrangementResizeHandle("mel", clip, track, element, name);
    const waveform = makeActivityWaveform(getMelActivityWaveform(mel, clip, bars));
    element.addEventListener("dragstart", (event) => {
      selectArrangementTrack(track.id);
      if (!(event.shiftKey && (event.ctrlKey || event.metaKey))) selectArrangementItem("mel", clip.id, event);
      event.dataTransfer?.setData("application/x-pulsegrid-mel-clip", JSON.stringify({ clipId: clip.id, sourceTrackId: track.id }));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      beginArrangementItemDrag(event, element, "mel", bars, clip.startBar);
    });
    element.addEventListener("click", (event) => {
      if (event.target.closest(".clip-resize-handle")) return;
      event.stopPropagation();
      selectArrangementTrack(track.id);
      if (!selectArrangementItem("mel", clip.id, event)) return;
      setArrangementCursor(clip.startBar);
    });
    element.append(waveform, name, resizeHandle);
    return element;
  }

  function createPatternClip(clip) {
    const element = document.createElement("div");
    element.className = "drum-arrangement-clip";
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "pattern";
    const pattern = getPattern(clip.patternId) || getPattern();
    const patternName = pattern?.name || "Drum pattern";
    const totalBars = getArrangementClipDuration("pattern", clip);
    const displayBars = Number(totalBars.toFixed(2));
    element.style.setProperty("--pattern-color", pattern?.color || "var(--accent)");
    element.style.setProperty("--clip-color", pattern?.color || "var(--accent)");
    element.draggable = true;
    element.style.left = `${clip.startBar * BAR_WIDTH + 4}px`;
    element.style.width = `${Math.max(28, totalBars * BAR_WIDTH - 8)}px`;
    element.setAttribute("aria-label", `${patternName}, bar ${clip.startBar + 1}, ${displayBars} bars; drag to move, repeat, or resize`);
    const icon = document.createElement("span");
    icon.className = "pattern-clip-icon";
    icon.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 11h3l2-6 4 10 2-6h3" /></svg>';
    const text = document.createElement("span");
    text.className = "pattern-clip-name";
    text.textContent = `${patternName.toUpperCase()} · ${displayBars} BAR${displayBars === 1 ? "" : "S"}`;
    const repeatHandle = makeArrangementResizeHandle("pattern", clip, null, element, text, "repeat");
    const resizeHandle = makeArrangementResizeHandle("pattern", clip, null, element, text);
    const waveform = pattern
      ? makeActivityWaveform(getPatternActivityWaveform(pattern, clip, totalBars))
      : makeActivityWaveform([]);
    element.addEventListener("dragstart", (event) => {
      if (!(event.shiftKey && (event.ctrlKey || event.metaKey))) selectArrangementItem("pattern", clip.id, event);
      event.dataTransfer?.setData("application/x-pulsegrid-pattern-clip", JSON.stringify({ clipId: clip.id }));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      beginArrangementItemDrag(event, element, "pattern", totalBars, clip.startBar);
    });
    element.addEventListener("click", (event) => {
      if (event.target.closest(".clip-resize-handle")) return;
      event.stopPropagation();
      if (!selectArrangementItem("pattern", clip.id, event)) return;
      setArrangementCursor(clip.startBar);
    });
    element.append(waveform, icon, text, repeatHandle, resizeHandle);
    if (pattern) updatePatternClipRepeatMarkers(element, clip, pattern, totalBars);
    return element;
  }

  function updateArrangementCursorMarker() {
    document.querySelectorAll(".arrangement-cursor").forEach((marker) => {
      marker.style.left = `${state.arrangementCursor * BAR_WIDTH}px`;
      marker.setAttribute("aria-valuenow", state.arrangementCursor.toFixed(2));
      marker.setAttribute("aria-valuemax", String(state.arrangementBars));
    });
  }

  function setArrangementCursor(bar, persist = true) {
    if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
    state.arrangementCursor = Math.max(0, Math.min(state.arrangementBars - 0.001, snapArrangementBar(bar)));
    updateArrangementCursorMarker();
    if (persist) saveState();
  }

  function arrangementSelectionKey(type, id) {
    return `${type}:${id}`;
  }

  function updateArrangementSelection() {
    document.querySelectorAll("[data-selectable-type][data-clip-id]").forEach((item) => {
      item.classList.toggle("is-selected", state.selectedArrangementItems.has(
        arrangementSelectionKey(item.dataset.selectableType, item.dataset.clipId)));
    });
  }

  function selectAllArrangementItems() {
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    state.pianoSelectionFromMarquee = false;
    document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    state.selectedArrangementItems = new Set([
      ...state.patternClips.map((clip) => arrangementSelectionKey("pattern", clip.id)),
      ...state.melTracks.flatMap((track) => track.clips.map((clip) => arrangementSelectionKey("mel", clip.id))),
      ...state.arrangementTracks.flatMap((track) => track.clips.map((clip) => arrangementSelectionKey("audio", clip.id))),
    ]);
    state.arrangementSelectionFromMarquee = false;
    updateArrangementSelection();
  }

  function selectAllPianoNotes() {
    state.selectedPianoNoteIds = new Set(state.pianoNotes
      .filter((note) => note.startTick < state.pianoBars * PIANO_TICKS_PER_BAR)
      .map((note) => note.id));
    state.selectedPianoNoteId = [...state.selectedPianoNoteIds].at(-1) || null;
    state.pianoSelectionFromMarquee = false;
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    updateArrangementSelection();
    renderPianoRoll();
  }

  function selectAllStepCells() {
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    state.pianoSelectionFromMarquee = false;
    updateArrangementSelection();
    document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    const patternTrackIds = new Set(getPatternTrackIds(getPattern()));
    const stepCount = getGridStepCount();
    state.selectedStepCells = new Set(state.tracks
      .filter((track) => patternTrackIds.has(track.id))
      .flatMap((track) => Array.from({ length: stepCount }, (_, step) => `${track.id}:${step}`)));
    const firstTrack = state.tracks.find((track) => patternTrackIds.has(track.id));
    stepSelectionAnchor = firstTrack ? { trackId: firstTrack.id, step: 0 } : null;
    document.querySelectorAll(".step-cell").forEach((cell) => {
      cell.classList.toggle("is-selected", state.selectedStepCells.has(`${cell.closest(".track-row").dataset.trackId}:${cell.dataset.step}`));
    });
  }

  function copyEditorSelection() {
    if (state.view === "sequencer") {
      if (!state.selectedStepCells.size) return;
      const tracks = Array.from(document.querySelectorAll(".track-row"), (row) =>
        state.tracks.find((track) => track.id === row.dataset.trackId)).filter(Boolean);
      const trackIndexes = new Map(tracks.map((track, index) => [track.id, index]));
      const selection = [...state.selectedStepCells].map((key) => {
        const separator = key.lastIndexOf(":");
        return { trackId: key.slice(0, separator), step: Number(key.slice(separator + 1)) };
      });
      const firstSelection = selection.find(({ trackId }) => trackIndexes.has(trackId));
      const anchor = stepSelectionAnchor && trackIndexes.has(stepSelectionAnchor.trackId)
        ? stepSelectionAnchor
        : firstSelection;
      if (!anchor) return;
      const anchorTrackIndex = trackIndexes.get(anchor.trackId);
      const items = selection.flatMap(({ trackId, step }) => {
        const trackIndex = trackIndexes.get(trackId);
        const track = trackIndex === undefined ? null : tracks[trackIndex];
        if (!track || !Number.isInteger(step)) return [];
        return [{
          trackOffset: trackIndex - anchorTrackIndex,
          stepOffset: step - anchor.step,
          value: track.cells[step] === true,
        }];
      });
      if (!items.length) return;
      stepSelectionAnchor = { ...anchor };
      state.clipboard = { type: "sequencer", items, pasteCount: 0 };
      return;
    }
    if (state.view === "piano-roll") {
      const selectedIds = new Set(state.selectedPianoNoteIds);
      if (state.selectedPianoNoteId) selectedIds.add(state.selectedPianoNoteId);
      const notes = state.pianoNotes.filter((note) => selectedIds.has(note.id));
      if (!notes.length) return;
      const firstTick = Math.min(...notes.map((note) => note.startTick));
      const endTick = Math.max(...notes.map((note) => note.startTick + note.durationTicks));
      state.clipboard = {
        type: "piano-roll",
        items: notes.map((note) => ({ ...note, startOffset: note.startTick - firstTick })),
        span: Math.max(getPianoSnapStep(), endTick - firstTick),
        pasteCount: 0,
      };
      return;
    }
    if (!["arrangement", "mixer"].includes(state.view) || !state.selectedArrangementItems.size) return;
    const items = [];
    state.patternClips.forEach((clip) => {
      if (!state.selectedArrangementItems.has(arrangementSelectionKey("pattern", clip.id))) return;
      items.push({ type: "pattern", patternId: clip.patternId, startBar: clip.startBar, clip: { ...clip }, repeatCount: clip.repeatCount || 1 });
    });
    state.melTracks.forEach((track) => track.clips.forEach((clip) => {
      if (!state.selectedArrangementItems.has(arrangementSelectionKey("mel", clip.id))) return;
      items.push({
        type: "mel", sourceTrackId: track.id, track: { id: track.id, name: track.name, kind: "mel", instrumentId: track.instrumentId, color: track.color, volume: track.volume, effects: makeDefaultEffects(track.effects) },
        clip: { ...clip }, melId: clip.melId, startBar: clip.startBar,
      });
    }));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
      if (!state.selectedArrangementItems.has(arrangementSelectionKey("audio", clip.id))) return;
      items.push({
        type: "audio", sourceTrackId: track.id, track: { id: track.id, name: track.name, color: track.color, volume: track.volume, effects: makeDefaultEffects(track.effects) },
        clip: { ...clip }, startBar: clip.startBar,
      });
    }));
    if (!items.length) return;
    const firstBar = Math.min(...items.map((item) => item.startBar));
    const lastBar = Math.max(...items.map((item) => item.startBar + getArrangementClipDuration(item.type, item.clip)));
    state.clipboard = {
      type: "arrangement",
      items: items.map((item) => ({ ...item, startOffset: item.startBar - firstBar })),
      span: Math.max(1, lastBar - firstBar),
      pasteCount: 0,
    };
  }

  function pasteEditorClipboard() {
    const expectedType = state.view === "sequencer" ? "sequencer" :
      state.view === "piano-roll" ? "piano-roll" :
        ["arrangement", "mixer"].includes(state.view) ? "arrangement" : null;
    if (!state.clipboard) {
      showToast("Copy selected items before pasting.");
      return;
    }
    if (!expectedType || state.clipboard.type !== expectedType) {
      showToast("Copied items can only be pasted into the same editor they came from.");
      return;
    }
    const clipboard = state.clipboard;
    if (expectedType === "piano-roll") {
      const totalTicks = state.pianoBars * PIANO_TICKS_PER_BAR;
      const offset = (clipboard.pasteCount + 1) * clipboard.span;
      const pasted = clipboard.items
        .map((note) => ({
          id: makeId(),
          trackId: state.tracks.some((track) => track.id === note.trackId) ? note.trackId : state.selectedPianoTrackId,
          midi: note.midi,
          startTick: note.startTick + offset,
          durationTicks: Math.min(note.durationTicks, totalTicks - note.startTick - offset),
          velocity: note.velocity,
        }))
        .filter((note) => note.startTick < totalTicks);
      if (!pasted.length) {
        showToast("There is no room to paste those notes in the current Piano Roll length.");
        return;
      }
      state.pianoNotes.push(...pasted);
      state.selectedPianoNoteIds = new Set(pasted.map((note) => note.id));
      state.selectedPianoNoteId = pasted.at(-1).id;
      state.pianoSelectionFromMarquee = false;
      clipboard.pasteCount += 1;
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
      return;
    }
    if (expectedType === "sequencer") {
      const tracks = Array.from(document.querySelectorAll(".track-row"), (row) =>
        state.tracks.find((track) => track.id === row.dataset.trackId)).filter(Boolean);
      const targetTrackIndex = stepSelectionAnchor
        ? tracks.findIndex((track) => track.id === stepSelectionAnchor.trackId)
        : -1;
      const stepCount = getGridStepCount();
      if (targetTrackIndex < 0 || stepCount < 1) {
        showToast("Select a step in the current Step Grid before pasting.");
        return;
      }
      const targetStep = Math.max(0, Math.min(stepCount - 1, stepSelectionAnchor.step));
      const pasted = new Set();
      clipboard.items.forEach((item) => {
        const track = tracks[targetTrackIndex + item.trackOffset];
        const step = targetStep + item.stepOffset;
        if (!track || step < 0 || step >= stepCount) return;
        track.cells[step] = item.value;
        pasted.add(`${track.id}:${step}`);
      });
      if (!pasted.size) {
        showToast("There is no room to paste those steps at the selected position.");
        return;
      }
      stepSelectionAnchor = { trackId: tracks[targetTrackIndex].id, step: targetStep };
      state.selectedStepCells = pasted;
      captureCurrentPattern();
      renderTracks();
      saveState();
      return;
    }
    const offset = snapArrangementBar(state.arrangementCursor + clipboard.pasteCount * clipboard.span);
    const selection = new Set();
    clipboard.items.forEach((item) => {
      const startBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 0.001, snapArrangementBar(offset + item.startOffset)));
      if (item.type === "pattern") {
        const pattern = getPattern(item.patternId);
        if (!pattern) return;
        const durationBars = getArrangementClipDuration("pattern", item.clip);
        const patternStart = clampArrangementStart(startBar, durationBars);
        const clip = { ...item.clip, id: makeId(), patternId: item.patternId, repeatCount: item.repeatCount, startBar: patternStart };
        state.patternClips.push(clip);
        selection.add(arrangementSelectionKey("pattern", clip.id));
      } else if (item.type === "mel") {
        const melLength = getArrangementClipDuration("mel", item.clip);
        const clipStart = clampArrangementStart(startBar, melLength);
        let track = state.melTracks.find((candidate) => candidate.id === item.sourceTrackId);
        if (!track) {
          track = { ...item.track, muted: false, solo: false, clips: [], gainNode: null, effects: makeDefaultEffects(item.track.effects) };
          state.melTracks.push(track);
        }
        const clip = { ...item.clip, id: makeId(), melId: item.melId, startBar: clipStart };
        track.clips.push(clip);
        selection.add(arrangementSelectionKey("mel", clip.id));
      } else if (item.type === "audio") {
        const clipStart = clampArrangementStart(startBar, getArrangementClipDuration("audio", item.clip));
        let track = state.arrangementTracks.find((candidate) => candidate.id === item.sourceTrackId);
        if (!track) {
          track = { ...item.track, clips: [], muted: false, solo: false, gainNode: null, effects: makeDefaultEffects(item.track.effects) };
          state.arrangementTracks.push(track);
          ensureArrangementTrackAudio(track);
        }
        const clip = { ...item.clip, id: makeId(), startBar: clipStart };
        track.clips.push(clip);
        selection.add(arrangementSelectionKey("audio", clip.id));
        if (clip.blob) persistClip(track, clip).catch(() => showToast("The copied recording was pasted, but could not be saved."));
      }
    });
    if (!selection.size) {
      showToast("The copied arrangement items are no longer available.");
      return;
    }
    state.selectedArrangementItems = selection;
    state.arrangementSelectionFromMarquee = false;
    clipboard.pasteCount += 1;
    updateArrangementLength();
    renderArrangement();
    saveState();
  }

  function selectArrangementItem(type, id, event) {
    const key = arrangementSelectionKey(type, id);
    if (event.type === "dragstart") arrangementMarqueeDeselectPending = false;
    state.arrangementSelectionFromMarquee = false;
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
      deleteSelectedArrangementItems(new Set([...state.selectedArrangementItems, key]));
      return false;
    }
    state.selectedPianoNoteIds.clear();
    state.selectedPianoNoteId = null;
    document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
    if (event.shiftKey) state.selectedArrangementItems.add(key);
    else state.selectedArrangementItems = new Set([key]);
    updateArrangementSelection();
    return true;
  }

  function deleteSelectedArrangementItems(selection = state.selectedArrangementItems) {
    let deleted = false;
    const has = (type, id) => selection.has(arrangementSelectionKey(type, id));
    const nextPatterns = state.patternClips.filter((clip) => {
      const keep = !has("pattern", clip.id);
      deleted ||= !keep;
      return keep;
    });
    state.patternClips = nextPatterns;
    state.melTracks.forEach((track) => {
      track.clips = track.clips.filter((clip) => {
        const keep = !has("mel", clip.id);
        deleted ||= !keep;
        return keep;
      });
    });
    state.melTracks = state.melTracks.filter((track) => {
      if (track.clips.length) return true;
      disconnectTrackAudio(track);
      return false;
    });
    state.arrangementTracks.forEach((track) => {
      track.clips = track.clips.filter((clip) => {
        const keep = !has("audio", clip.id);
        if (!keep) {
          deleted = true;
          deletePersistedClip(clip.id);
        }
        return keep;
      });
    });
    state.arrangementTracks = state.arrangementTracks.filter((track) => {
      if (track.clips.length) return true;
      disconnectTrackAudio(track);
      return false;
    });
    state.selectedArrangementItems.clear();
    state.arrangementSelectionFromMarquee = false;
    if (!deleted) return false;
    updateArrangementLength();
    renderArrangement();
    saveState();
    return true;
  }

  function splitArrangementItemsAtCursor() {
    const splitKeys = new Set();
    const hasSelection = state.selectedArrangementItems.size > 0;
    const cursor = snapArrangementBar(state.arrangementCursor);
    setArrangementCursor(cursor);
    let splitCount = 0;
    const canSplit = (type, clip) => {
      const selected = state.selectedArrangementItems.has(arrangementSelectionKey(type, clip.id));
      const start = clip.startBar;
      const end = start + getArrangementClipDuration(type, clip);
      return (!hasSelection || selected) && cursor > start + 0.0001 && cursor < end - 0.0001;
    };

    state.patternClips.forEach((clip) => {
      if (!canSplit("pattern", clip)) return;
      const leftDuration = cursor - clip.startBar;
      const totalDuration = getArrangementClipDuration("pattern", clip);
      clip.durationBars = leftDuration;
      const right = {
        ...clip,
        id: makeId(),
        startBar: cursor,
        durationBars: totalDuration - leftDuration,
        sourceOffsetBars: (clip.sourceOffsetBars || 0) + leftDuration,
      };
      state.patternClips.push(right);
      splitKeys.add(arrangementSelectionKey("pattern", clip.id));
      splitKeys.add(arrangementSelectionKey("pattern", right.id));
      splitCount += 1;
    });
    state.patternClips.sort((left, right) => left.startBar - right.startBar);

    state.melTracks.forEach((track) => {
      track.clips.slice().forEach((clip) => {
        if (!canSplit("mel", clip)) return;
        const leftDuration = cursor - clip.startBar;
        const totalDuration = getArrangementClipDuration("mel", clip);
        clip.durationBars = leftDuration;
        const right = {
          ...clip,
          id: makeId(),
          startBar: cursor,
          durationBars: totalDuration - leftDuration,
          sourceOffsetBars: (clip.sourceOffsetBars || 0) + leftDuration,
        };
        track.clips.push(right);
        splitKeys.add(arrangementSelectionKey("mel", clip.id));
        splitKeys.add(arrangementSelectionKey("mel", right.id));
        splitCount += 1;
      });
      track.clips.sort((left, right) => left.startBar - right.startBar);
    });

    state.arrangementTracks.forEach((track) => {
      track.clips.slice().forEach((clip) => {
        if (!canSplit("audio", clip)) return;
        const secondsPerBar = 240 / state.bpm;
        const leftDuration = (cursor - clip.startBar) * secondsPerBar;
        const totalDuration = clip.durationSeconds ?? clip.buffer.duration;
        clip.durationSeconds = leftDuration;
        const right = {
          ...clip,
          id: makeId(),
          startBar: cursor,
          durationSeconds: totalDuration - leftDuration,
          sourceOffsetSeconds: (clip.sourceOffsetSeconds || 0) + leftDuration,
        };
        track.clips.push(right);
        splitKeys.add(arrangementSelectionKey("audio", clip.id));
        splitKeys.add(arrangementSelectionKey("audio", right.id));
        if (clip.blob) persistClip(track, clip).catch(() => showToast("Clip split, but browser storage could not be updated."));
        if (right.blob) persistClip(track, right).catch(() => showToast("Clip split, but browser storage could not be updated."));
        splitCount += 1;
      });
      track.clips.sort((left, right) => left.startBar - right.startBar);
    });

    if (!splitCount) {
      showToast(hasSelection ? "Move the playhead inside a selected clip to split it." : "Move the playhead inside a clip to split it.");
      return;
    }
    state.selectedArrangementItems = splitKeys;
    state.arrangementSelectionFromMarquee = false;
    updateArrangementLength();
    renderArrangement();
    saveState();
    showToast(`Split ${splitCount} clip${splitCount === 1 ? "" : "s"}`);
  }

  function placeCurrentEditorAtPlayhead() {
    if (state.view === "sequencer") {
      const pattern = getPattern();
      const hasSteps = pattern && getPatternTrackIds(pattern).some((trackId) =>
        pattern.cells?.[trackId]?.slice(0, getGridStepCount(pattern)).some(Boolean));
      if (!pattern || !hasSteps) {
        showToast("Add steps to the pattern before placing it in Track View.");
        return;
      }
      const selectedPatternTrack = state.patterns.find((item) => item.id === state.selectedMixerTrackId);
      const selectedMixerBus = state.selectedMixerTrackId === MASTER_MIXER_TRACK_ID ||
        state.effectTracks.some((track) => track.id === state.selectedMixerTrackId);
      let destinationTrackId = selectedPatternTrack?.id;
      if (!destinationTrackId) {
        if (state.selectedMixerTrackId === DEFAULT_ARRANGEMENT_TRACK_ID || selectedMixerBus) {
          destinationTrackId = pattern.id;
        } else {
          const newTrackPattern = createPatternLaneCopy(pattern);
          destinationTrackId = newTrackPattern.id;
        }
      }
      addPatternClip(state.arrangementCursor, pattern.id, destinationTrackId);
      selectArrangementTrack(destinationTrackId);
      return;
    }
    if (state.view === "piano-roll") {
      captureCurrentMel();
      const mel = getMel();
      if (!mel?.notes.length) {
        showToast("Add notes to the Piano Roll before placing it in Track View.");
        return;
      }
      const selectedMelTrack = state.melTracks.find((track) => track.id === state.selectedMixerTrackId);
      if (selectedMelTrack) {
        addMelClip(mel.id, selectedMelTrack.id, state.arrangementCursor);
      } else {
        const newMelTrack = addMelTrack(mel.id, state.arrangementCursor);
        if (newMelTrack) selectArrangementTrack(newMelTrack.id);
      }
    }
  }

  function nudgeSelectedArrangementItems(direction) {
    if (!state.selectedArrangementItems.size) return false;
    const selected = [];
    state.patternClips.forEach((clip) => {
      if (state.selectedArrangementItems.has(arrangementSelectionKey("pattern", clip.id))) {
        const pattern = getPattern(clip.patternId);
        if (pattern) selected.push({ clip, length: getArrangementClipDuration("pattern", clip) });
      }
    });
    state.melTracks.forEach((track) => track.clips.forEach((clip) => {
      if (state.selectedArrangementItems.has(arrangementSelectionKey("mel", clip.id))) {
        if (getMel(clip.melId)) selected.push({ clip, length: getArrangementClipDuration("mel", clip) });
      }
    }));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
      if (state.selectedArrangementItems.has(arrangementSelectionKey("audio", clip.id))) {
        selected.push({ clip, length: getArrangementClipDuration("audio", clip) });
      }
    }));
    if (!selected.length) return false;
    const minStart = Math.min(...selected.map(({ clip }) => clip.startBar));
    const maxEnd = Math.max(...selected.map(({ clip, length }) => clip.startBar + length));
    const delta = Math.max(-minStart, Math.min(MAX_ARRANGEMENT_BARS - maxEnd, direction));
    if (!delta) return false;
    selected.forEach(({ clip, length }) => {
      clip.startBar = clampArrangementStart(clip.startBar + delta, length);
    });
    renderArrangement();
    saveState();
    return true;
  }

  function startArrangementSelection(event) {
    if (event.button !== 0 || !event.target.closest(".timeline-lane") ||
      event.target.closest("[data-selectable-type]")) return;
    const content = $("#timeline-content");
    const startX = event.clientX;
    const startY = event.clientY;
    const subtractive = event.altKey;
    const additive = event.shiftKey && !subtractive;
    let marquee = null;
    let moved = false;
    const update = (moveEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
      moved = true;
      arrangementMarqueeDeselectPending = false;
      moveEvent.preventDefault();
      if (!marquee) {
        marquee = document.createElement("div");
        marquee.className = "selection-marquee";
        content.append(marquee);
      }
      const bounds = content.getBoundingClientRect();
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
      const next = new Set(additive || subtractive ? state.selectedArrangementItems : []);
      document.querySelectorAll("[data-selectable-type][data-clip-id]").forEach((item) => {
        const bounds = item.getBoundingClientRect();
        if (bounds.left <= selection.right && bounds.right >= selection.left &&
          bounds.top <= selection.bottom && bounds.bottom >= selection.top) {
          const itemKey = arrangementSelectionKey(item.dataset.selectableType, item.dataset.clipId);
          if (subtractive) next.delete(itemKey);
          else next.add(itemKey);
        }
      });
      state.selectedArrangementItems = next;
      state.arrangementSelectionFromMarquee = true;
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      state.pianoSelectionFromMarquee = false;
      document.querySelectorAll(".piano-roll-note").forEach((item) => item.classList.remove("is-selected"));
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      updateArrangementSelection();
    };
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function setWorkspaceView(view, force = false) {
    if (view === state.view && !force && !state.workspaceHidden) return;
    if (view !== "dj" && djViewExpanded) setDjViewExpanded(false, false);
    if (state.stepPianoEditContext && view !== "piano-roll") closeStepInstrumentPianoRoll();
    if (state.keyboardRecordingCountdown && view !== "piano-roll") cancelKeyboardRecordingCountdown();
    if (state.isPlaying) stopPlayback();
    if (view !== "piano-roll") {
      state.selectedPianoNoteIds.clear();
      state.selectedPianoNoteId = null;
      state.pianoSelectionFromMarquee = false;
    }
    state.view = view;
    state.workspaceHidden = false;
    const showSequencer = view === "sequencer";
    const showPianoRoll = view === "piano-roll";
    const showMixer = view === "mixer";
    const showDJ = view === "dj";
    const patternDragSource = $("#pattern-drag-source");
    const addPatternButton = $("#add-pattern-button");
    if (showSequencer) {
      $("#sequencer-actions").append(patternDragSource, addPatternButton);
    } else {
      const arrangementActions = $("#arrangement-actions");
      arrangementActions.insertBefore(patternDragSource, $("#new-pattern-button"));
      arrangementActions.insertBefore(addPatternButton, $("#record-audio-button"));
    }
    $("#arrangement-heading").hidden = showSequencer || showPianoRoll || showDJ;
    $("#arrangement-view").hidden = false;
    document.body.classList.toggle("is-beat-grid-open", showSequencer);
    $("#sequencer-view").hidden = !showSequencer;
    $("#piano-roll-view").hidden = !showPianoRoll;
    $("#mixer-view").hidden = !showMixer;
    $("#dj-view").hidden = !showDJ;
    if (showDJ) renderDjView();
    refreshDjVisualTimer();
    $("#sequencer-tab").classList.toggle("is-selected", showSequencer);
    $("#sequencer-tab").setAttribute("aria-selected", String(showSequencer));
    $("#arrangement-tab").classList.toggle("is-selected", view === "arrangement");
    $("#arrangement-tab").setAttribute("aria-selected", String(view === "arrangement"));
    $("#piano-roll-tab").classList.toggle("is-selected", showPianoRoll);
    $("#piano-roll-tab").setAttribute("aria-selected", String(showPianoRoll));
    $("#mixer-tab").classList.toggle("is-selected", showMixer);
    $("#dj-tab").classList.toggle("is-selected", showDJ);
    $("#dj-tab").setAttribute("aria-selected", String(showDJ));
    $("#mixer-tab").setAttribute("aria-selected", String(showMixer));
    document.querySelectorAll(".workspace-open-button").forEach((button) => {
      button.classList.toggle("is-active", (button.id === "open-beat-grid-button" && showSequencer) || (button.id === "open-piano-roll-button" && showPianoRoll));
      button.setAttribute("aria-pressed", String((button.id === "open-beat-grid-button" && showSequencer) || (button.id === "open-piano-roll-button" && showPianoRoll)));
    });
    if (showSequencer) {
      renderTracks();
      renderPresets();
      renderPatternSelectors();
    }
    if (showPianoRoll) {
      updateStepPianoEditorControls();
      renderMelOptions();
      renderPianoInstrumentOptions();
      renderPianoRoll();
    }
    renderArrangement();
    renderViewLayout();
    saveState();
  }

  function requestRecordingImport(trackId = null) {
    state.pendingImportTrackId = trackId;
    const input = $("#recording-input");
    input.value = "";
    input.click();
  }

  async function importRecording(file, trackId = null, startBar = state.arrangementCursor) {
    if (!isAudioFile(file)) {
      showToast(`"${file.name}" is not an audio file.`);
      return;
    }
    try {
      await ensureAudio();
      const buffer = await state.audioContext.decodeAudioData(await file.arrayBuffer());
      let track = state.arrangementTracks.find((item) => item.id === trackId);
      if (!track) track = createArrangementTrack(file.name);
      else if (!track.clips.length && /^Track \d+$/.test(track.name)) track.name = file.name;
      const clip = {
        id: makeId(), name: file.name, buffer,
        durationSeconds: buffer.duration,
        sourceOffsetSeconds: 0,
        startBar: 0,
        blob: file,
        audioMetadata: detectAudioMetadata(buffer),
      };
      clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("audio", clip));
      track.clips.push(clip);
      track.clips.sort((left, right) => left.startBar - right.startBar);
      updateArrangementLength();
      renderArrangement();
      if (state.view === "dj") renderDjView();
      saveState();
      try {
        await persistClip(track, clip);
      } catch {
        showToast("Recording added for this session, but browser storage is unavailable.");
      }
    } catch (error) {
      showToast(`Could not import ${file.name}: ${error.message || "unsupported audio format"}`);
    }
  }

  function stopRecordingMetronome() {
    if (state.recordingMetronomeTimer !== null) window.clearInterval(state.recordingMetronomeTimer);
    state.recordingMetronomeTimer = null;
  }

  function startRecordingMetronome() {
    stopRecordingMetronome();
    state.recordingClickIndex = 0;
    state.nextRecordingClickTime = state.audioContext.currentTime + 0.02;
    const scheduleClicks = () => {
      while (state.nextRecordingClickTime < state.audioContext.currentTime + 0.12) {
        triggerClick(state.nextRecordingClickTime, state.recordingClickIndex % 4 === 0);
        state.recordingClickIndex += 1;
        state.nextRecordingClickTime += 60 / state.bpm;
      }
    };
    scheduleClicks();
    state.recordingMetronomeTimer = window.setInterval(scheduleClicks, 25);
  }

  function resetRecordingControls() {
    $("#record-audio-button").classList.remove("is-recording");
    $("#record-audio-button").disabled = false;
    $("#record-audio-button").setAttribute("aria-pressed", "false");
    $("#record-button-label").textContent = "Record input";
  }

  function cancelRecordingCountdown() {
    if (state.recordingCountdownTimer !== null) window.clearTimeout(state.recordingCountdownTimer);
    state.recordingCountdownTimer = null;
    stopRecordingMetronome();
    state.recordingStream?.getTracks().forEach((track) => track.stop());
    state.recordingStream = null;
    state.mediaRecorder = null;
    resetRecordingControls();
    showToast("Recording cancelled before it started.");
  }

  function startRecordingAfterCountIn(recorder) {
    let beatsRemaining = 4;
    const countBeat = () => {
      beatsRemaining -= 1;
      if (beatsRemaining === 0) {
        state.recordingCountdownTimer = null;
        try {
          state.recordingStartBar = Math.ceil(state.arrangementCursor) + 1;
          recorder.start();
          $("#record-button-label").textContent = "Stop recording";
          showToast(`Recording from bar ${state.recordingStartBar + 1}`);
        } catch (error) {
          stopRecordingMetronome();
          state.recordingStream?.getTracks().forEach((track) => track.stop());
          state.recordingStream = null;
          state.mediaRecorder = null;
          resetRecordingControls();
          showToast(`Could not start recording: ${error.message || "unknown error"}`);
        }
        return;
      }
      $("#record-button-label").textContent = `Count-in ${beatsRemaining}`;
      state.recordingCountdownTimer = window.setTimeout(countBeat, 60000 / state.bpm);
    };
    state.recordingCountdownTimer = window.setTimeout(countBeat, 60000 / state.bpm);
  }

  async function toggleAudioRecording() {
    if (state.recordingCountdownTimer !== null) {
      cancelRecordingCountdown();
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      $("#record-audio-button").disabled = true;
      $("#record-button-label").textContent = "Saving recording…";
      stopRecordingMetronome();
      state.mediaRecorder.stop();
      return;
    }
    if (!window.navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast("Microphone recording is not supported in this browser.");
      return;
    }
    try {
      $("#record-audio-button").disabled = true;
      $("#record-button-label").textContent = "Requesting mic…";
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      state.recordingStream = stream;
      await ensureAudio();
      state.recordingChunks = [];
      const mimeType = window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      state.mediaRecorder = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) state.recordingChunks.push(event.data);
      });
      recorder.addEventListener("error", () => showToast("Microphone recording stopped because of an error."));
      recorder.addEventListener("stop", async () => {
        state.recordingCountdownTimer = null;
        stopRecordingMetronome();
        stream.getTracks().forEach((track) => track.stop());
        state.recordingStream = null;
        state.mediaRecorder = null;
        const chunks = state.recordingChunks;
        state.recordingChunks = [];
        resetRecordingControls();
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) {
          showToast("No audio was captured.");
          return;
        }
        const extension = blob.type.includes("ogg") ? "ogg" : "webm";
        const name = `Recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
        try {
          await importRecording(new File([blob], name, { type: blob.type }), null, state.recordingStartBar);
        } catch (error) {
          showToast(`Could not add recording: ${error.message || "unknown error"}`);
        }
      });
      $("#record-audio-button").classList.add("is-recording");
      $("#record-audio-button").disabled = false;
      $("#record-audio-button").setAttribute("aria-pressed", "true");
      $("#record-button-label").textContent = "Count-in 4";
      startRecordingMetronome();
      startRecordingAfterCountIn(recorder);
      showToast("Count-in: 4 beats before recording starts");
    } catch (error) {
      stopRecordingMetronome();
      if (state.recordingCountdownTimer !== null) window.clearTimeout(state.recordingCountdownTimer);
      state.recordingCountdownTimer = null;
      state.recordingStream?.getTracks().forEach((track) => track.stop());
      state.recordingStream = null;
      state.mediaRecorder = null;
      resetRecordingControls();
      showToast(`Microphone unavailable: ${error.message || "permission was denied"}`);
    }
  }

  function moveArrangementClip(clipId, sourceTrackId, destinationTrackId, startBar) {
    const source = state.arrangementTracks.find((track) => track.id === sourceTrackId);
    const destination = state.arrangementTracks.find((track) => track.id === destinationTrackId);
    const clipIndex = source?.clips.findIndex((clip) => clip.id === clipId) ?? -1;
    if (!source || !destination || clipIndex < 0) return;
    const [clip] = source.clips.splice(clipIndex, 1);
    clip.startBar = clampArrangementStart(startBar, getArrangementClipDuration("audio", clip));
    destination.clips.push(clip);
    destination.clips.sort((left, right) => left.startBar - right.startBar);
    if (source !== destination && source.clips.length === 0) {
      state.arrangementTracks = state.arrangementTracks.filter((track) => track !== source);
    }
    updateArrangementLength();
    renderArrangement();
    saveState();
    persistClip(destination, clip).catch(() => showToast("Clip moved, but browser storage could not be updated."));
    if (source !== destination) persistTrackClips(source);
  }

  function moveArrangementClipToNewTrack(clipId, sourceTrackId, startBar) {
    const source = state.arrangementTracks.find((track) => track.id === sourceTrackId);
    if (!source?.clips.some((clip) => clip.id === clipId)) return;
    const destination = {
      ...source,
      id: makeId(),
      clips: [],
      gainNode: null,
      fxRuntime: null,
      analyser: null,
      sourceGains: null,
      effectChain: [...(source.effectChain || [])],
      effects: makeDefaultEffects(source.effects),
      effectSettings: makeDefaultEffectSettings(source.effectSettings),
    };
    state.arrangementTracks.push(destination);
    ensureArrangementTrackAudio(destination);
    moveArrangementClip(clipId, source.id, destination.id, startBar);
  }

  function openRecordingDb() {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open("pulsegrid-recordings", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("recordings")) request.result.createObjectStore("recordings", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open recording storage"));
    });
  }

  function persistClip(track, clip) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      transaction.objectStore("recordings").put({
        id: clip.id,
        projectId: state.projectId,
        trackId: track.id,
        trackName: track.name,
        color: track.color,
        name: clip.name,
        startBar: clip.startBar,
        durationSeconds: clip.durationSeconds,
        sourceOffsetSeconds: clip.sourceOffsetSeconds || 0,
        audioMetadata: normalizeAudioMetadata(clip.audioMetadata),
        volume: track.volume,
        muted: track.muted,
        blob: clip.blob,
      });
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save recording")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Recording save was cancelled")); };
    }));
  }

  function persistDrumSample(track, file) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      transaction.objectStore("recordings").put({
        id: `drum-sample:${track.id}`,
        projectId: state.projectId,
        recordType: "drum-sample",
        trackId: track.id,
        trackName: track.name,
        fileName: file.name,
        color: track.color,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        pitch: track.pitch || 0,
        swing: Number.isFinite(track.swing) ? track.swing : null,
        cells: track.cells,
        audioMetadata: normalizeAudioMetadata(track.audioMetadata),
        blob: file,
      });
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save drum sample")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Drum sample save was cancelled")); };
    }));
  }

  function deletePersistedDrumSample(trackId) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      transaction.objectStore("recordings").delete(`drum-sample:${trackId}`);
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not remove drum sample")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Drum sample removal was cancelled")); };
    }));
  }

  function persistTrackClips(track) {
    track.clips.forEach((clip) => persistClip(track, clip).catch(() => {
      showToast("Could not save the latest track changes.");
    }));
  }

  function deletePersistedClip(clipId) {
    openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      transaction.objectStore("recordings").delete(clipId);
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not remove recording")); };
    })).catch(() => showToast("The clip was removed, but browser storage could not be updated."));
  }

  async function restoreArrangement() {
    if (!window.indexedDB) return;
    try {
      const database = await openRecordingDb();
      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction("recordings", "readonly");
        const request = transaction.objectStore("recordings").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Could not read saved recordings"));
        transaction.oncomplete = () => database.close();
      });
      const projectRecords = records.filter((record) =>
        record.projectId === state.projectId || (!record.projectId && state.projectId === "default"));
      if (!projectRecords.length) return;
      initializeAudio();
      const sampleRecords = projectRecords.filter((record) => record.recordType === "drum-sample");
      for (const record of sampleRecords) {
        try {
          const buffer = await state.audioContext.decodeAudioData(await record.blob.arrayBuffer());
          let track = state.tracks.find((item) => item.id === record.trackId);
          if (!track) {
            track = makeDrumSampleTrack({
              id: record.trackId,
              name: record.trackName,
              fileName: record.fileName,
              color: record.color,
              volume: record.volume,
              muted: record.muted,
              solo: record.solo,
              pitch: record.pitch,
              swing: record.swing,
              cells: record.cells,
              audioMetadata: record.audioMetadata || detectAudioMetadata(buffer),
              buffer,
            });
            state.tracks.push(track);
            const pattern = getPattern();
            if (pattern) {
              pattern.trackIds = [...getPatternTrackIds(pattern), track.id];
              pattern.cells[track.id] = Array.from({ length: STEP_COUNT }, (_, index) => record.cells?.[index] === true);
            }
          } else {
            track.sample = { name: record.fileName || record.trackName, buffer };
            track.audioMetadata = record.audioMetadata
              ? normalizeAudioMetadata(record.audioMetadata)
              : detectAudioMetadata(buffer);
            ensureSequencerTrackAudio(track);
            if (track.kind === "sample") track.subtitle = "Imported drum sample";
          }
        } catch {
          showToast(`Could not restore ${record.fileName || record.trackName || "a drum sample"}.`);
        }
      }
      const sampleRecordIds = new Set(sampleRecords.map((record) => record.trackId));
      state.tracks.filter((track) => track.sourceId && !sampleRecordIds.has(track.id)).forEach((layer) => {
        const source = state.tracks.find((track) => track.id === layer.sourceId);
        layer.sample = source?.sample ? { ...source.sample } : null;
        ensureSequencerTrackAudio(layer);
      });

      const clipRecords = projectRecords.filter((record) => record.recordType !== "drum-sample");
      for (const record of clipRecords) {
        let track = state.arrangementTracks.find((item) => item.id === record.trackId);
        if (!track) {
          track = {
            id: record.trackId,
            name: record.trackName,
            color: record.color,
            clips: [],
            volume: record.volume,
            muted: record.muted,
            solo: false,
            effects: makeDefaultEffects(),
            gainNode: null,
          };
          state.arrangementTracks.push(track);
          ensureArrangementTrackAudio(track);
        }
        try {
          const buffer = await state.audioContext.decodeAudioData(await record.blob.arrayBuffer());
          track.clips.push({
            id: record.id,
            name: record.name,
            startBar: record.startBar,
            durationSeconds: Number.isFinite(record.durationSeconds) ? record.durationSeconds : buffer.duration,
            sourceOffsetSeconds: Number.isFinite(record.sourceOffsetSeconds) ? record.sourceOffsetSeconds : 0,
            buffer,
            blob: record.blob,
            audioMetadata: record.audioMetadata
              ? normalizeAudioMetadata(record.audioMetadata)
              : detectAudioMetadata(buffer),
          });
        } catch {
          showToast(`Could not restore ${record.name}.`);
        }
      }
      if (sampleRecords.length) renderTracks();
      updateArrangementLength();
      renderArrangement();
      if (state.arrangementTracks.length) showToast("Your saved recordings are ready.");
      else if (sampleRecords.length) showToast("Your saved drum sounds are ready.");
    } catch {
      showToast("Saved recordings could not be restored.");
    }
  }

  function updateTrackGains() {
    if (!state.audioContext) return;
    const allTracks = [
      ...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
      ...state.effectTracks, state.masterTrack,
    ].filter(Boolean);
    const hasSolo = [...state.tracks, ...state.arrangementTracks].some((track) => track.solo);
    const hasMelSolo = state.melTracks.some((track) => track.solo);
    allTracks.forEach((track) => {
      if (!track.gainNode) return;
      const isBus = track.kind === "mixer-master" || track.kind === "mixer-effects";
      const isSilent = track.muted || (!isBus && (track.kind === "pattern" ? false : track.kind === "mel"
        ? hasMelSolo && !track.solo
        : hasSolo && !track.solo));
      track.gainNode.gain.setTargetAtTime(isSilent ? 0 : track.volume, state.audioContext.currentTime, 0.015);
    });
  }

  function triggerTrack(track, time, step, variant = track.variant, noteDuration = getStepDuration(), outputTrack = track, outputNode = null, pitchOffset = 0) {
    const context = state.audioContext;
    const pitchRatio = Math.pow(2, ((track.pitch || 0) + pitchOffset) / 12);
    const soundDurationScale = getSoundDurationScale(track);
    ensureTrackAudio(outputTrack);
    const output = outputNode || outputTrack.gainNode;
    if (track.sample) {
      const source = context.createBufferSource();
      source.buffer = track.sample.buffer;
      const envelope = context.createGain();
      const sampleDetune = track.sampleHumanized ? (Math.random() - 0.5) * 8 : 0;
      const samplePitchRatio = pitchRatio * Math.pow(2, sampleDetune / 1200);
      const sampleVelocity = track.sampleHumanized ? 0.92 + Math.random() * 0.14 : 1;
      const sampleDuration = source.buffer.duration * soundDurationScale;
      source.playbackRate.setValueAtTime(samplePitchRatio, time);
      envelope.gain.setValueAtTime(sampleVelocity, time);
      const duration = Math.max(0.005, track.sampleOneShot
        ? sampleDuration / samplePitchRatio
        : Math.min(sampleDuration / samplePitchRatio, noteDuration));
      const fade = Math.min(0.01, duration * 0.1);
      envelope.gain.setValueAtTime(sampleVelocity, time + Math.max(0, duration - fade));
      envelope.gain.linearRampToValueAtTime(0.0001, time + duration);
      source.connect(envelope);
      envelope.connect(output);
      source.start(time, 0, Math.min(sampleDuration, duration * samplePitchRatio));
      return;
    }
    noteDuration *= soundDurationScale;
    const durationScale = noteDuration / getStepDuration();
    switch (track.kind) {
      case "kick": playKick(context, output, time, step, variant, durationScale, pitchRatio); break;
      case "snare": playSnare(context, output, time, variant, durationScale, pitchRatio); break;
      case "clap": playClap(context, output, time, variant, durationScale, pitchRatio); break;
      case "hat": playHat(context, output, time, false, variant, durationScale, pitchRatio); break;
      case "openhat": playHat(context, output, time, true, variant, durationScale, pitchRatio); break;
      case "rim": playRim(context, output, time, variant, durationScale, pitchRatio); break;
      case "drumkit": playDrumKitNote(track, time, 36, noteDuration, 0.8, outputTrack, output); break;
      case "instrument": playInstrumentVoice(track, time, 60 + (track.pitch || 0), noteDuration, 0.8, outputTrack, output, { soundDurationScale }); break;
      default: break;
    }
  }

  function playPianoNote(track, time, midi, duration, velocity = 0.8, outputTrack = track, outputNode = null, noteOptions = {}) {
    if (!track) return;
    velocity *= Math.max(0, Math.min(1, noteOptions.volume ?? 1));
    const soundDurationScale = getSoundDurationScale(track);
    ensureSequencerTrackAudio(track);
    ensureTrackAudio(outputTrack);
    outputNode ||= outputTrack.gainNode;
    if (track.sample) {
      const context = state.audioContext;
      const source = context.createBufferSource();
      const envelope = context.createGain();
      const detune = Number.isFinite(noteOptions.detune) ? noteOptions.detune : 0;
      const rootMidi = Number.isFinite(track.sampleRootMidi) ? track.sampleRootMidi : 60;
      const sampleDetune = track.sampleHumanized ? (Math.random() - 0.5) * 8 : 0;
      const rate = Math.pow(2, (midi - rootMidi + (detune + sampleDetune) / 100) / 12);
      if (track.sampleHumanized) velocity *= 0.92 + Math.random() * 0.14;
      source.buffer = track.sample.buffer;
      source.playbackRate.setValueAtTime(rate, time);
      const bufferDuration = Math.min(source.buffer.duration * soundDurationScale, Math.max(0.01, duration) * rate);
      const outputDuration = bufferDuration / rate;
      const fade = Math.min(0.02, outputDuration * 0.12);
      const attack = Math.min(Math.max(0, Number.isFinite(noteOptions.attack) ? noteOptions.attack : 0), outputDuration * 0.7);
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.linearRampToValueAtTime(velocity, time + attack);
      envelope.gain.setValueAtTime(velocity, time + Math.max(attack, outputDuration - fade));
      envelope.gain.linearRampToValueAtTime(0.0001, time + outputDuration);
      source.connect(envelope);
      envelope.connect(outputNode);
      source.start(time, 0, bufferDuration);
      return;
    }
    if (track.kind === "instrument") {
      playInstrumentVoice(track, time, midi, duration * soundDurationScale, velocity, outputTrack, outputNode, {
        ...noteOptions,
        soundDurationScale,
      });
      return;
    }
    if (track.kind === "drumkit") {
      playDrumKitNote(track, time, midi, duration * soundDurationScale, velocity, outputTrack, outputNode, noteOptions.attack);
      return;
    }
    triggerTrack(track, time, 0, track.variant, duration, outputTrack, outputNode, midi - getDefaultStepMidi(track));
  }

  function playDansBpmSynthVoice(track, time, midi, duration, velocity, outputNode, noteOptions = {}) {
    const context = state.audioContext;
    const patch = track.patch || {};
    const parameter = (key, fallback) => Number.isFinite(patch[key]) ? patch[key] : fallback;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const durationScale = Number.isFinite(noteOptions.soundDurationScale)
      ? Math.max(0.01, Math.min(1, noteOptions.soundDurationScale))
      : 1;
    const attack = Math.min(
      Math.max(0, Number.isFinite(noteOptions.attack) ? noteOptions.attack : parameter("attack", 0.01)),
      Math.max(0.002, duration * 0.7),
    );
    const decay = Math.min(parameter("decay", 0.25), Math.max(0, duration - attack));
    const sustain = Math.max(0, Math.min(0.9, parameter("sustain", 0.55)));
    const release = Math.max(0.01, parameter("release", 0.25) * durationScale);
    const gateEnd = time + Math.max(0.02, duration);
    const outputLevel = Number.isFinite(patch.output) ? Math.max(0, Math.min(1, patch.output)) : 0.72;
    const peak = velocity * 0.48 * outputLevel;
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const cutoff = Math.max(80, Math.min(18000, Number(patch.cutoff) || 3200));
    const filterPeak = Math.min(18000, cutoff * Math.pow(2, parameter("filterEnvOctaves", 0)));
    const filterAttack = Math.min(Math.max(0, parameter("filterAttack", 0.02)), duration * 0.7);
    const filterDecay = Math.min(parameter("filterDecay", 0.35), Math.max(0, duration - filterAttack));
    const filterSustain = Math.max(0, Math.min(1, parameter("filterSustain", 0.25)));
    const filterSustainFrequency = cutoff * Math.pow(2, Math.log2(Math.max(1, filterPeak / cutoff)) * filterSustain);

    filter.type = "lowpass";
    filter.Q.setValueAtTime(Math.max(0.1, Math.min(18, Number(patch.resonance) || 0.2)) * 4, time);
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.linearRampToValueAtTime(filterPeak, time + filterAttack);
    filter.frequency.linearRampToValueAtTime(filterSustainFrequency, time + filterAttack + filterDecay);
    filter.frequency.setValueAtTime(filterSustainFrequency, gateEnd);
    filter.frequency.linearRampToValueAtTime(cutoff, gateEnd + release);

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(peak, time + attack);
    envelope.gain.linearRampToValueAtTime(peak * sustain, time + attack + decay);
    envelope.gain.setValueAtTime(peak * sustain, gateEnd);
    envelope.gain.linearRampToValueAtTime(0.0001, gateEnd + release);

    const oscillators = [
      { type: patch.wave || "sawtooth", rate: frequency, level: 0.62, detune: Number(noteOptions.detune) || 0 },
      { type: patch.osc2Wave || patch.wave || "sawtooth", rate: frequency, level: Math.max(0, Math.min(0.7, parameter("osc2Level", 0.28))), detune: parameter("osc2Detune", 0) + (Number(noteOptions.detune) || 0) },
      { type: "sine", rate: frequency / 2, level: Math.max(0, Math.min(0.7, parameter("subLevel", 0))), detune: 0 },
    ];
    const activeOscillators = oscillators.filter((oscillator) => oscillator.level > 0).map((settings) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = settings.type;
      oscillator.frequency.setValueAtTime(settings.rate, time);
      oscillator.detune.setValueAtTime(settings.detune, time);
      gain.gain.setValueAtTime(settings.level, time);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(time);
      oscillator.stop(gateEnd + release + 0.02);
      return oscillator;
    });

    envelope.connect(outputNode);
    filter.connect(envelope);

    const lfoRate = Math.max(0, Math.min(20, parameter("lfoRate", 0)));
    const lfoDepth = Math.max(0, Math.min(100, parameter("lfoDepth", 0)));
    if (activeOscillators.length && lfoRate > 0 && lfoDepth > 0) {
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.setValueAtTime(lfoRate, time);
      lfoGain.gain.setValueAtTime(lfoDepth, time);
      lfo.connect(lfoGain);
      activeOscillators.forEach((oscillator) => lfoGain.connect(oscillator.detune));
      lfo.start(time);
      lfo.stop(gateEnd + release + 0.02);
    }
  }

  function playInstrumentVoice(track, time, midi, duration, velocity, outputTrack = track, outputNode = outputTrack.gainNode, noteOptions = {}) {
    const context = state.audioContext;
    const patch = track.patch || {};
    if (patch.engine === "dansbpm") {
      playDansBpmSynthVoice(track, time, midi, duration, velocity, outputNode, noteOptions);
      return;
    }
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const noteAttack = Number.isFinite(noteOptions.attack) ? noteOptions.attack : Number(patch.attack) || 0.005;
    const attack = Math.min(Math.max(0, noteAttack), Math.max(0.002, duration * 0.7));
    const decay = Math.min(Number(patch.decay) || 0.1, Math.max(0.005, duration - attack));
    const soundDurationScale = Number.isFinite(noteOptions.soundDurationScale)
      ? Math.max(0.01, Math.min(1, noteOptions.soundDurationScale))
      : 1;
    const release = Math.max(0.01, (Number(patch.release) || 0.1) * soundDurationScale);
    const sustain = Math.max(0.04, Math.min(0.9, Number(patch.sustain) || 0.3));
    const gateEnd = time + Math.max(0.02, duration);
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    const peak = velocity * 0.42;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.max(100, Number(patch.cutoff) || 5000), time);
    filter.Q.value = 0.7;
    oscillator.type = patch.wave || "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.detune.setValueAtTime((Number(patch.detune) || 0) + (Number(noteOptions.detune) || 0), time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(peak, time + attack);
    envelope.gain.linearRampToValueAtTime(peak * sustain, time + attack + decay);
    envelope.gain.setValueAtTime(peak * sustain, gateEnd);
    envelope.gain.linearRampToValueAtTime(0.0001, gateEnd + release);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(outputNode);
    oscillator.start(time);
    oscillator.stop(gateEnd + release + 0.02);
    if (patch.harmonic) {
      const overtone = context.createOscillator();
      const overtoneGain = context.createGain();
      overtone.type = patch.wave || "sine";
      overtone.frequency.setValueAtTime(frequency * patch.harmonic, time);
      overtone.detune.setValueAtTime((Number(patch.detune) || 0) + (Number(noteOptions.detune) || 0), time);
      overtoneGain.gain.setValueAtTime(Math.max(0, Math.min(0.6, Number(patch.harmonicLevel) || 0.15)), time);
      overtone.connect(overtoneGain);
      overtoneGain.connect(filter);
      overtone.start(time);
      overtone.stop(gateEnd + release + 0.02);
    }
  }

  function playDrumKitNote(track, time, midi, duration, velocity, outputTrack = track, outputNode = outputTrack.gainNode, attack = 0) {
    const kit = track.patch?.kit || "909";
    const sounds = DRUM_KIT_PROFILES[kit] || DRUM_KIT_PROFILES["909"];
    const scale = Math.max(0.25, Math.min(4, duration / getStepDuration()));
    const context = state.audioContext;
    const noteGain = state.audioContext.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + Math.max(0, Number.isFinite(attack) ? attack : 0));
    noteGain.connect(outputNode);
    if (midi === 35 || midi === 36) playKick(context, noteGain, time, midi, sounds.kick, scale);
    else if (midi === 37) playRim(context, noteGain, time, sounds.rim, scale * 0.7);
    else if (midi === 38) playSnare(context, noteGain, time, sounds.snare, scale);
    else if (midi === 39) playClap(context, noteGain, time, sounds.clap, scale);
    else if (midi === 40) playSnare(context, noteGain, time, sounds.altSnare, scale);
    else if ([41, 43, 45, 47, 48, 50, 60, 61, 62, 63, 64, 65, 66, 67, 68, 75, 76, 77].includes(midi)) {
      playDrumKitTom(noteGain, time, midi, velocity, scale, kit);
    }
    else if (midi === 42) playHat(context, noteGain, time, false, sounds.hat, scale);
    else if (midi === 44) playHat(context, noteGain, time, false, sounds.pedalHat, scale * 0.65);
    else if (midi === 46) playHat(context, noteGain, time, true, sounds.openhat, scale);
    else if ([49, 52, 55, 57, 82, 83].includes(midi)) playHat(context, noteGain, time, true, sounds.cymbal, scale * ([52, 82].includes(midi) ? 1.8 : 2.4));
    else if ([51, 59].includes(midi)) playHat(context, noteGain, time, true, sounds.ride, scale * 1.8);
    else if (midi === 53 || midi === 56) playDrumKitBell(noteGain, time, midi === 53 ? 1120 : 680, velocity, scale);
    else if (midi === 54) playNoise(context, noteGain, time, 0.15 * scale, 4200, 0.2);
    else if (midi === 58) playNoise(context, noteGain, time, 0.23 * scale, 1100, 0.26);
    else if ([69, 70, 73, 74, 78, 79].includes(midi)) {
      const percussion = {
        69: [0.12, 3200, 0.18], 70: [0.12, 5600, 0.18], 73: [0.14, 2800, 0.24],
        74: [0.34, 1800, 0.3], 78: [0.11, 1500, 0.2], 79: [0.28, 900, 0.3],
      }[midi];
      playNoise(context, noteGain, time, percussion[0] * scale, percussion[1], percussion[2]);
    }
    else if (midi === 71 || midi === 72) playDrumKitTone(noteGain, time, midi === 71 ? 1450 : 980, midi === 71 ? 0.12 : 0.3, velocity);
    else if (midi === 80 || midi === 81) playDrumKitBell(noteGain, time, midi === 80 ? 1680 : 2200, velocity, scale);
    else playRim(context, noteGain, time, sounds.rim, scale);
  }

  function playDrumKitTom(output, time, midi, velocity, scale, kit) {
    const context = state.audioContext;
    const pitches = {
      41: [175, 90], 43: [195, 100], 45: [220, 112], 47: [255, 130], 48: [290, 145], 50: [340, 170],
      60: [540, 300], 61: [320, 180], 62: [410, 260], 63: [360, 140], 64: [230, 90],
      65: [600, 300], 66: [420, 220], 67: [780, 420], 68: [560, 310], 75: [1800, 950],
      76: [1200, 650], 77: [720, 380],
    };
    const [startPitch, endPitch] = pitches[midi] || pitches[45];
    const baseDuration = { 75: 0.11, 76: 0.13, 77: 0.16 }[midi] || (kit === "industrial" ? 0.28 : 0.34);
    const duration = Math.min(0.75, baseDuration * scale);
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = kit === "industrial" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(startPitch, time);
    oscillator.frequency.exponentialRampToValueAtTime(endPitch, time + duration * 0.72);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, velocity * 0.72), time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playDrumKitBell(output, time, frequency, velocity, scale) {
    const context = state.audioContext;
    const envelope = context.createGain();
    const duration = Math.min(0.55, 0.28 * scale);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, velocity * 0.24), time + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    [frequency, frequency * 1.48].forEach((partial, index) => {
      const oscillator = context.createOscillator();
      const partialGain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(partial, time);
      partialGain.gain.value = index ? 0.42 : 1;
      oscillator.connect(partialGain);
      partialGain.connect(envelope);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.02);
    });
    envelope.connect(output);
  }

  function playDrumKitTone(output, time, frequency, duration, velocity) {
    const context = state.audioContext;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, velocity * 0.2), time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playKick(context, output, time, step, variant, durationScale, pitchRatio = 1) {
    const osc = context.createOscillator();
    const envelope = context.createGain();
    const legacy = {
      classic: [148, 43, 0.36],
      deep: [92, 31, 0.56],
      punch: [182, 58, 0.23],
      sub: [72, 24, 0.7],
      industrial: [120, 27, 0.4],
    }[variant] || [148, 43, 0.36];
    const settings = DRUM_VARIANT_SETTINGS.kick?.[variant] || {
      start: legacy[0], end: legacy[1], duration: legacy[2], wave: "sine",
    };
    const duration = settings.duration * durationScale;
    const pitch = settings.start * (step % 8 === 0 ? 1 : 0.88) * pitchRatio;
    osc.type = settings.wave || "sine";
    osc.frequency.setValueAtTime(pitch, time);
    osc.frequency.exponentialRampToValueAtTime(settings.end * pitchRatio, time + duration * (settings.sweep || 0.38));
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    if (settings.clickPeak) {
      playNoise(context, output, time, 0.018 * durationScale, settings.clickCutoff, settings.clickPeak);
    }
  }

  function playNoise(context, output, time, duration, cutoff, peak = 0.35, resonance = 0.7) {
    const source = context.createBufferSource();
    source.buffer = state.noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.value = resonance;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(peak, time + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    source.start(time);
    source.stop(time + duration + 0.015);
  }

  function playSnare(context, output, time, variant, durationScale, pitchRatio = 1) {
    const legacy = {
      classic: [0.17, 1500, 0.36, 185, 0.1],
      tight: [0.1, 2300, 0.32, 235, 0.075],
      noise: [0.23, 1000, 0.48, 145, 0.14],
      body: [0.2, 1250, 0.34, 125, 0.18],
      metal: [0.17, 4100, 0.4, 330, 0.085],
    }[variant] || [0.17, 1500, 0.36, 185, 0.1];
    const preset = DRUM_VARIANT_SETTINGS.snare?.[variant];
    const settings = preset || {
      noiseDuration: legacy[0], cutoff: legacy[1], noisePeak: legacy[2],
      bodyHz: legacy[3], bodyDuration: legacy[4], bodyPeak: 0.2, resonance: 0.7, bodyWave: "triangle",
    };
    playNoise(context, output, time, settings.noiseDuration * durationScale, settings.cutoff * pitchRatio, settings.noisePeak, settings.resonance);
    const body = context.createOscillator();
    const envelope = context.createGain();
    body.type = settings.bodyWave || "triangle";
    body.frequency.setValueAtTime(settings.bodyHz * pitchRatio, time);
    envelope.gain.setValueAtTime(settings.bodyPeak, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + settings.bodyDuration * durationScale);
    body.connect(envelope);
    envelope.connect(output);
    body.start(time);
    body.stop(time + settings.bodyDuration * durationScale + 0.02);
  }

  function playClap(context, output, time, variant, durationScale, pitchRatio = 1) {
    const legacy = {
      classic: [[0, 0.018, 0.038], 0.17, 1100, 0.28],
      tight: [[0, 0.012], 0.1, 1500, 0.27],
      layered: [[0, 0.018, 0.038, 0.062], 0.22, 900, 0.34],
      room: [[0, 0.024, 0.052], 0.28, 720, 0.31],
    }[variant] || [[0, 0.018, 0.038], 0.17, 1100, 0.28];
    const preset = DRUM_VARIANT_SETTINGS.clap?.[variant];
    const settings = preset || { offsets: legacy[0], tail: legacy[1], cutoff: legacy[2], peak: legacy[3], resonance: 0.7 };
    settings.offsets.forEach((offset, index) => {
      const last = index === settings.offsets.length - 1;
      const peak = last ? settings.peak : (preset ? settings.peak * 0.7 : 0.2);
      playNoise(context, output, time + offset * durationScale, (last ? settings.tail : 0.045) * durationScale, settings.cutoff * pitchRatio, peak, settings.resonance);
    });
  }

  function playHat(context, output, time, open, variant, durationScale, pitchRatio = 1) {
    const legacy = open
      ? ({ classic: [0.34, 6500, 0.2], shimmer: [0.48, 9000, 0.22], dark: [0.3, 3800, 0.25], wash: [0.7, 5200, 0.3] }[variant] || [0.34, 6500, 0.2])
      : ({ classic: [0.055, 6500, 0.16], soft: [0.07, 4300, 0.12], bright: [0.045, 10000, 0.2], vinyl: [0.09, 3200, 0.18] }[variant] || [0.055, 6500, 0.16]);
    const preset = DRUM_VARIANT_SETTINGS[open ? "openhat" : "hat"]?.[variant];
    const settings = preset || { duration: legacy[0], cutoff: legacy[1], peak: legacy[2], resonance: 0.55 };
    playNoise(context, output, time, settings.duration * durationScale, settings.cutoff * pitchRatio, settings.peak, settings.resonance);
  }

  function playRim(context, output, time, variant, durationScale, pitchRatio = 1) {
    const osc = context.createOscillator();
    const envelope = context.createGain();
    osc.type = "triangle";
    const pitch = { classic: [880, 420], low: [190, 110], high: [1450, 720], wood: [560, 250] }[variant] || [880, 420];
    osc.frequency.setValueAtTime(pitch[0] * pitchRatio, time);
    osc.frequency.exponentialRampToValueAtTime(pitch[1] * pitchRatio, time + 0.045 * durationScale);
    envelope.gain.setValueAtTime(0.32, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.075 * durationScale);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    osc.stop(time + 0.09 * durationScale);
  }

  function triggerClick(time, downbeat) {
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    osc.frequency.setValueAtTime(downbeat ? 1350 : 950, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
    osc.connect(gain);
    gain.connect(state.masterTrack.gainNode || state.masterGain);
    osc.start(time);
    osc.stop(time + 0.035);
  }

  async function startPlayback(mode = "arrangement") {
    if (state.isPlaying || state.isExporting) return;
    try {
      await ensureAudio();
      await loadLibrarySamplesForPlayback(mode);
      state.isPlaying = true;
      state.playbackMode = mode;
      const arrangementPlayback = mode === "arrangement";
      const startBar = arrangementPlayback ? Math.min(state.arrangementCursor, state.arrangementBars - 1) : 0;
      state.playbackStartBar = startBar;
      state.playbackStartTime = state.audioContext.currentTime + 0.04;
      if (mode === "piano-roll") {
        const mel = getMel();
        const loopTicks = Math.max(1, (mel ? getMelLengthBars(mel) : 1) * PIANO_TICKS_PER_BAR);
        const cursorTick = state.pianoCursorTick % loopTicks;
        state.playbackStartTime -= cursorTick / PIANO_TICKS_PER_BAR * (240 / state.bpm);
      }
      state.playbackEndTime = arrangementPlayback
        ? state.playbackStartTime + (state.arrangementBars - startBar) * (240 / state.bpm)
        : Infinity;
      state.stepIndex = 0;
      state.scheduledPianoNotes.clear();
      state.scheduledArrangementSteps.clear();
      state.nextStepTime = state.audioContext.currentTime + 0.04;
      updateTrackGains();
      if (arrangementPlayback) scheduleArrangementClips(state.playbackStartTime, startBar);
      scheduler();
      state.schedulerId = window.setInterval(scheduler, 25);
      syncMixerMeters();
      playButton.classList.toggle("is-playing", arrangementPlayback);
      playButton.setAttribute("aria-label", arrangementPlayback ? "Pause Track View" : "Play Track View");
      $("#now-playing").classList.add("is-live");
      $("#now-playing").innerHTML = `<span class="live-dot"></span>${arrangementPlayback ? "TRACK VIEW PLAYING" : "KEY RECORDING"}`;
    } catch (error) {
      showToast(error.message || "Audio could not start in this browser.");
    }
  }

  function scheduleArrangementClips(startTime, startBar) {
    const secondsPerBar = 240 / state.bpm;
    state.arrangementTracks.forEach((track) => {
      ensureArrangementTrackAudio(track);
      track.clips.forEach((clip) => {
        const elapsed = Math.max(0, (startBar - clip.startBar) * secondsPerBar);
        const offset = (clip.sourceOffsetSeconds || 0) + elapsed;
        const clipDuration = clip.durationSeconds ?? clip.buffer.duration;
        const remaining = clipDuration - elapsed;
        if (offset >= clip.buffer.duration || remaining <= 0) return;
        const when = startTime + Math.max(0, clip.startBar - startBar) * secondsPerBar;
        const source = state.audioContext.createBufferSource();
        source.buffer = clip.buffer;
        source.connect(track.gainNode);
        source.onended = () => state.arrangementSources.delete(source);
        source.start(when, offset, Math.min(clip.buffer.duration - offset, remaining));
        state.arrangementSources.add(source);
      });
    });
    const hasMelSolo = state.melTracks.some((track) => track.solo);
    const hasInstrumentSolo = state.tracks.some((track) => track.solo);
    state.melTracks.forEach((melTrack) => {
      const instrument = getPianoTrack(melTrack.instrumentId);
      if (!instrument || melTrack.muted || (hasMelSolo && !melTrack.solo) ||
        instrument.muted || (hasInstrumentSolo && !instrument.solo)) return;
      melTrack.clips.forEach((clip) => {
        const mel = getMel(clip.melId);
        if (!mel) return;
        const sourceOffset = clip.sourceOffsetBars || 0;
        const sourceEnd = sourceOffset + getArrangementClipDuration("mel", clip);
        const melEnd = getMelLengthBars(mel);
        mel.notes.forEach((note) => {
          const noteStartSource = note.startTick / PIANO_TICKS_PER_BAR;
          const noteEndSource = noteStartSource + note.durationTicks / PIANO_TICKS_PER_BAR;
          const audibleSourceStart = Math.max(sourceOffset, noteStartSource);
          const audibleSourceEnd = Math.min(sourceEnd, melEnd, noteEndSource);
          const key = `${melTrack.id}:${clip.id}:${note.id}`;
          if (state.scheduledPianoNotes.has(key)) return;
          if (audibleSourceEnd <= audibleSourceStart) return;
          const noteStartBar = clip.startBar + audibleSourceStart - sourceOffset;
          const noteEndBar = clip.startBar + audibleSourceEnd - sourceOffset;
          if (noteEndBar <= startBar) return;
          const audibleStartBar = Math.max(startBar, noteStartBar);
          const when = startTime + (audibleStartBar - startBar) * secondsPerBar;
          const duration = Math.max(0, noteEndBar - audibleStartBar) * secondsPerBar;
          if (duration > 0) {
            playPianoNote(instrument, when, note.midi, duration, note.velocity ?? 0.8, melTrack, null, note);
            state.scheduledPianoNotes.add(key);
          }
        });
      });
    });
  }

  function stopPlayback() {
    const stoppedPlaybackMode = state.playbackMode;
    if (stoppedPlaybackMode === "piano-roll" && state.isPlaying) updatePianoCursorFromTime(state.playbackStartTime);
    if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
    if (state.schedulerId !== null) window.clearInterval(state.schedulerId);
    state.schedulerId = null;
    const stoppedRecording = state.keyboardRecording;
    state.keyboardRecording = null;
    if (stoppedRecording?.mode === "piano-roll") stopRecordingMetronome();
    state.liveRecordedHits.clear();
    state.scheduledArrangementSteps.clear();
    updateKeyboardRecordButtons();
    if (stoppedRecording?.mode === "sequencer") renderTracks();
    state.isPlaying = false;
    state.playbackMode = "arrangement";
    syncMixerMeters();
    state.stepIndex = 0;
    state.stepTimers.forEach((timerId) => window.clearTimeout(timerId));
    state.stepTimers.clear();
    state.arrangementSources.forEach((source) => {
      try { source.stop(); } catch { /* The source may have ended between scheduler ticks. */ }
    });
    state.arrangementSources.clear();
    if (stoppedPlaybackMode === "arrangement" && state.view === "arrangement") state.arrangementCursor = 0;
    if (state.audioContext) {
      const now = state.audioContext.currentTime;
      state.tracks.forEach((track) => {
        if (track.gainNode) {
          track.gainNode.gain.cancelScheduledValues(now);
          track.gainNode.gain.setTargetAtTime(track.muted || (state.tracks.some((item) => item.solo) && !track.solo) ? 0 : track.volume, now, 0.01);
        }
      });
    }
    playButton.classList.remove("is-playing");
    playButton.setAttribute("aria-label", "Play");
    $("#now-playing").classList.remove("is-live");
    $("#now-playing").innerHTML = '<span class="live-dot"></span>READY TO PLAY';
    setPlayhead(-1);
    updateArrangementCursorMarker();
  }

  async function loadSample(file) {
    const track = state.tracks.find((item) => item.id === state.sampleTrackId);
    if (!track || !file) return;
    if (!isAudioFile(file)) {
      showToast("Choose an audio file such as WAV, MP3, or OGG.");
      return;
    }
    let sampleLoaded = false;
    try {
      await ensureAudio();
      const bytes = await file.arrayBuffer();
      const buffer = await state.audioContext.decodeAudioData(bytes);
      const previousBuffer = track.sample?.buffer;
      track.sample = { name: file.name, buffer };
      track.audioMetadata = detectAudioMetadata(buffer);
      if (!track.sourceId) {
        state.tracks.filter((item) => item.sourceId === track.id && item.sample?.buffer === previousBuffer).forEach((layer) => {
          layer.sample = { ...track.sample };
          ensureSequencerTrackAudio(layer);
        });
      }
      sampleLoaded = true;
      renderTracks();
      saveState();
      await persistDrumSample(track, file);
      showToast(`${file.name} loaded on ${track.name}`);
    } catch (error) {
      if (sampleLoaded) showToast(`${file.name} loaded, but could not be saved: ${error.message || "browser storage is unavailable"}`);
      else showToast(`Could not load that audio file: ${error.message || "unsupported format"}`);
    } finally {
      sampleInput.value = "";
      state.sampleTrackId = null;
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function getProjectStorageKey(projectId) {
    return `${PROJECT_STORAGE_PREFIX}${projectId}`;
  }

  function getCurrentUserProjects() {
    return state.projects.filter((project) => project.ownerId === state.currentUser);
  }

  function getCurrentUserName() {
    return state.users.find((user) => user.id === state.currentUser)?.name || "";
  }

  function saveUsers() {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(state.users));
  }

  function renderLoginUsers() {
    const options = $("#login-options");
    options.replaceChildren();
    state.users.forEach((user) => {
      const button = document.createElement("button");
      button.className = "login-option";
      button.type = "button";
      button.dataset.userId = user.id;
      const avatar = document.createElement("span");
      avatar.className = `login-avatar${user.id === "guest" ? " guest-avatar" : ""}`;
      avatar.textContent = user.name.trim().charAt(0).toUpperCase();
      const text = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = user.name;
      const detail = document.createElement("small");
      detail.textContent = `Open ${user.name}'s projects`;
      text.append(name, detail);
      const arrow = document.createElement("span");
      arrow.className = "login-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      button.append(avatar, text, arrow);
      options.append(button);
    });
  }

  function initializeUsers() {
    let users = DEFAULT_USERS.map((user) => ({ ...user }));
    try {
      const savedUsers = JSON.parse(window.localStorage.getItem(USERS_KEY) || "null");
      if (Array.isArray(savedUsers)) {
        users = savedUsers.filter((user) =>
          typeof user?.id === "string" && user.id && typeof user.name === "string" && user.name.trim())
          .map((user) => ({ id: user.id, name: user.name.trim().slice(0, 32) }));
      }
      DEFAULT_USERS.forEach((defaultUser) => {
        if (!users.some((user) => user.id === defaultUser.id)) users.push(defaultUser);
      });
      state.users = users;
      saveUsers();
    } catch (error) {
      if (!state.users.length) state.users = users;
      showToast(`Could not load or save profiles: ${error.message || "browser storage is unavailable"}`);
    }
    renderLoginUsers();
  }

  function getSessionUser() {
    try {
      const userId = window.sessionStorage.getItem(ACTIVE_USER_KEY);
      return state.users.some((user) => user.id === userId) ? userId : null;
    } catch {
      return null;
    }
  }

  function selectUser(userId) {
    if (!state.users.some((user) => user.id === userId)) return;
    try {
      window.sessionStorage.setItem(ACTIVE_USER_KEY, userId);
      window.sessionStorage.setItem(OPEN_PROJECTS_KEY, "true");
      window.location.reload();
    } catch (error) {
      try { window.sessionStorage.removeItem(ACTIVE_USER_KEY); } catch { /* Session storage may be unavailable. */ }
      $("#login-error").textContent = `Could not start this profile: ${error.message || "session storage is unavailable"}`;
    }
  }

  function createUser() {
    const input = $("#new-profile-name");
    const name = input.value.trim().slice(0, 32);
    const error = $("#login-error");
    error.textContent = "";
    if (!name) {
      error.textContent = "Enter a name for your profile.";
      input.focus();
      return;
    }
    if (state.users.some((user) => user.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      error.textContent = "A profile with that name already exists in this browser.";
      input.focus();
      return;
    }
    const user = { id: makeId(), name };
    state.users.push(user);
    try {
      saveUsers();
      renderLoginUsers();
      selectUser(user.id);
    } catch (saveError) {
      state.users = state.users.filter((item) => item.id !== user.id);
      error.textContent = `Could not save this profile: ${saveError.message || "browser storage is unavailable"}`;
    }
  }

  function writeProjectCatalog() {
    const activeProjectIds = { ...state.activeProjectIds };
    if (state.currentUser && state.projectId) activeProjectIds[state.currentUser] = state.projectId;
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify({
      activeProjectId: state.projectId,
      activeProjectIds,
      projects: state.projects,
    }));
    state.activeProjectIds = activeProjectIds;
  }

  function updateProjectNameLabel() {
    $("#project-name").firstChild.textContent = `${state.projectName} `;
  }

  function initializeProjects() {
    try {
      const savedCatalog = JSON.parse(window.localStorage.getItem(PROJECTS_KEY) || "null");
      let projects = Array.isArray(savedCatalog?.projects)
        ? savedCatalog.projects.filter((project) => typeof project?.id === "string" && typeof project.name === "string")
        : [];
      projects = projects.map((project) => ({
        ...project,
        ownerId: state.users.some((user) => user.id === project.ownerId) ? project.ownerId : "taylor",
      }));
      state.activeProjectIds = savedCatalog?.activeProjectIds && typeof savedCatalog.activeProjectIds === "object"
        ? { ...savedCatalog.activeProjectIds }
        : {};

      if (!projects.length) {
        const name = window.localStorage.getItem(`${STORAGE_KEY}-name`)?.trim() || "Untitled session";
        const oldSnapshot = window.localStorage.getItem(STORAGE_KEY);
        if (oldSnapshot || name !== "Untitled session") {
          projects = [{ id: "default", name, ownerId: "taylor", updatedAt: Date.now() }];
          if (oldSnapshot) window.localStorage.setItem(getProjectStorageKey("default"), oldSnapshot);
        }
      }

      state.projects = projects;
      if (state.currentUser) {
        let userProjects = getCurrentUserProjects();
        if (!userProjects.length) {
          const project = {
            id: makeId(),
            name: "Untitled session",
            ownerId: state.currentUser,
            updatedAt: Date.now(),
          };
          state.projects.unshift(project);
          userProjects = [project];
        }
        const preferredProjectId = state.activeProjectIds[state.currentUser] ||
          (savedCatalog?.activeProjectId && userProjects.some((project) => project.id === savedCatalog.activeProjectId)
            ? savedCatalog.activeProjectId
            : null);
        state.projectId = userProjects.some((project) => project.id === preferredProjectId)
          ? preferredProjectId
          : userProjects[0].id;
        state.activeProjectIds[state.currentUser] = state.projectId;
        writeProjectCatalog();
      } else {
        state.projectId = "";
      }
      const activeProject = state.projects.find((project) => project.id === state.projectId);
      state.projectName = activeProject?.name || "Untitled session";
      updateProjectNameLabel();
    } catch (error) {
      state.projects = [{
        id: "default",
        name: "Untitled session",
        ownerId: state.currentUser || "taylor",
        updatedAt: 0,
      }];
      state.projectId = state.currentUser ? "default" : "";
      state.projectName = "Untitled session";
      updateProjectNameLabel();
      showToast(`Project storage is unavailable: ${error.message || "could not load projects"}`);
    }
  }

  function createStateSnapshot() {
    syncStepPianoEdit();
    captureCurrentPattern();
    captureCurrentMel();
    const stepEditContext = state.stepPianoEditContext;
    const savedMel = stepEditContext ? getMel() : null;
    return {
      bpm: state.bpm,
      swing: state.swing,
      steps: state.steps,
      selectedPreset: state.selectedPreset,
      selectedPatternId: state.selectedPatternId,
      patterns: state.patterns.map((pattern) => {
        const trackIds = [...getPatternTrackIds(pattern)];
        return {
          id: pattern.id,
          name: pattern.name,
          steps: pattern.steps,
          trackIds,
          cells: Object.fromEntries(trackIds.flatMap((trackId) => {
            const cells = pattern.cells[trackId];
            return Array.isArray(cells) ? [[trackId, [...cells]]] : [];
          })),
          variants: Object.fromEntries(trackIds
            .filter((trackId) => pattern.variants?.[trackId])
            .map((trackId) => [trackId, pattern.variants[trackId]])),
          ...(pattern.stepPianoNotes ? {
            stepPianoNotes: Object.fromEntries(Object.entries(pattern.stepPianoNotes).map(([trackId, notes]) =>
              [trackId, notes.map((note) => ({ ...note }))])),
          } : {}),
          gridResolution: getPatternGridResolution(pattern),
          color: pattern.color,
          volume: pattern.volume,
          effects: makeDefaultEffects(pattern.effects),
          effectSettings: makeDefaultEffectSettings(pattern.effectSettings),
          effectChain: ensureTrackMixerState(pattern),
        };
      }),
      tracks: state.tracks.map((track) => ({
        id: track.id,
        sourceId: track.sourceId || null,
        name: track.name,
        kind: track.kind,
        color: track.color,
        cells: track.libraryOnly ? undefined : track.cells,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        variant: track.variant,
        pitch: track.pitch || 0,
        swing: Number.isFinite(track.swing) ? track.swing : null,
        audioMetadata: normalizeAudioMetadata(track.audioMetadata),
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
        sampleName: track.sample?.name || null,
      })),
      arrangementTracks: state.arrangementTracks.map((track) => ({
        id: track.id,
        name: track.name,
        insertAfterTrackId: track.insertAfterTrackId || null,
        color: track.color,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
      })),
      mels: state.mels.map((mel) => ({
        id: mel.id,
        name: mel.name,
        instrumentId: mel.instrumentId,
        bars: mel.bars,
        notes: mel.notes.map((note) => ({ ...note })),
      })),
      selectedMelId: state.selectedMelId,
      melTracks: state.melTracks.map((track) => ({
        id: track.id,
        name: track.name,
        instrumentId: track.instrumentId,
        color: track.color,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
        clips: track.clips.map((clip) => ({ ...clip })),
      })),
      masterTrack: {
        volume: state.masterTrack.volume,
        effects: makeDefaultEffects(state.masterTrack.effects),
        effectSettings: makeDefaultEffectSettings(state.masterTrack.effectSettings),
        effectChain: ensureTrackMixerState(state.masterTrack),
      },
      effectTracks: state.effectTracks.map((track) => ({
        id: track.id,
        name: track.name,
        volume: track.volume,
        routedTrackIds: [...track.routedTrackIds],
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
      })),
      patternClips: state.patternClips.map((clip) => ({ ...clip, repeatCount: clip.repeatCount || 1 })),
      pianoNotes: (savedMel?.notes || state.pianoNotes).map((note) => ({ ...note })),
      pianoStartBar: state.pianoStartBar,
      pianoCursorTick: stepEditContext?.previousCursorTick ?? state.pianoCursorTick,
      pianoBars: savedMel?.bars || state.pianoBars,
      pianoScale: state.pianoScale,
      pianoSnap: state.pianoSnap,
      pianoSnapEnabled: state.pianoSnapEnabled,
      pianoNoteLength: state.pianoNoteLength,
      soundDurationEdits: { ...state.soundDurationEdits },
      selectedPianoTrackId: savedMel?.instrumentId || state.selectedPianoTrackId,
      arrangementBars: state.arrangementBars,
      arrangementScale: state.arrangementScale,
      arrangementCursor: state.arrangementCursor,
      arrangementSnap: state.arrangementSnap,
      workspaceRatio: state.workspaceRatio,
      sequencerScale: state.sequencerScale,
      workspaceHidden: state.workspaceHidden,
      trackViewHidden: state.trackViewHidden,
      view: stepEditContext?.previousView || state.view,
    };
  }

  function persistStateSnapshot(snapshot, projectId = state.projectId) {
    if (!state.currentUser) {
      saveState.lastError = "No active profile is selected.";
      return false;
    }
    if (!state.projects.some((project) => project.id === projectId && project.ownerId === state.currentUser)) {
      saveState.lastError = "The active project is not available for this profile.";
      return false;
    }
    try {
      window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
    } catch (error) {
      saveState.lastError = error?.name === "QuotaExceededError"
        ? "browser storage is full."
        : error?.message || "browser storage is unavailable.";
      $("#save-state").textContent = "Session-only changes";
      $(".save-dot").style.background = "#d3a34b";
      return false;
    }
    saveState.lastError = "";
    const project = state.projects.find((item) => item.id === projectId);
    if (project) {
      project.updatedAt = Date.now();
      try {
        writeProjectCatalog();
      } catch {
        showToast("Project saved, but its saved-project list could not be updated.");
      }
    }
    $("#save-state").textContent = "All changes saved";
    $(".save-dot").style.background = "#7f9d43";
    return true;
  }

  function flushSaveState() {
    window.clearTimeout(saveState.timeout);
    saveState.timeout = null;
    if (!state.currentUser) {
      saveState.lastError = "No active profile is selected.";
      return false;
    }
    return persistStateSnapshot(createStateSnapshot(), state.projectId);
  }

  function saveState() {
    if (!state.currentUser) return;
    const saveDot = $(".save-dot");
    $("#save-state").textContent = "Saving…";
    saveDot.style.background = "#c8a95a";
    const snapshot = createStateSnapshot();
    const projectId = state.projectId;
    window.clearTimeout(saveState.timeout);
    saveState.timeout = window.setTimeout(() => {
      persistStateSnapshot(snapshot, projectId);
    }, 250);
  }

  function renderProjectList() {
    const list = $("#project-list");
    list.replaceChildren();
    getCurrentUserProjects().forEach((project) => {
      const button = document.createElement("button");
      button.className = `project-list-item${project.id === state.projectId ? " is-current" : ""}`;
      button.type = "button";
      button.disabled = project.id === state.projectId;
      const name = document.createElement("span");
      name.className = "project-list-name";
      name.textContent = project.name;
      const detail = document.createElement("span");
      detail.className = "project-list-detail";
      detail.textContent = project.id === state.projectId
        ? "CURRENT PROJECT"
        : project.updatedAt ? `SAVED ${new Date(project.updatedAt).toLocaleDateString()}` : "NOT SAVED YET";
      button.append(name, detail);
      button.addEventListener("click", () => switchProject(project.id));
      list.append(button);
    });
  }

  function switchProject(projectId) {
    if (projectId === state.projectId || !state.projects.some((project) =>
      project.id === projectId && project.ownerId === state.currentUser)) return;
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before switching projects.");
      return;
    }
    if (!flushSaveState()) {
      showToast("Could not save this project; switching was cancelled.");
      return;
    }
    if (state.isPlaying) stopPlayback();
    stopAllWorkspacePlayers();
    const previousProjectId = state.projectId;
    state.projectId = projectId;
    try {
      writeProjectCatalog();
      window.location.reload();
    } catch (error) {
      state.projectId = previousProjectId;
      showToast(`Could not switch projects: ${error.message || "storage is unavailable"}`);
    }
  }

  function createProject() {
    if (!state.currentUser) return;
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before creating a project.");
      return;
    }
    if (!flushSaveState()) {
      showToast("Could not save this project; a new project was not created.");
      return;
    }
    stopAllWorkspacePlayers();
    const project = {
      id: makeId(),
      name: `New Project ${getCurrentUserProjects().length + 1}`,
      ownerId: state.currentUser,
      updatedAt: 0,
    };
    const previousProjectId = state.projectId;
    state.projects.unshift(project);
    state.projectId = project.id;
    try {
      writeProjectCatalog();
      window.location.reload();
    } catch (error) {
      state.projects = state.projects.filter((item) => item.id !== project.id);
      state.projectId = previousProjectId;
      showToast(`Could not create project: ${error.message || "storage is unavailable"}`);
    }
  }

  function renameProject() {
    const name = window.prompt("Rename project", state.projectName);
    const trimmed = name?.trim();
    if (!trimmed) return;
    const project = state.projects.find((item) => item.id === state.projectId);
    if (!project) return;
    const previousName = project.name;
    project.name = trimmed;
    state.projectName = trimmed;
    updateProjectNameLabel();
    try {
      writeProjectCatalog();
      renderProjectList();
    } catch (error) {
      project.name = previousName;
      state.projectName = previousName;
      updateProjectNameLabel();
      showToast(`Could not rename project: ${error.message || "storage is unavailable"}`);
    }
  }

  function saveProjectNow() {
    if (flushSaveState()) {
      renderProjectList();
      showToast(`${state.projectName} saved`);
    } else {
      showToast(`Could not save this project: ${saveState.lastError || "storage is unavailable."}`);
    }
  }

  function switchUser() {
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before switching users.");
      return;
    }
    if (!flushSaveState()) {
      showToast("Could not save this project; switching users was cancelled.");
      return;
    }
    if (state.isPlaying) stopPlayback();
    stopAllWorkspacePlayers();
    try {
      window.sessionStorage.removeItem(ACTIVE_USER_KEY);
      window.sessionStorage.removeItem(OPEN_PROJECTS_KEY);
      window.location.reload();
    } catch (error) {
      showToast(`Could not switch users: ${error.message || "session storage is unavailable"}`);
    }
  }

  function restoreState() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(getProjectStorageKey(state.projectId)) || "null");
      if (!saved || typeof saved !== "object") return;
      if (saved.masterTrack && typeof saved.masterTrack === "object") {
        state.masterTrack = makeMixerBusTrack("mixer-master", saved.masterTrack);
      }
      if (Array.isArray(saved.effectTracks)) {
        const ids = new Set([MASTER_MIXER_TRACK_ID, ...state.tracks.map((track) => track.id)]);
        state.effectTracks = saved.effectTracks
          .filter((track) => {
            if (typeof track?.id !== "string" || ids.has(track.id)) return false;
            ids.add(track.id);
            return true;
          })
          .map((track) => makeMixerBusTrack("mixer-effects", track));
      }
      if (Number.isFinite(saved.bpm)) state.bpm = Math.max(60, Math.min(180, Math.round(saved.bpm)));
      if (Number.isFinite(saved.swing)) state.swing = Math.max(0, Math.min(45, Math.round(saved.swing)));
      if (Number.isFinite(saved.steps)) state.steps = normalizePatternSteps(saved.steps);
      if (Number.isFinite(saved.arrangementScale)) state.arrangementScale = Math.max(0.5, Math.min(4, saved.arrangementScale));
      if (Number.isFinite(saved.pianoScale)) state.pianoScale = Math.max(0.5, Math.min(4, saved.pianoScale));
      if (Number.isFinite(saved.sequencerScale)) state.sequencerScale = Math.max(0.5, Math.min(4, saved.sequencerScale));
      if (Number.isFinite(saved.arrangementBars)) state.arrangementBars = Math.max(32, Math.min(MAX_ARRANGEMENT_BARS, Math.round(saved.arrangementBars)));
      if (Number.isFinite(saved.arrangementCursor)) state.arrangementCursor = Math.max(0, Math.min(state.arrangementBars - 0.001, saved.arrangementCursor));
      if (typeof saved.arrangementSnap === "boolean") state.arrangementSnap = saved.arrangementSnap;
      if (Number.isFinite(saved.workspaceRatio)) state.workspaceRatio = Math.max(20, Math.min(80, Math.round(saved.workspaceRatio)));
      if (typeof saved.workspaceHidden === "boolean") state.workspaceHidden = saved.workspaceHidden;
      if (typeof saved.trackViewHidden === "boolean") state.trackViewHidden = saved.trackViewHidden;
      if (state.workspaceHidden && state.trackViewHidden) state.trackViewHidden = false;
      if (["sequencer", "arrangement", "piano-roll", "mixer", "dj"].includes(saved.view)) state.view = saved.view;
      if (saved.selectedPreset === null) state.selectedPreset = null;
      else if (PRESETS.some((preset) => preset.id === saved.selectedPreset)) state.selectedPreset = saved.selectedPreset;
      if (Array.isArray(saved.tracks)) {
        saved.tracks.forEach((savedTrack) => {
          let track = state.tracks.find((item) => item.id === savedTrack.id);
          if (!track && typeof savedTrack.sourceId === "string") {
            const source = state.tracks.find((item) => item.id === savedTrack.sourceId);
            if (source) {
              track = makePatternInstrumentLayer(source, {
                id: savedTrack.id,
                name: savedTrack.name,
                cells: savedTrack.cells,
                volume: savedTrack.volume,
                muted: savedTrack.muted,
                solo: savedTrack.solo,
                pitch: savedTrack.pitch,
                swing: savedTrack.swing,
                variant: savedTrack.variant,
                effects: savedTrack.effects,
              });
              state.tracks.push(track);
            }
          }
          if (!track && !savedTrack.sourceId && savedTrack.kind === "sample" && typeof savedTrack.id === "string" && typeof savedTrack.name === "string") {
            track = makeDrumSampleTrack({
              id: savedTrack.id,
              name: savedTrack.name,
              color: savedTrack.color,
              volume: savedTrack.volume,
              muted: savedTrack.muted,
              solo: savedTrack.solo,
              pitch: savedTrack.pitch,
              swing: savedTrack.swing,
              cells: savedTrack.cells,
              effects: savedTrack.effects,
              audioMetadata: savedTrack.audioMetadata,
            });
            state.tracks.push(track);
          }
          if (!track) return;
          if (Array.isArray(savedTrack.cells)) {
            track.cells = Array.from({ length: STEP_COUNT }, (_, index) => savedTrack.cells[index] === true);
          }
          if (Number.isFinite(savedTrack.volume)) track.volume = Math.max(0, Math.min(1, savedTrack.volume));
          if (Number.isFinite(savedTrack.pitch)) track.pitch = Math.max(-12, Math.min(12, savedTrack.pitch));
          if (Number.isFinite(savedTrack.swing)) track.swing = Math.max(0, Math.min(45, savedTrack.swing));
          if (savedTrack.audioMetadata) track.audioMetadata = normalizeAudioMetadata(savedTrack.audioMetadata);
          track.effects = makeDefaultEffects(savedTrack.effects);
          track.effectSettings = makeDefaultEffectSettings(savedTrack.effectSettings);
          track.effectChain = Array.isArray(savedTrack.effectChain) ? savedTrack.effectChain : undefined;
          if (SOUND_VARIANTS[track.kind]?.some((sound) => sound.id === savedTrack.variant)) track.variant = savedTrack.variant;
          track.muted = savedTrack.muted === true;
          track.solo = savedTrack.solo === true;
        });
      }
      if (Array.isArray(saved.arrangementTracks)) {
        state.arrangementTracks = saved.arrangementTracks
          .filter((track) => typeof track?.id === "string" && typeof track.name === "string")
          .map((track) => ({
            id: track.id,
            name: track.name,
            insertAfterTrackId: typeof track.insertAfterTrackId === "string" ? track.insertAfterTrackId : null,
            color: isPatternColor(track.color) ? track.color : TRACK_COLORS[0],
            clips: [],
            volume: Number.isFinite(track.volume) ? Math.max(0, Math.min(1, track.volume)) : 0.8,
            muted: track.muted === true,
            solo: track.solo === true,
            gainNode: null,
            effects: makeDefaultEffects(track.effects),
            effectSettings: makeDefaultEffectSettings(track.effectSettings),
            effectChain: Array.isArray(track.effectChain) ? track.effectChain : undefined,
          }));
      }
      if (Array.isArray(saved.patterns)) {
        const restoredPatterns = saved.patterns
          .filter((pattern) => typeof pattern?.id === "string" && typeof pattern.name === "string")
          .map((pattern, index) => {
            const cells = {};
            const variants = {};
            const gridResolution = getPatternGridResolution(pattern);
            const isLegacyGrid = !GRID_RESOLUTIONS.includes(pattern.gridResolution);
            const patternSteps = normalizePatternSteps(pattern.steps);
            const bars = patternSteps / 16;
            state.tracks.forEach((track) => {
              const storedCells = Array.from({ length: STEP_COUNT }, (_, cellIndex) => pattern.cells?.[track.id]?.[cellIndex] === true);
              cells[track.id] = isLegacyGrid
                ? remapGridCells(storedCells, bars, 16, GRID_STEPS_PER_BAR[gridResolution])
                : storedCells;
              const variant = pattern.variants?.[track.id];
              if (SOUND_VARIANTS[track.kind]?.some((sound) => sound.id === variant)) variants[track.id] = variant;
            });
            return {
              id: pattern.id,
              name: pattern.name,
              kind: "pattern",
              color: isPatternColor(pattern.color) ? pattern.color : getPatternColor(index),
              steps: patternSteps,
              trackIds: Array.isArray(pattern.trackIds)
                ? [...new Set(pattern.trackIds.filter((trackId) => state.tracks.some((track) => track.id === trackId)))]
                : state.tracks.filter((track) => !track.libraryOnly).map((track) => track.id),
              cells,
              variants,
              ...(pattern.stepPianoNotes && typeof pattern.stepPianoNotes === "object" ? {
                stepPianoNotes: Object.fromEntries(Object.entries(pattern.stepPianoNotes)
                  .filter(([trackId, notes]) => state.tracks.some((track) => track.id === trackId) && Array.isArray(notes))
                  .map(([trackId, notes]) => [trackId, notes
                    .filter((note) => note && typeof note.id === "string" && Number.isFinite(note.startTick) &&
                      Number.isFinite(note.durationTicks) && Number.isInteger(note.midi))
                    .slice(0, 4096)
                    .map((note) => {
                      const startTick = Math.max(0, Math.min(patternSteps * 2 - 0.5, note.startTick));
                      return {
                        id: note.id,
                        startTick,
                        durationTicks: Math.max(0.5, Math.min(patternSteps * 2 - startTick, note.durationTicks)),
                        midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
                        velocity: Number.isFinite(note.velocity) ? Math.max(0.1, Math.min(1, note.velocity)) : 0.8,
                      };
                    })])),
              } : {}),
              gridResolution,
              volume: Number.isFinite(pattern.volume) ? Math.max(0, Math.min(1, pattern.volume)) : 1,
              effects: makeDefaultEffects(pattern.effects),
              effectSettings: makeDefaultEffectSettings(pattern.effectSettings),
              effectChain: Array.isArray(pattern.effectChain) ? pattern.effectChain : undefined,
              gainNode: null,
              fxRuntime: null,
              analyser: null,
            };
          });
        state.patterns = restoredPatterns.length
          ? restoredPatterns
          : [makePatternSnapshot(state.patterns[0]?.id || makeId(), state.patterns[0]?.name || "Pattern 1", PATTERN_COLORS[0])];
      } else {
        const initialPattern = state.patterns[0];
        state.patterns = [makePatternSnapshot(initialPattern?.id || makeId(), initialPattern?.name || "Pattern 1", initialPattern?.color || PATTERN_COLORS[0])];
      }
      if (!state.patterns.length) state.patterns = [makePatternSnapshot(makeId(), "Pattern 1", PATTERN_COLORS[0])];
      state.selectedPatternId = state.patterns.some((pattern) => pattern.id === saved.selectedPatternId)
        ? saved.selectedPatternId
        : state.patterns[0].id;
      const activePattern = getPattern();
      if (activePattern) applyPattern(activePattern);
      if (Array.isArray(saved.patternClips)) {
        state.patternClips = saved.patternClips
          .filter((clip) => typeof clip?.id === "string" && Number.isFinite(clip.startBar))
          .map((clip) => {
            const patternId = state.patterns.some((pattern) => pattern.id === clip.patternId) ? clip.patternId : state.selectedPatternId;
            const pattern = getPattern(patternId);
            const requestedRepeats = Number.isInteger(clip.repeatCount) ? Math.max(1, clip.repeatCount) : 1;
            const repeatCount = pattern
              ? Math.min(requestedRepeats, Math.max(1, Math.floor(MAX_ARRANGEMENT_BARS / (pattern.steps / 16))))
              : 1;
            const durationBars = Number.isFinite(clip.durationBars)
              ? Math.max(0.01, Math.min(MAX_ARRANGEMENT_BARS, clip.durationBars))
              : (pattern?.steps || 16) / 16 * repeatCount;
            return {
              id: clip.id,
              patternId,
              trackId: state.patterns.some((item) => item.id === clip.trackId) ? clip.trackId : patternId,
              repeatCount,
              ...(Number.isFinite(clip.durationBars) ? { durationBars } : {}),
              sourceOffsetBars: Number.isFinite(clip.sourceOffsetBars) ? Math.max(0, clip.sourceOffsetBars) : 0,
              startBar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - durationBars, clip.startBar)),
            };
          });
      }
      if (Number.isFinite(saved.pianoBars) && [1, 2, 4, 8].includes(saved.pianoBars)) state.pianoBars = saved.pianoBars;
      if (Number.isFinite(saved.pianoCursorTick)) state.pianoCursorTick = Math.max(0, Math.min(state.pianoBars * PIANO_TICKS_PER_BAR - 0.001, saved.pianoCursorTick));
      if (Number.isFinite(saved.pianoStartBar)) state.pianoStartBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 1, Math.floor(saved.pianoStartBar)));
      if (Number.isInteger(saved.pianoSnap) && [1, 2, 4, 8].includes(saved.pianoSnap)) state.pianoSnap = saved.pianoSnap;
      if (typeof saved.pianoSnapEnabled === "boolean") state.pianoSnapEnabled = saved.pianoSnapEnabled;
      if (saved.soundDurationEdits && typeof saved.soundDurationEdits === "object" && !Array.isArray(saved.soundDurationEdits)) {
        state.soundDurationEdits = Object.fromEntries(Object.entries(saved.soundDurationEdits)
          .filter(([soundId, scale]) => typeof soundId === "string" && Number.isFinite(scale) && scale >= 0.01 && scale < 1));
      }
      if (Number.isInteger(saved.pianoNoteLength) && [1, 2, 4, 8].includes(saved.pianoNoteLength)) state.pianoNoteLength = saved.pianoNoteLength;
      if (typeof saved.selectedPianoTrackId === "string" && state.tracks.some((track) => track.id === saved.selectedPianoTrackId)) {
        state.selectedPianoTrackId = saved.selectedPianoTrackId;
      }
      if (Array.isArray(saved.pianoNotes)) {
        state.pianoNotes = saved.pianoNotes
          .filter((note) => note && typeof note.id === "string" && Number.isFinite(note.startTick) && Number.isFinite(note.durationTicks) &&
            Number.isInteger(note.midi) && state.tracks.some((track) => track.id === note.trackId))
          .slice(0, 4096)
          .map((note) => {
            const startTick = Math.max(0, Math.min(8 * PIANO_TICKS_PER_BAR - 0.5, note.startTick));
            return {
              id: note.id,
              trackId: note.trackId,
              midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
              startTick,
              durationTicks: Math.max(0.5, Math.min(8 * PIANO_TICKS_PER_BAR - startTick, note.durationTicks)),
              velocity: Number.isFinite(note.velocity) ? Math.max(0.1, Math.min(1, note.velocity)) : 0.8,
            };
          });
      }
      if (Array.isArray(saved.mels)) {
        state.mels = saved.mels
          .filter((mel) => typeof mel?.id === "string" && typeof mel.name === "string")
          .map((mel) => {
            const instrumentId = state.tracks.some((track) => track.id === mel.instrumentId)
              ? mel.instrumentId
              : state.tracks.find((track) => track.id === "piano-grand")?.id || state.tracks[0]?.id || "";
            const notes = Array.isArray(mel.notes) ? mel.notes
              .filter((note) => note && typeof note.id === "string" && Number.isFinite(note.startTick) &&
                Number.isFinite(note.durationTicks) && Number.isInteger(note.midi))
              .slice(0, 4096)
              .map((note) => {
                const startTick = Math.max(0, Math.min(8 * PIANO_TICKS_PER_BAR - 0.5, note.startTick));
                return {
                  id: note.id,
                  trackId: instrumentId,
                  midi: Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, note.midi)),
                  startTick,
                  durationTicks: Math.max(0.5, Math.min(8 * PIANO_TICKS_PER_BAR - startTick, note.durationTicks)),
                  velocity: Number.isFinite(note.velocity) ? Math.max(0.1, Math.min(1, note.velocity)) : 0.8,
                };
              })
              : [];
            return {
              id: mel.id,
              name: mel.name.trim() || "Mel",
              instrumentId,
              bars: [1, 2, 4, 8].includes(mel.bars) ? mel.bars : 4,
              notes,
            };
          });
      }
      if (Array.isArray(saved.melTracks)) {
        const fallbackInstrumentId = state.tracks.find((item) => item.id === "piano-grand")?.id || state.tracks[0]?.id || "";
        state.melTracks = saved.melTracks
          .filter((track) => typeof track?.id === "string" && typeof track.name === "string" && Array.isArray(track.clips))
          .map((track) => ({
            id: track.id,
            name: track.name,
            kind: "mel",
            instrumentId: state.tracks.some((item) => item.id === track.instrumentId) ? track.instrumentId : fallbackInstrumentId,
            color: isPatternColor(track.color) ? track.color : "#b5a0ff",
            volume: Number.isFinite(track.volume) ? Math.max(0, Math.min(1, track.volume)) : 1,
            muted: track.muted === true,
            solo: track.solo === true,
            gainNode: null,
            effects: makeDefaultEffects(track.effects),
            effectSettings: makeDefaultEffectSettings(track.effectSettings),
            effectChain: Array.isArray(track.effectChain) ? track.effectChain : undefined,
            clips: track.clips
              .filter((clip) => typeof clip?.id === "string" && state.mels.some((mel) => mel.id === clip.melId) && Number.isFinite(clip.startBar))
              .map((clip) => {
                const mel = getMel(clip.melId);
                const durationBars = Number.isFinite(clip.durationBars)
                  ? Math.max(0.01, Math.min(MAX_ARRANGEMENT_BARS, clip.durationBars))
                  : mel ? getMelLengthBars(mel) : 1;
                return {
                  id: clip.id,
                  melId: clip.melId,
                  ...(Number.isFinite(clip.durationBars) ? { durationBars } : {}),
                  sourceOffsetBars: Number.isFinite(clip.sourceOffsetBars) ? Math.max(0, clip.sourceOffsetBars) : 0,
                  startBar: Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - durationBars, clip.startBar)),
                };
              }),
          }));
      }
      const availableMixerTrackIds = new Set(getMixerSourceTracks().map(({ track }) => track.id));
      const reservedTrackIds = new Set([MASTER_MIXER_TRACK_ID, ...availableMixerTrackIds]);
      state.effectTracks = state.effectTracks.filter((track) => {
        if (reservedTrackIds.has(track.id)) return false;
        reservedTrackIds.add(track.id);
        return true;
      });
      const routedMixerTrackIds = new Set();
      state.effectTracks.forEach((track) => {
        track.routedTrackIds = track.routedTrackIds.filter((trackId) => {
          if (!availableMixerTrackIds.has(trackId) || routedMixerTrackIds.has(trackId)) return false;
          routedMixerTrackIds.add(trackId);
          return true;
        });
      });
      if (typeof saved.selectedMelId === "string") state.selectedMelId = saved.selectedMelId;
    } catch {
      try { window.localStorage.removeItem(getProjectStorageKey(state.projectId)); } catch { /* Storage may be disabled. */ }
    }
  }

  function exportPattern() {
    const activePattern = getPattern();
    const pattern = {
      app: "DansBPM",
      version: 1,
      exportedAt: new Date().toISOString(),
      tempo: state.bpm,
      swing: state.swing,
      bars: state.steps / 16,
      steps: getGridStepCount(activePattern),
      gridResolution: getPatternGridResolution(activePattern),
      pattern: activePattern?.name || "Pattern",
      tracks: state.tracks.filter((track) => getPatternTrackIds(activePattern).includes(track.id)).map((track) => ({
        name: track.name,
        sample: track.sample?.name || null,
        sound: track.variant || null,
        steps: track.cells.slice(0, getGridStepCount(activePattern)).map((active) => active ? 1 : 0),
      })),
    };
    const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dansbpm-pattern.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Pattern exported as JSON");
  }

  async function exportArrangementWav() {
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before exporting the song.");
      return;
    }
    const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineAudioContext) {
      showToast("WAV export is not supported in this browser.");
      return;
    }
    if (state.isPlaying) stopPlayback();
    const sampleRate = 44100;
    const secondsPerBar = 240 / state.bpm;
    const duration = state.arrangementBars * secondsPerBar;
    if (duration > 600) {
      showToast("Song export is limited to 10 minutes. Shorten the arrangement or raise the tempo.");
      return;
    }

    const previousContext = state.audioContext;
    const previousMaster = state.masterGain;
    const previousNoise = state.noiseBuffer;
    const allTracks = [
      ...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
      ...state.effectTracks, state.masterTrack,
    ];
    const previousGains = allTracks.map((track) => track.gainNode);
    const previousFxRuntimes = allTracks.map((track) => track.fxRuntime);
    const previousAnalysers = allTracks.map((track) => track.analyser);
    const previousSourceGains = allTracks.map((track) => track.sourceGains);
    const button = $("#export-song-button");
    state.isExporting = true;
    button.disabled = true;
    document.body.classList.add("is-exporting");
    showToast("Rendering your song to WAV…");
    try {
      const context = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
      state.audioContext = context;
      state.masterGain = context.createGain();
      state.masterGain.gain.value = 0.88;
      state.masterGain.connect(context.destination);
      state.noiseBuffer = createNoiseBuffer(context);
      const hasSolo = [...state.tracks, ...state.arrangementTracks].some((track) => track.solo);
      const hasMelSolo = state.melTracks.some((track) => track.solo);
      allTracks.forEach((track) => {
        track.gainNode = context.createGain();
        const isBus = track.kind === "mixer-master" || track.kind === "mixer-effects";
        const isSilent = track.muted || (!isBus && (track.kind === "pattern" ? false : track.kind === "mel"
          ? hasMelSolo && !track.solo
          : hasSolo && !track.solo));
        track.gainNode.gain.value = isSilent ? 0 : track.volume;
        track.fxRuntime = null;
        track.analyser = null;
        track.sourceGains = null;
        track.effects = makeDefaultEffects(track.effects);
      });
      allTracks.forEach((track) => {
        rebuildTrackEffectChain(track);
      });

      state.arrangementTracks.forEach((track) => {
        track.clips.forEach((clip) => {
          const startTime = clip.startBar * secondsPerBar;
          if (startTime >= duration) return;
          const source = context.createBufferSource();
          source.buffer = clip.buffer;
          source.connect(track.gainNode);
          const clipDuration = clip.durationSeconds ?? clip.buffer.duration;
          const sourceOffset = clip.sourceOffsetSeconds || 0;
          const playDuration = Math.min(clip.buffer.duration - sourceOffset, clipDuration, duration - startTime);
          if (playDuration > 0) source.start(startTime, sourceOffset, playDuration);
        });
      });

      state.patternClips.forEach((clip) => {
        const pattern = getPattern(clip.patternId);
        if (!pattern) return;
        const patternTrackIds = new Set(getPatternTrackIds(pattern));
        const patternSources = allTracks.filter((track) => patternTrackIds.has(track.id) && track.kind !== "pattern");
        const patternTrack = state.patterns.find((item) => item.id === (clip.trackId || clip.patternId)) || pattern;
        const stepsPerBar = getStepsPerBar(pattern);
        const ticksPerGridStep = getGridTicksPerStep(pattern);
        const gridStepCount = getGridStepCount(pattern);
        const sourceOffset = clip.sourceOffsetBars || 0;
        const sourceBars = pattern.steps / 16 * (clip.repeatCount || 1);
        const clipDuration = getArrangementClipDuration("pattern", clip);
        const firstStep = Math.max(0, Math.ceil(sourceOffset * stepsPerBar - 0.0001));
        const lastStep = Math.min(sourceBars * stepsPerBar, Math.ceil((sourceOffset + clipDuration) * stepsPerBar - 0.0001));
        for (let sourceStep = firstStep; sourceStep < lastStep; sourceStep += 1) {
          const sourcePosition = sourceStep / stepsPerBar;
          const relativePosition = sourcePosition - sourceOffset;
          const patternStep = sourceStep % gridStepCount;
          const tick = patternStep * ticksPerGridStep;
          const time = (clip.startBar + relativePosition) * secondsPerBar +
            (Math.floor(tick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
          if (time >= duration) continue;
          patternSources.forEach((track) => {
            if (pattern.cells[track.id]?.[patternStep] && !Array.isArray(pattern.stepPianoNotes?.[track.id]) &&
              !track.muted && (!hasSolo || track.solo)) {
              const trackTime = getTrackStepTime(track, patternStep, pattern, time);
              triggerTrack(track, trackTime, patternStep, pattern.variants[track.id] || track.variant,
                getNoteDuration(pattern), patternTrack, getPatternSourceGain(patternTrack, track));
            }
          });
        }
        patternSources.forEach((track) => {
          const notes = pattern.stepPianoNotes?.[track.id];
          if (!Array.isArray(notes) || track.muted || (hasSolo && !track.solo)) return;
          const patternBars = pattern.steps / 16;
          const loopCount = Math.ceil(sourceBars / patternBars);
          for (let loop = 0; loop < loopCount; loop += 1) {
            notes.forEach((note) => {
              const sourcePosition = loop * patternBars + note.startTick / PIANO_TICKS_PER_BAR;
              if (sourcePosition < sourceOffset || sourcePosition >= sourceOffset + clipDuration) return;
              const startTime = (clip.startBar + sourcePosition - sourceOffset) * secondsPerBar +
                (Math.floor(note.startTick / 2) % 2 === 1 ? getStepDuration() * (state.swing / 100) : 0);
              if (startTime >= duration) return;
              const clipEndDuration = (sourceOffset + clipDuration - sourcePosition) * secondsPerBar;
              const noteDuration = Math.min(note.durationTicks * getSchedulerTickDuration(), clipEndDuration, duration - startTime);
              if (noteDuration > 0) {
                playPianoNote(track, startTime, note.midi, noteDuration, note.velocity ?? 0.8,
                  patternTrack, getPatternSourceGain(patternTrack, track), note);
              }
            });
          }
        });
      });
      state.melTracks.forEach((melTrack) => {
        const instrument = state.tracks.find((track) => track.id === melTrack.instrumentId);
        if (!instrument || melTrack.muted || (hasMelSolo && !melTrack.solo) ||
          instrument.muted || (hasSolo && !instrument.solo)) return;
        melTrack.clips.forEach((clip) => {
          const mel = getMel(clip.melId);
          if (!mel) return;
          const sourceOffset = clip.sourceOffsetBars || 0;
          const sourceEnd = Math.min(getMelLengthBars(mel), sourceOffset + getArrangementClipDuration("mel", clip));
          mel.notes.forEach((note) => {
            const noteStart = note.startTick / PIANO_TICKS_PER_BAR;
            const noteEnd = noteStart + note.durationTicks / PIANO_TICKS_PER_BAR;
            const startBar = clip.startBar + Math.max(sourceOffset, noteStart) - sourceOffset;
            const endBar = clip.startBar + Math.min(sourceEnd, noteEnd) - sourceOffset;
            if (startBar >= duration / secondsPerBar || endBar <= startBar) return;
            const startTime = startBar * secondsPerBar;
            const noteDuration = Math.min((endBar - startBar) * secondsPerBar, duration - startTime);
            if (noteDuration > 0) playPianoNote(instrument, startTime, note.midi, noteDuration,
              note.velocity ?? 0.8, melTrack, null, note);
          });
        });
      });
      if (state.metronome) {
        for (let step = 0; step < Math.ceil(duration / stepDuration); step += 4) {
          const time = step * stepDuration;
          triggerClick(time, step % 16 === 0);
        }
      }

      const rendered = await context.startRendering();
      downloadBlob(encodeWav(rendered), "dansbpm-song.wav");
      showToast("Song exported as WAV");
    } catch (error) {
      showToast(`Could not export the song: ${error.message || "render failed"}`);
    } finally {
      state.audioContext = previousContext;
      state.masterGain = previousMaster;
      state.noiseBuffer = previousNoise;
      allTracks.forEach((track, index) => {
        track.fxRuntime?.forEach(({ nodes, sources }) => {
          sources.forEach((source) => {
            try { source.stop(); } catch { /* already stopped */ }
          });
          nodes.forEach((node) => node.disconnect());
        });
        track.gainNode = previousGains[index];
        track.fxRuntime = previousFxRuntimes[index];
        track.analyser = previousAnalysers[index];
        track.sourceGains = previousSourceGains[index];
      });
      state.isExporting = false;
      button.disabled = false;
      document.body.classList.remove("is-exporting");
    }
  }

  function encodeWav(audioBuffer) {
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const frames = audioBuffer.length;
    const dataBytes = frames * channels * 2;
    const wav = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(wav);
    const writeText = (offset, text) => {
      for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, dataBytes, true);
    const channelData = Array.from({ length: channels }, (_, channel) => audioBuffer.getChannelData(channel));
    let offset = 44;
    for (let frame = 0; frame < frames; frame += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([wav], { type: "audio/wav" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clearPattern() {
    state.tracks.forEach((track) => track.cells.fill(false));
    const pattern = getPattern();
    Object.keys(pattern?.stepPianoNotes || {}).forEach((trackId) => {
      pattern.stepPianoNotes[trackId] = [];
      pattern.cells[trackId] = Array(STEP_COUNT).fill(false);
    });
    state.selectedPreset = null;
    renderTracks();
    renderPresets();
    saveState();
    showToast("Pattern cleared");
  }

  function toggleMetronome() {
    state.metronome = !state.metronome;
    const button = $("#metronome-button");
    button.classList.toggle("is-active", state.metronome);
    button.setAttribute("aria-pressed", String(state.metronome));
    showToast(state.metronome ? "Metronome on" : "Metronome off");
  }

  function bindEvents() {
    document.addEventListener("pointermove", paintStepAtPointer);
    document.addEventListener("pointermove", updateStepSelectionDrag);
    document.addEventListener("pointerup", finishStepPaint);
    document.addEventListener("pointerup", finishStepSelectionDrag);
    document.addEventListener("pointercancel", finishStepPaint);
    document.addEventListener("pointercancel", finishStepSelectionDrag);
    playButton.addEventListener("click", () => {
      if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
      if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      else {
        if (state.isPlaying) stopPlayback();
        startPlayback("arrangement");
      }
    });
    Object.entries(WORKSPACE_PLAY_BUTTONS).forEach(([workspace, buttonId]) => {
      $(`#${buttonId}`).addEventListener("click", () => toggleWorkspacePlayback(workspace));
    });
    $("#stop-button").addEventListener("click", stopPlayback);
    $("#arrangement-snap-button").addEventListener("click", () => {
      state.arrangementSnap = !state.arrangementSnap;
      if (state.arrangementSnap) setArrangementCursor(state.arrangementCursor);
      renderArrangement();
      saveState();
    });
    $("#tempo-control").addEventListener("click", () => {
      const entry = window.prompt("Set tempo (60–180 BPM)", String(state.bpm));
      if (entry === null || !entry.trim()) return;
      const value = Number(entry);
      if (!Number.isFinite(value) || value < 60 || value > 180) {
        showToast("Tempo must be between 60 and 180 BPM.");
        return;
      }
      const resumeBar = state.arrangementCursor;
      if (state.isPlaying && isSongWorkspace()) stopPlayback();
      state.bpm = Math.round(value);
      tempoValue.textContent = String(state.bpm);
      updateArrangementLength();
      if (isSongWorkspace()) renderArrangement();
      if (resumeBar > 0) setArrangementCursor(resumeBar);
      saveState();
    });
    swingSlider.addEventListener("input", () => {
      state.swing = Number(swingSlider.value);
      $("#swing-value").textContent = `${state.swing}%`;
      swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
      saveState();
    });
    $("#decrease-pattern-bars").addEventListener("click", () => setLength(state.steps - 16));
    $("#increase-pattern-bars").addEventListener("click", () => setLength(state.steps + 16));
    $("#clear-button").addEventListener("click", clearPattern);
    $("#preload-pattern-select").addEventListener("change", (event) => {
      const preset = PRESETS.find((item) => item.id === event.target.value);
      if (preset) loadPreset(preset);
    });
    $("#export-button").addEventListener("click", exportPattern);
    $("#export-song-button").addEventListener("click", exportArrangementWav);
    $("#metronome-button").addEventListener("click", toggleMetronome);
    $("#help-button").addEventListener("click", () => $("#help-dialog").showModal());
    $("#sequencer-tab").addEventListener("click", () => setWorkspaceView("sequencer"));
    $("#arrangement-tab").addEventListener("click", () => setWorkspaceView("arrangement"));
    $("#piano-roll-tab").addEventListener("click", () => setWorkspaceView("piano-roll"));
    $("#step-piano-return").addEventListener("click", () => {
      closeStepInstrumentPianoRoll();
      setWorkspaceView("sequencer");
    });
    $("#mixer-tab").addEventListener("click", () => setWorkspaceView("mixer"));
    $("#dj-tab").addEventListener("click", () => setWorkspaceView("dj"));
    bindDjEvents();
    $("#add-effects-track").addEventListener("click", createEffectTrack);
    $("#hide-workspace-button").addEventListener("click", () => setViewVisibility(true, false));
    $("#show-workspace-button").addEventListener("click", () => setViewVisibility(false, false));
    $("#hide-track-view-button").addEventListener("click", () => setViewVisibility(false, true));
    $("#show-track-view-button").addEventListener("click", () => setViewVisibility(false, false));
    const viewResizer = $("#view-resizer");
    viewResizer.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const main = $("#arrangement-main");
      const updateRatio = (moveEvent) => {
        const bounds = main.getBoundingClientRect();
        const available = bounds.height - viewResizer.offsetHeight;
        if (available <= 0) return;
        const pointerOffset = moveEvent.clientY - bounds.top - viewResizer.offsetHeight / 2;
        state.workspaceRatio = Math.max(20, Math.min(80, Math.round(pointerOffset / available * 100)));
        renderViewLayout();
      };
      const finish = () => {
        document.removeEventListener("pointermove", updateRatio);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        saveState();
      };
      document.addEventListener("pointermove", updateRatio);
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    });
    viewResizer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp") setWorkspaceRatio(state.workspaceRatio + 5);
      else if (event.key === "ArrowDown") setWorkspaceRatio(state.workspaceRatio - 5);
      else if (event.key === "Home") setWorkspaceRatio(20);
      else if (event.key === "End") setWorkspaceRatio(80);
      else return;
      event.preventDefault();
    });
    $("#open-beat-grid-button").addEventListener("click", () => setWorkspaceView(state.view === "sequencer" && !state.workspaceHidden ? "arrangement" : "sequencer"));
    $("#open-piano-roll-button").addEventListener("click", () => setWorkspaceView(state.view === "piano-roll" && !state.workspaceHidden ? "arrangement" : "piano-roll"));
    $("#step-keyboard-record-button").addEventListener("click", () => toggleKeyboardRecording("sequencer"));
    $("#piano-keyboard-record-button").addEventListener("click", () => toggleKeyboardRecording("piano-roll"));
    $("#mel-select").addEventListener("change", (event) => selectMel(event.target.value));
    $("#new-mel-button").addEventListener("click", createMel);
    $("#rename-mel-button").addEventListener("click", renameMel);
    $("#mel-drag-source").addEventListener("dragstart", (event) => {
      if (state.stepPianoEditContext) {
        syncStepPianoEdit();
        const pattern = getPattern(state.stepPianoEditContext.patternId);
        if (!pattern || !event.dataTransfer) return;
        event.dataTransfer.setData("application/x-pulsegrid-pattern-source", JSON.stringify({ patternId: pattern.id }));
        event.dataTransfer.effectAllowed = "copy";
        return;
      }
      const mel = getMel();
      if (!mel || !event.dataTransfer) return;
      event.dataTransfer.setData("application/x-pulsegrid-mel-source", JSON.stringify({ melId: mel.id }));
      event.dataTransfer.effectAllowed = "copy";
    });
    $("#piano-instrument-select").addEventListener("click", () => openStepInstrumentPicker(null, "piano-roll"));
    $("#piano-draw-mode-button").addEventListener("click", () => {
      state.pianoDrawMode = !state.pianoDrawMode;
      renderPianoRoll();
    });
    $("#piano-humanize-button").addEventListener("click", humanizePianoNotes);
    $("#piano-roll-grid").addEventListener("contextmenu", (event) => {
      const noteElement = event.target.closest(".piano-roll-note");
      if (!noteElement) return;
      const note = state.pianoNotes.find((item) => item.id === noteElement.dataset.noteId);
      if (note) openPianoNoteContextMenu(event, note);
    });
    $("#piano-note-context-menu").addEventListener("input", updatePianoNoteContext);
    $("#piano-note-context-close").addEventListener("click", closePianoNoteContextMenu);
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#piano-note-context-menu");
      if (!menu.hidden && !menu.contains(event.target)) closePianoNoteContextMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#piano-note-context-menu").hidden) {
        closePianoNoteContextMenu();
      }
    });
    $("#piano-snap-select").addEventListener("change", (event) => {
      state.pianoSnapEnabled = event.target.value !== "off";
      if (state.pianoSnapEnabled) state.pianoSnap = Number(event.target.value);
      saveState();
    });
    $("#piano-note-length-select").addEventListener("change", (event) => {
      state.pianoNoteLength = Number(event.target.value);
      saveState();
    });
    $("#piano-bars-select").addEventListener("change", (event) => {
      state.pianoBars = Number(event.target.value);
      state.pianoCursorTick = Math.min(state.pianoCursorTick, state.pianoBars * PIANO_TICKS_PER_BAR - 0.001);
      renderPianoRoll();
      saveState();
    });
    $("#piano-scale-slider").addEventListener("input", (event) => {
      state.pianoScale = Number(event.target.value) / 100;
      renderPianoRoll();
    });
    $("#piano-scale-slider").addEventListener("change", saveState);
    $("#piano-roll-grid").addEventListener("click", (event) => {
      if (state.pianoDrawMode) return;
      if (state.suppressPianoGridClick) {
        state.suppressPianoGridClick = false;
        return;
      }
      if (!event.target.closest(".piano-roll-note")) addPianoNoteFromPointer(event);
    });
    $("#piano-roll-grid").addEventListener("pointerdown", startPianoSelection);
    $("#piano-roll-scroll").addEventListener("scroll", () => {
      updatePianoRulerViewport();
      updatePianoPlayhead();
    });
    $("#piano-roll-view").addEventListener("scroll", updatePianoRulerViewport);
    window.addEventListener("scroll", updatePianoRulerViewport, true);
    window.addEventListener("resize", updatePianoRulerViewport);
    $("#clear-piano-roll-button").addEventListener("click", () => {
      state.pianoNotes = [];
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.pianoSelectionFromMarquee = false;
      state.scheduledPianoNotes.clear();
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
    });
    $("#timeline-scroll").addEventListener("scroll", (event) => {
      const labels = $("#arrangement-track-labels");
      if (labels.scrollTop !== event.currentTarget.scrollTop) labels.scrollTop = event.currentTarget.scrollTop;
    });
    $("#arrangement-track-labels").addEventListener("scroll", (event) => {
      const timeline = $("#timeline-scroll");
      if (timeline.scrollTop !== event.currentTarget.scrollTop) timeline.scrollTop = event.currentTarget.scrollTop;
    });
    $("#arrangement-track-labels").addEventListener("contextmenu", openArrangementTrackContextMenu);
    $("#timeline-content").addEventListener("contextmenu", openArrangementTrackContextMenu);
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#arrangement-track-context-menu");
      if (!menu.hidden && event.target instanceof Node && !menu.contains(event.target)) {
        closeArrangementTrackContextMenu();
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#arrangement-track-context-menu").hidden) {
        closeArrangementTrackContextMenu();
      }
    }, true);
    $("#add-empty-track-below").addEventListener("click", () => {
      const menu = $("#arrangement-track-context-menu");
      const parentTrackId = menu.dataset.trackId;
      if (!parentTrackId) return;
      const track = createArrangementTrack(getNextArrangementTrackName(), parentTrackId);
      state.selectedMixerTrackId = track.id;
      closeArrangementTrackContextMenu();
      renderArrangement();
      saveState();
      Array.from($("#arrangement-track-labels").querySelectorAll(".arrangement-label")).find((label) =>
        label.dataset.trackId === track.id)?.scrollIntoView({ block: "nearest" });
    });
    $("#timeline-content").addEventListener("pointerdown", startArrangementSelection);
    $("#timeline-content").addEventListener("click", (event) => {
      if (!state.suppressArrangementClick) return;
      state.suppressArrangementClick = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    document.addEventListener("pointerdown", clearStepSelectionOnPointerDown, true);
    document.addEventListener("pointerdown", clearMarqueeSelectionOnOutsidePointer, true);
    document.addEventListener("click", finishArrangementMarqueeDeselect, true);
    $("#sequencer-pattern-select").addEventListener("change", (event) => selectPattern(event.target.value));
    $("#grid-resolution-select").addEventListener("change", (event) => {
      setPatternGridResolution(event.target.value);
    });
    $("#sequencer-scale-slider").addEventListener("input", (event) => {
      state.sequencerScale = Number(event.target.value) / 100;
      $("#sequencer-scale-value").textContent = `${event.target.value}%`;
      setSequencerGridDimensions(getGridStepCount(), getStepsPerBar());
      renderStepPianoPreviews();
    });
    $("#sequencer-scale-slider").addEventListener("change", saveState);
    $("#arrangement-pattern-select").addEventListener("change", (event) => selectPattern(event.target.value));
    $("#rename-pattern-sequencer-button").addEventListener("click", renamePattern);
    $("#rename-pattern-button").addEventListener("click", renamePattern);
    $("#pattern-drag-source").addEventListener("dragstart", (event) => {
      const pattern = getPattern();
      if (!pattern || !event.dataTransfer) return;
      event.dataTransfer.setData("application/x-pulsegrid-pattern-source", JSON.stringify({ patternId: pattern.id }));
      event.dataTransfer.effectAllowed = "copy";
    });
    $("#assets-button").addEventListener("click", () => openAssetLibrary());
    $("#sequencer-browser-button").addEventListener("click", () => openAssetLibrary());
    const soundSearchInput = $("#sound-library-search-input");
    soundSearchInput.addEventListener("input", () => {
      stepInstrumentPendingId = null;
      $("#step-instrument-select").disabled = true;
      renderSoundSearchSuggestions(soundSearchInput.value);
      renderStepInstrumentLibrary(soundSearchInput.value);
    });
    soundSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const firstResult = $("#sound-library-search-results").querySelector(".sound-library-search-result");
        if (firstResult instanceof HTMLButtonElement) navigateToSoundSearchResult(firstResult);
        else {
          renderSoundSearchSuggestions("");
          renderStepInstrumentLibrary(soundSearchInput.value.trim());
        }
      } else if (event.key === "Escape") {
        renderSoundSearchSuggestions("");
        soundSearchInput.blur();
      } else if (event.key === "ArrowDown") {
        const firstResult = $("#sound-library-search-results").querySelector(".sound-library-search-result");
        if (firstResult) {
          event.preventDefault();
          firstResult.focus();
        }
      }
    });
    $("#sound-library-search-results").addEventListener("click", (event) => {
      const result = event.target instanceof Element
        ? event.target.closest(".sound-library-search-result")
        : null;
      if (result instanceof HTMLButtonElement) navigateToSoundSearchResult(result);
    });
    document.addEventListener("pointerdown", (event) => {
      const search = $("#sound-library-search");
      if (event.target instanceof Node && !search.contains(event.target)) {
        renderSoundSearchSuggestions("");
      }
    }, true);
    $("#sound-duration-slider").addEventListener("input", (event) => {
      setSoundDurationFromMenu(Number(event.currentTarget.value));
    });
    $("#sound-duration-play").addEventListener("click", () => {
      const track = state.tracks.find((item) => item.id === $("#sound-duration-menu").dataset.trackId);
      if (!track) {
        showToast("This sound is no longer available.");
        return;
      }
      previewInstrumentSound(track);
    });
    $("#sound-duration-reset").addEventListener("click", () => {
      $("#sound-duration-slider").value = "100";
      setSoundDurationFromMenu(100);
    });
    $("#sound-duration-close").addEventListener("click", closeSoundDurationMenu);
    document.addEventListener("pointerdown", (event) => {
      const menu = $("#sound-duration-menu");
      if (!menu.hidden && !menu.contains(event.target)) closeSoundDurationMenu();
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#sound-duration-menu").hidden) {
        event.preventDefault();
        event.stopPropagation();
        closeSoundDurationMenu();
      }
    }, true);
    $("#step-instrument-close").addEventListener("click", () => $("#step-instrument-dialog").close());
    $("#step-instrument-select").addEventListener("click", applyStepInstrumentSelection);
    $("#step-instrument-dialog").addEventListener("close", () => {
      closeSoundDurationMenu();
      stepInstrumentTargetTrackId = null;
      stepInstrumentPendingId = null;
      $("#sound-library-search-input").value = "";
      renderSoundSearchSuggestions("");
    });
    $("#step-instrument-dialog").addEventListener("click", (event) => {
      if (event.target === $("#step-instrument-dialog")) $("#step-instrument-dialog").close();
    });
    $("#step-track-mix-close").addEventListener("click", () => $("#step-track-mix-dialog").close());
    $("#step-track-mix-dialog").addEventListener("click", (event) => {
      if (event.target === $("#step-track-mix-dialog")) $("#step-track-mix-dialog").close();
    });
    $("#mixer-effect-close").addEventListener("click", () => $("#mixer-effect-dialog").close());
    $("#mixer-effect-dialog").addEventListener("close", () => {
      if ($("#mixer-effect-dialog").open) return;
      if (state.mixerEffectAnimation !== null) cancelAnimationFrame(state.mixerEffectAnimation);
      state.mixerEffectAnimation = null;
      state.mixerEffectDialogTrackId = null;
    });
    $("#mixer-effect-dialog").addEventListener("click", (event) => {
      if (event.target === $("#mixer-effect-dialog")) $("#mixer-effect-dialog").close();
    });
    $("#mixer-routing-close").addEventListener("click", () => $("#mixer-routing-dialog").close());
    $("#mixer-routing-done").addEventListener("click", () => $("#mixer-routing-dialog").close());
    $("#mixer-routing-remove").addEventListener("click", () => {
      const track = state.effectTracks.find((item) => item.id === state.mixerRoutingDialogTrackId);
      if (track) removeEffectTrack(track);
    });
    $("#mixer-routing-dialog").addEventListener("close", () => {
      state.mixerRoutingDialogTrackId = null;
    });
    $("#mixer-routing-dialog").addEventListener("click", (event) => {
      if (event.target === $("#mixer-routing-dialog")) $("#mixer-routing-dialog").close();
    });
    $("#new-pattern-button").addEventListener("click", createPattern);
    $("#new-pattern-sequencer-button").addEventListener("click", createPattern);
    $("#add-pattern-button").addEventListener("click", () => addPatternClip());
    $("#source-browser-button").addEventListener("click", () => openAssetLibrary());
    $("#source-browser-close").addEventListener("click", () => $("#source-browser-dialog").close());
    $("#source-browser-dialog").addEventListener("close", closeSoundDurationMenu);
    $("#import-recording-button").addEventListener("click", () => requestRecordingImport());
    $("#empty-import-button").addEventListener("click", () => requestRecordingImport());
    $("#side-add-recording").addEventListener("click", () => requestRecordingImport());
    $("#recording-input").addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      for (const file of files) await importRecording(file, state.pendingImportTrackId);
      state.pendingImportTrackId = null;
      event.target.value = "";
    });
    $("#add-track-button").addEventListener("click", () => {
      const track = createArrangementTrack();
      renderArrangement();
      requestRecordingImport(track.id);
    });
    $("#add-bars-button").addEventListener("click", () => {
      if (state.arrangementBars >= MAX_ARRANGEMENT_BARS) {
        showToast(`Arrangements are limited to ${MAX_ARRANGEMENT_BARS} bars.`);
        return;
      }
      state.arrangementBars = Math.min(MAX_ARRANGEMENT_BARS, state.arrangementBars + 4);
      updateArrangementLength();
      renderArrangement();
      saveState();
    });
    $("#arrangement-scale-slider").addEventListener("input", (event) => {
      setArrangementScale(Number(event.target.value) / 100);
    });
    $("#arrangement-scale-slider").addEventListener("change", saveState);
    $("#record-audio-button").addEventListener("click", toggleAudioRecording);
    $("#arrangement-clear-button").addEventListener("click", () => {
      if (!state.arrangementTracks.length && !state.patternClips.length && !state.melTracks.length) return;
      if (!window.confirm("Remove all clips from this arrangement?")) return;
      state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => deletePersistedClip(clip.id)));
      [...state.arrangementTracks, ...state.melTracks].forEach(disconnectTrackAudio);
      state.arrangementTracks = [];
      state.patternClips = [];
      state.melTracks = [];
      state.scheduledPianoNotes.clear();
      state.arrangementBars = 32;
      state.arrangementCursor = 0;
      renderArrangement();
      saveState();
      showToast("Arrangement cleared");
    });
    $("#project-name").addEventListener("click", () => {
      renderProjectList();
      $("#project-dialog").showModal();
    });
    $("#project-dialog-close").addEventListener("click", () => $("#project-dialog").close());
    $("#save-project-button").addEventListener("click", saveProjectNow);
    $("#top-save-project-button").addEventListener("click", saveProjectNow);
    $("#rename-project-button").addEventListener("click", renameProject);
    $("#new-project-button").addEventListener("click", createProject);
    $("#switch-user-button").addEventListener("click", switchUser);
    $("#login-options").addEventListener("click", (event) => {
      const option = event.target instanceof Element ? event.target.closest("[data-user-id]") : null;
      if (option instanceof HTMLButtonElement) selectUser(option.dataset.userId);
    });
    $("#create-profile-form").addEventListener("submit", (event) => {
      event.preventDefault();
      createUser();
    });
    sampleInput.addEventListener("change", () => loadSample(sampleInput.files?.[0]));
    $("#import-drum-sounds-button").addEventListener("click", () => drumSamplesInput.click());
    drumSamplesInput.addEventListener("change", () => importDrumSamples(Array.from(drumSamplesInput.files || [])));
    $("#reset-session").addEventListener("click", () => {
      if (!window.confirm("Reset this session to the starter pattern?")) return;
      stopPlayback();
      stopAllWorkspacePlayers();
      state.tracks.filter((track) => track.sample || track.kind === "sample").forEach((track) => {
        deletePersistedDrumSample(track.id).catch(() => showToast(`Could not remove saved sample ${track.name}.`));
      });
      [...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
        ...state.effectTracks, state.masterTrack].forEach(disconnectTrackAudio);
      state.masterTrack = makeMixerBusTrack("mixer-master");
      state.effectTracks = [];
      state.tracks = makeTracks();
      state.steps = 16;
      state.patterns = [makePatternSnapshot(makeId(), "Pattern 1", PATTERN_COLORS[0])];
      state.selectedPatternId = state.patterns[0].id;
      renderPatternSelectors();
      state.patternClips = [];
      state.mels = [];
      state.selectedMelId = "";
      state.melTracks = [];
      state.pianoNotes = [];
      state.pianoStartBar = 0;
      state.pianoBars = 4;
      state.pianoScale = 1;
      state.pianoDrawMode = false;
      state.pianoSnap = 2;
      state.pianoSnapEnabled = true;
      state.pianoNoteLength = 2;
      state.selectedPianoTrackId = "piano-grand";
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.pianoSelectionFromMarquee = false;
      state.selectedStepCells.clear();
      state.selectedMixerTrackId = null;
      state.selectedMixerEffectId = null;
      state.clipboard = null;
      state.selectedArrangementItems.clear();
      state.arrangementSelectionFromMarquee = false;
      state.arrangementBars = 32;
      state.arrangementScale = 1;
      state.arrangementCursor = 0;
      state.arrangementSnap = true;
      state.workspaceRatio = 50;
      state.sequencerScale = 1;
      state.workspaceHidden = false;
      state.trackViewHidden = false;
      state.bpm = 124;
      state.swing = 0;
      state.selectedPreset = "warehouse";
      state.view = "arrangement";
      tempoValue.textContent = "124";
      swingSlider.value = "0";
      $("#swing-value").textContent = "0%";
      swingSlider.style.setProperty("--range-progress", "0%");
      ensureMels();
      renderMelOptions();
      setLength(16);
      loadPreset(PRESETS[0]);
      renderPianoInstrumentOptions();
      renderPianoRoll();
      setWorkspaceView("arrangement", true);
    });
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const isTextEntry = target instanceof HTMLElement && (
        target.isContentEditable || target.tagName === "TEXTAREA" ||
        (target.tagName === "INPUT" && !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "hidden", "image"].includes(target.type))
      );
      const dialogOpen = $("#help-dialog").open || $("#project-dialog").open || $("#source-browser-dialog").open ||
        $("#step-instrument-dialog").open || $("#step-track-mix-dialog").open;
      const djControlFocused = state.view === "dj" && djViewExpanded &&
        target instanceof Element && target.closest("input, select, textarea, [contenteditable='true']");
      if (state.view === "dj" && djViewExpanded && event.code === "Space" &&
        (dialogOpen || (djControlFocused && !(event.ctrlKey || event.altKey || event.metaKey)))) return;
      if (event.code === "Space" && (event.ctrlKey || event.metaKey) && !event.altKey && !isTextEntry) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
        toggleCurrentWorkspacePlayback();
        return;
      }
      if (!isTyping && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !dialogOpen) {
        const key = event.key.toLowerCase();
        if (key === "p" && ["sequencer", "piano-roll"].includes(state.view) && !state.keyboardRecording) {
          event.preventDefault();
          placeCurrentEditorAtPlayhead();
        } else if (key === "s" && ["arrangement", "mixer"].includes(state.view)) {
          event.preventDefault();
          splitArrangementItemsAtCursor();
        }
      }
      if (!isTyping && !dialogOpen && !event.repeat && (event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === "a" && ["arrangement", "sequencer", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          if (state.view === "arrangement" || state.view === "mixer") selectAllArrangementItems();
          else if (state.view === "sequencer") selectAllStepCells();
          else selectAllPianoNotes();
        } else if (key === "c" && ["arrangement", "sequencer", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          copyEditorSelection();
        } else if (key === "v" && ["arrangement", "sequencer", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          pasteEditorClipboard();
        } else if (key === "x" && ["arrangement", "piano-roll", "mixer"].includes(state.view)) {
          event.preventDefault();
          copyEditorSelection();
          if (state.view === "piano-roll") deleteSelectedPianoNote();
          else deleteSelectedArrangementItems();
        }
      }
      if (!isTyping && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !dialogOpen) {
        if (recordStepKeyboardHit(event) || recordPianoKeyboardNote(event)) return;
      }
      if (!isTyping && !dialogOpen && !event.ctrlKey && !event.metaKey && !event.altKey &&
        state.view === "piano-roll" && (state.selectedPianoNoteIds.size || state.selectedPianoNoteId)) {
        const key = event.key;
        if (key === "ArrowLeft" || key === "ArrowRight") {
          event.preventDefault();
          nudgeSelectedPianoNotes(key === "ArrowRight" ? 1 : -1, 0, event.shiftKey);
        } else if (key === "ArrowUp" || key === "ArrowDown") {
          event.preventDefault();
          nudgeSelectedPianoNotes(0, key === "ArrowUp" ? 1 : -1);
        }
      }
      if (!isTyping && !dialogOpen && (event.ctrlKey || event.metaKey) && !event.altKey &&
        state.view === "piano-roll" && (event.key === "ArrowUp" || event.key === "ArrowDown") &&
        (state.selectedPianoNoteIds.size || state.selectedPianoNoteId)) {
        event.preventDefault();
        nudgeSelectedPianoNotes(0, event.key === "ArrowUp" ? 12 : -12);
      }
      if (!isTyping && !dialogOpen && !event.ctrlKey && !event.metaKey && !event.altKey &&
        state.view === "arrangement" && event.key === "ArrowLeft") {
        event.preventDefault();
        if (!event.repeat) setArrangementCursor(0);
      }
      if (!isTyping && !dialogOpen && !event.ctrlKey && !event.metaKey && !event.altKey &&
        ["arrangement", "mixer"].includes(state.view) && state.selectedArrangementItems.size &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        !(state.view === "arrangement" && event.key === "ArrowLeft")) {
        event.preventDefault();
        nudgeSelectedArrangementItems(event.key === "ArrowRight" ? 1 : -1);
      }
      if (!isTyping && !dialogOpen && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey &&
        state.view === "mixer" && !state.selectedArrangementItems.size &&
        event.key === "ArrowLeft") {
        event.preventDefault();
        setArrangementCursor(0);
      }
      if (event.code === "Space" && !isTextEntry && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
        if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
        else {
          if (state.isPlaying) stopPlayback();
          startPlayback("arrangement");
        }
      }
      if (!isTyping && !dialogOpen && (event.key === "Delete" || event.key === "Backspace")) {
        if (state.selectedArrangementItems.size) {
          event.preventDefault();
          deleteSelectedArrangementItems();
        } else if (state.selectedPianoNoteIds.size || state.selectedPianoNoteId) {
          event.preventDefault();
          deleteSelectedPianoNote();
        } else if (state.view === "sequencer" && state.selectedStepCells.size) {
          event.preventDefault();
          clearSelectedStepCells();
        }
      }
      if (event.key === "Escape" && $("#help-dialog").open) $("#help-dialog").close();
    });
  }

  function initialize() {
    initializeUsers();
    state.currentUser = getSessionUser();
    loadEffectPresets();
    state.tracks = makeTracks();
    const initialPattern = makePatternSnapshot(makeId(), "Pattern 1");
    state.patterns = [initialPattern];
    state.selectedPatternId = initialPattern.id;
    initializeProjects();
    if (state.currentUser) restoreState();
    restoreDjState();
    restoreDansBpmSynthPatch();
    ensureMels();
    tempoValue.textContent = String(state.bpm);
    swingSlider.value = String(state.swing);
    $("#swing-value").textContent = `${state.swing}%`;
    swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
    renderHeader();
    renderPresets();
    setLength(state.steps);
    renderTracks();
    renderArrangement();
    renderMelOptions();
    state.arrangementCursor = Math.min(state.arrangementCursor, state.arrangementBars - 0.001);
    setWorkspaceView(state.view, true);
    bindEvents();
    $("#login-screen").hidden = Boolean(state.currentUser);
    $("#active-user-label").textContent = getCurrentUserName();
  }

  initialize();
  if (state.currentUser) {
    restoreArrangement().then(renderDjView);
    try {
      if (window.sessionStorage.getItem(OPEN_PROJECTS_KEY) === "true") {
        window.sessionStorage.removeItem(OPEN_PROJECTS_KEY);
        renderProjectList();
        $("#project-dialog").showModal();
      }
    } catch (error) {
      showToast(`Could not open the project list: ${error.message || "session storage is unavailable"}`);
    }
  }
})();
