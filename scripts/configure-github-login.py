#!/usr/bin/env python3
"""Private, interactive local OAuth setup. Never accepts a secret as an argument."""
import argparse
import getpass
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from urllib.parse import urlparse


def update_env(path, values):
    path = Path(path)
    if path.is_symlink():
        raise ValueError("Refusing to replace a symbolic-link environment file.")
    original = path.read_text() if path.exists() else ""
    pending = dict(values)
    lines = []
    seen = set()
    for line in original.splitlines():
        match = re.match(r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
        key = match.group(1) if match else None
        if key in values:
            if key not in seen:
                lines.append(f"{key}={json.dumps(values[key])}")
                seen.add(key)
                pending.pop(key, None)
        else:
            lines.append(line)
    lines.extend(f"{key}={json.dumps(value)}" for key, value in pending.items())
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, prefix=".oauth-", delete=False) as stream:
            temporary = stream.name
            os.chmod(temporary, 0o600)
            stream.write("\n".join(lines) + "\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client-id", required=True)
    parser.add_argument("--member-id", required=True)
    parser.add_argument("--origin", default="http://127.0.0.1:3149")
    args = parser.parse_args()
    if not sys.stdin.isatty():
        parser.error("Run this yourself in an interactive terminal; secret input must be hidden.")
    if not re.fullmatch(r"[A-Za-z0-9]{10,100}", args.client_id) or not re.fullmatch(r"[1-9][0-9]*", args.member_id):
        parser.error("Invalid public client ID or numeric member ID.")
    origin = urlparse(args.origin)
    if origin.scheme not in ("http", "https") or origin.hostname is None or origin.username or origin.password or origin.path or origin.query or origin.fragment or (origin.scheme == "http" and origin.hostname != "127.0.0.1"):
        parser.error("Use a canonical HTTPS origin or http://127.0.0.1:<port>.")
    target = Path(__file__).resolve().parent.parent / ".env.local"
    secret = getpass.getpass("GitHub OAuth client secret (hidden, never printed): ")
    if not re.fullmatch(r"[A-Za-z0-9_-]{20,200}", secret):
        parser.error("Secret format rejected; no file was changed.")
    update_env(target, {"GITHUB_CLIENT_ID": args.client_id, "GITHUB_CLIENT_SECRET": secret,
                       "SHIPCHECK_APP_ORIGIN": args.origin, "SHIPCHECK_GITHUB_MEMBER_IDS": args.member_id})
    print("Saved local GitHub sign-in settings with owner-only file permissions. No secret printed.")
    print("Existing provider/database settings were preserved. Restart the development server before testing.")


if __name__ == "__main__":
    main()
