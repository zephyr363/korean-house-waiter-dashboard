#!/usr/bin/env python3
"""Build GitHub Pages artifact using FIREBASE_CONFIG_JSON stored in GitHub Actions Secrets."""
import json
import os
from pathlib import Path

raw = os.environ.get("FIREBASE_CONFIG_JSON")
if not raw:
    raise SystemExit("FIREBASE_CONFIG_JSON Actions secret is not configured")
try:
    config = json.loads(raw)
except json.JSONDecodeError:
    raise SystemExit("FIREBASE_CONFIG_JSON must be valid JSON") from None
required = ("apiKey", "authDomain", "projectId", "appId", "messagingSenderId")
if not isinstance(config, dict) or not all(isinstance(config.get(k), str) and config[k] for k in required):
    raise SystemExit("Firebase configuration is missing one or more required string fields")
if config["projectId"] != "korean-house-dashboard":
    raise SystemExit("Unexpected Firebase projectId — refusing to deploy to another database")
root = Path(__file__).resolve().parent.parent
out = root / "dist"
out.mkdir(exist_ok=True)
(out / "index.html").write_bytes((root / "index.html").read_bytes())
safe_json = json.dumps(config, ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")
(out / "firebase-config.js").write_text("window.__KH_FIREBASE_CONFIG__ = " + safe_json + ";\n", encoding="utf-8")
(out / ".nojekyll").write_text("", encoding="utf-8")
print("Generated static Pages artifact (Firebase config omitted from logs)")
