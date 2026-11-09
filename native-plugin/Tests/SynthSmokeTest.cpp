#include "PluginProcessor.h"

#include <cmath>
#include <iostream>

namespace {
double rms(const juce::AudioBuffer<float>& buffer) {
  double sum = 0.0;
  for (int channel = 0; channel < buffer.getNumChannels(); ++channel) {
    for (int sample = 0; sample < buffer.getNumSamples(); ++sample) {
      const auto value = buffer.getSample(channel, sample);
      if (!std::isfinite(value)) return -1.0;
      sum += static_cast<double>(value) * value;
    }
  }
  return std::sqrt(sum / (buffer.getNumChannels() * buffer.getNumSamples()));
}
}

int main() {
  DansBPMSynthAudioProcessor processor;
  processor.prepareToPlay(48000.0, 512);
  juce::AudioBuffer<float> audio(2, 512);
  juce::MidiBuffer midi;

  midi.addEvent(juce::MidiMessage::noteOn(1, 60, 0.8f), 0);
  processor.processBlock(audio, midi);
  if (rms(audio) <= 0.0001) {
    std::cerr << "MIDI note-on produced no finite audio.\n";
    return 1;
  }

  midi.clear();
  midi.addEvent(juce::MidiMessage::noteOff(1, 60), 0);
  processor.processBlock(audio, midi);
  if (rms(audio) <= 0.00001) {
    std::cerr << "MIDI note-off cut the release tail immediately.\n";
    return 1;
  }

  midi.clear();
  for (int block = 0; block < 500; ++block)
    processor.processBlock(audio, midi);
  if (rms(audio) > 0.00001) {
    std::cerr << "The voice did not become silent after its release.\n";
    return 1;
  }
  return 0;
}
