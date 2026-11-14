"""
Convert an importer JSON (see pragmatic.py) into src/data/slots/<slug>.json files.
Never overwrites a slot file whose "lastVerified" was set manually (manual: true).
Usage: python3 -I scripts/import/to-data.py <import.json> <provider-slug> <demo-template> <source-name> <verified-date>
"""
import json, os, re, sys

src, provider, demo_tpl, source_name, verified = sys.argv[1:6]
out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'slots')
games = json.load(open(src))
written = skipped = 0
for g in games:
    slug = re.sub(r'-slot$', '', re.sub(r'[^a-z0-9]+', '-', g['slug'].lower()).strip('-'))
    path = os.path.join(out_dir, f'{slug}.json')
    if os.path.exists(path):
        old = json.load(open(path))
        if old.get('provider') != provider or old.get('manual'):
            skipped += 1
            continue
    d = {
        'name': g['name'],
        'provider': provider,
        'releaseDate': 'TODO',
        'rtp': g['rtp'] if g.get('rtp') else 'TODO',
        'volatility': g.get('volatility', 'TODO'),
        'maxWinMultiplier': g.get('maxWin', 'TODO'),
        'reels': 'TODO',
        'rows': 'TODO',
        **({'grid': g['grid']} if g.get('grid') else {}),
        'winLines': g.get('winLines', 'TODO'),
        'minStake': 'TODO',
        'maxStake': 'TODO',
        'features': g.get('features', []),
        'themes': [],
        'categories': [],
        'demoUrl': demo_tpl.format(symbol=g['symbol']),
        'demoSource': 'official-provider',
        'demoSourceName': source_name,
        'demoLicenseNote': f'Offizielle Demo von {source_name}, geladen vom öffentlichen Demo-Server des Herstellers.',
        'demoAvailableInDE': 'TODO',
        'availableInDE': 'TODO',
        'gglOperatorSlugs': [],
        'screenshots': [],
        'sourceUrls': [g['url']],
        'lastVerified': verified,
    }
    json.dump(d, open(path, 'w'), indent=2, ensure_ascii=False)
    written += 1
print(f'{written} written, {skipped} skipped')
