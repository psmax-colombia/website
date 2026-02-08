import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.warn("Faltan env vars: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET");
}

app.get("/auth", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/callback`;

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "repo"); // para repo privado luego

  res.redirect(url.toString());
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Falta ?code=");

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || tokenJson.error) {
      return res.status(500).send(`Error token: ${JSON.stringify(tokenJson)}`);
    }

    const payload = { token: tokenJson.access_token, provider: "github" };
    const msg = `authorization:github:success:${JSON.stringify(payload)}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
<html><body>
<script>
  if (window.opener) window.opener.postMessage(${JSON.stringify(msg)}, "*");
  window.close();
</script>
</body></html>`);
  } catch (e) {
    res.status(500).send(String(e));
  }
});

app.get("/", (req, res) => res.send("OK - PSMax OAuth Provider"));

app.listen(PORT, () => console.log("Listening on", PORT));