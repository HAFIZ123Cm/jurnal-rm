#!/bin/sh
# Makes the app icons from art/cat-source.jpg (centre square crop). Needs ffmpeg.
cd "$(dirname "$0")/.."
CROP="crop=608:608:240:0"
ffmpeg -v error -y -i art/cat-source.jpg -vf "$CROP,scale=512:512:flags=lanczos" icons/icon-512.png
ffmpeg -v error -y -i art/cat-source.jpg -vf "$CROP,scale=192:192:flags=lanczos" icons/icon-192.png
ffmpeg -v error -y -i art/cat-source.jpg -vf "$CROP,scale=180:180:flags=lanczos" icons/apple-touch-icon.png
echo "icons written"
# Fresh file names so installed apps don't reuse a cached old icon
cp icons/icon-192.png icons/cat-192.png; cp icons/icon-512.png icons/cat-512.png; cp icons/apple-touch-icon.png icons/cat-180.png
