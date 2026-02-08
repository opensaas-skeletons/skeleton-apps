FROM node:20-alpine

WORKDIR /app

# Copy shared types
COPY shared/ ./shared/

# Install client dependencies
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

# Copy client source
COPY client/ ./

# Start Vite dev server (accessible from outside container)
CMD ["npx", "vite", "--host", "0.0.0.0"]
