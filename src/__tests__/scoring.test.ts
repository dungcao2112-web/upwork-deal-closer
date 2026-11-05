import { describe, expect, it } from 'vitest';
import type { JobInput } from '../types';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData';
import { analyzeJob } from '../engine';
import { analyzeJD } from '../engine/jdAnalyzer';
import { defaultSelection, matchProjects } from '../engine/portfolioMatcher';
import { WEIGHTS, reuseMultiplier, verdictFor } from '../engine/winRateScorer';

const job = (id: string) => SAMPLE_JOBS.find((j) => j.id === id)!;
const offNiche: JobInput = {
  title: 'WordPress website + data entry assistant',
  description: 'Need a cheap WordPress / Elementor developer and virtual assistant for data entry. Should be quick and easy. Contact me on WhatsApp.',
  contractType: 'fixed',
  budget: 80,
  hourlyMin: 0,
  hourlyMax: 0,
  client: { country: 'N/A', paymentVerified: false, totalSpent: 0, hireRate: 0, proposals: 60 },
};

describe('win-rate scorer', () => {
  it('weights sum to 1', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('returns 5 dimensions with 0–100 scores and Vietnamese explanations', () => {
    const { win } = analyzeJob(job('job-faceless-pipeline'));
    expect(win.dimensions.map((d) => d.key)).toEqual(['stack', 'prototype', 'moat', 'reuse', 'client']);
    for (const d of win.dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.explanationVi.length).toBeGreaterThan(10);
    }
  });

  it.each(SAMPLE_JOBS.filter((j) => j.client.paymentVerified).map((j) => [j.label, j] as const))('%s is worth bidding (≥ 58)', (_l, j) => {
    expect(analyzeJob(j).win.total).toBeGreaterThanOrEqual(58);
  });

  it('total is the weighted dimension average (within clamp)', () => {
    const { win } = analyzeJob(job('job-hotel-parity'));
    const expected = Math.round(win.dimensions.reduce((s, d) => s + d.score * d.weight, 0));
    expect(win.total).toBe(Math.min(97, Math.max(3, expected)));
  });

  it('caps unverified-payment jobs at 60%', () => {
    const r = analyzeJob(job('job-electron-reverse'));
    expect(r.win.total).toBeLessThanOrEqual(60);
  });

  it('scores an off-niche, red-flag job as SKIP', () => {
    const r = analyzeJob(offNiche);
    expect(r.win.verdict).toBe('SKIP');
    expect(r.win.total).toBeLessThan(40);
  });

  it('more competing proposals lowers client health', () => {
    const base = job('job-threejs-office');
    const few = analyzeJob(base).win.dimensions.find((d) => d.key === 'client')!.score;
    const many = analyzeJob({ ...base, client: { ...base.client, proposals: 80 } }).win.dimensions.find((d) => d.key === 'client')!.score;
    expect(many).toBeLessThan(few);
  });

  it('reuse multiplier spans 1x–5x', () => {
    expect(reuseMultiplier(0)).toBe(1);
    expect(reuseMultiplier(1)).toBe(5);
    expect(reuseMultiplier(0.5)).toBe(3);
    expect(reuseMultiplier(2)).toBe(5);
  });

  it('verdict thresholds', () => {
    expect(verdictFor(80).verdict).toBe('MUST-BID');
    expect(verdictFor(60).verdict).toBe('STRONG');
    expect(verdictFor(45).verdict).toBe('CONSIDER');
    expect(verdictFor(10).verdict).toBe('SKIP');
  });
});

describe('portfolio matcher', () => {
  it.each([
    ['job-faceless-pipeline', ['code-video-render', 'app-video-chia-se']],
    ['job-mcp-cdp-agent', ['ceo-multi-agent']],
    ['job-comfy-faceswap-tts', ['local-tts-comfyui']],
    ['job-threejs-office', ['van-phong-3d']],
    ['job-hotel-parity', ['ecom-ota-social']],
    ['job-capcut-clone', ['ai-capcut-studio']],
    ['job-electron-reverse', ['van-phong-3d', 'ceo-multi-agent']],
    ['job-multi-agent-orch', ['ceo-multi-agent']],
  ])('%s → top weapon in %j', (id, expected) => {
    const matches = matchProjects(analyzeJD(job(id)), PORTFOLIO_PROJECTS);
    expect(expected).toContain(matches[0].project.id);
  });

  it('returns all projects sorted by score with reasons', () => {
    const matches = matchProjects(analyzeJD(job('job-capcut-clone')), PORTFOLIO_PROJECTS);
    expect(matches).toHaveLength(7);
    for (let i = 1; i < matches.length; i++) expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    expect(matches[0].reasonsVi.length).toBeGreaterThan(0);
    expect(matches[0].matchedKeywords.length).toBeGreaterThan(3);
  });

  it('default selection picks best + close runner-up (max 2)', () => {
    const matches = matchProjects(analyzeJD(job('job-faceless-pipeline')), PORTFOLIO_PROJECTS);
    const sel = defaultSelection(matches);
    expect(sel[0]).toBe(matches[0].project.id);
    expect(sel.length).toBeLessThanOrEqual(2);
    expect(defaultSelection([])).toEqual([]);
  });
});
