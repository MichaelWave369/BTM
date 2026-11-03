# Portable authoritative Node/WebSocket host, kept off Netlify Functions.
# Build from BTM repo root using deploy/bbs/compose.yaml.
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --prefix server --omit=dev --ignore-scripts \
 && npm run build \
 && mkdir -p /saves \
 && chown node:node /saves
ENV NODE_ENV=production
EXPOSE 8787
USER node
CMD ["node", "server/index.mjs", "--host", "0.0.0.0", "--port", "8787", "--save-dir", "/saves"]
