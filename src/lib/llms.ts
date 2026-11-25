/** Plain-text summaries of the site for AI assistants (llms.txt convention). Built from the same data as the pages. */
import { getCollection } from 'astro:content';
import { SITE_NAME, SITE_URL, COMPANY } from '../config/site.ts';
import { getSlotViews, rtpText, maxWinText } from './slots.ts';
import { RANKINGS } from './rankings.ts';
import { TABLE_GAMES } from '../content/tischspiele.ts';
import { isPromotable } from './compliance.ts';

const u = (p: string) => `${SITE_URL}${p}`;
const pub = (t: string) => (t.includes('wird geprüft') ? 'vom Hersteller nicht veröffentlicht' : t);
const today = () => new Date().toISOString().slice(0, 10);

export async function llmsIndex() {
  const slots = await getSlotViews();
  const guides = (await getCollection('guides', (g) => !g.data.draft)).sort((a, b) => a.data.title.localeCompare(b.data.title, 'de'));
  const providers = await getCollection('providers');
  const ops = (await getCollection('operators')).filter((o) => isPromotable(o.data)).sort((a, b) => a.data.sortOrder - b.data.sortOrder);
  const terms = await getCollection('glossary');
  const L: string[] = [];
  L.push(`# ${SITE_NAME} (kostenlosespielautomaten.de)`, '');
  L.push(`> Deutschsprachiges Informationsportal zu Online-Spielautomaten und Tischspielen. Kostenlose offizielle Demos von ${slots.length.toLocaleString('de-DE')} Slots mit den Spieldaten der Hersteller, kostenlose Tischspiele mit Strategie-Tipps, Ratgeber zur deutschen Glücksspielregulierung und ein Vergleich von Online-Spielotheken, der nur Anbieter mit Erlaubnis der Gemeinsamen Glücksspielbehörde der Länder (GGL) führt.`, '');
  L.push('Sprache: Deutsch. Zielland: Deutschland. Alle Spiele auf der Seite laufen mit Demo-Guthaben ohne echten Wert. Spieldaten (RTP, Volatilität, Maximalgewinn) stammen von den Herstellern; fehlende Werte werden als nicht veröffentlicht gekennzeichnet und nicht geschätzt.', '');
  L.push(`Stand: ${today()}. Kontakt: ${COMPANY.email}. Ausführliche Fassung mit Glossar, Regeln und Ranglisten: ${u('/llms-full.txt')}`, '');
  L.push('## Spielautomaten', '');
  L.push(`- [Alle Spielautomaten](${u('/spielautomaten/')}): ${slots.length.toLocaleString('de-DE')} Slots mit Demo, RTP, Volatilität und Maximalgewinn`);
  L.push(`- [Slots von A bis Z](${u('/spielautomaten/a-z/')}): vollständiges Verzeichnis`);
  for (const r of RANKINGS) L.push(`- [${r.h1}](${u(`/ranglisten/${r.slug}/`)}): Top 50 aus Herstellerdaten`);
  L.push(`- [Hersteller](${u('/hersteller/')}): ${providers.map((p) => p.data.name).join(', ')}`, '');
  L.push('## Kostenlose Tischspiele', '');
  for (const g of TABLE_GAMES) L.push(`- [${g.name}](${u(`/tischspiele/${g.slug}/`)}): ${g.short}`);
  L.push(`- [Blackjack-Strategie-Tabelle](${u('/tischspiele/blackjack-strategie/')}): Basisstrategie für 6 Decks, Bank hält bei allen 17`, '');
  L.push('## Ratgeber', '');
  for (const g of guides) L.push(`- [${g.data.title}](${u(`/ratgeber/${g.id}/`)}): ${g.data.description}`);
  L.push('', '## Nachschlagen und Rechnen', '');
  L.push(`- [Slot-Glossar](${u('/glossar/')}): ${terms.length} Begriffe von RTP bis LUGAS`);
  L.push(`- [RTP-Rechner](${u('/tools/rtp-rechner/')}): erwarteter Verlust aus Einsatz, Spins und Auszahlungsquote`);
  L.push(`- [Budget-Rechner](${u('/tools/budget-rechner/')}): wie lange ein Budget im Schnitt reicht`);
  L.push(`- [News](${u('/news/')}): neue Slots, Marktberichte, Regulierung`, '');
  L.push('## Online-Spielotheken mit deutscher Erlaubnis', '');
  L.push(`- [Vergleich](${u('/echtgeld-spielotheken/')}): ${ops.length} Anbieter, alle auf der Whitelist der GGL geprüft`);
  for (const o of ops) L.push(`- [${o.data.name}](${u(`/echtgeld-spielotheken/${o.id}/`)}): Lizenz und Fakten`);
  L.push(`- [Bewertungsmethodik](${u('/bewertungsmethodik/')}): wie geprüft und bewertet wird`, '');
  L.push('## Über die Seite', '');
  L.push(`- [Über uns](${u('/ueber-uns/')})`, `- [Verantwortungsvoll spielen](${u('/verantwortungsvoll-spielen/')}): Hilfsangebote und Sperrmöglichkeiten`, `- [Wie wir Geld verdienen](${u('/affiliate-hinweis/')})`, '');
  return L.join('\n');
}

