// tools/dev-proxy.js
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const PORT = 8787;

const ROUTES = {
  "/proxy/rainviewer": "https://api.rainviewer.com/public/weather-maps.json",
};

function sendJson(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(obj));
}

function proxyGetJson(res, targetUrl) {
  const u = new URL(targetUrl);

  const req = https.request(
    {
      method: "GET",
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        "User-Agent": "dev-proxy",
        "Accept": "application/json",
      },
    },
    (upRes) => {
      let data = "";
      upRes.setEncoding("utf8");
      upRes.on("data", (chunk) => (data += chunk));
      upRes.on("end", () => {
        if (upRes.statusCode && upRes.statusCode >= 400) {
          return sendJson(res, 502, { error: "upstream_http_error", status: upRes.statusCode, body: data });
        }
        // RainViewer sometimes returns valid JSON; pass through as parsed to be safe
        try {
          const parsed = JSON.parse(data);
          sendJson(res, 200, parsed);
        } catch (e) {
          sendJson(res, 502, { error: "upstream_bad_json", message: String(e), body: data.slice(0, 500) });
        }
      });
    }
  );

  req.on("error", (e) => sendJson(res, 502, { error: "proxy_failed", message: String(e) }));
  req.end();
}

http
  .createServer((req, res) => {
    if (!req.url) return sendJson(res, 400, { error: "no_url" });

    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    const path = req.url.split("?")[0];
    const target = ROUTES[path];

    if (!target) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "method_not_allowed" });
    }

    proxyGetJson(res, target);
  })
  .listen(PORT, () => {
    console.log(`[dev-proxy] listening on http://localhost:${PORT}`);
    console.log(`[dev-proxy] routes: ${Object.keys(ROUTES).join(", ")}`);
  });