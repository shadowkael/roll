/**
 * Node smoke test: load compiled ink and walk opening -> scene1_enter
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Story } from '../node_modules/inkjs/dist/ink.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(readFileSync(join(root, 'ink/military.json'), 'utf8'));
const story = new Story(json);

const lines = [];
while (story.canContinue) {
  const t = story.Continue().trim();
  if (t) lines.push(t);
  if (story.currentTags.length) lines.push(`[tags: ${story.currentTags.join(', ')}]`);
}

console.log('Opening flow lines:', lines.slice(0, 20).join('\n'));

story.ChoosePathString('s1_hotspot_sun');
const sun1 = story.Continue().trim();
console.log('Sun click 1:', sun1, story.currentTags);

story.ChoosePathString('s1_hotspot_classmate_head');
story.Continue(); // first click
story.ChoosePathString('s1_hotspot_classmate_head');
while (story.canContinue) story.Continue();
console.log('Classmate head choices:', story.currentChoices.map(c => c.text));

console.log('Smoke test OK');
