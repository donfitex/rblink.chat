#!/usr/bin/env bash
set -e

echo "========================================================"
echo "       🚀 STARTING RBLINK.CHAT COLLABORATION PLATFORM"
echo "========================================================"
echo ""

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH!"
    echo "Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Launching rblink.chat server on http://localhost:3001 ..."
if command -v open &> /dev/null; then
    open "http://localhost:3001" &
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3001" &
fi

[ -d dist ] || npm run build
npm run serve
