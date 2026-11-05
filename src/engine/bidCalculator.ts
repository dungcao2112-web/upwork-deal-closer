import type {
  BidOptions,
  BidResult,
  BidTier,
  BidTierId,
  JobAnalysis,
  JobInput,
  Milestone,
  NicheId,
  WinRateResult,
} from '../types';
import { NICHE_BY_ID } from '../data/niches';
import { clamp, round, truncate } from './text';

export const UPWORK_FEE = 0.1; // flat 10% freelancer service fee
export const DEFAULT_VND_RATE = 25400;
export const DEFAULT_CONNECT_PRICE = 0.15;

export const DEFAULT_BID_OPTIONS: BidOptions = {
  vndRate: DEFAULT_VND_RATE,
  tier: 'optimal',
  connectPrice: DEFAULT_CONNECT_PRICE,
};

export function upworkFee(gross: number): number {
  return round(gross * UPWORK_FEE, 2);
}

export function netAfterFee(gross: number): number {
  return round(gross - upworkFee(gross), 2);
}

export function toVnd(usd: number, rate = DEFAULT_VND_RATE): number {
  return Math.round(usd * rate);
}

/** Bid-friendly rounding: $5 below 500, $25 below 2000, $50 above. */
export function roundBid(n: number): number {
  const step = n < 500 ? 5 : n < 2000 ? 25 : 50;
  return Math.max(step, Math.round(n / step) * step);
}

export function estimateMarketHours(a: JobAnalysis): number {
  const matched = a.matchedIds.length;
  const mismatch = a.mismatchIds.length;
  const raw =
    10 +
    matched * 3 +
    mismatch * 4 +
    a.avgDifficulty * 7 +
    Math.min(a.deliverables.length, 10) * 3 +
    a.edgeCases.length * 2.5 +
    (a.wordCount > 200 ? 6 : 0);
  return clamp(Math.round(raw), 12, 320);
}

const MILESTONES_4: Record<NicheId, { title: string; deliverables: string[] }[]> = {
  video: [
    { title: 'Architecture + working prototype on your content', deliverables: ['Technical design & pipeline diagram', 'First end-to-end video rendered from your own script/footage'] },
    { title: 'Core pipeline: transcription, captions & templates', deliverables: ['Whisper word-level transcription with hallucination guard', 'Caption + composition templates (Remotion)'] },
    { title: 'GPU batch rendering, audio & monitoring', deliverables: ['NVENC batch renderer with CPU fallback', 'EBU R128 2-pass loudness (-14 LUFS)', 'Queue dashboard'] },
    { title: 'QA hardening, docs & handover', deliverables: ['Automated QA report (ffprobe / SSIM / LUFS)', 'Documentation + handover call'] },
  ],
  agents: [
    { title: 'Architecture + first working agent on your workflow', deliverables: ['Architecture & task-graph design', 'One agent completing a real task end-to-end'] },
    { title: 'Core tools: MCP / browser / desktop drivers', deliverables: ['Typed MCP tools or automation drivers', 'Real-Chrome CDP session handling'] },
    { title: 'Orchestration, parallel workers & live dashboard', deliverables: ['Planner + parallel worker dispatch', 'Shared state + live task room'] },
    { title: '7-Gate QA, test suite, docs & handover', deliverables: ['Independent acceptance tests (G0→G6)', 'Runbook, docs + handover call'] },
  ],
  localai: [
    { title: 'GPU environment + first workflow on your samples', deliverables: ['Environment setup on your GPU', 'First workflow results on your sample files'] },
    { title: 'Production workflows', deliverables: ['Tuned ComfyUI / TTS workflows', 'Quality benchmark on hard samples'] },
    { title: 'API gateway, queue & VRAM-safe concurrency', deliverables: ['FastAPI gateway with job queue + status', 'Concurrency test without OOM'] },
    { title: 'Load test, Docker, API docs & handover', deliverables: ['Docker setup', 'API docs + handover call'] },
  ],
  '3d': [
    { title: 'Scene setup + first rigged character walking', deliverables: ['Three.js scene skeleton', 'One of your characters walking with no foot sliding'] },
    { title: 'Blender auto-rig pipeline for all characters', deliverables: ['Blender Python auto-rig script', 'All characters exported to optimized GLB'] },
    { title: 'Animations, locomotion & live state bridge', deliverables: ['Walk / sit / turn controller', 'WebSocket state integration'] },
    { title: 'Performance tuning, docs & handover', deliverables: ['Performance pass on target laptop', 'Documentation + handover call'] },
  ],
  ota: [
    { title: 'Data access + first parity report on your property', deliverables: ['Channel-manager API connection', 'First parity report for one property'] },
    { title: 'Rate sync & guest-price checker for all OTAs', deliverables: ['Guest-facing price reader per OTA', 'Net/Gross & tax normalization'] },
    { title: 'Alerts, Excel reports & web dashboard', deliverables: ['Daily Excel report + alerts', 'Web dashboard of issues'] },
    { title: 'Hardening, scheduling, docs & handover', deliverables: ['Scheduled runs + retries', 'Documentation + handover call'] },
  ],
};

export function milestoneTemplates(niche: NicheId, count: 3 | 4): { title: string; deliverables: string[] }[] {
  const four = MILESTONES_4[niche];
  if (count === 4) return four;
  return [
    four[0],
    { title: `${four[1].title.split(':')[0]} + ${four[2].title.split(/[,&]/)[0].trim()}`, deliverables: [...four[1].deliverables, four[2].deliverables[0]] },
    four[3],
  ];
}

export const MILESTONE_SPLITS: Record<3 | 4, number[]> = { 3: [30, 45, 25], 4: [20, 35, 30, 15] };

