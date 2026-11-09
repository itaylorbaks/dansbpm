#include "PluginEditor.h"

#include <array>

DansBPMSynthAudioProcessorEditor::DansBPMSynthAudioProcessorEditor(DansBPMSynthAudioProcessor& audioProcessor)
  : AudioProcessorEditor(&audioProcessor),
    processor(audioProcessor) {
  setSize(560, 350);
  waveform.addItem("Sine", 1);
  waveform.addItem("Triangle", 2);
  waveform.addItem("Saw", 3);
  waveform.addItem("Square", 4);
  waveform.setColour(juce::ComboBox::backgroundColourId, juce::Colour(0xff202328));
  waveform.setColour(juce::ComboBox::textColourId, juce::Colour(0xffe6eadf));
  waveformAttachment = std::make_unique<ComboBoxAttachment>(processor.parameters, "waveform", waveform);
  addAndMakeVisible(waveform);

  const std::array<std::pair<const char*, const char*>, 15> controls{{
    { "cutoff", "Cutoff" }, { "resonance", "Resonance" }, { "attack", "Attack" }, { "decay", "Decay" },
    { "sustain", "Sustain" }, { "release", "Release" }, { "detune", "Detune" }, { "sub", "Sub" },
    { "filterEnv", "Filter Env" }, { "filterAttack", "Filter Attack" }, { "filterDecay", "Filter Decay" },
    { "filterSustain", "Filter Sustain" }, { "lfoRate", "LFO Rate" }, { "lfoDepth", "LFO Depth" }, { "master", "Output" },
  }};
  for (const auto& [parameterId, labelText] : controls) {
    auto label = std::make_unique<juce::Label>();
    label->setText(labelText, juce::dontSendNotification);
    label->setColour(juce::Label::textColourId, juce::Colour(0xffaeb7ad));
    addAndMakeVisible(*label);
    labels.push_back(std::move(label));

    auto slider = std::make_unique<juce::Slider>();
    slider->setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    slider->setTextBoxStyle(juce::Slider::TextBoxBelow, false, 70, 18);
    slider->setColour(juce::Slider::rotarySliderFillColourId, juce::Colour(0xffa7d85b));
    slider->setColour(juce::Slider::textBoxTextColourId, juce::Colour(0xffe6eadf));
    slider->setColour(juce::Slider::textBoxBackgroundColourId, juce::Colour(0xff202328));
    addAndMakeVisible(*slider);
    attachments.push_back(std::make_unique<SliderAttachment>(processor.parameters, parameterId, *slider));
    sliders.push_back(std::move(slider));
  }
}

void DansBPMSynthAudioProcessorEditor::paint(juce::Graphics& graphics) {
  graphics.fillAll(juce::Colour(0xff17191d));
  graphics.setColour(juce::Colour(0xffa7d85b));
  graphics.setFont(juce::Font(juce::FontOptions(19.0f, juce::Font::bold)));
  graphics.drawText("DansBPM Synth", 20, 12, 250, 28, juce::Justification::centredLeft);
  graphics.setColour(juce::Colour(0xff777f79));
  graphics.setFont(juce::Font(juce::FontOptions(11.0f)));
  graphics.drawText("POLYPHONIC • MIDI IN • OSCILLATOR / FILTER / ADSR", 20, 38, 390, 18, juce::Justification::centredLeft);
  graphics.setColour(juce::Colour(0xffaeb7ad));
  graphics.drawText("Wave", 425, 17, 44, 20, juce::Justification::centredLeft);
}

void DansBPMSynthAudioProcessorEditor::resized() {
  waveform.setBounds(468, 14, 72, 26);
  for (size_t index = 0; index < sliders.size(); ++index) {
    const auto column = static_cast<int>(index % 5);
    const auto row = static_cast<int>(index / 5);
    const auto x = 14 + column * 108;
    const auto y = 62 + row * 92;
    labels[index]->setBounds(x, y, 104, 18);
    sliders[index]->setBounds(x, y + 15, 104, 74);
  }
}
