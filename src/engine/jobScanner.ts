import type { ContractType, Deal, JobInput, PortfolioProject, ScannedJob, ScanResult } from '../types';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData';
import { analyzeJD } from './jdAnalyzer';
import { matchProjects } from './portfolioMatcher';
import { scoreWinRate } from './winRateScorer';
import { calculateBid, formatUsd } from './bidCalculator';
import { hashString, normalize } from './text';

/**
 * Batch scanner: Dũng copies an Upwork search-results page (Ctrl+A → Ctrl+C),
 * a job-alert email, or several JDs separated by "---", pastes it once, and
 * every job is parsed, scored and ranked. Nothing is fetched from Upwork,
 * so there is no scraping and no risk to the Upwork account.
 */

/** Hire rate is not shown on search tiles — use a neutral value (no bonus, no penalty). */
export const UNKNOWN_HIRE_RATE = 50;

const POSTED_RE = /^(job\s+)?posted\b.*$|^(\d+\s+(second|minute|hour|day|week|month)s?|an?\s+(minute|hour|day|week)|yesterday|last week|just now)\s+ago$/i;
const SEP_RE = /^(-{3,}|={3,}|_{3,}|\*{3,})$/;
const HOURLY_RE = /hourly(?:\s*rate|\s*range)?\s*:?\s*\$\s?([\d.,]+)(?:\s*(?:-|–|to)\s*\$\s?([\d.,]+))?/i;
const HOURLY_WORD_RE = /^hourly\b/i;
const BUDGET_RE = /(?:est\.?\s*budget|budget|fixed[- ]price)\s*:?\s*\$\s?([\d.,]+)\s*(k\b)?/i;
const FIXED_WORD_RE = /fixed[- ]price/i;
const UNVERIFIED_RE = /payment (method )?(unverified|not verified)/i;
const VERIFIED_RE = /payment (method )?verified/i;
const SPENT_RE = /\$\s?([\d.,]+)\s*([KkMm])?\+?\s*(?:total\s+)?spent/;
const PROPOSALS_RE = /proposals?\s*:?\s*(less than 5|(\d+)\s*to\s*(\d+)|(\d+)\s*\+)/i;
const RATING_RE = /rating is ([\d.]+) out of 5|([\d.]+)\s*(?:out of 5|of 5 stars)/i;
const HIRE_RE = /(\d{1,3})\s*%\s*hire rate/i;
const LOCATION_RE = /^(?:location|country)\s*:\s*(.+)$/i;
const TITLE_RE = /^(?:title|job title)\s*:\s*(.+)$/i;
const DESC_RE = /^(?:description|jd)\s*:\s*/i;
const NOISE_RE = /^(more|less|see more|save job|job feedback|apply now|search results|jobs you might like|best matches|most recent|u.s. only|saved jobs|load more jobs|entry level|intermediate|expert|spent|\$[\d.,]+[KkMm]?\+?|rating is .* out of 5\.?|est\.? time:.*|less than \d+ hrs\/week|more than \d+ hrs\/week|\d+ to \d+ months.*|payment (method )?(un)?verified)$/i;

export const COUNTRIES = [
  'United States', 'USA', 'United Kingdom', 'UK', 'Canada', 'Australia', 'New Zealand', 'Germany', 'France', 'Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Spain', 'Portugal', 'Italy', 'Poland', 'Czech Republic',
  'Romania', 'Ukraine', 'Israel', 'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 'Turkey', 'Egypt', 'South Africa', 'Nigeria',
  'Kenya', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines',
  'Hong Kong', 'Taiwan', 'Japan', 'South Korea', 'China', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Estonia',
  'Lithuania', 'Latvia', 'Greece', 'Hungary', 'Bulgaria', 'Serbia', 'Croatia', 'Cyprus', 'Malta', 'Luxembourg', 'Iceland',
];
const COUNTRY_SET = new Map(COUNTRIES.map((c) => [c.toLowerCase(), c]));

