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
