// services/astro_weather/providers/contracts.ts
var ProviderContractError = class extends Error {
  constructor(provider, path, message) {
    super(`${provider} response contract: ${path} ${message}`);
    this.name = "ProviderContractError";
    this.provider = provider;
    this.path = path;
  }
};
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function fail(provider, path, message) {
  throw new ProviderContractError(provider, path, message);
}
function optionalString(value, provider, path) {
  if (value === void 0 || value === null) return void 0;
  if (typeof value !== "string") fail(provider, path, "must be a string or null");
  return value;
}
function address(value, provider, path) {
  if (value === void 0 || value === null) return void 0;
  if (!isRecord(value)) fail(provider, path, "must be an object or null");
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = optionalString(entry, provider, `${path}.${key}`);
  }
  return result;
}
function coordinateString(value, provider, path) {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || text.trim() === "") fail(provider, path, "must be a coordinate string");
  const number = Number(text);
  if (!Number.isFinite(number)) fail(provider, path, "must contain a finite coordinate");
  return text;
}
function validateNominatimSearchResponse(value) {
  const provider = "Nominatim";
  if (!Array.isArray(value)) fail(provider, "$", "search response must be an array");
  return value.map((entry, index) => {
    const path = `$[${index}]`;
    if (!isRecord(entry)) fail(provider, path, "must be an object");
    return {
      display_name: optionalString(entry.display_name, provider, `${path}.display_name`),
      name: optionalString(entry.name, provider, `${path}.name`),
      lat: coordinateString(entry.lat, provider, `${path}.lat`),
      lon: coordinateString(entry.lon, provider, `${path}.lon`),
      address: address(entry.address, provider, `${path}.address`)
    };
  });
}

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
    const data = validateNominatimSearchResponse(await response.json());
    const results = data.map((item) => {
      const address2 = item.address || {};
      const name = item.display_name?.split(",")[0] || item.name || "Unknown";
      const country = address2.country || "";
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
