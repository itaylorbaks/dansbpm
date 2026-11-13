import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { join } from "node:path";

const scryptAsync = promisify(scrypt);
const gzipAsync = promisify(gzip);
const MAX_PROJECT_BYTES = 250 * 1024 * 1024;
const MAX_JSON_BYTES = 16 * 1024;

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(value));
}

function safeProfileName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 32);
}

function normalizeProfileName(value) {
  return safeProfileName(value).normalize("NFKC").toLocaleLowerCase("en-US");
}

function safeProjectName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 64);
}

function isProjectId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    let tooLarge = false;
    request.on("data", (chunk) => {
      if (tooLarge) return;
      length += chunk.length;
      if (length > limit) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => tooLarge
      ? reject(Object.assign(new Error("Request body is too large."), { status: 413 }))
      : resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function readJsonBody(request) {
  const value = JSON.parse((await readBody(request, MAX_JSON_BYTES)).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error("The request body is invalid."), { status: 400 });
  }
  return value;
}

async function writeAtomically(path, data) {
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, data, { mode: 0o600 });
  await rename(temporaryPath, path);
}

function publicAccount(account) {
  return { id: account.id, name: account.name };
}

async function passwordMatches(account, password) {
  if (typeof password !== "string") return false;
  const suppliedHash = (await scryptAsync(password, account.salt, 64)).toString("hex");
  return timingSafeEqual(Buffer.from(suppliedHash, "hex"), Buffer.from(account.passwordHash, "hex"));
}

function publicProject(project) {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    revision: project.revision,
    hasFile: project.hasFile,
  };
}

