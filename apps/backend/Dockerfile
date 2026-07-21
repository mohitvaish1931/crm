FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json (no lockfile needed, we will generate it)
COPY package*.json ./

# Bypass husky
ENV CI=true
ENV HUSKY=0

# Copy all source files
COPY . .

# Install dependencies and generate lockfile on the fly
RUN pnpm install --no-frozen-lockfile

# Generate prisma client
RUN pnpm prisma generate

# Build the NestJS application
RUN pnpm build

# --- Production Image ---
FROM node:22-alpine

WORKDIR /app
RUN npm install -g pnpm

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main.js"]
