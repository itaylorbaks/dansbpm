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

The same service exposes the account API used by the browser's sign-in and cloud-project features. Without PostgreSQL or Google Drive account storage, account records are stored in `DANSBPM_DATA_DIR` (default: `server/.data`); passwords are stored as salted scrypt hashes, never as plaintext or application logs. Project files are gzip-compressed `.bpm` JSON bundles stored separately under each account. The browser requests project metadata at sign-in and downloads a project's file only when that project is opened. Clicking **Save** uploads and replaces the compressed server copy.

If Google Drive account storage is not configured, set `DANSBPM_DATA_DIR` to a mounted persistent disk path on the production host (for example, `/var/data/dansbpm`). Account sessions are signed with a key stored in this directory, so existing sessions continue working after a server restart. The production service must mount that persistent disk at the same path on every instance; otherwise new accounts can disappear after a redeploy or sign-in can fail against another instance. Without persistent storage, accounts, cloud projects, and the session key can be lost when the service is redeployed or its instance is replaced. Back up this directory to preserve accounts and projects.

Alternatively, set `DATABASE_URL` to a PostgreSQL connection string. The service will store account records, its session-signing key, and compressed project files in PostgreSQL; it creates its tables automatically and migrates an existing local file store on first startup when those files are still available. Keep the connection string in the hosting provider's environment settings, not in source control. When `DATABASE_URL` is unset, local development continues to use `DANSBPM_DATA_DIR`.

### Store account data and cloud projects in Google Drive

Set the following environment variables on the server to store account records and project bundles with embedded audio in the supplied Google Drive folder. Users continue signing in with their DansBPM profile; they do not need a Google account or Drive access. The Google account authorized below owns the storage and its quota, and only the server can access the per-user folders.

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` (for the supplied folder, `1PEKCCMpakfO5vp-MmnQFpkgFZKrqzQku`)
- `GOOGLE_DRIVE_REQUIRED=true` (make startup fail rather than silently using server-local account/project storage if Drive credentials are missing)

In Google Cloud Console, create a project, enable the Google Drive API, and configure the OAuth consent screen. Create a **Web application** OAuth client and add this exact authorized redirect URI: `http://127.0.0.1:8788/oauth2callback`. The Google account used in the next step must be able to create folders and files in the supplied parent folder. This is a backend-only connection; do not share the refresh token or commit it to the repository.

From `server/`, run the one-time authorization helper using the OAuth client ID and secret. Enter them at the prompts so they are not saved in shell history:

```sh
read -r -p "Google OAuth client ID: " GOOGLE_DRIVE_CLIENT_ID
read -r -s -p "Google OAuth client secret: " GOOGLE_DRIVE_CLIENT_SECRET
printf '\n'
export GOOGLE_DRIVE_CLIENT_ID GOOGLE_DRIVE_CLIENT_SECRET
npm run drive:oauth
```

If the terminal is remote (for example, in a Codespace), run `npm run drive:oauth -- --manual` instead. After approving access, the browser may show a localhost connection error; copy the full localhost callback URL from its address bar and paste it at the terminal prompt. The helper validates the OAuth state and exchanges the code.

Open the printed authorization URL in the Google account that owns the parent folder and approve access. Copy the resulting refresh token directly into the hosting provider's secret/environment settings, along with the client ID, secret, root folder ID, and `GOOGLE_DRIVE_REQUIRED=true`. Do not put these values in source control or browser configuration. The helper requests the Drive scope because the server must create and manage account folders under a pre-existing parent folder. For external OAuth apps in testing mode, Google may expire refresh tokens after seven days; publish/verify the OAuth app as needed for a persistent production connection.

The server stores the account registry, including usernames, salted scrypt password hashes (never plaintext passwords), and the session-signing key, in a dedicated `DansBPM account data` subfolder with its own `accounts.json` file. This is separate from the per-account project folders and from the sound-library files. The sound catalog uses an explicit file-ID allowlist, so the new account-data folder is not exposed through the sample proxy. Existing local account records are copied to Drive on first startup with this feature enabled.

Each user still gets a separate `DansBPM account <id>` folder for compressed project bundles. Existing local project files migrate to that folder on the account's next sign-in, and deleting an account removes only that user's project folder; it does not remove the shared account-data folder. The browser's existing flow downloads and unpacks a bundle only when needed, then caches the snapshot and audio assets in browser storage. The existing per-project upload request limit is 250 MiB; Drive quota increases total available cloud storage but does not raise this per-project request limit.
