"""
Import Play'n GO video slots from the official website (playngo.com): name, release date,
themes, feature keywords from the official description, official demo launcher.
Usage: python3 -I scripts/import/playngo.py <cache_dir> <out_json>
"""
import json, re, sys, os, html
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import fetcher, page_text, features, text

cache, out = sys.argv[1], sys.argv[2]
get = fetcher(cache)
sm = get('https://www.playngo.com/sitemap.xml', 'sitemap.xml')
urls = sorted(set(re.findall(r'<loc>(https://www\.playngo\.com/games/[a-z0-9-]+)/?</loc>', sm)))
games = []
for u in urls:
    slug = u.rstrip('/').split('/')[-1]
    s = get(u, f'g-{slug}.html')
    if not s: continue
    t = page_text(s)
    if 'Game Type: Video Slot' not in t: continue
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    name = re.sub(r'[™®©]', '', text(h1.group(1))).strip() if h1 else None
    if not name: continue
    g = {'slug': slug, 'name': name, 'url': u}
    m = re.search(r'Released on: (\d{1,2} [A-Z][a-z]{2} \d{4})', t)
    if m:
        try: g['releaseDate'] = datetime.strptime(m.group(1), '%d %b %Y').date().isoformat()
        except ValueError: pass
    gid = re.search(r'gid=([a-z0-9_]+)', html.unescape(s))
    if gid: g['demo'] = f'https://released.playngonetwork.com/casino/ContainerLauncher?pid=2&gid={gid.group(1)}&lang=de_DE&practice=1&channel=desktop&demo=2'
    i = t.find('Game features')
    desc = t[i:i + 3000] if i >= 0 else ''
    m = re.search(r'max(?:imum)? win(?: potential)?(?: of)?(?: up to)? ([\d,]+)\s*x', desc, re.I)
    if m: g['maxWin'] = float(m.group(1).replace(',', ''))
    m = re.search(r'(\d+)\s+(?:fixed\s+)?(paylines|ways)', desc, re.I)
    if m: g['winLines'] = {'type': 'ways' if 'way' in m.group(2).lower() else 'lines', 'count': int(m.group(1))}
    g['features'] = features(desc)
    games.append(g)
json.dump(games, open(out, 'w'), indent=1, ensure_ascii=False)
print(f'{len(urls)} URLs, {len(games)} slots written to {out}')
