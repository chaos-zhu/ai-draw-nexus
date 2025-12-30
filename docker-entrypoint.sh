#!/bin/sh
set -e

# 启动后端服务
cd /app/server
node dist/index.js &

# 启动 nginx
nginx -g 'daemon off;'