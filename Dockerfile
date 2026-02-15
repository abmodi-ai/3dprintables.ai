# Stage 1: Build the frontend
FROM node:20-slim AS build
WORKDIR /app

# Vite bakes VITE_* env vars into the JS bundle at build time
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image (backend + built frontend)
FROM node:20-slim
WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from stage 1
COPY --from=build /app/dist ./dist

# Copy backend
COPY server.js ./

# Create mount point for GCS FUSE volume
RUN mkdir -p /mnt/data

EXPOSE 8080
ENV PORT=8080
ENV DB_PATH=/mnt/data/3dprintables.db

CMD ["node", "server.js"]
