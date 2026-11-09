# DansBPM Synth

The browser app includes a MIDI-playable `DansBPM Synth` instrument. The native target is a polyphonic VST3 instrument with MIDI input, two anti-aliased oscillators, sub oscillator, low-pass filter, amp/filter envelopes, vibrato, host automation, and serialized plugin state.

The native VST3 and standalone targets use JUCE 8.0.4 via CMake FetchContent. Build them with:

```sh
cmake -S native-plugin -B native-plugin/build -DCMAKE_BUILD_TYPE=Release
cmake --build native-plugin/build --config Release
```

The VST3 bundle is emitted under `native-plugin/build/DansBPMSynth_artefacts/Release/VST3`. Add that bundle to a VST3-compatible host's scan locations. JUCE is distributed under GPLv3 or a commercial license; review its terms before distributing this plugin.

The MIDI voice pool, automatable parameter IDs, and serialized state follow the JUCE [`Synthesiser`](https://docs.juce.com/master/classjuce_1_1Synthesiser.html) and [`AudioProcessorValueTreeState`](https://docs.juce.com/master/classjuce_1_1AudioProcessorValueTreeState.html) APIs. VST3 parameter automation and package behavior are documented by [Steinberg](https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Parameters+Automation/Index.html).
