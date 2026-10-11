# Works on any host that runs Docker (Fly.io, Railway, Google Cloud Run, a VPS...)
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "server/index.js"]
