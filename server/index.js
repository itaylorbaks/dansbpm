import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";

const COLLABORATION_PATH = "/collaboration";
const MAX_ROOMS = 200;
const MAX_ROOM_PARTICIPANTS = 12;
const MAX_ROOM_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_ROOM_BYTES = 100 * 1024 * 1024;
const MAX_MESSAGES_PER_SECOND = 30;
const ROOM_CODE_BYTES = 10;
const COLLABORATION_VIEWS = new Set(["arrangement", "sequencer", "piano-roll", "mixer", "dj"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function measureRoom(snapshot, assets) {
  return Buffer.byteLength(JSON.stringify({ snapshot, assets }), "utf8");
}

function isValidAssets(assets) {
  return Array.isArray(assets) && assets.every((asset) =>
    isRecord(asset) &&
    isRecord(asset.metadata) &&
    typeof asset.dataUrl === "string" &&
    asset.dataUrl.startsWith("data:"),
  );
}

function mergeWorkspaceAssets(current, incoming) {
  const assets = new Map(current.map((asset) => [
    asset.metadata.id
      ? `${asset.metadata.recordType || ""}:${asset.metadata.id}`
      : `${asset.metadata.recordType || ""}:${asset.metadata.trackId}`,
    asset,
  ]));
  incoming.forEach((asset) => {
    const key = asset.metadata.id
      ? `${asset.metadata.recordType || ""}:${asset.metadata.id}`
      : `${asset.metadata.recordType || ""}:${asset.metadata.trackId}`;
    assets.set(key, asset);
  });
  return [...assets.values()];
}

function safeName(value) {
  if (typeof value !== "string") return "Guest";
  const name = value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 32);
  return name || "Guest";
}

function safeProjectName(value) {
  if (typeof value !== "string") return "Shared project";
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 64) || "Shared project";
}

function safeView(value) {
  return COLLABORATION_VIEWS.has(value) ? value : "arrangement";
}

function validWorkspaceScope(scope) {
  return scope === "track-view" || scope === "mixer" || scope === "dj" ||
    /^(pattern|mel):[A-Za-z0-9_-]{1,128}$/.test(scope);
}

function workspaceScopesConflict(left, right) {
  if (left === right || left === "mixer" || right === "mixer") return true;
  return left === "track-view" && right.startsWith("pattern:") ||
    right === "track-view" && left.startsWith("pattern:");
}

const WORKSPACE_MIXER_FIELDS = new Set([
  "volume", "pan", "automation", "automationOpen", "muted", "solo",
  "effects", "effectSettings", "effectChain",
]);

function mergePatternDependency(merged, incoming, id) {
  const source = incoming.patterns.find((item) => item.id === id);
  if (!source) return null;
  const index = merged.patterns.findIndex((item) => item.id === id);
  if (index < 0) merged.patterns.push(structuredClone(source));
  else {
    Object.entries(source).forEach(([key, value]) => {
      if (!WORKSPACE_MIXER_FIELDS.has(key)) merged.patterns[index][key] = structuredClone(value);
    });
  }
  return Array.isArray(source.trackIds) ? source.trackIds : [];
}

function mergeTrackDependencies(merged, current, incoming, trackIds) {
  const sourceTracks = new Map(incoming.tracks.map((track) => [track.id, track]));
  trackIds.forEach((id) => {
    const source = sourceTracks.get(id);
    if (!source) return;
    const index = merged.tracks.findIndex((track) => track.id === id);
    if (index < 0) {
      merged.tracks.push(structuredClone(source));
      return;
    }
    const result = structuredClone(source);
    const existing = current.tracks.find((track) => track.id === id);
    if (existing) WORKSPACE_MIXER_FIELDS.forEach((key) => {
      if (Object.hasOwn(existing, key)) result[key] = structuredClone(existing[key]);
      else delete result[key];
    });
    merged.tracks[index] = result;
  });
}

