function getArrangementClipSourcePosition(sourceOffset, elapsed, repeatStart, repeatLength) {
  if (Number.isFinite(repeatStart) && Number.isFinite(repeatLength) && repeatLength > 0) {
    const phase = ((sourceOffset - repeatStart) % repeatLength + repeatLength) % repeatLength;
    return repeatStart + ((phase + elapsed) % repeatLength + repeatLength) % repeatLength;
  }
  return sourceOffset + elapsed;
}

function getArrangementClipLeftResizeSourcePosition(sourceOffset, elapsed, repeatStart, repeatLength) {
  if (elapsed < 0) return Math.max(0, sourceOffset + elapsed);
  return getArrangementClipSourcePosition(sourceOffset, elapsed, repeatStart, repeatLength);
}

function getArrangementClipLeftResizeRepeatRegion(sourceOffset, repeatStart, repeatLength) {
  if (!Number.isFinite(repeatStart) || !Number.isFinite(repeatLength) ||
    repeatLength <= 0 || sourceOffset >= repeatStart) {
    return { repeatStart, repeatLength };
  }
  return {
    repeatStart: sourceOffset,
    repeatLength: repeatStart + repeatLength - sourceOffset,
  };
}

function getArrangementClipPlayableSourceDuration(sourceLength, sourceOffset, repeatCount, requestedDuration,
  repeatStart = null, repeatLength = null) {
  if (!(sourceLength > 0) || !(requestedDuration > 0)) return 0;
  const hasRepeatRegion = Number.isFinite(repeatStart) &&
    Number.isFinite(repeatLength) && repeatLength > 0;
  const phase = hasRepeatRegion
    ? ((sourceOffset - repeatStart) % repeatLength + repeatLength) % repeatLength
    : sourceOffset;
  const availableDuration = hasRepeatRegion
    ? repeatLength * Math.max(1, repeatCount || 1) - phase
    : sourceLength * Math.max(1, repeatCount || 1) - sourceOffset;
  return Math.max(0, Math.min(requestedDuration, availableDuration));
}

function getArrangementClipSourceWindows(sourceLength, sourceOffset, repeatCount, requestedDuration,
  repeatStart = null, repeatLength = null, fromElapsed = 0, toElapsed = Infinity) {
  const playableDuration = getArrangementClipPlayableSourceDuration(
    sourceLength, sourceOffset, repeatCount, requestedDuration, repeatStart, repeatLength,
  );
  if (!(playableDuration > 0)) return [];
  const hasRepeatRegion = Number.isFinite(repeatStart) &&
    Number.isFinite(repeatLength) && repeatLength > 0;
  const phase = hasRepeatRegion
    ? ((sourceOffset - repeatStart) % repeatLength + repeatLength) % repeatLength
    : sourceOffset;
  const windows = [];
  let elapsedSource = Math.max(0, fromElapsed);
  const endElapsed = Math.min(playableDuration, toElapsed);
  while (elapsedSource < endElapsed - 0.000001) {
    const virtualPosition = getArrangementClipSourcePosition(
      sourceOffset, elapsedSource, repeatStart, repeatLength,
    );
    const position = ((virtualPosition % sourceLength) + sourceLength) % sourceLength;
    const repeatPhase = hasRepeatRegion
      ? (phase + elapsedSource) % repeatLength : 0;
    const duration = Math.min(
      endElapsed - elapsedSource,
      sourceLength - position,
      hasRepeatRegion ? repeatLength - repeatPhase : Infinity,
    );
    if (!(duration > 0)) break;
    windows.push({
      index: windows.length,
      elapsedSource,
      sourceOffset: position,
      duration,
    });
    elapsedSource += duration;
  }
  return windows;
}
