#pragma once

#include "PluginProcessor.h"

class DansBPMSynthAudioProcessorEditor final : public juce::AudioProcessorEditor {
public:
  explicit DansBPMSynthAudioProcessorEditor(DansBPMSynthAudioProcessor&);
  void paint(juce::Graphics&) override;
  void resized() override;

private:
  using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;
  using ComboBoxAttachment = juce::AudioProcessorValueTreeState::ComboBoxAttachment;

  DansBPMSynthAudioProcessor& processor;
  juce::ComboBox waveform;
  std::unique_ptr<ComboBoxAttachment> waveformAttachment;
  std::vector<std::unique_ptr<juce::Slider>> sliders;
  std::vector<std::unique_ptr<juce::Label>> labels;
  std::vector<std::unique_ptr<SliderAttachment>> attachments;

  JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(DansBPMSynthAudioProcessorEditor)
};
