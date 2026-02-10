FROM node:20-alpine

WORKDIR /app

# Copy root package.json for workspace resolution
COPY package.json ./

# Copy shared package (workspace dependency)
COPY shared/ ./shared/

# Copy server package.json
COPY server/package*.json ./server/

# Install dependencies via workspaces
RUN npm install --workspace=server

# Copy server source
COPY server/ ./server/

WORKDIR /app/server

# Run migrations always, seed conditionally, then start
CMD sh -c "npx tsx src/db/migrate.ts && \
  if [ \"$SEED_ON_START\" = \"true\" ]; then npx tsx src/db/seed.ts; fi && \
  npx tsx src/index.ts"
