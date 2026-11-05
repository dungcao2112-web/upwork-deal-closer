/** Text helpers shared by all engines (pure, deterministic). */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const regexCache = new Map<string, RegExp>();

/** Word-boundary regex that works for terms like "three.js", "c#", "9:16". */
export function termRegex(alias: string): RegExp {
  let re = regexCache.get(alias);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias.toLowerCase())}(?=$|[^a-z0-9])`, 'g');
    regexCache.set(alias, re);
  }
  re.lastIndex = 0;
  return re;
}

export function countOccurrences(normalizedText: string, alias: string): number {
  const re = termRegex(alias);
  let n = 0;
  while (re.exec(normalizedText) !== null) n++;
  return n;
}

export function containsTerm(normalizedText: string, alias: string): boolean {
  return countOccurrences(normalizedText, alias) > 0;
}

export function wordCount(text: string): number {
  const m = text.trim().match(/[A-Za-z0-9À-ỹ][\w'’.\-/+#À-ỹ]*/g);
  return m ? m.length : 0;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((s) => s.length > 3);
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;
}

export function joinNatural(items: string[], conj = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} ${conj} ${items[items.length - 1]}`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Stable hash → used to pick deterministic variants. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
