/** Runtime contracts for responses received from external providers.
 *
 * `Response.json()` is intentionally treated as unknown at the boundary.  A
 * provider can return an error document with HTTP 200, or silently change a
 * field from an array to null.  These validators make that failure explicit
 * before the value reaches the weather merger or API response.
 */

import type { OpenMeteoResponse } from "./open_meteo";

export class ProviderContractError extends Error {
  readonly provider: string;
  readonly path: string;

  constructor(provider: string, path: string, message: string) {
    super(`${provider} response contract: ${path} ${message}`);
    this.name = "ProviderContractError";
    this.provider = provider;
    this.path = path;
  }
}

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(provider: string, path: string, message: string): never {
  throw new ProviderContractError(provider, path, message);
}

function finiteNumber(value: unknown, provider: string, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(provider, path, "must be a finite number");
  }
  return value;
}

function optionalNumberArray(
  value: unknown,
  provider: string,
  path: string,
  expectedLength: number,
): (number | null)[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) fail(provider, path, "must be an array or omitted");
  if (value.length !== expectedLength) {
    fail(provider, path, `length ${value.length} does not match hourly.time length ${expectedLength}`);
  }
  return value.map((entry, index) =>
    entry === null ? null : finiteNumber(entry, provider, `${path}[${index}]`),
  );
}

/** Validate and narrow an Open-Meteo forecast response. */
export function validateOpenMeteoResponse(value: unknown): OpenMeteoResponse {
  const provider = "Open-Meteo";
  if (!isRecord(value)) fail(provider, "$", "must be an object");
  const hourly = value.hourly;
  if (!isRecord(hourly)) fail(provider, "hourly", "must be an object");
  const times = hourly.time;
  if (!Array.isArray(times) || times.length === 0) {
    fail(provider, "hourly.time", "must be a non-empty array");
  }
  if (!times.every((entry) => typeof entry === "string" && entry.length > 0)) {
    fail(provider, "hourly.time", "must contain only non-empty strings");
  }

  const result: OpenMeteoResponse = { hourly: { time: times as string[] } };
  const resultHourly = result.hourly!;
  const fields = [
    "cloudcover", "cloudcover_low", "cloudcover_mid", "cloudcover_high",
    "precipitation", "precipitation_probability", "pressure_msl",
    "windspeed_10m", "winddirection_10m", "visibility", "temperature_2m",
    "relativehumidity_2m", "dewpoint_2m", "rain", "snowfall",
  ] as const;
  for (const field of fields) {
    const entries = optionalNumberArray(hourly[field], provider, `hourly.${field}`, times.length);
    if (entries !== undefined) resultHourly[field] = entries;
  }

  if (value.hourly_units !== undefined) {
    if (!isRecord(value.hourly_units)) fail(provider, "hourly_units", "must be an object or omitted");
    const units: Record<string, string | undefined> = {};
    for (const [key, unit] of Object.entries(value.hourly_units)) {
      if (unit !== undefined && typeof unit !== "string") {
        fail(provider, `hourly_units.${key}`, "must be a string");
      }
      units[key] = unit as string | undefined;
    }
    result.hourly_units = units;
  }
  return result;
}

export interface NominatimAddress {
  country?: string;
  city?: string;
  town?: string;
  village?: string;
  [key: string]: string | undefined;
}

export interface NominatimSearchResult {
  display_name?: string;
  name?: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

export interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
}

function optionalString(value: unknown, provider: string, path: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") fail(provider, path, "must be a string or null");
  return value;
}

function address(value: unknown, provider: string, path: string): NominatimAddress | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) fail(provider, path, "must be an object or null");
  const result: NominatimAddress = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = optionalString(entry, provider, `${path}.${key}`);
  }
  return result;
}

function coordinateString(value: unknown, provider: string, path: string): string {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || text.trim() === "") fail(provider, path, "must be a coordinate string");
  const number = Number(text);
  if (!Number.isFinite(number)) fail(provider, path, "must contain a finite coordinate");
  return text;
}

/** Validate the array returned by Nominatim search. Empty results are valid. */
export function validateNominatimSearchResponse(value: unknown): NominatimSearchResult[] {
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
      address: address(entry.address, provider, `${path}.address`),
    };
  });
}

/** Validate the object returned by Nominatim reverse geocoding. */
export function validateNominatimReverseResponse(value: unknown): NominatimReverseResult {
  const provider = "Nominatim";
  if (!isRecord(value)) fail(provider, "$", "reverse response must be an object");
  return {
    display_name: optionalString(value.display_name, provider, "display_name"),
    address: address(value.address, provider, "address"),
  };
}
