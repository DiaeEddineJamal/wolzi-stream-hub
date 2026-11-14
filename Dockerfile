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
# node-tls-client otherwise downloads this library from GitHub's API on first use, and exits the
# whole process when that is refused (shared hosts hit the API rate limit). Pinned and verified.
ARG TLS_CLIENT_URL=https://github.com/bogdanfinn/tls-client/releases/download/v1.18.1/tls-client-linux-ubuntu-amd64-1.18.1.so
ARG TLS_CLIENT_SHA256=719ad7f9772d4a72572e4eb9c1aace289a13eaa9bf3862c32f5dce6222d5644f
RUN node -e "fetch(process.env.TLS_CLIENT_URL).then(r=>{if(!r.ok)throw new Error('download '+r.status);return r.arrayBuffer()}).then(b=>{const d=Buffer.from(b);const h=require('crypto').createHash('sha256').update(d).digest('hex');if(h!==process.env.TLS_CLIENT_SHA256)throw new Error('checksum '+h);require('fs').writeFileSync('/tmp/tls-client-x64.so',d,{mode:0o644})}).catch(e=>{console.error(e);process.exit(1)})"
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist-server ./dist-server
COPY package.json ./
ENV NODE_ENV=production PORT=8080 MEDIA_RELAY_BYTES=0
USER node
EXPOSE 8080
CMD ["node", "dist-server/index.mjs"]
