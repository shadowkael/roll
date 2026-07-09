#!/usr/bin/env bash
# 在公网服务器上首次执行（需 root）
# bash deploy/server-init.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/roll}"

echo "==> 创建部署目录: $DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"
chmod 755 "$DEPLOY_PATH"

if command -v nginx >/dev/null 2>&1; then
  echo "==> 配置 Nginx"
  cp deploy/nginx.conf.example /etc/nginx/conf.d/roll.conf
  nginx -t
  systemctl enable nginx
  systemctl reload nginx
  echo "Nginx 已就绪"
elif command -v yum >/dev/null 2>&1; then
  echo "==> 安装 Nginx (CentOS/RHEL)"
  yum install -y nginx
  cp deploy/nginx.conf.example /etc/nginx/conf.d/roll.conf
  systemctl enable nginx
  systemctl start nginx
else
  echo "请手动安装 Nginx 或 Apache，并将站点根目录指向 $DEPLOY_PATH"
fi

if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --reload || true
fi

echo "==> 服务器初始化完成"
echo "    站点目录: $DEPLOY_PATH"
echo "    访问地址: http://139.224.30.109/"
