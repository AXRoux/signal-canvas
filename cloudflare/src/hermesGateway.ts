import { buildHermesChatPrompt, normalizeChatDisplay, nimFastChat } from "./hermesChat";

export interface HermesEnv {
  HERMES_GATEWAY_KEY?: string;
  NVIDIA_API_KEY?: string;
  NVIDIA_NIM_ENDPOINT?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Signal-Nvidia-Key, X-Signal-Nim-Endpoint, X-Signal-Nous-Key, X-Signal-Language",
};

function gatewayKey(env: HermesEnv): string {
  return env.HERMES_GATEWAY_KEY?.trim() || "signal-canvas-prod-gateway";
}

function verifyAuth(request: Request, env: HermesEnv): boolean {
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${gatewayKey(env)}`;
}

function resolveNvidiaKey(request: Request, env: HermesEnv): string {
  return (
    request.headers.get("X-Signal-Nvidia-Key")?.trim() ||
    env.NVIDIA_API_KEY?.trim() ||
    ""
  );
}

function resolveNimEndpoint(request: Request, env: HermesEnv): string {
  return (
    request.headers.get("X-Signal-Nim-Endpoint")?.trim() ||
    env.NVIDIA_NIM_ENDPOINT?.trim() ||
    "https://integrate.api.nvidia.com/v1"
  );
}

function chatPayload(display: string, canvasActions: Record<string, unknown> | null) {
  return {
    output: display,
    content: display,
    message: { content: display },
    canvas_actions: canvasActions,
  };
}

export async function handleHermes(request: Request, env: HermesEnv): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/hermes/, "") || "/";

  if (path === "/health" && request.method === "GET") {
    return Response.json(
      {
        status: "ok",
        platform: "signal-canvas-hermes",
        version: "1.0.0",
        hosted: "cloudflare-workers",
      },
      { headers: corsHeaders },
    );
  }

  if (!verifyAuth(request, env)) {
    return Response.json(
      {
        error: {
          message: "Invalid API key",
          type: "invalid_request_error",
          code: "invalid_api_key",
        },
      },
      { status: 401, headers: corsHeaders },
    );
  }

  if (path === "/api/sessions" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      metadata?: { language?: string };
    };
    const id = crypto.randomUUID();
    return Response.json(
      { id, session: { id, title: body.title ?? "signal-canvas" } },
      { status: 201, headers: corsHeaders },
    );
  }

  const chatMatch = path.match(/^\/api\/sessions\/([^/]+)\/chat$/);
  if (chatMatch && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as {
      input?: string;
      message?: string;
      language?: string;
      context?: Record<string, unknown>;
    };

    const prompt = (body.input ?? body.message ?? "").trim();
    if (!prompt) {
      return Response.json({ error: "Empty message" }, { status: 400, headers: corsHeaders });
    }

    const nvidiaKey = resolveNvidiaKey(request, env);
    if (!nvidiaKey) {
      return Response.json(
        {
          error: {
            message: "NVIDIA API key required. Add it in Signal Canvas Settings → NVIDIA.",
            code: "missing_nvidia_key",
          },
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const language =
      body.language ??
      request.headers.get("X-Signal-Language") ??
      (body.context?.language as string | undefined) ??
      "en";

    const context = (body.context ?? {}) as Record<string, unknown>;
    const fullPrompt = body.context
      ? buildHermesChatPrompt(prompt, context as Parameters<typeof buildHermesChatPrompt>[1], language)
      : prompt;

    try {
      const raw = await nimFastChat(nvidiaKey, resolveNimEndpoint(request, env), fullPrompt);
      const { display, canvasActions } = normalizeChatDisplay(raw);
      return Response.json(chatPayload(display, canvasActions), { headers: corsHeaders });
    } catch (e) {
      return Response.json(
        {
          error: {
            message: e instanceof Error ? e.message : String(e),
            code: "inference_failed",
          },
        },
        { status: 502, headers: corsHeaders },
      );
    }
  }

  return new Response("Not found", { status: 404, headers: corsHeaders });
}

export { corsHeaders as hermesCorsHeaders };
