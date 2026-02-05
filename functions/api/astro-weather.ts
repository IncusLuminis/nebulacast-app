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

const VALID_PROFILES: Profile[] = ["default", "visual", "broadband", "planetary"];
const HOURS_MIN = 1;
const HOURS_MAX = 168;

function parseQueryParams(url: URL): {
  lat: number;
  lon: number;
  tz: string;
  hours: number;
  profile: Profile;
  name?: string;
} {
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lon = parseFloat(url.searchParams.get("lon") ?? "");
  const tzRaw = url.searchParams.get("tz") ?? "Europe/Warsaw";
  const tz = typeof tzRaw === "string" && tzRaw.length > 0 ? tzRaw : "Europe/Warsaw";
  const hoursRaw = parseInt(url.searchParams.get("hours") ?? "72", 10);
  const hours = Math.min(Math.max(Number.isFinite(hoursRaw) ? hoursRaw : 72, HOURS_MIN), HOURS_MAX);
  const profile = (url.searchParams.get("profile") ?? "default") as Profile;
  const name = url.searchParams.get("name") ?? undefined;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid lat: must be number in [-90, 90]");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid lon: must be number in [-180, 180]");
  }
  if (!VALID_PROFILES.includes(profile)) {
    throw new Error(`Invalid profile: must be one of ${VALID_PROFILES.join(", ")}`);
  }

  return { lat, lon, tz, hours, profile, name };
}

function jsonHeaders(cfRay?: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (cfRay) h["CF-Ray"] = cfRay;
  return h;
}

function createErrorPayload(opts: {
  ok: false;
  where: string;
  message: string;
  stack?: string;
  req: { lat?: number; lon?: number; tz?: string; hours?: number; profile?: string; name?: string };
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    ok: false,
    where: opts.where,
    message: opts.message,
    req: opts.req,
  };
  if (opts.stack !== undefined) body.stack = opts.stack;
  return body;
}

function createErrorResponse(
  message: string,
  status: number = 400,
  cfRay?: string,
  payload?: Record<string, unknown>
): Response {
  const body = payload ?? { error: message };
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(cfRay),
  });
}

function createSuccessResponse(data: AstroWeatherResponse, cfRay?: string): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=600",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (cfRay) headers["CF-Ray"] = cfRay;
  return new Response(JSON.stringify(data), { headers });
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request } = context;
  const cfRay = request.headers.get("cf-ray") ?? request.headers.get("CF-Ray") ?? undefined;

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
    return createErrorResponse("Method not allowed", 405, cfRay);
  }

  let reqParams: { lat?: number; lon?: number; tz?: string; hours?: number; profile?: string; name?: string } = {};
  try {
    const url = new URL(request.url);
    const parsed = parseQueryParams(url);
    const { lat, lon, tz, hours, profile, name } = parsed;
    reqParams = { lat, lon, tz, hours, profile, name };

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    let omResult;
    try {
      omResult = await fetchOpenMeteo(lat, lon, tz, hours, cache);
    } catch (omError) {
      if (omError instanceof Error && omError.message === "RATE_LIMITED") {
        // Try stale cache for Open-Meteo
        const staleCacheKey = new Request(`https://cache.nebulacast/open-meteo?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(tz)}&forecast_days=${Math.min(Math.ceil(hours / 24), 7)}`, {
          method: "GET",
        });
        const staleCached = await cache.match(staleCacheKey);
        if (staleCached) {
          const staleData = await staleCached.json();
          omResult = { data: staleData, fromCache: true, status: 200 };
        } else {
          // No stale cache - return graceful degradation response
          const headers: Record<string, string> = {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=60",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          };
          if (cfRay) headers["CF-Ray"] = cfRay;
          return new Response(
            JSON.stringify({
              ok: true,
              source: "rate-limited",
              message: "Open-Meteo rate limited; please retry in a few minutes",
              location: { lat, lon, tz },
              hours: [],
              derived: {},
            }),
            { status: 200, headers }
          );
        }
      } else {
        throw omError;
      }
    }

    const stData = await fetchSevenTimer(lat, lon);
    let hourRecords = mergeHourlyData(omResult.data, stData, tz, hours);

    if (!hourRecords || hourRecords.length === 0) {
      console.error("[astro-weather] mergeHourlyData returned empty array", {
        omData: omResult.data,
        stData,
        tz,
        hours,
      });
      throw new Error("No hourly data available after merge");
    }

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

    const derived = computeDerived(hourRecords);

    const location: Location = { lat, lon, tz };

    const response: AstroWeatherResponse = {
      generated_at: new Date().toISOString(),
      location,
      horizon_hours: hourRecords.length,
      profile,
      hours: hourRecords,
      derived,
    };

    const responseObj = createSuccessResponse(response, cfRay);
    // Cache final response (10 minutes)
    await cache.put(cacheKey, responseObj.clone());
    return responseObj;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[astro-weather]", message, error);

    const payload = createErrorPayload({
      ok: false,
      where: "astro-weather",
      message,
      stack,
      req: reqParams,
    });
    return createErrorResponse(
      message,
      500,
      cfRay,
      payload as Record<string, unknown>
    );
  }
}
