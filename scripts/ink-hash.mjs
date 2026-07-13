import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const INK_SOURCE = join(root, 'stories/military.ink');
export const INK_JSON = join(root, 'ink/military.json');
export const INK_HASH = join(root, 'ink/military.sha256');

/** Normalize text so macOS/Windows line endings don't break the stamp. */
export function hashInkSource(filepath = INK_SOURCE) {
  const text = readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function writeInkHash(filepath = INK_SOURCE, hashPath = INK_HASH) {
  const digest = hashInkSource(filepath);
  writeFileSync(hashPath, `${digest}\n`, 'utf8');
  return digest;
}

export function readStoredInkHash(hashPath = INK_HASH) {
  return readFileSync(hashPath, 'utf8').trim().split(/\s+/)[0];
}
