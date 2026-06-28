/// <reference types="@cloudflare/workers-types" />

import { handleHermes, hermesCorsHeaders, type HermesEnv } from "./hermesGateway";
import { downloadPageHtml } from "./downloadPage";

export interface Env extends HermesEnv {
  RELEASES: R2Bucket;
  ASSETS: Fetcher;
  APP_VERSION?: string;
  HERMES_GATEWAY_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: hermesCorsHeaders });
    }

    const url = new URL(request.url);
    const version = env.APP_VERSION?.trim() || "0.1.0";
    const key = `Signal-Canvas-${version}-aarch64.dmg`;
    const latestKey = "Signal-Canvas-latest-aarch64.dmg";

    if (url.pathname.startsWith("/hermes")) {
      return handleHermes(request, env);
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(downloadPageHtml(version, "/download"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/download" || url.pathname.endsWith(".dmg")) {
      let object = await env.RELEASES.get(latestKey);
      if (!object) object = await env.RELEASES.get(key);
      if (!object) {
        return new Response("Release not uploaded yet. Run npm run deploy:release.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Content-Type", "application/x-apple-diskimage");
      headers.set("Content-Disposition", 'attachment; filename="Signal-Canvas.dmg"');
      headers.set("Cache-Control", "public, max-age=300");
      return new Response(object.body, { headers });
    }

    if (url.pathname === "/api/health") {
      const hasRelease = !!(await env.RELEASES.head(latestKey)) || !!(await env.RELEASES.head(key));
      const hermesOk = await fetch(new URL("/hermes/health", request.url).toString(), {
        headers: { Authorization: `Bearer ${env.HERMES_GATEWAY_KEY ?? "signal-canvas-prod-gateway"}` },
      })
        .then((r) => r.ok)
        .catch(() => false);
      return Response.json(
        { ok: true, version, hasRelease, hermesOnline: hermesOk, hermesHost: "cloudflare-workers" },
        { headers: hermesCorsHeaders },
      );
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
