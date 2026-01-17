#!/bin/bash

# Import playlist tracks to Supabase
# Usage: ./scripts/import-playlist.sh

# Load environment variables
source .env.local 2>/dev/null || true

if [ -z "$SPOTIFY_CLIENT_SECRET" ]; then
  echo "Error: SPOTIFY_CLIENT_SECRET not found in environment"
  exit 1
fi

echo "Importing playlist tracks..."

curl -X GET "http://127.0.0.1:3000/api/admin/import-playlist" \
  -H "Authorization: Bearer $SPOTIFY_CLIENT_SECRET" \
  -H "Content-Type: application/json"

echo ""
echo "Done!"
