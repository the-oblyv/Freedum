export const config = {
  runtime: "edge"
};

const ROUTES = {
  videos: "https://invidious.nerdvpn.de",
  music: "https://monochrome.tf",
  radio: "https://fmstream.org",
  books: "https://annas-archive.gl"
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // 🏠 Homepage
    if (parts.length === 0) {
      return new Response(getHomePage(), {
        headers: { "content-type": "text/html" }
      });
    }

    const app = parts[0];
    const targetBase = ROUTES[app];

    if (!targetBase) {
      return new Response("Not found", { status: 404 });
    }

    // Keep subpaths working
    const newPath = "/" + parts.slice(1).join("/");
    const targetUrl = new URL(newPath + url.search, targetBase);

    const headers = new Headers(req.headers);
    headers.set("host", new URL(targetBase).host);
    headers.set("origin", targetBase);
    headers.set("referer", targetBase);

    // ✅ SAFE BODY HANDLING (prevents crashes)
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      redirect: "manual"
    });

    const resHeaders = new Headers(response.headers);

    // Prevent encoding issues
    resHeaders.delete("content-encoding");
    resHeaders.delete("content-length");
    resHeaders.set("access-control-allow-origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });

  } catch (err) {
    return new Response(
      "Freedum proxy crashed:\n\n" + err.toString(),
      { status: 500 }
    );
  }
}

// 🏠 Homepage UI
function getHomePage() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Freedum</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      margin: 0;
    }

    h1 {
      color: #7c3aed;
      font-size: 40px;
    }

    .btn {
      padding: 15px 30px;
      background: #7c3aed;
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 220px;
      transition: 0.2s;
    }

    .btn:hover {
      background: #6d28d9;
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <h1>Freedum</h1>

  <button class="btn" onclick="go('/videos')">Videos</button>
  <button class="btn" onclick="go('/music')">Music</button>
  <button class="btn" onclick="go('/radio')">Radio</button>
  <button class="btn" onclick="go('/books')">Books</button>

  <script>
    function go(path) {
      location.href = path;
    }
  </script>
</body>
</html>
  `;
}
