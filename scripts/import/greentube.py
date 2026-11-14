"""
Import Novomatic (Greentube) slots from the official website (greentube.com): name, lines,
reels, themes. RTP and release date is not public (client login), so it stays TODO.
Usage: python3 -I scripts/import/greentube.py <cache_dir> <out_json>
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import fetcher, page_text, features, text, slugify

cache, out = sys.argv[1], sys.argv[2]
get = fetcher(cache)
allg = get('https://www.greentube.com/all-games/', 'all-games.html')
m = re.search(r'initGameSearch\( \$\( .#filter-widget-games. \), (\{"games".*)', allg, re.S)
dec = json.JSONDecoder()
data, _ = dec.raw_decode(m.group(1))
games = []
for e in data['games']:
    u = e['permalink'].replace('\\/', '/')
    slug = u.rstrip('/').split('/')[-1]
    s = get(u, f'g-{slug}.html')
    if not s: continue
    t = page_text(s)
    gt = re.search(r'Game Type (.+?) Volatility', t)
    if not gt or not re.search(r'reel|slot|video game', gt.group(1), re.I): continue
    name = re.sub(r'[™®©]', '', text(e['title'])).strip()
    g = {'slug': slugify(name), 'name': name, 'url': u, 'thumb': (e.get('button') or '').replace('\\/', '/') or None}
    m2 = re.search(r'(\d+)-line', gt.group(1))
    if m2: g['winLines'] = {'type': 'lines', 'count': int(m2.group(1))}
    m2 = re.search(r'(\d+)\s*-?\s*ways', gt.group(1), re.I)
    if m2: g['winLines'] = {'type': 'ways', 'count': int(m2.group(1))}
    m2 = re.search(r'Reels (\d+) Reels', t)
    if m2: g['reels'] = int(m2.group(1))
    tags = re.search(r'Client login for more data (.{0,200}?) Sitemap', t)
    g['features'] = features(gt.group(1) + ' ' + (tags.group(1) if tags else ''))
    games.append(g)
json.dump(games, open(out, 'w'), indent=1, ensure_ascii=False)
print(f"{len(data['games'])} listed, {len(games)} slots written to {out}")
