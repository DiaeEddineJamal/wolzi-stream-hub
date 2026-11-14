# Playback API (server/index.ts) as a container, e.g. Back4App Containers (free, no card).
# The site itself is on Cloudflare Pages; see DEPLOY.md.
# Runtime env: PROXY_SECRET (same value as in Cloudflare Pages) and TMDB_API_KEY.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:server && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist-server ./dist-server
COPY package.json ./
ENV NODE_ENV=production PORT=8080 MEDIA_RELAY_BYTES=0
USER node
EXPOSE 8080
CMD ["node", "dist-server/index.mjs"]
