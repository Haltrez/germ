/** German intro texts for category pages (original editorial copy). */
import type { CategoryCode } from '../config/routes.ts';

export interface CategoryText {
  title: string;
  description: string;
  intro: string[];
  /** Longer guide below the slot grid. */
  sections?: { h2: string; paragraphs: string[] }[];
  faq?: { q: string; a: string }[];
}

export const CATEGORY_TEXT: Record<CategoryCode, CategoryText> = {
  book: {
    title: 'Book-Slots kostenlos spielen – Demos ohne Anmeldung',
    description: 'Book-Slots kostenlos spielen: Spielautomaten mit Buch-Symbol und expandierendem Sonderzeichen als Demo ohne Anmeldung, mit RTP laut Hersteller.',
    intro: [
      'Book-Slots gehören in Deutschland zu den bekanntesten Spielautomaten überhaupt. Das Prinzip ist schnell erklärt: Ein Buch-Symbol ist gleichzeitig Wild und Scatter. Drei oder mehr Bücher starten die Freispiele, und vor Beginn wird ein Sonderzeichen ausgewählt. Dieses Symbol kann sich in den Freispielen über die ganze Walze ausdehnen und auch dann zahlen, wenn die Treffer nicht nebeneinanderliegen.',
      'Typisch für Book-Slots ist eine hohe Volatilität: Lange Phasen ohne nennenswerte Gewinne wechseln sich mit seltenen, größeren Treffern ab. Genau deshalb lohnt es sich, einen Book-Slot erst kostenlos mit Spielgeld kennenzulernen. So siehst du, wie sich das Spiel anfühlt, ohne eigenes Geld einzusetzen.',
    ],
  },
  'hold-and-win': {
    title: 'Hold & Win Slots kostenlos spielen – Demos',
    description: 'Hold & Win Slots kostenlos spielen: Spielautomaten mit Geldsymbolen und Respin-Feature als Demo ohne Anmeldung, mit offiziellen Herstellerdaten.',
    intro: [
      'Bei Hold & Win Slots – je nach Hersteller auch Hold & Spin oder Cash-Collect genannt – dreht sich alles um Geldsymbole. Landen genug davon auf den Walzen, startet eine Bonusrunde mit meist drei Respins. Die Geldsymbole bleiben stehen, jedes neue Symbol setzt die Respins zurück. Am Ende werden alle Werte zusammengezählt.',
      'Das Feature ist leicht zu verstehen und sorgt für Spannung, weil sich das Spielfeld Schritt für Schritt füllt. Wie oft die Runde startet und wie hoch die Werte ausfallen, legt der Hersteller fest. In unseren Demos probierst du verschiedene Varianten mit Spielgeld aus.',
    ],
  },
  megaways: {
    title: 'Megaways Slots & Spiele kostenlos spielen – Demos',
    description: 'Megaways Slots kostenlos spielen: Spielautomaten mit wechselnder Walzenhöhe und vielen Gewinnwegen als Spielgeld-Demo ohne Anmeldung.',
    intro: [
      'Megaways ist eine Spielmechanik, bei der sich die Zahl der Symbole pro Walze mit jedem Spin ändert. Dadurch schwankt auch die Zahl der möglichen Gewinnwege – bei vielen Spielen von wenigen hundert bis zu über hunderttausend. Gewonnen wird, wenn gleiche Symbole auf benachbarten Walzen von links nach rechts liegen, egal in welcher Reihe.',
      'Viele Megaways-Slots kombinieren die Mechanik mit Kaskaden: Gewinnsymbole verschwinden, neue fallen nach, und so sind mehrere Gewinne in einem Spin möglich. Megaways-Spiele sind oft hoch volatil. Teste sie am besten zuerst kostenlos mit Spielgeld.',
    ],
  },
  fruit: {
    title: 'Früchte Slots kostenlos spielen – Demos ohne Anmeldung',
    description: 'Früchte-Slots kostenlos spielen: Spielautomaten mit Kirschen, Melonen und Siebenen als Demo ohne Anmeldung, mit RTP-Angaben der Hersteller.',
    intro: [
      'Kirschen, Zitronen, Pflaumen und die rote Sieben: Früchte-Slots sind die Urform des Spielautomaten. Moderne Varianten setzen auf dieselben Symbole, bieten aber oft zusätzliche Funktionen wie Freispiele, Multiplikatoren oder Gewinne überall auf dem Spielfeld.',
      'Wer es übersichtlich mag, ist hier richtig. Viele Früchte-Slots kommen mit wenigen Gewinnlinien und klaren Regeln aus. Probier die Spiele kostenlos mit Spielgeld aus und vergleiche RTP und Volatilität direkt auf der jeweiligen Slot-Seite.',
    ],
  },
  'bonus-buy': {
    title: 'Bonus-Buy-Slots kostenlos spielen – Demos',
    description: 'Bonus-Buy-Slots kostenlos testen: Spielautomaten mit Bonuskauf als Spielgeld-Demo. Wichtig: Bei legalen deutschen Anbietern gibt es keinen Bonuskauf.',
    intro: [
      'Bei Bonus-Buy-Slots kann man international die Freispiele oder ein Feature direkt kaufen, statt auf die Scatter zu warten. Der Preis ist ein Vielfaches des Einsatzes, oft 50x bis 100x oder mehr. In unseren kostenlosen Demos siehst du, wie diese Funktion aussieht und was sie mit der Spielmechanik macht – ganz ohne echtes Geld.',
      'Wichtig für Deutschland: Bei Online-Spielotheken mit Erlaubnis der GGL gibt es keinen Bonuskauf. Dort gelten höchstens 1 € Einsatz pro Spin und mindestens fünf Sekunden pro Runde. Ein gekaufter Bonus ist im Kern ein sehr hoher Einsatz auf einen Schlag – und damit ein hohes Risiko. Die Demos auf dieser Seite sind rein zum Kennenlernen gedacht.',
    ],
  },
  classic: {
    title: 'Klassiker-Slots kostenlos spielen – Demos ohne Anmeldung',
    description: 'Klassische Spielautomaten kostenlos spielen: bekannte Slots mit einfachen Regeln als Spielgeld-Demo ohne Anmeldung und ohne Download.',
    intro: [
      'Als Klassiker bezeichnen wir Spielautomaten mit einfachem Aufbau: wenige Walzen, feste Gewinnlinien und kaum Zusatzfunktionen. Sie sind ideal, wenn du ohne lange Regelkunde einfach drehen möchtest.',
      'Auch bei klassischen Slots gilt: Jeder Spin ist zufällig, und die Auszahlungsquote liegt unter 100 Prozent. In der kostenlosen Demo erlebst du das Spiel ohne Risiko.',
    ],
  },
};

