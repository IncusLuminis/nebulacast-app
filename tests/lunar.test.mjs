import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { getLunarState, readIlluminationPct } from '../sites/staging/shared/lunar.mjs';

test('illumination consumer accepts only the versioned percent unit', () => {
  assert.equal(readIlluminationPct(63), 63);
  assert.equal(readIlluminationPct(0), 0);
  assert.equal(readIlluminationPct(101), null);
  assert.equal(readIlluminationPct('63'), null);
});
import { calendarDate, localMidnightUTC } from '../sites/staging/shared/zoned-date.mjs';
import { moonLimbRotation } from '../sites/staging/sky/core/moon.orientation.mjs';
import { Prepare } from '../sites/staging/sky/core/sky.prepare.js';
import { mountSunMoon } from '../sites/staging/weather/widgets/sun_moon/sun_moon.js';
import { onRequest } from '../functions/api/sun-moon.js';

const fixture = name => JSON.parse(readFileSync(new URL(`fixtures/${name}.json`, import.meta.url)));
for (const event of fixture('usno-moon-phases-2026').samples) {
  test(`USNO: ${event.timestamp_utc} ${event.name}`, () => {
    const moon = getLunarState(new Date(event.timestamp_utc));
    const delta = Math.abs(moon.phase - event.phase);
    assert.ok(Math.min(delta, 1 - delta) < 0.001, `cycle ${moon.phase}`);
    assert.equal(moon.name, event.name);
    if (event.phase === 0) assert.ok(moon.illum_pct < 0.5);
    else if (event.phase === 0.5) assert.ok(moon.illum_pct > 99.5);
    else assert.ok(Math.abs(moon.illum_pct - 50) < 1);
  });
}

test('Independent DE421 illuminated fractions agree within 0.1 percentage point', () => {
  for (const sample of fixture('de421-illumination').samples) {
    const moon = getLunarState(new Date(sample.t_utc));
    assert.ok(Math.abs(moon.illum_pct - sample.illum_pct) < 0.1,
      `${sample.t_utc}: ${moon.illum_pct} vs ${sample.illum_pct}`);
  }
});

test('waxing switches at new/full moon, not at an illumination threshold', () => {
  for (const [date, before, after] of [
    ['2026-09-11T03:27:00Z', false, true], ['2026-09-26T16:49:00Z', true, false],
  ]) {
    const ms = Date.parse(date);
    assert.equal(getLunarState(new Date(ms - 7200000)).waxing, before);
    assert.equal(getLunarState(new Date(ms + 7200000)).waxing, after);
  }
});

test('UTC-minute cache returns immutable results and rejects invalid dates', () => {
  const a = getLunarState(new Date('2026-09-07T12:00:01Z'));
  assert.strictEqual(a, getLunarState(new Date('2026-09-07T14:00:59+02:00')));
  assert.ok(Object.isFrozen(a));
  assert.throws(() => getLunarState(new Date(NaN)), RangeError);
  for (let i = 0; i < 2200; i++) getLunarState(new Date(Date.UTC(2026, 0, 1) + i * 60000));
  assert.deepEqual(getLunarState(new Date(a.timestamp_utc)), a);
});

test('API and Python batch use the same lunar contract', async () => {
  const response = await onRequest({ request: new Request('https://test/api/sun-moon?lat=-33.9&lon=151.2&days=1&step_min=60') });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.version, 2);
  assert.equal(data.frames.length, 25);
  const dates = data.frames.map(f => new Date(f.t_utc).toISOString());
  const batch = JSON.parse(execFileSync(process.execPath,
    [new URL('../scripts/lunar-batch.mjs', import.meta.url).pathname],
    { input: JSON.stringify(dates), encoding: 'utf8' }));
  data.frames.forEach((frame, i) => {
    const moon = getLunarState(new Date(dates[i]));
    assert.equal(frame.moon.illum_pct, moon.illum_pct);
    assert.equal(frame.moon.phase, moon.phase);
    assert.equal(frame.moon.waxing, moon.waxing);
    assert.equal(frame.moon.phase_name, moon.name);
    assert.deepEqual(batch[i], moon);
  });
});

test('API rejects invalid sampling instead of returning empty success', async () => {
  for (const suffix of ['days=bad', 'step_min=bad', 'lat=NaN', 'days=1.5']) {
    const response = await onRequest({ request: new Request(`https://test/api/sun-moon?lat=0&lon=0&${suffix}`) });
    // Duplicate latitude is intentionally not used: URLSearchParams selects the first.
    if (suffix !== 'lat=NaN') assert.equal(response.status, 400);
  }
  const response = await onRequest({ request: new Request('https://test/api/sun-moon?lat=NaN&lon=0') });
  assert.equal(response.status, 400);
});

