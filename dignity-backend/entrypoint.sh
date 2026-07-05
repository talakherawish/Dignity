#!/bin/sh
set -e

# Railway's persistent volume resets ownership to root each time it mounts,
# so we fix permissions at container startup (as root) before dropping to
# the restricted nextjs user to actually run the app.
mkdir -p /app/media
chown -R nextjs:nodejs /app/media

exec su-exec nextjs "$@"