/** Extended guides and FAQs per category (rendered below the grid). */
const EXTRA: Partial<Record<CategoryCode, Pick<CategoryText, 'sections' | 'faq'>>> = {
  fruit: {
    sections: [
      { h2: 'Was sind Früchte-Slots?', paragraphs: [
        'Früchte-Slots sind Spielautomaten mit den klassischen Symbolen der ersten mechanischen Geräte: Kirschen, Zitronen, Orangen, Pflaumen, Melonen, Trauben, Glocken, Sterne und die Sieben. In Deutschland sind sie vor allem durch die Spielhallen-Klassiker von Novomatic bekannt, etwa Sizzling Hot oder Ultra Hot. Online gibt es heute Hunderte Varianten – von schlichten 3-Walzen-Spielen bis zu modernen Slots mit Freispielen und Multiplikatoren.',
      ] },
      { h2: 'Klassisch oder modern: die zwei Arten von Früchte-Slots', paragraphs: [
        'Klassische Früchte-Slots kommen mit wenigen Linien und ohne Bonusrunde aus. Gewinne entstehen nur über die Linien und oft über einen Stern-Scatter, der überall zahlt. Das Spiel ist schnell und leicht zu verstehen – ideal, wenn du einfach drehen möchtest.',
        'Moderne Früchte-Slots nutzen dieselben Symbole, ergänzen sie aber um Funktionen wie Freispiele, expandierende Wilds, Kaskaden oder Gewinne überall auf dem Feld. Beispiele sind Fruit Party oder Fruit Shop. Sie sind abwechslungsreicher, schwanken aber oft stärker.',
      ] },
      { h2: 'Worauf du achten solltest', paragraphs: [
        'Vergleiche vor allem RTP und Volatilität. Viele klassische Früchte-Slots haben einen soliden RTP, aber einen niedrigen Maximalgewinn. Bei Novomatic-Klassikern veröffentlicht der Hersteller den RTP oft nicht zentral – dann findest du ihn in den Spielinformationen. Bei legalen deutschen Online-Spielotheken gilt außerdem ein Höchsteinsatz von 1 € pro Spin.',
      ] },
    ],
    faq: [
      { q: 'Kann man Früchte-Slots kostenlos spielen?', a: 'Ja. Viele Früchte-Slots kannst du bei uns als offizielle Demo mit Spielgeld spielen – ohne Anmeldung und ohne Download.' },
      { q: 'Welche Früchte-Slots sind am bekanntesten?', a: 'In Deutschland vor allem Sizzling Hot deluxe, Ultra Hot deluxe und Always Hot von Novomatic sowie moderne Spiele wie Fire Joker, Fruit Party und Fruit Shop.' },
      { q: 'Haben Früchte-Slots Freispiele?', a: 'Klassische Früchte-Slots meist nicht. Moderne Varianten bieten dagegen oft Freispiele, Multiplikatoren oder Respins.' },
      { q: 'Gibt es Tricks für Früchte-Slots?', a: 'Nein. Auch Früchte-Slots arbeiten mit einem Zufallsgenerator. Kein Rhythmus und kein Einsatzmuster ändern die Gewinnchancen.' },
    ],
  },
  megaways: {
    sections: [
      { h2: 'So funktionieren Megaways Spiele', paragraphs: [
        'Bei Megaways Spielen zeigt jede Walze pro Spin eine andere Zahl an Symbolen, meist zwischen zwei und sieben. Die Zahl der Gewinnwege ergibt sich aus der Multiplikation der Symbole pro Walze – bei sechs Walzen mit je sieben Symbolen sind es 117.649 Wege. Gewonnen wird, wenn gleiche Symbole auf benachbarten Walzen von links liegen, egal in welcher Reihe.',
      ] },
      { h2: 'Typische Features', paragraphs: [
        'Fast alle Megaways Slots kombinieren die Mechanik mit Kaskaden (Tumbles): Gewinnsymbole verschwinden, neue fallen nach. In den Freispielen steigt häufig ein Multiplikator mit jeder Kaskade. Manche Spiele haben eine Zusatzwalze über oder unter dem Feld, die weitere Symbole liefert.',
        'Bekannte Reihen sind die Megaways-Versionen von Big Bass, Great Rhino, Buffalo King oder The Dog House. Auch NetEnt hat mit Twin Spin Megaways, Divine Fortune Megaways und Fruit Shop Megaways eigene Varianten im Programm.',
      ] },
      { h2: 'Volatilität bei Megaways', paragraphs: [
        'Megaways Spiele sind oft hoch volatil: Lange Phasen mit kleinen Gewinnen wechseln sich mit seltenen großen Ausschlägen ab. Teste sie deshalb am besten zuerst kostenlos mit Spielgeld. Mehr dazu im Ratgeber zur Volatilität.',
      ] },
    ],
    faq: [
      { q: 'Was sind Megaways Spiele?', a: 'Spielautomaten, bei denen sich die Zahl der Symbole pro Walze mit jedem Spin ändert. Dadurch gibt es je nach Spin unterschiedlich viele Gewinnwege, oft bis zu 117.649.' },
      { q: 'Kann man Megaways Slots kostenlos spielen?', a: 'Ja. Alle Megaways Slots auf dieser Seite kannst du als offizielle Demo mit Spielgeld spielen, ohne Anmeldung.' },
      { q: 'Welche Megaways Slots sind beliebt?', a: 'Zum Beispiel Big Bass Bonanza Megaways, Great Rhino Megaways, Buffalo King Megaways, The Dog House Megaways und Twin Spin Megaways.' },
      { q: 'Wer hat Megaways erfunden?', a: 'Die Mechanik stammt vom australischen Entwickler Big Time Gaming, der sie an andere Hersteller lizenziert.' },
    ],
  },
  book: {
    sections: [
      { h2: 'Warum Book-Slots so beliebt sind', paragraphs: [
        'Mit Book of Ra hat Novomatic das Prinzip in Deutschlands Spielhallen bekannt gemacht. Online folgten Book of Dead von Play\'n GO und viele weitere Varianten. Das Spielprinzip ist immer ähnlich und schnell gelernt – die Spannung entsteht vor allem in den Freispielen, wenn das Sonderzeichen ganze Walzen füllt.',
      ] },
      { h2: 'Unterschiede zwischen den Book-Slots', paragraphs: [
        'Die Spiele unterscheiden sich vor allem bei RTP, Linienzahl, Maximalgewinn und Zusatzfunktionen. Manche Varianten bieten mehrere Sondersymbole gleichzeitig, wachsende Walzen oder zusätzliche Multiplikatoren. Vergleiche die Werte direkt auf den einzelnen Slot-Seiten.',
      ] },
    ],
    faq: [
      { q: 'Was ist der beliebteste Book-Slot?', a: 'In Deutschland vor allem Book of Ra deluxe von Novomatic und Book of Dead von Play\'n GO.' },
      { q: 'Kann man Book-Slots kostenlos spielen?', a: 'Ja. Viele Book-Slots gibt es bei uns als offizielle Demo mit Spielgeld. Für Novomatic-Spiele gibt es derzeit keine öffentliche Demo.' },
      { q: 'Wie funktioniert das Sondersymbol?', a: 'Vor den Freispielen wird ein Symbol ausgewählt. Es dehnt sich in den Freispielen über die ganze Walze aus und zahlt auch auf nicht benachbarten Walzen.' },
    ],
  },
  classic: {
    sections: [
      { h2: 'Was klassische Spielautomaten ausmacht', paragraphs: [
        'Klassische Slots erinnern an die Automaten aus Spielhallen und Kneipen: drei bis fünf Walzen, wenige feste Linien, Früchte und Siebenen. Statt komplexer Bonusrunden zählen die schnellen Spins. Viele Klassiker stammen von Novomatic, aber auch NetEnt, Play\'n GO und BGaming haben moderne Varianten im Programm.',
      ] },
    ],
    faq: [
      { q: 'Welche klassischen Slots sind bekannt?', a: 'Zum Beispiel Sizzling Hot deluxe, Ultra Hot deluxe, Mega Joker, Fire Joker und Always Hot.' },
      { q: 'Kann man klassische Slots kostenlos spielen?', a: 'Ja, viele davon als offizielle Demo mit Spielgeld – ohne Anmeldung.' },
    ],
  },
  'hold-and-win': {
    faq: [
      { q: 'Was ist ein Hold & Win Slot?', a: 'Ein Spielautomat mit Geldsymbolen und einer Respin-Bonusrunde. Geldsymbole bleiben stehen, jedes neue setzt die Respins zurück, am Ende werden alle Werte addiert.' },
      { q: 'Welche Hold & Win Slots sind beliebt?', a: 'Zum Beispiel Big Bass Bonanza, Floating Dragon, Wolf Gold, Chilli Heat und Le Bandit.' },
    ],
  },
};
for (const [k, v] of Object.entries(EXTRA)) Object.assign(CATEGORY_TEXT[k as CategoryCode], v);
