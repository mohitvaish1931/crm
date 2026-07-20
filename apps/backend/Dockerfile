FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and lock files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code and prisma schema
COPY . .

# Generate prisma client
RUN pnpm prisma generate

# Build the NestJS application
RUN pnpm build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose API port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
