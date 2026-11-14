"""
Convert an importer JSON into src/data/slots/<slug>.json files.
Files marked "manual": true are never overwritten. Slug collisions with another
provider get a provider suffix.
Usage: python3 -I scripts/import/to-data.py <import.json> <provider-slug> <source-name> <verified-date> [demo-template]
  demo-template may use {symbol}; importers can also supply a full 'demo' URL.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import slugify

src, provider, source_name, verified = sys.argv[1:5]
demo_tpl = sys.argv[5] if len(sys.argv) > 5 else None
out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'slots')
suffix = provider.split('-')[0]
written = skipped = 0
seen = set()
for g in json.load(open(src)):
    key = re.sub(r'[^a-z0-9]', '', g['name'].lower())
    if key in seen:
        continue  # same game listed in several editions
    seen.add(key)
    slug = re.sub(r'-slot$', '', slugify(g['slug']))
    path = os.path.join(out_dir, f'{slug}.json')
    if os.path.exists(path):
        old = json.load(open(path))
        if old.get('manual'):
            skipped += 1; continue
        if old.get('provider') != provider:
            slug = f'{slug}-{suffix}'; path = os.path.join(out_dir, f'{slug}.json')
    demo = g.get('demo') or (demo_tpl.format(symbol=g['symbol']) if demo_tpl and g.get('symbol') else None)
    d = {
        'name': g['name'],
        'provider': provider,
        'releaseDate': g.get('releaseDate', 'TODO'),
        'rtp': g['rtp'] if g.get('rtp') else 'TODO',
        'volatility': g.get('volatility', 'TODO'),
        **({'volatilityNote': g['volatilityNote']} if g.get('volatilityNote') else {}),
        'maxWinMultiplier': g.get('maxWin', 'TODO'),
        **({'hitRate': g['hitRate']} if g.get('hitRate') else {}),
        **({'freeSpinsRate': g['freeSpinsRate']} if g.get('freeSpinsRate') else {}),
        'reels': g.get('reels', 'TODO'),
        'rows': g.get('rows', 'TODO') if g.get('reels') else 'TODO',
        **({'grid': g['grid']} if g.get('grid') else {}),
        'winLines': g.get('winLines', 'TODO'),
        'minStake': g.get('minStake', 'TODO'),
        'maxStake': g.get('maxStake', 'TODO'),
        'features': g.get('features', []),
        'themes': [],
        'categories': [],
        'demoUrl': demo,
        **({'demoVersionUrl': g['demoVersionUrl']} if demo and g.get('demoVersionUrl') else {}),
        'demoSource': 'official-provider' if demo else 'none',
        **({'demoSourceName': source_name,
            'demoLicenseNote': f'Offizielle Demo von {source_name}, geladen vom öffentlichen Demo-Server des Herstellers.'} if demo else {}),
        'demoAvailableInDE': 'TODO',
        'availableInDE': 'TODO',
        'gglOperatorSlugs': [],
        'screenshots': [],
        **({'thumbSource': g['thumb']} if g.get('thumb') else {}),
        **({'thumbnail': {'src': f'/thumbs/{slug}.webp', 'alt': f"{g['name']} Spielautomat"}} if os.path.exists(os.path.join(out_dir, '..', '..', '..', 'public', 'thumbs', f'{slug}.webp')) else {}),
        'sourceUrls': [g['url']],
        'lastVerified': verified,
    }
    json.dump(d, open(path, 'w'), indent=2, ensure_ascii=False)
    written += 1
print(f'{provider}: {written} written, {skipped} skipped (manual)')
