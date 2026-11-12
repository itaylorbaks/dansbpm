# Known-good audio baseline

Observed 2026-11-12 at 10:30 (session time), at reference commit `256ee41`:

- User reports playback is not crunchy and is not excessively laggy; some visual lag remains.
- The browser's default `AudioContext` sample rate and latency settings are used; the app does not set either explicitly.
- Realtime master gain is `0.82`, followed by a dynamics compressor limiter: threshold `-3 dB`, knee `0 dB`, ratio `20:1`, attack `3 ms`, release `120 ms`.
- Master pitch defaults to `0` semitones, so pitch processing is bypassed unless changed.
- Default per-sound processing is neutral: boost and reverb `0`, EQ gains `0 dB`, pitch `0`, playback multiplier `1`, and time `100%`. Project-specific sound and effect settings may differ.
- Offline export uses `44.1 kHz`, master gain `0.88`, and the same limiter settings.

This is a user-observed reference point, not a reproducible benchmark. The browser, audio device, actual output sample rate, and project-specific effect settings were not recorded. Visual lag is still present and has not been diagnosed.
