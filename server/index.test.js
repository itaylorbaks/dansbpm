import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { WebSocket } from "ws";
import { createCollaborationServer } from "./index.js";

async function openServer({ dataDirectory } = {}) {
  const app = createCollaborationServer({ allowedOrigins: ["http://localhost"], dataDirectory });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const address = app.server.address();
  return {
    ...app,
    url: `ws://127.0.0.1:${address.port}/collaboration`,
    httpUrl: `http://127.0.0.1:${address.port}`,
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

test("accounts authenticate and persist compressed project files", async (t) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), "dansbpm-cloud-test-"));
  let app = await openServer({ dataDirectory });
  t.after(async () => {
    await app.close();
    await rm(dataDirectory, { recursive: true, force: true });
  });
  const request = (path, options = {}) => fetch(`${app.httpUrl}${path}`, {
    ...options,
    headers: {
      origin: "http://localhost",
      ...(options.headers || {}),
    },
  });

  const registration = await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ada", password: "correct horse battery" }),
  });
  assert.equal(registration.status, 201);
  const account = await registration.json();
  assert.equal(account.account.name, "Ada");

  const duplicateRegistration = await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "aDA", password: "another strong password" }),
  });
  assert.equal(duplicateRegistration.status, 409);

  const concurrentRegistrations = await Promise.all(["Race", "race"].map((name) =>
    request("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, password: "another strong password" }),
    })));
  assert.deepEqual(
    concurrentRegistrations.map((response) => response.status).sort(),
    [201, 409],
  );

  const projectId = "cloud-project-1";
  const project = await request("/api/projects", {
    method: "POST",
    headers: {
      authorization: `Bearer ${account.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: projectId, name: "Cloud song" }),
  });
  assert.equal(project.status, 201);

  const bpmFile = {
    app: "DansBPM",
    format: "dansbpm-project",
    version: 1,
    project: {
      name: "Cloud song",
      snapshot: {
        bpm: 128,
        tracks: [{ id: "drum-track", kind: "sample", cells: [true, false] }],
        patterns: [{
          id: "pattern-a",
          name: "Pattern A",
          steps: 16,
          trackIds: ["drum-track"],
          cells: { "drum-track": [true, false] },
        }],
        patternClips: [{ id: "pattern-clip", patternId: "pattern-a", startBar: 0 }],
        arrangementTracks: [{ id: "audio-track", name: "Audio track" }],
        mels: [{ id: "mel-a", name: "Mel A", notes: [{ id: "note-a", midi: 60 }] }],
        melTracks: [{ id: "mel-track", clips: [{ id: "mel-clip", melId: "mel-a" }] }],
        dj: {
          liveSlots: [{ sourceKey: "pattern:pattern-a", name: "Pattern A" }],
          decks: {
            A: { sourceKey: "pattern:pattern-a", loop: { startBar: 0, endBar: 4 } },
            B: { sourceKey: "mel:mel-a", loop: null },
          },
        },
      },
    },
    assets: [{
      metadata: { trackId: "audio-track", name: "recording.wav" },
      dataUrl: "data:audio/wav;base64,AA==",
    }],
  };
  const saved = await request(`/api/projects/${projectId}/file`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${account.token}`,
      "content-type": "application/vnd.dansbpm.project+json",
    },
    body: JSON.stringify(bpmFile),
  });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).project.revision, 1);
  const initialDownload = await request(`/api/projects/${projectId}/file`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  assert.equal(initialDownload.status, 200);
  assert.deepEqual(await initialDownload.json(), bpmFile);

  const compressedPath = join(dataDirectory, "projects", account.account.id, `${projectId}.bpm.gz`);
  const compressed = await readFile(compressedPath);
  assert.deepEqual(JSON.parse(gunzipSync(compressed).toString("utf8")), bpmFile);

  const updatedFile = {
    ...bpmFile,
    project: {
      ...bpmFile.project,
      snapshot: { ...bpmFile.project.snapshot, bpm: 136 },
    },
  };
  const updated = await request(`/api/projects/${projectId}/file`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${account.token}`,
      "content-type": "application/vnd.dansbpm.project+json",
    },
    body: JSON.stringify(updatedFile),
  });
  assert.equal((await updated.json()).project.revision, 2);
  assert.deepEqual(
    JSON.parse(gunzipSync(await readFile(compressedPath)).toString("utf8")),
    updatedFile,
  );
  const updatedDownload = await request(`/api/projects/${projectId}/file`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  assert.deepEqual(await updatedDownload.json(), updatedFile);

  const secondRegistration = await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Grace", password: "another strong password" }),
  });
  const secondAccount = await secondRegistration.json();
  const otherAccountProjects = await request("/api/projects", {
    headers: { authorization: `Bearer ${secondAccount.token}` },
  });
  assert.deepEqual((await otherAccountProjects.json()).projects, []);
  const inaccessibleProject = await request(`/api/projects/${projectId}/file`, {
    headers: { authorization: `Bearer ${secondAccount.token}` },
  });
  assert.equal(inaccessibleProject.status, 404);

  const wrongPassword = await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ada", password: "not the password" }),
  });
  assert.equal(wrongPassword.status, 401);

  await app.close();
  app = await openServer({ dataDirectory });
  const survivingSession = await request("/api/projects", {
    headers: { authorization: `Bearer ${account.token}` },
  });
  assert.equal(survivingSession.status, 200);
  const savedAfterRestart = await request(`/api/projects/${projectId}/file`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${account.token}`,
      "content-type": "application/vnd.dansbpm.project+json",
    },
    body: JSON.stringify(updatedFile),
  });
  assert.equal(savedAfterRestart.status, 200);
  assert.equal((await savedAfterRestart.json()).project.revision, 3);

  const login = await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "ada", password: "correct horse battery" }),
  });
  assert.equal(login.status, 200);
  const session = await login.json();
  assert.equal(session.projects[0].hasFile, true);
  assert.equal(session.projects[0].revision, 3);
  const downloaded = await request(`/api/projects/${projectId}/file`, {
    headers: { authorization: `Bearer ${session.token}` },
  });
  assert.equal(downloaded.status, 200);
  assert.deepEqual(await downloaded.json(), updatedFile);
});

