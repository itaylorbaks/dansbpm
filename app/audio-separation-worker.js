self.addEventListener("message", async ({ data }) => {
  if (data.type !== "separate") return;
  try {
    const moduleUrl = new URL("./audio-separation.js", self.location.href);
    moduleUrl.search = self.location.search;
    const { separateAudioChannels } = await import(moduleUrl);
    const result = await separateAudioChannels(data.left, data.right, (progress) => {
      self.postMessage({ type: "progress", progress });
    });
    const transfers = Object.values(result.stems).flatMap(({ left, right }) => [
      left.buffer,
      right.buffer,
    ]);
    self.postMessage({ type: "result", result }, transfers);
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Audio separation failed.",
    });
  }
});
