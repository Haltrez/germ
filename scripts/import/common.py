"""Shared helpers for official-site importers (cached, rate-limited fetches)."""
import html, os, re, time, urllib.request

UA = {'User-Agent': 'Mozilla/5.0 (compatible; slot-data-import/1.0)'}

def fetcher(cache, delay=1.0):
    os.makedirs(cache, exist_ok=True)
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
                time.sleep(delay)
                return s
            except Exception:
                time.sleep(3 * (attempt + 1))
        return ''
    return get

def text(fragment):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', fragment))).strip()

def page_text(s):
    return text(re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S))

FEATURES = [
    ('free-spins', r'free spins?|freespins?|bonus spins'), ('cascades', r'tumbl|cascad|avalanche'), ('multipliers', r'multiplier'),
    ('megaways', r'megaways'), ('hold-and-win', r'hold\s*(?:&|and|n)\s*(?:spin|win)|money symbols?|coin respin'),
    ('scatter-pays', r'pay anywhere|anywhere on the screen|scatter pays'), ('cluster-pays', r'cluster'),
    ('sticky-wilds', r'sticky wild'), ('walking-wilds', r'walking wild'), ('expanding-symbols', r'expand'),
    ('bonus-buy', r'bonus buy|buy bonus|feature buy|buy feature|bonus purchase|buy the (?:bonus|feature)|buy free spins'),
    ('wilds', r'\bwild'), ('respins', r'respin|re-spin'), ('retrigger', r'retrigger'),
]
def features(desc):
    return [f for f, rx in FEATURES if re.search(rx, desc, re.I)]

def slugify(s):
    s = s.lower().replace('&', 'and')
    s = re.sub(r'[äÄ]', 'ae', s); s = re.sub(r'[öÖ]', 'oe', s); s = re.sub(r'[üÜ]', 'ue', s); s = s.replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
