FROM node:20-alpine

WORKDIR /app

# Copy root package.json for workspace resolution
COPY package.json ./

# Copy shared package first (workspace dependency)
COPY shared/ ./shared/

# Copy client package.json
COPY client/package*.json ./client/

# Install dependencies using workspaces
RUN npm install --workspace=client

# Copy client source
COPY client/ ./client/

WORKDIR /app/client

# Start Vite dev server (accessible from outside container)
CMD ["npx", "vite", "--host", "0.0.0.0"]