/** Identity of a job across pastes: title + money + client country (description text can pick up page chrome). */
export function jobId(job: JobInput): string {
  const money = job.contractType === 'hourly' ? `h${job.hourlyMin}-${job.hourlyMax}` : `f${job.budget}`;
  return `scan_${hashString(`${normalize(job.title)}|${money}|${normalize(job.client.country)}`).toString(36)}`;
}

function num(s: string | undefined): number {
  if (!s) return 0;
  return Number(s.replace(/,/g, '')) || 0;
}

function money(amount: string, suffix?: string): number {
  const n = num(amount);
  const s = (suffix ?? '').toLowerCase();
  return s === 'k' ? n * 1000 : s === 'm' ? n * 1_000_000 : n;
}

/** Split pasted text into one block per job. */
export function splitJobBlocks(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim());
  const blocks: string[][] = [];
  const hasSep = lines.some((l) => SEP_RE.test(l));
  let cur: string[] = [];
  const flush = () => {
    const b = cur.filter(Boolean);
    if (b.length) blocks.push(b);
    cur = [];
  };
  if (hasSep) {
    for (const l of lines) {
      if (SEP_RE.test(l)) flush();
      else cur.push(l);
    }
  } else if (lines.some((l) => POSTED_RE.test(l))) {
    for (const l of lines) {
      if (POSTED_RE.test(l) && cur.some(Boolean)) flush();
      cur.push(l);
    }
  } else cur = lines;
  flush();
  // drop page chrome before the first real job (e.g. "Search results")
  return blocks.filter((b) => b.join(' ').length >= 40);
}

export function parseJobBlock(lines: string[]): ScannedJob | null {
  const joined = lines.join(' ');
  const missing: string[] = [];
  let postedText: string | undefined;
  let title = '';
  let country = '';
  const desc: string[] = [];

  for (const l of lines) {
    if (!postedText && POSTED_RE.test(l)) {
      postedText = l;
      continue;
    }
    const t = TITLE_RE.exec(l);
    if (t && !title) {
      title = t[1].trim();
      continue;
    }
    const loc = LOCATION_RE.exec(l);
    if (loc) {
      country = loc[1].trim();
      continue;
    }
    if (COUNTRY_SET.has(l.toLowerCase())) {
      country = COUNTRY_SET.get(l.toLowerCase())!;
      continue;
    }
    const isMeta =
      HOURLY_RE.test(l) || (HOURLY_WORD_RE.test(l) && l.length < 120) || BUDGET_RE.test(l) || (FIXED_WORD_RE.test(l) && l.length < 120) ||
      SPENT_RE.test(l) || PROPOSALS_RE.test(l) || RATING_RE.test(l) || HIRE_RE.test(l) || NOISE_RE.test(l);
    if (isMeta) continue;
    if (!title) {
      title = l;
      continue;
    }
    desc.push(l.replace(DESC_RE, ''));
  }
  if (!title) return null;

  let contractType: ContractType = 'fixed';
  let budget = 0;
  let hourlyMin = 0;
  let hourlyMax = 0;
  const h = HOURLY_RE.exec(joined);
  if (h) {
    contractType = 'hourly';
    hourlyMin = num(h[1]);
    hourlyMax = h[2] ? num(h[2]) : hourlyMin;
  } else if (/\bhourly\b/i.test(joined) && !FIXED_WORD_RE.test(joined)) {
    contractType = 'hourly';
    missing.push('hourly rate');
  } else {
    const b = BUDGET_RE.exec(joined);
    if (b) budget = money(b[1], b[2]);
    else missing.push('budget');
  }

  let paymentVerified = true;
  if (UNVERIFIED_RE.test(joined)) paymentVerified = false;
  else if (!VERIFIED_RE.test(joined)) missing.push('payment');

  const s = SPENT_RE.exec(joined);
  const totalSpent = s ? money(s[1], s[2]) : 0;
  if (!s) missing.push('spent');

  const p = PROPOSALS_RE.exec(joined);
  let proposals = 10;
  if (p) {
    if (/less than 5/i.test(p[1])) proposals = 3;
    else if (p[2]) proposals = Math.round((num(p[2]) + num(p[3])) / 2);
    else proposals = num(p[4]);
  } else missing.push('proposals');

  const r = RATING_RE.exec(joined);
  const rating = r ? num(r[1] ?? r[2]) : undefined;

  const hr = HIRE_RE.exec(joined);
  const hireRate = hr ? num(hr[1]) : UNKNOWN_HIRE_RATE;
  if (!hr) missing.push('hire rate');
  if (!country) missing.push('country');

  const description = desc.join('\n').trim();
  const job: JobInput = {
    title,
    description,
    contractType,
    budget,
    hourlyMin,
    hourlyMax,
    client: { country, paymentVerified, totalSpent, hireRate, proposals, rating },
  };
  return { id: jobId(job), job, postedText, missing };
}

