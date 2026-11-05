import type { BooleanOptions, NicheProfile } from '../types';

export function quoteTerm(t: string): string {
  const clean = t.trim().replace(/"/g, '');
  if (!clean) return '';
  return /[\s.\-/:]/.test(clean) ? `"${clean}"` : clean;
}

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((t) => {
    const k = t.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Upwork boolean syntax:
 *   (core1 OR core2 OR "core 3") AND (plus1 OR plus2) NOT wordpress NOT "data entry"
 */
export function buildBooleanQuery(o: Pick<BooleanOptions, 'coreTerms' | 'plusTerms' | 'excludeTerms' | 'excludeStyle'>): string {
  const core = uniq(o.coreTerms).map(quoteTerm).filter(Boolean);
  const plus = uniq(o.plusTerms).map(quoteTerm).filter(Boolean);
  const coreLower = new Set(core.map((c) => c.toLowerCase()));
  const excl = uniq(o.excludeTerms)
    .map(quoteTerm)
    .filter((t) => t && !coreLower.has(t.toLowerCase()));
  const parts: string[] = [];
  if (core.length) parts.push(core.length > 1 ? `(${core.join(' OR ')})` : core[0]);
  if (plus.length) parts.push(`${parts.length ? 'AND ' : ''}${plus.length > 1 ? `(${plus.join(' OR ')})` : plus[0]}`);
  for (const e of excl) parts.push(o.excludeStyle === 'minus' ? `-${e}` : `NOT ${e}`);
  return parts.join(' ');
}

export function buildUpworkSearchUrl(o: BooleanOptions): string {
  const q = buildBooleanQuery(o);
  const params = new URLSearchParams();
  params.set('q', q);
  params.set('sort', 'recency');
  if (o.paymentVerified) params.set('payment_verified', '1');
  if (o.contractType === 'hourly') params.set('t', '0');
  if (o.contractType === 'fixed') params.set('t', '1');
  if (o.minBudget > 0 && o.contractType !== 'hourly') params.set('amount', `${o.minBudget}-`);
  if (o.minHourly > 0 && o.contractType !== 'fixed') params.set('hourly_rate', `${o.minHourly}-`);
  return `https://www.upwork.com/nx/search/jobs/?${params.toString()}`;
}

export function defaultBooleanOptions(n: NicheProfile): BooleanOptions {
  return {
    coreTerms: [...n.coreTerms],
    plusTerms: [],
    excludeTerms: [...n.defaultExcludes],
    excludeStyle: 'NOT',
    paymentVerified: true,
    minBudget: 500,
    minHourly: n.minHourly,
    contractType: 'any',
  };
}
