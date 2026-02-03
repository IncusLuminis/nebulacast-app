#!/usr/bin/env bash
# Serve repo root with Python HTTP server so that
# http://localhost:8080/services/news/public/rss.xml is available.

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
echo "Serving from $REPO_ROOT on http://localhost:8080/"
echo "RSS: http://localhost:8080/services/news/public/rss.xml"
exec python3 -m http.server 8080
