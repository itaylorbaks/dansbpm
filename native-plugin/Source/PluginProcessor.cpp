#include "PluginProcessor.h"
#include "PluginEditor.h"

#include <algorithm>
#include <array>
#include <cmath>

namespace {
constexpr float twoPi = juce::MathConstants<float>::twoPi;

float polyBlep(float phase, float increment) {
  if (increment <= 0.0f) return 0.0f;
  if (phase < increment) {
    phase /= increment;
    return phase + phase - phase * phase - 1.0f;
  }
  if (phase > 1.0f - increment) {
    phase = (phase - 1.0f) / increment;
    return phase * phase + phase + phase + 1.0f;
  }
  return 0.0f;
}

float oscillatorSample(int shape, float phase, float increment) {
  switch (shape) {
    case 0:
      return std::sin(twoPi * phase);
    case 1:
      return 1.0f - 4.0f * std::abs(phase - 0.5f);
    case 2:
      return 2.0f * phase - 1.0f - polyBlep(phase, increment);
    default: {
      const auto shiftedPhase = std::fmod(phase + 0.5f, 1.0f);
      return (phase < 0.5f ? 1.0f : -1.0f)
        + polyBlep(phase, increment) - polyBlep(shiftedPhase, increment);
    }
  }
}

float readParameter(const juce::AudioProcessorValueTreeState& state, const char* id) {
  const auto* value = state.getRawParameterValue(id);
  return value == nullptr ? 0.0f : value->load(std::memory_order_relaxed);
}

class DansBPMSynthSound final : public juce::SynthesiserSound {
public:
  bool appliesToNote(int) override { return true; }
  bool appliesToChannel(int) override { return true; }
};

class DansBPMSynthVoice final : public juce::SynthesiserVoice {
public:
  explicit DansBPMSynthVoice(const juce::AudioProcessorValueTreeState& state)
    : parameters(state) {
    filter.setType(juce::dsp::StateVariableTPTFilterType::lowpass);
  }

  bool canPlaySound(juce::SynthesiserSound* sound) override {
    return dynamic_cast<DansBPMSynthSound*>(sound) != nullptr;
  }

  void setCurrentPlaybackSampleRate(double sampleRate) override {
    juce::SynthesiserVoice::setCurrentPlaybackSampleRate(sampleRate);
    ampEnvelope.setSampleRate(sampleRate);
    filterEnvelope.setSampleRate(sampleRate);
    filter.prepare(juce::dsp::ProcessSpec{ sampleRate, 512, 1 });
  }

  void startNote(int midiNoteNumber, float velocity, juce::SynthesiserSound*, int) override {
    midiNote = midiNoteNumber;
    noteVelocity = velocity;
    pitchBend = 0.0f;
    phase = 0.0f;
    secondPhase = 0.0f;
    subPhase = 0.0f;
    lfoPhase = 0.0f;
    filter.reset();

    const auto attack = readParameter(parameters, "attack");
    const auto decay = readParameter(parameters, "decay");
    const auto sustain = readParameter(parameters, "sustain");
    const auto release = readParameter(parameters, "release");
    ampEnvelope.setSampleRate(getSampleRate());
    ampEnvelope.setParameters({ attack, decay, sustain, release });
    filterEnvelope.setSampleRate(getSampleRate());
    filterEnvelope.setParameters({ readParameter(parameters, "filterAttack"),
      readParameter(parameters, "filterDecay"), readParameter(parameters, "filterSustain"), release });
    ampEnvelope.noteOn();
    filterEnvelope.noteOn();
  }

  void stopNote(float, bool allowTailOff) override {
    if (allowTailOff) {
      ampEnvelope.noteOff();
      filterEnvelope.noteOff();
    } else {
      ampEnvelope.reset();
      filterEnvelope.reset();
      clearCurrentNote();
    }
  }

  void pitchWheelMoved(int newValue) override {
    pitchBend = (static_cast<float>(newValue) - 8192.0f) / 8192.0f * 2.0f;
  }

  void controllerMoved(int, int) override {}

  void renderNextBlock(juce::AudioBuffer<float>& output, int startSample, int numSamples) override {
    renderVoice(output, startSample, numSamples);
  }

