#!/usr/bin/env python3
"""Reset a local Signal Canvas operator passcode in ~/.signal-canvas/auth.json."""

from __future__ import annotations

import json
import os
import secrets
import string
import sys
from pathlib import Path

try:
    from argon2 import PasswordHasher
except ImportError as exc:  # pragma: no cover
    print("Install argon2-cffi: python3 -m pip install argon2-cffi", file=sys.stderr)
    raise SystemExit(1) from exc

SC_DIR = Path.home() / ".signal-canvas"
AUTH_FILE = SC_DIR / "auth.json"


def data_key_path(email: str) -> Path:
    safe = email.strip().lower().replace("@", "_at_").replace(".", "_")
    return SC_DIR / f"data-key.{safe}.enc"


def generate_passcode() -> str:
    alphabet = string.ascii_letters + string.digits
    return "Stratir-" + "".join(secrets.choice(alphabet) for _ in range(14))


def main() -> None:
    email = (sys.argv[1] if len(sys.argv) > 1 else "vance@stratir.com").strip().lower()
    new_pass = sys.argv[2] if len(sys.argv) > 2 else generate_passcode()

    if len(new_pass) < 8:
        print("Passcode must be at least 8 characters.", file=sys.stderr)
        raise SystemExit(1)

    if not AUTH_FILE.exists():
        print(f"Missing auth file: {AUTH_FILE}", file=sys.stderr)
        raise SystemExit(1)

    auth = json.loads(AUTH_FILE.read_text())
    accounts = auth.get("accounts", {})
    if email not in accounts:
        print(f"Account not found: {email}", file=sys.stderr)
        raise SystemExit(1)

    ph = PasswordHasher()
    accounts[email]["passwordHash"] = ph.hash(new_pass)
    AUTH_FILE.write_text(json.dumps(auth, indent=2) + "\n")
    os.chmod(AUTH_FILE, 0o600)

    per_account_key = data_key_path(email)
    if per_account_key.exists():
        per_account_key.unlink()

    print(f"Reset passcode for {email}")
    print(f"New passcode: {new_pass}")


if __name__ == "__main__":
    main()
