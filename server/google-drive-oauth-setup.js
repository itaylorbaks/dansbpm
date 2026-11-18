import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createInterface } from "node:readline/promises";

const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const redirectUri = "http://127.0.0.1:8788/oauth2callback";
const scope = "https://www.googleapis.com/auth/drive";
const manualCallback = process.argv.includes("--manual");

if (!clientId || !clientSecret) {
  throw new Error("Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET before running this setup.");
}

const state = randomBytes(24).toString("hex");
const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authorizationUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope,
  access_type: "offline",
  prompt: "consent",
  state,
}).toString();

let code;
if (manualCallback) {
  console.log(`Open this URL in the Google account that owns the DansBPM Drive folder:\n${authorizationUrl}`);
  console.log("After granting access, the browser may show a localhost connection error; this is expected in a remote terminal.");
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  let callbackUrl;
  try {
    callbackUrl = new URL(await prompt.question("Paste the full localhost callback URL from the browser address bar: "));
  } finally {
    prompt.close();
  }
  if (callbackUrl.origin !== new URL(redirectUri).origin ||
    callbackUrl.pathname !== "/oauth2callback" ||
    callbackUrl.searchParams.get("state") !== state ||
    !callbackUrl.searchParams.get("code")) {
    throw new Error(callbackUrl.searchParams.get("error") || "The OAuth callback URL was invalid.");
  }
  code = callbackUrl.searchParams.get("code");
} else {
  const server = createServer();
  server.listen(8788, "127.0.0.1");
  await once(server, "listening");
  console.log(`Open this URL in the Google account that owns the DansBPM Drive folder:\n${authorizationUrl}`);
  console.log("After granting access, this script will print a refresh token. Keep it secret.");
  const [request, response] = await once(server, "request");
  const callbackUrl = new URL(request.url, redirectUri);
  code = callbackUrl.searchParams.get("code");
  if (callbackUrl.pathname !== "/oauth2callback" ||
    callbackUrl.searchParams.get("state") !== state || !code) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Google authorization failed. Close this tab and retry the setup.");
    server.close();
    throw new Error(callbackUrl.searchParams.get("error") || "The OAuth callback was invalid.");
  }
  response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  response.end("Google Drive is connected. You can close this tab and return to the terminal.");
  server.close();
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }),
});
if (!tokenResponse.ok) {
  throw new Error(`Google token exchange failed (${tokenResponse.status}): ${await tokenResponse.text()}`);
}
const tokens = await tokenResponse.json();
if (typeof tokens.refresh_token !== "string" || !tokens.refresh_token) {
  throw new Error("Google did not return a refresh token. Revoke the app's access in your Google account and retry.");
}

console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
