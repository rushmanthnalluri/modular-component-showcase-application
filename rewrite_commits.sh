#!/bin/bash
rm -f /tmp/commit_count
git filter-branch -f --msg-filter '
  f="/tmp/commit_count"
  if [ ! -f "$f" ]; then echo 1 > "$f"; fi
  COUNT=$(cat "$f")
  echo "commit $COUNT"
  expr $COUNT + 1 > "$f"
' HEAD
git push -f origin main
