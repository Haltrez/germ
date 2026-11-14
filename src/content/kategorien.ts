/** German intro texts for category pages (original editorial copy). */
import type { CategoryCode } from '../config/routes.ts';

export const CATEGORY_TEXT: Record<CategoryCode, { title: string; description: string; intro: string[] }> = {
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
    title: 'Megaways Slots kostenlos spielen – Demos ohne Anmeldung',
    description: 'Megaways Slots kostenlos spielen: Spielautomaten mit wechselnder Walzenhöhe und vielen Gewinnwegen als Spielgeld-Demo ohne Anmeldung.',
    intro: [
      'Megaways ist eine Spielmechanik, bei der sich die Zahl der Symbole pro Walze mit jedem Spin ändert. Dadurch schwankt auch die Zahl der möglichen Gewinnwege – bei vielen Spielen von wenigen hundert bis zu über hunderttausend. Gewonnen wird, wenn gleiche Symbole auf benachbarten Walzen von links nach rechts liegen, egal in welcher Reihe.',
      'Viele Megaways-Slots kombinieren die Mechanik mit Kaskaden: Gewinnsymbole verschwinden, neue fallen nach, und so sind mehrere Gewinne in einem Spin möglich. Megaways-Spiele sind oft hoch volatil. Teste sie am besten zuerst kostenlos mit Spielgeld.',
    ],
  },
  fruit: {
    title: 'Früchte-Slots kostenlos spielen – Klassiker als Demo',
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