export async function llmsFull() {
  const slots = await getSlotViews();
  const terms = (await getCollection('glossary')).sort((a, b) => a.data.term.localeCompare(b.data.term, 'de'));
  const L: string[] = [];
  L.push(`# ${SITE_NAME}: Fakten zum Nachschlagen`, '', `Stand: ${today()}. Quelle: ${u('/')}. Kurzfassung: ${u('/llms.txt')}`, '');
  L.push('## Regeln für virtuelle Automatenspiele in Deutschland (Glücksspielstaatsvertrag 2021)', '');
  L.push('- Erlaubt sind nur Anbieter mit Erlaubnis der Gemeinsamen Glücksspielbehörde der Länder (GGL). Sie stehen auf der offiziellen Whitelist.', '- Höchsteinsatz: 1 € pro Spiel.', '- Ein Spiel muss im Durchschnitt mindestens 5 Sekunden dauern. Autoplay ist verboten.', '- Jackpots sind bei virtuellen Automatenspielen nicht erlaubt.', '- Einzahlungslimit: standardmäßig 1.000 € pro Monat über alle Anbieter hinweg, kontrolliert über die Datei LUGAS.', '- Sperrdatei OASIS: gilt bei allen legalen Anbietern. Der Panik-Button sperrt für 24 Stunden.', '- Steuer: 5,3 % auf jeden Einsatz. Deshalb liegt der RTP bei deutschen Anbietern oft unter der Herstellerangabe.', '- Mindestalter: 18 Jahre.', `- Mehr dazu: ${u('/ratgeber/legale-online-spielotheken-erkennen/')}`, '');
  L.push('## Glossar', '');
  for (const t of terms) L.push(`- **${t.data.term}**: ${t.data.short} (${u(`/glossar/${t.id}/`)})`);
  L.push('', '## Tischspiele: Regeln und Hausvorteil', '');
  for (const g of TABLE_GAMES) {
    L.push(`### ${g.name}`, '', `Kostenlos spielbar: ${u(`/tischspiele/${g.slug}/`)}`, '');
    for (const [k, v] of g.facts) L.push(`- ${k}: ${v}`);
    for (const [a, b] of g.edges) L.push(`- Hausvorteil, ${a}: ${b}`);
    L.push('');
  }
  for (const r of RANKINGS) {
    const rows = r.pick(slots).slice(0, 20);
    L.push(`## ${r.h1} (Top 20)`, '', r.note, '');
    rows.forEach((v, i) => L.push(`${i + 1}. ${v.data.name} (${v.provider?.data.name ?? 'Hersteller unbekannt'}): RTP ${pub(rtpText(v.data))}, Max Win ${pub(maxWinText(v.data))}${r.slug === 'neue-slots' ? `, erschienen ${v.data.releaseDate}` : ''} – ${u(v.path)}`));
    L.push('', `Vollständige Liste: ${u(`/ranglisten/${r.slug}/`)}`, '');
  }
  return L.join('\n');
}
