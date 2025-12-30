# ==================== 前端构建阶段 ====================
FROM node:22-alpine AS frontend-builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制前端依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装前端依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY . .

# 构建前端应用（设置 API 地址为相对路径）
ENV VITE_API_BASE_URL=/api
RUN pnpm run build

# ==================== 后端构建阶段 ====================
FROM node:22-alpine AS backend-builder

WORKDIR /app/server

# 复制后端依赖文件
COPY server/package.json ./

# 安装后端依赖
RUN npm install

# 复制后端源代码
COPY server/ ./

# 构建后端
RUN npm run build

# ==================== 生产阶段 ====================
FROM node:22-alpine AS production

WORKDIR /app

# 安装 nginx
RUN apk add --no-cache nginx

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/http.d/default.conf

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 从后端构建阶段复制构建产物
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/package.json ./server/

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80

# 启动服务
ENTRYPOINT ["/docker-entrypoint.sh"]