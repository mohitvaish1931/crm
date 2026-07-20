FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# Copy everything from the root of the monorepo
COPY . .

# Install all dependencies across the monorepo
RUN pnpm install --frozen-lockfile

# Generate prisma client specifically for the backend
RUN cd apps/backend && pnpm prisma generate

# Build the backend application
RUN pnpm --filter backend build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

# Copy workspace setup and built backend
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend ./apps/backend

EXPOSE 3000

# Start server
CMD ["sh", "-c", "cd apps/backend && npx prisma db push --accept-data-loss && node dist/src/main.js"]
