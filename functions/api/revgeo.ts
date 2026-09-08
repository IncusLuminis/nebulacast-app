// Cloudflare Pages Function: /api/revgeo
// Reverse geocode lat/lon to place name using OpenStreetMap Nominatim

interface Env {
  // Cloudflare Pages Functions environment
}

interface RevGeoResult {
  name: string;
  country?: string;
  tz?: string;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lon = parseFloat(url.searchParams.get("lon") || "");

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return new Response(JSON.stringify({ error: "Invalid lat: must be number in [-90, 90]" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return new Response(JSON.stringify({ error: "Invalid lon: must be number in [-180, 180]" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Use OpenStreetMap Nominatim reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Nebulacast/1.0", // Required by Nominatim ToS
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    const address = data.address || {};
    const name = data.display_name || address.city || address.town || address.village || "Unknown location";
    const country = address.country || "";

    // Note: Nominatim doesn't return timezone directly
    // Would need separate timezone lookup service (e.g., timezonefinder API or similar)
    // For now, return without tz

    const result: RevGeoResult = {
      name,
      country,
      // tz: undefined (would need separate lookup)
    };

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour (coordinates don't change)
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("revgeo API error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
