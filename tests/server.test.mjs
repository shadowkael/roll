import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createDevServer } from '../scripts/dev.mjs';
import { buildSite } from '../scripts/build.mjs';
import { renderNginx, validateDeployPath } from '../scripts/deploy-remote.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'roll-server-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src'), { recursive: true });
  await mkdir(path.join(root, 'public/art'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<script type="module" src="/src/main.mjs"></script>');
  await writeFile(path.join(root, 'src/main.mjs'), 'import "./world.mjs";');
  await writeFile(path.join(root, 'src/world.mjs'), 'export const campus = true;');
  await writeFile(path.join(root, 'src/styles.css'), 'body { margin: 0; }');
  await writeFile(path.join(root, 'public/art/校园 图.svg'), '<svg></svg>');
  await writeFile(path.join(root, 'secret.txt'), 'private fixture');
  await writeFile(path.join(root, 'public/.env'), 'private fixture');
  return root;
}

function request(server, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: pathname, method }, res => {
      const chunks = [];
      res.on('data', data => chunks.push(data));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function startServer(t) {
  const root = await fixture(t);
  const server = createDevServer({ root });
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return { server, root };
}

test('dev server resolves the entry, modules, styles and encoded public asset names', async t => {
  const { server } = await startServer(t);
  const entry = await request(server, '/');
  assert.equal(entry.status, 200);
  assert.match(entry.headers['content-type'], /^text\/html/);
  const script = await request(server, '/src/main.mjs?v=2');
  assert.equal(script.status, 200);
  assert.match(script.headers['content-type'], /^application\/javascript/);
  assert.equal(script.headers['cache-control'], 'no-store');
  assert.equal(script.body, 'import "./world.mjs";');
  const style = await request(server, '/src/styles.css');
  assert.match(style.headers['content-type'], /^text\/css/);
  const art = await request(server, `/art/${encodeURIComponent('校园 图.svg')}`);
  assert.equal(art.status, 200);
  assert.equal(art.headers['content-type'], 'image/svg+xml');
});

test('HEAD returns metadata without a body and unsupported methods are rejected', async t => {
  const { server } = await startServer(t);
  const get = await request(server, '/src/main.mjs');
  const head = await request(server, '/src/main.mjs', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.headers['content-length'], get.headers['content-length']);
  assert.equal(head.body, '');
  assert.equal((await request(server, '/missing', 'HEAD')).body, '');
  const post = await request(server, '/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('missing modules do not fall back to HTML and private files are inaccessible', async t => {
  const { server, root } = await startServer(t);
  await symlink(path.join(root, 'secret.txt'), path.join(root, 'public/art/escape.txt'));
  for (const pathname of ['/secret.txt', '/src/missing.mjs', '/src/', '/art/']) {
    assert.equal((await request(server, pathname)).status, 404, pathname);
  }
  for (const pathname of ['/../secret.txt', '/src/%2e%2e/secret.txt', '/art/%2e%2e/%2e%2e/secret.txt', '/.env', '/src/%5c..%5csecret.txt', '/art/escape.txt', '/src/%00']) {
    assert.equal((await request(server, pathname)).status, 403, pathname);
  }
  assert.equal((await request(server, '/art/%E0%A4%A')).status, 400);
});

test('build replaces stale output and preserves native module and public URL layout', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'dist/stale.js'), 'old');
  const dist = await buildSite(root);
  assert.equal(await readFile(path.join(dist, 'src/main.mjs'), 'utf8'), 'import "./world.mjs";');
  assert.equal(await readFile(path.join(dist, 'art/校园 图.svg'), 'utf8'), '<svg></svg>');
  assert.equal(await readFile(path.join(dist, 'index.html'), 'utf8'), '<script type="module" src="/src/main.mjs"></script>');
  const entries = await readdir(dist);
  assert.ok(!entries.includes('stale.js'));
  assert.ok(!entries.includes('secret.txt'));
  assert.ok(!entries.includes('public'));
  assert.ok(!entries.includes('.env'));
});

test('build rejects symbolic links so private files cannot be copied through public assets', async t => {
  const root = await fixture(t);
  await symlink(path.join(root, 'secret.txt'), path.join(root, 'public/art/escape.txt'));
  await assert.rejects(buildSite(root), /must not be symbolic links/);
});

test('deployment validates directory paths and Nginx uses that exact destination', async () => {
  assert.equal(validateDeployPath('/srv/games/roll'), '/srv/games/roll');
  for (const value of ['/', '/var', 'dist', '/var/www/../etc', '/var/www/roll/', '/var//www', '/var/www/roll;echo', '/var/www/roll\n']) {
    assert.throws(() => validateDeployPath(value), /DEPLOY_PATH/);
  }
  const template = await readFile(new URL('../deploy/nginx.conf.example', import.meta.url), 'utf8');
  const rendered = renderNginx(template, '/srv/games/roll');
  assert.match(rendered, /root \/srv\/games\/roll;/);
  assert.match(rendered, /Cache-Control "no-cache"/);
  assert.doesNotMatch(rendered, /immutable/);
  assert.match(rendered, /application\/javascript mjs/);
});
