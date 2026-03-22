export const config = {
  runtime: "edge"
};

const ROUTES = {
  "/videos": "https://invidious.nerdvpn.de",
  "/music": "https://monochrome.tf",
  "/radio": "https://fmstream.org",
  "/books": "https://annas-archive.gl"
};

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Find matching route
  const match = Object.keys(ROUTES).find(route =>
    path.startsWith(route)
  );

  // Default homepage (no proxy)
  if (!match) {
    return new Response(getHomePage(), {
      headers: { "content-type": "text/html" }
    });
  }

  const targetBase = ROUTES[match];

  // Remove prefix (/videos, /music, etc.)
  const strippedPath = path.replace(match, "") || "/";

  const targetUrl = new URL(strippedPath + url.search, targetBase);

  const headers = new Headers(req.headers);
  headers.set("host", new URL(targetBase).host);

  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? req.body
        : undefined,
    redirect: "manual"
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders
  });
}

// 🏠 Homepage HTML
function getHomePage() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Freedum</title>
    <style>
      body {
        background: #0f0f0f;
        color: white;
        font-family: sans-serif;
        display: flex;
        height: 100vh;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 20px;
      }

      h1 {
        color: #7c3aed;
      }

      .btn {
        padding: 15px 30px;
        background: #7c3aed;
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 18px;
        cursor: pointer;
        width: 200px;
      }

      .btn:hover {
        background: #6d28d9;
      }
    </style>
  </head>
  <body>
    <h1>Freedum</h1>

    <button class="btn" onclick="location.href='/videos'">Videos</button>
    <button class="btn" onclick="location.href='/music'">Music</button>
    <button class="btn" onclick="location.href='/radio'">Radio</button>
    <button class="btn" onclick="location.href='/books'">Books</button>
  </body>
  </html>
  `;
}
