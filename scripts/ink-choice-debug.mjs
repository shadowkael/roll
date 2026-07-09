import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Story } from '../node_modules/inkjs/dist/ink.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(readFileSync(join(root, 'ink/military.json'), 'utf8'));

function walkToChoices(story) {
  while (story.canContinue) story.Continue();
}

function drain(story) {
  const out = { texts: [], tags: [] };
  while (story.canContinue) {
    const t = story.Continue().trim();
    if (t) out.texts.push(t);
    out.tags.push(...story.currentTags);
  }
  return out;
}

const story = new Story(json);
while (story.canContinue) story.Continue(); // to scene1 done

story.ChoosePathString('s1_hotspot_classmate_head');
drain(story); // first click
story.ChoosePathString('s1_hotspot_classmate_head');
while (story.canContinue) story.Continue(); // to choices

console.log('Choices:', story.currentChoices.map(c => c.text));

story.ChooseChoiceIndex(0);
const afterChooseDrain = drain(story);
console.log('After choose+drain texts:', afterChooseDrain.texts);
console.log('canContinue after drain:', story.canContinue);
console.log('choices after drain:', story.currentChoices.length);

// simulate advanceInk after choose without drain
const story2 = new Story(json);
while (story2.canContinue) story2.Continue();
story2.ChoosePathString('s1_hotspot_classmate_head');
while (story2.canContinue) story2.Continue();
story2.ChoosePathString('s1_hotspot_classmate_head');
while (story2.canContinue) story2.Continue();

story2.ChooseChoiceIndex(0);
console.log('\n--- choose only, then step advanceInk ---');
let step = 0;
while (story2.canContinue && step < 15) {
  step++;
  const text = story2.Continue().trim();
  const tags = [...story2.currentTags];
  console.log(step, JSON.stringify(text), tags.join('|'));
}
