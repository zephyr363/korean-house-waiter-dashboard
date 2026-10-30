#!/usr/bin/env python3
"""Build a static Pages artifact with Firebase config from GitHub Actions environment."""
import json
import os
from pathlib import Path

FIELDS = {
    "apiKey": "FIREBASE_API_KEY",
    "authDomain": "FIREBASE_AUTH_DOMAIN",
    "projectId": "FIREBASE_PROJECT_ID",
    "storageBucket": "FIREBASE_STORAGE_BUCKET",
    "messagingSenderId": "FIREBASE_MESSAGING_SENDER_ID",
    "appId": "FIREBASE_APP_ID",
    "measurementId": "FIREBASE_MEASUREMENT_ID",
}
REQUIRED = ("apiKey", "authDomain", "projectId", "messagingSenderId", "appId")
config = {key: os.environ.get(env, "").strip() for key, env in FIELDS.items()}
missing = [FIELDS[key] for key in REQUIRED if not config[key]]
if missing:
    raise SystemExit("Missing required GitHub Actions Secret/Variables: " + ", ".join(missing))
if config["projectId"] != "korean-house-dashboard":
    raise SystemExit("Unexpected Firebase project ID; deploy cancelled")
if not config["authDomain"].endswith(".firebaseapp.com"):
    raise SystemExit("Invalid Firebase auth domain")
config = {key: value for key, value in config.items() if value}

root = Path(__file__).resolve().parent.parent
out = root / "dist"
out.mkdir(exist_ok=True)
(out / "index.html").write_bytes((root / "index.html").read_bytes())
serialized = json.dumps(config, ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")
(out / "firebase-config.js").write_text(
    "window.__KH_FIREBASE_CONFIG__ = " + serialized + ";\n", encoding="utf-8"
)
(out / ".nojekyll").write_text("", encoding="utf-8")
print("Built site with Firebase config from Actions environment (values hidden from logs)")
