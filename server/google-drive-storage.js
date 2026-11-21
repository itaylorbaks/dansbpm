const DRIVE_API_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const ACCOUNT_DATA_FOLDER_NAME = "DansBPM account data";
const ACCOUNT_DATA_FILE_NAME = "accounts.json";

function escapeQueryValue(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function responseError(response, service) {
  let message = "";
  try {
    const payload = await response.json();
    message = payload.error?.message || payload.error_description || "";
  } catch {
    message = "";
  }
  return new Error(`${service} request failed (${response.status})${message ? `: ${message}` : "."}`);
}

export function createGoogleDriveStorage({
  clientId = process.env.GOOGLE_DRIVE_CLIENT_ID,
  clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  required = process.env.GOOGLE_DRIVE_REQUIRED === "true",
  fetchImpl = fetch,
} = {}) {
  const credentials = [clientId, clientSecret, refreshToken, rootFolderId];
  if (credentials.every((value) => !value)) {
    if (required) throw new Error("Google Drive storage is required but its credentials are not configured.");
    return null;
  }
  if (credentials.some((value) => !value)) {
    throw new Error("Google Drive storage requires client ID, client secret, refresh token, and root folder ID.");
  }

  let accessToken = "";
  let accessTokenExpiresAt = 0;
  let tokenRequest = null;

  async function getAccessToken() {
    if (accessToken && Date.now() < accessTokenExpiresAt - 60_000) return accessToken;
    if (!tokenRequest) {
      tokenRequest = (async () => {
        const response = await fetchImpl(TOKEN_URL, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });
        if (!response.ok) throw await responseError(response, "Google OAuth");
        const payload = await response.json();
        if (typeof payload.access_token !== "string" ||
          !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
          throw new Error("Google OAuth returned an invalid access token.");
        }
        accessToken = payload.access_token;
        accessTokenExpiresAt = Date.now() + payload.expires_in * 1000;
        return accessToken;
      })().finally(() => { tokenRequest = null; });
    }
    return tokenRequest;
  }

  async function driveRequest(url, options = {}) {
    let token = await getAccessToken();
    let response = await fetchImpl(url, {
      ...options,
      headers: { ...(options.headers || {}), authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      accessToken = "";
      accessTokenExpiresAt = 0;
      token = await getAccessToken();
      response = await fetchImpl(url, {
        ...options,
        headers: { ...(options.headers || {}), authorization: `Bearer ${token}` },
      });
    }
    if (!response.ok) throw await responseError(response, "Google Drive");
    return response;
  }

  async function listFiles(query) {
    const files = [];
    let pageToken = "";
    do {
      const url = new URL(`${DRIVE_API_URL}/files`);
      url.searchParams.set("q", query);
      url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType)");
      url.searchParams.set("pageSize", "1000");
      url.searchParams.set("supportsAllDrives", "true");
      url.searchParams.set("includeItemsFromAllDrives", "true");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const response = await driveRequest(url);
      const payload = await response.json();
      if (Array.isArray(payload.files)) files.push(...payload.files);
      pageToken = payload.nextPageToken || "";
    } while (pageToken);
    return files;
  }

  async function uploadMedia(url, metadata, data, contentType = "application/gzip") {
    const sessionUrl = new URL(url);
    sessionUrl.searchParams.set("uploadType", "resumable");
    sessionUrl.searchParams.set("fields", "id");
    const start = await driveRequest(sessionUrl, {
      method: metadata ? "POST" : "PATCH",
      headers: metadata ? { "content-type": "application/json" } : {},
      ...(metadata ? { body: JSON.stringify(metadata) } : {}),
    });
    const uploadUrl = start.headers.get("location");
    if (!uploadUrl) throw new Error("Google Drive did not return a resumable upload URL.");
    const upload = await driveRequest(uploadUrl, {
      method: "PUT",
      headers: {
        "content-type": contentType,
        "content-length": String(data.length),
        "content-range": `bytes 0-${data.length - 1}/${data.length}`,
      },
      body: data,
    });
    if (upload.status === 308) throw new Error("Google Drive did not finish the project upload.");
    return upload.status === 204 ? null : upload.json();
  }

  async function findFolder(parentId, name) {
    const query = `'${escapeQueryValue(parentId)}' in parents and name = '${escapeQueryValue(name)}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;
    const existing = (await listFiles(query)).find((file) => file.name === name);
    return existing?.id || null;
  }

  async function createFolder(parentId, name) {
    const response = await driveRequest(`${DRIVE_API_URL}/files?supportsAllDrives=true&fields=id`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME_TYPE, parents: [parentId] }),
    });
    const folder = await response.json();
    if (typeof folder.id !== "string" || !folder.id) {
      throw new Error("Google Drive did not return the folder ID.");
    }
    return folder.id;
  }

  async function findOrCreateFolder(parentId, name) {
    return await findFolder(parentId, name) || await createFolder(parentId, name);
  }

  async function createAccountFolder(accountId) {
    const name = `DansBPM account ${accountId}`;
    return findOrCreateFolder(rootFolderId, name);
  }

  async function findAccountDataFolder() {
    return findFolder(rootFolderId, ACCOUNT_DATA_FOLDER_NAME);
  }

  async function getAccountDataFile(folderId) {
    const query = `'${escapeQueryValue(folderId)}' in parents and name = '${ACCOUNT_DATA_FILE_NAME}' and mimeType = 'application/json' and trashed = false`;
    return (await listFiles(query)).find((file) => file.name === ACCOUNT_DATA_FILE_NAME) || null;
  }

  async function readAccountStore() {
    const folderId = await findAccountDataFolder();
    if (!folderId) return null;
    const file = await getAccountDataFile(folderId);
    if (!file) return null;
    const response = await driveRequest(
      `${DRIVE_API_URL}/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`,
    );
    return Buffer.from(await response.arrayBuffer());
  }

  async function writeAccountStore(data) {
    const folderId = await findOrCreateFolder(rootFolderId, ACCOUNT_DATA_FOLDER_NAME);
    const file = await getAccountDataFile(folderId);
    if (file) {
      await uploadMedia(
        `${DRIVE_UPLOAD_URL}/files/${encodeURIComponent(file.id)}?supportsAllDrives=true`,
        null,
        data,
        "application/json",
      );
      return;
    }
    const response = await uploadMedia(
      `${DRIVE_UPLOAD_URL}/files?supportsAllDrives=true`,
      { name: ACCOUNT_DATA_FILE_NAME, mimeType: "application/json", parents: [folderId] },
      data,
      "application/json",
    );
    if (typeof response?.id !== "string" || !response.id) {
      throw new Error("Google Drive did not return the account store file ID.");
    }
  }

  async function createProjectFile(folderId, fileName, data) {
    const response = await uploadMedia(`${DRIVE_UPLOAD_URL}/files?supportsAllDrives=true`, {
      name: fileName,
      mimeType: "application/gzip",
      parents: [folderId],
    }, data);
    if (typeof response?.id !== "string" || !response.id) {
      throw new Error("Google Drive did not return the project file ID.");
    }
    return response.id;
  }

  async function updateProjectFile(fileId, data) {
    await uploadMedia(`${DRIVE_UPLOAD_URL}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, null, data);
  }

  async function deleteFolderContents(folderId) {
    const children = await listFiles(`'${escapeQueryValue(folderId)}' in parents and trashed = false`);
    for (const child of children) {
      if (child.mimeType === FOLDER_MIME_TYPE) await deleteFolderContents(child.id);
      await driveRequest(`${DRIVE_API_URL}/files/${encodeURIComponent(child.id)}?supportsAllDrives=true`, {
        method: "DELETE",
      });
    }
  }

  return {
    createAccountFolder,
    readAccountStore,
    writeAccountStore,
    createProjectFile,
    async getProjectFile(fileId) {
      const response = await driveRequest(
        `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
      );
      return Buffer.from(await response.arrayBuffer());
    },
    updateProjectFile,
    async deleteProjectFile(fileId) {
      await driveRequest(`${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
        method: "DELETE",
      });
    },
    async deleteAccountFolder(folderId) {
      await deleteFolderContents(folderId);
      await driveRequest(`${DRIVE_API_URL}/files/${encodeURIComponent(folderId)}?supportsAllDrives=true`, {
        method: "DELETE",
      });
    },
  };
}
