/**
 * Data-driven German slot reviews for slots without a hand-written text.
 * Every statement is derived from the slot's official data (src/data/slots/*.json):
 * nothing is invented. Unknown values are stated as unknown. Phrasing variants are
 * chosen deterministically per slot so pages read differently.
 */
import { CATEGORIES } from '../config/routes.ts';
import type { SlotView } from './slots.ts';
import { isTodo, rtpMax } from './slots.ts';

export interface AutoSection { h2: string; paragraphs: string[]; list?: string[] }
export interface AutoReview { intro: string; sections: AutoSection[]; faq: { q: string; a: string }[] }

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const pick = <T>(slug: string, salt: string, arr: T[]): T => arr[hash(slug + salt) % arr.length];
const n = (x: number, d = 0) => x.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x: number) => `${n(x, 2)} %`;
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const FEATURE_TEXT: Record<string, (name: string) => string[]> = {
  'free-spins': (s) => [
    `Freispiele: In der Bonusrunde von ${s} drehen sich die Walzen, ohne dass ein neuer Einsatz fällig wird. Wie die Runde ausgelöst wird, steht in den Spielregeln – meist sind es Scatter-Symbole.`,
    `Freispiele: ${s} bietet eine Freispielrunde, in der du ohne weiteren Einsatz drehst. Die genaue Auslösebedingung findest du in den Spielinformationen.`,
  ],
  cascades: (s) => [
    `Kaskaden (Tumble): Gewinnsymbole verschwinden, neue Symbole fallen nach. So kann ein einzelner Spin bei ${s} mehrere Gewinne nacheinander bringen.`,
    `Kaskaden: Nach jedem Gewinn rutschen neue Symbole in die Lücken. Bilden sich dabei weitere Kombinationen, wird ${s} erneut ausgezahlt.`,
  ],
  multipliers: (s) => [
    `Multiplikatoren: Bestimmte Symbole oder Features erhöhen Gewinne bei ${s} um ein Vielfaches.`,
    `Multiplikatoren: Laut Hersteller können Gewinne bei ${s} durch Multiplikatoren vervielfacht werden.`,
  ],
  megaways: (s) => [
    `Megaways: Die Zahl der Symbole pro Walze ändert sich bei ${s} mit jedem Spin – und damit auch die Zahl der möglichen Gewinnwege.`,
    `Megaways-Mechanik: Jede Walze zeigt pro Spin eine andere Anzahl Symbole. Gewinne zählen auf benachbarten Walzen von links, egal in welcher Reihe.`,
  ],
  'hold-and-win': (s) => [
    `Hold & Win: Geldsymbole bleiben bei ${s} stehen, während du Respins erhältst. Jedes neue Geldsymbol setzt die Respins zurück, am Ende werden die Werte zusammengezählt.`,
    `Geldsymbol-Feature: Landen genug Geldsymbole, startet eine Respin-Runde. Die Symbole bleiben liegen, und ihre Werte werden am Ende addiert.`,
  ],
  'scatter-pays': (s) => [`Gewinne überall: Bei ${s} zählen gleiche Symbole unabhängig von festen Linien – entscheidend ist ihre Anzahl auf dem Spielfeld.`],
  'cluster-pays': (s) => [`Cluster-Gewinne: Bei ${s} bringen Gruppen gleicher, miteinander verbundener Symbole einen Gewinn.`],
  'sticky-wilds': (s) => [`Sticky Wilds: Wild-Symbole bleiben bei ${s} für eine gewisse Zeit liegen – typischerweise während der Bonusrunde.`],
  'walking-wilds': (s) => [`Wandernde Wilds: Wilds bewegen sich bei ${s} von Spin zu Spin über die Walzen.`],
  'expanding-symbols': (s) => [
    `Expandierende Symbole: Bestimmte Symbole können sich bei ${s} über eine ganze Walze ausdehnen und so zusätzliche Gewinne ermöglichen.`,
    `Expandierende Symbole: Ein Symbol dehnt sich über die Walze aus – ein Prinzip, das viele Spieler aus Book-Slots kennen.`,
  ],
  wilds: (s) => [`Wild-Symbole: Sie ersetzen bei ${s} andere Symbole und helfen so, Gewinnkombinationen zu vervollständigen.`],
  respins: (s) => [`Respins: Einzelne Walzen oder das ganze Spielfeld drehen sich bei ${s} unter bestimmten Bedingungen noch einmal.`],
  retrigger: (s) => [`Retrigger: Die Bonusrunde von ${s} kann erneut ausgelöst und so verlängert werden.`],
  gamble: (s) => [`Risikospiel: International bietet ${s} die Möglichkeit, Gewinne in einem Zusatzspiel zu verdoppeln oder zu verlieren.`],
  'bonus-buy': (s) => [`Bonus Buy (international): In manchen Versionen von ${s} lässt sich das Bonusfeature kaufen. Bei lizenzierten Anbietern in Deutschland gibt es diese Funktion nicht.`],
};

