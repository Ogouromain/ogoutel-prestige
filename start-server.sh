#!/bin/bash
# Keep-alive dev server for OGOUTEL_Prestige
cd /home/z/my-project

while true; do
  echo "[$(date '+%H:%M:%S')] Starting Next.js dev server..."
  bun run dev 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%H:%M:%S')] Server exited with code $EXIT_CODE - Restarting in 3s..."
  sleep 3
done
