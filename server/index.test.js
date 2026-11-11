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
  joined.send(JSON.stringify({ type: "join", roomCode: created.roomCode, name: "Grace" }));
  const roomState = await joinedMessage;
  assert.equal(roomState.type, "roomState");
  assert.deepEqual(roomState.snapshot, snapshot);
  assert.equal(roomState.projectName, "Shared song");
  assert.deepEqual(roomState.participants, ["Ada", "Grace"]);
  const presence = await nextJson(creator);
  assert.deepEqual(presence.participants, ["Ada", "Grace"]);

  const creatorUpdate = nextJson(creator);
  const acknowledgement = nextJson(joined);
  joined.send(JSON.stringify({ type: "update", snapshot: { bpm: 132, patterns: [] } }));
  assert.equal((await creatorUpdate).snapshot.bpm, 132);
  assert.equal((await acknowledgement).revision, 2);

  const creatorAssets = nextJson(creator);
  const assetAcknowledgement = nextJson(joined);
  joined.send(JSON.stringify({
    type: "updateAssets",
    snapshot: { bpm: 132, patterns: [] },
    assets: [{ metadata: { trackId: "sample-1" }, dataUrl: "data:audio/wav;base64,AA==" }],
    updateId: 7,
  }));
  const sharedAssets = await creatorAssets;
  assert.equal(sharedAssets.type, "roomState");
  assert.equal(sharedAssets.assets.length, 1);
  assert.equal((await assetAcknowledgement).updateId, 7);

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
