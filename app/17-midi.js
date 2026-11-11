  function readMidiVariableLength(bytes, cursor) {
    let value = 0;
    for (let count = 0; count < 4; count += 1) {
      if (cursor.index >= bytes.length) throw new Error("The MIDI file is truncated.");
      const byte = bytes[cursor.index++];
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    throw new Error("The MIDI file contains an invalid variable-length value.");
  }

  function parseMidiFile(buffer) {
    const bytes = new Uint8Array(buffer);
    const cursor = { index: 0 };
    const readAscii = (length) => {
      if (cursor.index + length > bytes.length) throw new Error("The MIDI file is truncated.");
      const text = String.fromCharCode(...bytes.subarray(cursor.index, cursor.index + length));
      cursor.index += length;
      return text;
    };
    const readUint32 = () => {
      if (cursor.index + 4 > bytes.length) throw new Error("The MIDI file is truncated.");
      const value = new DataView(bytes.buffer, bytes.byteOffset + cursor.index, 4).getUint32(0);
      cursor.index += 4;
      return value;
    };
    const readUint16 = () => {
      if (cursor.index + 2 > bytes.length) throw new Error("The MIDI file is truncated.");
      const value = new DataView(bytes.buffer, bytes.byteOffset + cursor.index, 2).getUint16(0);
      cursor.index += 2;
      return value;
    };
    if (readAscii(4) !== "MThd") throw new Error("That file is not a Standard MIDI File.");
    const headerLength = readUint32();
    if (headerLength < 6 || cursor.index + headerLength > bytes.length) throw new Error("The MIDI header is invalid.");
    const format = readUint16();
    const trackCount = readUint16();
    const division = readUint16();
    cursor.index += headerLength - 6;
    if (format > 1 || trackCount < 1 || trackCount > 1024) {
      throw new Error("Only type 0 or 1 MIDI files with up to 1,024 tracks are supported.");
    }
    if (division & 0x8000 || division === 0) throw new Error("SMPTE-timed MIDI files are not supported.");

    const tracks = [];
    const tempos = [];
    for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      if (readAscii(4) !== "MTrk") throw new Error("The MIDI file contains an invalid track.");
      const trackLength = readUint32();
      if (cursor.index + trackLength > bytes.length) throw new Error("The MIDI track is truncated.");
      const trackBytes = bytes.subarray(cursor.index, cursor.index + trackLength);
      cursor.index += trackLength;
      const trackCursor = { index: 0 };
      const activeNotes = new Map();
      const notes = [];
      let absoluteTick = 0;
      let runningStatus = 0;
      const readDataByte = () => {
        if (trackCursor.index >= trackBytes.length) throw new Error("The MIDI track is truncated.");
        return trackBytes[trackCursor.index++];
      };
      while (trackCursor.index < trackBytes.length) {
        absoluteTick += readMidiVariableLength(trackBytes, trackCursor);
        let status = readDataByte();
        if (status < 0x80) {
          if (!runningStatus) throw new Error("The MIDI track has an invalid running status.");
          trackCursor.index -= 1;
          status = runningStatus;
        } else if (status < 0xf0) {
          runningStatus = status;
        }

        if (status === 0xff) {
          runningStatus = 0;
          const metaType = readDataByte();
          const length = readMidiVariableLength(trackBytes, trackCursor);
          if (trackCursor.index + length > trackBytes.length) throw new Error("The MIDI metadata is truncated.");
          if (metaType === 0x51 && length === 3) {
            const microsecondsPerQuarter = (trackBytes[trackCursor.index] << 16) |
              (trackBytes[trackCursor.index + 1] << 8) | trackBytes[trackCursor.index + 2];
            if (microsecondsPerQuarter > 0) tempos.push({ tick: absoluteTick, microsecondsPerQuarter });
          }
          trackCursor.index += length;
          if (metaType === 0x2f) break;
          continue;
        }
        if (status === 0xf0 || status === 0xf7) {
          runningStatus = 0;
          trackCursor.index += readMidiVariableLength(trackBytes, trackCursor);
          if (trackCursor.index > trackBytes.length) throw new Error("The MIDI system-exclusive event is truncated.");
          continue;
        }
        if (status >= 0xf0) {
          runningStatus = 0;
          const dataLength = status === 0xf2 ? 2 : [0xf1, 0xf3].includes(status) ? 1 : 0;
          trackCursor.index += dataLength;
          if (trackCursor.index > trackBytes.length) throw new Error("The MIDI system event is truncated.");
          continue;
        }

        const command = status & 0xf0;
        const channel = status & 0x0f;
        const first = readDataByte();
        const second = [0xc0, 0xd0].includes(command) ? 0 : readDataByte();
        if (command !== 0x80 && command !== 0x90) continue;
        const key = `${channel}:${first}`;
        if (command === 0x90 && second > 0) {
          const queue = activeNotes.get(key) || [];
          queue.push({ tick: absoluteTick, velocity: second });
          activeNotes.set(key, queue);
        } else {
          const queue = activeNotes.get(key);
          const active = queue?.shift();
          if (active) notes.push({ ...active, endTick: Math.max(absoluteTick, active.tick + 1), midi: first });
          if (queue && !queue.length) activeNotes.delete(key);
        }
      }
      activeNotes.forEach((queue, key) => {
        const midi = Number(key.split(":")[1]);
        queue.forEach((active) => notes.push({
          ...active,
          endTick: Math.max(absoluteTick, active.tick + 1),
          midi,
        }));
      });
      tracks.push({ notes, endTick: absoluteTick });
    }
    const allNotes = tracks.flatMap((track) => track.notes);
    const firstTempo = tempos.sort((left, right) => left.tick - right.tick)[0];
    return {
      division,
      bpm: firstTempo ? 60_000_000 / firstTempo.microsecondsPerQuarter : 120,
      notes: allNotes,
      endTick: Math.max(0, ...tracks.map((track) => track.endTick)),
    };
  }

  function importMidiNotes(parsed) {
    const maxTick = 8 * PIANO_TICKS_PER_BAR;
    return parsed.notes
      .filter((note) => Number.isInteger(note.midi) && note.midi >= PIANO_BOTTOM_MIDI && note.midi <= PIANO_TOP_MIDI)
      .map((note) => {
        const startTick = Math.round(note.tick * PIANO_TICKS_PER_BAR / (4 * parsed.division) * 2) / 2;
        const endTick = Math.round(note.endTick * PIANO_TICKS_PER_BAR / (4 * parsed.division) * 2) / 2;
        if (startTick >= maxTick) return null;
        return {
          id: makeId(),
          trackId: state.selectedPianoTrackId,
          midi: note.midi,
          startTick: Math.max(0, startTick),
          durationTicks: Math.max(0.5, Math.min(maxTick - startTick, endTick - startTick)),
          velocity: Math.max(0.01, Math.min(1, note.velocity / 127)),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.startTick - right.startTick || left.midi - right.midi)
      .slice(0, 4096);
  }

  async function importMidiFile(file) {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before importing a MIDI melody.");
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      showToast("MIDI files must be smaller than 32 MB.");
      return;
    }
    try {
      const parsed = parseMidiFile(await file.arrayBuffer());
      const notes = importMidiNotes(parsed);
      if (!notes.length) throw new Error("No supported notes were found in that MIDI file.");
      const endTick = Math.max(...notes.map((note) => note.startTick + note.durationTicks));
      const bars = [1, 2, 4, 8].find((bar) => bar * PIANO_TICKS_PER_BAR >= endTick) || 8;
      const requestedBpm = Math.round(parsed.bpm);
      const bpm = Math.max(60, Math.min(180, requestedBpm));
      const name = file.name.replace(/\.(mid|midi)$/i, "").trim() || "Imported MIDI";
      const mel = makeMel(name, state.selectedPianoTrackId, bars, notes);
      if (state.isPlaying) stopPlayback();
      state.mels.push(mel);
      state.selectedMelId = mel.id;
      state.pianoNotes = mel.notes.map((note) => ({ ...note }));
      state.selectedPianoNoteId = null;
      state.selectedPianoNoteIds.clear();
      state.pianoSelectionFromMarquee = false;
      state.pianoBars = bars;
      state.bpm = bpm;
      tempoValue.textContent = String(bpm);
      renderMelOptions();
      renderPianoRoll();
      updateArrangementLength();
      renderArrangement();
      saveState();
      const skipped = Math.max(0, parsed.notes.length - notes.length);
      const skippedMessage = skipped ? ` ${skipped} notes outside the editor range were skipped.` : "";
      showToast(requestedBpm === bpm
        ? `Imported ${notes.length} MIDI notes into "${name}".${skippedMessage}`
        : `Imported ${notes.length} MIDI notes; tempo was limited to ${bpm} BPM.${skippedMessage}`);
    } catch (error) {
      showToast(error.message || "The MIDI file could not be imported.");
    }
  }

  function writeMidiVariableLength(value) {
    let remaining = Math.max(0, Math.floor(value));
    const bytes = [remaining & 0x7f];
    while ((remaining >>= 7) > 0) bytes.unshift((remaining & 0x7f) | 0x80);
    return bytes;
  }

  function createMidiFile(mel) {
    const ticksPerQuarter = 480;
    const midiTicksPerPianoTick = ticksPerQuarter / (PIANO_TICKS_PER_BAR / 4);
    const events = [];
    const microsecondsPerQuarter = Math.round(60_000_000 / state.bpm);
    events.push({ tick: 0, priority: -2, bytes: [0xff, 0x51, 0x03,
      (microsecondsPerQuarter >> 16) & 0xff, (microsecondsPerQuarter >> 8) & 0xff, microsecondsPerQuarter & 0xff] });
    events.push({ tick: 0, priority: -1, bytes: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] });
    mel.notes.forEach((note) => {
      const start = Math.max(0, Math.round(note.startTick * midiTicksPerPianoTick));
      const end = Math.max(start + 1, Math.round((note.startTick + note.durationTicks) * midiTicksPerPianoTick));
      const pitch = Math.max(0, Math.min(127, Math.round(note.midi)));
      const velocity = Math.max(1, Math.min(127, Math.round((note.velocity ?? 0.8) * 127)));
      events.push({ tick: start, priority: 1, bytes: [0x90, pitch, velocity] });
      events.push({ tick: end, priority: 0, bytes: [0x80, pitch, 0] });
    });
    events.sort((left, right) => left.tick - right.tick || left.priority - right.priority);
    const trackBytes = [];
    let previousTick = 0;
    events.forEach((event) => {
      trackBytes.push(...writeMidiVariableLength(event.tick - previousTick), ...event.bytes);
      previousTick = event.tick;
    });
    trackBytes.push(...writeMidiVariableLength(0), 0xff, 0x2f, 0x00);
    const chunk = (id, data) => [
      ...Array.from(id, (character) => character.charCodeAt(0)),
      (data.length >>> 24) & 0xff, (data.length >>> 16) & 0xff, (data.length >>> 8) & 0xff, data.length & 0xff,
      ...data,
    ];
    const header = [0x00, 0x00, 0x00, 0x01, 0x01, 0xe0];
    return new Uint8Array([...chunk("MThd", header), ...chunk("MTrk", trackBytes)]);
  }

  function exportMidi() {
    if (state.stepPianoEditContext) {
      showToast("Return to the Piano Roll before exporting a MIDI melody.");
      return;
    }
    captureCurrentMel();
    const mel = getMel();
    if (!mel || !mel.notes.length) {
      showToast("Add notes to the Piano Roll before exporting MIDI.");
      return;
    }
    const filename = `${sanitizeFilename(mel.name) || "melody"}.mid`;
    downloadBlob(new Blob([createMidiFile(mel)], { type: "audio/midi" }), filename);
    showToast(`Exported "${mel.name}" as MIDI.`);
  }
