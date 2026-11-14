#!/usr/bin/env bash
# Re-parse all cached official pages and regenerate src/data/slots (no network with OFFLINE=1).
# Usage: OFFLINE=1 scripts/import/run-all.sh <cache-root> <out-dir> <verified-date>
set -euo pipefail
C="$1"; O="$2"; D="$3"; I="$(dirname "$0")"
python3 -I "$I/pragmatic.py" "$C/pp-cache" "$O/pragmatic.json"
python3 -I "$I/hacksaw.py" "$C/hs-cache" "$O/hacksaw.json"
python3 -I "$I/bgaming.py" "$C/bg-cache" "$O/bgaming.json"
python3 -I "$I/netent.py" "$C/netent-cache" "$O/netent.json"
python3 -I "$I/playngo.py" "$C/playngo-cache" "$O/playngo.json"
python3 -I "$I/greentube.py" "$C/greentube-cache" "$O/greentube.json" || echo "greentube skipped"
python3 -I "$I/to-data.py" "$O/pragmatic.json" pragmatic-play 'Pragmatic Play' "$D" 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol={symbol}&websiteUrl=https%3A%2F%2Fdemogamesfree.pragmaticplay.net&jurisdiction=99&lang=de&cur=EUR'
python3 -I "$I/to-data.py" "$O/hacksaw.json" hacksaw-gaming 'Hacksaw Gaming' "$D"
python3 -I "$I/to-data.py" "$O/bgaming.json" bgaming 'BGaming' "$D"
python3 -I "$I/to-data.py" "$O/netent.json" netent 'NetEnt' "$D"
python3 -I "$I/to-data.py" "$O/playngo.json" play-n-go "Play'n GO" "$D"
[ -f "$O/greentube.json" ] && python3 -I "$I/to-data.py" "$O/greentube.json" novomatic 'Novomatic' "$D" || true
