// Cloudflare Pages Function: /api/astro-weather

import { fetchOpenMeteo } from "../../services/astro_weather/providers/open_meteo";
import { fetchSevenTimer } from "../../services/astro_weather/providers/seven_timer";
import { mergeHourlyData } from "../../services/astro_weather/merge";
import { computeScore } from "../../services/astro_weather/score";
import { computeDerived } from "../../services/astro_weather/derived";
import type { AstroWeatherResponse, Profile, Location } from "../../services/astro_weather/types";

interface Env {
  // Cloudflare Pages Functions environment
}

function parseQueryParams(url: URL): {
  lat: number;
  lon: number;
  tz: string;
  hours: number;
  profile: Profile;
} {
  const lat = parseFloat(url.searchParams.get("lat") || "");
  const lon = parseFloat(url.searchParams.get("lon") || "");
  const tz = url.searchParams.get("tz") || "Europe/Warsaw";
  const hours = Math.min(Math.max(24, parseInt(url.searchParams.get("hours") || "72", 10)), 120);
  const profile = (url.searchParams.get("profile") || "default") as Profile;

  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid lat: must be number in [-90, 90]");
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid lon: must be number in [-180, 180]");
  }

  const validProfiles: Profile[] = ["default", "visual", "broadband", "planetary"];
  if (!validProfiles.includes(profile)) {
    throw new Error(`Invalid profile: must be one of ${validProfiles.join(", ")}`);
  }

  return { lat, lon, tz, hours, profile };
}

function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    }
  );
}

function createSuccessResponse(data: AstroWeatherResponse): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
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
    return createErrorResponse("Method not allowed", 405);
  }

  try {
    const url = new URL(request.url);
    const { lat, lon, tz, hours, profile } = parseQueryParams(url);

    // Check cache
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch data from providers
    const [omData, stData] = await Promise.all([
      fetchOpenMeteo(lat, lon, tz, hours),
      fetchSevenTimer(lat, lon),
    ]);

    // Merge hourly data
    let hourRecords = mergeHourlyData(omData, stData, tz, hours);

    // Compute scores for each hour
    for (let i = 0; i < hourRecords.length; i++) {
      const hour = hourRecords[i];
      const pressureTrend =
        i + 6 < hourRecords.length
          ? (hourRecords[i + 6].pressure_hpa ?? null) - (hour.pressure_hpa ?? 0)
          : null;
      const { score, breakdown } = computeScore(hour, pressureTrend, profile);
      hour.score = score;
      hour.score_breakdown = breakdown;
    }

    // Compute derived metrics
    const derived = computeDerived(hourRecords);

    // Build response
    const location: Location = {
      lat,
      lon,
      tz,
    };

    const response: AstroWeatherResponse = {
      generated_at: new Date().toISOString(),
      location,
      horizon_hours: hourRecords.length,
      profile,
      hours: hourRecords,
      derived,
    };

    const responseObj = createSuccessResponse(response);

    // Cache response
    await cache.put(cacheKey, responseObj.clone());

    return responseObj;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("astro-weather API error:", error);
    return createErrorResponse(message, 500);
  }
}
