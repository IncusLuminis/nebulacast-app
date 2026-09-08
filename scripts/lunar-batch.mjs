// Python pipelines use the exact browser implementation, once per time grid.
import { getLunarState } from '../sites/staging/shared/lunar.mjs';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const dates = JSON.parse(input);
if (!Array.isArray(dates)) throw new TypeError('Expected an array of UTC timestamps');
process.stdout.write(JSON.stringify(dates.map(date => getLunarState(new Date(date)))));
