/**
 * Ink 运行时：加载 JSON、跳转 knot、解析标签、同步 state
 */
import { Story } from './vendor/ink.mjs';
import { S, saveProgress } from './state.js';

const STORY_URL = 'ink/military.json';

export class InkRuntime {
  constructor() {
    this.story = null;
    this.loaded = false;
  }

  async load(url = STORY_URL) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ink load failed: ${url} (${res.status})`);
    const json = await res.json();
    this.story = new Story(json);
    this.loaded = true;
    return this;
  }

  async runFromStart() {
    this.reset();
    return this.drain();
  }

  reset() {
    if (!this.story) return;
    this.story.ResetState();
  }

  jump(knot) {
    if (!this.story) throw new Error('Ink not loaded');
    this.story.ChoosePathString(knot);
  }

  choose(index) {
    this.story.ChooseChoiceIndex(index);
  }

  drain() {
    const out = {
      texts: [],
      tags: [],
      choices: null,
      ended: false,
    };

    while (this.story.canContinue) {
      const line = this.story.Continue().trim();
      if (line) out.texts.push(line);
      out.tags.push(...this.story.currentTags);
    }

    if (this.story.currentChoices.length > 0) {
      out.choices = this.story.currentChoices.map(c => c.text);
    }

    out.ended = !this.story.canContinue && !out.choices;
    this.syncFromInk();
    return out;
  }

  syncFromInk() {
    if (!this.story) return;
    const v = name => this.story.variablesState.$(name);
    S.tags.bold = Number(v('bold')) || 0;
    S.tags.support = Number(v('support')) || 0;
    S.tags.quiet = Number(v('quiet')) || 0;
    S.s1Choice = v('s1_choice') || null;
    S.s2Choice = v('s2_choice') || null;
    S.s3Choice = v('s3_choice') || null;
    if (!S.bonds) S.bonds = {};
    S.bonds.classmate = !!v('bond_classmate');
    saveProgress();
  }

  getVar(name) {
    return this.story?.variablesState.$(name);
  }
}

export const inkRuntime = new InkRuntime();

export function parseTag(tag) {
  const parts = tag.split(':');
  return { key: parts[0], args: parts.slice(1) };
}
