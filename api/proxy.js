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
      return html(pageHome());
    }

    const app = parts[0];
    const targetBase = ROUTES[app];

    if (!targetBase) {
      return new Response("Not found", { status: 404 });
    }

    // 📺 If ONLY /videos, /music, etc → show iframe shell
    if (parts.length === 1) {
      return html(pageEmbed(app));
    }

    // 🔁 Proxy actual content
    const newPath = "/" + parts.slice(1).join("/");
    const targetUrl = new URL(newPath + url.search, targetBase);

    const headers = new Headers(req.headers);
    headers.set("host", new URL(targetBase).host);

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

    // 🚫 Remove frame blockers (sometimes works)
    resHeaders.delete("x-frame-options");
    resHeaders.delete("content-security-policy");

    resHeaders.delete("content-encoding");
    resHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });

  } catch (err) {
    return new Response("Crash:\n" + err.toString(), { status: 500 });
  }
}

// 🏠 Homepage
function pageHome() {
  return `
  <html>
  <head>
    <title>Freedum</title>
    <style>
      body {
        background:#0f0f0f;
        color:white;
        font-family:sans-serif;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        height:100vh;
        gap:20px;
        margin:0;
      }

      h1 { color:#7c3aed; }

      .btn {
        width:220px;
        padding:15px 0;
        background:#7c3aed;
        border:none;
        border-radius:10px;
        color:white;
        font-size:18px;
        cursor:pointer;
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
      function go(p){ location.href = p }
    </script>
  </body>
  </html>
  `;
}

// 📺 Embed page
function pageEmbed(app) {
  return `
  <html>
  <head>
    <title>${app}</title>
    <style>
      body {
        margin:0;
        background:black;
      }

      iframe {
        width:100vw;
        height:100vh;
        border:none;
      }
    </style>
  </head>
  <body>
    <iframe src="/${app}/"></iframe>
  </body>
  </html>
  `;
}

// helper
function html(content) {
  return new Response(content, {
    headers: { "content-type": "text/html" }
  });
}
