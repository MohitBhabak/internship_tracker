#!/bin/bash
# Ignored Build Step for Vercel
# Prevents unnecessary rebuilds on automated 15-minute GitHub Actions commits
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"Update watcher state"* ]] || [[ "$VERCEL_GIT_COMMIT_AUTHOR_LOGIN" == "github-actions[bot]" ]]; then
  echo "🛑 Automated watcher update: Skipping Vercel build (dashboard fetches latest jobs dynamically via API)"
  exit 0
else
  echo "✅ Code update detected: Proceeding with Vercel build"
  exit 1
fi
