"""
Import Hacksaw Gaming slots from the official website (hacksawgaming.com):
name, volatility (1–5 scale), win type, max win, all RTP versions.
Demos are launched via a JS launcher, so no demo URL is stored.
Usage: python3 -I scripts/import/hacksaw.py <cache_dir> <out_json>
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import fetcher, page_text, features, text

cache, out = sys.argv[1], sys.argv[2]
get = fetcher(cache)
listing = get('https://www.hacksawgaming.com/games/slots', 'slots.html')
skip = {'slots', 'scratchcards', 'instant-win-games', 'crash', 'fixed-prize-games'}
urls = sorted({f'https://www.hacksawgaming.com/games/{x}' for x in re.findall(r'href="/games/([a-z0-9-]+)"', listing)} - {f'https://www.hacksawgaming.com/games/{x}' for x in skip})
VOL = {1: 'low', 2: 'low', 3: 'medium', 4: 'high', 5: 'very-high'}
games = []
for u in urls:
    slug = u.rstrip('/').split('/')[-1]
    s = get(u, f'g-{slug}.html')
    if not s: continue
    i = s.find('GAME DATA')
    if i >= 0:
        data = text(re.split(r'WHAT TO LOOK OUT|GAME FEATURES|Col-2|Highlights', s[i:i + 2500])[0])
    else:
        data = page_text(s)
    title = re.search(r'<title>(.*?)</title>', s, re.S)
    name = text(title.group(1)).split('|')[0].strip() if title else None
    if not name: continue
    g = {'slug': slug, 'name': name, 'url': u}
    rm = re.search(r'RTPs?\s*:\s*([\d.,;%\s]+)', data)
    rtps = [float(x) for x in re.findall(r'(\d{2}(?:\.\d+)?)', rm.group(1))] if rm else []
    rtps = [x for x in rtps if 80 <= x <= 100]
    g['rtp'] = rtps if len(rtps) > 1 else (rtps[0] if rtps else None)
    m = re.search(r'Volatility\s*:\s*(\d)\s*/\s*5', data)
    if m: g['volatility'] = VOL[int(m.group(1))]; g['volatilityNote'] = f'{m.group(1)}/5'
    m = re.search(r'Max\s?win\s*:\s*(\d[\d,.\s]*?)\s*x', data, re.I)
    if m: g['maxWin'] = float(re.sub(r'[\s,]', '', m.group(1)))
    m = re.search(r'Wintype\s*:\s*(.+?)(?:Max win|RTP|Volatility|Release|$)', data, re.I)
    if m:
        w = m.group(1).lower(); n = re.search(r'(\d[\d,]*)', w)
        if 'cluster' in w: g['winLines'] = {'type': 'cluster'}
        elif 'scatter' in w or 'anywhere' in w: g['winLines'] = {'type': 'scatter-pays'}
        elif 'way' in w: g['winLines'] = {'type': 'ways', **({'count': int(n.group(1).replace(',', ''))} if n else {})}
        elif 'line' in w: g['winLines'] = {'type': 'lines', **({'count': int(n.group(1).replace(',', ''))} if n else {})}
    m = re.search(r'Release Date\s*:\s*([A-Z][a-z]+) (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})', data)
    if m:
        from datetime import datetime
        try: g['releaseDate'] = datetime.strptime(f'{m.group(1)} {m.group(2)} {m.group(3)}', '%B %d %Y').date().isoformat()
        except ValueError: pass
    g['features'] = features(page_text(s)[:6000])
    gid = re.search(r'data-gameid="(\d+)"', s)
    if gid:
        g['gameId'] = gid.group(1)
        base = f"https://static-live.hacksawgaming.com/{g['gameId']}"
        g['demo'] = (f"{base}/{{version}}/index.html?language=de&channel=desktop&gameid={g['gameId']}&mode=2&token=demo"
                     "&currency=EUR&partner=demo&env=https%3A%2F%2Frgs-demo.hacksawgaming.com%2Fapi"
                     "&realmoneyenv=https%3A%2F%2Frgs-demo.hacksawgaming.com%2Fapi")
        g['demoVersionUrl'] = f'{base}/version.json'
    games.append(g)
json.dump(games, open(out, 'w'), indent=1, ensure_ascii=False)
print(f'{len(urls)} URLs, {len(games)} slots written to {out}')
