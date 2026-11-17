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
  if (globalThis.ort) return Promise.resolve(globalThis.ort);
  if (ortRuntimePromises.has(scriptUrl)) return ortRuntimePromises.get(scriptUrl);
  const runtimePromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      try {
        importScripts(scriptUrl);
        if (globalThis.ort) resolve(globalThis.ort);
        else reject(new Error("ONNX Runtime loaded without its worker API."));
      } catch {
        reject(new Error("Could not load the audio separation runtime."));
      }
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (globalThis.ort) resolve(globalThis.ort);
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
  if (!response.body || !Number.isSafeInteger(total) || total <= 0) {
    const buffer = await response.arrayBuffer();
    onDownloadProgress(buffer.byteLength, buffer.byteLength);
    return buffer;
  }

  const bytes = new Uint8Array(total);
  const reader = response.body.getReader();
  let loaded = 0;
  let lastProgressAt = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (loaded + value.byteLength > total) {
      throw new Error("The separation model download exceeded its expected size.");
    }
    bytes.set(value, loaded);
    loaded += value.byteLength;
    const now = performance.now();
    if (now - lastProgressAt >= 200) {
      onDownloadProgress(loaded, total);
      lastProgressAt = now;
    }
  }
  if (loaded !== total) {
    throw new Error(`The separation model download was incomplete (${loaded} of ${total} bytes).`);
  }
  onDownloadProgress(loaded, total);
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
    ort.env.wasm.numThreads = globalThis.crossOriginIsolated
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
      onProgress: (progress) => onProgress({ stage: "separating", ...progress }),
    });
    const model = await fetchModel((loaded, total) => onProgress({
      stage: "download",
      loaded,
      total,
    }));
    onProgress({ stage: "loading-model" });
    await new Promise((resolve) => setTimeout(resolve, 0));
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

  const OfflineAudioContext = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
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

export async function separateAudioChannels(left, right, onProgress = () => {}) {
  const processor = await getDemucsProcessor(onProgress);
  const stems = await processor.separate(left, right);
  return { stems, sampleRate: SAMPLE_RATE };
}

export async function separateAudioBuffer(audioBuffer, onProgress = () => {}) {
  const { left, right } = await toStereo44100(audioBuffer);
  const workerLeft = left.slice();
  const workerRight = right.slice();
  const workerUrl = new URL("./audio-separation-worker.js", import.meta.url);
  workerUrl.search = new URL(import.meta.url).search;
  const worker = new Worker(workerUrl);
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (callback, value) => {
      if (finished) return;
      finished = true;
      worker.terminate();
      callback(value);
    };
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") {
        onProgress(data.progress);
      } else if (data.type === "result") {
        finish(resolve, data.result);
      } else if (data.type === "error") {
        finish(reject, new Error(data.message));
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(reject, new Error(event.message || "Audio separation worker failed."));
    };
    try {
      worker.postMessage(
        { type: "separate", left: workerLeft, right: workerRight },
        [workerLeft.buffer, workerRight.buffer],
      );
    } catch (error) {
      finish(reject, error);
    }
  });
}
