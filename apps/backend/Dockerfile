FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install necessary build tools for Prisma and native modules
RUN apt-get update && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*

# Copy package.json
COPY package.json ./

# Bypass husky
ENV CI=true
ENV HUSKY=0
ENV NODE_ENV=development

# Copy all source files
COPY . .

# Install dependencies using yarn to avoid npm bug and pnpm v9 approve-builds restriction
RUN corepack enable && yarn install

# Generate prisma client with dummy URL to bypass Prisma 7 strict config parsing during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build the NestJS application
RUN yarn build

# --- Production Image ---
FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main.js"]