function mergeWorkspaceSnapshot(current, incoming, scope) {
  if (!isRecord(current) || !isRecord(incoming) ||
    !["tracks", "patterns", "arrangementTracks", "patternClips", "mels", "melTracks"]
      .every((key) => Array.isArray(current[key]) && Array.isArray(incoming[key]) &&
        current[key].every((item) => isRecord(item) && typeof item.id === "string") &&
        incoming[key].every((item) => isRecord(item) && typeof item.id === "string"))) {
    return null;
  }
  const merged = structuredClone(current);
  const [type, id] = scope.includes(":") ? scope.split(":", 2) : [scope, ""];
  if (type === "pattern" || type === "mel") {
    const collection = type === "pattern" ? "patterns" : "mels";
    const source = incoming[collection].find((item) => item.id === id);
    const index = merged[collection].findIndex((item) => item.id === id);
    if (!source) {
      if (index < 0 || merged[collection].length <= 1) return null;
      merged[collection].splice(index, 1);
      if (type === "pattern") {
        merged.patternClips = merged.patternClips.filter((clip) =>
          !isRecord(clip) || (clip.patternId !== id && clip.trackId !== id));
        if (merged.selectedPatternId === id) merged.selectedPatternId = merged.patterns[0]?.id || null;
      } else {
        merged.melTracks.forEach((track) => {
          if (Array.isArray(track.clips)) track.clips = track.clips.filter((clip) =>
            !isRecord(clip) || clip.melId !== id);
        });
        if (merged.selectedMelId === id) merged.selectedMelId = merged.mels[0]?.id || null;
      }
      return merged;
    }
    if (type === "pattern") {
      const dependencies = mergePatternDependency(merged, incoming, id) || [];
      mergeTrackDependencies(merged, current, incoming, dependencies);
      merged.selectedPatternId = id;
    } else {
      if (index < 0) merged.mels.push(structuredClone(source));
      else merged.mels[index] = structuredClone(source);
      merged.selectedMelId = id;
    }
    return merged;
  }
  if (type === "track-view") {
    [
      "arrangementTracks",
      "patternClips",
      "melTracks",
      "arrangementBars",
      "arrangementCursor",
      "arrangementLoopEnabled",
      "arrangementLoopStartBar",
      "arrangementLoopEndBar",
      "arrangementSnap",
      "bpm",
      "swing",
    ].forEach((key) => { merged[key] = structuredClone(incoming[key]); });
    ["arrangementTracks", "melTracks"].forEach((collection) => {
      merged[collection] = incoming[collection].map((source) => {
        const existing = current[collection].find((item) => item.id === source.id);
        if (!existing) return structuredClone(source);
        const result = structuredClone(source);
        WORKSPACE_MIXER_FIELDS.forEach((key) => {
          if (Object.hasOwn(existing, key)) result[key] = structuredClone(existing[key]);
          else delete result[key];
        });
        return result;
      });
    });
    const dependentPatternIds = new Set(incoming.patternClips.filter(isRecord).flatMap((clip) =>
      [clip.patternId, clip.trackId].filter((value) => typeof value === "string")));
    const dependentTrackIds = new Set();
    dependentPatternIds.forEach((patternId) => {
      const ids = mergePatternDependency(merged, incoming, patternId);
      ids?.forEach((trackId) => dependentTrackIds.add(trackId));
    });
    mergeTrackDependencies(merged, current, incoming, dependentTrackIds);
    const dependentMelIds = new Set(incoming.melTracks.flatMap((track) =>
      (Array.isArray(track.clips) ? track.clips : [])
        .filter(isRecord).map((clip) => clip.melId).filter((value) => typeof value === "string")));
    dependentMelIds.forEach((melId) => {
      const source = incoming.mels.find((mel) => mel.id === melId);
      if (!source) return;
      const index = merged.mels.findIndex((mel) => mel.id === melId);
      if (index < 0) merged.mels.push(structuredClone(source));
      else merged.mels[index] = structuredClone(source);
    });
    return merged;
  }
  if (type === "mixer") {
    ["masterTrack", "effectTracks"].forEach((key) => { merged[key] = structuredClone(incoming[key]); });
    const mixFields = [
      "volume", "pan", "muted", "solo", "automation", "automationOpen",
      "effects", "effectSettings", "effectChain",
    ];
    ["tracks", "patterns", "arrangementTracks", "melTracks"].forEach((collection) => {
      const sourceItems = new Map(incoming[collection].map((item) => [item.id, item]));
      merged[collection].forEach((item) => {
        const source = sourceItems.get(item.id);
        if (source) mixFields.forEach((key) => { item[key] = structuredClone(source[key]); });
      });
    });
    return merged;
  }
  if (type === "dj" && incoming.dj) {
    merged.dj = structuredClone(incoming.dj);
    return merged;
  }
  return null;
}

function send(socket, value) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(value));
}

