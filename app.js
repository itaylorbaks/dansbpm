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
    ...makeLiveSampleTracks("Live Drums", "Hi-Hats", "#d5b677", [
      ["acoustic-closed-hi-hat", "Acoustic Closed Hi-Hat", "sonic-pi-acoustic/closed-hi-hat.flac", 60],
      ["acoustic-open-hi-hat", "Acoustic Open Hi-Hat", "sonic-pi-acoustic/open-hi-hat.flac", 60],
    ]),
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
  const AUDIO_SCHEDULER_LOOKAHEAD = 0.25;
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

  const state = {
    tracks: [],
    patterns: [],
    selectedPatternId: null,
    arrangementTracks: [],
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

  const EFFECT_CATEGORIES = [
    { name: "Flanger", effects: [["flanger", "Flanger"], ["chorus", "Chorus"], ["phaser", "Phaser"], ["vibrato", "Vibrato"]] },
    { name: "Gain", effects: [["gain", "Gain"], ["distortion", "Distortion"], ["saturator", "Saturator"], ["softClipper", "Soft clipper"]] },
    { name: "Delay", effects: [["delay", "Delay"], ["pingPong", "Ping-pong delay"], ["slapback", "Slapback"], ["tapeDelay", "Tape delay"]] },
    { name: "Reverb", effects: [["reverb", "Reverb"], ["room", "Room"], ["hall", "Hall"], ["plate", "Plate"]] },
    { name: "Controllers", effects: [["autopan", "Auto-pan"], ["tremolo", "Tremolo"], ["autoFilter", "Auto-filter"], ["lfoGain", "LFO gain"]] },
    { name: "Dynamics", effects: [["compressor", "Compressor"], ["multibandCompressor", "Multiband compressor"], ["limiter", "Limiter"], ["noiseGate", "Noise gate"], ["transientShaper", "Transient shaper"]] },
    { name: "Miscellaneous", effects: [["bitcrusher", "Bitcrusher"], ["pitchShifter", "Pitch shifter"], ["harmonizer", "Harmonizer"], ["vocoder", "Vocoder"]] },
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
    saturator: [["drive", "Drive", 1, 12, 0.5, "×", 3]],
    softClipper: [["drive", "Drive", 1, 12, 0.5, "×", 2]],
    compressor: [["threshold", "Threshold", -60, 0, 1, " dB", -18], ["ratio", "Ratio", 1, 20, 0.5, ":1", 4], ["attack", "Attack", 1, 100, 1, " ms", 3], ["release", "Release", 10, 1000, 10, " ms", 180]],
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
      .map((note) => [note.startTick, note.durationTicks, note.midi, note.velocity, note.volume, note.attack, note.detune, note.pan])
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
      pan: note.pan,
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
    ["#new-mel-button", "#rename-mel-button", "#piano-keyboard-record-button",
      "#import-midi-button", "#export-midi-button"].forEach((selector) => {
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
    else main.style.gridTemplateRows = `minmax(0, ${state.workspaceRatio}fr) 12px minmax(0, ${100 - state.workspaceRatio}fr)`;
    $("#view-resizer").setAttribute("aria-valuenow", String(state.workspaceRatio));
    $("#view-resizer").setAttribute("aria-valuetext", `Workspace ${state.workspaceRatio}%, Track View ${100 - state.workspaceRatio}%`);
    $("#hide-workspace-button").hidden = state.workspaceHidden;
    $("#show-track-view-button").hidden = !state.trackViewHidden;
    $("#hide-track-view-button").hidden = state.trackViewHidden;
    $("#show-workspace-button").hidden = !state.workspaceHidden;
    updateWorkspaceFullscreenButton();
    updatePianoRulerViewport();
  }

  function updateWorkspaceFullscreenButton() {
    const button = $("#workspace-fullscreen-button");
    const isFullscreen = document.fullscreenElement === $("#workspace-area");
    button.textContent = isFullscreen ? "Restore" : "Expand";
    button.setAttribute("aria-label", isFullscreen ? "Restore workspace from fullscreen" : "Expand workspace to fullscreen");
    button.setAttribute("aria-pressed", String(isFullscreen));
  }

  async function toggleWorkspaceFullscreen() {
    const workspace = $("#workspace-area");
    try {
      if (document.fullscreenElement === workspace) {
        await document.exitFullscreen();
      } else if (document.fullscreenElement) {
        showToast("Exit the current fullscreen view first.");
      } else if (!workspace.requestFullscreen) {
        showToast("Fullscreen is unavailable in this browser.");
      } else {
        await workspace.requestFullscreen();
      }
    } catch (error) {
      showToast(`Could not change workspace fullscreen: ${error.message || "the browser denied the request"}`);
    }
  }

  document.addEventListener("fullscreenchange", () => {
    updateWorkspaceFullscreenButton();
    updatePianoRulerViewport();
  });

  function setViewVisibility(workspaceHidden, trackViewHidden, focusTarget = null) {
    state.workspaceHidden = workspaceHidden;
    state.trackViewHidden = trackViewHidden;
    renderViewLayout();
    saveState();
    if (focusTarget) $(`#${focusTarget}`).focus();
    else if (workspaceHidden) $("#show-workspace-button").focus();
    else if (trackViewHidden) $("#show-track-view-button").focus();
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
      pan: 0,
      muted: false,
      solo: false,
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
    const select = $("#sequencer-pattern-select");
    select.replaceChildren();
    state.patterns.forEach((pattern) => {
      const option = document.createElement("option");
      option.value = pattern.id;
      option.textContent = pattern.name;
      select.append(option);
    });
    select.value = state.selectedPatternId;
    const selected = getPattern();
    $("#grid-resolution-select").value = getPatternGridResolution(selected);
  }

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
          id: makeId(), name: mel.name, kind: "mel", instrumentId: mel.instrumentId, color: "#b5a0ff",
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
      const detectedNotes = estimateAudioPitchNotes(clip.buffer, clip.sourceOffsetSeconds || 0,
        clip.durationSeconds ?? clip.buffer.duration);
      const secondsPerBar = 240 / state.bpm;
      const maxTicks = 8 * PIANO_TICKS_PER_BAR;
      const clipSourceDuration = Math.max(0, Math.min(
        clip.buffer.duration - (clip.sourceOffsetSeconds || 0),
        clip.durationSeconds ?? clip.buffer.duration,
      ));
      const analyzedDuration = Math.min(clipSourceDuration, secondsPerBar * 8);
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
          const startTick = note.startSeconds / secondsPerBar * PIANO_TICKS_PER_BAR;
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
              (endSeconds - startSeconds) / secondsPerBar * PIANO_TICKS_PER_BAR)),
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
      const clipDurationBars = clipSourceDuration / secondsPerBar;
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
        const analysisLimit = clipSourceDuration > secondsPerBar * 8 ? " Only the first 8 bars were analyzed." : "";
        const noteType = mode === "audio"
          ? "audio-backed segments; drag pitched notes to tune them" : "editable instrument notes";
        showToast(`Created ${notes.length} ${noteType} from ${clip.name}.${analysisLimit}`);
      }
    } catch (error) {
      showToast(`Could not transcribe ${clip.name}: ${error.message || "unknown error"}`);
    }
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
      : "Drag across the bar ruler to select a loop section";
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
      state.pianoLoopEnabled = true;
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
      : pickerMode === "mel-track"
        ? "Choose an instrument for this track"
      : targetTrackId ? "Choose a row instrument" : "Choose an instrument";
    $("#step-instrument-dialog").showModal();
  }

  function getSoundDurationKey(track) {
    return track.sourceId || track.id;
  }

  function getSoundDurationScale(track) {
    return state.soundDurationEdits[getSoundDurationKey(track)] ?? 1;
  }

  function getLibrarySamplePlaybackBuffer(track) {
    const buffer = track.sample?.buffer;
    if (!buffer || state.soundReverseEdits[getSoundDurationKey(track)] !== true) return buffer;
    let reversedBuffer = reversedLibrarySampleBuffers.get(buffer);
    if (!reversedBuffer) {
      reversedBuffer = state.audioContext.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const source = buffer.getChannelData(channel);
        const destination = reversedBuffer.getChannelData(channel);
        for (let sample = 0; sample < source.length; sample += 1) {
          destination[sample] = source[source.length - sample - 1];
        }
      }
      reversedLibrarySampleBuffers.set(buffer, reversedBuffer);
    }
    return reversedBuffer;
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
    $("#sound-reverse-control").hidden = track.kind !== "sample";
    $("#sound-reverse-toggle").checked = track.kind === "sample" && state.soundReverseEdits[soundId] === true;
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

  function setSoundReverseFromMenu(isReversed) {
    const soundId = $("#sound-duration-menu").dataset.soundId;
    if (!soundId) return;
    if (isReversed) state.soundReverseEdits[soundId] = true;
    else delete state.soundReverseEdits[soundId];
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
    } else if (stepInstrumentPickerMode === "mel-track") {
      const melTrack = state.melTracks.find((track) => track.id === stepInstrumentTargetTrackId);
      if (!melTrack) {
        showToast("That instrument track no longer exists.");
        return;
      }
      melTrack.instrumentId = instrument.id;
      renderArrangement();
      saveState();
      showToast(`${instrument.name} assigned to ${melTrack.name}`);
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
      track.panNode?.disconnect();
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
      automation: normalizeTrackAutomation(source.automation),
      automationOpen: source.automationOpen === true,
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
    const note = {
      id: makeId(),
      trackId: instrument.id,
      midi: constrainPianoPitchToScale(midi),
      startTick,
      durationTicks,
      velocity: 0.8,
    };
    mel.notes.push(note);
    mel.notes.sort((left, right) => left.startTick - right.startTick);
    state.pianoNotes = mel.notes.map((item) => ({ ...item, trackId: instrument.id }));
    state.selectedPianoNoteId = note.id;
    state.selectedPianoNoteIds = new Set([note.id]);
    state.selectedArrangementItems.clear();
    updateArrangementSelection();
    const loopIndex = Math.floor(elapsedSeconds / (loopTicks / PIANO_TICKS_PER_BAR * secondsPerBar));
    state.scheduledPianoNotes.add(`${note.id}:${loopIndex}`);
    playPianoNote(instrument, state.audioContext.currentTime + 0.01, note.midi,
      durationTicks / PIANO_TICKS_PER_BAR * secondsPerBar, note.velocity);
    renderPianoRoll();
    renderArrangement();
    saveState();
    return true;
  }

  function getMasterPitchProcessorSource() {
    return `
      class DansBpmMasterPitchProcessor extends AudioWorkletProcessor {
        static get parameterDescriptors() {
          return [{ name: "semitones", defaultValue: 0, minValue: -12, maxValue: 12, automationRate: "k-rate" }];
        }
        constructor() {
          super();
          this.maxDelayFrames = Math.ceil(sampleRate * 0.1);
          this.bufferSize = this.maxDelayFrames + 2;
          this.buffers = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
          this.writeIndex = 0;
          this.phase = 0.25;
        }
        read(channel, delay) {
          const buffer = this.buffers[channel];
          let position = this.writeIndex - delay;
          while (position < 0) position += this.bufferSize;
          const firstIndex = Math.floor(position);
          const fraction = position - firstIndex;
          const first = buffer[firstIndex];
          const second = buffer[(firstIndex + 1) % this.bufferSize];
          return first + (second - first) * fraction;
        }
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          const output = outputs[0];
          if (!output.length) return true;
          const semitones = parameters.semitones[0];
          const ratio = Math.pow(2, semitones / 12);
          const shift = Math.abs(1 - ratio);
          for (let frame = 0; frame < output[0].length; frame += 1) {
            for (let channel = 0; channel < output.length; channel += 1) {
              const sample = input[channel]?.[frame] ?? input[0]?.[frame] ?? 0;
              this.buffers[channel][this.writeIndex] = sample;
              if (Math.abs(semitones) < 0.001) {
                output[channel][frame] = sample;
                continue;
              }
              const phaseA = this.phase;
              const phaseB = (phaseA + 0.5) % 1;
              const delayA = (semitones > 0 ? 1 - phaseA : phaseA) * this.maxDelayFrames;
              const delayB = (semitones > 0 ? 1 - phaseB : phaseB) * this.maxDelayFrames;
              const mixA = 0.5 - 0.5 * Math.cos(2 * Math.PI * phaseA);
              output[channel][frame] = this.read(channel, delayA) * mixA +
                this.read(channel, delayB) * (1 - mixA);
            }
            if (shift) {
              this.phase += shift / this.maxDelayFrames;
              if (this.phase >= 1) this.phase -= Math.floor(this.phase);
            }
            this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
          }
          return true;
        }
      }
      registerProcessor("dansbpm-master-pitch", DansBpmMasterPitchProcessor);
    `;
  }

  async function connectMasterPitchProcessor(context) {
    if (context === state.audioContext) await applySelectedAudioOutput(context);
    if (state.masterPitchNode?.context === context) return state.masterPitchNode;
    if (!context.audioWorklet || typeof window.AudioWorkletNode !== "function") {
      state.masterPitchSupported = false;
      if (state.masterPitch !== 0) showToast("Master pitch shifting is not supported in this browser.");
      updateProjectKeyIndicator();
      state.masterGain.connect(context.destination);
      state.masterPitchNode = null;
      return null;
    }
    state.masterPitchSupported = true;
    const source = new Blob([getMasterPitchProcessorSource()], { type: "text/javascript" });
    const moduleUrl = URL.createObjectURL(source);
    try {
      await context.audioWorklet.addModule(moduleUrl);
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }
    const node = new window.AudioWorkletNode(context, "dansbpm-master-pitch", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      channelCount: 2,
      channelCountMode: "explicit",
    });
    node.parameters.get("semitones").setValueAtTime(state.masterPitch, context.currentTime);
    state.masterGain.connect(node);
    node.connect(context.destination);
    state.masterPitchNode = node;
    return node;
  }

  async function initializeAudio() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Web Audio is not supported in this browser.");
      state.audioContext = new AudioContext();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.gain.value = 0.82;
      await connectMasterPitchProcessor(state.audioContext);
      ensureTrackAudio(state.masterTrack);
      state.effectTracks.forEach(ensureTrackAudio);
      state.tracks.forEach(ensureSequencerTrackAudio);
      state.noiseBuffer = createNoiseBuffer(state.audioContext);
    }
    await connectMasterPitchProcessor(state.audioContext);
    ensureTrackAudio(state.masterTrack);
    state.effectTracks.forEach(ensureTrackAudio);
    state.arrangementTracks.forEach(ensureArrangementTrackAudio);
    state.melTracks.forEach(ensureTrackAudio);
    state.patterns.forEach(ensureTrackAudio);
    return state.audioContext;
  }

  async function ensureAudio() {
    const context = await initializeAudio();
    return context.resume();
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    const random = createSeededRandom(0x6d2b79f5);
    for (let index = 0; index < data.length; index += 1) data[index] = random() * 2 - 1;
    return buffer;
  }

  function createSeededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 0x100000000;
    };
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
    if (!isApplyingUndo) recordUndoSnapshot("dj");
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
      const rate = getDjRate(deck);
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

  function updateDjAudioRate(deck, updateRate, timeConstant = 0.015) {
    const now = state.audioContext?.currentTime ?? 0;
    const position = deck.playing && getDjSource(deck.sourceKey)?.type === "audio"
      ? getDjVisualPosition(deck)
      : null;
    const fromRate = deck.audioSource ? getDjAudioRateAt(deck, now) : getDjRate(deck);
    updateRate();
    if (position === null || !deck.audioSource || !state.audioContext) return;
    deck.visualPosition = position;
    deck.visualStartPosition = position;
    deck.visualStartTime = now;
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
      const currentBar = deck.songPositionBar + Math.max(0, state.audioContext.currentTime - deck.songAnchorTime) / secondsPerBar;
      return Math.min(deck.songDurationBars * PIANO_TICKS_PER_BAR, currentBar * PIANO_TICKS_PER_BAR);
    }
    if (!deck.playing || !state.audioContext || !Number.isFinite(deck.visualStartTime)) {
      return Number.isFinite(deck.visualPosition) ? deck.visualPosition : startPosition;
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
      return startPosition + advance;
    }
    return startPosition + elapsed * state.bpm / 60 * 8 * getDjRate(deck);
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
        deck.audioRateFrom = getDjRate(deck);
        deck.audioRateTarget = deck.audioRateFrom;
        deck.audioRateStartTime = startTime;
        deck.audioRateTimeConstant = 0;
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
    const lookAhead = AUDIO_SCHEDULER_LOOKAHEAD;
    const endTime = deck.songEndTime;
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
    deck.audioRateFrom = getDjRate(deck);
    deck.audioRateTarget = deck.audioRateFrom;
    deck.audioRateStartTime = startTime;
    deck.audioRateTimeConstant = 0;
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
    const lookAhead = AUDIO_SCHEDULER_LOOKAHEAD;
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
    const { notes, instrument, loopBars } = getPianoPlaybackSource();
    if (!notes || !instrument) return;
    schedulePianoMelLoopNotes(notes, instrument, player.startTime, now, lookAhead,
      player.scheduledMelNotes, loopBars, player.startTick || 0);
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

  function estimateAudioPitchNotes(buffer, sourceOffsetSeconds = 0, durationSeconds = buffer.duration) {
    const secondsPerBar = 240 / state.bpm;
    const sourceOffset = Math.max(0, Math.min(buffer.duration, sourceOffsetSeconds));
    const sourceDuration = Math.max(0, Math.min(buffer.duration - sourceOffset, durationSeconds));
    const analysisDuration = Math.min(sourceDuration, secondsPerBar * 8);
    const stride = Math.max(1, Math.floor(buffer.sampleRate / 22050));
    const sampleRate = buffer.sampleRate / stride;
    const sourceStartSample = Math.floor(sourceOffset * buffer.sampleRate);
    const sampleCount = Math.min(buffer.length - sourceStartSample,
      Math.ceil(analysisDuration * buffer.sampleRate));
    const frameSize = 4096;
    const hopSize = Math.max(1, Math.floor(sampleRate * 0.055));
    if (sampleCount < frameSize * stride) return [];

    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
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
    const magnitudes = new Float32Array(frameSize / 2);
    const framesByMidi = new Map();
    const frameEnd = sampleCount - frameSize * stride;

    for (let offset = 0; offset <= frameEnd; offset += hopSize * stride) {
      let frameEnergy = 0;
      for (let index = 0; index < frameSize; index += 1) {
        let sample = 0;
        const sourceIndex = sourceStartSample + offset + index * stride;
        channels.forEach((channel) => { sample += channel[sourceIndex] || 0; });
        sample /= channels.length;
        frameEnergy += sample * sample;
        real[reversedIndices[index]] = sample * window[index];
        imaginary[reversedIndices[index]] = 0;
      }
      if (frameEnergy / frameSize < 0.0000005) continue;

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

      let maximum = 0;
      for (let bin = 1; bin < frameSize / 2; bin += 1) {
        const magnitude = Math.hypot(real[bin], imaginary[bin]);
        magnitudes[bin] = magnitude;
        const frequency = bin * sampleRate / frameSize;
        if (frequency >= 55 && frequency <= 1600) maximum = Math.max(maximum, magnitude);
      }
      if (maximum < 0.001) continue;

      const candidates = [];
      for (let bin = Math.max(1, Math.floor(55 * frameSize / sampleRate));
        bin < Math.min(frameSize / 2 - 1, Math.ceil(1600 * frameSize / sampleRate)); bin += 1) {
        const magnitude = magnitudes[bin];
        if (magnitude < maximum * 0.18 || magnitude < magnitudes[bin - 1] || magnitude < magnitudes[bin + 1]) continue;
        const left = magnitudes[bin - 1];
        const right = magnitudes[bin + 1];
        const curvature = left - 2 * magnitude + right;
        const correction = curvature ? Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / curvature)) : 0;
        const frequency = (bin + correction) * sampleRate / frameSize;
        const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
        if (midi < PIANO_BOTTOM_MIDI || midi > PIANO_TOP_MIDI) continue;
        candidates.push({ midi, frequency, magnitude });
      }
      candidates.sort((left, right) => right.magnitude - left.magnitude);
      const accepted = [];
      candidates.forEach((candidate) => {
        if (accepted.some((item) => item.midi === candidate.midi)) return;
        const isHarmonic = accepted.some((item) => {
          const ratio = candidate.frequency / item.frequency;
          const harmonic = Math.round(ratio);
          return harmonic >= 2 && harmonic <= 6 &&
            Math.abs(ratio - harmonic) < 0.045 && item.magnitude >= candidate.magnitude * 0.85;
        });
        if (!isHarmonic && accepted.length < 6) accepted.push(candidate);
      });

      const frameIndex = Math.round(offset / (hopSize * stride));
      accepted.forEach(({ midi, magnitude }) => {
        if (!framesByMidi.has(midi)) framesByMidi.set(midi, []);
        framesByMidi.get(midi).push({ frameIndex, strength: magnitude / maximum });
      });
    }

    const notes = [];
    const secondsPerFrame = hopSize / sampleRate;
    framesByMidi.forEach((frames, midi) => {
      let startFrame = frames[0]?.frameIndex;
      let previousFrame = startFrame;
      let strength = 0;
      let count = 0;
      const emit = (endFrame) => {
        const startSeconds = startFrame * secondsPerFrame;
        const endSeconds = Math.min(analysisDuration, (endFrame + 1) * secondsPerFrame);
        if (endSeconds - startSeconds >= 0.075) {
          notes.push({
            midi,
            startSeconds,
            endSeconds,
            velocity: Math.max(0.35, Math.min(0.95, 0.45 + strength / Math.max(1, count) * 0.5)),
          });
        }
      };
      frames.forEach((frame, index) => {
        if (index && frame.frameIndex > previousFrame + 2) {
          emit(previousFrame);
          startFrame = frame.frameIndex;
          strength = 0;
          count = 0;
        }
        previousFrame = frame.frameIndex;
        strength += frame.strength;
        count += 1;
      });
      if (count) emit(previousFrame);
    });
    return notes.sort((left, right) => left.startSeconds - right.startSeconds || left.midi - right.midi).slice(0, 4096);
  }

  function normalizeAudioMetadata(metadata) {
    return {
      bpm: Number.isFinite(metadata?.bpm) && metadata.bpm >= 40 && metadata.bpm <= 240
        ? Math.round(metadata.bpm) : null,
      key: typeof metadata?.key === "string" && /^[A-G]#? (major|minor)$/.test(metadata.key)
        ? metadata.key : null,
    };
  }

  function getProjectKey() {
    const chroma = Array(12).fill(0);
    const addKeyProfile = (key) => {
      const match = /^([A-G]#?) (major|minor)$/.exec(key || "");
      if (!match) return;
      const tonic = MUSICAL_KEY_NAMES.indexOf(match[1]);
      const profile = MUSICAL_KEY_PROFILES[match[2] === "major" ? 0 : 1];
      const weight = 2 / profile.reduce((sum, value) => sum + value, 0);
      profile.forEach((value, index) => { chroma[(tonic + index) % 12] += value * weight; });
    };
    const addNotes = (notes) => {
      if (!Array.isArray(notes)) return;
      notes.forEach((note) => {
        if (!Number.isFinite(note?.midi)) return;
        const weight = Math.max(0.1, (note.durationTicks || 8) / 8) *
          Math.max(0.1, Math.min(1, note.velocity ?? 0.8));
        chroma[(Math.round(note.midi) % 12 + 12) % 12] += weight;
      });
    };

    state.mels.forEach((mel) => addNotes(mel.notes));
    state.patterns.forEach((pattern) => Object.values(pattern.stepPianoNotes || {}).forEach(addNotes));
    state.tracks.forEach((track) => addKeyProfile(normalizeAudioMetadata(track.audioMetadata).key));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) =>
      addKeyProfile(normalizeAudioMetadata(clip.audioMetadata).key)));

    const key = getKeyFromChroma(chroma);
    if (!key) return null;
    const [tonic, mode] = key.split(" ");
    const activePitch = state.masterPitchSupported === false ? 0 : state.masterPitch;
    const shiftedTonic = (MUSICAL_KEY_NAMES.indexOf(tonic) + activePitch % 12 + 12) % 12;
    return `${MUSICAL_KEY_NAMES[shiftedTonic]} ${mode}`;
  }

  function updateProjectKeyIndicator() {
    const key = getProjectKey();
    const keyValue = $("#project-key-value");
    if (keyValue) keyValue.textContent = key ? key.replace("major", "maj").replace("minor", "min") : "—";
    const keyControl = $("#project-key-control");
    if (keyControl) keyControl.title = key ? `Detected project key: ${key}` : "Project key is unclear";
    const pitchInput = $("#master-pitch-control");
    const pitchValue = $("#master-pitch-value");
    if (pitchInput) {
      pitchInput.value = String(state.masterPitch);
      pitchInput.disabled = state.masterPitchSupported === false;
    }
    if (pitchValue) pitchValue.textContent = `${state.masterPitch > 0 ? "+" : ""}${state.masterPitch} st`;
    const dial = pitchInput?.closest(".master-pitch-dial");
    if (dial) {
      const ratio = (state.masterPitch + 12) / 24;
      dial.style.setProperty("--dj-dial-angle", `${-135 + ratio * 270}deg`);
      dial.style.setProperty("--dj-dial-fill", `${ratio * 270}deg`);
    }
    const pitch = state.masterPitchNode?.context === state.audioContext
      ? state.masterPitchNode.parameters.get("semitones")
      : null;
    if (pitch && state.audioContext) pitch.setTargetAtTime(state.masterPitch, state.audioContext.currentTime, 0.02);
  }

  function setMasterPitch(value) {
    if (state.masterPitchSupported === false) {
      showToast("Master pitch shifting is not supported in this browser.");
      updateProjectKeyIndicator();
      return;
    }
    state.masterPitch = Math.max(-12, Math.min(12, Math.round(Number(value) || 0)));
    updateProjectKeyIndicator();
    saveState();
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
      automation: normalizeTrackAutomation(),
      automationOpen: false,
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
    if (!track.panNode) {
      track.panNode = state.audioContext.createStereoPanner();
      track.panNode.pan.value = track.pan;
    }
    if (!track.automationGainNode) {
      track.automationGainNode = state.audioContext.createGain();
      track.automationGainNode.gain.value = 1;
    }
    if (!track.gainNode) {
      track.gainNode = state.audioContext.createGain();
      track.gainNode.gain.value = track.muted ? 0 : track.volume;
      updateTrackGains();
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
    if (!track.panNode) {
      track.panNode = context.createStereoPanner();
      track.panNode.pan.value = track.pan;
    }
    if (!track.automationGainNode) {
      track.automationGainNode = context.createGain();
      track.automationGainNode.gain.value = 1;
    }
    track.fxRuntime = [];
    track.gainNode.disconnect();
    track.automationGainNode.disconnect();
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
    track.panNode.disconnect();
    output.connect(track.automationGainNode);
    track.automationGainNode.connect(track.panNode);
    track.panNode.connect(getTrackOutputNode(track));
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
    track.automationGainNode?.disconnect();
    track.panNode?.disconnect();
    track.gainNode = null;
    track.automationGainNode = null;
    track.panNode = null;
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

    if (["reverb", "room", "hall", "plate"].includes(id)) {
      const convolver = context.createConvolver();
      const decay = setting("decay", id === "hall" ? 3.2 : id === "room" ? 0.7 : id === "plate" ? 2.2 : 1.8);
      const impulse = context.createBuffer(2, Math.floor(context.sampleRate * decay), context.sampleRate);
      const random = createSeededRandom(0x51f15e);
      const decayCurve = id === "room" ? 3.8 : id === "plate" ? 1.7 : 2.8;
      for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const samples = impulse.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          const earlyReflection = id === "plate" && index < context.sampleRate * 0.012 ? 1.7 : 1;
          samples[index] = (random() * 2 - 1) * earlyReflection *
            Math.pow(1 - index / samples.length, decayCurve);
        }
      }
      convolver.buffer = impulse;
      const preDelay = context.createDelay(0.13);
      preDelay.delayTime.value = setting("preDelay", id === "hall" ? 35 : id === "room" ? 8 : id === "plate" ? 15 : 20) / 1000;
      input.connect(preDelay);
      preDelay.connect(convolver);
      nodes.push(preDelay, convolver);
      effectOutput = convolver;
    } else if (id === "pingPong") {
      const splitter = context.createChannelSplitter(2);
      const merger = context.createChannelMerger(2);
      const leftDelay = context.createDelay(1);
      const rightDelay = context.createDelay(1);
      const leftFeedback = context.createGain();
      const rightFeedback = context.createGain();
      const delayTime = setting("time", 0.32);
      leftDelay.delayTime.value = delayTime;
      rightDelay.delayTime.value = delayTime;
      leftFeedback.gain.value = rightFeedback.gain.value = setting("feedback", 45) / 100;
      input.connect(splitter);
      splitter.connect(leftDelay, 0);
      splitter.connect(rightDelay, 1);
      leftDelay.connect(rightFeedback);
      rightFeedback.connect(rightDelay);
      rightDelay.connect(leftFeedback);
      leftFeedback.connect(leftDelay);
      leftDelay.connect(merger, 0, 0);
      rightDelay.connect(merger, 0, 1);
      nodes.push(splitter, merger, leftDelay, rightDelay, leftFeedback, rightFeedback);
      effectOutput = merger;
    } else if (["delay", "slapback", "tapeDelay"].includes(id)) {
      const delay = context.createDelay(1);
      const defaultTime = id === "slapback" ? 0.11 : id === "tapeDelay" ? 0.36 : 0.28;
      delay.delayTime.value = setting("time", defaultTime);
      const feedback = context.createGain();
      feedback.gain.value = setting("feedback", id === "slapback" ? 18 : id === "tapeDelay" ? 48 : 42) / 100;
      if (id === "tapeDelay") {
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 4200;
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        input.connect(delay);
        nodes.push(filter, feedback, delay);
        effectOutput = filter;
      } else {
        delay.connect(feedback);
        feedback.connect(delay);
        nodes.push(feedback);
        connectWet(delay);
      }
    } else if (id === "chorus" || id === "flanger" || id === "vibrato" ||
      id === "pitchShifter" || id === "harmonizer") {
      const delay = context.createDelay(0.5);
      const modulation = context.createOscillator();
      const depth = context.createGain();
      const interval = id === "pitchShifter" ? Math.abs(setting("semitones", 0)) : setting("interval", 7);
      delay.delayTime.value = id === "flanger" ? 0.005 : id === "vibrato" ? 0.02
        : id === "chorus" ? setting("depth", 12) / 1000 : 0.035 + interval * 0.006;
      modulation.frequency.value = id === "chorus" ? setting("rate", 0.28)
        : id === "flanger" || id === "vibrato" ? setting("rate", id === "vibrato" ? 5 : 0.22)
          : id === "harmonizer" ? 0.7 : 0.45;
      depth.gain.value = id === "chorus" ? setting("depth", 12) / 1000
        : id === "flanger" ? setting("depth", 3) / 1000 * mix
          : id === "vibrato" ? setting("depth", 5) / 1000 * mix : 0.035 * mix;
      modulation.connect(depth);
      depth.connect(delay.delayTime);
      modulation.start();
      sources.push(modulation);
      nodes.push(depth);
      if (id === "flanger") {
        const feedback = context.createGain();
        feedback.gain.value = setting("feedback", 20) / 100;
        delay.connect(feedback);
        feedback.connect(delay);
        nodes.push(feedback);
      }
      connectWet(delay);
    } else if (id === "gain") {
      const gain = context.createGain();
      gain.gain.value = Math.pow(10, setting("gainDb", 6) / 20);
      connectWet(gain);
    } else if (id === "distortion" || id === "saturator" || id === "softClipper" || id === "bitcrusher") {
      const shaper = context.createWaveShaper();
      const curve = new Float32Array(4096);
      const drive = setting("drive", id === "saturator" ? 3 : id === "softClipper" ? 2 : 8);
      const levels = Math.pow(2, setting("bits", 8));
      for (let index = 0; index < curve.length; index += 1) {
        const sample = index * 2 / (curve.length - 1) - 1;
        curve[index] = id === "bitcrusher"
          ? Math.round(sample * levels) / levels
          : id === "softClipper"
            ? sample * drive / (1 + Math.abs(sample * drive))
            : Math.tanh(sample * drive);
      }
      shaper.curve = curve;
      shaper.oversample = "4x";
      connectWet(shaper);
    } else if (id === "multibandCompressor") {
      const lowCrossover = setting("lowCrossover", 180);
      const highCrossover = Math.max(lowCrossover + 100, setting("highCrossover", 3500));
      const attack = setting("attack", 10) / 1000;
      const release = setting("release", 180) / 1000;
      const sum = context.createGain();
      const configureFilter = (filter, type, frequency) => {
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = Math.SQRT1_2;
        nodes.push(filter);
      };
      const connectBand = (filters, thresholdKey, ratioKey, gainKey) => {
        let previous = input;
        filters.forEach(([type, frequency]) => {
          const filter = context.createBiquadFilter();
          configureFilter(filter, type, frequency);
          previous.connect(filter);
          previous = filter;
        });
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = setting(thresholdKey, -18);
        compressor.knee.value = 6;
        compressor.ratio.value = setting(ratioKey, 3);
        compressor.attack.value = attack;
        compressor.release.value = release;
        const makeup = context.createGain();
        makeup.gain.value = Math.pow(10, setting(gainKey, 0) / 20);
        previous.connect(compressor);
        compressor.connect(makeup);
        makeup.connect(sum);
        nodes.push(compressor, makeup);
      };
      connectBand([["lowpass", lowCrossover], ["lowpass", lowCrossover]],
        "lowThreshold", "lowRatio", "lowGain");
      connectBand([
        ["highpass", lowCrossover], ["highpass", lowCrossover],
        ["lowpass", highCrossover], ["lowpass", highCrossover],
      ],
        "midThreshold", "midRatio", "midGain");
      connectBand([["highpass", highCrossover], ["highpass", highCrossover]],
        "highThreshold", "highRatio", "highGain");
      nodes.push(sum);
      effectOutput = sum;
    } else if (id === "compressor" || id === "limiter" || id === "noiseGate" || id === "transientShaper") {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = id === "noiseGate" ? setting("threshold", -42)
        : id === "limiter" ? setting("threshold", -1)
          : id === "transientShaper" ? -18 - setting("attack", 3)
            : setting("threshold", -18);
      compressor.knee.value = id === "noiseGate" || id === "limiter" ? 0 : 12;
      compressor.ratio.value = id === "noiseGate" || id === "limiter" ? 20
        : id === "transientShaper" ? Math.max(1, 5 + setting("sustain", -2) / 3)
          : setting("ratio", 4);
      compressor.attack.value = id === "transientShaper" ? 0.003 : id === "limiter" ? 0.001 : setting("attack", 3) / 1000;
      compressor.release.value = id === "transientShaper" ? 0.08 : setting("release", id === "limiter" ? 80 : 180) / 1000;
      connectWet(compressor);
    } else if (id === "tremolo" || id === "lfoGain") {
      const tremolo = context.createGain();
      tremolo.gain.value = id === "lfoGain" ? 0.5 : 0.55;
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", id === "lfoGain" ? 2 : 5);
      depth.gain.value = setting("depth", id === "lfoGain" ? 50 : 45) / (id === "lfoGain" ? 200 : 100) * mix;
      oscillator.connect(depth);
      depth.connect(tremolo.gain);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(tremolo);
    } else if (id === "autoFilter") {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 5000;
      const oscillator = context.createOscillator();
      const depth = context.createGain();
      oscillator.frequency.value = setting("rate", 0.4);
      depth.gain.value = setting("depth", 2200) * mix;
      oscillator.connect(depth);
      depth.connect(filter.frequency);
      oscillator.start();
      sources.push(oscillator);
      nodes.push(depth);
      connectWet(filter);
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

  function getArrangementClipRepeatLength(type, clip) {
    if (type === "pattern") return (getPattern(clip.patternId)?.steps || 16) / 16;
    if (type === "mel") return getMelLengthBars(getMel(clip.melId) || { bars: 1, notes: [] });
    return Math.max(0.01, clip.buffer.duration) / (240 / state.bpm);
  }

  function getAudioClipSegments(clip, fromBar = clip.startBar, toBar = Infinity) {
    const secondsPerBar = 240 / state.bpm;
    const sourceOffset = Math.max(0, clip.sourceOffsetSeconds || 0);
    const sourceDuration = Math.max(0, clip.buffer.duration);
    const segments = [];
    if (!sourceDuration) return segments;
    const clipDuration = getArrangementClipDuration("audio", clip);
    const playableDuration = Math.min(clipDuration, sourceDuration * (clip.repeatCount || 1) - sourceOffset);
    let elapsed = 0;
    while (elapsed < playableDuration) {
      const position = sourceOffset + elapsed;
      const offsetInBuffer = position % sourceDuration;
      const segmentDuration = Math.min(sourceDuration - offsetInBuffer, playableDuration - elapsed);
      const segmentStart = clip.startBar + elapsed / secondsPerBar;
      const segmentEnd = segmentStart + segmentDuration / secondsPerBar;
      if (segmentEnd > fromBar && segmentStart < toBar) {
        const audibleStart = Math.max(segmentStart, fromBar);
        const audibleEnd = Math.min(segmentEnd, toBar);
        segments.push({
          startBar: audibleStart,
          sourceOffsetSeconds: offsetInBuffer + (audibleStart - segmentStart) * secondsPerBar,
          durationSeconds: (audibleEnd - audibleStart) * secondsPerBar,
          loopIndex: Math.floor(position / sourceDuration),
        });
      }
      elapsed += segmentDuration;
    }
    return segments;
  }

  function getMelClipNoteEvents(mel, clip) {
    const melBars = getMelLengthBars(mel);
    const sourceOffset = clip.sourceOffsetBars || 0;
    const sourceEnd = Math.min(melBars * (clip.repeatCount || 1),
      sourceOffset + getArrangementClipDuration("mel", clip));
    const events = [];
    mel.notes.forEach((note) => {
      const noteStart = note.startTick / PIANO_TICKS_PER_BAR;
      const noteEnd = noteStart + note.durationTicks / PIANO_TICKS_PER_BAR;
      const firstLoop = Math.max(0, Math.floor(sourceOffset / melBars));
      const lastLoop = Math.ceil(sourceEnd / melBars);
      for (let loop = firstLoop; loop < lastLoop; loop += 1) {
        const noteStartSource = loop * melBars + noteStart;
        const noteEndSource = loop * melBars + noteEnd;
        const audibleStart = Math.max(sourceOffset, noteStartSource);
        const audibleEnd = Math.min(sourceEnd, noteEndSource);
        if (audibleEnd <= audibleStart) continue;
        events.push({
          note,
          loop,
          startBar: clip.startBar + audibleStart - sourceOffset,
          endBar: clip.startBar + audibleEnd - sourceOffset,
        });
      }
    });
    return events;
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

  function makeArrangementTrackControls(track, includeRecordingButton = false) {
    const actions = document.createElement("div");
    actions.className = "arrangement-label-actions";
    if (includeRecordingButton) {
      const add = document.createElement("button");
      add.type = "button";
      add.title = "Add a recording to this track";
      add.setAttribute("aria-label", `Add recording to ${track.name}`);
      add.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>';
      add.addEventListener("click", () => requestRecordingImport(track.id));
      actions.append(add);
    }
    const mute = document.createElement("button");
    mute.type = "button";
    mute.className = track.muted ? "is-active" : "";
    mute.title = track.muted ? "Unmute track" : "Mute track";
    mute.setAttribute("aria-label", `${mute.title}: ${track.name}`);
    mute.setAttribute("aria-pressed", String(Boolean(track.muted)));
    mute.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" /><path d="m14 8 4 4m0-4-4 4" /></svg>';
    mute.addEventListener("click", (event) => {
      event.stopPropagation();
      track.muted = !track.muted;
      updateTrackGains();
      renderArrangement();
      saveState();
    });
    const solo = document.createElement("button");
    solo.type = "button";
    solo.className = track.solo ? "is-active" : "";
    solo.textContent = "S";
    solo.title = track.solo ? "Unsolo track" : "Solo track";
    solo.setAttribute("aria-label", `${solo.title}: ${track.name}`);
    solo.setAttribute("aria-pressed", String(Boolean(track.solo)));
    solo.addEventListener("click", (event) => {
      event.stopPropagation();
      track.solo = !track.solo;
      updateTrackGains();
      renderArrangement();
      saveState();
    });
    actions.append(mute, solo, makeOpenMixerButton(track));
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
    volume.addEventListener("change", saveState);
    return { actions, volume };
  }

  function getArrangementLoopRange() {
    const startBar = Math.max(0, Math.min(state.arrangementBars - 1, state.arrangementLoopStartBar));
    const endBar = Math.max(startBar + 1, Math.min(state.arrangementBars, state.arrangementLoopEndBar));
    return { startBar, endBar };
  }

  function updateArrangementLoopUI() {
    const ruler = $("#timeline-content").querySelector(".timeline-ruler");
    if (ruler) {
      ruler.querySelector(".arrangement-loop-range")?.remove();
      const { startBar, endBar } = getArrangementLoopRange();
      const range = document.createElement("div");
      range.className = `arrangement-loop-range${state.arrangementLoopEnabled ? "" : " is-disabled"}`;
      range.style.left = `${startBar * BAR_WIDTH}px`;
      range.style.width = `${(endBar - startBar) * BAR_WIDTH}px`;
      ruler.append(range);
    }
    const button = $("#arrangement-loop-button");
    button.textContent = `LOOP ${state.arrangementLoopEnabled ? "ON" : "OFF"}`;
    button.setAttribute("aria-pressed", String(state.arrangementLoopEnabled));
    const { startBar, endBar } = getArrangementLoopRange();
    button.title = state.arrangementLoopEnabled
      ? `Loop bars ${startBar + 1}-${Math.ceil(endBar)}; drag the ruler to change the section`
      : "Drag across the bar ruler to select a loop section";
  }

  function startArrangementLoopRangeSelection(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const ruler = event.currentTarget;
    const bounds = ruler.getBoundingClientRect();
    const pointerBar = (clientX) => Math.max(0, Math.min(state.arrangementBars, (clientX - bounds.left) / BAR_WIDTH));
    const anchorBar = pointerBar(event.clientX);
    const startX = event.clientX;
    let hasDragged = false;
    const updateRange = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 4) hasDragged = true;
      if (!hasDragged) return;
      const currentBar = pointerBar(moveEvent.clientX);
      const startBar = Math.max(0, Math.min(state.arrangementBars - 1, Math.floor(Math.min(anchorBar, currentBar))));
      const endBar = Math.max(startBar + 1,
        Math.min(state.arrangementBars, Math.ceil(Math.max(anchorBar, currentBar))));
      state.arrangementLoopStartBar = startBar;
      state.arrangementLoopEndBar = endBar;
      state.arrangementLoopEnabled = true;
      updateArrangementLoopUI();
    };
    const finish = () => {
      document.removeEventListener("pointermove", updateRange);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      if (!hasDragged) return;
      state.suppressArrangementClick = true;
      window.setTimeout(() => { state.suppressArrangementClick = false; }, 0);
      if (state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
      state.arrangementCursor = state.arrangementLoopStartBar;
      updateArrangementCursorMarker();
      saveState();
    };
    document.addEventListener("pointermove", updateRange);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function startArrangementRulerInteraction(event) {
    const ruler = event.currentTarget;
    const bounds = ruler.getBoundingClientRect();
    if (event.clientY < bounds.top + bounds.height / 2) {
      startArrangementLoopRangeSelection(event);
    } else {
      startArrangementCursorDrag(event);
    }
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
    const automationLabelsByTrackId = new Map();
    const automationLanesByTrackId = new Map();
    labels.replaceChildren();
    content.replaceChildren();
    content.style.width = `${width}px`;

    const ruler = document.createElement("div");
    ruler.className = "timeline-ruler";
    ruler.style.width = `${width}px`;
    ruler.style.gridTemplateColumns = `repeat(${state.arrangementBars}, ${BAR_WIDTH}px)`;
    ruler.addEventListener("pointerdown", startArrangementRulerInteraction);
    for (let bar = 0; bar < state.arrangementBars; bar += 1) {
      const marker = document.createElement("div");
      marker.className = "timeline-bar";
      marker.textContent = `BAR ${String(bar + 1).padStart(2, "0")}`;
      ruler.append(marker);
    }
    const { startBar: loopStartBar, endBar: loopEndBar } = getArrangementLoopRange();
    const loopRange = document.createElement("div");
    loopRange.className = `arrangement-loop-range${state.arrangementLoopEnabled ? "" : " is-disabled"}`;
    loopRange.style.left = `${loopStartBar * BAR_WIDTH}px`;
    loopRange.style.width = `${(loopEndBar - loopStartBar) * BAR_WIDTH}px`;
    ruler.append(loopRange);
    const rulerPlayhead = document.createElement("div");
    rulerPlayhead.className = "arrangement-ruler-playhead";
    rulerPlayhead.setAttribute("aria-hidden", "true");
    ruler.append(rulerPlayhead);
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
      const controls = makeArrangementTrackControls(pattern);
      controls.actions.append(makeAutomationToggle(pattern));
      label.append(controls.actions, controls.volume);
      labels.append(label);

      const lane = createTimelineLane(`pattern:${pattern.id}`, width);
      state.patternClips
        .filter((clip) => (clip.trackId || clip.patternId) === pattern.id)
        .forEach((clip) => lane.append(createPatternClip(clip)));
      content.append(lane);
      appendAutomationRows(pattern, width, labels, content, automationLabelsByTrackId, automationLanesByTrackId);
    });

    state.melTracks.forEach((track) => {
      const label = document.createElement("div");
      label.className = `arrangement-label${state.selectedMixerTrackId === track.id ? " is-track-selected" : ""}`;
      label.dataset.trackId = track.id;
      label.style.setProperty("--track-color", track.color);
      label.innerHTML = '<span class="track-color"></span><div class="arrangement-label-info"><div class="arrangement-label-name"></div><div class="arrangement-label-type"></div></div>';
      label.querySelector(".arrangement-label-name").textContent = track.name;
      const instrument = getPianoTrack(track.instrumentId);
      const type = label.querySelector(".arrangement-label-type");
      type.classList.add("mel-track-type");
      type.append("Mel · ");
      const chooseInstrument = document.createElement("button");
      chooseInstrument.className = "mel-track-instrument-button";
      chooseInstrument.type = "button";
      chooseInstrument.textContent = instrument?.name || "Choose instrument";
      chooseInstrument.title = `Choose instrument for ${track.name}`;
      chooseInstrument.setAttribute("aria-label", `Choose instrument for ${track.name}`);
      chooseInstrument.setAttribute("aria-haspopup", "dialog");
      chooseInstrument.setAttribute("aria-controls", "step-instrument-dialog");
      chooseInstrument.addEventListener("click", (event) => {
        event.stopPropagation();
        selectArrangementTrack(track.id);
        openStepInstrumentPicker(track.id, "mel-track");
      });
      type.append(chooseInstrument);
      label.addEventListener("click", (event) => {
        if (!event.target.closest(".mixer-track-button")) selectArrangementTrack(track.id);
      });
      const controls = makeArrangementTrackControls(track);
      controls.actions.append(makeAutomationToggle(track));
      label.append(controls.actions, controls.volume);
      labels.append(label);
      const lane = createTimelineLane(`mel:${track.id}`, width);
      track.clips.forEach((clip) => lane.append(createMelClipElement(track, clip)));
      content.append(lane);
      appendAutomationRows(track, width, labels, content, automationLabelsByTrackId, automationLanesByTrackId);
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
      const isRecording = state.recordingPreview?.track === track;
      type.textContent = `${track.clips.length} recording${track.clips.length === 1 ? "" : "s"}${isRecording ? " · recording" : ""}`;
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
      const solo = document.createElement("button");
      solo.type = "button";
      solo.className = track.solo ? "is-active" : "";
      solo.textContent = "S";
      solo.title = track.solo ? "Unsolo track" : "Solo track";
      solo.setAttribute("aria-label", `${solo.title}: ${track.name}`);
      solo.setAttribute("aria-pressed", String(Boolean(track.solo)));
      solo.addEventListener("click", (event) => {
        event.stopPropagation();
        track.solo = !track.solo;
        updateTrackGains();
        renderArrangement();
        saveState();
      });
      actions.append(add, mute, solo, makeOpenMixerButton(track), makeAutomationToggle(track));
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
      appendAutomationRows(track, width, labels, content, automationLabelsByTrackId, automationLanesByTrackId);
    });

    const rows = [
      ...patternTracks.map((track) => ({ id: track.id, type: "pattern" })),
      ...state.melTracks.map((track) => ({ id: track.id, type: "mel" })),
      ...state.arrangementTracks.map((track) => ({ id: track.id, type: "audio" })),
    ];
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const childrenByParent = new Map();
    const childIds = new Set();
    [...state.melTracks, ...state.arrangementTracks].forEach((track) => {
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
    const orderedLabels = orderedRows.flatMap((row) => [
      labelsById.get(row.id),
      ...(automationLabelsByTrackId.get(row.id) || []),
    ]).filter(Boolean);
    const orderedLanes = orderedRows.flatMap((row) => [
      lanesById.get(row.type === "pattern" ? `pattern:${row.id}` : row.type === "mel" ? `mel:${row.id}` : row.id),
      ...(automationLanesByTrackId.get(row.id) || []),
    ]).filter(Boolean);
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
    updateArrangementLoopUI();
    updateArrangementCursorMarker();
    updateArrangementSelection();
    updateProjectKeyIndicator();
    if (state.view === "mixer") renderMixer();
  }

  function makeAutomationToggle(track) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `automation-toggle${track.automationOpen ? " is-active" : ""}`;
    button.textContent = "A";
    button.title = `${track.automationOpen ? "Hide" : "Show"} volume and pan automation`;
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(Boolean(track.automationOpen)));
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      track.automationOpen = !track.automationOpen;
      renderArrangement();
      saveState();
    });
    return button;
  }

  function appendAutomationRows(track, width, labels, content, labelsByTrack, lanesByTrack) {
    if (!track.automationOpen) return;
    const properties = ["volume", "pan"];
    const automationLabels = properties.map((property) => {
      const label = document.createElement("div");
      label.className = "automation-label";
      label.textContent = property === "volume" ? "VOL AUTOMATION" : "PAN AUTOMATION";
      label.style.setProperty("--track-color", track.color || "var(--accent)");
      return label;
    });
    const automationLanes = properties.map((property) => createArrangementAutomationLane(track, property, width));
    labelsByTrack.set(track.id, automationLabels);
    lanesByTrack.set(track.id, automationLanes);
    automationLabels.forEach((label) => labels.append(label));
    automationLanes.forEach((lane) => content.append(lane));
  }

  function drawArrangementAutomationLane(lane, track, property, activeIndex = -1) {
    const svg = lane.querySelector("svg");
    svg.replaceChildren();
    const width = Math.max(1, state.arrangementBars * BAR_WIDTH);
    const height = 42;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const points = normalizeTrackAutomation(track.automation)[property]
      .map((point, index) => ({ ...point, index }));
    if (points.length) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "automation-curve");
      path.setAttribute("d", points.map((point, index) => {
        const x = point.bar * BAR_WIDTH;
        const y = property === "volume"
          ? height - 6 - point.value * (height - 12)
          : height - 6 - (point.value + 1) / 2 * (height - 12);
        return `${index ? "L" : "M"}${x},${y}`;
      }).join(" "));
      svg.append(path);
    }
    points.forEach((point) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const y = property === "volume"
        ? height - 6 - point.value * (height - 12)
        : height - 6 - (point.value + 1) / 2 * (height - 12);
      circle.setAttribute("class", `automation-point${point.index === activeIndex ? " is-active" : ""}`);
      circle.setAttribute("cx", String(point.bar * BAR_WIDTH));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", "5");
      circle.dataset.automationIndex = String(point.index);
      circle.setAttribute("role", "slider");
      circle.setAttribute("tabindex", "0");
      circle.setAttribute("aria-label", `${track.name} ${property} automation point at bar ${point.bar + 1}`);
      circle.setAttribute("aria-valuemin", property === "volume" ? "0" : "-1");
      circle.setAttribute("aria-valuemax", "1");
      circle.setAttribute("aria-valuenow", String(point.value));
      circle.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Delete", "Backspace"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const automation = normalizeTrackAutomation(track.automation);
        const edited = automation[property][point.index];
        if (!edited) return;
        if (event.key === "Delete" || event.key === "Backspace") automation[property].splice(point.index, 1);
        else if (event.key === "ArrowLeft") edited.bar -= 0.25;
        else if (event.key === "ArrowRight") edited.bar += 0.25;
        else edited.value += (event.key === "ArrowUp" ? 1 : -1) * (property === "volume" ? 0.05 : 0.1);
        track.automation = normalizeTrackAutomation(automation);
        saveState();
        renderArrangement();
      });
      svg.append(circle);
    });
  }

  function createArrangementAutomationLane(track, property, width) {
    const lane = document.createElement("div");
    lane.className = `timeline-automation-lane is-${property}`;
    lane.dataset.automationTrackId = track.id;
    lane.dataset.automationProperty = property;
    lane.style.width = `${width}px`;
    lane.style.setProperty("--bar-width", `${BAR_WIDTH}px`);
    lane.style.setProperty("--track-color", track.color || "var(--accent)");
    lane.setAttribute("aria-label", `${track.name} ${property} automation lane`);
    lane.title = "Click to add or edit points; drag to move; Shift-click or select and press Delete to remove.";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "false");
    lane.append(svg);
    drawArrangementAutomationLane(lane, track, property);
    let activeIndex = -1;
    const getPoint = (event) => {
      const bounds = lane.getBoundingClientRect();
      const maxBar = state.arrangementBars;
      const bar = Math.max(0, Math.min(maxBar, snapArrangementBar((event.clientX - bounds.left) / BAR_WIDTH)));
      const position = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      const value = property === "volume" ? 1 - position : 1 - position * 2;
      return { bar, value };
    };
    const finishEdit = () => {
      if (activeIndex < 0) return;
      activeIndex = -1;
      track.automation = normalizeTrackAutomation(track.automation);
      saveState();
      renderArrangement();
    };
    lane.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const automation = normalizeTrackAutomation(track.automation);
      track.automation = automation;
      const pointElement = event.target.closest("[data-automation-index]");
      if (pointElement && (event.detail > 1 || event.shiftKey)) {
        automation[property].splice(Number(pointElement.dataset.automationIndex), 1);
        track.automation = normalizeTrackAutomation(automation);
        saveState();
        renderArrangement();
        return;
      }
      if (pointElement) {
        activeIndex = Number(pointElement.dataset.automationIndex);
      } else {
        const point = getPoint(event);
        const existingIndex = automation[property].findIndex((item) => Math.abs(item.bar - point.bar) < 0.001);
        if (existingIndex >= 0) {
          activeIndex = existingIndex;
          automation[property][activeIndex].value = point.value;
        } else {
          automation[property].push({ ...point, id: makeId() });
          automation[property].sort((left, right) => left.bar - right.bar);
          activeIndex = automation[property].findIndex((item) => item.bar === point.bar);
        }
      }
      lane.setPointerCapture(event.pointerId);
      const point = getPoint(event);
      if (automation[property][activeIndex]) Object.assign(automation[property][activeIndex], point);
      drawArrangementAutomationLane(lane, track, property, activeIndex);
    });
    lane.addEventListener("pointermove", (event) => {
      if (activeIndex < 0) return;
      const point = getPoint(event);
      const edited = track.automation[property][activeIndex];
      if (!edited) return;
      Object.assign(edited, point);
      drawArrangementAutomationLane(lane, track, property, activeIndex);
    });
    lane.addEventListener("pointerup", finishEdit);
    lane.addEventListener("pointercancel", finishEdit);
    return lane;
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
        row.append(titleGroup, makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track), makeMixerPanKnob(track));
      } else {
        row.append(title, makeMixerVolumeMonitor(track), makeMixerVolumeKnob(track), makeMixerPanKnob(track));
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
    const masterSelected = state.selectedMixerTrackId === state.masterTrack.id;
    libraryTitle.textContent = masterSelected ? "Master effects" : "Available effects";
    const libraryHint = document.createElement("p");
    libraryHint.textContent = masterSelected ? "Add effects to the master output" : "Drag an effect onto a track";
    const effectList = document.createElement("div");
    effectList.className = "mixer-effects-library-list";
    EFFECT_CATEGORIES.forEach((category) => {
      const group = document.createElement("section");
      group.className = "mixer-effect-category";
      const heading = document.createElement("h3");
      heading.textContent = category.name;
      const categoryEffects = document.createElement("div");
      categoryEffects.className = "mixer-effect-category-list";
      category.effects.forEach(([id, name]) => {
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
        categoryEffects.append(effect);
      });
      group.append(heading, categoryEffects);
      effectList.append(group);
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
    return makeMixerKnob(track, {
      label: "VOL",
      min: 0,
      max: 100,
      getTrackValue: () => track.volume,
      valueToPercent: (value) => value * 100,
      percentToValue: (percent) => percent / 100,
      formatValue: (value) => `${Math.round(value * 100)}%`,
      setTrackValue: (value) => { track.volume = value; },
    });
  }

  function makeMixerPanKnob(track) {
    return makeMixerKnob(track, {
      label: "PAN",
      min: -100,
      max: 100,
      getTrackValue: () => track.pan,
      valueToPercent: (value) => (value + 1) * 50,
      percentToValue: (percent) => percent / 50 - 1,
      formatValue: (value) => {
        const pan = Math.round(value * 100);
        return pan === 0 ? "C" : `${pan < 0 ? "L" : "R"}${Math.abs(pan)}`;
      },
      setTrackValue: (value) => { track.pan = value; },
    });
  }

  function makeMixerKnob(track, {
    label, min, max, getTrackValue, valueToPercent, percentToValue, formatValue, setTrackValue,
  }) {
    const wrapper = document.createElement("label");
    wrapper.className = "mixer-track-knob";
    const caption = document.createElement("span");
    caption.textContent = label;
    const knob = document.createElement("div");
    knob.className = "mixer-volume-knob";
    knob.setAttribute("role", "slider");
    knob.tabIndex = 0;
    knob.setAttribute("aria-label", `${track.name} ${label.toLowerCase()}`);
    knob.setAttribute("aria-valuemin", String(min));
    knob.setAttribute("aria-valuemax", String(max));
    const pointer = document.createElement("span");
    pointer.className = "mixer-volume-knob-pointer";
    knob.append(pointer);
    const value = document.createElement("output");
    const setValue = (nextPercent, persist = false) => {
      const percent = Math.max(0, Math.min(100, Math.round(nextPercent)));
      const trackValue = percentToValue(percent);
      setTrackValue(trackValue);
      const displayValue = Math.round(trackValue * 100);
      const displayText = formatValue(trackValue);
      knob.setAttribute("aria-valuenow", String(displayValue));
      knob.setAttribute("aria-valuetext", displayText);
      knob.style.setProperty("--knob-angle", `${-135 + percent * 2.7}deg`);
      knob.style.setProperty("--knob-fill", `${percent * 0.75}%`);
      value.textContent = displayText;
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
      setValue(valueToPercent(getTrackValue()) + direction * (event.shiftKey ? 5 : 1), true);
    });
    setValue(valueToPercent(getTrackValue()));
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
    const existingLabels = Array.from($("#arrangement-track-labels").children)
      .filter((label) => label.dataset.trackId);
    const track = {
      id: makeId(),
      name: `Instrument Track ${number}`,
      kind: "mel",
      insertAfterTrackId: existingLabels.at(-1)?.dataset.trackId || null,
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
          transferTypes.includes("application/x-pulsegrid-audio-source") ||
          transferTypes.includes("application/x-pulsegrid-instrument-source");
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
      const instrumentSource = event.dataTransfer?.getData("application/x-pulsegrid-instrument-source");
      if (instrumentSource) {
        try {
          const { instrumentId } = JSON.parse(instrumentSource);
          if (!state.tracks.some((track) => track.id === instrumentId)) {
            showToast("That instrument is no longer available.");
            return;
          }
          createEmptyMelTrack(instrumentId);
        } catch {
          showToast("That instrument track could not be created.");
        }
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
    cursor.addEventListener("pointerdown", (event) => startArrangementCursorDrag(event));
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

  function startArrangementCursorDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const scroll = $("#timeline-scroll");
    let pointerX = event.clientX;
    let animationFrame = null;
    const updateCursor = () => {
      if (scroll.clientWidth === 0) return false;
      const bounds = scroll.getBoundingClientRect();
      const left = bounds.left + scroll.clientLeft;
      const right = left + scroll.clientWidth;
      const edgeSize = Math.min(48, scroll.clientWidth / 4);
      let scrollDelta = 0;
      if (pointerX < left + edgeSize) {
        scrollDelta = -Math.ceil((left + edgeSize - pointerX) / edgeSize * 12);
      } else if (pointerX > right - edgeSize) {
        scrollDelta = Math.ceil((pointerX - (right - edgeSize)) / edgeSize * 12);
      }
      const previousScrollLeft = scroll.scrollLeft;
      scroll.scrollLeft = Math.max(0, Math.min(
        scroll.scrollWidth - scroll.clientWidth,
        previousScrollLeft + scrollDelta,
      ));
      const bar = (pointerX - left + scroll.scrollLeft) / BAR_WIDTH;
      setArrangementCursor(bar, false);
      return scroll.scrollLeft !== previousScrollLeft;
    };
    const autoScroll = () => {
      animationFrame = null;
      if (updateCursor()) animationFrame = window.requestAnimationFrame(autoScroll);
    };
    const update = (moveEvent) => {
      pointerX = moveEvent.clientX;
      if (updateCursor() && animationFrame === null) {
        animationFrame = window.requestAnimationFrame(autoScroll);
      }
    };
    const finish = (upEvent) => {
      if (upEvent) {
        pointerX = upEvent.clientX;
        updateCursor();
      }
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      document.removeEventListener("pointermove", update);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      saveState();
    };
    if (updateCursor()) animationFrame = window.requestAnimationFrame(autoScroll);
    document.addEventListener("pointermove", update);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  }

  function makeActivityWaveform(values, color, displayWidth) {
    const canvas = document.createElement("canvas");
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.min(16384, Math.max(1, Math.ceil(displayWidth * pixelRatio)));
    const height = Math.ceil(46 * pixelRatio);
    canvas.className = "clip-waveform-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return canvas;
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, pixelRatio * 0.65);
    context.globalAlpha = 0.88;
    const center = height / 2;
    for (let x = 0; x < width; x += 1) {
      const value = values[Math.min(values.length - 1, Math.floor(x / width * values.length))] || 0;
      const amplitude = Math.max(1, value * (height * 0.45));
      context.beginPath();
      context.moveTo(x + 0.5, center - amplitude);
      context.lineTo(x + 0.5, center + amplitude);
      context.stroke();
    }
    context.globalAlpha = 1;
    return canvas;
  }

  function getActivityWaveformSampleCount(displayWidth) {
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    return Math.min(4096, Math.max(1, Math.ceil(displayWidth * pixelRatio)));
  }

  function getPatternActivityWaveform(pattern, clip, durationBars, sampleCount) {
    const patternBars = pattern.steps / 16;
    const sourceOffset = clip.sourceOffsetBars || 0;
    const playableBars = Math.min(durationBars, Math.max(0, patternBars * (clip.repeatCount || 1) - sourceOffset));
    const stepCount = getGridStepCount(pattern);
    const tracks = getPatternTrackIds(pattern);
    const pianoNotes = Object.values(pattern.stepPianoNotes || {}).flat();
    return Array.from({ length: sampleCount }, (_, index) => {
      const position = (index + 0.5) / sampleCount * durationBars;
      if (!tracks.length || position >= playableBars) return 0;
      const sourcePosition = (sourceOffset + position) % patternBars;
      const stepPosition = sourcePosition / patternBars * stepCount;
      const step = Math.min(stepCount - 1, Math.floor(stepPosition));
      const phase = stepPosition - step;
      const active = tracks.reduce((count, trackId) => count + (pattern.cells?.[trackId]?.[step] ? 1 : 0), 0);
      const drumLevel = active
        ? Math.sqrt(active / tracks.length) * (0.28 + 0.72 * Math.exp(-phase * 4)) *
          (0.4 + 0.6 * Math.abs(Math.sin((phase * 3 + step) * Math.PI)))
        : 0;
      const sourceTick = sourcePosition * PIANO_TICKS_PER_BAR;
      const pianoLevel = pianoNotes.reduce((level, note) => {
        const duration = note.durationTicks || 1;
        if (sourceTick < note.startTick || sourceTick >= note.startTick + duration) return level;
        const notePhase = (sourceTick - note.startTick) / duration;
        const envelope = Math.min(1, notePhase * 12, (1 - notePhase) * 8);
        const texture = 0.45 + 0.55 * Math.abs(Math.sin(notePhase * Math.PI * 8));
        return Math.max(level, (note.velocity ?? 0.8) * envelope * texture);
      }, 0);
      return Math.max(drumLevel, pianoLevel);
    });
  }

  function getMelActivityWaveform(mel, clip, durationBars, sampleCount) {
    const sourceOffset = clip.sourceOffsetBars || 0;
    const melBars = getMelLengthBars(mel);
    const playableBars = Math.min(durationBars, Math.max(0, melBars * (clip.repeatCount || 1) - sourceOffset));
    return Array.from({ length: sampleCount }, (_, index) => {
      const position = sourceOffset + (index + 0.5) / sampleCount * durationBars;
      if (position >= sourceOffset + playableBars) return 0;
      const sourcePosition = position % melBars;
      return mel.notes.reduce((level, note) => {
        const start = note.startTick / PIANO_TICKS_PER_BAR;
        const duration = note.durationTicks / PIANO_TICKS_PER_BAR;
        const end = start + duration;
        if (sourcePosition < start || sourcePosition >= end) return level;
        const phase = (sourcePosition - start) / duration;
        const envelope = Math.min(1, phase * 12, (1 - phase) * 8);
        const texture = 0.45 + 0.55 * Math.abs(Math.sin(phase * Math.PI * 8));
        return Math.max(level, (note.velocity ?? 0.8) * envelope * texture);
      }, 0);
    });
  }

  function updateArrangementClipRepeatMarkers(element, clip, repeatLengthBars, durationBars, sourceOffsetBars = 0) {
    element.querySelector(".pattern-repeat-overlay")?.remove();
    const overlay = document.createElement("span");
    overlay.className = "pattern-repeat-overlay";
    const playbackBars = Math.min(durationBars, Math.max(0, repeatLengthBars * (clip.repeatCount || 1) - sourceOffsetBars));
    const sourcePhase = sourceOffsetBars % repeatLengthBars;
    for (let boundary = (sourcePhase ? repeatLengthBars - sourcePhase : repeatLengthBars);
      boundary < playbackBars - 0.001; boundary += repeatLengthBars) {
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
    handle.setAttribute("aria-label", mode === "repeat" ? `Repeat ${name}` : `Trim or extend ${name}`);
    handle.title = mode === "repeat"
      ? `Drag to repeat ${name}`
      : "Drag to trim or extend; extension after the source is silent";

    const updateDuration = (durationBars) => {
      if (type === "audio") clip.durationSeconds = durationBars * (240 / state.bpm);
      else clip.durationBars = durationBars;
      if (mode === "repeat") {
        const repeatLength = getArrangementClipRepeatLength(type, clip);
        const sourceOffset = type === "mel" ? clip.sourceOffsetBars || 0
          : type === "audio" ? (clip.sourceOffsetSeconds || 0) / (240 / state.bpm) : clip.sourceOffsetBars || 0;
        clip.repeatCount = Math.max(1, Math.ceil((sourceOffset + durationBars - 0.0001) / repeatLength));
      }
      const duration = getArrangementClipDuration(type, clip);
      element.style.width = `${Math.max(28, duration * BAR_WIDTH - 8)}px`;
      if (type === "audio") {
        element.style.setProperty("--pattern-color", track?.color || "var(--accent)");
        updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength(type, clip), duration,
          (clip.sourceOffsetSeconds || 0) / (240 / state.bpm));
      }
      if (type === "mel") {
        const mel = getMel(clip.melId);
        if (mel) {
          labelElement.textContent = `${mel.name.toUpperCase()} · ${duration.toFixed(2)} BAR${duration === 1 ? "" : "S"}`;
          updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength(type, clip), duration, clip.sourceOffsetBars || 0);
        }
      } else if (type === "pattern") {
        const pattern = getPattern(clip.patternId);
        labelElement.textContent = `${(pattern?.name || "DRUM PATTERN").toUpperCase()} · ${duration.toFixed(2)} BAR${duration === 1 ? "" : "S"}`;
        if (pattern) updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength(type, clip), duration, clip.sourceOffsetBars || 0);
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

  const reversedAudioClipBuffers = new WeakMap();

  function drawAudioClipWaveform(canvas, clip, displayWidth, color) {
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.min(16384, Math.max(1, Math.ceil(displayWidth * pixelRatio)));
    const height = Math.ceil(46 * pixelRatio);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    const samples = clip.buffer.getChannelData(0);
    const sourceOffset = clip.sourceOffsetSeconds || 0;
    const playableDuration = Math.max(0, Math.min(
      clip.buffer.duration - sourceOffset,
      clip.durationSeconds ?? clip.buffer.duration,
    ));
    const firstSample = Math.floor(sourceOffset / clip.buffer.duration * samples.length);
    const lastSample = Math.min(
      samples.length,
      firstSample + Math.floor(playableDuration / clip.buffer.duration * samples.length),
    );
    const playableWidth = Math.min(width, Math.ceil(playableDuration / (240 / state.bpm) * BAR_WIDTH * pixelRatio));
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, pixelRatio * 0.65);
    context.globalAlpha = 0.88;
    const center = height / 2;
    for (let x = 0; x < playableWidth; x += 1) {
      const sampleStart = firstSample + Math.floor(x / playableWidth * (lastSample - firstSample));
      const sampleEnd = Math.min(lastSample, Math.max(sampleStart + 1,
        firstSample + Math.floor((x + 1) / playableWidth * (lastSample - firstSample))));
      let peak = 0;
      for (let sample = sampleStart; sample < sampleEnd; sample += 1) {
        peak = Math.max(peak, Math.abs(samples[sample]));
      }
      const amplitude = Math.max(1, peak * (height * 0.45));
      context.beginPath();
      context.moveTo(x + 0.5, center - amplitude);
      context.lineTo(x + 0.5, center + amplitude);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  function getReversedAudioClipBuffer(context, buffer) {
    let buffersForContext = reversedAudioClipBuffers.get(context);
    if (!buffersForContext) {
      buffersForContext = new WeakMap();
      reversedAudioClipBuffers.set(context, buffersForContext);
    }
    let reversed = buffersForContext.get(buffer);
    if (reversed) return reversed;
    reversed = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      reversed.getChannelData(channel).set(buffer.getChannelData(channel).slice().reverse());
    }
    buffersForContext.set(buffer, reversed);
    return reversed;
  }

  function createAudioClipPlaybackSource(context, track, clip, segment, when, secondsPerBar) {
    const source = context.createBufferSource();
    const buffer = clip.reversed ? getReversedAudioClipBuffer(context, clip.buffer) : clip.buffer;
    const envelope = context.createGain();
    source.buffer = buffer;
    source.connect(envelope);
    envelope.connect(track.gainNode);

    const clipDuration = getArrangementClipDuration("audio", clip) * secondsPerBar;
    const segmentOffset = Math.max(0, (segment.startBar - clip.startBar) * secondsPerBar);
    const clipGain = Math.max(0, Math.min(2, Number.isFinite(clip.clipGain) ? clip.clipGain : 1));
    const fadeIn = Math.min(clipDuration, Math.max(0, Number(clip.fadeInSeconds) || 0));
    const fadeOut = Math.min(clipDuration, Math.max(0, Number(clip.fadeOutSeconds) || 0));
    if (fadeIn || fadeOut) {
      const curve = new Float32Array(65);
      for (let index = 0; index < curve.length; index += 1) {
        const clipTime = segmentOffset + segment.durationSeconds * index / (curve.length - 1);
        const fadeInGain = fadeIn ? Math.min(1, clipTime / fadeIn) : 1;
        const fadeOutGain = fadeOut ? Math.min(1, Math.max(0, (clipDuration - clipTime) / fadeOut)) : 1;
        curve[index] = Math.min(fadeInGain, fadeOutGain) * clipGain;
      }
      envelope.gain.setValueCurveAtTime(curve, when, segment.durationSeconds);
    } else {
      envelope.gain.value = clipGain;
    }

    const sourceOffset = clip.reversed
      ? clip.buffer.duration - segment.sourceOffsetSeconds - segment.durationSeconds
      : segment.sourceOffsetSeconds;
    source.start(when, Math.max(0, sourceOffset), segment.durationSeconds);
    return { source, envelope };
  }

  function openAudioClipEditor(track, clip) {
    const dialog = $("#audio-clip-edit-dialog");
    dialog.dataset.trackId = track.id;
    dialog.dataset.clipId = clip.id;
    $("#audio-clip-edit-name").textContent = clip.name;
    $("#audio-clip-gain").value = String(Math.round(Math.max(0, Math.min(2, clip.clipGain ?? 1)) * 100));
    $("#audio-clip-fade-in").value = String(Math.max(0, Math.min(10, clip.fadeInSeconds || 0)));
    $("#audio-clip-fade-out").value = String(Math.max(0, Math.min(10, clip.fadeOutSeconds || 0)));
    $("#audio-clip-reverse").checked = clip.reversed === true;
    updateAudioClipGainOutput(Number($("#audio-clip-gain").value));
    updateAudioClipFadeOutput("fadeInSeconds", Number($("#audio-clip-fade-in").value));
    updateAudioClipFadeOutput("fadeOutSeconds", Number($("#audio-clip-fade-out").value));
    dialog.showModal();
  }

  function updateAudioClipGainOutput(value) {
    $("#audio-clip-gain-value").textContent = `${value}%`;
  }

  function updateAudioClipFadeOutput(property, value) {
    const output = $(`#audio-clip-${property === "fadeInSeconds" ? "fade-in" : "fade-out"}-value`);
    output.textContent = value > 0 ? `${value.toFixed(2)} s` : "Off";
  }

  function updateAudioClipEditor(event) {
    const input = event.target.closest("[data-audio-clip-property]");
    if (!(input instanceof HTMLInputElement)) return;
    const dialog = $("#audio-clip-edit-dialog");
    const track = state.arrangementTracks.find((item) => item.id === dialog.dataset.trackId);
    const clip = track?.clips.find((item) => item.id === dialog.dataset.clipId);
    if (!track || !clip) return;

    if (input.dataset.audioClipProperty === "reversed") {
      clip.reversed = input.checked;
    } else if (input.dataset.audioClipProperty === "clipGain") {
      const value = Math.max(0, Math.min(200, Number(input.value) || 0));
      clip.clipGain = value / 100;
      updateAudioClipGainOutput(value);
    } else {
      const property = input.dataset.audioClipProperty;
      const value = Math.max(0, Math.min(10, Number(input.value) || 0));
      if (property === "fadeInSeconds") clip.fadeInSeconds = value;
      else if (property === "fadeOutSeconds") clip.fadeOutSeconds = value;
      updateAudioClipFadeOutput(property, value);
    }
    saveState();
    renderArrangement();
    if (event.type === "change") {
      persistClip(track, clip).catch(() => showToast("Clip settings changed, but browser storage could not be updated."));
    }
  }

  function createAudioClip(track, clip) {
    const element = document.createElement("div");
    const durationBars = getArrangementClipDuration("audio", clip);
    element.className = "audio-clip";
    element.classList.toggle("is-reversed", clip.reversed === true);
    element.draggable = true;
    element.dataset.clipId = clip.id;
    element.dataset.selectableType = "audio";
    element.style.setProperty("--clip-color", track.color);
    element.style.left = `${clip.startBar * BAR_WIDTH + 4}px`;
    const clipWidth = Math.max(28, durationBars * BAR_WIDTH - 8);
    element.style.width = `${clipWidth}px`;
    element.setAttribute("aria-label", `${clip.name}, bar ${clip.startBar + 1}, ${durationBars.toFixed(2)} bars; drag to move or resize`);

    const waveform = document.createElement("canvas");
    waveform.className = "clip-waveform-canvas";
    waveform.setAttribute("aria-hidden", "true");
    drawAudioClipWaveform(waveform, clip, Math.max(1, clipWidth - 8), track.color);
    const name = document.createElement("span");
    name.className = "clip-name";
    name.textContent = clip.name;
    const reverseBadge = document.createElement("span");
    reverseBadge.className = "audio-clip-reverse-badge";
    reverseBadge.textContent = "REV";
    element.style.setProperty("--pattern-color", track.color);
    const repeatHandle = makeArrangementResizeHandle("audio", clip, track, element, name, "repeat");
    const resizeHandle = makeArrangementResizeHandle("audio", clip, track, element, name);
    updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength("audio", clip), durationBars,
      (clip.sourceOffsetSeconds || 0) / (240 / state.bpm));
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
    element.addEventListener("dblclick", (event) => {
      if (event.target.closest(".clip-resize-handle")) return;
      event.preventDefault();
      event.stopPropagation();
      openAudioClipEditor(track, clip);
    });
    element.append(waveform, name);
    if (clip.reversed) element.append(reverseBadge);
    element.append(repeatHandle, resizeHandle);
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
    element.style.setProperty("--pattern-color", track.color);
    element.style.left = `${clip.startBar * BAR_WIDTH + 4}px`;
    element.style.width = `${Math.max(28, bars * BAR_WIDTH - 8)}px`;
    const name = document.createElement("span");
    name.className = "mel-clip-name";
    name.textContent = `${mel.name.toUpperCase()} · ${Number(bars.toFixed(2))} BAR${bars === 1 ? "" : "S"}`;
    element.setAttribute("aria-label", `${mel.name}, bar ${clip.startBar + 1}, ${bars.toFixed(2)} bars; drag to move or resize`);
    const repeatHandle = makeArrangementResizeHandle("mel", clip, track, element, name, "repeat");
    const resizeHandle = makeArrangementResizeHandle("mel", clip, track, element, name);
    updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength("mel", clip), bars, clip.sourceOffsetBars || 0);
    const waveform = makeActivityWaveform(
      getMelActivityWaveform(mel, clip, bars, getActivityWaveformSampleCount(Math.max(1, bars * BAR_WIDTH - 16))),
      track.color,
      Math.max(1, bars * BAR_WIDTH - 16),
    );
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
    element.append(waveform, name, repeatHandle, resizeHandle);
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
      ? makeActivityWaveform(
        getPatternActivityWaveform(pattern, clip, totalBars,
          getActivityWaveformSampleCount(Math.max(1, totalBars * BAR_WIDTH - 16))),
        pattern.color || "var(--accent)",
        Math.max(1, totalBars * BAR_WIDTH - 16),
      )
      : makeActivityWaveform([0], "#d3f36b", 1);
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
    if (pattern) updateArrangementClipRepeatMarkers(element, clip, getArrangementClipRepeatLength("pattern", clip), totalBars, clip.sourceOffsetBars || 0);
    return element;
  }

  function updateArrangementCursorMarker() {
    document.querySelectorAll(".arrangement-cursor").forEach((marker) => {
      marker.style.left = `${state.arrangementCursor * BAR_WIDTH}px`;
      marker.setAttribute("aria-valuenow", state.arrangementCursor.toFixed(2));
      marker.setAttribute("aria-valuemax", String(state.arrangementBars));
    });
    const rulerPlayhead = document.querySelector(".arrangement-ruler-playhead");
    if (rulerPlayhead) rulerPlayhead.style.left = `${state.arrangementCursor * BAR_WIDTH}px`;
    const timeValue = $("#playhead-time-value");
    if (timeValue) {
      const seconds = Math.max(0, state.arrangementCursor * 240 / state.bpm);
      const minutes = Math.floor(seconds / 60);
      timeValue.textContent = `${String(minutes).padStart(2, "0")}:${(seconds % 60).toFixed(3).padStart(6, "0")}`;
    }
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
        type: "mel", sourceTrackId: track.id, track: {
          id: track.id, name: track.name, kind: "mel", instrumentId: track.instrumentId,
          color: track.color, volume: track.volume, pan: track.pan, automation: normalizeTrackAutomation(track.automation),
          automationOpen: track.automationOpen === true, effects: makeDefaultEffects(track.effects),
        },
        clip: { ...clip }, melId: clip.melId, startBar: clip.startBar,
      });
    }));
    state.arrangementTracks.forEach((track) => track.clips.forEach((clip) => {
      if (!state.selectedArrangementItems.has(arrangementSelectionKey("audio", clip.id))) return;
      items.push({
        type: "audio", sourceTrackId: track.id, track: {
          id: track.id, name: track.name, color: track.color, volume: track.volume,
          pan: track.pan,
          automation: normalizeTrackAutomation(track.automation),
          automationOpen: track.automationOpen === true, effects: makeDefaultEffects(track.effects),
        },
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
      const totalTicks = getPianoLoopRange().totalBars * PIANO_TICKS_PER_BAR;
      const pasteStartTick = Math.max(0, Math.min(totalTicks - 0.001, state.pianoCursorTick));
      const pasted = clipboard.items
        .map((note) => ({
          id: makeId(),
          trackId: state.selectedPianoTrackId,
          midi: note.midi,
          startTick: pasteStartTick + note.startOffset,
          durationTicks: Math.min(note.durationTicks, totalTicks - pasteStartTick - note.startOffset),
          velocity: note.velocity,
          pan: note.pan,
        }))
        .filter((note) => note.startTick < totalTicks && note.durationTicks > 0);
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
        let track = state.melTracks.find((candidate) => candidate.id === state.selectedMixerTrackId)
          || state.melTracks.find((candidate) => candidate.id === item.sourceTrackId);
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
        clip.fadeOutSeconds = 0;
        const right = {
          ...clip,
          id: makeId(),
          startBar: cursor,
          durationSeconds: totalDuration - leftDuration,
          sourceOffsetSeconds: (clip.sourceOffsetSeconds || 0) + leftDuration,
          fadeInSeconds: 0,
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
    sendCollaborationView();
    const showSequencer = view === "sequencer";
    const showPianoRoll = view === "piano-roll";
    const showMixer = view === "mixer";
    const showDJ = view === "dj";
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

  async function importRecording(file, trackId = null, startBar = state.arrangementCursor, snapStart = true) {
    if (!isAudioFile(file)) {
      showToast(`"${file.name}" is not an audio file.`);
      return null;
    }
    try {
      await ensureAudio();
      const buffer = await state.audioContext.decodeAudioData(await file.arrayBuffer());
      let track = state.arrangementTracks.find((item) => item.id === trackId);
      if (!track) track = createArrangementTrack(file.name);
      else if (!track.clips.length && /^Track \d+$/.test(track.name)) track.name = file.name;
      const clip = {
        id: makeId(), name: file.name, buffer,
          repeatCount: 1,
        durationSeconds: buffer.duration,
        sourceOffsetSeconds: 0,
        startBar: 0,
        blob: file,
        audioMetadata: detectAudioMetadata(buffer),
      };
      clip.startBar = snapStart
        ? clampArrangementStart(startBar, getArrangementClipDuration("audio", clip))
        : Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - getArrangementClipDuration("audio", clip), startBar));
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
      return clip;
    } catch (error) {
      showToast(`Could not import ${file.name}: ${error.message || "unsupported audio format"}`);
      return null;
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

  function extendArrangementForRecording(endBar) {
    const previousBars = state.arrangementBars;
    const nextBars = Math.min(MAX_ARRANGEMENT_BARS, Math.max(previousBars, Math.ceil(endBar)));
    if (nextBars === previousBars) return;

    state.arrangementBars = nextBars;
    if (state.playbackStartTime && state.isPlaying && state.playbackMode === "arrangement") {
      state.playbackEndTime = state.playbackStartTime +
        (nextBars - state.playbackStartBar) * (240 / state.bpm);
    }
    const width = nextBars * BAR_WIDTH;
    const content = $("#timeline-content");
    const ruler = content.querySelector(".timeline-ruler");
    content.style.width = `${width}px`;
    ruler.style.width = `${width}px`;
    ruler.style.gridTemplateColumns = `repeat(${nextBars}, ${BAR_WIDTH}px)`;
    for (let bar = previousBars; bar < nextBars; bar += 1) {
      const marker = document.createElement("div");
      marker.className = "timeline-bar";
      marker.textContent = `BAR ${String(bar + 1).padStart(2, "0")}`;
      ruler.append(marker);
    }
    content.querySelectorAll(".timeline-lane").forEach((lane) => {
      lane.style.width = `${width}px`;
    });
    $("#arrangement-bar-label").textContent = `${nextBars} BARS`;
    updateArrangementCursorMarker();
  }

  function drawRecordingWaveform(preview) {
    const bounds = preview.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.min(16384, Math.ceil(bounds.width * pixelRatio));
    const height = Math.min(512, Math.ceil(bounds.height * pixelRatio));
    if (preview.canvas.width !== width || preview.canvas.height !== height) {
      preview.canvas.width = width;
      preview.canvas.height = height;
    }

    const context = preview.canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(preview.element).getPropertyValue("--clip-color");
    const barWidth = Math.max(1, width / Math.max(1, preview.waveform.length) * 0.55);
    preview.waveform.forEach((value, index) => {
      const barHeight = Math.max(2, value * height * 0.82);
      const x = index / Math.max(1, preview.waveform.length) * width;
      context.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
    });
  }

  function updateRecordingPreview() {
    const preview = state.recordingPreview;
    if (!preview) return;

    const elapsedSeconds = Math.min(
      (performance.now() - preview.startedAt) / 1000,
      (MAX_ARRANGEMENT_BARS - preview.startBar) * (240 / state.bpm),
    );
    const durationBars = elapsedSeconds / (240 / state.bpm);
    const endBar = preview.startBar + durationBars;
    extendArrangementForRecording(endBar);

    preview.element.style.left = `${preview.startBar * BAR_WIDTH + 4}px`;
    preview.element.style.width = `${Math.max(4, durationBars * BAR_WIDTH - 8)}px`;
    preview.element.setAttribute("aria-label", `Recording from bar ${Math.floor(preview.startBar) + 1}`);
    const lane = Array.from($("#timeline-content").querySelectorAll(".timeline-lane"))
      .find((item) => item.dataset.trackId === preview.track.id);
    if (lane && !preview.element.isConnected) {
      lane.insertBefore(preview.element, lane.querySelector(".arrangement-cursor"));
    }

    const samples = new Uint8Array(preview.analyser.fftSize);
    preview.analyser.getByteTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, sample) => {
      const value = (sample - 128) / 128;
      return sum + value * value;
    }, 0) / samples.length);
    if (preview.waveform.length >= 4000) {
      preview.waveform = preview.waveform.reduce((compressed, value, index, values) => {
        if (index % 2 === 0) compressed.push(Math.max(value, values[index + 1] || value));
        return compressed;
      }, []);
    }
    preview.waveform.push(rms);
    drawRecordingWaveform(preview);

    const timeline = $("#timeline-scroll");
    const recordingEndX = endBar * BAR_WIDTH;
    if (timeline.clientWidth > 0) {
      timeline.scrollLeft = Math.max(0, Math.min(
        timeline.scrollWidth - timeline.clientWidth,
        recordingEndX - timeline.clientWidth * 0.72,
      ));
    }

    if (endBar >= MAX_ARRANGEMENT_BARS && state.mediaRecorder?.state === "recording") {
      showToast(`Recording stopped at the ${MAX_ARRANGEMENT_BARS}-bar limit.`);
      state.mediaRecorder.stop();
    }
  }

  function startRecordingPreview(stream) {
    let track = null;
    let analyser = null;
    let source = null;
    try {
      track = createArrangementTrack("Recording");
      analyser = state.audioContext.createAnalyser();
      analyser.fftSize = 512;
      source = state.audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const element = document.createElement("div");
      element.className = "audio-clip is-recording";
      element.style.setProperty("--clip-color", "#ff777f");
      element.setAttribute("role", "img");
      const canvas = document.createElement("canvas");
      canvas.className = "recording-waveform";
      canvas.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "clip-name";
      name.textContent = "RECORDING";
      element.append(canvas, name);

      const preview = {
        track,
        startBar: state.recordingStartBar,
        startedAt: performance.now(),
        analyser,
        source,
        element,
        canvas,
        waveform: [],
      };
      state.recordingPreview = preview;
      renderArrangement();
      updateRecordingPreview();
      state.recordingPreviewTimer = window.setInterval(updateRecordingPreview, 100);
    } catch (error) {
      state.recordingPreview = null;
      source?.disconnect();
      analyser?.disconnect();
      if (track) state.arrangementTracks = state.arrangementTracks.filter((item) => item !== track);
      throw error;
    }
  }

  function stopRecordingPreview() {
    if (state.recordingPreviewTimer !== null) window.clearInterval(state.recordingPreviewTimer);
    state.recordingPreviewTimer = null;
    const preview = state.recordingPreview;
    state.recordingPreview = null;
    preview?.source.disconnect();
    preview?.analyser.disconnect();
    return preview;
  }

  function removeEmptyRecordingTrack(track) {
    if (track.clips.length) return;
    state.arrangementTracks = state.arrangementTracks.filter((item) => item !== track);
    renderArrangement();
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
          state.recordingStartBar = state.arrangementCursor;
          recorder.start();
          try {
            startRecordingPreview(state.recordingStream);
          } catch (error) {
            showToast(`Recording started, but the live track preview is unavailable: ${error.message || "unknown error"}`);
          }
          $("#record-button-label").textContent = "Stop recording";
          showToast(`Recording from bar ${Math.floor(state.recordingStartBar) + 1}`);
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
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: getRecordingAudioConstraints() });
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
        const preview = stopRecordingPreview();
        stream.getTracks().forEach((track) => track.stop());
        state.recordingStream = null;
        state.mediaRecorder = null;
        const chunks = state.recordingChunks;
        state.recordingChunks = [];
        resetRecordingControls();
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) {
          if (preview) removeEmptyRecordingTrack(preview.track);
          showToast("No audio was captured.");
          return;
        }
        const extension = blob.type.includes("ogg") ? "ogg" : "webm";
        const name = `Recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
        try {
          await importRecording(
            new File([blob], name, { type: blob.type }),
            preview?.track.id || null,
            state.recordingStartBar,
            false,
          );
          if (preview && !preview.track.clips.length) removeEmptyRecordingTrack(preview.track);
        } catch (error) {
          if (preview) removeEmptyRecordingTrack(preview.track);
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
      automation: normalizeTrackAutomation(source.automation),
      automationOpen: source.automationOpen === true,
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

  function formatStorageSize(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(unitIndex > 0 && size < 10 ? 1 : 0)} ${units[unitIndex]}`;
  }

  async function updateStorageIndicator() {
    const indicator = $("#storage-indicator");
    const value = $("#storage-usage");
    const fill = $("#storage-meter-fill");
    if (!indicator || !value || !fill) return;

    if (!navigator.storage?.estimate) {
      value.textContent = "Storage unavailable";
      indicator.title = "This browser does not provide storage estimates.";
      indicator.setAttribute("aria-label", indicator.title);
      return;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota;
      const indexedDbUsage = estimate.usageDetails?.indexedDB;
      const hasIndexedDbUsage = Number.isFinite(indexedDbUsage);
      const usage = hasIndexedDbUsage ? indexedDbUsage : estimate.usage;
      if (!Number.isFinite(usage) || !Number.isFinite(quota) || quota <= 0) {
        throw new Error("The browser did not provide a valid storage estimate.");
      }

      const percent = Math.min(100, Math.max(0, usage / quota * 100));
      const usageLabel = `${hasIndexedDbUsage ? "IDB" : "Site"} ${formatStorageSize(usage)} / ${formatStorageSize(quota)}`;
      value.textContent = usageLabel;
      fill.style.width = `${percent}%`;
      indicator.dataset.level = percent >= 90 ? "critical" : percent >= 70 ? "warning" : "normal";
      indicator.title = hasIndexedDbUsage
        ? `IndexedDB uses ${formatStorageSize(usage)} of an estimated ${formatStorageSize(quota)} browser storage quota.`
        : `IndexedDB usage is not reported separately; showing total site storage (${formatStorageSize(usage)} of ${formatStorageSize(quota)} estimated).`;
      indicator.setAttribute("aria-label", indicator.title);
    } catch (error) {
      value.textContent = "Storage unavailable";
      fill.style.width = "0";
      indicator.title = `Could not estimate browser storage: ${error.message || "unknown error"}`;
      indicator.setAttribute("aria-label", indicator.title);
    }
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
        repeatCount: clip.repeatCount || 1,
        clipGain: Number.isFinite(clip.clipGain) ? Math.max(0, Math.min(2, clip.clipGain)) : 1,
        fadeInSeconds: clip.fadeInSeconds || 0,
        fadeOutSeconds: clip.fadeOutSeconds || 0,
        reversed: clip.reversed === true,
        audioMetadata: normalizeAudioMetadata(clip.audioMetadata),
        volume: track.volume,
        muted: track.muted,
        blob: clip.blob,
      });
      transaction.oncomplete = () => {
        database.close();
        resolve();
        updateStorageIndicator();
        scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save recording")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Recording save was cancelled")); };
    }));
  }

  function getDrumSampleRecordId(trackId, projectId = state.projectId) {
    return `drum-sample:${projectId}:${trackId}`;
  }

  function persistDrumSample(track, file) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      store.put({
        id: getDrumSampleRecordId(track.id),
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
      const legacyRecord = store.get(`drum-sample:${track.id}`);
      legacyRecord.onsuccess = () => {
        const record = legacyRecord.result;
        if (record && (record.projectId === state.projectId ||
          (!record.projectId && state.projectId === "default"))) {
          store.delete(record.id);
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve();
        updateStorageIndicator();
        scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save drum sample")); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Drum sample save was cancelled")); };
    }));
  }

  function deletePersistedDrumSample(trackId) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      store.delete(getDrumSampleRecordId(trackId));
      const legacyRecord = store.get(`drum-sample:${trackId}`);
      legacyRecord.onsuccess = () => {
        const record = legacyRecord.result;
        if (record && (record.projectId === state.projectId ||
          (!record.projectId && state.projectId === "default"))) {
          store.delete(record.id);
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve();
        updateStorageIndicator();
        scheduleCollaborationAssetSync();
      };
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
      transaction.oncomplete = () => { database.close(); resolve(); updateStorageIndicator(); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not remove recording")); };
    })).then(() => scheduleCollaborationAssetSync())
      .catch(() => showToast("The clip was removed, but browser storage could not be updated."));
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
            automation: normalizeTrackAutomation(),
            automationOpen: false,
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
            repeatCount: Number.isInteger(record.repeatCount) ? Math.max(1, record.repeatCount) : 1,
            clipGain: Number.isFinite(record.clipGain) ? Math.max(0, Math.min(2, record.clipGain)) : 1,
            fadeInSeconds: Number.isFinite(record.fadeInSeconds)
              ? Math.max(0, Math.min(10, record.fadeInSeconds)) : 0,
            fadeOutSeconds: Number.isFinite(record.fadeOutSeconds)
              ? Math.max(0, Math.min(10, record.fadeOutSeconds)) : 0,
            reversed: record.reversed === true,
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
      if (state.pianoRollAudioClipId) renderPianoRoll();
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
    const hasArrangementSolo = [...state.patterns, ...state.melTracks, ...state.arrangementTracks]
      .some((track) => track.solo);
    allTracks.forEach((track) => {
      track.panNode?.pan.setTargetAtTime(track.pan, state.audioContext.currentTime, 0.015);
      if (!track.gainNode) return;
      const isBus = track.kind === "mixer-master" || track.kind === "mixer-effects";
      const isArrangementTrack = track.kind === "pattern" || track.kind === "mel" ||
        state.arrangementTracks.includes(track);
      const isSilent = track.muted ||
        (isArrangementTrack && hasArrangementSolo && !track.solo) ||
        (!isBus && !isArrangementTrack && hasSolo && !track.solo) ||
        (state.arrangementTracks.includes(track) && hasSolo && !track.solo);
      track.gainNode.gain.setTargetAtTime(isSilent ? 0 : track.volume, state.audioContext.currentTime, 0.015);
    });
  }

  function registerArrangementPlaybackSource(source) {
    if (!state.isSchedulingArrangementVoice) return;
    state.arrangementSources.add(source);
    source.addEventListener("ended", () => state.arrangementSources.delete(source), { once: true });
  }

  function scheduleArrangementVoice(schedule) {
    const wasSchedulingArrangementVoice = state.isSchedulingArrangementVoice;
    state.isSchedulingArrangementVoice = true;
    try {
      schedule();
    } finally {
      state.isSchedulingArrangementVoice = wasSchedulingArrangementVoice;
    }
  }

  function triggerTrack(track, time, step, variant = track.variant, noteDuration = getStepDuration(), outputTrack = track, outputNode = null, pitchOffset = 0) {
    const context = state.audioContext;
    const pitchRatio = Math.pow(2, ((track.pitch || 0) + pitchOffset) / 12);
    const soundDurationScale = getSoundDurationScale(track);
    ensureTrackAudio(outputTrack);
    const output = outputNode || outputTrack.gainNode;
    if (track.sample) {
      const source = context.createBufferSource();
      registerArrangementPlaybackSource(source);
      source.buffer = getLibrarySamplePlaybackBuffer(track);
      const envelope = context.createGain();
      const sampleDuration = source.buffer.duration * soundDurationScale;
      source.playbackRate.setValueAtTime(pitchRatio, time);
      envelope.gain.setValueAtTime(1, time);
      const duration = Math.max(0.005, track.sampleOneShot
        ? sampleDuration / pitchRatio
        : Math.min(sampleDuration / pitchRatio, noteDuration));
      const fade = Math.min(0.01, duration * 0.1);
      envelope.gain.setValueAtTime(1, time + Math.max(0, duration - fade));
      envelope.gain.linearRampToValueAtTime(0.0001, time + duration);
      source.connect(envelope);
      envelope.connect(output);
      source.start(time, 0, Math.min(sampleDuration, duration * pitchRatio));
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
    const pan = Number.isFinite(noteOptions.pan) ? Math.max(-1, Math.min(1, noteOptions.pan)) : 0;
    if (pan !== 0) {
      const panner = state.audioContext.createStereoPanner();
      panner.pan.setValueAtTime(pan, time);
      panner.connect(outputNode);
      outputNode = panner;
    }
    if (noteOptions.audioSlice) {
      playPianoAudioSlice(noteOptions.audioSlice, time, midi, duration, velocity, outputNode, noteOptions);
      return;
    }
    if (track.sample) {
      const context = state.audioContext;
      const source = context.createBufferSource();
      registerArrangementPlaybackSource(source);
      const envelope = context.createGain();
      const detune = Number.isFinite(noteOptions.detune) ? noteOptions.detune : 0;
      const rootMidi = Number.isFinite(track.sampleRootMidi) ? track.sampleRootMidi : 60;
      const rate = Math.pow(2, (midi - rootMidi + detune / 100) / 12);
      source.buffer = getLibrarySamplePlaybackBuffer(track);
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

  function playPianoAudioSlice(audioSlice, time, midi, duration, velocity, outputNode, noteOptions) {
    const clip = getPianoRollAudioClipById(audioSlice.clipId);
    if (!clip?.buffer) return;
    const offset = Math.max(0, Math.min(clip.buffer.duration, audioSlice.offsetSeconds));
    const sourceDuration = Math.max(0, Math.min(
      clip.buffer.duration - offset,
      audioSlice.durationSeconds,
    ));
    if (!sourceDuration) return;
    const rootMidi = Number.isInteger(audioSlice.rootMidi) ? audioSlice.rootMidi : 60;
    const detune = Number.isFinite(noteOptions.detune) ? noteOptions.detune : 0;
    const rate = Math.pow(2, (midi - rootMidi + detune / 100) / 12);
    const bufferDuration = Math.min(sourceDuration, Math.max(0.005, duration));
    const outputDuration = bufferDuration / rate;
    const dropOff = Math.max(0, Math.min(90, audioSlice.dropOff ?? 10)) / 100;
    const fadeDuration = Math.min(outputDuration, Math.max(0.003, outputDuration * dropOff));
    const fadeStart = Math.max(0, outputDuration - fadeDuration);
    const attack = Math.max(0, Math.min(
      Number.isFinite(noteOptions.attack) ? noteOptions.attack : 0,
      fadeStart,
    ));
    const source = state.audioContext.createBufferSource();
    registerArrangementPlaybackSource(source);
    source.buffer = clip.buffer;
    source.playbackRate.setValueAtTime(rate, time);
    const envelope = state.audioContext.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(velocity, time + attack);
    if (fadeStart > attack) envelope.gain.setValueAtTime(velocity, time + fadeStart);
    envelope.gain.linearRampToValueAtTime(0.0001, time + outputDuration);
    source.connect(envelope);
    envelope.connect(outputNode);
    source.start(time, offset, bufferDuration);
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
      registerArrangementPlaybackSource(oscillator);
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
      registerArrangementPlaybackSource(lfo);
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
    registerArrangementPlaybackSource(oscillator);
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
      registerArrangementPlaybackSource(overtone);
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
    registerArrangementPlaybackSource(oscillator);
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
      registerArrangementPlaybackSource(oscillator);
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
    registerArrangementPlaybackSource(oscillator);
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
    registerArrangementPlaybackSource(osc);
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
    registerArrangementPlaybackSource(source);
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
    registerArrangementPlaybackSource(body);
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
    registerArrangementPlaybackSource(osc);
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
    registerArrangementPlaybackSource(osc);
    const gain = state.audioContext.createGain();
    osc.frequency.setValueAtTime(downbeat ? 1350 : 950, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
    osc.connect(gain);
    gain.connect(getMetronomeOutputNode(state.isPlaying && state.playbackMode === "arrangement"));
    osc.start(time);
    osc.stop(time + 0.035);
  }

  async function startPlayback(mode = "arrangement", { startAtMs = null, remote = false } = {}) {
    if (state.isPlaying || state.isStartingPlayback || state.isExporting) return;
    const requestId = ++state.playbackRequestId;
    state.isStartingPlayback = true;
    playButton.classList.toggle("is-playing", mode === "arrangement");
    playButton.setAttribute("aria-label", "Pause Track View");
    try {
      await ensureAudio();
      if (requestId !== state.playbackRequestId) return;
      await loadLibrarySamplesForPlayback(mode);
      if (requestId !== state.playbackRequestId) return;
      state.isStartingPlayback = false;
      if (startAtMs === null && !remote && collaboration.session &&
        collaboration.socket?.readyState === WebSocket.OPEN) {
        startAtMs = Date.now() + 1500;
        sendCollaborationMessage({ type: "transport", action: "play", mode, startAtMs });
      }
      state.isPlaying = true;
      state.playbackMode = mode;
      const arrangementPlayback = mode === "arrangement";
      const { startBar: loopStartBar, endBar: loopEndBar } = getArrangementLoopRange();
      const startBar = arrangementPlayback
        ? state.arrangementLoopEnabled &&
          (state.arrangementCursor < loopStartBar || state.arrangementCursor >= loopEndBar)
          ? loopStartBar
          : Math.min(state.arrangementCursor, state.arrangementBars - 1)
        : 0;
      state.playbackStartBar = startBar;
      const scheduledStartTime = state.audioContext.currentTime + Math.max(
        0.04,
        startAtMs === null ? 0 : (startAtMs - Date.now()) / 1000,
      );
      state.playbackStartTime = scheduledStartTime;
      if (mode === "piano-roll") {
        const loopTicks = Math.max(1, getPianoPlaybackSource().loopBars * PIANO_TICKS_PER_BAR);
        const { startBar, endBar } = getPianoLoopRange();
        const loopStartTick = state.pianoLoopEnabled ? startBar * PIANO_TICKS_PER_BAR : 0;
        const loopEndTick = state.pianoLoopEnabled ? endBar * PIANO_TICKS_PER_BAR : loopTicks;
        const cursorTick = state.pianoLoopEnabled &&
          (state.pianoCursorTick < loopStartTick || state.pianoCursorTick >= loopEndTick)
          ? loopStartTick
          : state.pianoCursorTick % loopTicks;
        state.pianoCursorTick = cursorTick;
        state.pianoPlaybackStartTick = cursorTick;
        state.playbackStartTime -= cursorTick / PIANO_TICKS_PER_BAR * (240 / state.bpm);
      }
      state.playbackEndTime = arrangementPlayback
        ? state.playbackStartTime + ((state.arrangementLoopEnabled ? loopEndBar : state.arrangementBars) - startBar) *
          (240 / state.bpm)
        : Infinity;
      state.stepIndex = 0;
      state.scheduledPianoNotes.clear();
      state.scheduledArrangementSteps.clear();
      state.scheduledArrangementClicks.clear();
      state.arrangementLoopIteration = 0;
      state.preScheduledArrangementIteration = null;
      state.nextStepTime = scheduledStartTime;
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
      if (requestId !== state.playbackRequestId) return;
      state.isStartingPlayback = false;
      stopPlayback();
      showToast(error.message || "Audio could not start in this browser.");
    }
  }

  function scheduleArrangementClips(startTime, startBar) {
    const secondsPerBar = 240 / state.bpm;
    const arrangementEndBar = state.arrangementLoopEnabled
      ? getArrangementLoopRange().endBar
      : state.arrangementBars;
    scheduleArrangementAutomation(startTime, startBar, arrangementEndBar);
    state.arrangementTracks.forEach((track) => {
      ensureArrangementTrackAudio(track);
      track.clips.forEach((clip) => {
        getAudioClipSegments(clip, startBar, Math.min(
          arrangementEndBar,
          clip.startBar + getArrangementClipDuration("audio", clip),
        ))
          .forEach((segment) => {
            const when = startTime + (segment.startBar - startBar) * secondsPerBar;
            const { source, envelope } = createAudioClipPlaybackSource(
              state.audioContext, track, clip, segment, when, secondsPerBar,
            );
            source.onended = () => {
              state.arrangementSources.delete(source);
              envelope.disconnect();
            };
            state.arrangementSources.add(source);
          });
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
        getMelClipNoteEvents(mel, clip).forEach(({ note, loop, startBar: noteStartBar, endBar: noteEndBar }) => {
          const key = `${melTrack.id}:${clip.id}:${loop}:${note.id}`;
          if (state.scheduledPianoNotes.has(key)) return;
          if (noteEndBar <= startBar) return;
          const audibleStartBar = Math.max(startBar, noteStartBar);
          const when = startTime + (audibleStartBar - startBar) * secondsPerBar;
          const duration = Math.max(0, Math.min(noteEndBar, arrangementEndBar) - audibleStartBar) * secondsPerBar;
          if (duration > 0) {
            scheduleArrangementVoice(() =>
              playPianoNote(instrument, when, note.midi, duration, note.velocity ?? 0.8, melTrack, null, note));
            state.scheduledPianoNotes.add(key);
          }
        });
      });
    });
  }

  function getArrangementAutomationValue(track, property, bar) {
    const points = normalizeTrackAutomation(track.automation)[property];
    let previousBar = 0;
    let previousValue = track[property] ?? 0;
    for (const point of points) {
      if (point.bar >= bar) {
        const range = point.bar - previousBar;
        if (range <= 0) return point.value;
        const amount = Math.max(0, Math.min(1, (bar - previousBar) / range));
        return previousValue + (point.value - previousValue) * amount;
      }
      previousBar = point.bar;
      previousValue = point.value;
    }
    return previousValue;
  }

  function scheduleArrangementAutomation(startTime, startBar, endBar) {
    const tracks = [...state.patterns, ...state.melTracks, ...state.arrangementTracks];
    const secondsPerBar = 240 / state.bpm;
    tracks.forEach((track) => {
      const automation = normalizeTrackAutomation(track.automation);
      if (!automation.volume.length && !automation.pan.length) return;
      ensureTrackAudio(track);
      if (automation.volume.length && track.automationGainNode) {
        const gain = track.automationGainNode.gain;
        const toAutomationGain = (value) => track.volume > 0 ? value / track.volume : 1;
        gain.cancelScheduledValues(startTime);
        gain.setValueAtTime(toAutomationGain(getArrangementAutomationValue(track, "volume", startBar)), startTime);
        automation.volume
          .filter((point) => point.bar > startBar && point.bar <= endBar)
          .forEach((point) => gain.linearRampToValueAtTime(
            toAutomationGain(point.value),
            startTime + (point.bar - startBar) * secondsPerBar,
          ));
      }
      if (automation.pan.length && track.panNode) {
        const pan = track.panNode.pan;
        pan.cancelScheduledValues(startTime);
        pan.setValueAtTime(getArrangementAutomationValue(track, "pan", startBar), startTime);
        automation.pan
          .filter((point) => point.bar > startBar && point.bar <= endBar)
          .forEach((point) => pan.linearRampToValueAtTime(
            point.value,
            startTime + (point.bar - startBar) * secondsPerBar,
          ));
      }
    });
  }

  function stopPlayback(remote = false) {
    if ((state.isPlaying || state.isStartingPlayback) && !remote &&
      !collaboration.applyingRemote && collaboration.session) {
      sendCollaborationMessage({ type: "transport", action: "stop" });
    }
    state.playbackRequestId += 1;
    state.isStartingPlayback = false;
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
    state.scheduledArrangementClicks.clear();
    state.arrangementLoopIteration = 0;
    state.preScheduledArrangementIteration = null;
    updateKeyboardRecordButtons();
    if (stoppedRecording?.mode === "sequencer") renderTracks();
    state.isPlaying = false;
    state.playbackMode = "arrangement";
    syncMixerMeters();
    state.stepIndex = 0;
    state.stepTimers.forEach((timerId) => window.clearTimeout(timerId));
    state.stepTimers.clear();
    state.arrangementSources.forEach((source) => {
      try { source.stop(state.audioContext?.currentTime || 0); } catch { /* The source may have ended between scheduler ticks. */ }
    });
    state.arrangementSources.clear();
    if (stoppedPlaybackMode === "arrangement" && state.view === "arrangement") state.arrangementCursor = 0;
    if (state.audioContext) {
      const now = state.audioContext.currentTime;
      [...state.patterns, ...state.melTracks, ...state.arrangementTracks].forEach((track) => {
        track.gainNode?.gain.cancelScheduledValues(now);
        track.automationGainNode?.gain.cancelScheduledValues(now);
        track.automationGainNode?.gain.setValueAtTime(1, now);
        track.panNode?.pan.cancelScheduledValues(now);
      });
      updateTrackGains();
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
      masterPitch: state.masterPitch,
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
          pan: pattern.pan,
          automation: normalizeTrackAutomation(pattern.automation),
          automationOpen: pattern.automationOpen === true,
          muted: pattern.muted,
          solo: pattern.solo,
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
        pan: track.pan,
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
        pan: track.pan,
        automation: normalizeTrackAutomation(track.automation),
        automationOpen: track.automationOpen === true,
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
        audioSourceClipId: mel.audioSourceClipId || null,
      })),
      selectedMelId: state.selectedMelId,
      melTracks: state.melTracks.map((track) => ({
        id: track.id,
        name: track.name,
        insertAfterTrackId: track.insertAfterTrackId || null,
        instrumentId: track.instrumentId,
        color: track.color,
        volume: track.volume,
        pan: track.pan,
        automation: normalizeTrackAutomation(track.automation),
        automationOpen: track.automationOpen === true,
        muted: track.muted,
        solo: track.solo,
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
        clips: track.clips.map((clip) => ({ ...clip })),
      })),
      masterTrack: {
        volume: state.masterTrack.volume,
        pan: state.masterTrack.pan,
        effects: makeDefaultEffects(state.masterTrack.effects),
        effectSettings: makeDefaultEffectSettings(state.masterTrack.effectSettings),
        effectChain: ensureTrackMixerState(state.masterTrack),
      },
      effectTracks: state.effectTracks.map((track) => ({
        id: track.id,
        name: track.name,
        volume: track.volume,
        pan: track.pan,
        routedTrackIds: [...track.routedTrackIds],
        effects: makeDefaultEffects(track.effects),
        effectSettings: makeDefaultEffectSettings(track.effectSettings),
        effectChain: ensureTrackMixerState(track),
      })),
      patternClips: state.patternClips.map((clip) => ({ ...clip, repeatCount: clip.repeatCount || 1 })),
      pianoNotes: (savedMel?.notes || state.pianoNotes).map((note) => ({ ...note })),
      pianoStartBar: state.pianoStartBar,
      pianoCursorTick: stepEditContext?.previousCursorTick ?? state.pianoCursorTick,
      pianoLoopEnabled: state.pianoLoopEnabled,
      pianoLoopStartBar: state.pianoLoopStartBar,
      pianoLoopEndBar: state.pianoLoopEndBar,
      pianoBars: savedMel?.bars || state.pianoBars,
      pianoScale: state.pianoScale,
      pianoSnap: state.pianoSnap,
      pianoSnapEnabled: state.pianoSnapEnabled,
      pianoNoteLength: state.pianoNoteLength,
      pianoScaleRoot: state.pianoScaleRoot,
      pianoScaleType: state.pianoScaleType,
      pianoScaleLock: state.pianoScaleLock,
      soundDurationEdits: { ...state.soundDurationEdits },
      soundReverseEdits: { ...state.soundReverseEdits },
      selectedPianoTrackId: savedMel?.instrumentId || state.selectedPianoTrackId,
      arrangementBars: state.arrangementBars,
      arrangementScale: state.arrangementScale,
      arrangementCursor: state.arrangementCursor,
      arrangementLoopEnabled: state.arrangementLoopEnabled,
      arrangementLoopStartBar: state.arrangementLoopStartBar,
      arrangementLoopEndBar: state.arrangementLoopEndBar,
      arrangementSnap: state.arrangementSnap,
      workspaceRatio: state.workspaceRatio,
      sequencerScale: state.sequencerScale,
      workspaceHidden: state.workspaceHidden,
      trackViewHidden: state.trackViewHidden,
      view: stepEditContext?.previousView || state.view,
    };
  }

  let collaborationLeaveTimeout = null;
  let selectedProjectId = null;

  function renderCollaborationStatus(message = "Not connected") {
    const status = $("#collaboration-status");
    const activeRoom = $("#collaboration-active-room");
    const roomActions = $("#collaboration-room-actions");
    const code = $("#collaboration-room-code");
    const participants = $("#collaboration-participants");
    const presenceBar = $("#collaboration-presence-bar");
    const presenceText = $("#collaboration-presence-text");
    if (status) status.textContent = collaboration.conflicted ? collaboration.conflictMessage : message;
    if (activeRoom) activeRoom.hidden = !collaboration.session;
    if (roomActions) roomActions.hidden = Boolean(collaboration.session);
    if (code) code.textContent = collaboration.session?.roomCode || "";
    if (participants) {
      participants.textContent = collaboration.participantNames?.length
        ? `In this room: ${collaboration.participantNames.join(", ")}`
        : "";
    }
    if (presenceBar) presenceBar.hidden = !collaboration.session;
    if (presenceText) {
      const viewers = collaboration.viewers.length
        ? collaboration.viewers
        : [{ name: getCurrentUserName(), view: state.view }];
      presenceText.textContent = viewers
        .map(({ name, view }) => `${name} is viewing: ${getCollaborationViewName(view)}`)
        .join("  ·  ");
    }
  }

  function getCollaborationViewName(view) {
    return ({
      arrangement: "Arrangement",
      sequencer: "Step Sequencer",
      "piano-roll": "Piano Roll",
      mixer: "Mixer",
      dj: "DJ",
    })[view] || "DansBPM";
  }

  function normalizeCollaborationServerUrl(value) {
    const url = new URL(value.trim());
    if (url.protocol === "https:") url.protocol = "wss:";
    else if (url.protocol === "http:") url.protocol = "ws:";
    if (!["ws:", "wss:"].includes(url.protocol)) {
      throw new Error("Use a ws:// or wss:// collaboration server URL.");
    }
    if (url.pathname === "/") url.pathname = "/collaboration";
    if (url.pathname !== "/collaboration" || url.search || url.hash) {
      throw new Error("The collaboration server URL must end in /collaboration.");
    }
    if (url.protocol === "ws:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      throw new Error("Use wss:// for collaboration servers outside this device.");
    }
    return url.toString();
  }

  function saveCollaborationSession() {
    try {
      if (collaboration.session) {
        window.sessionStorage.setItem(COLLABORATION_SESSION_KEY, JSON.stringify(collaboration.session));
      } else {
        window.sessionStorage.removeItem(COLLABORATION_SESSION_KEY);
      }
      return true;
    } catch (error) {
      showToast(`Could not save the room session: ${error.message || "session storage is unavailable"}`);
      return false;
    }
  }

  async function getCollaborationAssets(projectId = state.projectId) {
    const records = window.indexedDB ? await getProjectRecordingRecords(projectId) : [];
    return Promise.all(records.map(async (record) => {
      if (!(record.blob instanceof Blob)) {
        throw new Error(`Could not share ${record.name || record.trackName || "a project audio file"}.`);
      }
      const { blob, ...metadata } = record;
      return { metadata, dataUrl: await blobToDataUrl(blob) };
    }));
  }

  function isValidCollaborativeSnapshot(snapshot) {
    return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) &&
      Array.isArray(snapshot.tracks) && Array.isArray(snapshot.patterns) &&
      Array.isArray(snapshot.patternClips) && Array.isArray(snapshot.mels) &&
      Array.isArray(snapshot.melTracks) && Array.isArray(snapshot.arrangementTracks);
  }

  function deserializeCollaborationAssets(snapshot, assets) {
    if (!isValidCollaborativeSnapshot(snapshot) || !Array.isArray(assets)) {
      throw new Error("The shared project data is invalid.");
    }
    const trackIds = new Set(snapshot.tracks
      .filter((track) => typeof track?.id === "string")
      .map((track) => track.id));
    return assets.map((asset) => {
      const metadata = asset?.metadata;
      if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) ||
        typeof metadata.trackId !== "string" || !metadata.trackId || typeof asset.dataUrl !== "string") {
        throw new Error("The shared project contains an invalid audio attachment.");
      }
      if (metadata.recordType !== undefined && metadata.recordType !== "drum-sample") {
        throw new Error("The shared project contains an unsupported audio attachment.");
      }
      if (metadata.recordType === "drum-sample" && !trackIds.has(metadata.trackId)) {
        throw new Error("The shared project contains audio for a missing track.");
      }
      return { metadata, blob: dataUrlToBlob(asset.dataUrl) };
    });
  }

  function sendCollaborationMessage(message) {
    if (collaboration.socket?.readyState !== WebSocket.OPEN) return false;
    collaboration.socket.send(JSON.stringify(message));
    return true;
  }

  function sendCollaborationView() {
    if (!collaboration.session) return;
    collaboration.viewers = collaboration.viewers.map((viewer) =>
      viewer.id === collaboration.participantId ? { ...viewer, view: state.view } : viewer,
    );
    if (!collaboration.applyingRemote) {
      sendCollaborationMessage({ type: "view", view: state.view });
    }
    renderCollaborationStatus();
  }

  const COLLABORATION_MISSING = Symbol("missing collaboration value");

  function collaborationValuesEqual(left, right) {
    if (Object.is(left, right)) return true;
    if (Array.isArray(left) && Array.isArray(right)) {
      return left.length === right.length && left.every((value, index) =>
        collaborationValuesEqual(value, right[index]),
      );
    }
    if (left && right && typeof left === "object" && typeof right === "object") {
      const leftKeys = Object.keys(left).sort();
      const rightKeys = Object.keys(right).sort();
      return leftKeys.length === rightKeys.length &&
        leftKeys.every((key, index) => key === rightKeys[index] &&
          collaborationValuesEqual(left[key], right[key]));
    }
    return false;
  }

  function collaborationArrayById(value) {
    if (!Array.isArray(value)) return null;
    const entries = new Map();
    for (const item of value) {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || entries.has(item.id)) return null;
      entries.set(item.id, item);
    }
    return entries;
  }

  function mergeCollaborationValues(base, local, remote, path, conflicts) {
    if (collaborationValuesEqual(local, base)) return remote;
    if (collaborationValuesEqual(remote, base) || collaborationValuesEqual(local, remote)) return local;

    if (Array.isArray(local) && Array.isArray(remote) &&
      (base === COLLABORATION_MISSING || Array.isArray(base))) {
      const baseArray = base === COLLABORATION_MISSING ? [] : base;
      const baseById = collaborationArrayById(baseArray);
      const localById = collaborationArrayById(local);
      const remoteById = collaborationArrayById(remote);
      if (baseById && localById && remoteById &&
        (baseArray.length + local.length + remote.length > 0)) {
        const mergedById = new Map();
        const ids = new Set([...baseById.keys(), ...localById.keys(), ...remoteById.keys()]);
        ids.forEach((id) => {
          const value = mergeCollaborationValues(
            baseById.get(id) ?? COLLABORATION_MISSING,
            localById.get(id) ?? COLLABORATION_MISSING,
            remoteById.get(id) ?? COLLABORATION_MISSING,
            `${path}[${id}]`,
            conflicts,
          );
          if (value !== COLLABORATION_MISSING) mergedById.set(id, value);
        });

        const commonBaseIds = baseArray.map(({ id }) => id)
          .filter((id) => localById.has(id) && remoteById.has(id) && mergedById.has(id));
        const localBaseOrder = local.map(({ id }) => id).filter((id) => commonBaseIds.includes(id));
        const remoteBaseOrder = remote.map(({ id }) => id).filter((id) => commonBaseIds.includes(id));
        const localReordered = !collaborationValuesEqual(localBaseOrder, commonBaseIds);
        const remoteReordered = !collaborationValuesEqual(remoteBaseOrder, commonBaseIds);
        if (localReordered && remoteReordered &&
          !collaborationValuesEqual(localBaseOrder, remoteBaseOrder)) {
          conflicts.push(`${path} order`);
        }

        const preferredOrder = localReordered && !remoteReordered
          ? local.map(({ id }) => id)
          : remote.map(({ id }) => id);
        const order = [...preferredOrder, ...local.map(({ id }) => id)];
        return [...new Set(order)].filter((id) => mergedById.has(id)).map((id) => mergedById.get(id));
      }

      if (base !== COLLABORATION_MISSING && local.length === base.length && remote.length === base.length) {
        return local.map((value, index) => mergeCollaborationValues(
          base[index],
          value,
          remote[index],
          `${path}[${index}]`,
          conflicts,
        ));
      }
    }

    const baseIsRecord = base === COLLABORATION_MISSING ||
      (base && typeof base === "object" && !Array.isArray(base));
    if (baseIsRecord && local && remote &&
      typeof local === "object" && !Array.isArray(local) &&
      typeof remote === "object" && !Array.isArray(remote)) {
      const merged = {};
      const keys = new Set([
        ...(base === COLLABORATION_MISSING ? [] : Object.keys(base)),
        ...Object.keys(local),
        ...Object.keys(remote),
      ]);
      keys.forEach((key) => {
        const value = mergeCollaborationValues(
          base !== COLLABORATION_MISSING && Object.hasOwn(base, key) ? base[key] : COLLABORATION_MISSING,
          Object.hasOwn(local, key) ? local[key] : COLLABORATION_MISSING,
          Object.hasOwn(remote, key) ? remote[key] : COLLABORATION_MISSING,
          path ? `${path}.${key}` : key,
          conflicts,
        );
        if (value !== COLLABORATION_MISSING) merged[key] = value;
      });
      return merged;
    }

    conflicts.push(path || "project");
    return local;
  }

  function sendCollaborationSnapshot(snapshot = createStateSnapshot()) {
    if (!collaboration.session || collaboration.applyingRemote || collaboration.conflicted) return;
    const updateId = (collaboration.lastUpdateId || 0) + 1;
    collaboration.lastUpdateId = updateId;
    const sent = sendCollaborationMessage({
      type: "update",
      snapshot,
      updateId,
      baseRevision: collaboration.revision,
    });
    if (sent) collaboration.sentUpdates.set(updateId, { snapshot });
    collaboration.localDirty = true;
    collaboration.session.localDirty = true;
    saveCollaborationSession();
  }

  async function sendCollaborationAssets() {
    if (!collaboration.session || collaboration.applyingRemote || collaboration.conflicted) return;
    try {
      const assets = await getCollaborationAssets();
      const updateId = (collaboration.lastUpdateId || 0) + 1;
      collaboration.lastUpdateId = updateId;
      const snapshot = createStateSnapshot();
      const sent = sendCollaborationMessage({
        type: "updateAssets",
        snapshot,
        assets,
        updateId,
        baseRevision: collaboration.revision,
      });
      if (sent) collaboration.sentUpdates.set(updateId, { snapshot, assets });
      collaboration.localDirty = true;
      collaboration.assetsDirty = !sent;
      collaboration.session.localDirty = true;
      collaboration.session.assetsDirty = !sent;
      saveCollaborationSession();
      if (!sent) renderCollaborationStatus("Offline — audio changes will sync when reconnected.");
    } catch (error) {
      showToast(`Could not share project audio: ${error.message || "audio storage is unavailable"}`);
    }
  }

  function scheduleCollaborationAssetSync() {
    if (!collaboration.session || collaboration.applyingRemote) return;
    window.clearTimeout(collaboration.assetsTimer);
    collaboration.assetsTimer = window.setTimeout(() => { void sendCollaborationAssets(); }, 500);
  }

  async function reconcileCollaborationSnapshot(snapshot, assets, revision, sender) {
    if (!collaboration.session || collaboration.conflicted || revision <= collaboration.revision) return;
    if (!isValidCollaborativeSnapshot(snapshot) || !collaboration.sharedSnapshot ||
      !Array.isArray(collaboration.sharedAssets)) {
      markCollaborationConflict(revision, sender);
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      markCollaborationConflict(revision, sender);
      return;
    }
    if (saveState.timeout) {
      collaboration.applyingRemote = true;
      try {
        if (!flushSaveState()) {
          markCollaborationConflict(revision, sender);
          return;
        }
      } finally {
        collaboration.applyingRemote = false;
      }
    }

    let localAssets;
    try {
      localAssets = await getCollaborationAssets();
    } catch (error) {
      showToast(`Could not reconcile project audio: ${error.message || "audio storage is unavailable"}`);
      markCollaborationConflict(revision, sender);
      return;
    }
    const localSnapshot = createStateSnapshot();
    const remoteAssets = Array.isArray(assets) ? assets : collaboration.sharedAssets;
    const conflicts = [];
    const mergedSnapshot = mergeCollaborationValues(
      collaboration.sharedSnapshot,
      localSnapshot,
      snapshot,
      "",
      conflicts,
    );
    ["patterns", "arrangementTracks", "melTracks"].forEach((collection) => {
      mergedSnapshot[collection].forEach((track) => {
        track.automation = normalizeTrackAutomation(track.automation);
      });
    });
    const localAssetsChanged = !collaborationValuesEqual(localAssets, collaboration.sharedAssets);
    const remoteAssetsChanged = !collaborationValuesEqual(remoteAssets, collaboration.sharedAssets);
    if (localAssetsChanged && remoteAssetsChanged &&
      !collaborationValuesEqual(localAssets, remoteAssets)) {
      conflicts.push("project audio");
    }
    if (conflicts.length) {
      markCollaborationConflict(revision, sender, conflicts[0]);
      return;
    }

    const mergedAssets = localAssetsChanged ? localAssets : remoteAssets;
    if (!await applyCollaborationSnapshot(mergedSnapshot, mergedAssets, sender)) {
      markCollaborationConflict(revision, sender);
      return;
    }
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    collaboration.revision = revision;
    collaboration.sharedSnapshot = snapshot;
    collaboration.sharedAssets = remoteAssets;
    collaboration.localDirty = false;
    collaboration.assetsDirty = false;
    collaboration.session.revision = revision;
    collaboration.session.localDirty = false;
    collaboration.session.assetsDirty = false;
    saveCollaborationSession();

    if (!collaborationValuesEqual(mergedSnapshot, snapshot) ||
      !collaborationValuesEqual(mergedAssets, remoteAssets)) {
      if (!collaborationValuesEqual(mergedAssets, remoteAssets)) void sendCollaborationAssets();
      else sendCollaborationSnapshot(mergedSnapshot);
    }
    renderCollaborationStatus(`Connected to room ${collaboration.session.roomCode}.`);
  }

  function markCollaborationConflict(revision, sender, detail = "") {
    collaboration.conflicted = true;
    collaboration.conflictMessage =
      `Conflict: ${sender || "A collaborator"} updated the room${detail ? ` (${detail})` : ""}. Your edits are saved locally and were not shared.`;
    collaboration.localDirty = true;
    if (collaboration.session) {
      collaboration.session.localDirty = true;
      saveCollaborationSession();
    }
    if (Number.isInteger(revision)) collaboration.revision = Math.max(collaboration.revision, revision);
    if (saveState.timeout) flushSaveState();
    renderCollaborationStatus();
    showToast(collaboration.conflictMessage);
  }

  function connectCollaboration(serverUrl, onOpen) {
    if (collaboration.socket) {
      collaboration.socket.close();
      collaboration.socket = null;
    }
    clearTimeout(collaboration.reconnectTimer);
    renderCollaborationStatus("Connecting…");
    let socket;
    try {
      socket = new WebSocket(serverUrl);
    } catch (error) {
      collaboration.pendingCreate = null;
      collaboration.pendingJoin = null;
      renderCollaborationStatus(`Could not connect: ${error.message || "invalid server URL"}`);
      return;
    }
    collaboration.socket = socket;
    socket.addEventListener("open", () => {
      if (collaboration.socket !== socket) return;
      onOpen(socket);
    });
    socket.addEventListener("message", (event) => {
      if (collaboration.socket === socket) void handleCollaborationMessage(event.data);
    });
    socket.addEventListener("error", () => {
      if (collaboration.socket === socket) renderCollaborationStatus("Could not reach the collaboration server.");
    });
    socket.addEventListener("close", () => {
      if (collaboration.socket !== socket) return;
      collaboration.socket = null;
      if (collaboration.session && !collaboration.manualLeave) {
        renderCollaborationStatus("Connection lost — retrying…");
        collaboration.reconnectTimer = window.setTimeout(() => {
          if (collaboration.session && !collaboration.manualLeave) resumeCollaborationSession();
        }, 2000);
      } else if (!collaboration.session) {
        collaboration.pendingCreate = null;
        collaboration.pendingJoin = null;
        renderCollaborationStatus("Not connected");
      }
    });
  }

  async function createLocalCollaborationProject({ serverUrl, roomCode, revision, snapshot, assets, projectName: sharedProjectName }) {
    if (!state.currentUser) throw new Error("Choose a profile before joining a room.");
    const projectId = makeId();
    const projectName = `${sharedProjectName || state.projectName} (Room ${roomCode.slice(0, 4)})`.slice(0, 64);
    const project = { id: projectId, name: projectName, ownerId: state.currentUser, updatedAt: Date.now() };
    const previousProjectId = state.projectId;
    const previousProjectName = state.projectName;
    const previousActiveProjectIds = { ...state.activeProjectIds };
    const previousProjects = [...state.projects];
    try {
      collaboration.session = { serverUrl, roomCode, projectId, revision };
      collaboration.sharedSnapshot = snapshot;
      collaboration.sharedAssets = assets || [];
      if (!saveCollaborationSession()) throw new Error("session storage is unavailable");
      window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
      state.projects.unshift(project);
      state.projectId = projectId;
      state.projectName = projectName;
      state.activeProjectIds[state.currentUser] = projectId;
      writeProjectCatalog();
      const importedAssets = deserializeCollaborationAssets(snapshot, assets);
      await persistImportedProjectAssets(projectId, importedAssets);
      collaboration.session.projectId = projectId;
      if (!saveCollaborationSession()) throw new Error("session storage is unavailable");
      window.location.reload();
    } catch (error) {
      collaboration.session = null;
      saveCollaborationSession();
      state.projects = previousProjects;
      state.projectId = previousProjectId;
      state.projectName = previousProjectName;
      state.activeProjectIds = previousActiveProjectIds;
      try {
        window.localStorage.removeItem(getProjectStorageKey(projectId));
        writeProjectCatalog();
      } catch {
        // Keep the original project selected if local storage is unavailable.
      }
      sendCollaborationMessage({ type: "leave" });
      showToast(`Could not create a local room copy: ${error.message || "browser storage is unavailable"}`);
    }
  }

  async function applyCollaborationSnapshot(snapshot, assets, sender) {
    if (!isValidCollaborativeSnapshot(snapshot)) {
      showToast("The collaboration server sent an invalid project snapshot.");
      return false;
    }
    collaboration.applyingRemote = true;
    try {
      stopPlayback();
      stopAllWorkspacePlayers();
      [...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
        ...state.effectTracks, state.masterTrack].forEach(disconnectTrackAudio);
      if (Array.isArray(assets) && (assets.length || window.indexedDB)) {
        const importedAssets = deserializeCollaborationAssets(snapshot, assets);
        await replaceProjectRecordingAssets(state.projectId, importedAssets);
      } else if (Array.isArray(assets) && assets.length) {
        throw new Error("This browser does not support shared project audio.");
      }
      window.localStorage.setItem(getProjectStorageKey(state.projectId), JSON.stringify(snapshot));
      state.tracks = makeTracks();
      const initialPattern = makePatternSnapshot(makeId(), "Pattern 1");
      state.patterns = [initialPattern];
      state.selectedPatternId = initialPattern.id;
      state.arrangementTracks = [];
      state.patternClips = [];
      state.mels = [];
      state.melTracks = [];
      state.pianoNotes = [];
      state.effectTracks = [];
      state.masterTrack = makeMixerBusTrack("mixer-master");
      state.selectedMelId = "";
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.selectedArrangementItems.clear();
      state.selectedStepCells.clear();
      state.selectedMixerTrackId = null;
      state.selectedMixerEffectId = null;
      state.clipboard = null;
      state.stepPianoEditContext = null;
      state.pianoSelectionFromMarquee = false;
      state.arrangementSelectionFromMarquee = false;
      restoreState();
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
      if (state.audioContext) initializeAudio();
      await restoreArrangement();
      undoStacks.clear();
      undoLatest.clear();
      seedUndoHistory();
      updateProjectNameLabel();
      updateStorageIndicator();
      showToast(`${sender || "A collaborator"} updated the shared project.`);
      return true;
    } catch (error) {
      showToast(`Could not apply the room update: ${error.message || "project data is unavailable"}`);
      return false;
    } finally {
      collaboration.applyingRemote = false;
    }
  }

  async function handleCollaborationMessage(raw) {
    let message;
    try {
      message = JSON.parse(typeof raw === "string" ? raw : await raw.text());
    } catch {
      renderCollaborationStatus("The collaboration server sent an invalid message.");
      return;
    }
    if (!message || typeof message !== "object") return;
    if (typeof message.hostName === "string" || Array.isArray(message.activityLog)) {
      applyCollaborationMetadata(message);
    }
    if (message.type === "left") {
      if (collaboration.manualLeave) finishLeavingCollaborationRoom(true);
      return;
    }
    if (message.type === "snapshotConflict") {
      if (Number.isInteger(message.updateId) && message.updateId !== collaboration.lastUpdateId) {
        collaboration.sentUpdates.delete(message.updateId);
        return;
      }
      collaboration.sentUpdates.delete(message.updateId);
      collaboration.applyQueue = collaboration.applyQueue.then(() =>
        reconcileCollaborationSnapshot(message.snapshot, message.assets, message.revision, message.sender),
      );
      return;
    }
    if (message.type === "error") {
      collaboration.pendingCreate = null;
      collaboration.pendingJoin = null;
      if (!collaboration.session && collaboration.socket) {
        const socket = collaboration.socket;
        collaboration.socket = null;
        socket.close();
      }
      renderCollaborationStatus(message.message || "The collaboration server reported an error.");
      return;
    }
    if (message.type === "roomCreated") {
      const pending = collaboration.pendingCreate;
      if (!pending) return;
      collaboration.pendingCreate = null;
      collaboration.session = {
        serverUrl: pending.serverUrl,
        roomCode: message.roomCode,
        projectId: "",
        revision: message.revision,
      };
      collaboration.lastRoomCode = message.roomCode;
      collaboration.participantNames = message.participants || [];
      collaboration.participantId = message.participantId || null;
      collaboration.viewers = message.viewers || [];
      collaboration.sharedSnapshot = pending.snapshot;
      collaboration.sharedAssets = pending.assets || [];
      renderCollaborationStatus("Room created. Preparing a shared project copy…");
      await createLocalCollaborationProject({
        ...pending,
        roomCode: message.roomCode,
        revision: message.revision,
      });
      return;
    }
    if (message.type === "roomState") {
      collaboration.participantNames = message.participants || collaboration.participantNames || [];
      collaboration.participantId = message.participantId || collaboration.participantId;
      collaboration.viewers = message.viewers || collaboration.viewers;
      if (!collaboration.session) {
        const pending = collaboration.pendingJoin;
        if (!pending) return;
        collaboration.pendingJoin = null;
        collaboration.sharedSnapshot = message.snapshot;
        collaboration.sharedAssets = message.assets || [];
        collaboration.participantId = message.participantId || null;
        collaboration.viewers = message.viewers || [];
        renderCollaborationStatus("Joined. Preparing a shared project copy…");
        await createLocalCollaborationProject({
          serverUrl: pending.serverUrl,
          roomCode: message.roomCode,
          revision: message.revision,
          snapshot: message.snapshot,
          assets: message.assets || [],
          projectName: message.projectName,
        });
        return;
      }
      const roomRevision = Number.isInteger(message.revision) ? message.revision : 0;
      if (collaboration.localDirty || collaboration.assetsDirty || saveState.timeout) {
        if (roomRevision > collaboration.revision) {
          collaboration.applyQueue = collaboration.applyQueue.then(() =>
            reconcileCollaborationSnapshot(message.snapshot, message.assets, roomRevision, message.sender),
          );
        } else if (!collaboration.sharedSnapshot) {
          collaboration.sharedSnapshot = message.snapshot;
          collaboration.sharedAssets = message.assets || [];
          if (collaboration.assetsDirty) void sendCollaborationAssets();
          else sendCollaborationSnapshot(createStateSnapshot());
        } else if (collaboration.assetsDirty) {
          void sendCollaborationAssets();
        } else {
          sendCollaborationSnapshot(createStateSnapshot());
        }
        return;
      }
      if (roomRevision <= collaboration.revision) {
        collaboration.sharedSnapshot = message.snapshot;
        collaboration.sharedAssets = message.assets || [];
      }
      renderCollaborationStatus(`Connected to room ${collaboration.session.roomCode}.`);
    }
    if (message.type === "presence") {
      collaboration.participantNames = message.participants || [];
      collaboration.viewers = message.viewers || [];
      renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
    }
    if (message.type === "snapshotAck") {
      const sentUpdate = collaboration.sentUpdates.get(message.updateId);
      if (message.updateId === collaboration.lastUpdateId && !collaboration.conflicted) {
        collaboration.localDirty = false;
        collaboration.assetsDirty = false;
        if (collaboration.session) {
          collaboration.session.localDirty = false;
          collaboration.session.assetsDirty = false;
        }
      }
      if (Number.isInteger(message.revision)) {
        if (message.revision >= collaboration.revision) {
          collaboration.revision = message.revision;
          if (sentUpdate && !collaboration.conflicted) {
            collaboration.sharedSnapshot = sentUpdate.snapshot;
            if (sentUpdate.assets) collaboration.sharedAssets = sentUpdate.assets;
          }
        }
        if (collaboration.session && !collaboration.conflicted && message.revision >= collaboration.revision) {
          collaboration.session.revision = message.revision;
          saveCollaborationSession();
        }
      }
      collaboration.sentUpdates.delete(message.updateId);
      renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
    }
    if (message.type === "transport") {
      if (message.action === "stop") {
        stopPlayback(true);
      } else if (message.action === "play" &&
        ["arrangement", "sequencer", "piano-roll"].includes(message.mode) &&
        Number.isInteger(message.startAtMs)) {
        if (state.isPlaying || state.isStartingPlayback) stopPlayback(true);
        void startPlayback(message.mode, { startAtMs: message.startAtMs, remote: true });
      }
    }
    if (message.type === "snapshot" || message.type === "roomState") {
      const revision = Number.isInteger(message.revision) ? message.revision : 0;
      if (collaboration.session && revision > collaboration.revision) {
        collaboration.applyQueue = collaboration.applyQueue.then(async () => {
          if (revision <= collaboration.revision) return;
          if (saveState.timeout || collaboration.localDirty || state.mediaRecorder?.state === "recording") {
            await reconcileCollaborationSnapshot(
              message.snapshot,
              message.assets,
              revision,
              message.sender,
            );
            return;
          }
          const applied = await applyCollaborationSnapshot(message.snapshot, message.assets, message.sender);
          if (applied && !collaboration.localDirty) {
            collaboration.assetsDirty = false;
            collaboration.revision = revision;
            collaboration.sharedSnapshot = message.snapshot;
            if (Array.isArray(message.assets)) collaboration.sharedAssets = message.assets;
            else if (!Array.isArray(collaboration.sharedAssets)) collaboration.sharedAssets = [];
            collaboration.session.revision = revision;
            collaboration.session.localDirty = false;
            collaboration.session.assetsDirty = false;
            saveCollaborationSession();
          }
          renderCollaborationStatus(`Connected to room ${collaboration.session?.roomCode || ""}.`);
        });
      }
    }
  }

  function beginCollaborationConnection(action, serverUrl, roomCode = "") {
    collaboration.manualLeave = false;
    if (action === "create") {
      collaboration.pendingCreate = {
        serverUrl,
        projectId: state.projectId,
        projectName: state.projectName,
        snapshot: createStateSnapshot(),
        assets: [],
      };
      renderCollaborationStatus("Packing project audio…");
      void getCollaborationAssets(collaboration.pendingCreate.projectId).then((assets) => {
        if (!collaboration.pendingCreate) return;
        collaboration.pendingCreate.assets = assets;
        connectCollaboration(serverUrl, (socket) => {
          socket.send(JSON.stringify({
            type: "create",
            name: getCurrentUserName(),
            view: state.view,
            projectName: collaboration.pendingCreate.projectName,
            snapshot: collaboration.pendingCreate.snapshot,
            assets: collaboration.pendingCreate.assets,
          }));
        });
      }).catch((error) => {
        collaboration.pendingCreate = null;
        renderCollaborationStatus(`Could not prepare this project: ${error.message || "audio storage is unavailable"}`);
      });
      return;
    }
    collaboration.pendingJoin = { serverUrl };
    connectCollaboration(serverUrl, (socket) => {
      socket.send(JSON.stringify({
        type: "join",
        roomCode: roomCode.trim().toUpperCase(),
        name: getCurrentUserName(),
        view: state.view,
      }));
    });
  }

  function startCollaborationRoom(action) {
    if (!state.currentUser) {
      showToast("Choose a profile before starting collaboration.");
      return;
    }
    void ensureAudio().catch((error) => {
      renderCollaborationStatus(`Room editing is available, but audio could not be unlocked: ${error.message || "audio is unavailable"}`);
    });
    let serverUrl;
    try {
      serverUrl = normalizeCollaborationServerUrl($("#collaboration-server-url").value);
      window.localStorage.setItem(COLLABORATION_URL_KEY, serverUrl);
    } catch (error) {
      renderCollaborationStatus(error.message || "Enter a valid collaboration server URL.");
      return;
    }
    if (collaboration.session) {
      renderCollaborationStatus("Leave the current room before joining another.");
      return;
    }
    if (collaboration.socket || collaboration.pendingCreate || collaboration.pendingJoin) {
      renderCollaborationStatus("A room connection is already in progress.");
      return;
    }
    if (!flushSaveState()) {
      renderCollaborationStatus("Could not save the current project; collaboration was not started.");
      return;
    }
    if (action === "join") {
      const roomCode = $("#collaboration-room-code-input").value.trim().toUpperCase();
      if (!/^[0-9A-F]{20}$/.test(roomCode)) {
        renderCollaborationStatus("Enter the 20-character room code.");
        return;
      }
      beginCollaborationConnection("join", serverUrl, roomCode);
      return;
    }
    beginCollaborationConnection("create", serverUrl);
  }

  function resumeCollaborationSession() {
    let session;
    try {
      session = JSON.parse(window.sessionStorage.getItem(COLLABORATION_SESSION_KEY) || "null");
    } catch {
      renderCollaborationStatus("Room sessions are unavailable in this browser.");
      return;
    }
    if (!session || session.projectId !== state.projectId || !session.serverUrl || !session.roomCode) {
      if (session) {
        try { window.sessionStorage.removeItem(COLLABORATION_SESSION_KEY); } catch { /* Session storage may be unavailable. */ }
      }
      return;
    }
    collaboration.session = session;
    collaboration.revision = Number.isInteger(session.revision) ? session.revision : 0;
    collaboration.localDirty = session.localDirty === true;
    collaboration.assetsDirty = session.assetsDirty === true;
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    collaboration.manualLeave = false;
    $("#collaboration-dialog").showModal();
    const serverUrl = session.serverUrl;
    connectCollaboration(serverUrl, (socket) => {
      socket.send(JSON.stringify({
        type: "join",
        roomCode: session.roomCode,
        name: getCurrentUserName(),
        view: state.view,
      }));
    });
  }

  function leaveCollaborationRoom() {
    if (!collaboration.session) return;
    flushSaveState();
    collaboration.manualLeave = true;
    if (!sendCollaborationMessage({ type: "leave" })) {
      finishLeavingCollaborationRoom();
      return;
    }
    renderCollaborationStatus("Leaving room…");
    window.clearTimeout(collaborationLeaveTimeout);
    collaborationLeaveTimeout = window.setTimeout(finishLeavingCollaborationRoom, 1800);
  }

  function finishLeavingCollaborationRoom(serverConfirmed = false) {
    window.clearTimeout(collaborationLeaveTimeout);
    collaborationLeaveTimeout = null;
    if (!collaboration.session) return;
    collaboration.lastRoomCode = collaboration.session.roomCode;
    if (!serverConfirmed) {
      recordLocalCollaborationActivity("left", getCurrentUserName());
    }
    collaboration.socket?.close();
    collaboration.socket = null;
    collaboration.session = null;
    collaboration.localDirty = false;
    collaboration.conflicted = false;
    collaboration.conflictMessage = "";
    collaboration.participantId = null;
    collaboration.viewers = [];
    collaboration.sharedSnapshot = null;
    collaboration.sharedAssets = null;
    collaboration.sentUpdates.clear();
    saveCollaborationSession();
    renderCollaborationStatus("Room left. This project's local copy is saved.");
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
      if (collaboration.session && !collaboration.applyingRemote && projectId === state.projectId) {
        sendCollaborationSnapshot(snapshot);
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
    if (!state.currentUser || collaboration.applyingRemote) return;
    const saveDot = $(".save-dot");
    $("#save-state").textContent = "Saving…";
    saveDot.style.background = "#c8a95a";
    const snapshot = createStateSnapshot();
    updateProjectKeyIndicator();
    if (!isApplyingUndo) recordUndoSnapshot(getUndoScope(), snapshot);
    const projectId = state.projectId;
    window.clearTimeout(saveState.timeout);
    saveState.timeout = window.setTimeout(() => {
      persistStateSnapshot(snapshot, projectId);
    }, 250);
  }

  function getUndoScope() {
    if (state.view === "piano-roll") return "piano-roll";
    if (state.view === "sequencer") return "step-grid";
    if (state.view === "dj") return "dj";
    return "track-view";
  }

  function cloneHistoryTrack(track) {
    return {
      ...track,
      cells: Array.isArray(track.cells) ? [...track.cells] : track.cells,
      clips: Array.isArray(track.clips) ? track.clips.map((clip) => ({ ...clip })) : track.clips,
      effects: makeDefaultEffects(track.effects),
      effectSettings: makeDefaultEffectSettings(track.effectSettings),
      effectChain: Array.isArray(track.effectChain) ? track.effectChain.map((effect) => ({ ...effect })) : track.effectChain,
      automation: normalizeTrackAutomation(track.automation),
    };
  }

  function cloneHistoryPattern(pattern) {
    return {
      ...cloneHistoryTrack(pattern),
      trackIds: [...(pattern.trackIds || [])],
      cells: Object.fromEntries(Object.entries(pattern.cells || {}).map(([trackId, cells]) =>
        [trackId, Array.isArray(cells) ? [...cells] : []])),
      variants: { ...(pattern.variants || {}) },
      stepPianoNotes: pattern.stepPianoNotes
        ? Object.fromEntries(Object.entries(pattern.stepPianoNotes).map(([trackId, notes]) =>
          [trackId, notes.map((note) => ({ ...note }))]))
        : undefined,
    };
  }

  function cloneHistoryMel(mel) {
    return { ...mel, notes: mel.notes.map((note) => ({ ...note })) };
  }

  function getDjUndoSnapshot() {
    return {
      activeDeck: djState.activeDeck,
      crossfader: djState.crossfader,
      masterVolume: djState.masterVolume,
      masterLow: djState.masterLow,
      masterMid: djState.masterMid,
      masterHigh: djState.masterHigh,
      masterFilter: djState.masterFilter,
      arrangementViewStartBar: djState.arrangementViewStartBar,
      liveSlots: djState.liveSlots.map((slot) => slot ? { ...slot } : null),
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
  }

  function createUndoSnapshot(scope, serialized = null) {
    const saved = serialized || createStateSnapshot();
    if (scope === "dj") {
      const dj = getDjUndoSnapshot();
      return { fingerprint: JSON.stringify(dj), dj };
    }
    if (scope === "piano-roll") {
      return {
        fingerprint: JSON.stringify({
          pianoNotes: saved.pianoNotes,
          mels: saved.mels,
          selectedMelId: saved.selectedMelId,
          pianoLoopEnabled: saved.pianoLoopEnabled,
          pianoLoopStartBar: saved.pianoLoopStartBar,
          pianoLoopEndBar: saved.pianoLoopEndBar,
          pianoScaleRoot: saved.pianoScaleRoot,
          pianoScaleType: saved.pianoScaleType,
          pianoScaleLock: saved.pianoScaleLock,
        }),
        serialized: saved,
        mels: state.mels.map(cloneHistoryMel),
      };
    }
    if (scope === "step-grid") {
      const patternGridState = saved.patterns.map(({ volume, muted, solo, ...pattern }) => pattern);
      return {
        fingerprint: JSON.stringify({
          patterns: patternGridState,
          tracks: saved.tracks,
          steps: saved.steps,
          selectedPatternId: saved.selectedPatternId,
          bpm: saved.bpm,
          swing: saved.swing,
        }),
        serialized: saved,
        patterns: state.patterns.map(cloneHistoryPattern),
        tracks: state.tracks.map(cloneHistoryTrack),
      };
    }
    const audioClipState = state.arrangementTracks.map((track) => ({
      id: track.id,
      clips: track.clips.map(({ buffer, ...clip }) => clip),
    }));
    const patterns = state.patterns.map(({ id, volume, muted, solo }) => ({ id, volume, muted, solo }));
    const trackViewState = {
      patterns,
      patternClips: state.patternClips,
      melTracks: saved.melTracks,
      arrangementTracks: saved.arrangementTracks.map((track) => ({
        ...track,
        clips: audioClipState.find((item) => item.id === track.id)?.clips || [],
      })),
      arrangementBars: saved.arrangementBars,
      arrangementCursor: saved.arrangementCursor,
      arrangementLoopEnabled: saved.arrangementLoopEnabled,
      arrangementLoopStartBar: saved.arrangementLoopStartBar,
      arrangementLoopEndBar: saved.arrangementLoopEndBar,
      bpm: saved.bpm,
      swing: saved.swing,
      selectedMixerTrackId: state.selectedMixerTrackId,
    };
    return {
      fingerprint: JSON.stringify(trackViewState),
      serialized: saved,
      patterns,
      patternClips: state.patternClips.map((clip) => ({ ...clip })),
      melTracks: state.melTracks.map(cloneHistoryTrack),
      arrangementTracks: state.arrangementTracks.map(cloneHistoryTrack),
      selectedMixerTrackId: state.selectedMixerTrackId,
    };
  }

  function recordUndoSnapshot(scope, serialized = null) {
    if (isApplyingUndo) return;
    const next = createUndoSnapshot(scope, serialized);
    const previous = undoLatest.get(scope);
    if (previous && previous.fingerprint !== next.fingerprint) {
      const history = undoStacks.get(scope) || [];
      history.push(previous);
      if (history.length > MAX_UNDO_STEPS) history.shift();
      undoStacks.set(scope, history);
    }
    undoLatest.set(scope, next);
  }

  function seedUndoHistory() {
    ["track-view", "piano-roll", "step-grid", "dj"].forEach((scope) => {
      undoLatest.set(scope, createUndoSnapshot(scope));
    });
  }

  function restoreDjUndoSnapshot(snapshot) {
    const dj = snapshot.dj;
    const restartDecks = [];
    Object.assign(djState, {
      activeDeck: dj.activeDeck,
      crossfader: dj.crossfader,
      masterVolume: dj.masterVolume,
      masterLow: dj.masterLow,
      masterMid: dj.masterMid,
      masterHigh: dj.masterHigh,
      masterFilter: dj.masterFilter,
      arrangementViewStartBar: dj.arrangementViewStartBar,
      liveSlots: dj.liveSlots.map((slot) => slot ? { ...slot } : null),
    });
    DJ_DECK_IDS.forEach((deckId) => {
      const deck = djState.decks[deckId];
      const savedDeck = dj.decks[deckId];
      if (deck.playing && (deck.sourceKey !== savedDeck.sourceKey || deck.reverse !== savedDeck.reverse)) {
        stopDjDeck(deckId);
        restartDecks.push(deckId);
      }
      Object.assign(deck, savedDeck);
    });
    DJ_DECK_IDS.forEach((deckId) => {
      const deck = djState.decks[deckId];
      updateDjAudioRate(deck, () => {}, 0.015);
      updateDjSongRate(deck);
    });
    applyDjMixer();
    renderDjView();
    restartDecks.forEach((deckId) => { void startDjDeck(deckId); });
    saveDjState();
  }

  function applyUndoSnapshot(scope, snapshot) {
    const saved = snapshot.serialized;
    if (scope === "dj") {
      restoreDjUndoSnapshot(snapshot);
      return;
    }
    if (scope === "piano-roll") {
      state.mels = snapshot.mels.map(cloneHistoryMel);
      state.selectedMelId = saved.selectedMelId;
      state.pianoNotes = saved.pianoNotes.map((note) => ({ ...note }));
      state.pianoBars = saved.pianoBars;
      state.pianoCursorTick = saved.pianoCursorTick;
      state.pianoLoopEnabled = saved.pianoLoopEnabled;
      state.pianoLoopStartBar = saved.pianoLoopStartBar;
      state.pianoLoopEndBar = saved.pianoLoopEndBar;
      state.pianoScaleRoot = saved.pianoScaleRoot;
      state.pianoScaleType = saved.pianoScaleType;
      state.pianoScaleLock = saved.pianoScaleLock;
      state.selectedPianoTrackId = saved.selectedPianoTrackId;
      renderMelOptions();
      renderPianoRoll();
    } else if (scope === "step-grid") {
      const currentPatternControls = new Map(state.patterns.map((pattern) => [pattern.id, pattern]));
      state.patterns = snapshot.patterns.map((pattern) => {
        const current = currentPatternControls.get(pattern.id);
        return {
          ...cloneHistoryPattern(pattern),
          volume: current?.volume ?? pattern.volume,
          muted: current?.muted ?? pattern.muted,
          solo: current?.solo ?? pattern.solo,
        };
      });
      state.tracks = snapshot.tracks.map(cloneHistoryTrack);
      state.steps = saved.steps;
      state.bpm = saved.bpm;
      state.swing = saved.swing;
      state.selectedPatternId = saved.selectedPatternId;
      applyPattern(getPattern());
      tempoValue.textContent = String(state.bpm);
      swingSlider.value = String(state.swing);
      $("#swing-value").textContent = `${state.swing}%`;
      swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
      setLength(state.steps);
      renderTracks();
      renderPatternSelectors();
      renderArrangement();
    } else {
      const savedPatternControls = new Map(snapshot.patterns.map((pattern) => [pattern.id, pattern]));
      state.patterns.forEach((pattern) => {
        const savedPattern = savedPatternControls.get(pattern.id);
        if (!savedPattern) return;
        pattern.volume = savedPattern.volume;
        pattern.muted = savedPattern.muted;
        pattern.solo = savedPattern.solo;
      });
      state.patternClips = snapshot.patternClips.map((clip) => ({ ...clip }));
      state.melTracks = snapshot.melTracks.map(cloneHistoryTrack);
      state.arrangementTracks = snapshot.arrangementTracks.map(cloneHistoryTrack);
      state.selectedMixerTrackId = snapshot.selectedMixerTrackId;
      state.arrangementBars = saved.arrangementBars;
      state.arrangementCursor = saved.arrangementCursor;
      state.arrangementLoopEnabled = saved.arrangementLoopEnabled;
      state.arrangementLoopStartBar = saved.arrangementLoopStartBar;
      state.arrangementLoopEndBar = saved.arrangementLoopEndBar;
      state.bpm = saved.bpm;
      state.swing = saved.swing;
      tempoValue.textContent = String(state.bpm);
      swingSlider.value = String(state.swing);
      $("#swing-value").textContent = `${state.swing}%`;
      swingSlider.style.setProperty("--range-progress", `${state.swing / 45 * 100}%`);
      updateArrangementLength();
      updateTrackGains();
      renderArrangement();
      renderMixer();
      renderDjView();
    }
    recordUndoSnapshot(scope);
    if (scope === "track-view") {
      state.arrangementTracks.forEach(persistTrackClips);
    }
    saveState();
  }

  function undoCurrentView() {
    const scope = getUndoScope();
    const history = undoStacks.get(scope);
    const snapshot = history?.pop();
    if (!snapshot) {
      showToast("Nothing to undo in this view.");
      return;
    }
    isApplyingUndo = true;
    let restored = false;
    try {
      applyUndoSnapshot(scope, snapshot);
      undoLatest.set(scope, createUndoSnapshot(scope));
      restored = true;
    } catch (error) {
      history.push(snapshot);
      showToast(`Could not undo that action: ${error.message || "the previous state could not be restored"}`);
    } finally {
      isApplyingUndo = false;
    }
    if (!restored) return;
  }

  function renderProjectList() {
    const list = $("#project-list");
    const projects = getCurrentUserProjects();
    if (!projects.some((project) => project.id === selectedProjectId)) {
      selectedProjectId = state.projectId;
    }
    list.replaceChildren();
    projects.forEach((project) => {
      const button = document.createElement("button");
      button.className = `project-list-item${project.id === state.projectId ? " is-current" : ""}${project.id === selectedProjectId ? " is-selected" : ""}`;
      button.type = "button";
      button.setAttribute("aria-pressed", String(project.id === selectedProjectId));
      const name = document.createElement("span");
      name.className = "project-list-name";
      name.textContent = project.name;
      const detail = document.createElement("span");
      detail.className = "project-list-detail";
      detail.textContent = project.id === state.projectId
        ? "CURRENT PROJECT"
        : project.updatedAt ? `SAVED ${new Date(project.updatedAt).toLocaleDateString()}` : "NOT SAVED YET";
      button.append(name, detail);
      button.addEventListener("click", () => {
        selectedProjectId = project.id;
        renderProjectList();
      });
      list.append(button);
    });
    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    $("#enter-project-button").disabled = !selectedProject || selectedProject.id === state.projectId;
    $("#delete-project-button").disabled = !selectedProject;
    $("#delete-project-button").title = "Permanently delete the selected project and its saved audio.";
  }

  function enterSelectedProject() {
    if (selectedProjectId) switchProject(selectedProjectId);
  }

  async function deleteSelectedProject() {
    const project = state.projects.find((item) =>
      item.id === selectedProjectId && item.ownerId === state.currentUser);
    if (!project) return;
    const isCurrentProject = project.id === state.projectId;
    if (isCurrentProject && state.mediaRecorder?.state === "recording") {
      showToast("Stop audio recording before deleting the current project.");
      return;
    }
    if (isCurrentProject && collaboration.session) {
      showToast("Leave the collaboration room before deleting the current project.");
      return;
    }
    if (!window.confirm(`Permanently delete "${project.name}" and its saved audio?`)) return;
    if (isCurrentProject && !flushSaveState()) {
      showToast("Could not save this project; deletion was cancelled.");
      return;
    }

    const snapshotKey = getProjectStorageKey(project.id);
    const djKey = `${snapshotKey}:dj`;
    const legacySnapshotKey = project.id === "default" ? STORAGE_KEY : null;
    const legacyNameKey = project.id === "default" ? `${STORAGE_KEY}-name` : null;
    const previousProjects = state.projects;
    const previousActiveProjectIds = { ...state.activeProjectIds };
    const previousProjectId = state.projectId;
    const previousProjectName = state.projectName;
    const previousSelectedProjectId = selectedProjectId;
    let projectSnapshot = null;
    let djSnapshot = null;
    let legacySnapshot = null;
    let legacyName = null;
    try {
      projectSnapshot = window.localStorage.getItem(snapshotKey);
      djSnapshot = window.localStorage.getItem(djKey);
      if (legacySnapshotKey) legacySnapshot = window.localStorage.getItem(legacySnapshotKey);
      if (legacyNameKey) legacyName = window.localStorage.getItem(legacyNameKey);
      if (isCurrentProject) {
        let replacement = getCurrentUserProjects().find((item) => item.id !== project.id);
        if (!replacement) {
          replacement = {
            id: makeId(),
            name: "Untitled session",
            ownerId: state.currentUser,
            updatedAt: Date.now(),
          };
          state.projects.unshift(replacement);
        }
        state.projectId = replacement.id;
        state.projectName = replacement.name;
        state.activeProjectIds = { ...state.activeProjectIds, [state.currentUser]: replacement.id };
        selectedProjectId = replacement.id;
        updateProjectNameLabel();
      }
      state.projects = state.projects.filter((item) => item.id !== project.id);
      window.localStorage.removeItem(snapshotKey);
      window.localStorage.removeItem(djKey);
      if (legacySnapshotKey) window.localStorage.removeItem(legacySnapshotKey);
      if (legacyNameKey) window.localStorage.removeItem(legacyNameKey);
      writeProjectCatalog();
      await replaceProjectRecordingAssets(project.id, []);
      if (isCurrentProject) {
        if (state.isPlaying) stopPlayback();
        stopAllWorkspacePlayers();
        window.location.reload();
        return;
      }
      selectedProjectId = state.projectId;
      renderProjectList();
      showToast(`${project.name} deleted`);
    } catch (error) {
      state.projects = previousProjects;
      state.projectId = previousProjectId;
      state.projectName = previousProjectName;
      state.activeProjectIds = previousActiveProjectIds;
      selectedProjectId = previousSelectedProjectId;
      updateProjectNameLabel();
      try {
        if (projectSnapshot !== null) window.localStorage.setItem(snapshotKey, projectSnapshot);
        if (djSnapshot !== null) window.localStorage.setItem(djKey, djSnapshot);
        if (legacySnapshotKey && legacySnapshot !== null) window.localStorage.setItem(legacySnapshotKey, legacySnapshot);
        if (legacyNameKey && legacyName !== null) window.localStorage.setItem(legacyNameKey, legacyName);
        writeProjectCatalog();
      } catch (rollbackError) {
        renderProjectList();
        showToast(`Could not delete ${project.name}; rollback was incomplete: ${rollbackError.message || "browser storage is unavailable"}`);
        return;
      }
      renderProjectList();
      showToast(`Could not delete ${project.name}: ${error.message || "browser storage is unavailable"}`);
    }
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

  function normalizePianoAudioSlice(slice) {
    if (!slice || typeof slice.clipId !== "string" || !slice.clipId ||
      !Number.isFinite(slice.offsetSeconds) ||
      !Number.isFinite(slice.durationSeconds) || slice.durationSeconds <= 0) return null;
    return {
      clipId: slice.clipId.slice(0, 128),
      offsetSeconds: Math.max(0, slice.offsetSeconds),
      durationSeconds: Math.max(0.001, slice.durationSeconds),
      dropOff: Number.isFinite(slice.dropOff) ? Math.max(0, Math.min(90, slice.dropOff)) : 10,
      sliceNumber: Number.isInteger(slice.sliceNumber) ? Math.max(1, Math.min(4096, slice.sliceNumber)) : 1,
      rootMidi: Number.isInteger(slice.rootMidi)
        ? Math.max(PIANO_BOTTOM_MIDI, Math.min(PIANO_TOP_MIDI, slice.rootMidi)) : 60,
      pitchEdited: slice.pitchEdited === true,
      pitchEditable: slice.pitchEditable === true,
    };
  }

  function renameProject() {
    const project = state.projects.find((item) =>
      item.id === selectedProjectId && item.ownerId === state.currentUser);
    if (!project) return;
    const name = window.prompt("Rename project", project.name);
    const trimmed = name?.trim();
    if (!trimmed) return;
    const previousName = project.name;
    project.name = trimmed;
    const isCurrentProject = project.id === state.projectId;
    if (isCurrentProject) {
      state.projectName = trimmed;
      updateProjectNameLabel();
    }
    try {
      writeProjectCatalog();
      renderProjectList();
    } catch (error) {
      project.name = previousName;
      if (isCurrentProject) {
        state.projectName = previousName;
        updateProjectNameLabel();
      }
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

  function persistImportedProjectAssets(projectId, assets) {
    if (!assets.length) return Promise.resolve();
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      transaction.oncomplete = () => {
        database.close();
        resolve();
        if (projectId === state.projectId) scheduleCollaborationAssetSync();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Could not save imported project audio."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Project audio import was cancelled."));
      };
      try {
        assets.forEach(({ metadata, blob }) => {
          store.put({
            ...metadata,
            id: metadata.recordType === "drum-sample"
              ? getDrumSampleRecordId(metadata.trackId, projectId)
              : makeId(),
            projectId,
            blob,
          });
        });
      } catch (error) {
        try { transaction.abort(); } catch { database.close(); }
        reject(error);
      }
    }));
  }

  function replaceProjectRecordingAssets(projectId, assets) {
    return openRecordingDb().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction("recordings", "readwrite");
      const store = transaction.objectStore("recordings");
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Could not update shared project audio."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Shared project audio update was cancelled."));
      };
      const request = store.getAll();
      request.onerror = () => {
        try { transaction.abort(); } catch { database.close(); }
      };
      request.onsuccess = () => {
        try {
          request.result
            .filter((record) => record.projectId === projectId || (!record.projectId && projectId === "default"))
            .forEach((record) => store.delete(record.id));
          assets.forEach(({ metadata, blob }) => {
            store.put({
              ...metadata,
              id: metadata.recordType === "drum-sample"
                ? getDrumSampleRecordId(metadata.trackId, projectId)
                : makeId(),
              projectId,
              blob,
            });
          });
        } catch (error) {
          try { transaction.abort(); } catch { database.close(); }
          reject(error);
        }
      };
    }));
  }

  async function importProjectFile(file) {
    if (!file) return;
    if (!state.currentUser) {
      showToast("Choose a profile before importing a project.");
      return;
    }
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before importing a project.");
      return;
    }

    let projectFile;
    let snapshot;
    let assets;
    try {
      projectFile = JSON.parse(await file.text());
      snapshot = projectFile?.project?.snapshot;
      if (projectFile?.app !== "DansBPM" || projectFile.format !== "dansbpm-project" ||
        projectFile.version !== 1 || typeof projectFile.project?.name !== "string" ||
        !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot) ||
        !Array.isArray(snapshot.tracks) || !Array.isArray(snapshot.patterns) ||
        !Array.isArray(snapshot.patternClips) || !Array.isArray(snapshot.mels) ||
        !Array.isArray(snapshot.melTracks) || !Array.isArray(snapshot.arrangementTracks) ||
        !Array.isArray(projectFile.assets)) {
        throw new Error("This is not a supported DansBPM project file.");
      }
      const trackIds = new Set(snapshot.tracks
        .filter((track) => typeof track?.id === "string")
        .map((track) => track.id));
      assets = projectFile.assets.map((asset) => {
        const metadata = asset?.metadata;
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) ||
          typeof metadata.trackId !== "string" || !metadata.trackId || typeof asset.dataUrl !== "string") {
          throw new Error("The project contains an invalid audio attachment.");
        }
        if (metadata.recordType !== undefined && metadata.recordType !== "drum-sample") {
          throw new Error("The project contains an unsupported audio attachment.");
        }
        if (metadata.recordType === "drum-sample" && !trackIds.has(metadata.trackId)) {
          throw new Error("The project contains a drum sample for a missing track.");
        }
        return { metadata, blob: dataUrlToBlob(asset.dataUrl) };
      });
    } catch (error) {
      showToast(`Could not read the project: ${error.message || "the file is invalid"}`);
      return;
    }

    if (!flushSaveState()) {
      showToast("Could not save the current project; import was cancelled.");
      return;
    }
    const previousProjectId = state.projectId;
    const previousProjectName = state.projectName;
    const previousActiveProjectIds = { ...state.activeProjectIds };
    const projectId = makeId();
    const projectName = projectFile.project.name.trim().slice(0, 64) || "Imported project";
    const project = { id: projectId, name: projectName, ownerId: state.currentUser, updatedAt: Date.now() };
    let snapshotSaved = false;
    try {
      window.localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(snapshot));
      snapshotSaved = true;
      state.projects.unshift(project);
      state.projectId = projectId;
      state.projectName = projectName;
      writeProjectCatalog();
      await persistImportedProjectAssets(projectId, assets);
      showToast(`${projectName} imported`);
      window.location.reload();
    } catch (error) {
      state.projects = state.projects.filter((item) => item.id !== projectId);
      state.projectId = previousProjectId;
      state.projectName = previousProjectName;
      state.activeProjectIds = previousActiveProjectIds;
      try {
        if (snapshotSaved) window.localStorage.removeItem(getProjectStorageKey(projectId));
        writeProjectCatalog();
      } catch (rollbackError) {
        showToast(`Project import failed and cleanup was incomplete: ${rollbackError.message || "browser storage is unavailable"}`);
        return;
      }
      showToast(`Could not import the project: ${error.message || "browser storage is unavailable"}`);
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
    state.masterPitch = 0;
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
      state.masterPitch = Number.isFinite(saved.masterPitch)
        ? Math.max(-12, Math.min(12, Math.round(saved.masterPitch)))
        : 0;
      if (Number.isFinite(saved.swing)) state.swing = Math.max(0, Math.min(45, Math.round(saved.swing)));
      if (Number.isFinite(saved.steps)) state.steps = normalizePatternSteps(saved.steps);
      if (Number.isFinite(saved.arrangementScale)) state.arrangementScale = Math.max(0.5, Math.min(4, saved.arrangementScale));
      if (Number.isFinite(saved.pianoScale)) state.pianoScale = Math.max(0.5, Math.min(4, saved.pianoScale));
      if (Number.isFinite(saved.sequencerScale)) state.sequencerScale = Math.max(0.5, Math.min(4, saved.sequencerScale));
      if (Number.isFinite(saved.arrangementBars)) state.arrangementBars = Math.max(32, Math.min(MAX_ARRANGEMENT_BARS, Math.round(saved.arrangementBars)));
      if (Number.isFinite(saved.arrangementCursor)) state.arrangementCursor = Math.max(0, Math.min(state.arrangementBars - 0.001, saved.arrangementCursor));
      if (typeof saved.arrangementLoopEnabled === "boolean") state.arrangementLoopEnabled = saved.arrangementLoopEnabled;
      if (Number.isFinite(saved.arrangementLoopStartBar)) {
        state.arrangementLoopStartBar = Math.max(0, Math.min(state.arrangementBars - 1, saved.arrangementLoopStartBar));
      }
      if (Number.isFinite(saved.arrangementLoopEndBar)) {
        state.arrangementLoopEndBar = Math.max(
          state.arrangementLoopStartBar + 1,
          Math.min(state.arrangementBars, saved.arrangementLoopEndBar),
        );
      }
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
          if (Number.isFinite(savedTrack.pan)) track.pan = Math.max(-1, Math.min(1, savedTrack.pan));
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
            pan: Number.isFinite(track.pan) ? Math.max(-1, Math.min(1, track.pan)) : 0,
            automation: normalizeTrackAutomation(track.automation),
            automationOpen: typeof track.automationOpen === "boolean"
              ? track.automationOpen
              : hasTrackAutomation(track.automation),
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
                        pan: Number.isFinite(note.pan) ? Math.max(-1, Math.min(1, note.pan)) : 0,
                      };
                    })])),
              } : {}),
              gridResolution,
              volume: Number.isFinite(pattern.volume) ? Math.max(0, Math.min(1, pattern.volume)) : 1,
              pan: Number.isFinite(pattern.pan) ? Math.max(-1, Math.min(1, pattern.pan)) : 0,
              automation: normalizeTrackAutomation(pattern.automation),
              automationOpen: typeof pattern.automationOpen === "boolean"
                ? pattern.automationOpen
                : hasTrackAutomation(pattern.automation),
              muted: pattern.muted === true,
              solo: pattern.solo === true,
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
      if (typeof saved.pianoLoopEnabled === "boolean") state.pianoLoopEnabled = saved.pianoLoopEnabled;
      if (Number.isFinite(saved.pianoLoopStartBar)) {
        state.pianoLoopStartBar = Math.max(0, Math.min(7, saved.pianoLoopStartBar));
      }
      if (Number.isFinite(saved.pianoLoopEndBar)) {
        state.pianoLoopEndBar = Math.max(state.pianoLoopStartBar + 1, Math.min(8, saved.pianoLoopEndBar));
      }
      if (Number.isFinite(saved.pianoStartBar)) state.pianoStartBar = Math.max(0, Math.min(MAX_ARRANGEMENT_BARS - 1, Math.floor(saved.pianoStartBar)));
      if (Number.isInteger(saved.pianoSnap) && [1, 2, 4, 8].includes(saved.pianoSnap)) state.pianoSnap = saved.pianoSnap;
      if (typeof saved.pianoSnapEnabled === "boolean") state.pianoSnapEnabled = saved.pianoSnapEnabled;
      state.pianoScaleRoot = Number.isInteger(saved.pianoScaleRoot) && saved.pianoScaleRoot >= 0 && saved.pianoScaleRoot < 12
        ? saved.pianoScaleRoot : 0;
      state.pianoScaleType = ["major", "minor", "major-pentatonic", "minor-pentatonic"].includes(saved.pianoScaleType)
        ? saved.pianoScaleType : "major";
      state.pianoScaleLock = saved.pianoScaleLock === true;
      if (saved.soundDurationEdits && typeof saved.soundDurationEdits === "object" && !Array.isArray(saved.soundDurationEdits)) {
        state.soundDurationEdits = Object.fromEntries(Object.entries(saved.soundDurationEdits)
          .filter(([soundId, scale]) => typeof soundId === "string" && Number.isFinite(scale) && scale >= 0.01 && scale < 1));
      }
      if (saved.soundReverseEdits && typeof saved.soundReverseEdits === "object" && !Array.isArray(saved.soundReverseEdits)) {
        state.soundReverseEdits = Object.fromEntries(Object.entries(saved.soundReverseEdits)
          .filter(([soundId, isReversed]) => typeof soundId === "string" && isReversed === true));
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
              detune: Number.isFinite(note.detune) ? Math.max(-100, Math.min(100, note.detune)) : 0,
              pan: Number.isFinite(note.pan) ? Math.max(-1, Math.min(1, note.pan)) : 0,
              audioSlice: normalizePianoAudioSlice(note.audioSlice),
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
                  detune: Number.isFinite(note.detune) ? Math.max(-100, Math.min(100, note.detune)) : 0,
                  pan: Number.isFinite(note.pan) ? Math.max(-1, Math.min(1, note.pan)) : 0,
                  audioSlice: normalizePianoAudioSlice(note.audioSlice),
                };
              })
              : [];
            return {
              id: mel.id,
              name: mel.name.trim() || "Mel",
              instrumentId,
              bars: [1, 2, 4, 8].includes(mel.bars) ? mel.bars : 4,
              notes,
              audioSourceClipId: typeof mel.audioSourceClipId === "string" ? mel.audioSourceClipId : null,
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
            insertAfterTrackId: typeof track.insertAfterTrackId === "string" ? track.insertAfterTrackId : null,
            kind: "mel",
            instrumentId: state.tracks.some((item) => item.id === track.instrumentId) ? track.instrumentId : fallbackInstrumentId,
            color: isPatternColor(track.color) ? track.color : "#b5a0ff",
            volume: Number.isFinite(track.volume) ? Math.max(0, Math.min(1, track.volume)) : 1,
            pan: Number.isFinite(track.pan) ? Math.max(-1, Math.min(1, track.pan)) : 0,
            automation: normalizeTrackAutomation(track.automation),
            automationOpen: typeof track.automationOpen === "boolean"
              ? track.automationOpen
              : hasTrackAutomation(track.automation),
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
                  repeatCount: Number.isInteger(clip.repeatCount) ? Math.max(1, clip.repeatCount) : 1,
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

  function exportMel() {
    captureCurrentMel();
    const mel = getMel();
    if (!mel) {
      showToast("Choose a Mel before exporting.");
      return;
    }
    const instrument = state.tracks.find((track) => track.id === mel.instrumentId);
    const exportedMel = {
      app: "DansBPM",
      format: "dansbpm-mel",
      version: 1,
      exportedAt: new Date().toISOString(),
      tempo: state.bpm,
      swing: state.swing,
      mel: {
        name: mel.name,
        bars: getMelLengthBars(mel),
        instrumentId: mel.instrumentId,
        instrumentName: instrument?.name || "Instrument",
        notes: mel.notes.map((note) => ({ ...note })),
      },
    };
    downloadBlob(new Blob([JSON.stringify(exportedMel, null, 2)], { type: "application/json" }),
      `${sanitizeFilename(mel.name)}.mel.json`);
    showToast("Mel exported as JSON");
  }

  function openSongExportMenu() {
    if (!$("#export-song-dialog").open) $("#export-song-dialog").showModal();
  }

  async function exportArrangementAudio(format = "wav") {
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before exporting the song.");
      return;
    }
    const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineAudioContext) {
      showToast(`${format.toUpperCase()} export is not supported in this browser.`);
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
    if (format === "mp3" && !window.lamejs?.Mp3Encoder) {
      showToast("MP3 export is unavailable because its encoder did not load.");
      return;
    }

    const previousContext = state.audioContext;
    const previousMaster = state.masterGain;
    const previousMasterPitchNode = state.masterPitchNode;
    const previousMasterPitchSupported = state.masterPitchSupported;
    const previousNoise = state.noiseBuffer;
    const allTracks = [
      ...state.tracks, ...state.arrangementTracks, ...state.melTracks, ...state.patterns,
      ...state.effectTracks, state.masterTrack,
    ];
    const previousGains = allTracks.map((track) => track.gainNode);
    const previousPanners = allTracks.map((track) => track.panNode);
    const previousFxRuntimes = allTracks.map((track) => track.fxRuntime);
    const previousAnalysers = allTracks.map((track) => track.analyser);
    const previousSourceGains = allTracks.map((track) => track.sourceGains);
    const button = $(`#export-song-${format}-button`);
    state.isExporting = true;
    button.disabled = true;
    document.body.classList.add("is-exporting");
    $("#export-song-dialog").close();
    showToast(`Rendering your song to ${format.toUpperCase()}…`);
    try {
      const context = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
      state.audioContext = context;
      state.masterGain = context.createGain();
      state.masterGain.gain.value = 0.88;
      await connectMasterPitchProcessor(context);
      state.noiseBuffer = createNoiseBuffer(context);
      const hasSolo = [...state.tracks, ...state.arrangementTracks].some((track) => track.solo);
      const hasArrangementSolo = [...state.patterns, ...state.melTracks, ...state.arrangementTracks]
        .some((track) => track.solo);
      allTracks.forEach((track) => {
        ensureTrackMixerState(track);
        track.gainNode = context.createGain();
        track.panNode = context.createStereoPanner();
        track.panNode.pan.value = track.pan;
        const isBus = track.kind === "mixer-master" || track.kind === "mixer-effects";
        const isArrangementTrack = track.kind === "pattern" || track.kind === "mel" ||
          state.arrangementTracks.includes(track);
        const isSilent = track.muted ||
          (isArrangementTrack && hasArrangementSolo && !track.solo) ||
          (!isBus && !isArrangementTrack && hasSolo && !track.solo) ||
          (state.arrangementTracks.includes(track) && hasSolo && !track.solo);
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
          getAudioClipSegments(clip, clip.startBar, duration / secondsPerBar).forEach((segment) => {
            const startTime = segment.startBar * secondsPerBar;
            createAudioClipPlaybackSource(context, track, clip, segment, startTime, secondsPerBar);
          });
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
        if (!instrument || melTrack.muted || (hasArrangementSolo && !melTrack.solo) ||
          instrument.muted || (hasSolo && !instrument.solo)) return;
        melTrack.clips.forEach((clip) => {
          const mel = getMel(clip.melId);
          if (!mel) return;
          getMelClipNoteEvents(mel, clip).forEach(({ note, startBar, endBar }) => {
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
      const extension = format === "mp3" ? "mp3" : "wav";
      const audioFile = format === "mp3" ? await encodeMp3(rendered) : encodeWav(rendered);
      downloadBlob(audioFile, `dansbpm-song.${extension}`);
      showToast(`Song exported as ${format.toUpperCase()}`);
    } catch (error) {
      showToast(`Could not export the song: ${error.message || "render failed"}`);
    } finally {
      state.audioContext = previousContext;
      state.masterGain = previousMaster;
      state.masterPitchNode = previousMasterPitchNode;
      state.masterPitchSupported = previousMasterPitchSupported;
      state.noiseBuffer = previousNoise;
      allTracks.forEach((track, index) => {
        track.fxRuntime?.forEach(({ nodes, sources }) => {
          sources.forEach((source) => {
            try { source.stop(); } catch { /* already stopped */ }
          });
          nodes.forEach((node) => node.disconnect());
        });
        track.gainNode = previousGains[index];
        track.panNode?.disconnect();
        track.panNode = previousPanners[index];
        track.fxRuntime = previousFxRuntimes[index];
        track.analyser = previousAnalysers[index];
        track.sourceGains = previousSourceGains[index];
      });
      state.isExporting = false;
      button.disabled = false;
      document.body.classList.remove("is-exporting");
      updateProjectKeyIndicator();
    }
  }

  async function encodeMp3(audioBuffer) {
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const encoder = new window.lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, 192);
    const pcmChannels = Array.from({ length: channels }, (_, channel) => {
      const samples = audioBuffer.getChannelData(channel);
      return Int16Array.from(samples, (sample) => {
        const clamped = Math.max(-1, Math.min(1, sample));
        return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      });
    });
    const chunks = [];
    for (let offset = 0; offset < audioBuffer.length; offset += 1152) {
      const left = pcmChannels[0].subarray(offset, Math.min(offset + 1152, audioBuffer.length));
      const encoded = channels === 1
        ? encoder.encodeBuffer(left)
        : encoder.encodeBuffer(left, pcmChannels[1].subarray(offset, Math.min(offset + 1152, audioBuffer.length)));
      if (encoded.length) chunks.push(encoded);
      if (offset > 0 && offset % (1152 * 256) === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    }
    const finalChunk = encoder.flush();
    if (finalChunk.length) chunks.push(finalChunk);
    return new Blob(chunks, { type: "audio/mpeg" });
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

  function sanitizeFilename(name) {
    return name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, "-").slice(0, 80) || "dansbpm";
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("Could not encode project audio."));
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(",");
    if (comma < 0 || !dataUrl.slice(0, comma).endsWith(";base64")) {
      throw new Error("The project contains an invalid audio attachment.");
    }
    const mediaType = dataUrl.slice(5, comma).split(";")[0] || "application/octet-stream";
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mediaType });
  }

  async function getProjectRecordingRecords(projectId = state.projectId) {
    const database = await openRecordingDb();
    return new Promise((resolve, reject) => {
      let records = [];
      const transaction = database.transaction("recordings", "readonly");
      const request = transaction.objectStore("recordings").getAll();
      request.onsuccess = () => { records = request.result; };
      request.onerror = () => {
        database.close();
        reject(request.error || new Error("Could not read saved project audio."));
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(records.filter((record) =>
          record.projectId === projectId || (!record.projectId && projectId === "default")));
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Could not read saved project audio."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Project audio export was cancelled."));
      };
    });
  }

  async function exportProjectFile() {
    if (state.mediaRecorder?.state === "recording") {
      showToast("Stop microphone recording before exporting the project.");
      return;
    }
    const snapshot = createStateSnapshot();
    const button = $("#export-project-button");
    button.disabled = true;
    $("#export-song-dialog").close();
    state.isExporting = true;
    document.body.classList.add("is-exporting");
    showToast("Packing your project and audio…");
    try {
      const recordings = window.indexedDB ? await getProjectRecordingRecords() : [];
      const assets = await Promise.all(recordings.map(async (record) => {
        if (!(record.blob instanceof Blob)) {
          throw new Error(`Could not export ${record.name || record.trackName || "a project audio file"}.`);
        }
        const { blob, ...metadata } = record;
        return { metadata, dataUrl: await blobToDataUrl(blob) };
      }));
      const projectFile = {
        app: "DansBPM",
        format: "dansbpm-project",
        version: 1,
        exportedAt: new Date().toISOString(),
        project: {
          name: state.projectName,
          snapshot,
        },
        assets,
      };
      const file = new Blob([JSON.stringify(projectFile)], { type: "application/vnd.dansbpm.project+json" });
      downloadBlob(file, `${sanitizeFilename(state.projectName)}.bpm`);
      showToast("Project exported as a BPM file");
    } catch (error) {
      showToast(`Could not export the project: ${error.message || "project data could not be read"}`);
    } finally {
      button.disabled = false;
      state.isExporting = false;
      document.body.classList.remove("is-exporting");
    }
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

  const USER_SETTINGS_KEY = "dansbpm-user-settings-v1";
  const COLLABORATION_ACTIVITY_KEY = "dansbpm-collaboration-activity-v1";
  const MAX_COLLABORATION_ACTIVITY = 100;
  const userSettings = {
    audioInputDeviceId: "",
    audioOutputDeviceId: "",
    drummerDeviceId: "",
    theme: "dark",
    accent: "lime",
  };
  let drummerAudio = null;
  let drummerDestination = null;
  let drummerGainNode = null;
  let drummerConnected = false;

  function initializeSettings() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(USER_SETTINGS_KEY) || "null");
      if (saved && typeof saved === "object") {
        Object.assign(userSettings, {
          audioInputDeviceId: typeof saved.audioInputDeviceId === "string" ? saved.audioInputDeviceId : "",
          audioOutputDeviceId: typeof saved.audioOutputDeviceId === "string" ? saved.audioOutputDeviceId : "",
          drummerDeviceId: typeof saved.drummerDeviceId === "string" ? saved.drummerDeviceId : "",
          theme: saved.theme === "light" ? "light" : "dark",
          accent: ["lime", "blue", "violet", "coral"].includes(saved.accent) ? saved.accent : "lime",
        });
      }
    } catch (error) {
      showToast(`Could not load settings: ${error.message || "browser storage is unavailable"}`);
    }

    document.documentElement.dataset.theme = userSettings.theme;
    document.documentElement.dataset.accent = userSettings.accent;
    $("#settings-theme").value = userSettings.theme;
    $("#settings-accent").value = userSettings.accent;
    $("#settings-audio-input").value = userSettings.audioInputDeviceId;
    $("#settings-audio-output").value = userSettings.audioOutputDeviceId;
    $("#settings-drummer-output").value = userSettings.drummerDeviceId;
    $("#settings-button").addEventListener("click", () => {
      $("#settings-dialog").showModal();
      void refreshAudioDevices();
      renderCollaborationActivityLog();
    });
    $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
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

  function persistUserSettings() {
    try {
      window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userSettings));
      return true;
    } catch (error) {
      showToast(`Could not save settings: ${error.message || "browser storage is unavailable"}`);
      return false;
    }
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
    oscillator.frequency.setValueAtTime((downbeat ? 1350 : 950) * pitchRatio, time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(0.2, time + 0.002);
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
  function bindEvents() {
    document.addEventListener("pointermove", paintStepAtPointer);
    document.addEventListener("pointermove", updateStepSelectionDrag);
    document.addEventListener("pointerup", finishStepPaint);
    document.addEventListener("pointerup", finishStepSelectionDrag);
    document.addEventListener("pointercancel", finishStepPaint);
    document.addEventListener("pointercancel", finishStepSelectionDrag);
    playButton.addEventListener("click", () => {
      if (state.keyboardRecordingCountdown) cancelKeyboardRecordingCountdown();
      if (state.isStartingPlayback || state.isPlaying && state.playbackMode === "arrangement") stopPlayback();
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
    $("#arrangement-loop-button").addEventListener("click", () => {
      const resumePlayback = state.isPlaying && state.playbackMode === "arrangement";
      const cursor = state.arrangementCursor;
      if (resumePlayback) stopPlayback();
      state.arrangementLoopEnabled = !state.arrangementLoopEnabled;
      state.arrangementCursor = state.arrangementLoopEnabled
        ? getArrangementLoopRange().startBar
        : Math.min(cursor, state.arrangementBars - 1);
      updateArrangementCursorMarker();
      updateArrangementLoopUI();
      saveState();
      if (resumePlayback) void startPlayback("arrangement");
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
    $("#master-pitch-control").addEventListener("input", (event) => {
      setMasterPitch(event.currentTarget.value);
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
    $("#export-pattern-button").addEventListener("click", exportPattern);
    $("#export-mel-button").addEventListener("click", exportMel);
    $("#import-midi-button").addEventListener("click", () => $("#midi-import-input").click());
    $("#midi-import-input").addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      if (file) void importMidiFile(file);
      event.target.value = "";
    });
    $("#piano-roll-toolbar").addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-piano-toolbar-toggle]");
      if (!toggle) return;
      const options = document.getElementById(toggle.getAttribute("aria-controls"));
      if (!options) return;
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.title = `${expanded ? "Collapse" : "Expand"} ${toggle.textContent.trim()} options`;
      options.hidden = !expanded;
    });
    $("#piano-audio-import-button").addEventListener("click", () => $("#piano-audio-import-input").click());
    $("#piano-audio-import-input").addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      if (file) void importAudioToPianoRoll(file);
      event.target.value = "";
    });
    $("#piano-audio-source-select").addEventListener("change", async (event) => {
      selectPianoRollAudioSource(event.currentTarget.value);
      if (event.currentTarget.value) await transcribeSelectedPianoAudio();
    });
    $("#piano-audio-transcribe-button").addEventListener("click", transcribeSelectedPianoAudio);
    $("#piano-audio-chop-button").addEventListener("click", openPianoAudioChopper);
    $("#piano-chopper-close").addEventListener("click", () => $("#piano-chopper-dialog").close());
    $("#piano-chopper-cancel").addEventListener("click", () => $("#piano-chopper-dialog").close());
    $("#piano-chopper-apply").addEventListener("click", chopSelectedPianoAudio);
    $("#piano-chopper-division").addEventListener("change", updatePianoChopperPreview);
    $("#piano-chopper-dropoff").addEventListener("input", (event) => {
      $("#piano-chopper-dropoff-value").textContent = `${event.currentTarget.value}%`;
    });
    $("#piano-chopper-pitch").addEventListener("input", (event) => {
      const pitch = Number(event.currentTarget.value);
      $("#piano-chopper-pitch-value").textContent =
        `${pitch > 0 ? "+" : ""}${pitch} semitone${Math.abs(pitch) === 1 ? "" : "s"}`;
    });
    $("#piano-chopper-dialog").addEventListener("click", (event) => {
      if (event.target === $("#piano-chopper-dialog")) $("#piano-chopper-dialog").close();
    });
    $("#piano-autotune-button").addEventListener("click", tunePianoNotesToScale);
    $("#export-midi-button").addEventListener("click", exportMidi);
    $("#export-song-button").addEventListener("click", openSongExportMenu);
    $("#export-song-wav-button").addEventListener("click", () => exportArrangementAudio("wav"));
    $("#export-song-mp3-button").addEventListener("click", () => exportArrangementAudio("mp3"));
    $("#export-project-button").addEventListener("click", exportProjectFile);
    $("#export-song-close").addEventListener("click", () => $("#export-song-dialog").close());
    $("#export-song-dialog").addEventListener("click", (event) => {
      if (event.target === $("#export-song-dialog")) $("#export-song-dialog").close();
    });
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
    $("#show-workspace-button").addEventListener("click", () => setViewVisibility(false, false, "hide-workspace-button"));
    $("#hide-track-view-button").addEventListener("click", () => setViewVisibility(false, true));
    $("#show-track-view-button").addEventListener("click", () => setViewVisibility(false, false, "hide-track-view-button"));
    $("#workspace-fullscreen-button").addEventListener("click", toggleWorkspaceFullscreen);
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
    $("#piano-quantize-button").addEventListener("click", quantizePianoNotes);
    $("#piano-scale-root").addEventListener("change", (event) => {
      state.pianoScaleRoot = Number(event.target.value);
      renderPianoRoll();
      saveState();
    });
    $("#piano-scale-type").addEventListener("change", (event) => {
      state.pianoScaleType = event.target.value;
      renderPianoRoll();
      saveState();
    });
    $("#piano-scale-lock").addEventListener("change", (event) => {
      state.pianoScaleLock = event.target.checked;
      saveState();
    });
    $("#piano-roll-grid").addEventListener("contextmenu", (event) => {
      const noteElement = event.target.closest(".piano-roll-note");
      if (!noteElement) return;
      const note = state.pianoNotes.find((item) => item.id === noteElement.dataset.noteId);
      if (note) openPianoNoteContextMenu(event, note);
    });
    $("#piano-note-context-menu").addEventListener("input", updatePianoNoteContext);
    $("#piano-note-context-close").addEventListener("click", closePianoNoteContextMenu);
    $("#piano-roll-toolbar").addEventListener("keydown", (event) => {
      if (event.key.startsWith("Arrow")) event.stopPropagation();
    });
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
      $("#piano-quantize-button").disabled = !state.pianoSnapEnabled;
      saveState();
    });
    $("#piano-loop-button").addEventListener("click", () => {
      stopWorkspacePlayback("piano-roll");
      if (state.isPlaying && state.playbackMode === "piano-roll") stopPlayback();
      state.pianoLoopEnabled = !state.pianoLoopEnabled;
      updatePianoLoopUI();
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
    $("#piano-roll-ruler-viewport").addEventListener("pointerdown", seekPianoRollFromRuler);
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
    $("#audio-clip-edit-close").addEventListener("click", () => $("#audio-clip-edit-dialog").close());
    $("#audio-clip-edit-dialog").addEventListener("input", updateAudioClipEditor);
    $("#audio-clip-edit-dialog").addEventListener("change", updateAudioClipEditor);
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
      const ruler = event.target.closest(".timeline-ruler");
      if (!ruler) return;
      const bounds = ruler.getBoundingClientRect();
      setArrangementCursor((event.clientX - bounds.left) / BAR_WIDTH);
    });
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
    $("#sound-reverse-toggle").addEventListener("change", (event) => {
      setSoundReverseFromMenu(event.currentTarget.checked);
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
    $("#source-browser-button").addEventListener("click", () => openAssetLibrary());
    $("#source-browser-close").addEventListener("click", () => $("#source-browser-dialog").close());
    $("#source-browser-dialog").addEventListener("close", closeSoundDurationMenu);
    $("#empty-import-button").addEventListener("click", () => requestRecordingImport());
    $("#side-add-recording").addEventListener("click", () => requestRecordingImport());
    $("#recording-input").addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      for (const file of files) await importRecording(file, state.pendingImportTrackId);
      state.pendingImportTrackId = null;
      event.target.value = "";
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
    $("#project-name").addEventListener("click", () => {
      renderProjectList();
      $("#project-dialog").showModal();
    });
    $("#project-dialog-close").addEventListener("click", () => $("#project-dialog").close());
    $("#save-project-button").addEventListener("click", saveProjectNow);
    $("#enter-project-button").addEventListener("click", enterSelectedProject);
    $("#delete-project-button").addEventListener("click", () => { void deleteSelectedProject(); });
    $("#top-save-project-button").addEventListener("click", saveProjectNow);
    $("#rename-project-button").addEventListener("click", renameProject);
    $("#new-project-button").addEventListener("click", createProject);
    $("#import-project-button").addEventListener("click", () => $("#project-import-input").click());
    $("#project-import-input").addEventListener("change", async (event) => {
      const input = event.currentTarget;
      try {
        await importProjectFile(input.files?.[0]);
      } finally {
        input.value = "";
      }
    });
    $("#switch-user-button").addEventListener("click", switchUser);
    $("#collaborate-button").addEventListener("click", () => {
      $("#project-dialog").close();
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
    });
    $("#collaboration-dialog-close").addEventListener("click", () => $("#collaboration-dialog").close());
    $("#collaboration-create-room").addEventListener("click", () => startCollaborationRoom("create"));
    $("#collaboration-join-room").addEventListener("click", () => startCollaborationRoom("join"));
    $("#collaboration-copy-code").addEventListener("click", async () => {
      if (!collaboration.session) return;
      try {
        await navigator.clipboard.writeText(collaboration.session.roomCode);
        showToast("Room code copied");
      } catch {
        showToast("Select and copy the room code above.");
      }
    });
    $("#collaboration-enable-audio").addEventListener("click", async () => {
      try {
        await ensureAudio();
        showToast("Audio is ready for synchronized playback.");
      } catch (error) {
        showToast(`Could not enable audio: ${error.message || "audio is unavailable"}`);
      }
    });
    $("#collaboration-leave-room").addEventListener("click", leaveCollaborationRoom);
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
      state.pianoScaleRoot = 0;
      state.pianoScaleType = "major";
      state.pianoScaleLock = false;
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
      if (!isTextEntry && !dialogOpen && (event.ctrlKey || event.metaKey) && !event.altKey &&
        !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (!event.repeat) undoCurrentView();
        return;
      }
      const djControlFocused = state.view === "dj" && djViewExpanded &&
        target instanceof Element && target.closest("input, select, textarea, [contenteditable='true']");
      const pianoRollSelectAll = state.view === "piano-roll" && !isTextEntry && event.key.toLowerCase() === "a";
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
      if ((!isTyping || pianoRollSelectAll) && !dialogOpen && !event.repeat && (event.ctrlKey || event.metaKey) && !event.altKey) {
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
    initializeSettings();
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
    seedUndoHistory();
    $("#login-screen").hidden = Boolean(state.currentUser);
    $("#active-user-label").textContent = getCurrentUserName();
  }

  initialize();
  updateStorageIndicator();
  window.addEventListener("focus", updateStorageIndicator);
  if (state.currentUser) {
    restoreArrangement().then(() => {
      if (!undoStacks.get("track-view")?.length) {
        undoLatest.set("track-view", createUndoSnapshot("track-view"));
      }
      renderDjView();
      resumeCollaborationSession();
    });
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
  function readMidiVariableLength(bytes, cursor) {
    let value = 0;
    for (let count = 0; count < 4; count += 1) {
      if (cursor.index >= bytes.length) throw new Error("The MIDI file is truncated.");
      const byte = bytes[cursor.index++];
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    throw new Error("The MIDI file contains an invalid variable-length value.");
  }

  function parseMidiFile(buffer) {
    const bytes = new Uint8Array(buffer);
    const cursor = { index: 0 };
    const readAscii = (length) => {
      if (cursor.index + length > bytes.length) throw new Error("The MIDI file is truncated.");
      const text = String.fromCharCode(...bytes.subarray(cursor.index, cursor.index + length));
      cursor.index += length;
      return text;
    };
    const readUint32 = () => {
      if (cursor.index + 4 > bytes.length) throw new Error("The MIDI file is truncated.");
      const value = new DataView(bytes.buffer, bytes.byteOffset + cursor.index, 4).getUint32(0);
      cursor.index += 4;
      return value;
    };
    const readUint16 = () => {
      if (cursor.index + 2 > bytes.length) throw new Error("The MIDI file is truncated.");
      const value = new DataView(bytes.buffer, bytes.byteOffset + cursor.index, 2).getUint16(0);
      cursor.index += 2;
      return value;
    };
    if (readAscii(4) !== "MThd") throw new Error("That file is not a Standard MIDI File.");
    const headerLength = readUint32();
    if (headerLength < 6 || cursor.index + headerLength > bytes.length) throw new Error("The MIDI header is invalid.");
    const format = readUint16();
    const trackCount = readUint16();
    const division = readUint16();
    cursor.index += headerLength - 6;
    if (format > 1 || trackCount < 1 || trackCount > 1024) {
      throw new Error("Only type 0 or 1 MIDI files with up to 1,024 tracks are supported.");
    }
    if (division & 0x8000 || division === 0) throw new Error("SMPTE-timed MIDI files are not supported.");

    const tracks = [];
    const tempos = [];
    for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      if (readAscii(4) !== "MTrk") throw new Error("The MIDI file contains an invalid track.");
      const trackLength = readUint32();
      if (cursor.index + trackLength > bytes.length) throw new Error("The MIDI track is truncated.");
      const trackBytes = bytes.subarray(cursor.index, cursor.index + trackLength);
      cursor.index += trackLength;
      const trackCursor = { index: 0 };
      const activeNotes = new Map();
      const notes = [];
      let absoluteTick = 0;
      let runningStatus = 0;
      const readDataByte = () => {
        if (trackCursor.index >= trackBytes.length) throw new Error("The MIDI track is truncated.");
        return trackBytes[trackCursor.index++];
      };
      while (trackCursor.index < trackBytes.length) {
        absoluteTick += readMidiVariableLength(trackBytes, trackCursor);
        let status = readDataByte();
        if (status < 0x80) {
          if (!runningStatus) throw new Error("The MIDI track has an invalid running status.");
          trackCursor.index -= 1;
          status = runningStatus;
        } else if (status < 0xf0) {
          runningStatus = status;
        }

        if (status === 0xff) {
          runningStatus = 0;
          const metaType = readDataByte();
          const length = readMidiVariableLength(trackBytes, trackCursor);
          if (trackCursor.index + length > trackBytes.length) throw new Error("The MIDI metadata is truncated.");
          if (metaType === 0x51 && length === 3) {
            const microsecondsPerQuarter = (trackBytes[trackCursor.index] << 16) |
              (trackBytes[trackCursor.index + 1] << 8) | trackBytes[trackCursor.index + 2];
            if (microsecondsPerQuarter > 0) tempos.push({ tick: absoluteTick, microsecondsPerQuarter });
          }
          trackCursor.index += length;
          if (metaType === 0x2f) break;
          continue;
        }
        if (status === 0xf0 || status === 0xf7) {
          runningStatus = 0;
          trackCursor.index += readMidiVariableLength(trackBytes, trackCursor);
          if (trackCursor.index > trackBytes.length) throw new Error("The MIDI system-exclusive event is truncated.");
          continue;
        }
        if (status >= 0xf0) {
          runningStatus = 0;
          const dataLength = status === 0xf2 ? 2 : [0xf1, 0xf3].includes(status) ? 1 : 0;
          trackCursor.index += dataLength;
          if (trackCursor.index > trackBytes.length) throw new Error("The MIDI system event is truncated.");
          continue;
        }

        const command = status & 0xf0;
        const channel = status & 0x0f;
        const first = readDataByte();
        const second = [0xc0, 0xd0].includes(command) ? 0 : readDataByte();
        if (command !== 0x80 && command !== 0x90) continue;
        const key = `${channel}:${first}`;
        if (command === 0x90 && second > 0) {
          const queue = activeNotes.get(key) || [];
          queue.push({ tick: absoluteTick, velocity: second });
          activeNotes.set(key, queue);
        } else {
          const queue = activeNotes.get(key);
          const active = queue?.shift();
          if (active) notes.push({ ...active, endTick: Math.max(absoluteTick, active.tick + 1), midi: first });
          if (queue && !queue.length) activeNotes.delete(key);
        }
      }
      activeNotes.forEach((queue, key) => {
        const midi = Number(key.split(":")[1]);
        queue.forEach((active) => notes.push({
          ...active,
          endTick: Math.max(absoluteTick, active.tick + 1),
          midi,
        }));
      });
      tracks.push({ notes, endTick: absoluteTick });
    }
    const allNotes = tracks.flatMap((track) => track.notes);
    const firstTempo = tempos.sort((left, right) => left.tick - right.tick)[0];
    return {
      division,
      bpm: firstTempo ? 60_000_000 / firstTempo.microsecondsPerQuarter : 120,
      notes: allNotes,
      endTick: Math.max(0, ...tracks.map((track) => track.endTick)),
    };
  }

  function importMidiNotes(parsed) {
    const maxTick = 8 * PIANO_TICKS_PER_BAR;
    return parsed.notes
      .filter((note) => Number.isInteger(note.midi) && note.midi >= PIANO_BOTTOM_MIDI && note.midi <= PIANO_TOP_MIDI)
      .map((note) => {
        const startTick = Math.round(note.tick * PIANO_TICKS_PER_BAR / (4 * parsed.division) * 2) / 2;
        const endTick = Math.round(note.endTick * PIANO_TICKS_PER_BAR / (4 * parsed.division) * 2) / 2;
        if (startTick >= maxTick) return null;
        return {
          id: makeId(),
          trackId: state.selectedPianoTrackId,
          midi: note.midi,
          startTick: Math.max(0, startTick),
          durationTicks: Math.max(0.5, Math.min(maxTick - startTick, endTick - startTick)),
          velocity: Math.max(0.01, Math.min(1, note.velocity / 127)),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.startTick - right.startTick || left.midi - right.midi)
      .slice(0, 4096);
  }

  async function importMidiFile(file) {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before importing a MIDI melody.");
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      showToast("MIDI files must be smaller than 32 MB.");
      return;
    }
    try {
      const parsed = parseMidiFile(await file.arrayBuffer());
      const notes = importMidiNotes(parsed);
      if (!notes.length) throw new Error("No supported notes were found in that MIDI file.");
      const endTick = Math.max(...notes.map((note) => note.startTick + note.durationTicks));
      const bars = [1, 2, 4, 8].find((bar) => bar * PIANO_TICKS_PER_BAR >= endTick) || 8;
      const requestedBpm = Math.round(parsed.bpm);
      const bpm = Math.max(60, Math.min(180, requestedBpm));
      const name = file.name.replace(/\.(mid|midi)$/i, "").trim() || "Imported MIDI";
      const mel = makeMel(name, state.selectedPianoTrackId, bars, notes);
      if (state.isPlaying) stopPlayback();
      state.mels.push(mel);
      state.selectedMelId = mel.id;
      state.pianoNotes = mel.notes.map((note) => ({ ...note }));
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.pianoSelectionFromMarquee = false;
      state.pianoBars = bars;
      state.bpm = bpm;
      tempoValue.textContent = String(bpm);
      renderMelOptions();
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
      const skipped = Math.max(0, parsed.notes.length - notes.length);
      const skippedMessage = skipped ? ` ${skipped} notes outside the editor range were skipped.` : "";
      showToast(requestedBpm === bpm
        ? `Imported ${notes.length} MIDI notes into "${name}".${skippedMessage}`
        : `Imported ${notes.length} MIDI notes; tempo was limited to ${bpm} BPM.${skippedMessage}`);
    } catch (error) {
      showToast(error.message || "The MIDI file could not be imported.");
    }
  }

  function writeMidiVariableLength(value) {
    let remaining = Math.max(0, Math.floor(value));
    const bytes = [remaining & 0x7f];
    while ((remaining >>= 7) > 0) bytes.unshift((remaining & 0x7f) | 0x80);
    return bytes;
  }

  function createMidiFile(mel) {
    const ticksPerQuarter = 480;
    const midiTicksPerPianoTick = ticksPerQuarter / (PIANO_TICKS_PER_BAR / 4);
    const events = [];
    const microsecondsPerQuarter = Math.round(60_000_000 / state.bpm);
    events.push({ tick: 0, priority: -2, bytes: [0xff, 0x51, 0x03,
      (microsecondsPerQuarter >> 16) & 0xff, (microsecondsPerQuarter >> 8) & 0xff, microsecondsPerQuarter & 0xff] });
    events.push({ tick: 0, priority: -1, bytes: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] });
    mel.notes.forEach((note) => {
      const start = Math.max(0, Math.round(note.startTick * midiTicksPerPianoTick));
      const end = Math.max(start + 1, Math.round((note.startTick + note.durationTicks) * midiTicksPerPianoTick));
      const pitch = Math.max(0, Math.min(127, Math.round(note.midi + state.masterPitch)));
      const velocity = Math.max(1, Math.min(127, Math.round((note.velocity ?? 0.8) * 127)));
      events.push({ tick: start, priority: 1, bytes: [0x90, pitch, velocity] });
      events.push({ tick: end, priority: 0, bytes: [0x80, pitch, 0] });
    });
    events.sort((left, right) => left.tick - right.tick || left.priority - right.priority);
    const trackBytes = [];
    let previousTick = 0;
    events.forEach((event) => {
      trackBytes.push(...writeMidiVariableLength(event.tick - previousTick), ...event.bytes);
      previousTick = event.tick;
    });
    trackBytes.push(...writeMidiVariableLength(0), 0xff, 0x2f, 0x00);
    const chunk = (id, data) => [
      ...Array.from(id, (character) => character.charCodeAt(0)),
      (data.length >>> 24) & 0xff, (data.length >>> 16) & 0xff, (data.length >>> 8) & 0xff, data.length & 0xff,
      ...data,
    ];
    const header = [0x00, 0x00, 0x00, 0x01, 0x01, 0xe0];
    return new Uint8Array([...chunk("MThd", header), ...chunk("MTrk", trackBytes)]);
  }

  function exportMidi() {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before exporting a MIDI melody.");
      return;
    }
    captureCurrentMel();
    const mel = getMel();
    if (!mel || !mel.notes.length) {
      showToast("Add notes to the Piano Roll before exporting MIDI.");
      return;
    }
    const filename = `${sanitizeFilename(mel.name) || "melody"}.mid`;
    downloadBlob(new Blob([createMidiFile(mel)], { type: "audio/midi" }), filename);
    showToast(`Exported "${mel.name}" as MIDI.`);
  }
})();
