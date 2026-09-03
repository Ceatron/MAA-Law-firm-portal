# -------------------------------------------------------------
# Multi-stage Dockerfile for Muthoni & Ahago Advocates
# Optimized for Google Cloud Run container deployment
# -------------------------------------------------------------

# Stage 1: Build application assets and bundle server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend and compile server.ts to dist/server.cjs
RUN npm run build

# Stage 2: Minimal production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend assets & backend bundle from builder
COPY --from=builder /app/dist ./dist

# Use non-root node user for container security
USER node

# Default port (Cloud Run will inject PORT environment variable)
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
