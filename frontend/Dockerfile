FROM node:18-slim as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

FROM node:18-slim

WORKDIR /app
RUN npm install -g preview

COPY --from=build /app/dist ./dist

EXPOSE 5173

# Using a simple server to serve the build (preview or serve)
CMD ["preview", "--port", "5173", "--host"]
