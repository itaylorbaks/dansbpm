const SAMPLE_RATE = 44_100;
const MAX_AUDIO_DURATION_SECONDS = 300;
const ONNX_RUNTIME_VERSION = "1.22.0";
const ONNX_RUNTIME_SCRIPT =
  `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/ort.min.js`;
const ONNX_RUNTIME_WEBGPU_SCRIPT =
  `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/ort.webgpu.min.js`;
const ONNX_RUNTIME_WASM_PATH =
  `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/`;
const DEMUCS_MODULE = "https://cdn.jsdelivr.net/npm/demucs-web@1.0.2/src/index.js";
const DEMUCS_MODEL =
  "https://huggingface.co/timcsy/demucs-web-onnx/resolve/92e33df61cfc9eb820272aaa62d2ef6dcf4d950d/htdemucs_embedded.onnx";

const ortRuntimePromises = new Map();
let demucsProcessorPromise = null;

function loadOnnxRuntime(scriptUrl) {
  if (window.ort) return Promise.resolve(window.ort);
  if (ortRuntimePromises.has(scriptUrl)) return ortRuntimePromises.get(scriptUrl);
  const runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.ort) resolve(window.ort);
      else reject(new Error("ONNX Runtime loaded without its browser API."));
    };
    script.onerror = () => reject(new Error("Could not load the audio separation runtime."));
    document.head.append(script);
  }).catch((error) => {
    ortRuntimePromises.delete(scriptUrl);
    throw error;
  });
  ortRuntimePromises.set(scriptUrl, runtimePromise);
  return runtimePromise;
}

async function fetchModel(onDownloadProgress) {
  const response = await fetch(DEMUCS_MODEL, {
    credentials: "omit",
    mode: "cors",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error(`Could not download the separation model (HTTP ${response.status}).`);
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onDownloadProgress(buffer.byteLength, total || buffer.byteLength);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onDownloadProgress(loaded, total);
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return bytes.buffer;
}

async function getDemucsProcessor(onProgress) {
  if (demucsProcessorPromise) return demucsProcessorPromise;
  demucsProcessorPromise = (async () => {
    let adapter = null;
    if (navigator.gpu) {
      try {
        adapter = await navigator.gpu.requestAdapter();
      } catch {
        adapter = null;
      }
    }
    let useWebGPU = Boolean(adapter);
    let ort;
    try {
      ort = await loadOnnxRuntime(useWebGPU ? ONNX_RUNTIME_WEBGPU_SCRIPT : ONNX_RUNTIME_SCRIPT);
    } catch (error) {
      if (!useWebGPU) throw error;
      useWebGPU = false;
      ort = await loadOnnxRuntime(ONNX_RUNTIME_SCRIPT);
    }
    const { DemucsProcessor } = await import(DEMUCS_MODULE);
    ort.env.wasm.wasmPaths = ONNX_RUNTIME_WASM_PATH;
    ort.env.wasm.numThreads = window.crossOriginIsolated
      ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
      : 1;
    const executionProviders = useWebGPU ? ["webgpu", "wasm"] : ["wasm"];

    const processor = new DemucsProcessor({
      ort,
      sessionOptions: {
        executionProviders,
        graphOptimizationLevel: "basic",
        enableCpuMemArena: false,
        enableMemPattern: false,
      },
      onProgress,
    });
    const model = await fetchModel((loaded, total) => onProgress({
      stage: "download",
      loaded,
      total,
    }));
    await processor.loadModel(model);
    return processor;
  })().catch((error) => {
    demucsProcessorPromise = null;
    throw error;
  });
  return demucsProcessorPromise;
}

async function toStereo44100(audioBuffer) {
  if (audioBuffer.duration > MAX_AUDIO_DURATION_SECONDS) {
    throw new Error("Audio scans are limited to 5 minutes to protect browser memory.");
  }
  if (audioBuffer.sampleRate === SAMPLE_RATE && audioBuffer.numberOfChannels >= 2) {
    return {
      left: audioBuffer.getChannelData(0),
      right: audioBuffer.getChannelData(1),
    };
  }
  if (audioBuffer.sampleRate === SAMPLE_RATE && audioBuffer.numberOfChannels === 1) {
    const channel = audioBuffer.getChannelData(0);
    return { left: channel, right: channel };
  }

  const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContext) throw new Error("This browser cannot resample audio for separation.");
  const frameCount = Math.max(1, Math.round(audioBuffer.duration * SAMPLE_RATE));
  const offlineContext = new OfflineAudioContext(2, frameCount, SAMPLE_RATE);
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  const resampled = await offlineContext.startRendering();
  return {
    left: resampled.getChannelData(0),
    right: resampled.getChannelData(1),
  };
}

export async function separateAudioBuffer(audioBuffer, onProgress = () => {}) {
  const { left, right } = await toStereo44100(audioBuffer);
  const processor = await getDemucsProcessor(onProgress);
  const stems = await processor.separate(left, right);
  return { stems, sampleRate: SAMPLE_RATE };
}
