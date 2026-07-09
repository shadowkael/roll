import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { inklecate } = require('inklecate');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'ink/military.json');
const input = join(root, 'stories/military.ink');

mkdirSync(dirname(out), { recursive: true });

const result = await inklecate({ inputFilepath: input, outputFilepath: out });
if (result.compilerOutput?.length) {
  console.error(result.compilerOutput.join('\n'));
  process.exit(1);
}
writeFileSync(out, JSON.stringify(result.storyContent), 'utf8');
console.log('Built', out);
