import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Story } from '../node_modules/inkjs/dist/ink.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(readFileSync(join(root, 'ink/military.json'), 'utf8'));
const story = new Story(json);

let step = 0;
while (story.canContinue) {
  step++;
  const text = story.Continue().trim();
  const tags = [...story.currentTags];
  console.log(`#${step}`, JSON.stringify(text), tags.join(' | ') || '(no tags)');
  if (step > 25) break;
}
