"""
Import NetEnt slots from the official website (netent.com): RTP, release date,
hit frequency, max payout, reels/rows, stake range, lines. Demo: official netent.com demo page.
Usage: python3 -I scripts/import/netent.py <cache_dir> <out_json>
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import fetcher, page_text, features, text

cache, out = sys.argv[1], sys.argv[2]
get = fetcher(cache)
sm = get('https://netent.com/sitemap-0.xml', 'sitemap-0.xml')
urls = sorted(set(re.findall(r'<loc>(https://netent\.com/games/[a-z0-9-]+)/?</loc>', sm)))
games = []
for u in urls:
    slug = u.rstrip('/').split('/')[-1]
    s = get(u, f'g-{slug}.html')
    if not s: continue
    t = page_text(s)
    if 'Reels/Rows' not in t: continue
    title = re.search(r'<title>(.*?)</title>', s, re.S)
    name = re.sub(r'[™®©]', '', text(title.group(1)).split(' Slot - ')[0].split(' | ')[0]).strip() if title else None
    if not name: continue
    ic = re.search(r'"url":"(https://fan-cdn\.nolimitcity\.com/small_[^"]*icon[^"]*\.png)"', s)
    g = {'slug': slug, 'name': name, 'url': u, 'demo': f'https://netent.com/demo/{slug}', 'thumb': ic.group(1) if ic else None}
    m = re.search(r'([\d.]+)% RTP Volatility', t); g['rtp'] = float(m.group(1)) if m else None
    if g['rtp'] is not None and not 80 <= g['rtp'] <= 100: g['rtp'] = None
    m = re.search(r'"releaseDate":"(\d{4}-\d{2}-\d{2})', s)
    if m: g['releaseDate'] = m.group(1)
    m = re.search(r'([\d.]+)% Hit Frequency', t)
    if m and float(m.group(1)) > 0: g['hitRate'] = round(100 / float(m.group(1)), 2)
    m = re.search(r'([\d,. ]+) x bet Max payout', t)
    if m:
        try: g['maxWin'] = float(m.group(1).replace(',', '').replace(' ', ''))
        except ValueError: pass
    m = re.search(r'(\d+)\s*x\s*(\d+(?:-\d+)?) Reels/Rows', t)
    if m:
        g['reels'] = int(m.group(1)); r = m.group(2); g['rows'] = int(r) if r.isdigit() else r
    m = re.search(r'€([\d.,]+) / €([\d.,]+) Min/Max bet', t)
    if m:
        g['minStake'] = float(m.group(1).replace(',', '')); g['maxStake'] = float(m.group(2).replace(',', ''))
    m = re.search(r'([\d,]+) (Play lines|Ways|Bet ways|Lines)', t)
    if m:
        n = int(m.group(1).replace(',', ''))
        g['winLines'] = {'type': 'lines' if 'line' in m.group(2).lower() else 'ways', 'count': n}
    m = re.search(r'"volatility":([\d.]+)', s)
    if m: g['volatilityNote'] = f'NetEnt-Wert {m.group(1)}'
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    i = t.find('Game Features')
    g['features'] = [f for f in features((desc.group(1) if desc else '') + ' ' + (t[i:i + 4000] if i >= 0 else '')) if f != 'bonus-buy']
    if 'Feature buy-in Yes' in t: g['features'].append('bonus-buy')
    games.append(g)
json.dump(games, open(out, 'w'), indent=1, ensure_ascii=False)
print(f'{len(urls)} URLs, {len(games)} slots written to {out}')
