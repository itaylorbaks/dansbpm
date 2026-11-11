
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
