/** Versioned wire contract shared by ephemeris producers and consumers. */

export const EPHEMERIS_SCHEMA = "ephemeris.v1" as const;

export interface EphemerisTime {
  /** RFC 3339 instant, always UTC and ending in Z. */
  timestamp_utc: string;
  time_basis: "UTC";
}

export interface EphemerisPosition {
  latitude_deg: number;
  longitude_deg: number;
  timezone: string;
  location_key: string;
}

export interface EphemerisLunarState {
  phase: number;
  fraction: number;
  illumination_pct: number;
  waxing: boolean;
}

export interface EphemerisPayload {
  schema: typeof EPHEMERIS_SCHEMA;
  time: EphemerisTime;
  position: EphemerisPosition;
  sun: { altitude_deg: number };
  moon: { altitude_deg: number; lunar_state: EphemerisLunarState };
  provider: string;
}

export class EphemerisContractError extends Error {
  constructor(readonly path: string, message: string) {
    super(`Ephemeris contract: ${path} ${message}`);
    this.name = "EphemerisContractError";
  }
}

function fail(path: string, message: string): never {
  throw new EphemerisContractError(path, message);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "must be an object");
  return value as Record<string, unknown>;
}

function number(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a finite number");
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(path, "must be a non-empty string");
  return value;
}

function range(value: unknown, path: string, min: number, max: number): number {
  const n = number(value, path);
  if (n < min || n > max) fail(path, `must be between ${min} and ${max}`);
  return n;
}

/** Narrow unknown JSON at the boundary and reject incompatible schema versions. */
export function validateEphemeris(value: unknown): EphemerisPayload {
  const root = object(value, "$" );
  if (root.schema !== EPHEMERIS_SCHEMA) fail("schema", `must be ${EPHEMERIS_SCHEMA}`);
  const time = object(root.time, "time");
  const timestamp = string(time.timestamp_utc, "time.timestamp_utc");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(timestamp)) {
    fail("time.timestamp_utc", "must be an RFC 3339 UTC instant");
  }
  if (time.time_basis !== "UTC") fail("time.time_basis", "must be UTC");
  const position = object(root.position, "position");
  const latitude = range(position.latitude_deg, "position.latitude_deg", -90, 90);
  const longitude = range(position.longitude_deg, "position.longitude_deg", -180, 180);
  const timezone = string(position.timezone, "position.timezone");
  const locationKey = string(position.location_key, "position.location_key");
  const sun = object(root.sun, "sun");
  const moon = object(root.moon, "moon");
  const lunar = object(moon.lunar_state, "moon.lunar_state");
  return {
    schema: EPHEMERIS_SCHEMA,
    time: { timestamp_utc: timestamp, time_basis: "UTC" },
    position: { latitude_deg: latitude, longitude_deg: longitude, timezone, location_key: locationKey },
    sun: { altitude_deg: number(sun.altitude_deg, "sun.altitude_deg") },
    moon: {
      altitude_deg: number(moon.altitude_deg, "moon.altitude_deg"),
      lunar_state: {
        phase: range(lunar.phase, "moon.lunar_state.phase", 0, 1),
        fraction: range(lunar.fraction, "moon.lunar_state.fraction", 0, 1),
        illumination_pct: range(lunar.illumination_pct, "moon.lunar_state.illumination_pct", 0, 100),
        waxing: typeof lunar.waxing === "boolean" ? lunar.waxing : fail("moon.lunar_state.waxing", "must be boolean"),
      },
    },
    provider: string(root.provider, "provider"),
  };
}

/** Build the contract from calculated values, keeping units and time basis explicit. */
export function adaptEphemeris(input: Omit<EphemerisPayload, "schema">): EphemerisPayload {
  return validateEphemeris({ schema: EPHEMERIS_SCHEMA, ...input });
}
