import { describe, expect, it } from 'vitest';
import type { JobInput } from '../types';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { analyzeJD, detectFlags, detectKeywords, extractDeliverables, extractPainPoints, scoreNiches } from '../engine/jdAnalyzer';
import { countOccurrences, normalize, wordCount } from '../engine/text';

const job = (id: string) => SAMPLE_JOBS.find((j) => j.id === id)!;
const mk = (title: string, description: string, client: Partial<JobInput['client']> = {}): JobInput => ({
  title,
  description,
  contractType: 'fixed',
  budget: 1000,
  hourlyMin: 0,
  hourlyMax: 0,
  client: { country: 'US', paymentVerified: true, totalSpent: 5000, hireRate: 60, proposals: 10, ...client },
});

describe('text helpers', () => {
  it('matches terms on word boundaries incl. dotted names', () => {
    expect(countOccurrences(normalize('We use Three.js and three.js'), 'three.js')).toBe(2);
    expect(countOccurrences(normalize('custom nodes'), 'node')).toBe(0);
    expect(countOccurrences(normalize('Node.js backend'), 'node.js')).toBe(1);
    expect(countOccurrences(normalize('agoda,booking.com'), 'booking.com')).toBe(1);
  });

  it('counts words', () => {
    expect(wordCount('Hello world, 6.4x faster!')).toBe(4);
    expect(wordCount('')).toBe(0);
  });
});

describe('keyword detection', () => {
  it('finds Remotion/Whisper/FFmpeg in the faceless pipeline job with title boost', () => {
    const j = job('job-faceless-pipeline');
    const kws = detectKeywords(j.title, j.description);
    const ids = kws.map((k) => k.term.id);
    expect(ids).toEqual(expect.arrayContaining(['remotion', 'whisper', 'ffmpeg', 'captions', 'tts']));
    expect(kws.find((k) => k.term.id === 'remotion')!.inTitle).toBe(true);
  });

  it('flags out-of-scope stacks (WordPress / PHP) as mismatches', () => {
    const a = analyzeJD(mk('WordPress plugin', 'Need a WordPress + PHP developer for WooCommerce data entry.'));
    expect(a.mismatchIds).toEqual(expect.arrayContaining(['wordpress', 'php', 'dataentry']));
    expect(a.matchedIds).toHaveLength(0);
  });

  it('derives implied (unstated) tech', () => {
    const a = analyzeJD(mk('Remotion videos', 'Automate our Remotion templates.'));
    expect(a.impliedStack.map((t) => t.id)).toEqual(expect.arrayContaining(['react', 'ffmpeg']));
  });
});

describe('niche detection on the 8 sample jobs', () => {
  it.each(SAMPLE_JOBS.map((j) => [j.label, j] as const))('%s → expected niche', (_l, j) => {
    const a = analyzeJD(j);
    expect(a.primaryNiche).toBe(j.niche);
  });

  it('niche shares sum to ~100%', () => {
    const j = job('job-hotel-parity');
    const s = scoreNiches(detectKeywords(j.title, j.description));
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(98);
    expect(total).toBeLessThanOrEqual(102);
  });
});

describe('pain points, flags, edge cases, deliverables', () => {
  it('extracts manual-work & scale pains with evidence quotes', () => {
    const p = extractPainPoints(job('job-faceless-pipeline'));
    expect(p.map((x) => x.id)).toEqual(expect.arrayContaining(['manual-time', 'scale']));
    expect(p[0].evidence.length).toBeGreaterThan(10);
  });

  it('detects the "previous attempt failed" pain (Cloudflare) on the MCP job', () => {
    const ids = extractPainPoints(job('job-mcp-cdp-agent')).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['previous-failed', 'blocked']));
  });

  it('always returns at least one pain point', () => {
    expect(extractPainPoints(mk('Hello', 'Something.')).length).toBeGreaterThanOrEqual(1);
  });

  it('raises red flags for off-platform contact, "quick and easy" and unverified payment', () => {
    const { red } = detectFlags(job('job-electron-reverse'));
    expect(red.map((f) => f.id)).toEqual(expect.arrayContaining(['off-platform', 'quick-easy', 'payment-unverified', 'no-history']));
  });

  it('does not flag legit Telegram-alert features as off-platform', () => {
    const { red } = detectFlags(job('job-hotel-parity'));
    expect(red.map((f) => f.id)).not.toContain('off-platform');
  });

  it('gives green flags to big verified spenders', () => {
    const { green } = detectFlags(job('job-multi-agent-orch'));
    expect(green.map((f) => f.id)).toEqual(expect.arrayContaining(['payment-verified', 'big-spender', 'high-hire-rate']));
  });

  it.each([
    ['job-faceless-pipeline', 'whisper-hallucination'],
    ['job-faceless-pipeline', 'loudness-mismatch'],
    ['job-mcp-cdp-agent', 'cloudflare-block'],
    ['job-mcp-cdp-agent', 'mcp-transport'],
    ['job-threejs-office', 'glb-foot-sliding'],
    ['job-hotel-parity', 'net-gross-confusion'],
    ['job-comfy-faceswap-tts', 'comfy-api-queue'],
    ['job-multi-agent-orch', 'agent-loop-drift'],
  ])('%s exposes hidden trap %s', (id, edge) => {
    expect(analyzeJD(job(id)).edgeCases.map((e) => e.id)).toContain(edge);
  });

  it('extracts bullet deliverables', () => {
    const d = extractDeliverables('Intro\n- Build API\n- Add dashboard\n1. Write tests');
    expect(d).toEqual(['Build API', 'Add dashboard', 'Write tests']);
  });
});
