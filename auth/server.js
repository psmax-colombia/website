/* auth/server.js */
const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();
app.use(cookieParser());

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  ALLOWED_ORIGIN, // https://beta.psmaxmultisoluciones.com
  PORT = process.env.PORT || 10000,
  COOKIE_SECURE = "true",
} = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !ALLOWED_ORIGIN) {
  console.error(
    "Missing env vars. Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ALLOWED_ORIGIN"
  );
}

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

// ⚠️ Debe coincidir con el Authorization callback URL de GitHub OAuth App
const CALLBACK_URL = "https://psmax-auth-server.onrender.com/callback";

/**
 * Healthcheck
 */
app.get("/", (req, res) => {
  res.status(200).send("OK - Decap OAuth server is running");
});

/**
 * Decap opens: {base_url}/{auth_endpoint}
 * base_url: https://psmax-auth-server.onrender.com
 * auth_endpoint: auth
 */
app.get("/auth", (req, res) => {
  const state = randomState();

  // Guardar state en cookie para validar en /callback
  res.cookie("decap_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE !== "false",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "repo", // necesario para repos privados
    state,
    allow_signup: "false",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

/**
 * GitHub redirects to: /callback?code=...&state=...
 * Intercambia code->token y se lo devuelve al CMS por postMessage.
 */
app.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) return res.status(400).send("Missing code");

    // Validar state
    const cookieState = req.cookies.decap_oauth_state;
    if (!state || !cookieState || state !== cookieState) {
      return res.status(400).send("Invalid state");
    }

    // Intercambiar code -> token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "decap-oauth-server",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok || tokenJson.error) {
      const err = tokenJson.error_description || tokenJson.error || "Token exchange failed";
      return res.status(500).send(`OAuth error: ${htmlEscape(err)}`);
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.status(500).send("No access_token received from GitHub");

    // Limpiar cookie state
    res.clearCookie("decap_oauth_state", { path: "/" });

    // HTML del popup: handshake + compatibilidad máxima
    res.status(200).set("Content-Type", "text/html").send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      (function () {
        var token = "${htmlEscape(accessToken)}";
        var allowedOrigin = "${htmlEscape(ALLOWED_ORIGIN)}";
        var done = false;

        function sendSuccess(target) {
          try {
            // 1) string clásico (token plano)
            window.opener && window.opener.postMessage("authorization:github:success:" + token, target);
          } catch (e) {}

          try {
            // 2) string con JSON (algunas builds lo usan)
            window.opener && window.opener.postMessage(
              "authorization:github:success:" + JSON.stringify({ token: token, provider: "github" }),
              target
            );
          } catch (e) {}

          try {
            // 3) objeto (otras builds)
            window.opener && window.opener.postMessage({ token: token, provider: "github" }, target);
          } catch (e) {}
        }

        function finish() {
          if (done) return;
          done = true;
          setTimeout(function () { window.close(); }, 150);
        }

        // 1) Esperar handshake del CMS (Decap normalmente manda un mensaje al popup)
        window.addEventListener("message", function (event) {
          // Si viene del CMS esperado, respondemos a ese origin
          if (event && event.origin && event.origin === allowedOrigin) {
            sendSuccess(event.origin);
            finish();
            return;
          }
        }, false);

        // 2) Avisar al CMS que estamos "authorizing"
        // (Decap suele estar pendiente de esto)
        try {
          window.opener && window.opener.postMessage("authorizing:github", "*");
        } catch (e) {}

        // 3) Fallback: si en 1.5s no llega handshake, mandamos igual al origin permitido
        setTimeout(function () {
          if (done) return;
          sendSuccess(allowedOrigin);
          // y por si el CMS está escuchando sin origin fijo:
          sendSuccess("*");
          finish();
        }, 1500);
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