FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY shared/ ./shared/
COPY server/package*.json ./server/

RUN npm install --workspace=server

COPY server/ ./server/

WORKDIR /app/server

CMD sh -c "npx tsx src/db/migrate.ts && \
  if [ \"$SEED_ON_START\" = \"true\" ]; then npx tsx src/db/seed.ts; fi && \
  npx tsx src/index.ts"
