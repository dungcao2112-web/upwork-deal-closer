import type { JobAnalysis, JobInput, ProjectMatch, ScoreDimension, Verdict, WinRateResult } from '../types';
import { keywordWeight } from './jdAnalyzer';
import { clamp, round } from './text';

export const WEIGHTS = { stack: 0.25, prototype: 0.2, moat: 0.15, reuse: 0.15, client: 0.25 } as const;

interface Part {
  score: number;
  why: string;
}

export function scoreStackAlignment(a: JobAnalysis): Part {
  if (!a.keywords.length) return { score: 25, why: 'JD không nêu công nghệ cụ thể — khó chứng minh độ khớp.' };
  const total = a.keywords.reduce((s, k) => s + keywordWeight(k), 0);
  const good = a.keywords.filter((k) => k.term.dungHas).reduce((s, k) => s + keywordWeight(k), 0);
  const ratio = good / total;
  const breadth = Math.min(a.matchedIds.length / 6, 1); // 6+ matched techs → full breadth
  const score = clamp(round(ratio * 80 + breadth * 20), 0, 100);
  const miss = a.keywords.filter((k) => !k.term.dungHas).map((k) => k.term.label);
  return {
    score,
    why: `${a.matchedIds.length}/${a.keywords.length} công nghệ trong JD Dũng đã làm thật${miss.length ? `; ngoài vùng: ${miss.join(', ')}` : ''}.`,
  };
}

export function scorePrototype(matches: ProjectMatch[]): Part {
  const best = matches[0];
  if (!best) return { score: 0, why: 'Chưa có dự án nào trong kho.' };
  const second = matches[1]?.score ?? 0;
  const score = clamp(round(best.score * 0.9 + (second >= 50 ? 10 : second / 5)), 0, 100);
  return {
    score,
    why: `Có sẵn "${best.project.shortName}" khớp ${best.score}% để quay demo ngay${second >= 50 ? ` + "${matches[1].project.shortName}" làm bằng chứng phụ` : ''}.`,
  };
}

export function scoreMoat(a: JobAnalysis): Part {
  const avg = a.avgDifficulty; // 1..5
  const hard = a.keywords.filter((k) => k.term.dungHas && k.term.difficulty >= 4).length;
  const score = clamp(round(15 + (avg - 1) * 14 + hard * 5 + a.edgeCases.length * 4), 0, 100);
  return {
    score,
    why: `Độ khó TB ${avg.toFixed(1)}/5, ${hard} công nghệ khó (≥4), ${a.edgeCases.length} bẫy kỹ thuật — đối thủ giá rẻ khó theo.`,
  };
}

export function reuseCoverage(a: JobAnalysis, matches: ProjectMatch[]): number {
  const top = matches.slice(0, 2).map((m) => new Set(m.project.keywords));
  const relevant = a.keywords.filter((k) => k.term.dungHas);
  if (!relevant.length) return 0;
  const total = relevant.reduce((s, k) => s + keywordWeight(k), 0);
  const covered = relevant
    .filter((k) => top.some((t) => t.has(k.term.id)))
    .reduce((s, k) => s + keywordWeight(k), 0);
  return covered / total;
}

/** 1.0x (nothing reusable) … 5.0x (almost everything already built). */
export function reuseMultiplier(coverage: number): number {
  return round(1 + clamp(coverage, 0, 1) * 4, 1);
}

export function scoreReuse(a: JobAnalysis, matches: ProjectMatch[]): Part & { multiplier: number } {
  const cov = reuseCoverage(a, matches);
  const multiplier = reuseMultiplier(cov);
  return {
    score: clamp(round(cov * 100), 0, 100),
    multiplier,
    why: `${Math.round(cov * 100)}% phạm vi đã có module sẵn → giao hàng nhanh ~${multiplier}x so với làm từ đầu.`,
  };
}

const CLIENT_FLAG_IDS = ['payment-unverified', 'no-history', 'low-hire-rate', 'crowded', 'tiny-budget', 'low-rate', 'low-rating'];

