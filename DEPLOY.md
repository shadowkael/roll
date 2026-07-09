# GitHub Actions 部署指南

通过 push 到 `main` 分支自动将静态文件部署到公网服务器。

## 认证方式

| 场景 | 方式 |
|------|------|
| **GitHub Actions** | 密码（Secrets 中的 `SSH_PASSWORD`） |
| **本机手动部署** | 密钥（`SSH_KEY_PATH` 指向 `.pem` 文件） |

## 1. 配置 GitHub Secrets

在 GitHub 仓库 **Settings → Secrets and variables → Actions → New repository secret** 中添加：

| Secret 名称 | 值 | 必填 |
|-------------|-----|------|
| `SSH_HOST` | `139.224.30.109` | 是 |
| `SSH_USERNAME` | `root` | 是 |
| `SSH_PASSWORD` | 服务器 SSH 密码 | 是 |
| `SSH_PORT` | SSH 端口，默认 `22` | 否 |
| `DEPLOY_PATH` | 部署目录，默认 `/var/www/roll` | 否 |

> **安全提示**：密码只保存在 GitHub Secrets，不要写入代码或提交到 Git。

### 使用 GitHub CLI 设置（可选）

```bash
gh auth login
gh secret set SSH_HOST -b"139.224.30.109"
gh secret set SSH_USERNAME -b"root"
gh secret set SSH_PASSWORD -b"你的密码"
gh secret set DEPLOY_PATH -b"/var/www/roll"
```

## 2. 本机手动部署（密钥）

```powershell
$env:SSH_KEY_PATH = "C:\Users\asus\Downloads\asus_cursor.pem"
$env:SSH_USERNAME = "root"
node scripts/deploy-remote.mjs
```

验证 SSH 密钥登录：

```powershell
ssh -i "C:\Users\asus\Downloads\asus_cursor.pem" root@139.224.30.109 "echo OK"
```

## 3. 开放云服务器安全组

| 端口 | 用途 |
|------|------|
| 22 | SSH 部署 |
| 8000 | HTTP 访问 |

## 4. 触发 GitHub Actions 部署

```bash
git push origin main
```

也可在 **Actions → Deploy Roll to Server → Run workflow** 手动触发。

## 5. 验证

**http://139.224.30.109:8000/**

## 故障排查

| 问题 | 处理 |
|------|------|
| Actions SCP 失败 | 检查 `SSH_PASSWORD`、22 端口、安全组 |
| 本机 SSH 失败 | 检查 `SSH_KEY_PATH`、密钥权限 |
| 403 / 404 | 确认 `DEPLOY_PATH` 与 Nginx `root` 一致 |
