#!/usr/bin/env python3
"""One-time local integration setup. Reads keys from environment variables only."""

from __future__ import annotations

import json
import os
import pathlib
import re
import subprocess
import sys

REQUIRED = ("NOUS_API_KEY", "NVIDIA_API_KEY", "STRIPE_SECRET_KEY")


def upsert_env_line(content: str, key: str, value: str) -> str:
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    line = f"{key}={value}"
    if pattern.search(content):
        return pattern.sub(line, content)
    if content and not content.endswith("\n"):
        content += "\n"
    return content + line + "\n"


def main() -> int:
    missing = [k for k in REQUIRED if not os.environ.get(k)]
    if missing:
        print(f"Missing env vars: {', '.join(missing)}", file=sys.stderr)
        return 1

    home = pathlib.Path.home()
    sc_dir = home / ".signal-canvas"
    sc_dir.mkdir(parents=True, exist_ok=True)

    config = {
        "hermesGatewayUrl": os.environ.get("HERMES_GATEWAY_URL", "http://127.0.0.1:8642"),
        "hermesApiKey": os.environ.get("HERMES_API_KEY", "signal-canvas-local-dev"),
        "stripeSecretKey": os.environ["STRIPE_SECRET_KEY"],
        "stripePublishableKey": os.environ.get("STRIPE_PUBLISHABLE_KEY", ""),
        "nvidiaApiKey": os.environ["NVIDIA_API_KEY"],
        "nvidiaNimEndpoint": os.environ.get(
            "NVIDIA_NIM_ENDPOINT", "https://integrate.api.nvidia.com/v1"
        ),
        "openaiApiKey": os.environ.get("OPENAI_API_KEY", ""),
        "telegramApiId": os.environ.get("TELEGRAM_API_ID", ""),
        "telegramApiHash": os.environ.get("TELEGRAM_API_HASH", ""),
    }
    (sc_dir / "integrations.json").write_text(json.dumps(config, indent=2) + "\n")
    print(f"✓ Wrote {sc_dir / 'integrations.json'}")

    hermes_env = home / ".hermes" / ".env"
    if hermes_env.exists():
        content = hermes_env.read_text()
    else:
        content = ""

    for key, value in (
        ("NOUS_API_KEY", os.environ["NOUS_API_KEY"]),
        ("NVIDIA_API_KEY", os.environ["NVIDIA_API_KEY"]),
        ("STRIPE_SECRET_KEY", os.environ["STRIPE_SECRET_KEY"]),
        ("TELEGRAM_API_ID", os.environ.get("TELEGRAM_API_ID", "")),
        ("TELEGRAM_API_HASH", os.environ.get("TELEGRAM_API_HASH", "")),
        ("API_SERVER_ENABLED", "true"),
        ("API_SERVER_KEY", config["hermesApiKey"]),
        ("API_SERVER_HOST", "127.0.0.1"),
        ("API_SERVER_PORT", "8642"),
    ):
        content = upsert_env_line(content, key, value)

    hermes_env.parent.mkdir(parents=True, exist_ok=True)
    hermes_env.write_text(content)
    print(f"✓ Updated {hermes_env}")

    stripe_key = os.environ["STRIPE_SECRET_KEY"]
    try:
        subprocess.run(
            ["stripe", "config", "--set", f"test_mode_api_key={stripe_key}"],
            check=True,
            capture_output=True,
            text=True,
        )
        print("✓ Set Stripe CLI test_mode_api_key")
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"⚠ Could not configure Stripe CLI: {exc}", file=sys.stderr)

    cfg = home / ".hermes" / "config.yaml"
    if cfg.exists():
        text = cfg.read_text()
        text = re.sub(
            r'^  default: .*$',
            '  default: "nvidia/nemotron-3-ultra-550b-a55b"',
            text,
            count=1,
            flags=re.MULTILINE,
        )
        text = re.sub(
            r'^  provider: .*$',
            '  provider: "nvidia"',
            text,
            count=1,
            flags=re.MULTILINE,
        )
        text = re.sub(
            r'^  base_url: .*$',
            '  base_url: "https://integrate.api.nvidia.com/v1"',
            text,
            count=1,
            flags=re.MULTILINE,
        )
        cfg.write_text(text)
        print(f"✓ Set Hermes model to NVIDIA Nemotron in {cfg}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
