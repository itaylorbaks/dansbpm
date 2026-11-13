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
      const cloudProject = {
        ...existing,
        ...remote,
        ownerId: accountId,
        cloudBacked: true,
        cloudHasFile: remote.hasFile === true,
        cloudRevision: Number.isSafeInteger(remote.revision) ? remote.revision : 0,
        localCloudRevision: Number.isSafeInteger(existing?.localCloudRevision)
          ? existing.localCloudRevision
          : null,
        localDirty: existing?.localDirty === true,
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
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify({
      ...savedCatalog,
      projects: merged,
    }));
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

  async function refreshCloudProjectCatalog() {
    if (!state.currentUser || !getCloudToken()) return;
    const { payload } = await cloudRequest("/projects");
    saveCloudProjectCatalog(state.currentUser, payload.projects);
    const remoteIds = new Set(payload.projects.map((project) => project.id));
    for (const project of [...state.projects.filter((item) =>
      item.ownerId === state.currentUser && !remoteIds.has(item.id))]) {
      const created = await createCloudProjectRecord(project);
      saveCloudProjectCatalog(state.currentUser, [
        ...payload.projects,
        created,
      ]);
      remoteIds.add(project.id);
      payload.projects.push(created);
    }
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
