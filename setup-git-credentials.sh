#!/bin/bash
# Usage: ./setup-git-credentials.sh <github-token>
# Get token at: https://github.com/settings/tokens (classic, needs repo scope)

if [ -z "$1" ]; then
  echo "Usage: $0 <github-personal-access-token>"
  echo "Get token: https://github.com/settings/tokens (classic, select 'repo' scope)"
  exit 1
fi

TOKEN="$1"
REPO="MetaWu2077/ad-ai-wiz"

git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
echo "Git remote updated. Testing push..."
git push origin main