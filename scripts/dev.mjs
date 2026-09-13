import http from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
};

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

/** Serve only the game entry, src modules and public assets. Never expose the repository. */
export function createDevServer({ root = projectRoot } = {}) {
  return http.createServer(async (req, res) => {
    const reply = (status, message, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
      res.end(req.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405, 'Method not allowed', { Allow: 'GET, HEAD' });
    let pathname;
    try {
      pathname = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch {
      return reply(400, 'Invalid URL');
    }
    const segments = pathname.split('/');
    if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || segments.some(part => part.startsWith('.'))) {
      return reply(403, 'Forbidden');
    }
    let base;
    let filename;
    if (pathname === '/' || pathname === '/index.html') {
      base = root;
      filename = path.join(root, 'index.html');
    } else if (pathname.startsWith('/src/')) {
      base = path.join(root, 'src');
      filename = path.join(base, pathname.slice('/src/'.length));
    } else {
      base = path.join(root, 'public');
      filename = path.join(base, pathname.slice(1));
    }
    try {
      const [realBase, realFile] = await Promise.all([realpath(base), realpath(filename)]);
      if (!inside(realBase, realFile)) return reply(403, 'Forbidden');
      const fileStat = await stat(realFile);
      if (!fileStat.isFile()) return reply(404, 'Not found');
      res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(realFile).toLowerCase()] || 'application/octet-stream',
        'Content-Length': fileStat.size,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      if (req.method === 'HEAD') return res.end();
      const stream = createReadStream(realFile);
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch (error) {
      reply(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500, 'Not found');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let port = 3000;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1])) {
      console.error('Usage: npm run dev -- --port 3000');
      process.exit(1);
    }
    port = Number(args[1]);
    if (port < 1 || port > 65535) {
      console.error('Port must be between 1 and 65535.');
      process.exit(1);
    }
  }
  const server = createDevServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Try npm run dev -- --port ${port + 1}` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log(`那个谁 · http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
