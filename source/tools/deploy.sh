#!/bin/sh
# Build the offline file + the installable web app, copy them and the source into the GitHub Pages repo, push.
# Usage: MSG="what changed" NOTE="short note shown in the update bar" ./tools/deploy.sh
set -e
LAB=$(cd "$(dirname "$0")/.." && pwd)
REPO=${REPO:-/home/claude/electrical-lab}
cd "$LAB"
node build.js
NOTE="$NOTE" node tools/pwa.js
cp -r pwa/. "$REPO"/
cp dist/electrical-lab.html "$REPO"/electrical-lab.html
rm -rf "$REPO/source" && mkdir -p "$REPO/source"
tar --exclude=./dist --exclude=./pwa --exclude=./.git --exclude=./node_modules --exclude='./test/*.png' -cf - . | tar -xf - -C "$REPO/source"
cd "$REPO"
git add -A
git -c user.name="Momen Fouad" -c user.email="MomenFouad93@users.noreply.github.com" commit -q -F - <<MSG
${MSG:-Update}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JTXrCgRszfXidh41fugtWm
MSG
git -c push.negotiate=true push -q origin main
echo "deployed $(cat "$LAB/dist/build.txt")"
