# One long-running BTM authoritative WebSocket server, for VPS or Railway.
# Railway uses its assigned PORT; Docker Compose can explicitly pass --port 8787.
FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY . .
RUN npm ci --prefix server --omit=dev --ignore-scripts \
 && npm run build \
 && mkdir -p /saves \
 && chown node:node /saves \
 && cp deploy/bbs/entrypoint.sh /usr/local/bin/btm-entrypoint \
 && chmod 755 /usr/local/bin/btm-entrypoint
ENV NODE_ENV=production
EXPOSE 8787
# Entrypoint fixes root-owned runtime volume permissions, then drops to node.
ENTRYPOINT ["/usr/local/bin/btm-entrypoint"]
CMD ["node", "server/index.mjs", "--host", "0.0.0.0", "--save-dir", "/saves"]
