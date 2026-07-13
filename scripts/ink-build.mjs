import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { writeInkHash } from './ink-hash.mjs';

const require = createRequire(import.meta.url);
const getBinDir = require('inklecate/getBinDir');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'ink/military.json');
const input = join(root, 'stories/military.ink');

mkdirSync(dirname(out), { recursive: true });

/** inklecate-node only ships macOS + Windows binaries (Linux would get .exe). */
function resolveInklecateBin() {
  const binDir = getBinDir();
  if (process.platform === 'darwin') return join(binDir, 'inklecate');
  if (process.platform === 'win32') return join(binDir, 'inklecate.exe');
  return null;
}

const bin = resolveInklecateBin();
if (!bin) {
  if (existsSync(out)) {
    console.log(`Skip ink:build on ${process.platform} (no inklecate binary); keeping`, out);
    process.exit(0);
  }
  console.error(
    `inklecate has no binary for ${process.platform}. Compile on macOS/Windows and commit ink/military.json.`,
  );
  process.exit(1);
}

if (process.platform !== 'win32') {
  try {
    chmodSync(bin, 0o755);
  } catch {
    /* ignore */
  }
}

function runInklecate() {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, ['-o', out, input], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    proc.stdout.on('data', (d) => chunks.push(d));
    proc.stderr.on('data', (d) => chunks.push(d));
    proc.on('error', reject);
    proc.on('close', (code) => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (code !== 0) {
        reject(new Error(text || `inklecate exited ${code}`));
        return;
      }
      resolve(text);
    });
  });
}

try {
  const rawOut = await runInklecate();
  const noise = String(rawOut || '')
    .replace(/^\uFEFF/, '')
    .trim();
  const compiled = readFileSync(out, 'utf8').replace(/^\uFEFF/, '').trim();
  const storyContent = JSON.parse(compiled);
  writeFileSync(out, JSON.stringify(storyContent), 'utf8');
  const digest = writeInkHash(input);
  if (noise) console.log(noise);
  console.log('Built', out);
  console.log('Stamp', digest);
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
