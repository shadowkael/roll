# 《那个谁》构建与部署

当前军训篇使用浏览器原生 ES 模块和 Canvas 2D。`npm run build` 只输出游戏运行需要的 `dist/`，本机部署与 GitHub Actions 均上传这个完整目录。旧 Ink 编译、vendor 拷贝和 Git 安装 hooks 已退出构建流程。

## 本地运行与检查

需要 Node.js 22 或更新版本；CI 使用 Node.js 24。

```bash
npm ci --omit=optional
npm run dev
```

打开 http://127.0.0.1:3000/。端口被占用时运行 `npm run dev -- --port 3001`。开发服务器仅监听本机地址，提供 `/src/` 模块和 `public/` 中的公开资源；不会把整个仓库开放给浏览器。

```bash
npm test
npm run build
```

构建结果为 `dist/index.html`、`dist/src/`、`dist/art/` 等。`public/` 内容直接复制到 `dist/` 根目录。构建不压缩、改写模块导入路径；Nginx 对所有文件设置 `Cache-Control: no-cache`，浏览器每次访问均重新验证缓存。不要对这些固定文件名配置 `immutable` 或七天强缓存。

## 现有站点与认证

**2026-09-13 核验：[当前军训篇已在线](http://139.224.30.109:8000/)。** 线上 9 个公开文件与本地提交 `eb6d132` 的 `dist/` 逐项 SHA-256 完全一致；文件均返回 200、正确 MIME、`Cache-Control: no-cache` 和 `X-Content-Type-Options: nosniff`，不存在的 `.mjs` 返回 404。本次只读确认现有线上版本，没有重新上传或修改服务器配置；此记录覆盖文件和 HTTP 层，不代表额外完成一次线上全章浏览器回归。

**2026-09-14 工作区状态：** 本轮近景演出与音乐增强尚未发布，当前 `dist/` 已不同于上述线上版本。发布时需上传完整构建，包括新增 `scene-content.mjs`、`cinematic.mjs`、`audio.mjs`、`encounter.css` 和 `art/scene-backgrounds.png`；不能沿用旧版九文件清单作为新版验收清单。

默认站点目录为 `/var/www/roll`。云安全组需要开放 HTTP 8000；部署通道使用 SSH 22。SSH 服务器使用公钥认证；私钥不得提交到仓库或输出到日志。

本次本机 `id_ed25519`、`id_rsa` 及系统 SSH 尝试均未通过认证，`gh` 也未登录。后续发布更新前需恢复可用的部署私钥／服务器授权或 GitHub 操作认证；这些操作限制不影响当前已经在线的版本。本次没有推送代码，也没有触发 CI。

GitHub 仓库的 Settings → Secrets and variables → Actions 中保留以下配置：

- `SSH_HOST`：现有服务器地址。
- `SSH_USERNAME`：现有部署账号，当前为 `root`。
- `SSH_PRIVATE_KEY`：部署私钥全文。
- `SSH_PORT`：可选，默认 `22`。
- `DEPLOY_PATH`：可选，默认 `/var/www/roll`。使用规范绝对路径，至少含两级目录，不含空格、引号、`.` 或 `..` 路径段。

若使用带口令的私钥，可在 Actions 的 `key` 参数旁增加 `passphrase: ${{ secrets.SSH_PASSPHRASE }}`，并配置相应 Secret。

## 本机手动部署

沿用已配置的 SSH 私钥和账号，确认本地测试通过后执行：

```bash
export SSH_KEY_PATH="/path/to/your/deploy-key"
export SSH_USERNAME="root"
# 如需覆盖默认值：export SSH_HOST="your-existing-host"
# 如需覆盖默认值：export DEPLOY_PATH="/var/www/roll"
npm test
npm run deploy:remote
```

也可用 `SSH_PRIVATE_KEY` 提供密钥内容。脚本会重新构建 `dist/`，上传全部构建文件，再安装或检查 Nginx，写入 `/etc/nginx/conf.d/roll.conf` 并验证、重载配置。Nginx 的 `root` 始终替换为同一个 `DEPLOY_PATH`，不会发生上传路径与站点目录不一致。

该命令会修改远端站点；仅在准备发布时运行。上传使用覆盖方式，不递归删除远端目录。旧版本多余文件可能留存，但入口只引用当前构建；如需清理旧文件，应单独核对待删除清单。

## GitHub Actions 自动部署

推送到 `main` 或手动运行 “Deploy Roll to Server” 时，工作流依次执行依赖安装、全部测试、构建与上传。SCP 来源为 `dist/*`，使用 `strip_components: 1`，因此服务器收到的是 `index.html`、`src/`、`art/`，而不是额外嵌套的 `dist/`。

CI 需要服务器已安装 Nginx，部署账号有写入站点目录与 `/etc/nginx/conf.d/roll.conf`、重载 Nginx 的权限。第一次部署使用上面的 `npm run deploy:remote` 完成初始化；过时的独立初始化脚本已经移除，避免多套配置出现差异。

CI 不删除远端目录，也不会上传 `.git`、私钥、环境变量、文档或旧版工程。

## 验证与排查

```bash
curl -I http://139.224.30.109:8000/
curl -I http://139.224.30.109:8000/src/main.mjs
curl -I http://139.224.30.109:8000/src/styles.css
```

入口应返回 200；模块的 `Content-Type` 应为 `application/javascript`，样式应为 `text/css`，所有响应应包含 `Cache-Control: no-cache`。如果收到 404，检查上传是否误嵌套了一层 `dist`；如果模块被浏览器拒绝，检查是否加载了当前 Nginx 配置。

出现认证错误时检查私钥完整性、账号和服务器 `authorized_keys`。出现 403 时检查站点父目录是否允许 Nginx 访问，以及构建文件是否可读。Nginx 重载失败时先执行 `nginx -t` 查看具体原因。
