import { describe, expect, it } from 'vitest';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import {
  DEFAULT_BID_OPTIONS,
  UPWORK_FEE,
  analyzeJob,
  buildMilestones,
  milestonesToText,
  netAfterFee,
  roundBid,
  toVnd,
  upworkFee,
} from '../engine';

describe('Upwork fee & currency', () => {
  it('Upwork fee is a flat 10%', () => {
    expect(UPWORK_FEE).toBe(0.1);
    expect(upworkFee(1000)).toBe(100);
    expect(netAfterFee(1000)).toBe(900);
    expect(netAfterFee(2650)).toBe(2385);
  });

  it('converts net USD to VND', () => {
    expect(toVnd(900, 25400)).toBe(22_860_000);
  });

  it('rounds bids to friendly steps', () => {
    expect(roundBid(437)).toBe(435);
    expect(roundBid(1212)).toBe(1200);
    expect(roundBid(3333)).toBe(3350);
  });
});

describe('bid calculator', () => {
  it.each(SAMPLE_JOBS.map((j) => [j.label, j] as const))('%s: tiers ascend, net = gross − 10%, Dũng faster than market', (_l, j) => {
    const { bid } = analyzeJob(j);
    expect(bid.tiers.map((t) => t.id)).toEqual(['aggressive', 'optimal', 'premium']);
    expect(bid.tiers[0].gross).toBeLessThanOrEqual(bid.tiers[1].gross);
    expect(bid.tiers[1].gross).toBeLessThanOrEqual(bid.tiers[2].gross);
    for (const t of bid.tiers) {
      expect(t.fee).toBeCloseTo(t.gross * 0.1, 2);
      expect(t.net).toBeCloseTo(t.gross * 0.9, 2);
      expect(t.effectiveHourly).toBeGreaterThan(0);
    }
    expect(bid.dungHours).toBeLessThan(bid.marketHours);
  });

  it.each(SAMPLE_JOBS.map((j) => [j.label, j] as const))('%s: milestones sum to 100% and to the bid amount', (_l, j) => {
    const { bid } = analyzeJob(j);
    expect(bid.milestones.reduce((s, m) => s + m.percent, 0)).toBe(100);
    expect(bid.milestones.reduce((s, m) => s + m.amount, 0)).toBeCloseTo(bid.selected.gross, 2);
    expect([3, 4]).toContain(bid.milestones.length);
  });

  it('fixed optimal tier anchors on the client budget', () => {
    const j = SAMPLE_JOBS.find((x) => x.id === 'job-capcut-clone')!;
    const { bid } = analyzeJob(j);
    expect(bid.tiers[1].gross).toBeGreaterThanOrEqual(5000);
    expect(bid.tiers[1].gross).toBeLessThanOrEqual(5250);
  });

  it('hourly contracts expose $/h rates inside/above the client range', () => {
    const j = SAMPLE_JOBS.find((x) => x.id === 'job-mcp-cdp-agent')!;
    const { bid } = analyzeJob(j);
    expect(bid.contractType).toBe('hourly');
    expect(bid.tiers[1].rate).toBe(80);
    expect(bid.tiers[0].rate).toBe(63);
    expect(bid.tiers[2].rate).toBe(96);
    expect(bid.tiers[1].effectiveHourly).toBe(72);
  });

  it('tier option switches the selected tier & milestone total', () => {
    const j = SAMPLE_JOBS[0];
    const premium = analyzeJob(j, undefined, { ...DEFAULT_BID_OPTIONS, tier: 'premium' }).bid;
    expect(premium.selected.id).toBe('premium');
    expect(premium.milestones.reduce((s, m) => s + m.amount, 0)).toBeCloseTo(premium.selected.gross, 2);
  });

  it('forces 3 or 4 milestones on demand', () => {
    const j = SAMPLE_JOBS[0];
    expect(analyzeJob(j, undefined, { ...DEFAULT_BID_OPTIONS, milestoneCount: 3 }).bid.milestones).toHaveLength(3);
    expect(analyzeJob(j, undefined, { ...DEFAULT_BID_OPTIONS, milestoneCount: 4 }).bid.milestones).toHaveLength(4);
  });

  it('connects ROI is positive and expected value uses win-rate', () => {
    const r = analyzeJob(SAMPLE_JOBS[1]);
    expect(r.bid.connectsSuggested).toBeGreaterThan(0);
    expect(r.bid.expectedValue).toBeCloseTo((r.win.total / 100) * r.bid.selected.net, 1);
    expect(r.bid.connectsRoi).toBeGreaterThan(1);
  });

  it('buildMilestones handles odd totals without losing cents and spreads client deliverables', () => {
    const ms = buildMilestones(1001, 'video', ['A', 'B', 'C', 'D'], 4);
    expect(ms.reduce((s, m) => s + m.amount, 0)).toBeCloseTo(1001, 5);
    expect(ms[1].deliverables).toContain('A');
    expect(ms[2].deliverables).toContain('B');
    expect(milestonesToText(ms)).toContain('Milestone 4');
  });
});
