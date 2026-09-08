#!/bin/bash
# Serve sites/staging with API endpoints
# Runs Python API server on :8080 and static file server on :8081
# Frontend should use :8080 (which proxies static files and handles /api/*)

cd "$(dirname "$0")/../.." || exit 1

PORT=${PORT:-8080}

echo "Starting dev server with API endpoints on port $PORT"
echo "API endpoints: /api/astro-weather, /api/geocode, /api/revgeo"
echo "Static files: all other paths"
echo ""
echo "Open: http://localhost:$PORT/poc.html"
echo ""

# Use Python API server (which also serves static files)
python3 infra/scripts/dev_api_server.py "$PORT"