/** JSON array input (e.g. from Upwork's official API or another tool). */
export function parseJobsJson(text: string): ScannedJob[] {
  const data: unknown = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data as { jobs?: unknown }).jobs;
  if (!Array.isArray(arr)) throw new Error('JSON phải là mảng job');
  return arr
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && typeof (x as { title?: unknown }).title === 'string')
    .map((x) => {
      const client = (x.client ?? {}) as Partial<JobInput['client']>;
      const job: JobInput = {
        title: String(x.title),
        description: String(x.description ?? ''),
        contractType: x.contractType === 'hourly' ? 'hourly' : 'fixed',
        budget: Number(x.budget) || 0,
        hourlyMin: Number(x.hourlyMin) || 0,
        hourlyMax: Number(x.hourlyMax) || 0,
        url: typeof x.url === 'string' ? x.url : undefined,
        client: {
          country: client.country ?? '',
          paymentVerified: client.paymentVerified ?? true,
          totalSpent: Number(client.totalSpent) || 0,
          hireRate: client.hireRate ?? UNKNOWN_HIRE_RATE,
          proposals: Number(client.proposals) || 10,
          rating: client.rating,
        },
      };
      return { id: jobId(job), job, missing: [] };
    });
}

export function parseScanInput(text: string): ScannedJob[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const list = /^[[{]/.test(trimmed) ? parseJobsJson(trimmed) : splitJobBlocks(trimmed).map(parseJobBlock).filter((j): j is ScannedJob => !!j);
  const seen = new Set<string>();
  return list.filter((j) => (seen.has(j.id) ? false : (seen.add(j.id), true)));
}

export function findDuplicate(job: JobInput, deals: Deal[]): Deal | undefined {
  const t = normalize(job.title);
  return deals.find((d) => normalize(d.title) === t);
}

export function scoreScanned(scanned: ScannedJob[], projects: PortfolioProject[] = PORTFOLIO_PROJECTS, deals: Deal[] = []): ScanResult[] {
  return scanned
    .map<ScanResult>((s) => {
      const analysis = analyzeJD(s.job);
      const matches = matchProjects(analysis, projects);
      const win = scoreWinRate(s.job, analysis, matches);
      const bid = calculateBid(s.job, analysis, win);
      const r = { analysis, matches, win, bid };
      const best = matches[0];
      return {
        scanned: s,
        winRate: r.win.total,
        verdict: r.win.verdict,
        niche: r.analysis.primaryNiche,
        topProject: best ? `${best.project.code} ${best.project.shortName}` : '—',
        topProjectScore: best?.score ?? 0,
        bidLabel: r.bid.selected.rate !== undefined ? `$${r.bid.selected.rate}/h` : formatUsd(r.bid.selected.gross),
        redFlags: r.analysis.redFlags.length,
        duplicateOf: findDuplicate(s.job, deals)?.id,
      };
    })
    .sort((a, b) => b.winRate - a.winRate);
}

export function scanJobs(text: string, projects: PortfolioProject[] = PORTFOLIO_PROJECTS, deals: Deal[] = []): ScanResult[] {
  return scoreScanned(parseScanInput(text), projects, deals);
}
