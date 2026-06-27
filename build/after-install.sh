#!/bin/bash
set -e

# Fix Electron sandbox permissions so the app can launch from the desktop icon.
SANDBOX="/opt/Pomodoro/chrome-sandbox"
if [ -f "$SANDBOX" ]; then
    chmod 4755 "$SANDBOX" || true
fi
