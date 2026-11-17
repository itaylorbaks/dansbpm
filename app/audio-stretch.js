let worker = null;
let nextJobId = 0;
const pendingJobs = new Map();

function rejectPendingJobs(error) {
  pendingJobs.forEach(({ reject }) => reject(error));
  pendingJobs.clear();
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./audio-stretch-worker.js", import.meta.url), { type: "module" });
  worker.addEventListener("message", (event) => {
    const job = pendingJobs.get(event.data.id);
    if (!job) return;
    pendingJobs.delete(event.data.id);
    if (event.data.error) {
      job.reject(new Error(event.data.error));
      return;
    }
    job.resolve(event.data.channels.map((channel) => new Float32Array(channel)));
  });
  worker.addEventListener("error", (event) => {
    worker?.terminate();
    worker = null;
    rejectPendingJobs(new Error(event.message || "The audio time-stretch worker failed."));
  });
  return worker;
}

export function stretchAudioBuffer(context, buffer, tempoRatio, pitchSemitones) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index).slice());
  const jobId = ++nextJobId;
  return new Promise((resolve, reject) => {
    pendingJobs.set(jobId, {
      reject,
      resolve: (outputChannels) => {
        try {
          const output = context.createBuffer(outputChannels.length, outputChannels[0].length, buffer.sampleRate);
          outputChannels.forEach((channel, index) => output.getChannelData(index).set(channel));
          resolve(output);
        } catch (error) {
          reject(error);
        }
      },
    });
    try {
      getWorker().postMessage({ id: jobId, channels, tempoRatio, pitchSemitones },
        channels.map((channel) => channel.buffer));
    } catch (error) {
      pendingJobs.delete(jobId);
      reject(error);
    }
  });
}
