#!/bin/sh
# Named Docker/Railway volumes mount at runtime and may be root-owned.
# Fix permissions before dropping privileges; never run BTM game code as root.
set -eu
mkdir -p /saves
if [ "$(id -u)" -eq 0 ]; then
  chown node:node /saves
  exec su-exec node "$@"
fi
exec "$@"
