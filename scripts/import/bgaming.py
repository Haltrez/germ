"""
Import BGaming slots from the official website (bgaming.com): name, RTP, volatility,
release date, max multiplier, lines/ways and the official demo ID.
Usage: python3 -I scripts/import/bgaming.py <cache_dir> <out_json>
"""
import json, re, sys, os
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import fetcher, page_text, features, text

cache, out = sys.argv[1], sys.argv[2]
get = fetcher(cache)
sm = get('https://bgaming.com/game-sitemap.xml', 'game-sitemap.xml')
urls = sorted(set(re.findall(r'<loc>(https://bgaming\.com/games/[a-z0-9-]+)/?</loc>', sm)))
VOL = {'low': 'low', 'low-medium': 'low', 'medium': 'medium', 'medium-high': 'high', 'high': 'high', 'very high': 'very-high', 'extreme': 'very-high'}
games = []
for u in urls:
    slug = u.rstrip('/').split('/')[-1]
    s = get(u, f'g-{slug}.html')
    if not s: continue
    t = page_text(s)
    if not re.search(r'Game Type Slots', t): continue
    if slug.endswith('-branded') or 'playamo' in slug: continue  # editions branded for specific casinos
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    name = re.sub(r'[™®©]', '', text(h1.group(1))).strip() if h1 else None
    if not name: continue
    name = re.sub(r'\bMEGAWAYS\b', 'Megaways', name)
    name = re.sub(r'(?<=\w) (Of|The|In|And|With|On) ', lambda m: f' {m.group(1).lower()} ', name)
    g = {'slug': slug, 'name': name, 'url': u}
    m = re.search(r'RTP ([\d.]+) %', t); g['rtp'] = float(m.group(1)) if m else None
    m = re.search(r'Volatility (Very high|Medium-high|Low-high|Low-medium|Medium|High|Low|Extreme)\b', t, re.I)
    if m:
        v = m.group(1).lower(); g['volatilityNote'] = v
        if v in VOL: g['volatility'] = VOL[v]
    m = re.search(r'Hit Rate ([\d.]+)', t)
    if m: g['hitRate'] = float(m.group(1))
    m = re.search(r'FS Rate (\d+)', t)
    if m: g['freeSpinsRate'] = int(m.group(1))
    m = re.search(r'Release Date ([A-Z][a-z]{2} \d{1,2}, \d{4})', t)
    if m: g['releaseDate'] = datetime.strptime(m.group(1), '%b %d, %Y').date().isoformat()
    m = re.search(r'Max\.multiplier x ?([\d ,.]+?)(?: [A-Z]|$)', t)
    if m:
        try: g['maxWin'] = float(m.group(1).replace(' ', '').replace(',', ''))
        except ValueError: pass
    if re.search(r'Lines Pays Anywhere', t): g['winLines'] = {'type': 'scatter-pays'}
    m = re.search(r'Lines (Megaways|Cluster|Ways|\d+)', t)
    if m:
        v = m.group(1)
        g['winLines'] = {'type': 'ways'} if v in ('Megaways', 'Ways') else {'type': 'cluster'} if v == 'Cluster' else {'type': 'lines', 'count': int(v)}
    m = re.search(r'\bID ([A-Za-z0-9_]+)', t)
    if m: g['demo'] = f'https://demo.bgaming-network.com/play/{m.group(1)}/FUN?server=demo'
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    g['features'] = features((desc.group(1) if desc else '') + ' ' + name + ' ' + t[:4000])
    games.append(g)
json.dump(games, open(out, 'w'), indent=1, ensure_ascii=False)
print(f'{len(urls)} URLs, {len(games)} slots written to {out}')