  void renderNextBlock(juce::AudioBuffer<double>& output, int startSample, int numSamples) override {
    renderVoice(output, startSample, numSamples);
  }

private:
  template <typename SampleType>
  void renderVoice(juce::AudioBuffer<SampleType>& output, int startSample, int numSamples) {
    if (!isVoiceActive()) return;

    const auto sampleRate = static_cast<float>(getSampleRate());
    const auto baseFrequency = juce::MidiMessage::getMidiNoteInHertz(midiNote);
    const auto shape = juce::roundToInt(readParameter(parameters, "waveform"));
    const auto detune = readParameter(parameters, "detune");
    const auto resonance = readParameter(parameters, "resonance");
    const auto baseCutoff = readParameter(parameters, "cutoff");
    const auto filterAmount = readParameter(parameters, "filterEnv");
    const auto lfoRate = readParameter(parameters, "lfoRate");
    const auto lfoDepth = readParameter(parameters, "lfoDepth");
    const auto subLevel = readParameter(parameters, "sub");
    const auto master = readParameter(parameters, "master");
    const auto maxCutoff = std::min(18000.0f, sampleRate * 0.45f);
    filter.setResonance(resonance);

    for (int sample = startSample; sample < startSample + numSamples; ++sample) {
      if (!ampEnvelope.isActive()) {
        clearCurrentNote();
        break;
      }

      const auto vibrato = std::sin(twoPi * lfoPhase) * lfoDepth;
      const auto bentFrequency = baseFrequency * std::pow(2.0f, (pitchBend + vibrato) / 12.0f);
      const auto firstIncrement = bentFrequency / sampleRate;
      const auto secondFrequency = bentFrequency * std::pow(2.0f, detune / 1200.0f);
      const auto secondIncrement = secondFrequency / sampleRate;
      const auto subIncrement = (bentFrequency * 0.5f) / sampleRate;
      const auto first = oscillatorSample(shape, phase, firstIncrement);
      const auto second = oscillatorSample(shape, secondPhase, secondIncrement);
      const auto sub = std::sin(twoPi * subPhase);
      const auto raw = first * 0.56f + second * 0.3f + sub * subLevel;
      const auto filterEnvelopeValue = filterEnvelope.getNextSample();
      const auto cutoff = std::clamp(baseCutoff * std::pow(2.0f, filterAmount * filterEnvelopeValue), 40.0f, maxCutoff);
      filter.setCutoffFrequency(cutoff);
      const auto filtered = filter.processSample(0, raw);
      const auto amplitude = ampEnvelope.getNextSample() * noteVelocity * master * 0.55f;
      const auto value = filtered * amplitude;

      for (int channel = 0; channel < output.getNumChannels(); ++channel)
        output.addSample(channel, sample, static_cast<SampleType>(value));

      phase = std::fmod(phase + firstIncrement, 1.0f);
      secondPhase = std::fmod(secondPhase + secondIncrement, 1.0f);
      subPhase = std::fmod(subPhase + subIncrement, 1.0f);
      lfoPhase = std::fmod(lfoPhase + lfoRate / sampleRate, 1.0f);
    }
  }

  const juce::AudioProcessorValueTreeState& parameters;
  juce::ADSR ampEnvelope;
  juce::ADSR filterEnvelope;
  juce::dsp::StateVariableTPTFilter<float> filter;
  int midiNote = 60;
  float noteVelocity = 0.0f;
  float pitchBend = 0.0f;
  float phase = 0.0f;
  float secondPhase = 0.0f;
  float subPhase = 0.0f;
  float lfoPhase = 0.0f;
};
}

DansBPMSynthAudioProcessor::DansBPMSynthAudioProcessor()
  : AudioProcessor(BusesProperties().withOutput("Output", juce::AudioChannelSet::stereo(), true)),
    parameters(*this, nullptr, "PARAMETERS", createParameterLayout()) {
  for (int voice = 0; voice < 16; ++voice)
    synthesiser.addVoice(new DansBPMSynthVoice(parameters));
  synthesiser.addSound(new DansBPMSynthSound());
}

void DansBPMSynthAudioProcessor::prepareToPlay(double sampleRate, int) {
  synthesiser.setCurrentPlaybackSampleRate(sampleRate);
}

