FROM node:18-slim

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files if needed, or just backend ones
COPY backend/package*.json ./

RUN npm install

# Copy database schema
COPY database /app/database

# Copy backend source
COPY backend /app/backend

WORKDIR /app/backend

# Generate Prisma client using the absolute path to the schema
RUN npx prisma generate --schema=/app/database/schema.prisma

EXPOSE 5000

CMD ["npm", "start"]
