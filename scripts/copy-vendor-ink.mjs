import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/inkjs/dist/ink.mjs');
const dest = join(root, 'js/vendor/ink.mjs');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log('Copied ink.mjs -> js/vendor/ink.mjs');
