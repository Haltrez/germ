/** German labels for language-neutral data codes. */
import type { VOLATILITY, FEATURES, PAYMENT_METHODS } from '../../schemas/index.ts';

export const volatilityLabel: Record<(typeof VOLATILITY)[number], string> = {
  low: 'niedrig',
  medium: 'mittel',
  high: 'hoch',
  'very-high': 'sehr hoch',
};

export const featureLabel: Record<(typeof FEATURES)[number], string> = {
  'free-spins': 'Freispiele',
  'expanding-symbols': 'Expandierende Symbole',
  multipliers: 'Multiplikatoren',
  wilds: 'Wild-Symbole',
  'sticky-wilds': 'Sticky Wilds',
  'walking-wilds': 'Wandernde Wilds',
  'scatter-pays': 'Scatter-Gewinne',
  cascades: 'Kaskaden (Tumble)',
  'cluster-pays': 'Cluster-Gewinne',
  megaways: 'Megaways',
  'hold-and-win': 'Hold & Win',
  respins: 'Respins',
  gamble: 'Risikospiel',
  retrigger: 'Retrigger',
};

export const paymentLabel: Record<(typeof PAYMENT_METHODS)[number], string> = {
  paypal: 'PayPal',
  paysafecard: 'Paysafecard',
  trustly: 'Trustly',
  klarna: 'Klarna',
  visa: 'Visa',
  mastercard: 'Mastercard',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  'bank-transfer': 'Banküberweisung',
  skrill: 'Skrill',
  neteller: 'Neteller',
};

/** Shown wherever a data value is still "TODO". */
export const UNVERIFIED = 'wird geprüft';

export const formatDateDE = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }).format(
    new Date(iso),
  );
