#!/usr/bin/env python3
"""HTTP wrapper for the Telethon bridge (Fly.io / Cloudflare TELEGRAM_BRIDGE_URL)."""

from __future__ import annotations

import asyncio
import io
import json
import os
from contextlib import redirect_stdout
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

import bridge


def apply_headers(headers: dict[str, str]) -> None:
    api_id = headers.get("x-telegram-api-id", "").strip()
    api_hash = headers.get("x-telegram-api-hash", "").strip()
    user_id = headers.get("x-signal-user-id", "default").strip() or "default"
    if not api_id or not api_hash:
        raise ValueError("X-Telegram-Api-Id and X-Telegram-Api-Hash required")
    os.environ["TELEGRAM_API_ID"] = api_id
    os.environ["TELEGRAM_API_HASH"] = api_hash
    os.environ["SIGNAL_USER_ID"] = user_id


def run_bridge(coro) -> dict[str, Any]:
    buf = io.StringIO()
    with redirect_stdout(buf):
        asyncio.run(coro)
    text = buf.getvalue().strip()
    if not text:
        return {"ok": False, "error": "empty bridge output"}
    line = text.splitlines()[-1].strip()
    return json.loads(line)


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = "SignalCanvasTelegramBridge/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[bridge] {self.address_string()} {fmt % args}", flush=True)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-Telegram-Api-Id, X-Telegram-Api-Hash, X-Signal-User-Id",
        )
        self.end_headers()

    def _handle(self, method: str) -> None:
        try:
            apply_headers({k.lower(): v for k, v in self.headers.items()})
        except ValueError as e:
            self._send_json(401, {"ok": False, "error": str(e)})
            return

        path = urlparse(self.path).path.rstrip("/") or "/"
        query = parse_qs(urlparse(self.path).query)
        body = self._read_json() if method == "POST" else {}

        try:
            if path == "/health":
                self._send_json(200, {"ok": True, "data": {"status": "ok"}})
                return
            if path == "/status":
                result = run_bridge(bridge.cmd_status())
                self._send_json(200 if result.get("ok") else 400, result)
                return
            if path == "/list-dialogs":
                limit = int((query.get("limit") or ["50"])[0])
                result = run_bridge(bridge.cmd_list_dialogs(limit))
                self._send_json(200 if result.get("ok") else 400, result)
                return
            if path == "/history":
                chat_id = (query.get("chatId") or query.get("chat-id") or [""])[0]
                limit = int((query.get("limit") or ["40"])[0])
                if not chat_id:
                    self._send_json(400, {"ok": False, "error": "chatId required"})
                    return
                result = run_bridge(bridge.cmd_history(chat_id, limit))
                self._send_json(200 if result.get("ok") else 400, result)
                return
            if path == "/send-code":
                phone = str(body.get("phone", "")).strip()
                if not phone:
                    self._send_json(400, {"ok": False, "error": "phone required"})
                    return
                result = run_bridge(bridge.cmd_send_code(phone))
                self._send_json(200 if result.get("ok") else 400, result)
                return
            if path == "/sign-in":
                phone = str(body.get("phone", "")).strip()
                code = str(body.get("code", "")).strip()
                phone_code_hash = str(body.get("phoneCodeHash", body.get("phone_code_hash", ""))).strip()
                if not phone or not code or not phone_code_hash:
                    self._send_json(400, {"ok": False, "error": "phone, code, phoneCodeHash required"})
                    return
                result = run_bridge(bridge.cmd_sign_in(phone, code, phone_code_hash))
                self._send_json(200 if result.get("ok") else 400, result)
                return
            if path == "/join":
                target = str(body.get("target", "")).strip()
                if not target:
                    self._send_json(400, {"ok": False, "error": "target required"})
                    return
                result = run_bridge(bridge.cmd_join(target))
                self._send_json(200 if result.get("ok") else 400, result)
                return
            self._send_json(404, {"ok": False, "error": "Not found"})
        except Exception as e:
            self._send_json(500, {"ok": False, "error": str(e)})

    def do_GET(self) -> None:
        self._handle("GET")

    def do_POST(self) -> None:
        self._handle("POST")


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    host = os.environ.get("HOST", "0.0.0.0")
    server = ThreadingHTTPServer((host, port), BridgeHandler)
    print(f"Telegram HTTP bridge listening on {host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
