#!/usr/bin/env python3
"""
Local dev server with API endpoints for astro-weather, geocode, revgeo.
Uses existing Python weather pipeline code.
"""
from __future__ import annotations

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# Add services to path
_service_root = Path(__file__).resolve().parent.parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

try:
    from services.weather.pipelines.fetch_weather import build_weather_payload
    _WEATHER_AVAILABLE = True
except ImportError:
    _WEATHER_AVAILABLE = False
    print("WARNING: weather service not available, /api/astro-weather will not work")


class APIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        """Add CORS headers to response."""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # CORS headers for all responses
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }

        if path.startswith("/api/"):
            if path == "/api/astro-weather":
                self.handle_astro_weather(query, cors_headers)
            elif path == "/api/geocode":
                self.handle_geocode(query, cors_headers)
            elif path == "/api/revgeo":
                self.handle_revgeo(query, cors_headers)
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                for k, v in cors_headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Not found"}).encode())
        else:
            # Serve static files from sites/staging
            self.serve_static_file(path)

    def handle_astro_weather(self, query, cors_headers):
        """Handle /api/astro-weather endpoint."""
        if not _WEATHER_AVAILABLE:
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(
                json.dumps({"error": "Weather service not available"}).encode()
            )
            return

        try:
            lat = float(query.get("lat", [""])[0])
            lon = float(query.get("lon", [""])[0])
            tz = query.get("tz", ["Europe/Warsaw"])[0]
            hours = int(query.get("hours", ["72"])[0])
            profile = query.get("profile", ["default"])[0]

            if lat < -90 or lat > 90 or lon < -180 or lon > 180:
                raise ValueError("Invalid coordinates")

            # Use existing weather pipeline
            payload = build_weather_payload(
                lat=lat,
                lon=lon,
                tz=tz,
                location_name=f"{lat:.4f},{lon:.4f}",
                horizon_hours=hours,
                thresholds={},
            )

            # Transform to API contract format
            generated_at = payload.get("generated_at") or payload.get("meta", {}).get("generated_at")
            location_obj = payload.get("location") or payload.get("meta", {}).get("location", {})
            hours_list = payload.get("hours", [])
            derived_obj = payload.get("derived", {})
            
            # Ensure each hour has score_breakdown in correct format
            for hour in hours_list:
                if "score_breakdown" not in hour or not hour.get("score_breakdown"):
                    # Create minimal breakdown
                    hour["score_breakdown"] = {
                        "components": [],
                        "total": hour.get("score", 0),
                        "clamped_total": hour.get("score", 0),
                    }
                elif isinstance(hour["score_breakdown"], dict):
                    # Ensure it has required fields
                    bd = hour["score_breakdown"]
                    if "components" not in bd:
                        bd["components"] = []
                    if "total" not in bd:
                        bd["total"] = hour.get("score", 0)
                    if "clamped_total" not in bd:
                        bd["clamped_total"] = hour.get("score", 0)

            response_data = {
                "generated_at": generated_at,
                "location": {
                    "name": location_obj.get("name") or f"{lat:.4f},{lon:.4f}",
                    "lat": location_obj.get("lat") or lat,
                    "lon": location_obj.get("lon") or lon,
                    "tz": location_obj.get("tz") or tz,
                },
                "horizon_hours": payload.get("horizon_hours") or len(hours_list),
                "profile": profile,
                "hours": hours_list,
                "derived": {
                    "pressure_trend_6h": derived_obj.get("pressure_trend_6h") or None,
                    "wind_peak_next_24h": derived_obj.get("wind_peak_next_24h") or None,
                    "cloud_peak_next_24h": derived_obj.get("cloud_peak_next_24h") or None,
                    "fog_risk": derived_obj.get("fog_risk", "low"),
                    "heads_up": derived_obj.get("heads_up", []),
                },
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "public, max-age=600")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode())

        except (ValueError, KeyError) as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
        except Exception as e:
            print(f"Error in astro-weather: {e}", file=sys.stderr)
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_geocode(self, query, cors_headers):
        """Handle /api/geocode endpoint using Nominatim."""
        import urllib.request
        import urllib.parse

        q = query.get("q", [""])[0]
        if not q or len(q) < 2:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Query too short"}).encode())
            return

        try:
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(q)}&limit=6&addressdetails=1"
            req = urllib.request.Request(url, headers={"User-Agent": "Nebulacast/1.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                results = []
                for item in data:
                    results.append({
                        "name": item.get("display_name", "").split(",")[0] or item.get("name", "Unknown"),
                        "country": item.get("address", {}).get("country", ""),
                        "lat": float(item.get("lat", 0)),
                        "lon": float(item.get("lon", 0)),
                    })
                results = [r for r in results if r["lat"] != 0 and r["lon"] != 0]

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "public, max-age=300")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps(results, ensure_ascii=False).encode())

        except Exception as e:
            print(f"Error in geocode: {e}", file=sys.stderr)
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_revgeo(self, query, cors_headers):
        """Handle /api/revgeo endpoint using Nominatim."""
        import urllib.request

        try:
            lat = float(query.get("lat", [""])[0])
            lon = float(query.get("lon", [""])[0])
        except (ValueError, KeyError):
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid lat/lon"}).encode())
            return

        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1"
            req = urllib.request.Request(url, headers={"User-Agent": "Nebulacast/1.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                address = data.get("address", {})
                result = {
                    "name": data.get("display_name") or address.get("city") or address.get("town") or "Unknown location",
                    "country": address.get("country", ""),
                }

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "public, max-age=3600")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode())

        except Exception as e:
            print(f"Error in revgeo: {e}", file=sys.stderr)
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            for k, v in cors_headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def serve_static_file(self, path):
        """Serve static files from sites/staging directory."""
        import os
        from pathlib import Path
        
        staging_dir = Path(__file__).resolve().parent.parent.parent / "sites" / "staging"
        
        # Security: prevent directory traversal
        if ".." in path:
            self.send_response(403)
            self.end_headers()
            return
        
        # Remove leading slash and resolve path
        file_path = staging_dir / path.lstrip("/")
        
        # Default to index.html for directories
        if file_path.is_dir():
            file_path = file_path / "index.html"
        
        if not file_path.exists() or not file_path.is_file():
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")
            return
        
        # Determine content type
        ext = file_path.suffix.lower()
        content_types = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
        }
        content_type = content_types.get(ext, "application/octet-stream")
        
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            print(f"Error serving {file_path}: {e}", file=sys.stderr)
            self.send_response(500)
            self.end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = HTTPServer(("localhost", port), APIHandler)
    print(f"API dev server running at http://localhost:{port}")
    print("Endpoints: /api/astro-weather, /api/geocode, /api/revgeo")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