test("cloud accounts can change credentials and be deleted with their projects", async (t) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), "dansbpm-account-test-"));
  const app = await openServer({ dataDirectory });
  t.after(async () => {
    await app.close();
    await rm(dataDirectory, { recursive: true, force: true });
  });
  const request = (path, options = {}) => fetch(`${app.httpUrl}${path}`, {
    ...options,
    headers: {
      origin: "http://localhost",
      ...(options.headers || {}),
    },
  });
  const register = await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ada", password: "correct horse battery" }),
  });
  const originalSession = await register.json();
  const headers = {
    authorization: `Bearer ${originalSession.token}`,
    "content-type": "application/json",
  };
  const projectId = "account-project";
  assert.equal((await request("/api/projects", {
    method: "POST",
    headers,
    body: JSON.stringify({ id: projectId, name: "Account project" }),
  })).status, 201);
  assert.equal((await request(`/api/projects/${projectId}/file`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      app: "DansBPM",
      format: "dansbpm-project",
      version: 1,
      project: { name: "Account project", snapshot: { bpm: 120 } },
      assets: [],
    }),
  })).status, 200);
  assert.equal((await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Grace", password: "another strong password" }),
  })).status, 201);

  assert.equal((await request("/api/account", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name: "Ada Lovelace", currentPassword: "wrong password" }),
  })).status, 401);
  const renamed = await request("/api/account", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name: "Ada Lovelace", currentPassword: "correct horse battery" }),
  });
  assert.equal((await renamed.json()).account.name, "Ada Lovelace");
  assert.equal((await request("/api/account", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name: "Grace", currentPassword: "correct horse battery" }),
  })).status, 409);

  assert.equal((await request("/api/account/password", {
    method: "PUT",
    headers,
    body: JSON.stringify({
      currentPassword: "correct horse battery",
      password: "a different strong password",
    }),
  })).status, 200);
  assert.equal((await request("/api/account/password", {
    method: "PUT",
    headers,
    body: JSON.stringify({
      currentPassword: "incorrect password",
      password: "another different password",
    }),
  })).status, 401);
  assert.equal((await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "ada lovelace", password: "correct horse battery" }),
  })).status, 401);
  const newLogin = await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "ada lovelace", password: "a different strong password" }),
  });
  assert.equal(newLogin.status, 200);
  const newSession = await newLogin.json();
  const newHeaders = {
    authorization: `Bearer ${newSession.token}`,
    "content-type": "application/json",
  };

  assert.equal((await request("/api/account", {
    method: "DELETE",
    headers: newHeaders,
    body: JSON.stringify({ password: "incorrect password" }),
  })).status, 401);
  assert.equal((await request("/api/account", {
    method: "DELETE",
    headers: newHeaders,
    body: JSON.stringify({ password: "a different strong password" }),
  })).status, 200);
  const compressedPath = join(dataDirectory, "projects", originalSession.account.id, `${projectId}.bpm.gz`);
  await assert.rejects(readFile(compressedPath), { code: "ENOENT" });
  assert.equal((await request("/api/projects", {
    headers: { authorization: `Bearer ${newSession.token}` },
  })).status, 401);
  assert.equal((await request("/api/projects", {
    headers: { authorization: `Bearer ${originalSession.token}` },
  })).status, 401);
  assert.equal((await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ada Lovelace", password: "new account password" }),
  })).status, 201);
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