test('Sky ignores conflicting phase values in both fresh and stale ephemerides', () => {
  const date = new Date('2026-09-07T12:00:00Z');
  const observer = { date, latRad: 0.5, lstRad: 1 };
  for (const t_utc of ['2026-Sep-07 12:00Z', '2020-Jan-01 00:00Z']) {
    const input = { frames: [{ t_utc, moon: { ra_deg: 100, dec_deg: 20, phase: 1, illum_pct: 100, waxing: true } }] };
    const [moon] = Prepare.prepareSunMoon(input, observer, { cx: 100, cy: 100, R: 90 });
    const expected = getLunarState(date);
    assert.equal(moon.illum_pct, expected.illum_pct);
    assert.equal(moon.phase, expected.phase);
    assert.equal(moon.waxing, expected.waxing);
  }
});

test('Observer calendar handles UTC+14, UTC-12, fractional offsets and DST', () => {
  for (const [zone, expected] of [
    ['Pacific/Kiritimati', '2026-09-06T10:00:00.000Z'],
    ['Etc/GMT+12', '2026-09-07T12:00:00.000Z'],
    ['Asia/Kathmandu', '2026-09-06T18:15:00.000Z'],
    ['Europe/Warsaw', '2026-09-06T22:00:00.000Z'],
  ]) assert.equal(localMidnightUTC(2026, 8, 7, zone).toISOString(), expected);
  assert.equal(calendarDate(new Date('2026-09-07T23:30Z'), 'Pacific/Kiritimati').toISOString(), '2026-09-08T00:00:00.000Z');
  const start = localMidnightUTC(2026, 2, 29, 'Europe/Warsaw');
  const end = localMidnightUTC(2026, 2, 30, 'Europe/Warsaw');
  assert.equal((end - start) / 3600000, 23);
});

test('Moon limb follows the underground Sun without retaining sunset state', () => {
  const moon = { altDeg: 30, azDeg: 180 };
  const east = moonLimbRotation(moon, { altDeg: -20, azDeg: 90 });
  const west = moonLimbRotation(moon, { altDeg: -20, azDeg: 270 });
  assert.ok(Number.isFinite(east));
  assert.notEqual(east, west);
  assert.equal(east, moonLimbRotation(moon, { altDeg: -20, azDeg: 90 }));
  assert.equal(moonLimbRotation(moon, moon), 0);
});

test('Sun Equation changes lunar display when selecting another day; polar dates do not throw', () => {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  const elements = new Map();
  const element = () => ({ textContent: '', innerHTML: '', children: [], dataset: {},
    appendChild(child) { this.children.push(child); },
    addEventListener(type, fn) { this[type] = fn; },
  });
  for (const role of ['day-controls', 'hour-line', 'day-length', 'night-length', 'civil-length', 'astro-length']) elements.set(role, element());
  const root = { innerHTML: '', querySelector(selector) { return elements.get(selector.match(/data-role=([^\]]+)/)[1]) || null; } };
  const times = Object.fromEntries(['sunrise', 'sunset', 'solarNoon', 'dawn', 'dusk', 'nauticalDawn', 'nauticalDusk', 'night', 'nightEnd'].map(key => [key, new Date(NaN)]));
  globalThis.window = { dispatchEvent() {}, SunCalc: {
    getTimes: () => times, getMoonTimes: () => ({}),
    getPosition: () => ({ altitude: 0.1 }), getMoonPosition: () => ({ altitude: 0.2 }),
    getMoonIllumination() { throw new Error('Independent phase calculation must not be called'); },
  } };
  globalThis.document = { createElement: element };
  let cleanup;
  try {
    cleanup = mountSunMoon(root, {
      getState: () => ({ location: { lat: 80, lon: 0, tz: 'Pacific/Kiritimati', name: 'Test' } }),
      subscribe: () => () => {},
    });
    const now = elements.get('hour-line').textContent;
    assert.ok(now.includes(`illum. ${getLunarState().pct}%`));
    elements.get('day-controls').children.find(button => button.dataset.offset === '3').click();
    const later = elements.get('hour-line').textContent;
    assert.notEqual(later, now);
    assert.match(later, /illum\. \d+%/);
  } finally {
    cleanup?.(); globalThis.window = originalWindow; globalThis.document = originalDocument;
  }
});
