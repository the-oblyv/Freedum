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
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);

  // Homepage
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

  // Rebuild path WITHOUT the prefix
  const newPath = "/" + parts.slice(1).join("/");

  const targetUrl = new URL(newPath + url.search, targetBase);

  const headers = new Headers(req.headers);
  headers.set("host", new URL(targetBase).host);
  headers.set("origin", targetBase);
  headers.set("referer", targetBase);

  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? req.body
        : undefined,
    redirect: "manual"
  });

  const resHeaders = new Headers(response.headers);

  // 🔑 CRITICAL FIXES
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");
  resHeaders.set("access-control-allow-origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers: resHeaders
  });
}
