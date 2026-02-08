FROM node:20-alpine

WORKDIR /app

# Copy shared types first (dependency for server)
COPY shared/ ./shared/

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy server source
COPY server/ ./

# Run migrations always, seed only if SEED_ON_START=true
CMD sh -c "npx tsx src/db/migrate.ts && \
  if [ \"$SEED_ON_START\" = \"true\" ]; then npx tsx src/db/seed.ts; fi && \
  npx tsx src/index.ts"
