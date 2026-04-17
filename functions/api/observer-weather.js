/**
 * /api/observer-weather?lat=&lon=&tz=&bortle=
 *
 * Provides location-aware observer weather data in the observer_weather_now.json
 * schema by calling /api/astro-weather for each observing profile and normalizing
 * the result. This makes the Observer Weather Panel and Hero panel truly location-
 * aware without changing the downstream widget contracts.
 */

const PROFILES = ["balanced", "visual", "photography", "planetary"];

function nqiClass(val) {
  if (val >= 8.0) return "excellent";
  if (val >= 6.5) return "good";
  if (val >= 5.0) return "usable";
  if (val >= 3.0) return "marginal";
  return "poor";
}

/** Translate one astro-weather hour record to the observer_weather_now hourly schema. */
function normalizeHour(h) {
  return {
    timestamp_utc: h.time,
    cloud: {
      total_percent: h.cloud_total,
      low_percent:   h.cloud_low,
      mid_percent:   h.cloud_mid,
      high_percent:  h.cloud_high,
    },
    wind: {
      speed_mps:    h.wind_m_s,
      gust_mps:     null, // not provided by Open-Meteo free tier
      direction_deg: h.wind_dir_deg,
    },
    precip: {
      probability_percent: h.precip_prob,
      amount_mm:           h.precip_mm,
    },
    air: {
      temperature_c:    h.temp_c,
      dewpoint_c:       h.dewpoint_c,
      humidity_percent: h.humidity_pct,
      pressure_hpa:     h.pressure_hpa,
      visibility_m:     h.visibility_m,
    },
    astro: {
      seeing:       h.seeing,
      transparency: h.transparency,
    },
    night:   (h.sun_alt_deg  ?? 1)  < 0,
    moon_up: (h.moon_alt_deg ?? -1) > 0,
    score: h.score,
    gate:  h.gate,
  };
}

/** Compute average night-time score and return NQI value (0–10 scale). */
function computeNightStats(hourly) {
  const nightHours = hourly.filter(h => h.night);
  if (!nightHours.length) return { nqiVal: 0, avgScore: 0, nightHours };
  const avgScore = nightHours.reduce((s, h) => s + (h.score ?? 0), 0) / nightHours.length;
  return { nqiVal: avgScore / 10, avgScore, nightHours };
}

/** Find the 2-hour window with the highest average score. */
function findBestWindow(nightHours) {
  if (nightHours.length < 2) return null;
  let best = null, bestScore = -1;
  for (let i = 0; i < nightHours.length - 1; i++) {
    const avg = ((nightHours[i].score ?? 0) + (nightHours[i + 1].score ?? 0)) / 2;
    if (avg > bestScore) {
      bestScore = avg;
      best = {
        start: nightHours[i].timestamp_utc,
        end:   nightHours[i + 1].timestamp_utc,
        score: Math.round(avg),
      };
    }
  }
  return best;
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const respHeaders = {
    "Content-Type":                "application/json; charset=utf-8",
    "Cache-Control":               "public, max-age=600",
    "Access-Control-Allow-Origin": "*",
  };

  const url  = new URL(request.url);
  const lat  = parseFloat(url.searchParams.get("lat") ?? "");
  const lon  = parseFloat(url.searchParams.get("lon") ?? "");
  const tz   = url.searchParams.get("tz")     ?? "Europe/Warsaw";
  const bortle = Math.min(9, Math.max(1, parseInt(url.searchParams.get("bortle") ?? "5", 10)));

  if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return new Response(
      JSON.stringify({ error: "lat and lon are required and must be valid coordinates" }),
      { status: 400, headers: respHeaders }
    );
  }

  try {
    // ── Fetch all profiles in parallel ─────────────────────────────────────
    const baseParams = new URLSearchParams({ lat: String(lat), lon: String(lon), tz, hours: "72", bortle: String(bortle) });
    const origin = url.origin;

    const profileResults = await Promise.all(
      PROFILES.map(profile => {
        const p = new URLSearchParams(baseParams);
        p.set("profile", profile);
        return fetch(`${origin}/api/astro-weather?${p.toString()}`).then(r => r.json());
      })
    );

    // Use 'balanced' (index 0) as the canonical hourly base
    const base = profileResults[0];
    if (!base.hours?.length) {
      return new Response(
        JSON.stringify({ error: "Weather data unavailable from upstream" }),
        { status: 502, headers: respHeaders }
      );
    }

    // ── Normalize hourly records ────────────────────────────────────────────
    const hourly = base.hours.map(normalizeHour);
    const { nightHours } = computeNightStats(hourly);
    const bestTonight = findBestWindow(nightHours);

    // ── Per-profile NQI & mode_scores ──────────────────────────────────────
    const nqi        = {};
    const modeScores = {};

    PROFILES.forEach((profile, i) => {
      const res = profileResults[i];
      if (!res.hours?.length) {
        nqi[profile]        = { value: 0, class: "poor" };
        modeScores[profile] = 0;
        return;
      }
      const ph = res.hours.map(normalizeHour);
      const { nqiVal, avgScore } = computeNightStats(ph);
      nqi[profile]        = { value: parseFloat(nqiVal.toFixed(1)), class: nqiClass(nqiVal) };
      modeScores[profile] = Math.round(avgScore);
    });

    // ── Moon data from the hour nearest to now ──────────────────────────────
    const nowMs = Date.now();
    const moonH = base.hours.reduce((closest, h) => {
      const d = Math.abs(new Date(h.time).getTime() - nowMs);
      return d < Math.abs(new Date(closest.time).getTime() - nowMs) ? h : closest;
    }, base.hours[0]);

    const moon = {
      illumination_percent: moonH?.moon_illum_pct  ?? null,
      phase_name:           null,
      moon_up_now:          (moonH?.moon_alt_deg ?? -1) > 0,
    };

    // ── Derived: pressure trend & risks ────────────────────────────────────
    const derived          = base.derived ?? {};
    const pTrend           = derived.pressure_trend_6h ?? null;
    const pressureTrendLabel = pTrend === null ? "steady"
      : pTrend > 0.5 ? "rising" : pTrend < -0.5 ? "falling" : "steady";

    const risks = {
      dew:  "unknown",
      fog:  derived.fog_risk ?? "low",
      wind: (derived.wind_peak_next_24h ?? 0) > 8 ? "high"
          : (derived.wind_peak_next_24h ?? 0) > 5 ? "medium" : "low",
    };

    // ── Assemble response in observer_weather_now.json schema ───────────────
    const result = {
      generated_utc: new Date().toISOString(),
      observer: { lat_deg: lat, lon_deg: lon, tz },
      hourly,
      decision: {
        risks,
        pressure:       { trend_label: pressureTrendLabel },
        best_window_2h: bestTonight,
        best_window_3h: null,
        best_tonight:   bestTonight,
        mode_scores:    modeScores,
      },
      night_summary: {
        generated_at: new Date().toISOString(),
        nqi,
        avg_score: modeScores,
      },
      moon,
      bortle,
    };

    return new Response(JSON.stringify(result), { headers: respHeaders });

  } catch (err) {
    console.error("[observer-weather]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: respHeaders }
    );
  }
}
