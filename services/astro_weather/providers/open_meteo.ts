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
  hours: number
): Promise<OpenMeteoResponse> {
  const forecastDays = Math.min(Math.ceil(hours / 24), 7); // Open-Meteo free tier: 7 days max
  
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
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
