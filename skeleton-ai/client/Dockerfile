FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY shared/ ./shared/
COPY client/package*.json ./client/

RUN npm install --workspace=client

COPY client/ ./client/

WORKDIR /app/client

CMD ["npx", "vite", "--host", "0.0.0.0"]