void DansBPMSynthAudioProcessor::releaseResources() {
  synthesiser.allNotesOff(0, false);
}

bool DansBPMSynthAudioProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const {
  const auto output = layouts.getMainOutputChannelSet();
  return output == juce::AudioChannelSet::mono() || output == juce::AudioChannelSet::stereo();
}

void DansBPMSynthAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages) {
  juce::ScopedNoDenormals noDenormals;
  buffer.clear();
  synthesiser.renderNextBlock(buffer, midiMessages, 0, buffer.getNumSamples());
}

void DansBPMSynthAudioProcessor::processBlock(juce::AudioBuffer<double>& buffer, juce::MidiBuffer& midiMessages) {
  juce::ScopedNoDenormals noDenormals;
  buffer.clear();
  synthesiser.renderNextBlock(buffer, midiMessages, 0, buffer.getNumSamples());
}

juce::AudioProcessorEditor* DansBPMSynthAudioProcessor::createEditor() {
  return new DansBPMSynthAudioProcessorEditor(*this);
}

void DansBPMSynthAudioProcessor::getStateInformation(juce::MemoryBlock& destination) {
  if (const auto xml = parameters.copyState().createXml())
    copyXmlToBinary(*xml, destination);
}

void DansBPMSynthAudioProcessor::setStateInformation(const void* data, int sizeInBytes) {
  if (const auto xml = getXmlFromBinary(data, sizeInBytes)) {
    if (xml->hasTagName(parameters.state.getType()))
      parameters.replaceState(juce::ValueTree::fromXml(*xml));
  }
}

juce::AudioProcessorValueTreeState::ParameterLayout DansBPMSynthAudioProcessor::createParameterLayout() {
  using Float = juce::AudioParameterFloat;
  using Range = juce::NormalisableRange<float>;
  std::vector<std::unique_ptr<juce::RangedAudioParameter>> parameters;
  parameters.push_back(std::make_unique<juce::AudioParameterChoice>(
    juce::ParameterID{ "waveform", 1 }, "Waveform",
    juce::StringArray{ "Sine", "Triangle", "Saw", "Square" }, 2));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "cutoff", 1 }, "Cutoff",
    Range(40.0f, 18000.0f, 1.0f, 0.28f), 3200.0f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "resonance", 1 }, "Resonance",
    Range(0.1f, 0.95f, 0.001f), 0.2f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "attack", 1 }, "Attack",
    Range(0.001f, 3.0f, 0.001f, 0.45f), 0.01f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "decay", 1 }, "Decay",
    Range(0.01f, 4.0f, 0.001f, 0.45f), 0.25f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "sustain", 1 }, "Sustain",
    Range(0.0f, 1.0f, 0.001f), 0.55f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "release", 1 }, "Release",
    Range(0.005f, 5.0f, 0.001f, 0.45f), 0.25f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "detune", 1 }, "Detune",
    Range(-30.0f, 30.0f, 0.1f), 8.0f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "sub", 1 }, "Sub",
    Range(0.0f, 0.7f, 0.001f), 0.2f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "filterEnv", 1 }, "Filter Env",
    Range(0.0f, 5.0f, 0.01f), 2.5f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "filterAttack", 1 }, "Filter Attack",
    Range(0.001f, 3.0f, 0.001f, 0.45f), 0.02f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "filterDecay", 1 }, "Filter Decay",
    Range(0.01f, 4.0f, 0.001f, 0.45f), 0.35f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "filterSustain", 1 }, "Filter Sustain",
    Range(0.0f, 1.0f, 0.001f), 0.25f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "lfoRate", 1 }, "LFO Rate",
    Range(0.0f, 12.0f, 0.01f), 0.18f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "lfoDepth", 1 }, "LFO Depth",
    Range(0.0f, 100.0f, 0.1f), 4.0f));
  parameters.push_back(std::make_unique<Float>(juce::ParameterID{ "master", 1 }, "Output",
    Range(0.0f, 1.0f, 0.001f), 0.72f));
  return { parameters.begin(), parameters.end() };
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() {
  return new DansBPMSynthAudioProcessor();
}
