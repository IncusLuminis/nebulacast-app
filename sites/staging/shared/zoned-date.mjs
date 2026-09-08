// Calendar arithmetic uses the observer's timezone, never the browser's timezone.
export function calendarDate(date, timeZone = 'UTC', offset = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = type => Number(parts.find(part => part.type === type).value);
  return new Date(Date.UTC(value('year'), value('month') - 1, value('day') + offset));
}

export function localMidnightUTC(year, month, day, timeZone = 'UTC') {
  const target = Date.UTC(year, month, day);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  let ms = target;
  for (let i = 0; i < 4; i++) {
    const parts = formatter.formatToParts(new Date(ms));
    const value = type => Number(parts.find(part => part.type === type).value);
    const wall = Date.UTC(value('year'), value('month') - 1, value('day'),
      value('hour'), value('minute'), value('second'));
    const correction = target - wall;
    if (correction === 0) break;
    ms += correction;
  }
  return new Date(ms);
}
