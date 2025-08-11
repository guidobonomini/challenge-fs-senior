# Multi-stage build for React frontend
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Environment variables for build
ENV REACT_APP_API_URL=http://localhost:8000/api
ENV NODE_ENV=production

RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Create nginx user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of nginx directories
RUN chown -R nodejs:nodejs /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html
RUN chmod -R 755 /var/cache/nginx /var/run /var/log/nginx

# Create nginx pid directory with proper permissions
RUN mkdir -p /run && chown nodejs:nodejs /run

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"]