export function buildMilestones(total: number, niche: NicheId, clientDeliverables: string[], count: 3 | 4): Milestone[] {
  const tpl = milestoneTemplates(niche, count);
  const splits = MILESTONE_SPLITS[count];
  const extra = clientDeliverables.map((d) => truncate(d.replace(/\s+/g, ' '), 90));
  const middle = count - 2; // milestones that receive client bullets (not first/last)
  const amounts = splits.map((p) => Math.floor((total * p) / 100));
  const allocated = amounts.slice(0, -1).reduce((s, a) => s + a, 0);
  amounts[amounts.length - 1] = round(total - allocated, 2);
  return tpl.map((t, i) => {
    const mine = i >= 1 && i <= middle ? extra.filter((_, j) => j % middle === i - 1).slice(0, 3) : [];
    return { index: i + 1, title: t.title, percent: splits[i], amount: amounts[i], deliverables: [...t.deliverables, ...mine] };
  });
}

export function calculateBid(job: JobInput, analysis: JobAnalysis, win: WinRateResult, opts: BidOptions = DEFAULT_BID_OPTIONS): BidResult {
  const niche = NICHE_BY_ID[analysis.primaryNiche];
  const marketHours = estimateMarketHours(analysis);
  const multiplier = Math.max(1, win.reuseMultiplier);
  const dungHours = Math.max(4, Math.round(marketHours / multiplier));
  const moat = win.dimensions.find((d) => d.key === 'moat')?.score ?? 50;
  const marketRate = round(niche.marketRate * (analysis.avgDifficulty >= 3.5 ? 1.15 : 1));

  const mk = (id: BidTierId, label: string, labelVi: string, gross: number, rationaleVi: string, rate?: number): BidTier => {
    const net = netAfterFee(gross);
    return {
      id,
      label,
      labelVi,
      gross,
      rate,
      fee: upworkFee(gross),
      net,
      netVnd: toVnd(net, opts.vndRate),
      effectiveHourly: rate !== undefined ? round(rate * (1 - UPWORK_FEE), 1) : round(net / dungHours, 1),
      rationaleVi,
    };
  };

  let tiers: BidTier[];
  if (job.contractType === 'fixed') {
    const marketValue = marketHours * marketRate;
    const anchor = job.budget > 0 ? job.budget : marketValue;
    const optimalFactor = moat >= 70 ? 1.05 : 1;
    tiers = [
      mk('aggressive', 'Aggressive Win', 'Giá chiếm thầu', roundBid(anchor * 0.85), 'Thấp hơn ngân sách ~15% để thắng khi đông ứng viên; vẫn lãi nhờ tái sử dụng code.'),
      mk('optimal', 'Optimal Value', 'Giá tối ưu', roundBid(anchor * optimalFactor), moat >= 70 ? 'Rào cản kỹ thuật cao → bid nhỉnh hơn ngân sách 5%, đối thủ giá rẻ không làm nổi.' : 'Bám sát ngân sách khách — tỷ lệ chấp nhận cao nhất.'),
      mk('premium', 'Premium Expert', 'Giá chuyên gia', roundBid(Math.max(anchor * 1.3, marketValue * 0.9)), 'Định vị chuyên gia có sẵn sản phẩm chạy thật + QA 7 cổng; dùng khi khách giàu & ít proposal.'),
    ];
  } else {
    const lo = job.hourlyMin > 0 ? job.hourlyMin : niche.minHourly;
    const hi = job.hourlyMax > 0 ? job.hourlyMax : Math.max(lo, marketRate);
    const rates = [Math.round((lo + hi) / 2), Math.round(hi), Math.round(hi * 1.2)];
    tiers = [
      mk('aggressive', 'Aggressive Win', 'Giá chiếm thầu', round(rates[0] * dungHours), `$${rates[0]}/h — giữa khoảng giá khách đưa.`, rates[0]),
      mk('optimal', 'Optimal Value', 'Giá tối ưu', round(rates[1] * dungHours), `$${rates[1]}/h — trần khoảng giá khách, xứng với năng lực có sẵn.`, rates[1]),
      mk('premium', 'Premium Expert', 'Giá chuyên gia', round(rates[2] * dungHours), `$${rates[2]}/h — vượt trần 20%, đổi lại cam kết giao nhanh ${multiplier}x.`, rates[2]),
    ];
  }

  const selected = tiers.find((t) => t.id === opts.tier) ?? tiers[1];
  const count: 3 | 4 = opts.milestoneCount ?? (selected.gross <= 1500 ? 3 : 4);
  const milestones = buildMilestones(selected.gross, analysis.primaryNiche, analysis.deliverables, count);
  const connectsSuggested = selected.gross < 500 ? 8 : selected.gross < 2000 ? 12 : selected.gross < 5000 ? 16 : 20;
  const connectsCostUsd = round(connectsSuggested * opts.connectPrice, 2);
  const expectedValue = round((win.total / 100) * selected.net, 2);

  return {
    contractType: job.contractType,
    marketHours,
    dungHours,
    reuseMultiplier: multiplier,
    marketRate,
    tiers,
    selected,
    milestones,
    connectsSuggested,
    connectsCostUsd,
    expectedValue,
    connectsRoi: connectsCostUsd > 0 ? round(expectedValue / connectsCostUsd, 1) : 0,
    daysToDeliver: Math.max(2, Math.ceil((dungHours * 1.3) / 6)), // 30% buffer, 6 focused hours/day
  };
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

export function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')} ₫`;
}

export function milestoneToText(m: Milestone): string {
  return `Milestone ${m.index}: ${m.title} — ${formatUsd(m.amount)} (${m.percent}%)\n${m.deliverables.map((d) => `  • ${d}`).join('\n')}`;
}

export function milestonesToText(ms: Milestone[]): string {
  return ms.map(milestoneToText).join('\n\n');
}
