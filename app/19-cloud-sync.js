  let cloudProjectRefreshInProgress = false;
  let cloudProjectRefreshFailed = false;

  function getCloudToken() {
    try {
      return window.sessionStorage.getItem(CLOUD_TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }

  function getCloudApiBaseUrl() {
    try {
      const saved = window.localStorage.getItem(COLLABORATION_URL_KEY) || DEFAULT_COLLABORATION_SERVER_URL;
      const url = new URL(saved);
      if (url.protocol === "wss:") url.protocol = "https:";
      else if (url.protocol === "ws:") url.protocol = "http:";
      else if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("The cloud server URL is invalid.");
      }
      return `${url.origin}/api`;
    } catch {
      return "https://bpmcollab.onrender.com/api";
    }
  }

  async function cloudRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getCloudToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
    const response = await fetch(`${getCloudApiBaseUrl()}${path}`, { ...options, headers });
    let payload = null;
    if (response.headers.get("content-type")?.includes("application/json")) {
      payload = await response.json();
    }
    if (!response.ok) {
      const error = new Error(payload?.error || `Cloud request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return { response, payload };
  }

  function saveCloudProjectCatalog(accountId, cloudProjects) {
    const savedCatalog = JSON.parse(window.localStorage.getItem(PROJECTS_KEY) || "null");
    const projects = Array.isArray(savedCatalog?.projects) ? savedCatalog.projects : [];
    const merged = [];
    const accountProjectIndexes = new Map();
    projects.forEach((project) => {
      if (project.ownerId === accountId && project.cloudBacked === true) return;
      if (project.ownerId === accountId) {
        const existingIndex = accountProjectIndexes.get(project.id);
        if (existingIndex !== undefined) {
          merged[existingIndex] = { ...merged[existingIndex], ...project };
          return;
        }
        accountProjectIndexes.set(project.id, merged.length);
      }
      merged.push(project);
    });
    const seenRemoteIds = new Set();
    cloudProjects.forEach((remote) => {
      if (typeof remote?.id !== "string" || typeof remote.name !== "string" ||
          seenRemoteIds.has(remote.id)) return;
      seenRemoteIds.add(remote.id);
      const existingIndex = accountProjectIndexes.get(remote.id);
      const existing = existingIndex === undefined
        ? projects.find((project) => project.id === remote.id && project.ownerId === accountId)
        : merged[existingIndex];
      const inMemoryExisting = state.currentUser === accountId
        ? state.projects.find((project) => project.id === remote.id && project.ownerId === accountId)
        : null;
      const cloudProject = {
        ...existing,
        ...remote,
        ownerId: accountId,
        cloudBacked: true,
        cloudHasFile: remote.hasFile === true,
        cloudRevision: Number.isSafeInteger(remote.revision) ? remote.revision : 0,
        localCloudRevision: inMemoryExisting
          ? Number.isSafeInteger(inMemoryExisting.localCloudRevision)
            ? inMemoryExisting.localCloudRevision
            : null
          : Number.isSafeInteger(existing?.localCloudRevision)
            ? existing.localCloudRevision
            : null,
        localDirty: existing?.localDirty === true || inMemoryExisting?.localDirty === true,
        localSnapshotStorage: inMemoryExisting
          ? inMemoryExisting.localSnapshotStorage || null
          : existing?.localSnapshotStorage || null,
        updatedAt: Number.isFinite(remote.updatedAt) && remote.updatedAt > 0
          ? remote.updatedAt
          : existing?.updatedAt || 0,
      };
      if (existingIndex === undefined) {
        accountProjectIndexes.set(remote.id, merged.length);
        merged.push(cloudProject);
      } else {
        merged[existingIndex] = cloudProject;
      }
    });
    const writeCatalog = () => window.localStorage.setItem(PROJECTS_KEY, JSON.stringify({
      ...savedCatalog,
      projects: merged,
    }));
    try {
      writeCatalog();
    } catch (error) {
      if (error?.name !== "QuotaExceededError") throw error;
      const remoteById = new Map(cloudProjects.map((project) => [project.id, project]));
      let catalogSaved = false;
      for (const project of merged.filter((item) =>
        item.ownerId === accountId && item.cloudBacked && item.cloudHasFile)) {
        const remote = remoteById.get(project.id);
        const inMemoryProject = state.projects.find((item) =>
          item.id === project.id && item.ownerId === accountId);
        const persistedProject = projects.find((item) =>
          item.id === project.id && item.ownerId === accountId);
        const previousRevision = inMemoryProject?.cloudRevision ??
          persistedProject?.cloudRevision ?? 0;
        const remoteIsNewer = Number.isSafeInteger(remote?.revision) &&
          remote.revision > previousRevision;
        if ((project.localDirty === true || inMemoryProject?.localDirty === true) && !remoteIsNewer) continue;

        const snapshotKey = getProjectStorageKey(project.id);
        window.localStorage.removeItem(snapshotKey);
        window.localStorage.removeItem(`${snapshotKey}:dj`);
        if (project.localSnapshotStorage === "indexedDB") {
          void deleteCachedProjectSnapshot(project.id).catch((deleteError) => {
            showToast(`Could not remove the outdated IndexedDB cache: ${deleteError.message || "browser storage is unavailable"}`);
          });
        }
        project.localCloudRevision = null;
        project.localSnapshotStorage = null;
        if (remoteIsNewer) project.localDirty = false;
        try {
          writeCatalog();
          catalogSaved = true;
          break;
        } catch (retryError) {
          if (retryError?.name !== "QuotaExceededError") throw retryError;
        }
      }
      if (!catalogSaved) throw error;
      updateStorageIndicator();
    }
    if (state.currentUser === accountId) {
      state.projects = merged;
      const activeProject = merged.find((project) => project.id === state.projectId);
      if (activeProject) {
        state.projectName = activeProject.name;
        updateProjectNameLabel();
      }
      renderProjectList();
    }
  }

  async function registerCloudAccount(name, password) {
    const { payload } = await cloudRequest("/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    await activateCloudAccount(payload);
  }

  async function loginCloudAccount(name, password) {
    const { payload } = await cloudRequest("/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    await activateCloudAccount(payload);
  }

  async function updateCloudAccountName(name, currentPassword) {
    const { payload } = await cloudRequest("/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, currentPassword }),
    });
    return payload.account;
  }

  async function updateCloudAccountPassword(currentPassword, password) {
    await cloudRequest("/account/password", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, password }),
    });
  }

  async function removeCloudAccount(password) {
    await cloudRequest("/account", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const accountId = state.currentUser;
    const accountProjects = state.projects.filter((project) => project.ownerId === accountId);
    const cleanupErrors = [];
    for (const project of accountProjects) {
      const storageKey = getProjectStorageKey(project.id);
      for (const cleanup of [
        () => window.localStorage.removeItem(storageKey),
        () => window.localStorage.removeItem(`${storageKey}:dj`),
        () => deleteCachedProjectSnapshot(project.id),
        () => replaceProjectRecordingAssets(project.id, []),
      ]) {
        try {
          await cleanup();
        } catch (error) {
          cleanupErrors.push(error.message || "browser storage is unavailable");
        }
      }
    }
    state.projects = state.projects.filter((project) => project.ownerId !== accountId);
    state.users = state.users.filter((user) => user.id !== accountId);
    for (const cleanup of [
      () => saveUsers(),
      () => writeProjectCatalog(),
      () => window.sessionStorage.removeItem(CLOUD_TOKEN_KEY),
      () => window.sessionStorage.removeItem(ACTIVE_USER_KEY),
      () => window.sessionStorage.removeItem(OPEN_PROJECTS_KEY),
    ]) {
      try {
        await cleanup();
      } catch (error) {
        cleanupErrors.push(error.message || "browser storage is unavailable");
      }
    }
    $("#account-dialog").close();
    showToast(cleanupErrors.length
      ? `Cloud account deleted, but some browser cache cleanup failed: ${cleanupErrors[0]}`
      : "Cloud account and projects deleted");
    window.setTimeout(() => window.location.reload(), 2000);
  }

  function bindCloudAccountSettings() {
    $("#account-button").hidden = !getCloudToken();
    $("#account-button").addEventListener("click", () => {
      if (!getCloudToken()) {
        showToast("Sign in to a cloud account to manage account settings.");
        return;
      }
      $("#account-new-username").value = getCurrentUserName();
      $("#project-dialog").close();
      $("#account-dialog").showModal();
    });
    $("#account-dialog-close").addEventListener("click", () => $("#account-dialog").close());
    $("#account-username-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const account = await updateCloudAccountName(
          $("#account-new-username").value,
          $("#account-username-password").value,
        );
        state.users = state.users.map((user) =>
          user.id === state.currentUser ? { ...user, name: account.name } : user);
        $("#active-user-label").textContent = account.name;
        $("#account-new-username").value = account.name;
        $("#account-username-password").value = "";
        renderProjectList();
        try {
          saveUsers();
        } catch (error) {
          showToast(`Username updated in the cloud, but could not save it in this browser: ${error.message || "browser storage is unavailable"}`);
          return;
        }
        showToast("Username updated");
      } catch (error) {
        showToast(`Could not update username: ${error.message || "the cloud server is unavailable"}`);
      } finally {
        button.disabled = false;
      }
    });
    $("#account-password-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      if ($("#account-new-password").value !== $("#account-confirm-password").value) {
        showToast("The new passwords do not match.");
        return;
      }
      button.disabled = true;
      try {
        await updateCloudAccountPassword(
          $("#account-current-password").value,
          $("#account-new-password").value,
        );
        $("#account-current-password").value = "";
        $("#account-new-password").value = "";
        $("#account-confirm-password").value = "";
        showToast("Password updated");
      } catch (error) {
        showToast(`Could not update password: ${error.message || "the cloud server is unavailable"}`);
      } finally {
        button.disabled = false;
      }
    });
    $("#account-delete-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if ($("#account-delete-confirmation").value.trim() !== getCurrentUserName()) {
        showToast("Type your username exactly to confirm account deletion.");
        return;
      }
      if (!window.confirm("Permanently delete this cloud account and all its cloud projects?")) return;
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await removeCloudAccount($("#account-delete-password").value);
      } catch (error) {
        showToast(`Could not delete the cloud account: ${error.message || "the cloud server is unavailable"}`);
      } finally {
        button.disabled = false;
      }
    });
  }

  async function activateCloudAccount(session) {
    const { account, token, projects } = session;
    const user = { id: account.id, name: account.name, cloudAccount: true };
    state.users = [...state.users.filter((item) => item.id !== user.id), user];
    saveUsers();
    window.sessionStorage.setItem(CLOUD_TOKEN_KEY, token);
    window.sessionStorage.setItem(ACTIVE_USER_KEY, user.id);
    window.sessionStorage.setItem(OPEN_PROJECTS_KEY, "true");
    saveCloudProjectCatalog(user.id, projects);
    window.location.reload();
  }

  async function refreshCloudProjectCatalog(includeLocalCacheCheck = false) {
    if (!state.currentUser || !getCloudToken()) return;
    if (cloudProjectRefreshInProgress) return;
    cloudProjectRefreshInProgress = true;
    const accountId = state.currentUser;
    try {
      const { payload } = await cloudRequest("/projects");
      if (state.currentUser !== accountId || !getCloudToken()) return;
      const previousRevisions = new Map(state.projects
        .filter((project) => project.ownerId === accountId)
        .map((project) => [project.id, project.cloudRevision || 0]));
      saveCloudProjectCatalog(accountId, payload.projects);
      const remoteIds = new Set(payload.projects.map((project) => project.id));
      for (const project of [...state.projects.filter((item) =>
        item.ownerId === accountId && !remoteIds.has(item.id))]) {
        const created = await createCloudProjectRecord(project);
        saveCloudProjectCatalog(accountId, [
          ...payload.projects,
          created,
        ]);
        remoteIds.add(project.id);
        payload.projects.push(created);
      }

      const activeProject = state.projects.find((project) =>
        project.id === state.projectId && project.ownerId === accountId);
      const remoteActiveProject = payload.projects.find((project) =>
        project.id === state.projectId);
      const remoteRevisionAdvanced = remoteActiveProject &&
        remoteActiveProject.revision > (previousRevisions.get(state.projectId) || 0);
      if (activeProject && (remoteRevisionAdvanced ||
          includeLocalCacheCheck && projectNeedsCloudDownload(activeProject))) {
        await downloadProjectToBrowser(activeProject);
        if (state.isPlaying) stopPlayback();
        stopAllWorkspacePlayers();
        window.location.reload();
      }
    } finally {
      cloudProjectRefreshInProgress = false;
    }
  }

  function startCloudProjectUpdates() {
    const refresh = (includeLocalCacheCheck = false) => {
      void refreshCloudProjectCatalog(includeLocalCacheCheck).then(() => {
        cloudProjectRefreshFailed = false;
      }).catch((error) => {
        if (cloudProjectRefreshFailed) return;
        cloudProjectRefreshFailed = true;
        showToast(`Could not refresh cloud projects: ${error.message || "the cloud server is unavailable"}`);
      });
    };
    refresh(true);
    window.setInterval(() => refresh(), 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh();
    });
  }

  async function createCloudProjectRecord(project) {
    try {
      const { payload } = await cloudRequest("/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: project.id, name: project.name }),
      });
      return payload.project;
    } catch (error) {
      if (error.status !== 409) throw error;
      const { payload } = await cloudRequest("/projects");
      const existing = payload.projects.find((item) => item.id === project.id);
      if (!existing) throw error;
      return existing;
    }
  }

  async function renameCloudProject(project) {
    const { payload } = await cloudRequest(`/projects/${encodeURIComponent(project.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: project.name }),
    });
    return payload.project;
  }

  async function deleteCloudProject(projectId) {
    await cloudRequest(`/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
  }

  async function uploadCloudProject(projectId, projectFile) {
    const { payload } = await cloudRequest(`/projects/${encodeURIComponent(projectId)}/file`, {
      method: "PUT",
      headers: { "content-type": "application/vnd.dansbpm.project+json" },
      body: JSON.stringify(projectFile),
    });
    return payload.project;
  }

  async function downloadCloudProject(projectId) {
    const { response, payload } = await cloudRequest(
      `/projects/${encodeURIComponent(projectId)}/file`,
    );
    return {
      projectFile: payload,
      revision: Number(response.headers.get("x-project-revision")) || 0,
    };
  }

  function endCloudSession() {
    try {
      window.sessionStorage.removeItem(CLOUD_TOKEN_KEY);
    } catch (error) {
      throw new Error(`Could not end the cloud session: ${error.message || "session storage is unavailable"}`);
    }
  }
