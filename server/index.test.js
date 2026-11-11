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

  const creatorUpdate = nextJson(creator);
  const acknowledgement = nextJson(joined);
  joined.send(JSON.stringify({ type: "update", baseRevision: 1, snapshot: { bpm: 132, patterns: [] } }));
  assert.equal((await creatorUpdate).snapshot.bpm, 132);
  assert.equal((await acknowledgement).revision, 2);

  const creatorAssets = nextJson(creator);
  const assetAcknowledgement = nextJson(joined);
  joined.send(JSON.stringify({
    type: "updateAssets",
    baseRevision: 1,
    snapshot: { bpm: 132, patterns: [] },
    assets: [{ metadata: { trackId: "sample-1" }, dataUrl: "data:audio/wav;base64,AA==" }],
    updateId: 7,
  }));
  const sharedAssets = await creatorAssets;
  assert.equal(sharedAssets.type, "roomState");
  assert.equal(sharedAssets.assets.length, 1);
  const assetAck = await assetAcknowledgement;
  assert.equal(assetAck.updateId, 7);
  assert.equal(assetAck.revision, 3);

  const creatorFollowup = nextJson(creator);
  const followupAck = nextJson(joined);
  joined.send(JSON.stringify({
    type: "update",
    baseRevision: 3,
    snapshot: { bpm: 140, patterns: [] },
    updateId: 8,
  }));
  assert.equal((await followupAck).revision, 4);
  assert.equal((await creatorFollowup).snapshot.bpm, 140);
  assert.equal(app.rooms.get(created.roomCode).snapshot.bpm, 140);

  const synchronizedPlay = nextJson(joined);
  creator.send(JSON.stringify({
    type: "transport",
    action: "play",
    mode: "arrangement",
    startAtMs: Date.now() + 1000,
  }));
  assert.equal((await synchronizedPlay).type, "transport");
});

test("connections from unlisted origins are rejected", async (t) => {
  const app = await openServer();
  t.after(() => app.close());
  const socket = new WebSocket(app.url, { origin: "https://not-allowed.example" });
  await assert.rejects(once(socket, "open"));
});

test("stale snapshot and asset updates cannot overwrite a newer room revision", async (t) => {
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

  const creatorBroadcast = nextJson(creator);
  const joinedAck = nextJson(joined);
  joined.send(JSON.stringify({
    type: "update",
    baseRevision: 1,
    snapshot: { bpm: 132, patterns: [] },
    updateId: 1,
  }));
  assert.equal((await joinedAck).revision, 2);
  await creatorBroadcast;

  const snapshotConflict = nextJson(creator);
  creator.send(JSON.stringify({
    type: "update",
    baseRevision: 1,
    snapshot: { bpm: 90, patterns: [] },
    updateId: 2,
  }));
  const conflict = await snapshotConflict;
  assert.equal(conflict.type, "snapshotConflict");
  assert.equal(conflict.revision, 2);
  assert.equal(conflict.sender, "Grace");
  assert.equal(conflict.snapshot.bpm, 132);
  assert.deepEqual(conflict.assets, []);
  assert.equal(app.rooms.get(created.roomCode).snapshot.bpm, 132);

  const assetConflict = nextJson(creator);
  creator.send(JSON.stringify({
    type: "updateAssets",
    baseRevision: 1,
    snapshot: { bpm: 90, patterns: [] },
    assets: [{ metadata: { trackId: "sample-1" }, dataUrl: "data:audio/wav;base64,AA==" }],
    updateId: 3,
  }));
  assert.equal((await assetConflict).type, "snapshotConflict");
  assert.equal(app.rooms.get(created.roomCode).snapshot.bpm, 132);
  assert.deepEqual(app.rooms.get(created.roomCode).assets, []);
});
