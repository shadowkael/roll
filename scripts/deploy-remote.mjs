import { Client } from 'ssh2';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSshConfig } from './ssh-config.mjs';
import { buildSite } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function validateDeployPath(value) {
  const parts = value.split('/').filter(Boolean);
  if (!value.startsWith('/') || value.endsWith('/') || /[^a-zA-Z0-9_./-]/.test(value) || parts.length < 2 || parts.some(part => part === '.' || part === '..') || path.posix.normalize(value) !== value) {
    throw new Error('DEPLOY_PATH must be a normalized absolute site directory, e.g. /var/www/roll');
  }
  return value;
}

export function renderNginx(template, deployPath) {
  validateDeployPath(deployPath);
  const directive = 'root /var/www/roll;';
  if (!template.includes(directive)) throw new Error('Nginx template is missing the expected site root');
  return template.replace(directive, `root ${deployPath};`);
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

async function collectFiles(directory, relative = '') {
  const files = [];
  for (const entry of await fs.readdir(path.join(directory, relative), { withFileTypes: true })) {
    const next = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(directory, next));
    else if (entry.isFile()) files.push(next);
    else throw new Error(`Unsupported build entry: ${next}`);
  }
  return files.sort((a, b) => (a === 'index.html') - (b === 'index.html') || a.localeCompare(b));
}

function execute(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (error, stream) => {
      if (error) return reject(error);
      stream.on('data', data => process.stdout.write(data));
      stream.stderr.on('data', data => process.stderr.write(data));
      stream.on('error', reject);
      stream.on('close', code => code === 0 ? resolve() : reject(new Error(`Remote command exited with status ${code}`)));
    });
  });
}

async function deploy() {
  const deployPath = validateDeployPath(process.env.DEPLOY_PATH || '/var/www/roll');
  const config = buildSshConfig();
  const dist = await buildSite();
  const files = await collectFiles(dist);
  const nginx = renderNginx(await fs.readFile(path.join(root, 'deploy/nginx.conf.example'), 'utf8'), deployPath);
  const conn = new Client();
  try {
    await new Promise((resolve, reject) => {
      conn.once('ready', resolve).once('error', reject).connect(config);
    });
    // Upload only dist. Never remove or recursively synchronize a remote directory.
    const directories = [...new Set(files.map(file => path.posix.dirname(path.posix.join(deployPath, file))))];
    await execute(conn, `set -e\nmkdir -p ${directories.map(shellQuote).join(' ')}\n`);
    const sftp = await new Promise((resolve, reject) => conn.sftp((error, result) => error ? reject(error) : resolve(result)));
    console.log(`Uploading ${files.length} build files to ${deployPath}…`);
    for (const file of files) {
      await new Promise((resolve, reject) => {
        sftp.fastPut(path.join(dist, file), path.posix.join(deployPath, file), { mode: 0o644 }, error => error ? reject(error) : resolve());
      });
    }
    sftp.end();
    await execute(conn, `set -e
if ! command -v nginx >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx
  else
    echo 'Install Nginx before deploying on this server.' >&2
    exit 1
  fi
fi
cat > /etc/nginx/conf.d/roll.conf <<'NGINX_ROLL_CONFIG'
${nginx}
NGINX_ROLL_CONFIG
nginx -t
systemctl enable nginx 2>/dev/null || true
systemctl reload nginx || systemctl start nginx || service nginx restart
`);
    console.log(`Deploy complete: http://${config.host}:8000/`);
  } finally {
    conn.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  deploy().catch(error => {
    console.error(`Deploy failed: ${error.message}`);
    process.exitCode = 1;
  });
}
