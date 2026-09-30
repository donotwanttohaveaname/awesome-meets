#!/usr/bin/env bash
# Renders the share thumbnails from tools/thumb.html into assets/img/.
#   og-<page>.png      1200 x 630   the link preview (its middle square is safe to crop)
#   square-<page>.png  1080 x 1080  the same design as a true square, for posts
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for page in home join about data; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=9000 --window-size=1200,630 \
    --screenshot="$PWD/assets/img/og-$page.png" "file://$PWD/tools/thumb.html#$page" 2>/dev/null
  "$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=9000 --window-size=1080,1080 \
    --screenshot="$PWD/assets/img/square-$page.png" "file://$PWD/tools/thumb.html#$page,square" 2>/dev/null
  echo "rendered $page"
done
cp assets/img/og-home.png assets/img/og.png   # older shares still point at og.png
