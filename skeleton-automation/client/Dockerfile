FROM node:20-alpine

WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy shared
COPY shared/ ./shared/

# Copy client package.json
COPY client/package*.json ./client/

# Install
RUN npm install --workspace=client

# Copy source
COPY client/ ./client/

WORKDIR /app/client

# Start Vite dev server (accessible from outside container)
CMD ["npx", "vite", "--host", "0.0.0.0"]
