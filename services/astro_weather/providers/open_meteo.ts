// Open-Meteo API provider

export interface OpenMeteoHourly {
  time: string[];
  cloudcover?: (number | null)[];
  cloudcover_low?: (number | null)[];
  cloudcover_mid?: (number | null)[];
  cloudcover_high?: (number | null)[];
  precipitation?: (number | null)[];
  precipitation_probability?: (number | null)[];
  pressure_msl?: (number | null)[];
  windspeed_10m?: (number | null)[];
  winddirection_10m?: (number | null)[];
  visibility?: (number | null)[];
  temperature_2m?: (number | null)[];
}

export interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
  hourly_units?: {
    windspeed_10m?: string;
    [key: string]: string | undefined;
  };
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  tz: string,
  hours: number,
  cache?: Cache
): Promise<{ data: OpenMeteoResponse; fromCache: boolean; status: number }> {
  const forecastDays = Math.min(Math.ceil(hours / 24), 7);
  
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "cloudcover",
      "cloudcover_low",
      "cloudcover_mid",
      "cloudcover_high",
      "precipitation",
      "precipitation_probability",
      "pressure_msl",
      "windspeed_10m",
      "winddirection_10m",
      "visibility",
      "temperature_2m",
    ].join(","),
    timezone: tz,
    forecast_days: String(forecastDays),
    windspeed_unit: "ms",
    precipitation_unit: "mm",
    pressure_unit: "hPa",
    temperature_unit: "celsius",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  
  // Cache key for Open-Meteo request (10min TTL)
  if (cache) {
    const cacheKey = new Request(`https://cache.nebulacast/open-meteo?${params.toString()}`, {
      method: "GET",
    });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const data = await cached.json();
      return { data, fromCache: true, status: 200 };
    }
  }
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });

  if (response.status === 429) {
    // Rate limited - return error that can be handled gracefully
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache successful response (10 minutes)
  if (cache) {
    const cacheKey = new Request(`https://cache.nebulacast/open-meteo?${params.toString()}`, {
      method: "GET",
    });
    const cacheResponse = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
    await cache.put(cacheKey, cacheResponse);
  }

  return { data, fromCache: false, status: response.status };
}
