"""Print a compact fact sheet (official data + official description) for given slot slugs.
Usage: python3 -I scripts/factsheet.py <cache_root> slug [slug ...]"""
import json, os, re, sys, html
root, slugs = sys.argv[1], sys.argv[2:]
def txt(x): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<script.*?</script>|<style.*?</style>', '', x, flags=re.S)))).strip()
CACHE = {'pragmatic-play': 'pp-cache', 'hacksaw-gaming': 'hs-cache', 'bgaming': 'bg-cache', 'netent': 'netent-cache', 'play-n-go': 'playngo-cache', 'novomatic': 'greentube-cache'}
for slug in slugs:
    d = json.load(open(f'src/data/slots/{slug}.json'))
    src = d['sourceUrls'][0]
    page = src.rstrip('/').split('/')[-1]
    f = os.path.join(root, CACHE[d['provider']], f'g-{page}.html')
    desc = ''
    if os.path.exists(f):
        s = open(f, encoding='utf-8', errors='ignore').read()
        p = d['provider']
        if p == 'pragmatic-play':
            m = re.search(r'game-details__description">(.*?)</div>', s, re.S); desc = txt(m.group(1)) if m else ''
        elif p == 'play-n-go':
            t = txt(s); i = t.find('Game features'); desc = re.split(r'If you liked|Privacy Statement', t[i:i+2500])[0] if i >= 0 else ''
        elif p == 'netent':
            t = txt(s); i = t.find('Game Features'); desc = t[i:i+1600].split('PLEASE GAMBLE')[0] if i >= 0 else ''
        elif p == 'hacksaw-gaming':
            t = txt(s); i = t.find('Try it'); desc = re.split(r'GAME DATA|© 20', t[i+6:i+2200])[0] if i >= 0 else ''
        elif p == 'novomatic':
            t = txt(s); idx = [m.start() for m in re.finditer(r'About ', t)]
            desc = next((t[k:k+1300] for k in idx if 'Management' not in t[k:k+40]), '')
            desc = re.split(r'Key Data|Sitemap', desc)[0]
        elif p == 'bgaming':
            t = txt(s); j = t.find('Copy demo link'); desc = t[j+15:j+1300] if j >= 0 else ''
    keep = {k: d[k] for k in ['name', 'provider', 'releaseDate', 'rtp', 'volatility', 'volatilityNote', 'maxWinMultiplier', 'reels', 'rows', 'grid', 'winLines', 'hitRate', 'freeSpinsRate', 'features'] if k in d and d[k] != 'TODO' and d[k] != []}
    keep['demo'] = bool(d.get('demoUrl'))
    print(f'## {slug} | {json.dumps(keep, ensure_ascii=False)}\n   {desc[:1100]}\n')
