#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev -p 3000 -H 0.0.0.0 --turbopack >> dev.log 2>&1
  echo "$(date): Server exited, restarting in 2s..." >> dev.log
  sleep 2
done
