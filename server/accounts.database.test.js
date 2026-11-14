import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";
import { createCollaborationServer } from "./index.js";

const databaseUrl = process.env.DANSBPM_TEST_DATABASE_URL;

async function openServer(dataDirectory, databaseUrl = "") {
  const app = createCollaborationServer({
    allowedOrigins: ["http://localhost"],
    dataDirectory,
    databaseUrl,
  });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const address = app.server.address();
  return { ...app, httpUrl: `http://127.0.0.1:${address.port}` };
}

test("PostgreSQL migrates local accounts and persists them across server restarts", {
  skip: !databaseUrl,
}, async (t) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), "dansbpm-postgres-test-"));
  const adminPool = new Pool({ connectionString: databaseUrl });
  const schemaName = `dansbpm_test_${randomUUID().replaceAll("-", "")}`;
  await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
  const scopedDatabaseUrl = new URL(databaseUrl);
  scopedDatabaseUrl.searchParams.set("options", `-c search_path=${schemaName}`);
  let app = await openServer(dataDirectory);
  let token = "";
  const request = (path, options = {}) => fetch(`${app.httpUrl}${path}`, {
    ...options,
    headers: {
      origin: "http://localhost",
      ...(options.headers || {}),
    },
  });
  t.after(async () => {
    if (token) {
      try {
        await request("/api/account", {
          method: "DELETE",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ password: "correct horse battery" }),
        });
      } catch {
        // The database-backed test can still clean up its temporary files if the server failed.
      }
    }
    await app.close();
    await rm(dataDirectory, { recursive: true, force: true });
    await adminPool.query(`DROP SCHEMA "${schemaName}" CASCADE`);
    await adminPool.end();
  });

  const registration = await request("/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `Database test ${randomUUID()}`,
      password: "correct horse battery",
    }),
  });
  assert.equal(registration.status, 201);
  const registered = await registration.json();
  token = registered.token;
  const accountId = registered.account.id;
  const createProject = (id, name) => request("/api/projects", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id, name }),
  });

  assert.equal((await (await createProject("postgres-project-1", "New Proj 1")).json()).project.name, "New Proj 1");
  const projectFile = {
    app: "DansBPM",
    format: "dansbpm-project",
    version: 1,
    project: { name: "Postgres project", snapshot: { bpm: 120 } },
    assets: [],
  };
  assert.equal((await request(`/api/projects/postgres-project-1/file`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/vnd.dansbpm.project+json",
    },
    body: JSON.stringify(projectFile),
  })).status, 200);

  await app.close();
  app = await openServer(dataDirectory, scopedDatabaseUrl.toString());
  const login = await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: registered.account.name,
      password: "correct horse battery",
    }),
  });
  assert.equal(login.status, 200);
  const loggedIn = await login.json();
  token = loggedIn.token;
  assert.equal(loggedIn.account.id, accountId);
  assert.deepEqual(await (await request("/api/projects/postgres-project-1/file", {
    headers: { authorization: `Bearer ${token}` },
  })).json(), projectFile);

  assert.equal((await (await createProject("postgres-project-2", "New Proj 2")).json()).project.name, "New Proj 2");
  assert.equal((await request("/api/projects/postgres-project-2", {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  })).status, 200);
  await app.close();
  app = await openServer(dataDirectory, scopedDatabaseUrl.toString());
  const restartedLogin = await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: registered.account.name,
      password: "correct horse battery",
    }),
  });
  const restartedSession = await restartedLogin.json();
  token = restartedSession.token;
  const nextProject = await createProject("postgres-project-3", "New Proj 2");
  assert.equal((await nextProject.json()).project.name, "New Proj 3");
});