export function createAccountApi({ allowedOrigins = [], dataDirectory } = {}) {
  const origins = new Set(allowedOrigins);
  const accountsPath = join(dataDirectory, "accounts.json");
  const sessionKeyPath = join(dataDirectory, "session.key");
  let accounts = {};
  let sessionKey;
  let ready;
  let persistQueue = Promise.resolve();

  async function loadSessionKey() {
    try {
      sessionKey = await readFile(sessionKeyPath);
      if (sessionKey.length !== 32) {
        throw new Error("The cloud session key is invalid.");
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const generatedKey = randomBytes(32);
      try {
        await writeFile(sessionKeyPath, generatedKey, { flag: "wx", mode: 0o600 });
        sessionKey = generatedKey;
      } catch (writeError) {
        if (writeError.code !== "EEXIST") throw writeError;
        sessionKey = await readFile(sessionKeyPath);
        if (sessionKey.length !== 32) {
          throw new Error("The cloud session key is invalid.");
        }
      }
    }
  }

  async function loadAccounts() {
    if (!ready) {
      ready = (async () => {
        await mkdir(dataDirectory, { recursive: true });
        await loadSessionKey();
        try {
          const saved = JSON.parse(await readFile(accountsPath, "utf8"));
          if (saved && typeof saved === "object" && !Array.isArray(saved)) {
            accounts = saved;
            Object.values(accounts).forEach((account) => {
              if (account && typeof account.name === "string") {
                account.normalizedName = normalizeProfileName(account.name);
              }
            });
          }
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      })();
    }
    await ready;
  }

  async function persistAccounts() {
    const snapshot = JSON.stringify(accounts);
    const write = persistQueue.then(() => writeAtomically(accountsPath, snapshot));
    persistQueue = write.catch(() => {});
    await write;
  }

  function projectFilePath(accountId, projectId) {
    return join(dataDirectory, "projects", accountId, `${projectId}.bpm.gz`);
  }

  function createSessionToken(accountId) {
    const nonce = randomBytes(32).toString("hex");
    const value = `${accountId}.${nonce}`;
    const signature = createHmac("sha256", sessionKey).update(value).digest("hex");
    return `${value}.${signature}`;
  }

  function authenticate(request) {
    const match = /^Bearer ([0-9a-f-]{36})\.([A-Fa-f0-9]{64})\.([A-Fa-f0-9]{64})$/i
      .exec(request.headers.authorization || "");
    if (!match) return null;
    const account = accounts[match[1]];
    if (!account) return null;
    const value = `${match[1]}.${match[2]}`;
    const expected = createHmac("sha256", sessionKey).update(value).digest();
    const supplied = Buffer.from(match[3], "hex");
    return timingSafeEqual(expected, supplied) ? account : null;
  }

  async function handle(request, response) {
    const url = new URL(request.url, "http://localhost");
    if (!url.pathname.startsWith("/api/")) return false;

    const origin = request.headers.origin;
    if (origin && !origins.has(origin)) {
      sendJson(response, 403, { error: "This app origin is not allowed." });
      return true;
    }
    if (origin) {
      response.setHeader("access-control-allow-origin", origin);
      response.setHeader("vary", "Origin");
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "access-control-allow-headers": "authorization, content-type",
        "access-control-max-age": "600",
      });
      response.end();
      return true;
    }

    try {
      await loadAccounts();
      if (request.method === "POST" && url.pathname === "/api/register") {
        const body = await readJsonBody(request);
        const name = safeProfileName(body.name);
        const password = body.password;
        if (!name || typeof password !== "string" || password.length < 8 || password.length > 256) {
          sendJson(response, 400, { error: "Enter a profile name and a password of at least 8 characters." });
          return true;
        }
        const normalizedName = normalizeProfileName(name);
        if (Object.values(accounts).some((account) => account.normalizedName === normalizedName)) {
          sendJson(response, 409, { error: "An account with that profile name already exists." });
          return true;
        }
        const id = randomUUID();
        const salt = randomBytes(16).toString("hex");
        const passwordHash = (await scryptAsync(password, salt, 64)).toString("hex");
        if (Object.values(accounts).some((account) => account.normalizedName === normalizedName)) {
          sendJson(response, 409, { error: "An account with that profile name already exists." });
          return true;
        }
        const account = { id, name, normalizedName, salt, passwordHash, projects: [] };
        accounts[id] = account;
        await persistAccounts();
        const token = createSessionToken(id);
        sendJson(response, 201, { account: publicAccount(account), token, projects: [] });
        return true;
      }

      if (request.method === "POST" && url.pathname === "/api/login") {
        const body = await readJsonBody(request);
        const name = safeProfileName(body.name);
        const normalizedName = normalizeProfileName(name);
        const account = Object.values(accounts).find((item) => item.normalizedName === normalizedName);
        if (!account || typeof body.password !== "string") {
          sendJson(response, 401, { error: "Profile name or password is incorrect." });
          return true;
        }
        if (!(await passwordMatches(account, body.password))) {
          sendJson(response, 401, { error: "Profile name or password is incorrect." });
          return true;
        }
        const token = createSessionToken(account.id);
        sendJson(response, 200, {
          account: publicAccount(account),
          token,
          projects: account.projects.map(publicProject),
        });
        return true;
      }

      const account = authenticate(request);
      if (!account) {
        sendJson(response, 401, { error: "Sign in to access cloud projects." });
        return true;
      }

      if (request.method === "PATCH" && url.pathname === "/api/account") {
        const body = await readJsonBody(request);
        const name = safeProfileName(body.name);
        if (!name) {
          sendJson(response, 400, { error: "Enter a valid profile name." });
          return true;
        }
        if (!(await passwordMatches(account, body.currentPassword))) {
          sendJson(response, 401, { error: "The current password is incorrect." });
          return true;
        }
        const normalizedName = normalizeProfileName(name);
        if (Object.values(accounts).some((item) =>
          item.id !== account.id && item.normalizedName === normalizedName)) {
          sendJson(response, 409, { error: "An account with that profile name already exists." });
          return true;
        }
        const previousName = account.name;
        const previousNormalizedName = account.normalizedName;
        account.name = name;
        account.normalizedName = normalizedName;
        try {
          await persistAccounts();
        } catch (error) {
          account.name = previousName;
          account.normalizedName = previousNormalizedName;
          throw error;
        }
        sendJson(response, 200, { account: publicAccount(account) });
        return true;
      }

      if (request.method === "PUT" && url.pathname === "/api/account/password") {
        const body = await readJsonBody(request);
        if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 256) {
          sendJson(response, 400, { error: "Choose a password between 8 and 256 characters." });
          return true;
        }
        if (!(await passwordMatches(account, body.currentPassword))) {
          sendJson(response, 401, { error: "The current password is incorrect." });
          return true;
        }
        const previousSalt = account.salt;
        const previousPasswordHash = account.passwordHash;
        const salt = randomBytes(16).toString("hex");
        const passwordHash = (await scryptAsync(body.password, salt, 64)).toString("hex");
        account.salt = salt;
        account.passwordHash = passwordHash;
        try {
          await persistAccounts();
        } catch (error) {
          account.salt = previousSalt;
          account.passwordHash = previousPasswordHash;
          throw error;
        }
        sendJson(response, 200, { account: publicAccount(account) });
        return true;
      }

      if (request.method === "DELETE" && url.pathname === "/api/account") {
        const body = await readJsonBody(request);
        if (!(await passwordMatches(account, body.password))) {
          sendJson(response, 401, { error: "The password is incorrect." });
          return true;
        }
        const projectDirectory = join(dataDirectory, "projects", account.id);
        const pendingDeleteDirectory = join(
          dataDirectory,
          "projects",
          `.deleting-${account.id}-${randomUUID()}`,
        );
        let projectDirectoryMoved = false;
        try {
          await rename(projectDirectory, pendingDeleteDirectory);
          projectDirectoryMoved = true;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        delete accounts[account.id];
        try {
          await persistAccounts();
        } catch (error) {
          accounts[account.id] = account;
          if (projectDirectoryMoved) await rename(pendingDeleteDirectory, projectDirectory);
          throw error;
        }
        try {
          if (projectDirectoryMoved) {
            await rm(pendingDeleteDirectory, { recursive: true, force: true });
          }
        } catch (error) {
          accounts[account.id] = account;
          await persistAccounts();
          if (projectDirectoryMoved) await rename(pendingDeleteDirectory, projectDirectory);
          throw error;
        }
        sendJson(response, 200, { deleted: true });
        return true;
      }

      if (request.method === "GET" && url.pathname === "/api/projects") {
        sendJson(response, 200, { projects: account.projects.map(publicProject) });
        return true;
      }

      if (request.method === "POST" && url.pathname === "/api/projects") {
        const body = await readJsonBody(request);
        const id = body.id;
        const name = safeProjectName(body.name);
        if (!isProjectId(id) || !name) {
          sendJson(response, 400, { error: "The project details are invalid." });
          return true;
        }
        if (account.projects.some((project) => project.id === id)) {
          sendJson(response, 409, { error: "That project already exists." });
          return true;
        }
        const project = { id, name, updatedAt: 0, revision: 0, hasFile: false };
        account.projects.unshift(project);
        await persistAccounts();
        sendJson(response, 201, { project: publicProject(project) });
        return true;
      }

      const projectMatch = /^\/api\/projects\/([^/]+)(?:\/(file))?$/.exec(url.pathname);
      if (projectMatch) {
        const projectId = decodeURIComponent(projectMatch[1]);
        const project = account.projects.find((item) => item.id === projectId);
        if (!isProjectId(projectId) || !project) {
          sendJson(response, 404, { error: "Cloud project not found." });
          return true;
        }
        if (projectMatch[2] === "file" && request.method === "GET") {
          if (!project.hasFile) {
            sendJson(response, 404, { error: "This project has not been saved to the cloud yet." });
            return true;
          }
          const compressed = await readFile(projectFilePath(account.id, project.id));
          response.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "content-encoding": "gzip",
            "cache-control": "no-store",
            "x-project-revision": String(project.revision),
            "x-project-name": encodeURIComponent(project.name),
            "access-control-expose-headers": "x-project-revision",
          });
          response.end(compressed);
          return true;
        }
        if (projectMatch[2] === "file" && request.method === "PUT") {
          const body = await readBody(request, MAX_PROJECT_BYTES);
          let document;
          try {
            document = JSON.parse(body.toString("utf8"));
          } catch {
            sendJson(response, 400, { error: "The BPM project file is invalid." });
            return true;
          }
          if (document?.app !== "DansBPM" || document.format !== "dansbpm-project" ||
            document.version !== 1 || !document.project?.snapshot || !Array.isArray(document.assets)) {
            sendJson(response, 400, { error: "The BPM project file is not supported." });
            return true;
          }
          const compressed = await gzipAsync(body);
          const path = projectFilePath(account.id, project.id);
          await mkdir(join(dataDirectory, "projects", account.id), { recursive: true });
          await writeAtomically(path, compressed);
          project.name = safeProjectName(document.project.name) || project.name;
          project.updatedAt = Date.now();
          project.revision += 1;
          project.hasFile = true;
          await persistAccounts();
          sendJson(response, 200, { project: publicProject(project) });
          return true;
        }
        if (!projectMatch[2] && request.method === "PATCH") {
          const body = await readJsonBody(request);
          const name = safeProjectName(body.name);
          if (!name) {
            sendJson(response, 400, { error: "Enter a valid project name." });
            return true;
          }
          project.name = name;
          await persistAccounts();
          sendJson(response, 200, { project: publicProject(project) });
          return true;
        }
        if (!projectMatch[2] && request.method === "DELETE") {
          account.projects = account.projects.filter((item) => item.id !== project.id);
          await persistAccounts();
          await rm(projectFilePath(account.id, project.id), { force: true });
          sendJson(response, 200, { deleted: true });
          return true;
        }
      }

      sendJson(response, 404, { error: "Cloud API route not found." });
      return true;
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: "The request body is invalid." });
      } else {
        sendJson(response, error.status || 500, {
          error: error.status ? error.message : "The cloud request could not be completed.",
        });
      }
      return true;
    }
  }

  return { handle };
}
