// 7Timer Astro API provider

export interface SevenTimerPoint {
  timepoint: number; // hours from init
  seeing?: number; // 1-7 (1 best)
  transparency?: number; // 1-4 (1 best)
  [key: string]: unknown;
}

export interface SevenTimerResponse {
  init: string; // ISO timestamp
  dataseries: SevenTimerPoint[];
}

export async function fetchSevenTimer(
  lat: number,
  lon: number
): Promise<SevenTimerResponse | null> {
  const latInt = Math.round(lat);
  const lonInt = Math.round(lon);
  
  const url = `https://www.7timer.info/bin/api.pl?lon=${lonInt}&lat=${latInt}&product=astro&output=json`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`7Timer API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.dataseries)) {
      console.warn("7Timer: invalid response format");
      return null;
    }

    return data as SevenTimerResponse;
  } catch (error) {
    console.warn("7Timer fetch failed:", error);
    return null;
  }
}
