cmake_minimum_required(VERSION 3.22)
project(DansBPMSynth VERSION 1.0.0)

include(CTest)
include(FetchContent)
FetchContent_Declare(
  JUCE
  GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
  GIT_TAG 8.0.4
  GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_plugin(DansBPMSynth
  COMPANY_NAME "DansBPM"
  BUNDLE_ID "com.dansbpm.synth"
  PLUGIN_MANUFACTURER_CODE DnBp
  PLUGIN_CODE DbSy
  PRODUCT_NAME "DansBPM Synth"
  FORMATS VST3 Standalone
  IS_SYNTH TRUE
  NEEDS_MIDI_INPUT TRUE
  NEEDS_MIDI_OUTPUT FALSE
  IS_MIDI_EFFECT FALSE
  EDITOR_WANTS_KEYBOARD_FOCUS FALSE
  COPY_PLUGIN_AFTER_BUILD FALSE
)

target_sources(DansBPMSynth PRIVATE
  Source/PluginProcessor.cpp
  Source/PluginEditor.cpp
)

target_compile_features(DansBPMSynth PRIVATE cxx_std_17)
target_compile_definitions(DansBPMSynth PRIVATE
  JUCE_WEB_BROWSER=0
  JUCE_USE_CURL=0
)
target_link_libraries(DansBPMSynth PRIVATE
  juce::juce_audio_utils
  juce::juce_dsp
  PUBLIC
  juce::juce_recommended_config_flags
  juce::juce_recommended_warning_flags
)

if(BUILD_TESTING)
  add_executable(DansBPMSynthSmokeTest Tests/SynthSmokeTest.cpp)
  target_include_directories(DansBPMSynthSmokeTest PRIVATE Source)
  target_compile_features(DansBPMSynthSmokeTest PRIVATE cxx_std_17)
  target_compile_definitions(DansBPMSynthSmokeTest PRIVATE JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0)
  target_link_libraries(DansBPMSynthSmokeTest PRIVATE
    DansBPMSynth
    juce::juce_audio_utils
    juce::juce_dsp
    juce::juce_recommended_config_flags
  )
  add_test(NAME DansBPMSynthMidiVoice COMMAND DansBPMSynthSmokeTest)
endif()
