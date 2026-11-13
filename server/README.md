# DansBPM collaboration server

The browser app is static, so rooms connect to this separately hosted Node.js WebSocket service. Rooms are opt-in and are identified by an unguessable code. Anyone with the code can edit the room; do not share it publicly.

## Run

Requires Node.js 20 or newer.

```sh
cd server
npm install
DANSBPM_ALLOWED_ORIGINS=https://your-dansbpm-site.example npm start
```

Set `PORT` if the host requires a specific port. The origin must match the browser app's exact scheme and host, with no path (for example `https://your-dansbpm-site.example`). Put the service behind TLS and configure the app with its `wss://` URL. The server exposes `/healthz` for a basic health check.

Configure the WebSocket server URL in DansBPM's **Collaborate** dialog. Use `ws://localhost:8787` for local development; production deployments should use `wss://`.

Rooms sync project edits, attached audio, participant presence, and play/stop transport. Each participant must enable audio in their browser. A room is limited to 12 participants and 20 MB; the server caps all in-memory rooms at 100 MB. Rooms remain available for up to 24 hours after the last participant leaves, but a server restart clears all rooms. Room updates use last-write-wins snapshots; if two people edit at the same time, the later update can replace the earlier one. Cloud account permissions apply to stored account projects, not to collaboration rooms.

## Cloud profiles and projects

The same service exposes the account API used by the browser's sign-in and cloud-project features. Account records are stored in `DANSBPM_DATA_DIR` (default: `server/.data`); project files are gzip-compressed `.bpm` JSON bundles stored separately under each account. The browser requests project metadata at sign-in and downloads a project's file only when that project is opened. Clicking **Save** uploads and replaces the compressed server copy.

Set `DANSBPM_DATA_DIR` to a mounted persistent disk path on the production host (for example, `/var/data/dansbpm`). Without persistent storage, accounts and cloud projects can be lost when the service is redeployed or its instance is replaced. Back up this directory to preserve accounts and projects.
