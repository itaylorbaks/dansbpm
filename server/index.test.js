import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { WebSocket } from "ws";
import { createCollaborationServer } from "./index.js";

async function openServer() {
  const app = createCollaborationServer({ allowedOrigins: ["http://localhost"] });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const address = app.server.address();
  return {
    ...app,
    url: `ws://127.0.0.1:${address.port}/collaboration`,
  };
}

function connect(url) {
  const socket = new WebSocket(url, { origin: "http://localhost" });
  return once(socket, "open").then(() => socket);
}

function nextJson(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for WebSocket message")), 2000);
    socket.once("message", (data) => {
      clearTimeout(timeout);
      resolve(JSON.parse(data.toString()));
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

test("room creation, joining, and snapshot broadcasts work", async (t) => {
  const app = await openServer();
  t.after(() => app.close());
  const creator = await connect(app.url);
  const joined = await connect(app.url);
  t.after(() => {
    creator.close();
    joined.close();
  });

  const snapshot = { bpm: 128, patterns: [] };
  const createdMessage = nextJson(creator);
  creator.send(JSON.stringify({ type: "create", name: "Ada", projectName: "Shared song", snapshot, assets: [] }));
  const created = await createdMessage;
  assert.equal(created.type, "roomCreated");
  assert.match(created.roomCode, /^[0-9A-F]{20}$/);
  assert.equal(created.hostName, "Ada");
  assert.deepEqual(created.activityLog.map(({ action, name }) => [action, name]), [["created", "Ada"]]);

  const joinedMessage = nextJson(joined);
  joined.send(JSON.stringify({
    type: "join",
    roomCode: created.roomCode,
    name: "Grace",
    view: "piano-roll",
  }));
  const roomState = await joinedMessage;
  assert.equal(roomState.type, "roomState");
  assert.deepEqual(roomState.snapshot, snapshot);
  assert.equal(roomState.projectName, "Shared song");
  assert.equal(roomState.hostName, "Ada");
  assert.deepEqual(roomState.activityLog.map(({ action, name }) => [action, name]), [
    ["created", "Ada"],
    ["joined", "Grace"],
  ]);
  assert.deepEqual(roomState.participants, ["Ada", "Grace"]);
  assert.deepEqual(roomState.viewers.map(({ name, view }) => [name, view]), [
    ["Ada", "arrangement"],
    ["Grace", "piano-roll"],
  ]);
  const presence = await nextJson(creator);
  assert.deepEqual(presence.participants, ["Ada", "Grace"]);
  const viewUpdate = nextJson(creator);
  joined.send(JSON.stringify({ type: "view", view: "sequencer" }));
  assert.equal((await viewUpdate).viewers[1].view, "sequencer");

  const synchronizedPlay = nextJson(joined);
  creator.send(JSON.stringify({
    type: "transport",
    action: "play",
    mode: "arrangement",
    startAtMs: Date.now() + 1000,
  }));
  assert.equal((await synchronizedPlay).type, "transport");

  const creatorPresenceAfterLeave = nextJson(creator);
  const leaveAcknowledgement = nextJson(joined);
  joined.send(JSON.stringify({ type: "leave" }));
  const [presenceAfterLeave, left] = await Promise.all([creatorPresenceAfterLeave, leaveAcknowledgement]);
  assert.equal(left.type, "left");
  assert.equal(left.activityLog.at(-1).action, "left");
  assert.equal(left.activityLog.at(-1).name, "Grace");
  assert.ok(Number.isFinite(left.activityLog.at(-1).timestamp));
  assert.deepEqual(presenceAfterLeave.activityLog, left.activityLog);
});

test("connections from unlisted origins are rejected", async (t) => {
  const app = await openServer();
  t.after(() => app.close());
  const socket = new WebSocket(app.url, { origin: "https://not-allowed.example" });
  await assert.rejects(once(socket, "open"));
});

test("legacy whole-project updates cannot bypass workspace locks", async (t) => {
  const app = await openServer();
  t.after(() => app.close());
  const creator = await connect(app.url);
  const joined = await connect(app.url);
  t.after(() => {
    creator.close();
    joined.close();
  });

  const createdMessage = nextJson(creator);
  creator.send(JSON.stringify({
    type: "create",
    name: "Ada",
    snapshot: { bpm: 128, patterns: [] },
    assets: [],
  }));
  const created = await createdMessage;
  const joinedMessage = nextJson(joined);
  joined.send(JSON.stringify({ type: "join", roomCode: created.roomCode, name: "Grace" }));
  await joinedMessage;
  await nextJson(creator);

  const joinedError = nextJson(joined);
  joined.send(JSON.stringify({
    type: "update",
    baseRevision: 1,
    snapshot: { bpm: 132, patterns: [] },
  }));
  assert.equal((await joinedError).type, "error");
  assert.equal(app.rooms.get(created.roomCode).snapshot.bpm, 128);
  assert.deepEqual(app.rooms.get(created.roomCode).assets, []);
});

test("workspace locks are exclusive and pushes merge only the locked workspace", async (t) => {
  const app = await openServer();
  t.after(() => app.close());
  const creator = await connect(app.url);
  const joined = await connect(app.url);
  t.after(() => {
    creator.close();
    joined.close();
  });

  const pattern = (name, steps) => ({
    id: "pattern-a",
    name,
    steps,
    trackIds: ["drum-track"],
    cells: {},
    volume: 0.8,
  });
  const snapshot = {
    bpm: 128,
    patterns: [pattern("Pattern A", 16)],
    tracks: [{ id: "drum-track", name: "Original kit", volume: 0.6, effects: ["reverb"] }],
    arrangementTracks: [],
    patternClips: [],
    mels: [],
    melTracks: [],
    masterTrack: { volume: 1 },
    effectTracks: [],
    dj: { crossfader: 50 },
  };
  const createdMessage = nextJson(creator);
  creator.send(JSON.stringify({ type: "create", name: "Ada", snapshot, assets: [] }));
  const created = await createdMessage;
  const joinedMessage = nextJson(joined);
  joined.send(JSON.stringify({ type: "join", roomCode: created.roomCode, name: "Grace" }));
  await joinedMessage;
  await nextJson(creator);

  const unreservedPush = nextJson(joined);
  joined.send(JSON.stringify({
    type: "pushWorkspace",
    scope: "pattern:pattern-a",
    snapshot,
    assets: [],
  }));
  assert.equal((await unreservedPush).type, "error");
  assert.equal(app.rooms.get(created.roomCode).revision, 1);

  const creatorLockPresence = nextJson(creator);
  const graceLock = nextJson(joined);
  joined.send(JSON.stringify({ type: "lockWorkspace", scope: "pattern:pattern-a" }));
  assert.equal((await graceLock).type, "workspaceLockGranted");
  assert.equal((await creatorLockPresence).locks[0].name, "Grace");

  const denied = nextJson(creator);
  creator.send(JSON.stringify({ type: "lockWorkspace", scope: "pattern:pattern-a" }));
  assert.equal((await denied).type, "workspaceLockDenied");

  const creatorSnapshot = nextJson(creator);
  const graceAck = nextJson(joined);
  const incoming = {
    ...snapshot,
    bpm: 150,
    patterns: [pattern("Renamed pattern", 32)],
    tracks: [{ id: "drum-track", name: "Updated kit", volume: 0.2, effects: ["delay"] }],
    dj: { crossfader: 20 },
  };
  joined.send(JSON.stringify({
    type: "pushWorkspace",
    scope: "pattern:pattern-a",
    snapshot: incoming,
    assets: [],
  }));
  const ack = await graceAck;
  assert.equal(ack.type, "workspacePushAck");
  assert.equal(ack.revision, 2);
  assert.equal((await creatorSnapshot).type, "snapshot");
  assert.equal(app.rooms.get(created.roomCode).snapshot.patterns[0].name, "Renamed pattern");
  assert.equal(app.rooms.get(created.roomCode).snapshot.patterns[0].volume, 0.8);
  assert.equal(app.rooms.get(created.roomCode).snapshot.tracks[0].name, "Updated kit");
  assert.equal(app.rooms.get(created.roomCode).snapshot.tracks[0].volume, 0.6);
  assert.deepEqual(app.rooms.get(created.roomCode).snapshot.tracks[0].effects, ["reverb"]);
  assert.equal(app.rooms.get(created.roomCode).snapshot.bpm, 128);
  assert.deepEqual(app.rooms.get(created.roomCode).snapshot.dj, { crossfader: 50 });
  assert.deepEqual(app.rooms.get(created.roomCode).locks, new Map());
});

test("track-view pushes include referenced pattern and Mel dependencies", async (t) => {
  const app = await openServer();
  t.after(() => app.close());
  const creator = await connect(app.url);
  t.after(() => creator.close());
  const initial = {
    bpm: 124,
    tracks: [],
    patterns: [{ id: "pattern-a", name: "Pattern A", steps: 16, trackIds: [], cells: {} }],
    arrangementTracks: [],
    patternClips: [],
    mels: [],
    melTracks: [],
  };
  const createdMessage = nextJson(creator);
  creator.send(JSON.stringify({ type: "create", name: "Ada", snapshot: initial, assets: [] }));
  const created = await createdMessage;
  const lockMessage = nextJson(creator);
  creator.send(JSON.stringify({ type: "lockWorkspace", scope: "track-view" }));
  assert.equal((await lockMessage).type, "workspaceLockGranted");

  const pushed = nextJson(creator);
  creator.send(JSON.stringify({
    type: "pushWorkspace",
    scope: "track-view",
    assets: [],
    snapshot: {
      ...initial,
      tracks: [{ id: "drum-b", name: "New drum dependency", volume: 0.4 }],
      patterns: [
        initial.patterns[0],
        { id: "pattern-b", name: "Pattern B", steps: 16, trackIds: ["drum-b"], cells: {} },
      ],
      patternClips: [{ id: "clip-pattern", patternId: "pattern-b", trackId: "pattern-b" }],
      mels: [{ id: "mel-a", name: "Mel A", notes: [{ id: "note-a", pitch: 60 }] }],
      melTracks: [{
        id: "mel-lane",
        volume: 0.7,
        clips: [{ id: "clip-mel", melId: "mel-a" }],
      }],
    },
  }));
  assert.equal((await pushed).type, "workspacePushAck");
  const shared = app.rooms.get(created.roomCode).snapshot;
  assert.equal(shared.patterns.find(({ id }) => id === "pattern-b").name, "Pattern B");
  assert.equal(shared.tracks.find(({ id }) => id === "drum-b").name, "New drum dependency");
  assert.equal(shared.mels.find(({ id }) => id === "mel-a").name, "Mel A");
});
