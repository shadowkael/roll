# GitHub Actions 部署指南

通过 push 到 `main` 分支自动将静态文件部署到公网服务器。

## 认证方式

服务器当前只开放 **公钥登录**（密码登录会被拒绝），因此 Actions 与本机部署都使用 SSH 私钥。

| 场景 | 方式 |
|------|------|
| **GitHub Actions** | Secrets 中的 `SSH_PRIVATE_KEY`（私钥全文） |
| **本机手动部署** | `SSH_KEY_PATH` 指向 `.pem` / 私钥文件 |

## 1. 生成部署专用密钥（推荐）

在本机生成一对**无口令**密钥（专供 CI，勿复用个人日常密钥）：

```bash
ssh-keygen -t ed25519 -C "github-actions-roll-deploy" -f ./roll_deploy -N ""
```

把**公钥**写入服务器：

```bash
ssh -i /path/to/existing_admin.pem root@139.224.30.109 \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys" < ./roll_deploy.pub
ssh -i /path/to/existing_admin.pem root@139.224.30.109 "chmod 600 ~/.ssh/authorized_keys"
```

验证新密钥：

```bash
ssh -i ./roll_deploy -o IdentitiesOnly=yes root@139.224.30.109 "echo OK"
```

## 2. 配置 GitHub Secrets

仓库 **Settings → Secrets and variables → Actions → New repository secret**：

| Secret 名称 | 值 | 必填 |
|-------------|-----|------|
| `SSH_HOST` | `139.224.30.109` | 是 |
| `SSH_USERNAME` | `root` | 是 |
| `SSH_PRIVATE_KEY` | `roll_deploy` **私钥全文**（含 `BEGIN`/`END` 行） | 是 |
| `SSH_PASSPHRASE` | 私钥口令；无口令则不要创建此 Secret | 否 |
| `SSH_PORT` | SSH 端口，默认 `22` | 否 |
| `DEPLOY_PATH` | 部署目录，默认 `/var/www/roll` | 否 |

> 旧的 `SSH_PASSWORD` 已不再使用，可删除。私钥只放在 Secrets，不要提交到 Git。

### 使用 GitHub CLI（可选）

```bash
gh auth login
gh secret set SSH_HOST -b"139.224.30.109"
gh secret set SSH_USERNAME -b"root"
gh secret set SSH_PRIVATE_KEY < ./roll_deploy
gh secret set DEPLOY_PATH -b"/var/www/roll"
```

## 3. 本机手动部署

```bash
export SSH_KEY_PATH="/path/to/roll_deploy"   # 或 asus_cursor.pem
export SSH_USERNAME=root
npm run build
npm run deploy:remote
```

## 4. 开放云服务器安全组

| 端口 | 用途 |
|------|------|
| 22 | SSH 部署 |
| 8000 | HTTP 访问 |

## 5. 触发部署

```bash
git push origin main
```

或 **Actions → Deploy Roll to Server → Run workflow**。

## 6. 验证

**http://139.224.30.109:8000/**

确认新资产存在，例如：

```bash
curl -sI http://139.224.30.109:8000/assets/bg/bg-1.jpg
```

## 故障排查

| 问题 | 处理 |
|------|------|
| `unable to authenticate` / `attempted methods [none]` | 服务器禁用了密码登录；改用 `SSH_PRIVATE_KEY`，并确认公钥已在服务器 `authorized_keys` |
| Actions SCP 失败 | 检查私钥全文是否完整、用户名、22 端口、安全组 |
| 本机 SSH 失败 | 检查 `SSH_KEY_PATH`、`chmod 600` 私钥权限 |
| 403 / 404 | 确认 `DEPLOY_PATH` 与 Nginx `root` 一致 |
