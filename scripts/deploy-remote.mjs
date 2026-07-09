import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSshConfig } from './ssh-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const config = buildSshConfig();

const DEPLOY_PATH = process.env.DEPLOY_PATH || '/var/www/roll';

function collectFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full, base));
    else files.push({ local: full, remote: path.join(DEPLOY_PATH, path.relative(base, full)).replace(/\\/g, '/') });
  }
  return files;
}

const uploadRoots = ['index.html', 'css', 'js', 'assets'];
const files = uploadRoots.flatMap((item) => {
  const local = path.join(root, item);
  if (!fs.existsSync(local)) return [];
  if (fs.statSync(local).isDirectory()) return collectFiles(local, local).map(f => ({
    ...f,
    remote: path.join(DEPLOY_PATH, item, path.relative(local, f.local)).replace(/\\/g, '/'),
  }));
  return [{ local, remote: path.join(DEPLOY_PATH, item).replace(/\\/g, '/') }];
});

const nginxConf = fs.readFileSync(path.join(root, 'deploy/nginx.conf.example'), 'utf8');

const initScript = `
set -e
mkdir -p ${DEPLOY_PATH}
chmod 755 ${DEPLOY_PATH}
if ! command -v nginx >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx
  fi
fi
cat > /etc/nginx/conf.d/roll.conf << 'NGINXEOF'
${nginxConf}
NGINXEOF
nginx -t
systemctl enable nginx 2>/dev/null || true
systemctl restart nginx || service nginx restart
echo INIT_OK
`;

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d); });
      stream.stderr.on('data', d => process.stderr.write(d));
      stream.on('close', code => code === 0 ? resolve(out) : reject(new Error(`exit ${code}`)));
    });
  });
}

function mkdirp(sftp, dir) {
  const parts = dir.split('/').filter(Boolean);
  let current = '';
  return parts.reduce((chain, part) => {
    current += '/' + part;
    return chain.then(() => new Promise(resolve => {
      sftp.mkdir(current, { mode: 0o755 }, () => resolve());
    }));
  }, Promise.resolve());
}

function upload(sftp, local, remote) {
  const localPath = path.resolve(local);
  return mkdirp(sftp, path.posix.dirname(remote)).then(() => new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remote, err => (err ? reject(err) : resolve()));
  }));
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      console.log('==> Initializing server...');
      await exec(conn, initScript);

      await exec(conn, `mkdir -p ${DEPLOY_PATH}/css ${DEPLOY_PATH}/js/scenes ${DEPLOY_PATH}/assets/bg`);

      console.log(`==> Uploading ${files.length} files to ${DEPLOY_PATH}...`);
      const sftp = await new Promise((resolve, reject) => {
        conn.sftp((err, s) => (err ? reject(err) : resolve(s)));
      });

      for (const f of files) {
        if (!fs.existsSync(f.local)) {
          throw new Error(`Local file missing: ${f.local}`);
        }
        process.stdout.write(`  ${f.remote}\n`);
        try {
          await upload(sftp, f.local, f.remote);
        } catch (err) {
          throw new Error(`${f.local} -> ${f.remote}: ${err.message}`);
        }
      }

      await exec(conn, `chmod -R a+rX ${DEPLOY_PATH} && echo DEPLOY_OK`);
      console.log('\n==> Deploy complete: http://139.224.30.109:8000/');
      conn.end();
    } catch (e) {
      console.error('Deploy failed:', e.message);
      conn.end();
      process.exit(1);
    }
  })
  .on('error', err => {
    console.error('SSH error:', err.message);
    process.exit(1);
  })
  .connect(config);
