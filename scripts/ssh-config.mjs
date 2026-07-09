import fs from 'fs';

/**
 * 本机 SSH 配置：优先私钥（SSH_KEY_PATH / SSH_PRIVATE_KEY），其次密码
 * GitHub Actions 使用 workflow 中的 SSH_PASSWORD，不经过此模块
 */
export function buildSshConfig() {
  const host = process.env.SSH_HOST || '139.224.30.109';
  const port = Number(process.env.SSH_PORT || 22);
  const username = process.env.SSH_USERNAME || 'root';

  let privateKey = process.env.SSH_PRIVATE_KEY;
  if (!privateKey && process.env.SSH_KEY_PATH) {
    privateKey = fs.readFileSync(process.env.SSH_KEY_PATH, 'utf8');
  }

  if (privateKey) {
    return { host, port, username, privateKey };
  }

  if (process.env.SSH_PASSWORD) {
    return { host, port, username, password: process.env.SSH_PASSWORD };
  }

  throw new Error('Set SSH_KEY_PATH or SSH_PRIVATE_KEY (or SSH_PASSWORD as fallback)');
}