const VOL_TEXT: Record<string, string[]> = {
  low: [
    'Niedrige Volatilität bedeutet: Gewinne kommen relativ häufig, fallen aber meist klein aus. Das sorgt für ein ruhiges Spielgefühl.',
    'Bei niedriger Volatilität verteilen sich die Gewinne gleichmäßiger – viele kleine Treffer statt seltener großer Ausschläge.',
  ],
  medium: [
    'Mittlere Volatilität ist ein Kompromiss: regelmäßige kleinere Gewinne, gelegentlich auch größere Treffer.',
    'Mit mittlerer Volatilität liegt der Slot zwischen ruhigen Klassikern und extremen High-Volatility-Spielen.',
  ],
  high: [
    'Hohe Volatilität heißt: Gewinne kommen seltener, können dann aber deutlich größer ausfallen. Längere Durststrecken sind normal.',
    'Bei hoher Volatilität schwanken die Ergebnisse stark. Viele Spins bringen wenig, einzelne Runden dafür mehr.',
  ],
  'very-high': [
    'Sehr hohe Volatilität bedeutet extreme Schwankungen: Die meisten Spins bringen wenig oder nichts, große Ergebnisse sind sehr selten.',
    'Mit sehr hoher Volatilität richtet sich der Slot an Spieler, die lange Durststrecken akzeptieren. Große Gewinne sind die Ausnahme.',
  ],
};

