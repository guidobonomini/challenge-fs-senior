# Multi-stage build for Node.js backend
FROM node:18-alpine AS base
# Install system dependencies
RUN apk add --no-cache libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY backend/package.json backend/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Build the source code only when needed
FROM base AS builder
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY backend/knexfile.js ./
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/knexfile.js ./
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy database directory from build context (root level)
COPY --chown=nodejs:nodejs database ./database

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Create uploads directory for file uploads
RUN mkdir -p uploads && chown nodejs:nodejs uploads

USER nodejs

EXPOSE 8000

ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/src/server.js"]