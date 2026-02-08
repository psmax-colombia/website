import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.get("/", (req, res) => {
  res.send("OK - PSMax OAuth Provider");
});

// 👉 Endpoint principal que usa Decap CMS
app.get("/auth", (req, res) => {
  const redirectUri = `https://${req.get("host")}/callback`;

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "repo");

  res.redirect(url.toString());
});

// 👉 Aliases (por compatibilidad y pruebas)
app.get("/auth/", (req, res) => res.redirect("/auth"));
app.get("/auth/github/login", (req, res) => res.redirect("/auth"));

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing ?code");

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const token = await tokenRes.json();

    if (!token.access_token) {
      return res.status(500).send(JSON.stringify(token));
    }

    const payload = {
      token: token.access_token,
      provider: "github",
    };

    const message = `authorization:github:success:${JSON.stringify(payload)}`;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage(${JSON.stringify(message)}, "*");
            }
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

app.listen(PORT, () => {
  console.log("Listening on", PORT);
});