// Simple test for astro-weather API contract validation
// Run with: npx tsx services/astro_weather/test_api.ts (or similar)

import type { AstroWeatherResponse, HourRecord } from "./types";

const API_BASE = process.env.API_BASE || "http://localhost:8788"; // Adjust for local dev

async function testAstroWeatherAPI() {
  console.log("Testing /api/astro-weather endpoint...\n");

  const testCases = [
    {
      name: "Warsaw default",
      params: { lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw", hours: 72, profile: "default" },
    },
    {
      name: "Berlin visual",
      params: { lat: 52.52, lon: 13.405, tz: "Europe/Berlin", hours: 48, profile: "visual" },
    },
    {
      name: "Invalid lat",
      params: { lat: 100, lon: 0, tz: "UTC", hours: 72, profile: "default" },
      expectError: true,
    },
  ];

  for (const testCase of testCases) {
    console.log(`Test: ${testCase.name}`);
    const params = new URLSearchParams(
      Object.entries(testCase.params).map(([k, v]) => [k, String(v)])
    );
    const url = `${API_BASE}/api/astro-weather?${params.toString()}`;

    try {
      const res = await fetch(url);
      const text = await res.text();

      if (testCase.expectError) {
        if (res.ok) {
          console.error("  ❌ Expected error but got success");
          continue;
        }
        console.log(`  ✓ Got expected error: ${res.status}`);
        continue;
      }

      if (!res.ok) {
        console.error(`  ❌ HTTP ${res.status}: ${text.substring(0, 100)}`);
        continue;
      }

      const data: AstroWeatherResponse = JSON.parse(text);

      // Validate structure
      const errors: string[] = [];

      if (!data.generated_at || typeof data.generated_at !== "string") {
        errors.push("Missing or invalid generated_at");
      }
      if (!data.location || typeof data.location.lat !== "number" || typeof data.location.lon !== "number") {
        errors.push("Missing or invalid location");
      }
      if (!Array.isArray(data.hours)) {
        errors.push("Missing or invalid hours array");
      }
      if (data.hours.length === 0) {
        errors.push("Empty hours array");
      }
      if (!data.derived || typeof data.derived.fog_risk !== "string") {
        errors.push("Missing or invalid derived metrics");
      }

      // Validate each hour
      for (let i = 0; i < Math.min(10, data.hours.length); i++) {
        const hour = data.hours[i];
        if (!hour.time || typeof hour.score !== "number") {
          errors.push(`Hour ${i}: missing time or score`);
        }
        if (hour.score < 0 || hour.score > 100) {
          errors.push(`Hour ${i}: score out of range [0,100]: ${hour.score}`);
        }
        if (!hour.score_breakdown) {
          errors.push(`Hour ${i}: missing score_breakdown`);
        } else {
          const bd = hour.score_breakdown;
          if (bd.clamped_total !== hour.score) {
            errors.push(
              `Hour ${i}: score_breakdown.clamped_total (${bd.clamped_total}) != score (${hour.score})`
            );
          }
          if (!Array.isArray(bd.categories) || bd.categories.length === 0) {
            errors.push(`Hour ${i}: missing or empty score_breakdown.categories`);
          }
        }
      }

      if (errors.length > 0) {
        console.error(`  ❌ Validation errors:\n    ${errors.join("\n    ")}`);
      } else {
        console.log(
          `  ✓ Valid response: ${data.hours.length} hours, profile=${data.profile}, ` +
            `horizon=${data.horizon_hours}h`
        );
        console.log(`    Sample hour[0]: score=${data.hours[0].score}, ` +
          `cloud=${data.hours[0].cloud_total}, wind=${data.hours[0].wind_m_s}`);
        console.log(`    Derived: fog_risk=${data.derived.fog_risk}, ` +
          `heads_up=${data.derived.heads_up.length} messages`);
      }
    } catch (error) {
      console.error(`  ❌ Request failed: ${error instanceof Error ? error.message : error}`);
    }
    console.log("");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAstroWeatherAPI().catch(console.error);
}

export { testAstroWeatherAPI };