export function buildAutoReview(v: SlotView): AutoReview {
  const s = v.data;
  const name = s.name;
  const slug = v.id;
  const prov = v.provider?.data.name ?? s.provider;
  const hasDemo = !!s.demoUrl;
  const rtp = rtpMax(s);
  const rtpList = Array.isArray(s.rtp) ? [...s.rtp].sort((a, b) => b - a) : null;
  const vol = isTodo(s.volatility) ? null : s.volatility;
  const maxWin = isTodo(s.maxWinMultiplier) ? null : s.maxWinMultiplier;
  const release = isTodo(s.releaseDate) ? null : new Date(s.releaseDate);
  const cats = CATEGORIES.filter((c) => v.categories.includes(c.code));
  const feats = s.features.filter((f) => FEATURE_TEXT[f]);

  // ---- intro
  const intro = pick(slug, 'intro', [
    `${name} ist ein Spielautomat von ${prov}${release ? `, der im ${MONTHS[release.getMonth()]} ${release.getFullYear()} erschienen ist` : ''}. ${hasDemo ? `Hier spielst du die offizielle ${name} Demo kostenlos mit Spielgeld – ohne Anmeldung und ohne Download.` : 'Hier findest du alle offiziellen Daten zum Spiel.'}`,
    `${hasDemo ? `${name} kostenlos spielen: Hier startest du die offizielle Demo von ${prov} direkt im Browser, ohne Konto und ohne Einzahlung.` : `${name} von ${prov} im Überblick: Regeln, Features und offizielle Kennzahlen.`} Unten erfährst du, wie das Spiel funktioniert und was du realistisch erwarten kannst.`,
  ]);

  const sections: AutoSection[] = [];

  // ---- demo / overview
  const ov: string[] = [];
  ov.push(hasDemo
    ? pick(slug, 'demo', [
        `Die ${name} Demo ist die offizielle Version von ${prov} und läuft mit Spielgeld. Du kannst nichts verlieren und nichts gewinnen – ideal, um Regeln und Features in Ruhe kennenzulernen.`,
        `In der kostenlosen ${name} Demo spielst du mit Spielgeld ohne Wert. So siehst du ohne Risiko, wie sich der Slot anfühlt und wie oft Features auftauchen.`,
      ])
    : `Für ${name} bietet ${prov} derzeit keine Demo an, die wir einbinden können. Sobald eine offizielle Version verfügbar ist, kannst du sie hier kostenlos spielen.`);
  if (v.provider?.data.description.de) ov.push(v.provider.data.description.de.split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.'));
  sections.push({ h2: hasDemo ? `${name} Demo kostenlos spielen` : `${name} im Überblick`, paragraphs: ov });

  // ---- how it works
  const how: string[] = [];
  const layout = !isTodo(s.reels) && !isTodo(s.rows) ? `${s.reels} Walzen und ${s.rows} Reihen` : s.grid ? `einem ${s.grid}-Spielfeld` : null;
  if (!isTodo(s.winLines)) {
    const wl = s.winLines;
    const ways = wl.type === 'lines' ? (wl.count ? `${n(wl.count)} Gewinnlinien` : 'festen Gewinnlinien')
      : wl.type === 'ways' ? (wl.count ? `${n(wl.count)} Gewinnwegen` : 'variablen Gewinnwegen')
      : wl.type === 'cluster' ? 'Cluster-Gewinnen' : 'Gewinnen überall auf dem Spielfeld';
    how.push(`${name} wird ${layout ? `auf ${layout} mit ` : 'mit '}${ways} gespielt.`);
    if (wl.type === 'lines') how.push('Gewinne entstehen, wenn gleiche Symbole von links nach rechts auf einer Gewinnlinie liegen.');
    if (wl.type === 'ways') how.push('Gewonnen wird, wenn gleiche Symbole auf benachbarten Walzen von links liegen – die Reihe spielt keine Rolle.');
    if (wl.type === 'cluster') how.push('Gruppen gleicher Symbole, die horizontal oder vertikal verbunden sind, bringen einen Gewinn.');
    if (wl.type === 'scatter-pays') how.push('Entscheidend ist, wie viele gleiche Symbole irgendwo auf dem Spielfeld liegen – feste Linien gibt es nicht.');
  } else if (layout) {
    how.push(`${name} wird auf ${layout} gespielt. Die genaue Gewinnstruktur findest du in den Spielregeln.`);
  }
  if (cats.length) how.push(`Wir ordnen ${name} folgenden Kategorien zu: ${cats.map((c) => c.label).join(', ')}.`);
  if (how.length) sections.push({ h2: `So funktioniert ${name}`, paragraphs: how });

  // ---- features
  if (feats.length) {
    sections.push({
      h2: feats.includes('free-spins') ? `${name} Freispiele und Features` : `${name} Features`,
      paragraphs: [`Laut Herstellerbeschreibung bietet ${name} diese Funktionen:`],
      list: feats.map((f) => pick(slug, f, FEATURE_TEXT[f](name))),
    });
  }

  // ---- numbers
  const num: string[] = [];
  if (rtpList && rtpList.length > 1) {
    num.push(`${prov} veröffentlicht für ${name} mehrere RTP-Versionen: ${rtpList.map(pct).join(', ')}. Spielotheken wählen eine davon aus – schau deshalb vor dem Echtgeldspiel in die Spielinformationen.`);
  } else if (rtp !== null) {
    num.push(`Der RTP von ${name} liegt laut ${prov} bei ${pct(rtp)}. Über sehr viele Spins fließen damit im Schnitt ${n(rtp, 2)} € von 100 € Einsatz zurück, ${n(100 - rtp, 2)} € behält die Spielothek. Für eine einzelne Sitzung sagt der Wert wenig aus.`);
  } else {
    num.push(`${prov} veröffentlicht den RTP von ${name} nicht öffentlich. Den Wert der jeweiligen Version findest du in den Spielinformationen beim Anbieter.`);
  }
  if (vol) num.push(`${s.volatilityNote && /\d\/\d/.test(s.volatilityNote) ? `Die Volatilität stuft ${prov} mit ${s.volatilityNote} ein. ` : ''}${pick(slug, 'vol', VOL_TEXT[vol])}`);
  if (maxWin) num.push(`Der maximale Gewinn liegt laut Hersteller bei ${n(maxWin)}x des Einsatzes. Das ist ein theoretischer Höchstwert, der extrem selten erreicht wird.`);
  if (s.hitRate) num.push(`Laut ${prov} bringt im Schnitt jeder ${n(s.hitRate, 2)}. Spin einen Gewinn – viele davon sind allerdings kleiner als der Einsatz.`);
  if (s.freeSpinsRate) num.push(`Die Freispiele starten laut Hersteller im Schnitt alle ${n(s.freeSpinsRate)} Spins. Das ist ein Durchschnittswert, keine Vorhersage.`);
  sections.push({ h2: `${name} RTP, Volatilität und Max Win`, paragraphs: num });

  // ---- who it suits
  const suit: string[] = [];
  if (vol === 'low' || vol === 'medium') suit.push(`${name} passt zu dir, wenn du ein eher ausgeglichenes Spielgefühl mit regelmäßigen Treffern magst.`);
  if (vol === 'high' || vol === 'very-high') suit.push(`${name} ist eher etwas für Spieler, die mit Schwankungen leben können und auf seltene, größere Momente warten.`);
  if (feats.includes('megaways') || feats.includes('cascades')) suit.push('Wer viel Bewegung auf dem Spielfeld mag, kommt durch die nachfallenden Symbole auf seine Kosten.');
  if (!feats.length && (isTodo(s.winLines) || (s.winLines as { type: string }).type === 'lines')) suit.push('Der Aufbau ist klassisch und übersichtlich – gut für alle, die einfache Regeln bevorzugen.');
  suit.push(hasDemo
    ? pick(slug, 'tip', [`Unser Tipp: Spiel die Demo ein paar hundert Runden, bevor du dir ein Urteil bildest.`, `Teste ${name} am besten zuerst ausgiebig mit Spielgeld.`])
    : 'Bis eine offizielle Demo verfügbar ist, findest du ähnliche Spiele weiter unten.');
  sections.push({ h2: `Für wen eignet sich ${name}?`, paragraphs: suit });

  // ---- tricks + real money
  sections.push({
    h2: `${name} Tricks und Strategien`,
    paragraphs: [pick(slug, 'tricks', [
      `Es gibt keine Tricks für ${name}. Jeder Spin wird von einem Zufallsgenerator bestimmt und ist unabhängig vom vorherigen. Weder Einsatzwechsel noch bestimmte Uhrzeiten verändern die Gewinnchancen.`,
      `Seiten, die ${name} Tricks versprechen, sagen nicht die Wahrheit: Das Ergebnis jedes Spins ist zufällig. Die einzige sinnvolle Strategie ist ein festes Budget.`,
    ])],
  });
  sections.push({
    h2: `${name} mit Echtgeld spielen`,
    paragraphs: [`In Deutschland ist Echtgeldspiel nur bei Online-Spielotheken mit Erlaubnis der GGL erlaubt. Dort gelten höchstens 1 € Einsatz pro Spin und mindestens fünf Sekunden pro Runde${s.features.includes('bonus-buy') ? '; einen Bonuskauf gibt es nicht' : ''}. Setz dir vorher ein Limit und spiel nie mit Geld, das du für anderes brauchst.`],
  });

  // ---- FAQ
  const faq: { q: string; a: string }[] = [];
  faq.push({ q: `Kann man ${name} kostenlos ohne Anmeldung spielen?`, a: hasDemo ? `Ja. Die offizielle ${name} Demo von ${prov} startest du hier direkt im Browser – ohne Konto, ohne Einzahlung und ohne Download.` : `Derzeit gibt es keine offizielle Demo von ${prov}, die wir einbinden können. Sobald sie verfügbar ist, kannst du ${name} hier kostenlos spielen.` });
  faq.push({ q: `Wie hoch ist der RTP von ${name}?`, a: rtpList && rtpList.length > 1 ? `${prov} nennt mehrere RTP-Versionen: ${rtpList.map(pct).join(', ')}.` : rtp !== null ? `Laut ${prov} liegt der RTP bei ${pct(rtp)}.` : `${prov} veröffentlicht den RTP nicht öffentlich. Den Wert findest du in den Spielinformationen beim Anbieter.` });
  if (feats.includes('free-spins')) faq.push({ q: `Hat ${name} Freispiele?`, a: `Ja, ${name} bietet laut Herstellerbeschreibung eine Freispielrunde. Wie sie ausgelöst wird, steht in den Spielregeln.` });
  if (maxWin) faq.push({ q: `Was ist der Max Win bei ${name}?`, a: `Laut ${prov} liegt der maximale Gewinn bei ${n(maxWin)}x des Einsatzes – ein theoretischer Höchstwert.` });
  faq.push({ q: `Gibt es ${name} Tricks?`, a: `Nein. Jeder Spin ist zufällig. Keine Strategie verändert die Gewinnwahrscheinlichkeit.` });
  faq.push({ q: `Ist ${name} in Deutschland legal?`, a: `Die kostenlose Demo kannst du jederzeit spielen. Mit Echtgeld darfst du in Deutschland nur bei Online-Spielotheken mit Erlaubnis der GGL spielen.` });

  return { intro, sections, faq };
}

/** Meta description for slots without a hand-written text (≤155 chars). */
export function autoMetaDescription(v: SlotView): string {
  const s = v.data;
  const prov = v.provider?.data.name ?? s.provider;
  const rtp = rtpMax(s);
  const parts = [
    s.demoUrl ? `${s.name} kostenlos spielen: offizielle ${prov} Demo ohne Anmeldung` : `${s.name} von ${prov}: Regeln & Fakten`,
    rtp !== null ? `RTP ${pct(rtp)}` : '',
    !isTodo(s.maxWinMultiplier) ? `Max ${n(s.maxWinMultiplier)}x` : '',
    s.features.includes('free-spins') ? 'Freispiele' : '',
  ].filter(Boolean);
  let out = parts.join(', ');
  const extras = [
    s.features.includes('multipliers') ? 'Multiplikatoren' : '',
    s.features.includes('wilds') ? 'Wilds' : '',
    s.features.includes('megaways') ? 'Megaways' : '',
  ].filter((x) => x && !out.includes(x));
  if (extras.length && out.length < 110) out += `, ${extras.join(', ')}`;
  if (out.length < 120) out += ' – Test, Regeln, Features & FAQ.';
  if (out.length < 120) out += ' Alle Daten laut Hersteller.';
  return out.length <= 155 ? out : out.slice(0, 152).replace(/[ ,–]+\S*$/, '') + '…';
}
