#!/bin/sh
set -e

# 生成运行时配置文件
# 这允许在容器运行时通过环境变量配置前端参数
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  DAILY_QUOTA: ${DAILY_QUOTA:-10}
};
EOF

echo "Runtime config generated with DAILY_QUOTA=${DAILY_QUOTA:-10}"

# 启动后端服务
cd /app/server
node dist/index.js &

# 启动 nginx
nginx -g 'daemon off;'