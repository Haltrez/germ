# KostenloseSpielautomaten

German free-slot demo & GGL-licensed Spielothek comparison site (`kostenlosespielautomaten.de`).
Astro 7 (static) · TypeScript · Tailwind CSS 4 · Zod · Preact islands.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | **Data compliance check → Astro build → audit of every built page.** Fails on any violation. |
| `npm run check` | TypeScript / Astro diagnostics |
| `node scripts/make-images.ts` | Regenerates favicon PNGs and the default OG image |

## Where things live

- `src/config/site.ts` – domain, brand name, company placeholders, RG helpline, ad-time flag, demo host allowlist
- `src/config/routes.ts` – navigation, categories, temporary "im Aufbau" stub pages (noindex)
- `src/schemas/index.ts` – Zod schemas (Slot, Provider, Operator, Author, Guide, Glossary)
- `src/data/*/` – one JSON file per slot / provider / operator / author (`_TEMPLATE.json` files are ignored)
- `src/content/` – German texts (slot reviews in `slot-texts/de/`, guides, glossary)
- `src/lib/compliance.ts` – forbidden phrases, allowed CTA labels, operator guard
- `scripts/compliance-*.ts` – build-blocking compliance checks

## Compliance rules enforced by the build

- Operators without `gglLicensed: true` + `licenseNumber` + `gglWhitelistCheckedAt` cannot have an affiliate link,
  be featured, or be listed on a slot. `<OperatorCta>` throws if used with one.
- Whitelist check older than 90 days fails the build (warning after 30).
- Illegal-offer phrases ("ohne OASIS", "Curaçao Casino", …), hype wording and "Online Casino" fail the build,
  except on pages marked `complianceContext: informational`, which may not contain affiliate links.
- Every page must show 18+, "Glücksspiel kann süchtig machen", helpline phone, check-dein-spiel.de and a link to
  /verantwortungsvoll-spielen/.
- Affiliate links need `rel="sponsored nofollow"`, a nearby disclosure and a GGL-verified operator.
- Demo iframe hosts must be on `DEMO_HOST_ALLOWLIST`.
- SEO basics: one H1, title ≤ 60, description ≤ 155, canonical, unique titles, no broken internal links.
