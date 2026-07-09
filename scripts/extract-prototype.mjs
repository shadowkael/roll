import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'POC', 'prototype', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);

if (!cssMatch || !scriptMatch || !bodyMatch) {
  console.error('Failed to parse prototype HTML');
  process.exit(1);
}

const outDir = path.join(root, 'scripts', '_extracted');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'style.css'), cssMatch[1]);

let js = scriptMatch[1];
const start = js.indexOf('const ES_IMAGES = {');
const end = js.indexOf('};', start) + 2;
const esBlock = js.slice(start, end);
fs.writeFileSync(path.join(outDir, 'es_images.js'), esBlock);

const esObj = Function(`return ${esBlock.replace('const ES_IMAGES = ', '')}`)();
const bgDir = path.join(root, 'assets', 'bg');
fs.mkdirSync(bgDir, { recursive: true });

const imageMap = {};
for (const [key, dataUrl] of Object.entries(esObj)) {
  const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) continue;
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const fname = `${key}.${ext}`;
  const buf = Buffer.from(m[2], 'base64');
  fs.writeFileSync(path.join(bgDir, fname), buf);
  imageMap[key] = `assets/bg/${fname}`;
  console.log('Wrote', fname, buf.length, 'bytes');
}

fs.writeFileSync(path.join(bgDir, 'manifest.json'), JSON.stringify(imageMap, null, 2));

js = js.slice(0, start) + '// ES_IMAGES imported from images.js\n' + js.slice(end);
fs.writeFileSync(path.join(outDir, 'game.js'), js);

// Extract game inner HTML (inside game-container)
const containerMatch = bodyMatch[1].match(/<div id="game-container">([\s\S]*?)<\/div>\s*<script>/);
fs.writeFileSync(path.join(outDir, 'body.html'), containerMatch ? containerMatch[1] : bodyMatch[1]);

console.log('Done. CSS:', cssMatch[1].length, 'JS:', js.length);
