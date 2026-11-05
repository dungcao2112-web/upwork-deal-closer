import type {
  DetectedKeyword,
  EdgeCase,
  Flag,
  JobAnalysis,
  JobInput,
  NicheId,
  PainPoint,
  TechTerm,
} from '../types';
import { TECH_LEXICON, LEXICON_BY_ID } from '../data/techLexicon';
import { EDGE_CASES } from '../data/edgeCases';
import { NICHE_IDS } from '../data/niches';
import { countOccurrences, normalize, round, splitSentences, truncate, wordCount } from './text';

// ── Keyword detection ────────────────────────────────────────
export function detectKeywords(title: string, description: string): DetectedKeyword[] {
  const nTitle = normalize(title);
  const nBody = normalize(description);
  const out: DetectedKeyword[] = [];
  for (const term of TECH_LEXICON) {
    let count = 0;
    let inTitle = false;
    for (const alias of term.aliases) {
      const t = countOccurrences(nTitle, alias);
      const b = countOccurrences(nBody, alias);
      if (t > 0) inTitle = true;
      count += t + b;
    }
    if (count > 0) out.push({ term, count, inTitle });
  }
  return out.sort(
    (a, b) =>
      Number(b.inTitle) - Number(a.inTitle) ||
      b.count * b.term.difficulty - a.count * a.term.difficulty,
  );
}

/** Weight of a keyword in scoring: rarer/harder tech matters more; title mentions boost. */
export function keywordWeight(k: DetectedKeyword): number {
  return k.term.difficulty * (k.inTitle ? 1.6 : 1) * Math.min(1 + (k.count - 1) * 0.25, 2);
}

export function scoreNiches(keywords: DetectedKeyword[]): Record<NicheId, number> {
  const raw: Record<NicheId, number> = { video: 0, agents: 0, localai: 0, '3d': 0, ota: 0 };
  for (const k of keywords) {
    if (!k.term.niches.length) continue;
    const share = keywordWeight(k) / k.term.niches.length;
    // primary niche of a term (first listed) gets a bit more weight
    k.term.niches.forEach((n, i) => {
      raw[n] += share * (i === 0 ? 1.25 : 0.85);
    });
  }
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const out = { ...raw };
  for (const n of NICHE_IDS) out[n] = total ? round((raw[n] / total) * 100) : 0;
  return out;
}

export function pickPrimaryNiche(scores: Record<NicheId, number>, fallback: NicheId = 'agents'): NicheId {
  let best: NicheId = fallback;
  let bestScore = -1;
  for (const n of NICHE_IDS) {
    if (scores[n] > bestScore) {
      best = n;
      bestScore = scores[n];
    }
  }
  return bestScore <= 0 ? fallback : best;
}

export function impliedStack(keywords: DetectedKeyword[]): TechTerm[] {
  const present = new Set(keywords.map((k) => k.term.id));
  const implied = new Map<string, TechTerm>();
  for (const k of keywords) {
    for (const id of k.term.implies ?? []) {
      if (!present.has(id) && LEXICON_BY_ID[id]) implied.set(id, LEXICON_BY_ID[id]);
    }
  }
  return [...implied.values()];
}

// ── Pain points ──────────────────────────────────────────────
interface PainRule {
  id: string;
  re: RegExp;
  titleEn: string;
  titleVi: string;
  addressEn: string;
}

