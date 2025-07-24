# Dockerfile for Open Archiver

# 1. Build Stage: Install all dependencies and build the project
FROM node:22-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy manifests and lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/types/package.json ./packages/types/

# Install all dependencies 
RUN pnpm install --frozen-lockfile --prod=false

# Copy the rest of the source code
COPY . .

# Build all packages
RUN pnpm build

# 2. Production Stage: Install only production dependencies and copy built artifacts
FROM node:22-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy manifests and lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/types/package.json ./packages/types/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/frontend/build ./packages/frontend/build
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/backend/drizzle.config.ts ./packages/backend/drizzle.config.ts
COPY --from=build /app/packages/backend/src/database/migrations ./packages/backend/src/database/migrations

# Expose the port the app runs on
EXPOSE 4000
EXPOSE 3000

# Start the application
CMD ["pnpm", "docker-start"]
