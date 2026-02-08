/* auth/server.js */
const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();
app.use(cookieParser());

/**
 * ENV REQUIRED:
 * - GITHUB_CLIENT_ID
 * - GITHUB_CLIENT_SECRET
 * - ALLOWED_ORIGIN        e.g. https://beta.psmaxmultisoluciones.com
 *
 * Optional:
 * - PORT                 (Render sets it)
 * - COOKIE_SECURE        "true" (recommended on https) - default true on Render
 */
const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  ALLOWED_ORIGIN,
  PORT = 10000,
  COOKIE_SECURE = "true",
} = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !ALLOWED_ORIGIN) {
  console.error("Missing env vars. Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ALLOWED_ORIGIN");
}

// Helpers
function base64Url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomState() {
  return base64Url(crypto.randomBytes(24));
}
function htmlEscape(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Healthcheck
 */
app.get("/", (req, res) => {
  res.status(200).send("OK - Decap OAuth server is running");
});

/**
 * Decap will open:  {base_url}/{auth_endpoint}
 * Your config.yml uses:
 *   base_url: https://psmax-auth-server.onrender.com
 *   auth_endpoint: auth
 *
 * So this route must be /auth
 */
app.get("/auth", (req, res) => {
  const state = randomState();

  // Store state in cookie to validate in /callback
  res.cookie("decap_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE !== "false",
    maxAge: 10 * 60 * 1000, // 10 min
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: "https://psmax-auth-server.onrender.com/callback",
    scope: "repo", // needed for private repos (you set it private)
    state,
    allow_signup: "false",
  });

  const authorizeUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return res.redirect(authorizeUrl);
});

/**
 * GitHub redirects to: /callback?code=...&state=...
 * This endpoint MUST postMessage token to opener (Decap window) and close.
 */
app.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    // Validate state
    const cookieState = req.cookies.decap_oauth_state;
    if (!state || !cookieState || state !== cookieState) {
      return res.status(400).send("Invalid state");
    }

    // Exchange code -> token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "decap-oauth-server"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: "https://psmax-auth-server.onrender.com/callback",
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || tokenJson.error) {
      const err = tokenJson.error_description || tokenJson.error || "Token exchange failed";
      return res.status(500).send(`OAuth error: ${htmlEscape(err)}`);
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return res.status(500).send("No access_token received from GitHub");
    }

    // Clear state cookie
    res.clearCookie("decap_oauth_state", { path: "/" });

    // IMPORTANT:
    // Decap expects a postMessage with { token, provider: "github" }
    // Use a specific target origin for safety.
    const targetOrigin = ALLOWED_ORIGIN;

    res.status(200).set("Content-Type", "text/html").send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      (function () {
        const message = { token: "${htmlEscape(accessToken)}", provider: "github" };
        // Send token to Decap window
        if (window.opener) {
          window.opener.postMessage(message, "${htmlEscape(targetOrigin)}");
        }
        window.close();
      })();
    </script>
    <p>Login complete. You can close this window.</p>
  </body>
</html>`);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error in /callback");
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});