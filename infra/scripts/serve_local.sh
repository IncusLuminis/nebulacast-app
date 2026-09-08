#!/usr/bin/env bash
# Serve sites/staging/ as HTTP root (Cloudflare Pages deploy root).
# http://localhost:8080/news/rss.xml, /alerts/rss.xml, /astro-weather/...

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGING_DIR="$REPO_ROOT/sites/staging"
cd "$STAGING_DIR"
echo "Serving from $STAGING_DIR (sites/staging/) on http://localhost:8080/"
echo "  News RSS:  http://localhost:8080/news/rss.xml"
echo "  Index:     http://localhost:8080/"
exec python3 -m http.server 8080
