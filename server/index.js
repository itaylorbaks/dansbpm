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

function safeName(value) {
  if (typeof value !== "string") return "Guest";
  const name = value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 32);
  return name || "Guest";
}

function safeProjectName(value) {
  if (typeof value !== "string") return "Shared project";
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 64) || "Shared project";
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
    room.lastActiveAt = Date.now();
    if (room.clients.size === 0) room.expiresAt = Date.now() + roomTtlMs;
    broadcast(room, { type: "presence", participants: participants(room) });
  }

  function sendError(socket, message) {
    send(socket, { type: "error", message });
  }

  function joinRoom(socket, roomCode, name) {
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
    const client = { id, name: safeName(name), roomCode, socket, messageTimes: [] };
    clients.set(socket, client);
    room.clients.set(id, client);
    room.lastActiveAt = Date.now();
    room.expiresAt = null;
    send(socket, {
      type: "roomState",
      roomCode,
      revision: room.revision,
      snapshot: room.snapshot,
      assets: room.assets,
      projectName: room.projectName,
      participants: participants(room),
    });
    broadcast(room, { type: "presence", participants: participants(room) }, socket);
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
        lastUpdatedBy: safeName(message.name),
        clients: new Map(),
        lastActiveAt: Date.now(),
        expiresAt: null,
      };
      rooms.set(roomCode, room);
      const id = randomUUID();
      const client = { id, name: safeName(message.name), roomCode, socket, messageTimes: [] };
      clients.set(socket, client);
      room.clients.set(id, client);
      send(socket, {
        type: "roomCreated",
        roomCode,
        revision: room.revision,
        participants: participants(room),
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
      joinRoom(socket, message.roomCode, message.name);
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
    if (message.type === "update") {
      if (!validateDocument(socket, message.snapshot, room.assets)) return;
      if (!Number.isInteger(message.baseRevision) ||
        (message.baseRevision !== room.revision && client.lastAcceptedRevision !== room.revision)) {
        send(socket, {
          type: "snapshotConflict",
          revision: room.revision,
          sender: room.lastUpdatedBy,
          updateId: message.updateId,
        });
        return;
      }
      const sizeBytes = measureRoom(message.snapshot, room.assets);
      if (totalRoomBytes() - room.sizeBytes + sizeBytes > MAX_TOTAL_ROOM_BYTES) {
        sendError(socket, "The collaboration server has reached its shared-project storage limit.");
        return;
      }
      room.snapshot = message.snapshot;
      room.sizeBytes = sizeBytes;
      room.revision += 1;
      client.lastAcceptedRevision = room.revision;
      room.lastUpdatedBy = client.name;
      room.lastActiveAt = now;
      send(socket, { type: "snapshotAck", revision: room.revision, updateId: message.updateId });
      broadcast(room, {
        type: "snapshot",
        revision: room.revision,
        snapshot: room.snapshot,
        sender: client.name,
      }, socket);
      return;
    }
    if (message.type === "updateAssets") {
      if (!validateDocument(socket, message.snapshot, message.assets)) return;
      if (!Number.isInteger(message.baseRevision) ||
        (message.baseRevision !== room.revision && client.lastAcceptedRevision !== room.revision)) {
        send(socket, {
          type: "snapshotConflict",
          revision: room.revision,
          sender: room.lastUpdatedBy,
          updateId: message.updateId,
        });
        return;
      }
      const sizeBytes = measureRoom(message.snapshot, message.assets);
      if (totalRoomBytes() - room.sizeBytes + sizeBytes > MAX_TOTAL_ROOM_BYTES) {
        sendError(socket, "The collaboration server has reached its shared-project storage limit.");
        return;
      }
      room.snapshot = message.snapshot;
      room.assets = message.assets;
      room.sizeBytes = sizeBytes;
      room.revision += 1;
      client.lastAcceptedRevision = room.revision;
      room.lastUpdatedBy = client.name;
      room.lastActiveAt = now;
      send(socket, { type: "snapshotAck", revision: room.revision, updateId: message.updateId });
      broadcast(room, {
        type: "roomState",
        roomCode: room.code,
        revision: room.revision,
        snapshot: room.snapshot,
        assets: room.assets,
        projectName: room.projectName,
        participants: participants(room),
        sender: client.name,
      }, socket);
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
      detach(socket);
      send(socket, { type: "left" });
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
