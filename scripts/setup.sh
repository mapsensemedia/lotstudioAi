#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
[ -f .env ] || cp .env.example .env
mkdir -p storage/{originals,masks,outputs,thumbs,audits}
npm install
echo "Setup complete. Run ./scripts/dev.sh"
