import { access, cp, lstat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function publicFileFilter(source) {
  if (path.basename(source).startsWith('.')) return false;
  if ((await lstat(source)).isSymbolicLink()) throw new Error(`Build inputs must not be symbolic links: ${source}`);
  return true;
}

/** Native modules keep their relative imports. Production uses revalidation, not immutable caching. */
export async function buildSite(projectRoot = root) {
  const dist = path.join(projectRoot, 'dist');
  await Promise.all(['index.html', 'src/main.mjs', 'src/styles.css', 'public'].map(file => access(path.join(projectRoot, file))));
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  const options = { recursive: true, filter: publicFileFilter };
  await cp(path.join(projectRoot, 'index.html'), path.join(dist, 'index.html'), options);
  await cp(path.join(projectRoot, 'src'), path.join(dist, 'src'), options);
  await cp(path.join(projectRoot, 'public'), dist, options);
  return dist;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const dist = await buildSite();
    console.log(`Game built: ${path.relative(root, dist)}/ (native ES modules and public assets)`);
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
