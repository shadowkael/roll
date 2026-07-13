/**
 * Fail if stories/military.ink drifted from the last compiled stamp.
 * Stamp is written by `npm run ink:build` → ink/military.sha256
 */
import { existsSync } from 'fs';
import {
  INK_HASH,
  INK_JSON,
  INK_SOURCE,
  hashInkSource,
  readStoredInkHash,
} from './ink-hash.mjs';

if (!existsSync(INK_SOURCE)) {
  console.error('Missing', INK_SOURCE);
  process.exit(1);
}
if (!existsSync(INK_JSON)) {
  console.error('Missing compiled story', INK_JSON, '— run npm run ink:build on macOS/Windows and commit it.');
  process.exit(1);
}
if (!existsSync(INK_HASH)) {
  console.error(
    'Missing',
    INK_HASH,
    '— run npm run ink:build on macOS/Windows and commit ink/military.sha256.',
  );
  process.exit(1);
}

const actual = hashInkSource(INK_SOURCE);
const expected = readStoredInkHash(INK_HASH);

if (actual !== expected) {
  console.error('Ink source is out of sync with committed compile stamp.');
  console.error(`  source: ${INK_SOURCE}`);
  console.error(`  stamp:  ${INK_HASH}`);
  console.error(`  expected: ${expected}`);
  console.error(`  actual:   ${actual}`);
  console.error('Fix: npm run ink:build  (on macOS/Windows), then commit ink/military.json + ink/military.sha256');
  process.exit(1);
}

console.log('Ink check OK — stories/military.ink matches ink/military.sha256');