const PAIN_RULES: PainRule[] = [
  {
    id: 'manual-time',
    re: /\b(manual(ly)?|by hand|hours? (per|a|each|every)|takes? \d+ hours?|time[- ]consuming|spend[s]? \d+)/i,
    titleEn: 'Manual work is eating hours every day',
    titleVi: 'Công việc thủ công đang "ngốn" nhiều giờ mỗi ngày',
    addressEn: 'remove the manual steps end-to-end so your team only reviews results',
  },
  {
    id: 'scale',
    re: /\b(scale|scaling|hundreds|thousands|\d+\+? (videos|images|photos|tasks|jobs|requests) (a|per) day|batch|bulk|volume|can'?t scale)/i,
    titleEn: 'Current process cannot scale to the volume they need',
    titleVi: 'Quy trình hiện tại không mở rộng được theo sản lượng cần',
    addressEn: 'run it as a queued, parallel pipeline that scales with volume instead of headcount',
  },
  {
    id: 'previous-failed',
    re: /\b(previous (freelancer|developer|attempt|dev)|last (freelancer|developer)|didn'?t work|failed|crash(ed|es)?|kept getting|broken|went out of business|tried .{0,30} but)/i,
    titleEn: 'A previous attempt already failed — they need someone who has solved it before',
    titleVi: 'Đã từng thất bại với người/công cụ trước — cần người đã giải quyết thật',
    addressEn: 'start from a system that already works in production, not an experiment',
  },
  {
    id: 'quality',
    re: /\b(quality|consistent|natural|realistic|smooth|professional|clean edges|no foot sliding|too quiet|identity)/i,
    titleEn: 'Output quality must be consistent and look professional',
    titleVi: 'Chất lượng đầu ra phải đồng đều & chuyên nghiệp',
    addressEn: 'measure quality with objective checks (not eyeballing) before anything ships',
  },
  {
    id: 'cost',
    re: /\b(cost|costs|expensive|api costs?|per[- ]image|per[- ]call|bill|cheaper|budget is)/i,
    titleEn: 'Running costs (APIs, cloud, people) are too high',
    titleVi: 'Chi phí vận hành (API, cloud, nhân sự) quá cao',
    addressEn: 'move heavy work onto local/GPU infrastructure and cheaper models where quality allows',
  },
  {
    id: 'blocked',
    re: /\b(blocked|bot detection|cloudflare|captcha|detected|banned)/i,
    titleEn: 'Their automation keeps getting blocked',
    titleVi: 'Automation liên tục bị chặn (anti-bot / Cloudflare)',
    addressEn: 'drive a real browser session so the automation looks like a normal user',
  },
  {
    id: 'mistakes-money',
    re: /\b(miss(ed)? mistakes|cost us|lost (money|bookings)|overbooking|wrong rate|errors?|mismatch(es)?)/i,
    titleEn: 'Errors are directly costing them money',
    titleVi: 'Sai sót đang gây mất tiền trực tiếp',
    addressEn: 'catch errors automatically with alerts before they reach customers',
  },
  {
    id: 'privacy',
    re: /\b(privacy|never leave|on[- ]prem|self[- ]hosted|own (gpu|server)|offline|gdpr|confidential)/i,
    titleEn: 'Data must stay private / on their own infrastructure',
    titleVi: 'Dữ liệu phải bảo mật, chạy trên hạ tầng riêng',
    addressEn: 'keep everything self-hosted with no third-party calls on sensitive data',
  },
  {
    id: 'reliability',
    re: /\b(claim(ed)? success|hallucinat|loop(ing)?|reliab|verified|timing out|time out|timeouts?|retries)/i,
    titleEn: 'They need reliability — not demos that break in production',
    titleVi: 'Cần độ tin cậy — không phải demo chạy được 1 lần',
    addressEn: 'gate every step with independent automated verification and retries',
  },
  {
    id: 'no-docs',
    re: /\b(no documentation|undocumented|legacy|documented code|documentation|handover)/i,
    titleEn: 'Maintainability & handover matter (docs, clean code)',
    titleVi: 'Cần code sạch, tài liệu rõ & bàn giao tử tế',
    addressEn: 'hand over documented, tested code your team can maintain',
  },
  {
    id: 'visibility',
    re: /\b(dashboard|monitor|real[- ]time|status|alert|report)/i,
    titleEn: 'No visibility into what the system is doing',
    titleVi: 'Thiếu khả năng quan sát hệ thống (dashboard, cảnh báo)',
    addressEn: 'give them a live dashboard and alerts instead of guessing',
  },
];

export function extractPainPoints(job: JobInput): PainPoint[] {
  const text = `${job.title}\n${job.description}`;
  const sentences = splitSentences(text);
  const out: PainPoint[] = [];
  for (const rule of PAIN_RULES) {
    const hit = sentences.find((s) => rule.re.test(s));
    if (hit) {
      out.push({
        id: rule.id,
        titleEn: rule.titleEn,
        titleVi: rule.titleVi,
        evidence: truncate(hit, 160),
        addressEn: rule.addressEn,
      });
    }
  }
  if (out.length === 0) {
    out.push({
      id: 'generic-outcome',
      titleEn: 'They need a working result fast, with low risk',
      titleVi: 'Khách cần kết quả chạy được nhanh, rủi ro thấp',
      evidence: truncate(sentences[0] ?? job.title, 160),
      addressEn: 'show a working prototype early so they can judge real output',
    });
  }
  return out.slice(0, 6);
}

// ── Flags ────────────────────────────────────────────────────
interface FlagRule {
  id: string;
  re: RegExp;
  textEn: string;
  textVi: string;
  severity: Flag['severity'];
}

const RED_FLAG_RULES: FlagRule[] = [
  { id: 'off-platform', re: /\b((contact|reach|message|text|add|ping) me (on|via|at) (telegram|whatsapp|skype|discord|wechat|email)|(telegram|whatsapp|skype|discord|wechat) for (faster|quick(er)?|better|direct) communication|outside (of )?upwork)/i, textEn: 'Asks to move communication off Upwork', textVi: 'Đòi liên hệ ngoài Upwork (vi phạm ToS, rủi ro lừa đảo)', severity: 'high' },
  { id: 'free-work', re: /\b(free (test|sample|trial)|unpaid|test task for free|sample work before)/i, textEn: 'Requests free/unpaid work', textVi: 'Đòi làm thử miễn phí', severity: 'high' },
  { id: 'quick-easy', re: /\b(quick and easy|should be (quick|easy|simple)|(a|one|this is a) simple task\b|easy for an expert|only takes? (a few|\d) hours?)/i, textEn: 'Underestimates scope ("quick & easy")', textVi: 'Đánh giá thấp khối lượng ("nhanh và dễ")', severity: 'medium' },
  { id: 'cheap', re: /\b(low budget|tight budget|cheap(est)? (developer|freelancer|price|rate|bid)|cheapest\b|lowest (price|bid)|budget is limited)/i, textEn: 'Price-shopping language', textVi: 'Ngôn ngữ săn giá rẻ', severity: 'medium' },
  { id: 'rockstar', re: /\b(rockstar|ninja|guru|unicorn)\b/i, textEn: 'Buzzword-heavy hiring language', textVi: 'Ngôn ngữ tuyển dụng sáo rỗng', severity: 'low' },
  { id: 'urgent', re: /\b(asap|urgent(ly)?|by tomorrow|within 24 hours|immediately)\b/i, textEn: 'Extreme urgency — scope creep risk', textVi: 'Gấp gáp cực độ — dễ phình phạm vi', severity: 'low' },
  { id: 'bypass', re: /\b(bypass (login|paywall|security)|crack|pirat|scrape (personal|private) data)/i, textEn: 'Possible ToS/legal grey area', textVi: 'Có dấu hiệu vùng xám pháp lý / ToS', severity: 'high' },
];

const GREEN_FLAG_RULES: FlagRule[] = [
  { id: 'long-term', re: /\b(long[- ]term|ongoing work|more projects|retainer)/i, textEn: 'Long-term / ongoing work potential', textVi: 'Tiềm năng hợp tác dài hạn', severity: 'low' },
  { id: 'examples', re: /\b(share (any|examples?)|show us|real examples|portfolio|similar .{0,20} you have built)/i, textEn: 'Client wants proof — your working prototypes win here', textVi: 'Khách đòi bằng chứng — app chạy thật của Dũng thắng tuyệt đối', severity: 'low' },
  { id: 'specific', re: /\b(requirements|deliverables|scope|must have|needs?:)/i, textEn: 'Clear requirements / defined scope', textVi: 'Yêu cầu rõ ràng, phạm vi xác định', severity: 'low' },
  { id: 'tests', re: /\b(tests?|test suite|documented|clean architecture)\b/i, textEn: 'Values engineering quality (tests, docs)', textVi: 'Coi trọng chất lượng kỹ thuật (test, tài liệu)', severity: 'low' },
];

export function detectFlags(job: JobInput): { red: Flag[]; green: Flag[] } {
  const text = `${job.title}\n${job.description}`;
  const red: Flag[] = [];
  const green: Flag[] = [];
  for (const r of RED_FLAG_RULES) if (r.re.test(text)) red.push({ id: r.id, textEn: r.textEn, textVi: r.textVi, severity: r.severity });
  for (const r of GREEN_FLAG_RULES) if (r.re.test(text)) green.push({ id: r.id, textEn: r.textEn, textVi: r.textVi, severity: r.severity });

  const c = job.client;
  if (!c.paymentVerified) red.push({ id: 'payment-unverified', textEn: 'Payment method not verified', textVi: 'Khách CHƯA xác minh thanh toán', severity: 'high' });
  else green.push({ id: 'payment-verified', textEn: 'Payment verified', textVi: 'Đã xác minh thanh toán', severity: 'low' });
  if (c.totalSpent <= 0) red.push({ id: 'no-history', textEn: 'No hiring history on Upwork', textVi: 'Khách chưa từng chi tiêu trên Upwork', severity: 'medium' });
  else if (c.totalSpent >= 10000) green.push({ id: 'big-spender', textEn: `Spent $${Math.round(c.totalSpent / 1000)}k+ on Upwork`, textVi: `Đã chi $${Math.round(c.totalSpent / 1000)}k+ trên Upwork`, severity: 'low' });
  if (c.totalSpent > 0 && c.hireRate > 0 && c.hireRate < 30) red.push({ id: 'low-hire-rate', textEn: `Low hire rate (${c.hireRate}%)`, textVi: `Tỷ lệ thuê thấp (${c.hireRate}%)`, severity: 'medium' });
  if (c.hireRate >= 60) green.push({ id: 'high-hire-rate', textEn: `High hire rate (${c.hireRate}%)`, textVi: `Tỷ lệ thuê cao (${c.hireRate}%)`, severity: 'low' });
  if (c.proposals >= 50) red.push({ id: 'crowded', textEn: `Crowded job (${c.proposals}+ proposals)`, textVi: `Quá đông ứng viên (${c.proposals}+ proposals)`, severity: 'medium' });
  else if (c.proposals < 10) green.push({ id: 'early', textEn: `Early mover advantage (${c.proposals} proposals)`, textVi: `Vào sớm (mới ${c.proposals} proposals)`, severity: 'low' });
  if (job.contractType === 'fixed' && job.budget > 0 && job.budget < 150) red.push({ id: 'tiny-budget', textEn: `Very low fixed budget ($${job.budget})`, textVi: `Ngân sách quá thấp ($${job.budget})`, severity: 'high' });
  if (job.contractType === 'hourly' && job.hourlyMax > 0 && job.hourlyMax < 20) red.push({ id: 'low-rate', textEn: `Low hourly ceiling ($${job.hourlyMax}/h)`, textVi: `Trần giá giờ thấp ($${job.hourlyMax}/h)`, severity: 'medium' });
  if (c.rating !== undefined && c.rating > 0 && c.rating < 4) red.push({ id: 'low-rating', textEn: `Low client rating (${c.rating})`, textVi: `Khách bị đánh giá thấp (${c.rating}★)`, severity: 'medium' });
  return { red, green };
}

// ── Edge cases ───────────────────────────────────────────────
export function matchEdgeCases(keywords: DetectedKeyword[], primary: NicheId, limit = 5): EdgeCase[] {
  const ids = new Set(keywords.map((k) => k.term.id));
  const scored = EDGE_CASES.map((e) => {
    const hits = e.triggers.filter((t) => ids.has(t)).length;
    return { e, hits, score: hits * 10 + (e.niche === primary ? 4 : 0) + (hits >= 2 ? 3 : 0) };
  }).filter((x) => (x.e.niche === primary && x.hits >= 1) || x.hits >= 2);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.e);
}

// ── Deliverables ─────────────────────────────────────────────
export function extractDeliverables(description: string): string[] {
  const lines = description.split(/\n/).map((l) => l.trim());
  const bullets = lines
    .filter((l) => /^([-*•]|\d+[.)])\s+/.test(l))
    .map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, '').trim())
    .filter((l) => l.length > 3);
  if (bullets.length) return bullets.slice(0, 10);
  return splitSentences(description)
    .filter((s) => /\b(need|must|should|want|require|build|create|deliver)/i.test(s))
    .slice(0, 6);
}

// ── Orchestrator ─────────────────────────────────────────────
export function analyzeJD(job: JobInput): JobAnalysis {
  const keywords = detectKeywords(job.title, job.description);
  const nicheScores = scoreNiches(keywords);
  const primaryNiche = pickPrimaryNiche(nicheScores);
  const { red, green } = detectFlags(job);
  const matched = keywords.filter((k) => k.term.dungHas);
  const mismatched = keywords.filter((k) => !k.term.dungHas);
  const avgDifficulty = matched.length
    ? round(matched.reduce((s, k) => s + k.term.difficulty, 0) / matched.length, 2)
    : 1;
  return {
    keywords,
    matchedIds: matched.map((k) => k.term.id),
    mismatchIds: mismatched.map((k) => k.term.id),
    impliedStack: impliedStack(keywords),
    nicheScores,
    primaryNiche,
    painPoints: extractPainPoints(job),
    redFlags: red,
    greenFlags: green,
    edgeCases: matchEdgeCases(keywords, primaryNiche),
    deliverables: extractDeliverables(job.description),
    wordCount: wordCount(job.description),
    avgDifficulty,
  };
}