export function scoreClient(job: JobInput, a: JobAnalysis): Part {
  const c = job.client;
  let s = 50;
  const notes: string[] = [];
  if (c.paymentVerified) {
    s += 12;
    notes.push('đã xác minh thanh toán');
  } else {
    s -= 25;
    notes.push('CHƯA xác minh thanh toán');
  }
  if (c.totalSpent >= 50000) {
    s += 15;
    notes.push(`đã chi $${Math.round(c.totalSpent / 1000)}k`);
  } else if (c.totalSpent >= 10000) {
    s += 11;
    notes.push(`đã chi $${Math.round(c.totalSpent / 1000)}k`);
  } else if (c.totalSpent >= 1000) s += 6;
  else if (c.totalSpent <= 0) {
    s -= 8;
    notes.push('chưa có lịch sử chi tiêu');
  }
  if (c.hireRate >= 60) s += 8;
  else if (c.totalSpent > 0 && c.hireRate < 30) s -= 10;
  if (c.proposals < 5) s += 10;
  else if (c.proposals < 15) s += 5;
  else if (c.proposals >= 50) s -= 15;
  else if (c.proposals >= 20) s -= 5;
  if (c.rating !== undefined && c.rating > 0 && c.rating < 4) s -= 8;
  if (job.contractType === 'fixed') {
    if (job.budget > 0 && job.budget < 150) s -= 15;
    else if (job.budget >= 3000) s += 6;
    else if (job.budget >= 1000) s += 3;
  } else if (job.hourlyMax > 0) {
    if (job.hourlyMax < 20) s -= 12;
    else if (job.hourlyMax >= 60) s += 6;
    else if (job.hourlyMax >= 40) s += 3;
  }
  for (const f of a.redFlags) {
    if (CLIENT_FLAG_IDS.includes(f.id)) continue; // already counted above
    s -= f.severity === 'high' ? 12 : f.severity === 'medium' ? 6 : 2;
    notes.push(f.textVi);
  }
  return { score: clamp(round(s), 0, 100), why: `${c.country || 'N/A'} · ${notes.join(' · ') || 'hồ sơ khách trung bình'}.` };
}

export function verdictFor(total: number): { verdict: Verdict; vi: string } {
  if (total >= 75) return { verdict: 'MUST-BID', vi: 'BẮT BUỘC NỘP — tỷ lệ thắng rất cao, cân nhắc Boost nếu còn ít proposal.' };
  if (total >= 58) return { verdict: 'STRONG', vi: 'NÊN NỘP — có lợi thế rõ, quay Loom demo để tách khỏi đám đông.' };
  if (total >= 40) return { verdict: 'CONSIDER', vi: 'CÂN NHẮC — chỉ nộp nếu còn Connects; nhấn mạnh demo & câu hỏi sắc.' };
  return { verdict: 'SKIP', vi: 'BỎ QUA — rủi ro cao / lệch năng lực, giữ Connects cho Job tốt hơn.' };
}

export function scoreWinRate(job: JobInput, a: JobAnalysis, matches: ProjectMatch[]): WinRateResult {
  const stack = scoreStackAlignment(a);
  const proto = scorePrototype(matches);
  const moat = scoreMoat(a);
  const reuse = scoreReuse(a, matches);
  const client = scoreClient(job, a);
  const dimensions: ScoreDimension[] = [
    { key: 'stack', label: 'Tech Stack Alignment', labelVi: 'Độ khớp công nghệ', score: stack.score, weight: WEIGHTS.stack, explanationVi: stack.why },
    { key: 'prototype', label: 'Ready-to-Demo Prototype Advantage', labelVi: 'Lợi thế có sẵn app chạy thật', score: proto.score, weight: WEIGHTS.prototype, explanationVi: proto.why },
    { key: 'moat', label: 'Technical Moat / Barrier to Entry', labelVi: 'Rào cản kỹ thuật loại đối thủ giá rẻ', score: moat.score, weight: WEIGHTS.moat, explanationVi: moat.why },
    { key: 'reuse', label: 'Code Reuse & Speed Multiplier', labelVi: 'Tái sử dụng code & hệ số tăng tốc', score: reuse.score, weight: WEIGHTS.reuse, explanationVi: reuse.why },
    { key: 'client', label: 'Client & Budget Health', labelVi: 'Uy tín khách & ngân sách', score: client.score, weight: WEIGHTS.client, explanationVi: client.why },
  ];
  let total = dimensions.reduce((s, d) => s + d.score * d.weight, 0);
  // hard caps for deal-breakers
  if (a.redFlags.some((f) => f.id === 'payment-unverified')) total = Math.min(total, 60);
  if (a.redFlags.some((f) => f.id === 'off-platform' || f.id === 'bypass')) total -= 8;
  total = clamp(round(total), 3, 97);
  const v = verdictFor(total);
  return { total, dimensions, verdict: v.verdict, verdictVi: v.vi, reuseMultiplier: reuse.multiplier };
}
