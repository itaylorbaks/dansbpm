import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleDriveStorage } from "./google-drive-storage.js";

test("Google Drive storage refreshes credentials and uses resumable gzip uploads", async () => {
  const calls = [];
  let tokenRequests = 0;
  const fetchImpl = async (input, options = {}) => {
    const url = new URL(input);
    calls.push({ url, options });
    if (url.hostname === "oauth2.googleapis.com") {
      tokenRequests += 1;
      return Response.json({ access_token: "access-token", expires_in: 3600 });
    }
    if (url.pathname === "/drive/v3/files" && options.method !== "POST") {
      return Response.json({ files: [] });
    }
    if (url.pathname === "/drive/v3/files" && options.method === "POST") {
      return Response.json({ id: "account-folder" });
    }
    if (url.pathname === "/upload/drive/v3/files" && options.method === "POST") {
      return new Response(null, { status: 200, headers: { location: "https://upload.example/session/create" } });
    }
    if (url.pathname === "/session/create") return Response.json({ id: "project-file" });
    if (url.pathname === "/drive/v3/files/project-file" && url.searchParams.get("alt") === "media") {
      return new Response(Uint8Array.from([0x1f, 0x8b, 0x08]));
    }
    if (url.pathname === "/upload/drive/v3/files/project-file" && options.method === "PATCH") {
      return new Response(null, { status: 200, headers: { location: "https://upload.example/session/update" } });
    }
    if (url.pathname === "/session/update") return new Response(null, { status: 204 });
    if (url.pathname === "/drive/v3/files/project-file" && options.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected Google API request: ${options.method || "GET"} ${url}`);
  };
  const drive = createGoogleDriveStorage({
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
    rootFolderId: "root-folder",
    fetchImpl,
  });

  const folderId = await drive.createAccountFolder("account-id");
  assert.equal(folderId, "account-folder");
  const fileId = await drive.createProjectFile(folderId, "project.bpm.gz", Buffer.from("compressed"));
  assert.equal(fileId, "project-file");
  assert.deepEqual(await drive.getProjectFile(fileId), Buffer.from([0x1f, 0x8b, 0x08]));
  await drive.updateProjectFile(fileId, Buffer.from("updated"));
  await drive.deleteProjectFile(fileId);

  assert.equal(tokenRequests, 1);
  const upload = calls.find(({ url }) => url.pathname === "/session/create");
  assert.equal(upload.options.method, "PUT");
  assert.equal(upload.options.headers["content-type"], "application/gzip");
  assert.equal(upload.options.headers["content-range"], "bytes 0-9/10");
  const folderRequest = calls.find(({ url, options }) =>
    url.pathname === "/drive/v3/files" && options.method === "POST");
  assert.deepEqual(JSON.parse(folderRequest.options.body), {
    name: "DansBPM account account-id",
    mimeType: "application/vnd.google-apps.folder",
    parents: ["root-folder"],
  });
});

test("Google Drive account data uses a separate folder and JSON file", async () => {
  const files = new Map([["sample-file", {
    id: "sample-file",
    name: "library-sample.wav",
    mimeType: "audio/wav",
    parents: ["root-folder"],
    data: Buffer.from("sample"),
  }]]);
  const sessions = new Map();
  let nextId = 0;
  const fetchImpl = async (input, options = {}) => {
    const url = new URL(input);
    if (url.hostname === "oauth2.googleapis.com") {
      return Response.json({ access_token: "access-token", expires_in: 3600 });
    }
    if (url.hostname === "upload.example") {
      const session = sessions.get(url.pathname);
      const data = Buffer.from(options.body);
      if (session.fileId) {
        files.get(session.fileId).data = data;
        return new Response(null, { status: 204 });
      }
      const id = `file-${++nextId}`;
      files.set(id, { id, ...session.metadata, data });
      return Response.json({ id });
    }
    if (url.pathname === "/drive/v3/files" && options.method === "POST") {
      const id = `folder-${++nextId}`;
      files.set(id, { id, ...JSON.parse(options.body), data: Buffer.alloc(0) });
      return Response.json({ id });
    }
    if (url.pathname === "/drive/v3/files" && !options.method) {
      return Response.json({ files: Array.from(files.values()) });
    }
    const fileId = url.pathname.split("/").at(-1);
    if (url.pathname.startsWith("/upload/drive/v3/files")) {
      const fileIdFromPath = url.pathname.split("/").at(-1);
      const sessionPath = `/session/${++nextId}`;
      sessions.set(sessionPath, {
        fileId: options.method === "PATCH" ? fileIdFromPath : null,
        metadata: options.method === "POST" ? JSON.parse(options.body) : null,
      });
      return new Response(null, { status: 200, headers: { location: `https://upload.example${sessionPath}` } });
    }
    if (url.pathname.startsWith("/drive/v3/files/") && url.searchParams.get("alt") === "media") {
      return new Response(files.get(fileId).data);
    }
    throw new Error(`Unexpected Google API request: ${options.method || "GET"} ${url}`);
  };
  const drive = createGoogleDriveStorage({
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
    rootFolderId: "root-folder",
    fetchImpl,
  });
  const accountData = Buffer.from(JSON.stringify({
    version: 1,
    sessionKey: "a".repeat(64),
    accounts: {},
  }));

  assert.equal(await drive.readAccountStore(), null);
  await drive.writeAccountStore(accountData);
  assert.deepEqual(await drive.readAccountStore(), accountData);
  const updatedData = Buffer.from(JSON.stringify({ version: 1, sessionKey: "b".repeat(64), accounts: {} }));
  await drive.writeAccountStore(updatedData);
  assert.deepEqual(await drive.readAccountStore(), updatedData);

  const accountDataFolder = Array.from(files.values()).find((file) =>
    file.name === "DansBPM account data");
  assert.equal(accountDataFolder.mimeType, "application/vnd.google-apps.folder");
  assert.deepEqual(accountDataFolder.parents, ["root-folder"]);
  const accountDataFile = Array.from(files.values()).find((file) => file.name === "accounts.json");
  assert.equal(accountDataFile.mimeType, "application/json");
  assert.deepEqual(accountDataFile.parents, [accountDataFolder.id]);
  assert.equal(files.get("sample-file").data.toString(), "sample");
  assert.deepEqual(files.get("sample-file").parents, ["root-folder"]);
});

test("Google Drive credentials must be complete when Drive storage is configured", () => {
  assert.throws(() => createGoogleDriveStorage({
    clientId: "client-id",
    clientSecret: "",
    refreshToken: "",
    rootFolderId: "",
  }), /requires client ID, client secret, refresh token, and root folder ID/);
  assert.throws(() => createGoogleDriveStorage({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    rootFolderId: "",
    required: true,
  }), /Google Drive storage is required/);
});
