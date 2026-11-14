"""
Import Pragmatic Play video slots from the official website (pragmaticplay.com).
Extracts only what the official page states: name, RTP, official demo symbol,
and facts explicitly written in the official description (reels x rows,
lines/ways, max win "x" multiplier, feature keywords). Everything else stays "TODO".
Raw HTML is cached; requests are rate-limited (1/s).
Usage: python3 -I scripts/import/pragmatic.py <cache_dir> <out_json>
"""
import html, json, os, re, sys, time, urllib.request

cache, out = sys.argv[1], sys.argv[2]
os.makedirs(cache, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; slot-data-import/1.0)'}

def get(url, name):
    p = os.path.join(cache, name)
    if os.path.exists(p):
        return open(p, encoding='utf-8', errors='ignore').read()
    if os.environ.get('OFFLINE'):
        return ''
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                s = r.read().decode('utf-8', 'ignore')
            open(p, 'w', encoding='utf-8').write(s)
            time.sleep(1)
            return s
        except Exception as e:
            time.sleep(3 * (attempt + 1))
    return ''

idx = get('https://www.pragmaticplay.com/sitemap_index.xml', 'sitemap_index.xml')
urls = set()
for sm in re.findall(r'https://www\.pragmaticplay\.com/games-sitemap\d*\.xml', idx):
    for u in re.findall(r'<loc>([^<]+)</loc>', get(sm, os.path.basename(sm))):
        if re.match(r'https://www\.pragmaticplay\.com/en/games/[a-z0-9-]+/$', u):
            urls.add(u)

def num(s): return float(s.replace(',', ''))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import FEATURES  # shared feature keywords

games = []
for i, u in enumerate(sorted(urls)):
    slug = u.rstrip('/').split('/')[-1]
    s = get(u, f'g-{slug}.html')
    if not s: continue
    sym = re.search(r'gameSymbol=([A-Za-z0-9_]+)', s)
    if not sym or not sym.group(1).startswith('vs'):  # vs = video slot; skip table/live/bingo
        continue
    t = re.search(r'game-details__title">(.*?)<', s)
    name = re.sub(r'[™®©]', '', html.unescape(t.group(1))).strip() if t else None
    if not name: continue
    rtp = re.search(r'RTP:\s*<span>\s*([\d.]+)\s*%', s)
    d = re.search(r'game-details__description">(.*?)</div>', s, re.S)
    desc = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', d.group(1)))).strip() if d else ''
    og = re.search(r'og:image" content="([^"]+)"', s)
    g = {'slug': slug, 'name': name, 'url': u, 'symbol': sym.group(1), 'thumb': og.group(1) if og else None,
         'rtp': float(rtp.group(1)) if rtp else None}
    m = re.search(r'\b(\d)\s*[x×]\s*(\d)\b', desc)
    if m: g['grid'] = f'{m.group(1)}×{m.group(2)}'  # as written by provider; order is not consistent
    m = re.search(r'(\d[\d,]*)\s+(?:fixed\s+)?(paylines|pay lines|lines|ways)', desc, re.I)
    if m: g['winLines'] = {'type': 'ways' if 'way' in m.group(2).lower() else 'lines', 'count': int(num(m.group(1)))}
    if re.search(r'pay anywhere|anywhere on the screen', desc, re.I): g['winLines'] = {'type': 'scatter-pays'}
    m = re.search(r'max(?:imum)?\s+win(?:\s+potential)?(?:\s+of)?(?:\s+up\s+to)?\s+([\d,]+)\s*x', desc, re.I)
    if m: g['maxWin'] = num(m.group(1))
    m = re.search(r'\b(very high|extremely high|high|medium|low)[\s-]+volatil|\b(highly) volatile', desc, re.I)
    if m:
        v = (m.group(1) or m.group(2)).lower()
        g['volatility'] = {'very high': 'very-high', 'extremely high': 'very-high', 'highly': 'high'}.get(v, v)
    g['features'] = [f for f, rx in FEATURES if re.search(rx, desc, re.I)]
    if 'megaways' in g['features']: g['winLines'] = {'type': 'ways'}
    games.append(g)

json.dump(games, open(out, 'w'), indent=1, ensure_ascii=False)
print(f'{len(urls)} game URLs, {len(games)} video slots written to {out}')
