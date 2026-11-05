import type { CrmStats, Deal, DealStage, NicheId, ProposalAngleId } from '../types';
import { DEFAULT_CONNECT_PRICE } from './bidCalculator';
import { round, uid } from './text';

export const STAGES: { id: DealStage; label: string; emoji: string; labelVi: string }[] = [
  { id: 'saved', emoji: '🎯', label: 'Saved / Analyzing', labelVi: 'Job mới lưu' },
  { id: 'sent', emoji: '📨', label: 'Proposal Sent', labelVi: 'Đã gửi đơn' },
  { id: 'interviewing', emoji: '💬', label: 'Interviewing / Replied', labelVi: 'Khách đã phản hồi' },
  { id: 'won', emoji: '🏆', label: 'Won / Active Contract', labelVi: 'Đã chốt hợp đồng' },
  { id: 'archived', emoji: '🗄️', label: 'Archived / Skipped', labelVi: 'Bỏ qua / Đóng' },
];

export const STAGE_IDS: DealStage[] = STAGES.map((s) => s.id);
const ORDER: Record<DealStage, number> = { saved: 0, sent: 1, interviewing: 2, won: 3, archived: -1 };

/** Move a deal and stamp milestone timestamps cumulatively (won ⇒ sent + replied). */
export function moveDeal(deal: Deal, stage: DealStage, now = new Date().toISOString()): Deal {
  const next: Deal = { ...deal, stage, updatedAt: now };
  const lvl = ORDER[stage];
  if (lvl >= 1 && !next.sentAt) next.sentAt = now;
  if (lvl >= 2 && !next.repliedAt) next.repliedAt = now;
  if (lvl >= 3 && !next.wonAt) next.wonAt = now;
  return next;
}

export function computeStats(deals: Deal[], connectPrice = DEFAULT_CONNECT_PRICE): CrmStats {
  const byStage = Object.fromEntries(STAGE_IDS.map((s) => [s, 0])) as Record<DealStage, number>;
  let sent = 0;
  let replied = 0;
  let won = 0;
  let connects = 0;
  let pipelineValue = 0;
  let wonValue = 0;
  for (const d of deals) {
    byStage[d.stage]++;
    if (d.sentAt) sent++;
    if (d.repliedAt) replied++;
    if (d.wonAt) {
      won++;
      wonValue += d.bidAmount;
    }
    connects += d.connects || 0;
    if (d.stage !== 'archived') pipelineValue += d.bidAmount || 0;
  }
  return {
    total: deals.length,
    sent,
    replied,
    won,
    replyRate: sent ? round((replied / sent) * 100, 1) : 0,
    winRate: sent ? round((won / sent) * 100, 1) : 0,
    connects,
    connectsUsd: round(connects * connectPrice, 2),
    pipelineValue: round(pipelineValue, 2),
    wonValue: round(wonValue, 2),
    byStage,
  };
}

export interface NewDealInput {
  title: string;
  niche: NicheId;
  contractType: Deal['contractType'];
  clientCountry: string;
  winRate: number;
  projectIds: string[];
  proposalAngle: ProposalAngleId;
  proposalText: string;
  bidAmount: number;
  milestones: Deal['milestones'];
  connects: number;
  notes?: string;
  jobDescription: string;
}

export function createDeal(input: NewDealInput, now = new Date().toISOString()): Deal {
  return { id: uid('deal'), createdAt: now, updatedAt: now, stage: 'saved', notes: '', ...input };
}

// ── JSON ─────────────────────────────────────────────────────
export function exportDealsJson(deals: Deal[]): string {
  return JSON.stringify({ app: 'upwork-deal-closer', version: 1, exportedAt: new Date().toISOString(), deals }, null, 2);
}

export function isDeal(x: unknown): x is Deal {
  if (!x || typeof x !== 'object') return false;
  const d = x as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.title === 'string' &&
    typeof d.stage === 'string' &&
    STAGE_IDS.includes(d.stage as DealStage) &&
    typeof d.bidAmount === 'number'
  );
}