export function createCollaborationServer({
  allowedOrigins = [],
  maxPayloadBytes = MAX_ROOM_BYTES + 1024 * 1024,
  roomTtlMs = 24 * 60 * 60 * 1000,
} = {}) {
  const origins = new Set(allowedOrigins);
  const rooms = new Map();
  const clients = new Map();

  const server = createServer((request, response) => {
    if (request.url === "/healthz") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "ok", rooms: rooms.size, clients: clients.size }));
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });
  const websocketServer = new WebSocketServer({ noServer: true, maxPayload: maxPayloadBytes });

  function participants(room) {
    return [...room.clients.values()].map(({ name }) => name);
  }

  function roomLocks(room) {
    return [...room.locks.entries()].map(([scope, clientId]) => {
      const client = room.clients.get(clientId);
      return client ? { scope, ownerId: client.id, name: client.name } : null;
    }).filter(Boolean);
  }

  function viewers(room) {
    return [...room.clients.values()].map(({ id, name, view }) => ({ id, name, view }));
  }

  function roomMetadata(room) {
    return {
      roomCode: room.code,
      hostName: room.hostName,
      lastUpdatedBy: room.lastUpdatedBy,
      lastUpdatedAt: room.lastUpdatedAt,
      activityLog: room.activityLog,
    };
  }

  function addRoomActivity(room, action, name, timestamp = Date.now()) {
    const entry = { action, name: safeName(name), timestamp };
    room.activityLog.push(entry);
    if (room.activityLog.length > 100) room.activityLog.shift();
    if (action === "edit") {
      room.lastUpdatedBy = entry.name;
      room.lastUpdatedAt = timestamp;
    }
    return entry;
  }

  function presence(room) {
    return {
      type: "presence",
      participants: participants(room),
      viewers: viewers(room),
      locks: roomLocks(room),
      ...roomMetadata(room),
    };
  }

  function totalRoomBytes() {
    let total = 0;
    rooms.forEach((room) => { total += room.sizeBytes; });
    return total;
  }

  function broadcast(room, message, except = null) {
    room.clients.forEach(({ socket }) => {
      if (socket !== except) send(socket, message);
    });
  }

  function detach(socket) {
    const client = clients.get(socket);
    if (!client) return;
    clients.delete(socket);
    const room = rooms.get(client.roomCode);
    if (!room) return;
    room.clients.delete(client.id);
    room.locks.forEach((ownerId, scope) => {
      if (ownerId === client.id) room.locks.delete(scope);
    });
    room.lastActiveAt = Date.now();
    addRoomActivity(room, "left", client.name, room.lastActiveAt);
    if (room.clients.size === 0) room.expiresAt = Date.now() + roomTtlMs;
    broadcast(room, presence(room));
    return room;
  }

  function sendError(socket, message) {
    send(socket, { type: "error", message });
  }

  function joinRoom(socket, roomCode, name, view) {
    const room = rooms.get(roomCode);
    if (!room) {
      sendError(socket, "Room not found. Check the code or create a new room.");
      return;
    }
    if (room.clients.size >= MAX_ROOM_PARTICIPANTS) {
      sendError(socket, "This room is full.");
      return;
    }
    const id = randomUUID();
    const client = { id, name: safeName(name), view: safeView(view), roomCode, socket, messageTimes: [] };
    clients.set(socket, client);
    room.clients.set(id, client);
    room.lastActiveAt = Date.now();
    room.expiresAt = null;
    addRoomActivity(room, "joined", client.name, room.lastActiveAt);
    send(socket, {
      type: "roomState",
      roomCode,
      participantId: id,
      revision: room.revision,
      snapshot: room.snapshot,
      assets: room.assets,
      projectName: room.projectName,
      participants: participants(room),
      viewers: viewers(room),
      locks: roomLocks(room),
      ...roomMetadata(room),
    });
    broadcast(room, presence(room), socket);
  }

  function validateDocument(socket, snapshot, assets) {
    if (!isRecord(snapshot) || !isValidAssets(assets)) {
      sendError(socket, "The shared project data is invalid.");
      return false;
    }
    if (measureRoom(snapshot, assets) > MAX_ROOM_BYTES) {
      sendError(socket, "This project is too large to share in a room (20 MB maximum).");
      return false;
    }
    return true;
  }

  function handleMessage(socket, raw) {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      sendError(socket, "Could not read the collaboration message.");
      return;
    }
    if (!isRecord(message) || typeof message.type !== "string") {
      sendError(socket, "The collaboration message is invalid.");
      return;
    }

    if (message.type === "create") {
      if (clients.has(socket)) {
        sendError(socket, "Leave the current room before creating another.");
        return;
      }
      if (rooms.size >= MAX_ROOMS) {
        sendError(socket, "The collaboration server is at capacity.");
        return;
      }
      const assets = message.assets ?? [];
      if (!validateDocument(socket, message.snapshot, assets)) return;
      const sizeBytes = measureRoom(message.snapshot, assets);
      if (totalRoomBytes() + sizeBytes > MAX_TOTAL_ROOM_BYTES) {
        sendError(socket, "The collaboration server has reached its shared-project storage limit.");
        return;
      }
      let roomCode;
      do {
        roomCode = randomBytes(ROOM_CODE_BYTES).toString("hex").toUpperCase();
      } while (rooms.has(roomCode));
      const room = {
        code: roomCode,
        snapshot: message.snapshot,
        assets,
        sizeBytes,
        projectName: safeProjectName(message.projectName),
        revision: 1,
        hostName: safeName(message.name),
        lastUpdatedBy: "",
        lastUpdatedAt: null,
        activityLog: [],
        clients: new Map(),
        locks: new Map(),
        lastActiveAt: Date.now(),
        expiresAt: null,
      };
      addRoomActivity(room, "created", room.hostName, room.lastActiveAt);
      rooms.set(roomCode, room);
      const id = randomUUID();
      const client = {
        id,
        name: safeName(message.name),
        view: safeView(message.view),
        roomCode,
        socket,
        messageTimes: [],
      };
      clients.set(socket, client);
      room.clients.set(id, client);
      send(socket, {
        type: "roomCreated",
        roomCode,
        participantId: id,
        revision: room.revision,
        participants: participants(room),
        viewers: viewers(room),
        locks: roomLocks(room),
        ...roomMetadata(room),
      });
      return;
    }

    if (message.type === "join") {
      if (clients.has(socket)) {
        sendError(socket, "This connection is already in a room.");
        return;
      }
      if (typeof message.roomCode !== "string" || !/^[0-9A-F]{20}$/.test(message.roomCode)) {
        sendError(socket, "Enter a valid room code.");
        return;
      }
      joinRoom(socket, message.roomCode, message.name, message.view);
      return;
    }

    const client = clients.get(socket);
    if (!client) {
      sendError(socket, "Create or join a room first.");
      return;
    }
    const now = Date.now();
    client.messageTimes = client.messageTimes.filter((timestamp) => now - timestamp < 1000);
    if (client.messageTimes.length >= MAX_MESSAGES_PER_SECOND) {
      sendError(socket, "Too many updates. Please slow down.");
      return;
    }
    client.messageTimes.push(now);

    const room = rooms.get(client.roomCode);
    if (!room) {
      sendError(socket, "This room has expired.");
      return;
    }
    if (message.type === "update" || message.type === "updateAssets") {
      sendError(socket, "Lock a workspace and push its changes to update the shared project.");
      return;
    }
    if (message.type === "lockWorkspace") {
      if (typeof message.scope !== "string" || !validWorkspaceScope(message.scope)) {
        sendError(socket, "The workspace lock is invalid.");
        return;
      }
      const conflict = [...room.locks.entries()].find(([scope, ownerId]) =>
        ownerId !== client.id && workspaceScopesConflict(scope, message.scope));
      const ownedScope = [...room.locks.entries()].find(([, ownerId]) => ownerId === client.id)?.[0];
      if (conflict || (ownedScope && ownedScope !== message.scope)) {
        const owner = conflict && room.clients.get(conflict[1]);
        send(socket, {
          type: "workspaceLockDenied",
          scope: message.scope,
          owner: owner?.name || "another collaborator",
          reason: ownedScope && ownedScope !== message.scope
            ? "Push or discard your current workspace before editing another."
            : "This workspace is being edited by another collaborator.",
          locks: roomLocks(room),
        });
        return;
      }
      room.locks.set(message.scope, client.id);
      send(socket, { type: "workspaceLockGranted", scope: message.scope, locks: roomLocks(room) });
      broadcast(room, presence(room), socket);
      return;
    }
    if (message.type === "unlockWorkspace") {
      if (typeof message.scope === "string" && room.locks.get(message.scope) === client.id) {
        room.locks.delete(message.scope);
        broadcast(room, presence(room));
      }
      return;
    }
    if (message.type === "pushWorkspace") {
      if (typeof message.scope !== "string" || !validWorkspaceScope(message.scope) ||
        room.locks.get(message.scope) !== client.id) {
        sendError(socket, "Lock this workspace before pushing its changes.");
        return;
      }
      const incomingAssets = message.assets === undefined ? room.assets : message.assets;
      if (!validateDocument(socket, message.snapshot, incomingAssets)) return;
      const assets = mergeWorkspaceAssets(room.assets, incomingAssets);
      const snapshot = mergeWorkspaceSnapshot(room.snapshot, message.snapshot, message.scope);
      if (!snapshot) {
        sendError(socket, "The selected workspace no longer exists in the project.");
        return;
      }
      const sizeBytes = measureRoom(snapshot, assets);
      if (totalRoomBytes() - room.sizeBytes + sizeBytes > MAX_TOTAL_ROOM_BYTES) {
        sendError(socket, "The collaboration server has reached its shared-project storage limit.");
        return;
      }
      room.snapshot = snapshot;
      room.assets = assets;
      room.sizeBytes = sizeBytes;
      room.revision += 1;
      client.lastAcceptedRevision = room.revision;
      room.lastActiveAt = now;
      addRoomActivity(room, "edit", client.name, now);
      room.locks.delete(message.scope);
      send(socket, {
        type: "workspacePushAck",
        scope: message.scope,
        revision: room.revision,
        updateId: message.updateId,
        snapshot: room.snapshot,
        assets: room.assets,
        locks: roomLocks(room),
        ...roomMetadata(room),
      });
      broadcast(room, {
        type: "snapshot",
        revision: room.revision,
        snapshot: room.snapshot,
        assets: room.assets,
        sender: client.name,
        scope: message.scope,
        ...roomMetadata(room),
      }, socket);
      broadcast(room, presence(room), socket);
      return;
    }
    if (message.type === "view") {
      if (!COLLABORATION_VIEWS.has(message.view)) {
        sendError(socket, "The collaboration view is invalid.");
        return;
      }
      client.view = message.view;
      room.lastActiveAt = now;
      broadcast(room, presence(room), socket);
      return;
    }
    if (message.type === "transport") {
      if (message.action === "play") {
        if (!["arrangement", "sequencer", "piano-roll"].includes(message.mode) ||
          !Number.isInteger(message.startAtMs) ||
          message.startAtMs < now ||
          message.startAtMs > now + 10_000) {
          sendError(socket, "The synchronized playback request is invalid or expired.");
          return;
        }
      } else if (message.action !== "stop") {
        sendError(socket, "The synchronized playback request is invalid.");
        return;
      }
      room.lastActiveAt = now;
      broadcast(room, {
        type: "transport",
        action: message.action,
        mode: message.mode,
        startAtMs: message.startAtMs,
        sender: client.name,
      }, socket);
      return;
    }
    if (message.type === "leave") {
      const room = detach(socket);
      send(socket, { type: "left", ...(room ? roomMetadata(room) : {}) });
      return;
    }
    sendError(socket, "Unknown collaboration message.");
  }

  server.on("upgrade", (request, socket, head) => {
    const origin = request.headers.origin;
    if (request.url !== COLLABORATION_PATH || !origins.has(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });
  websocketServer.on("connection", (socket) => {
    socket.on("message", (raw) => handleMessage(socket, raw));
    socket.on("close", () => detach(socket));
    socket.on("error", () => detach(socket));
  });

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, code) => {
      if (!room.clients.size && room.expiresAt !== null && room.expiresAt <= now) rooms.delete(code);
    });
  }, Math.min(roomTtlMs, 60 * 60 * 1000));
  cleanupTimer.unref();

  return {
    server,
    rooms,
    async close() {
      clearInterval(cleanupTimer);
      websocketServer.clients.forEach((socket) => socket.close());
      await new Promise((resolve) => server.close(resolve));
      websocketServer.close();
    },
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const allowedOrigins = (process.env.DANSBPM_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!allowedOrigins.length) {
    console.error("Set DANSBPM_ALLOWED_ORIGINS to the exact origin(s) serving the app.");
    process.exitCode = 1;
  } else {
    const { server } = createCollaborationServer({ allowedOrigins });
    const port = Number(process.env.PORT) || 8787;
    server.listen(port, "0.0.0.0", () => {
      console.log(`DansBPM collaboration server listening on port ${port}`);
    });
  }
}
