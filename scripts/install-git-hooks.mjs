/**
 * Point this clone at versioned hooks in githooks/ (idempotent).
 * Runs via `npm prepare` after install.
 */
import { chmodSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hook = join(root, 'githooks/pre-commit');

if (!existsSync(join(root, '.git')) && !existsSync(join(root, '.git/config'))) {
  // Not a full git checkout (e.g. npm pack / archive) — skip quietly
  process.exit(0);
}

try {
  execSync('git rev-parse --git-dir', { cwd: root, stdio: 'ignore' });
} catch {
  process.exit(0);
}

try {
  chmodSync(hook, 0o755);
} catch {
  /* Windows may ignore mode */
}

const current = execSync('git config --get core.hooksPath || true', {
  cwd: root,
  encoding: 'utf8',
}).trim();

if (current !== 'githooks') {
  try {
    execSync('git config core.hooksPath githooks', { cwd: root, stdio: 'inherit' });
    console.log('Git hooksPath → githooks/ (pre-commit runs ink:check)');
  } catch (err) {
    console.warn(
      'Could not set core.hooksPath (permission or non-git env). Run: npm run hooks:install',
    );
  }
} else {
  console.log('Git hooksPath already githooks/');
}