export function importDealsJson(json: string): Deal[] {
  const parsed: unknown = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : (parsed as { deals?: unknown }).deals;
  if (!Array.isArray(arr)) throw new Error('File JSON không chứa danh sách deals hợp lệ');
  const now = new Date().toISOString();
  const defaults: Omit<Deal, 'id' | 'title' | 'stage' | 'bidAmount'> = {
    projectIds: [],
    milestones: [],
    notes: '',
    proposalText: '',
    jobDescription: '',
    connects: 0,
    winRate: 0,
    niche: 'agents',
    contractType: 'fixed',
    clientCountry: '',
    proposalAngle: 'prototype',
    createdAt: now,
    updatedAt: now,
  };
  const deals: Deal[] = arr.filter(isDeal).map((d) => ({ ...defaults, ...(d as Partial<Deal>) }) as Deal);
  if (!deals.length) throw new Error('Không tìm thấy deal hợp lệ trong file');
  return deals;
}

// ── CSV ──────────────────────────────────────────────────────
export const CSV_COLUMNS = [
  'id', 'title', 'stage', 'niche', 'contractType', 'clientCountry', 'winRate', 'bidAmount', 'connects',
  'proposalAngle', 'projectIds', 'notes', 'createdAt', 'updatedAt', 'sentAt', 'repliedAt', 'wonAt', 'proposalText',
] as const;

export function csvEscape(v: unknown): string {
  const s = v === undefined || v === null ? '' : Array.isArray(v) ? v.join('|') : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportDealsCsv(deals: Deal[]): string {
  const head = CSV_COLUMNS.join(',');
  const rows = deals.map((d) => CSV_COLUMNS.map((c) => csvEscape(d[c as keyof Deal])).join(','));
  return [head, ...rows].join('\n');
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQ = false;
      } else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function importDealsCsv(text: string): Deal[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV trống');
  const head = rows[0].map((h) => h.trim());
  const idx = (k: string) => head.indexOf(k);
  if (idx('title') < 0 || idx('stage') < 0) throw new Error('CSV thiếu cột title/stage');
  const get = (r: string[], k: string) => (idx(k) >= 0 ? r[idx(k)] ?? '' : '');
  const now = new Date().toISOString();
  const deals: Deal[] = rows.slice(1).map((r) => {
    const stage = (STAGE_IDS.includes(get(r, 'stage') as DealStage) ? get(r, 'stage') : 'saved') as DealStage;
    return {
      id: get(r, 'id') || uid('deal'),
      title: get(r, 'title'),
      stage,
      niche: (get(r, 'niche') || 'agents') as NicheId,
      contractType: get(r, 'contractType') === 'hourly' ? 'hourly' : 'fixed',
      clientCountry: get(r, 'clientCountry'),
      winRate: Number(get(r, 'winRate')) || 0,
      bidAmount: Number(get(r, 'bidAmount')) || 0,
      connects: Number(get(r, 'connects')) || 0,
      proposalAngle: (get(r, 'proposalAngle') || 'prototype') as ProposalAngleId,
      projectIds: get(r, 'projectIds') ? get(r, 'projectIds').split('|') : [],
      notes: get(r, 'notes'),
      createdAt: get(r, 'createdAt') || now,
      updatedAt: get(r, 'updatedAt') || now,
      sentAt: get(r, 'sentAt') || undefined,
      repliedAt: get(r, 'repliedAt') || undefined,
      wonAt: get(r, 'wonAt') || undefined,
      proposalText: get(r, 'proposalText'),
      milestones: [],
      jobDescription: '',
    };
  });
  return deals.filter((d) => d.title);
}

/** Merge imported deals into existing ones (imported wins on same id). */
export function mergeDeals(existing: Deal[], incoming: Deal[]): Deal[] {
  const map = new Map(existing.map((d) => [d.id, d]));
  for (const d of incoming) map.set(d.id, d);
  return [...map.values()];
}
