#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_dsp/juce_dsp.h>

class DansBPMSynthAudioProcessor final : public juce::AudioProcessor {
public:
  using Parameters = juce::AudioProcessorValueTreeState;

  DansBPMSynthAudioProcessor();
  ~DansBPMSynthAudioProcessor() override = default;

  void prepareToPlay(double sampleRate, int samplesPerBlock) override;
  void releaseResources() override;
  bool isBusesLayoutSupported(const BusesLayout& layouts) const override;
  void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
  void processBlock(juce::AudioBuffer<double>&, juce::MidiBuffer&) override;

  juce::AudioProcessorEditor* createEditor() override;
  bool hasEditor() const override { return true; }
  const juce::String getName() const override { return "DansBPM Synth"; }
  bool acceptsMidi() const override { return true; }
  bool producesMidi() const override { return false; }
  bool isMidiEffect() const override { return false; }
  double getTailLengthSeconds() const override { return 5.0; }

  int getNumPrograms() override { return 1; }
  int getCurrentProgram() override { return 0; }
  void setCurrentProgram(int) override {}
  const juce::String getProgramName(int) override { return {}; }
  void changeProgramName(int, const juce::String&) override {}

  void getStateInformation(juce::MemoryBlock& destination) override;
  void setStateInformation(const void* data, int sizeInBytes) override;

  Parameters parameters;

private:
  static Parameters::ParameterLayout createParameterLayout();
  juce::Synthesiser synthesiser;

  JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(DansBPMSynthAudioProcessor)
};
