import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSshConfig } from './ssh-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const config = buildSshConfig();

const nginxConf = fs.readFileSync(path.join(root, 'deploy/nginx.conf.example'), 'utf8');

const commands = `
set -e
mkdir -p /var/www/roll
chmod 755 /var/www/roll
if command -v nginx >/dev/null 2>&1; then
  echo "nginx already installed"
else
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
echo "Server init OK"
`;

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(commands, (err, stream) => {
      if (err) throw err;
      stream
        .on('close', (code) => {
          conn.end();
          process.exit(code || 0);
        })
        .on('data', (d) => process.stdout.write(d))
        .stderr.on('data', (d) => process.stderr.write(d));
    });
  })
  .on('error', (err) => {
    console.error('SSH error:', err.message);
    process.exit(1);
  })
  .connect(config);
