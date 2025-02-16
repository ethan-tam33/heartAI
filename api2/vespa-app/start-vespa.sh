#!/bin/bash
# Remove set -e to prevent premature exit; we'll handle errors manually.
echo "[Dockerfile] Starting Vespa..."
# /opt/vespa/bin/vespa start

echo "[Dockerfile] Sleeping 15s to let the config server start..."
sleep 15

echo "[Dockerfile] Deploying from /app..."
cd /app
if ! /opt/vespa/bin/vespa deploy ; then
    echo "[WARNING] Deploy failed!"
fi

# Ensure the log file exists (tail -F exits immediately if file is missing)
touch /opt/vespa/logs/vespa/vespa.log

echo "[Dockerfile] Keeping container alive by tailing logs..."
tail -F /opt/vespa/logs/vespa/vespa.log
