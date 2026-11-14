/** Small helpers shared by the compliance scripts. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const ROOT = new URL('..', import.meta.url).pathname;

export function walk(dir: string, filter: (p: string) => boolean): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

export const rel = (p: string) => relative(ROOT, p);
export const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as unknown;

export class Report {
  errors: string[] = [];
  warnings: string[] = [];
  notes: string[] = [];
  error(msg: string) { this.errors.push(msg); }
  warn(msg: string) { this.warnings.push(msg); }
  note(msg: string) { this.notes.push(msg); }
  print(title: string) {
    const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
    const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
    const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
    console.log(`\n── ${title} ──`);
    for (const n of this.notes) console.log(`  · ${n}`);
    for (const w of this.warnings) console.log(yellow(`  ⚠ ${w}`));
    for (const e of this.errors) console.log(red(`  ✖ ${e}`));
    if (this.errors.length) {
      console.log(red(`\n${this.errors.length} error(s), ${this.warnings.length} warning(s). Build blocked.\n`));
      process.exit(1);
    }
    console.log(green(`  ✔ passed with ${this.warnings.length} warning(s)\n`));
  }
}
