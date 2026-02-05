// functions/api/geocode.ts
async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    if (!q || q.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Query too short (min 2 chars)" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Nebulacast/1.0"
        // Required by Nominatim ToS
      }
    });
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      return new Response(JSON.stringify([]), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
          // Cache for 5 minutes
        }
      });
    }
    const results = data.map((item) => {
      const address = item.address || {};
      const name = item.display_name?.split(",")[0] || item.name || "Unknown";
      const country = address.country || "";
      return {
        name,
        country,
        lat: parseFloat(item.lat) || 0,
        lon: parseFloat(item.lon) || 0
        // Note: Nominatim doesn't return timezone, would need separate lookup
      };
    }).filter((item) => item.lat !== 0 && item.lon !== 0);
    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("geocode API error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
export {
  onRequest
};
