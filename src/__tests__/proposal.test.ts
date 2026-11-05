import { describe, expect, it } from 'vitest';
import type { ProposalOptions, Tone } from '../types';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import {
  ANGLE_WORD_RANGES,
  analyzeJob,
  buildContext,
  closingQuestions,
  compose,
  findBannedOpener,
  generateAllProposals,
  generateArchitecture,
  lintProposal,
  abovePreview,
  lowerFirst,
  projectNoun,
  toAscii,
} from '../engine';

const TONES: Tone[] = ['punchy', 'technical', 'executive'];
const base: ProposalOptions = { tone: 'punchy', includeQuestions: false, includeDiagram: false, diagramFormat: 'ascii' };

function proposalsFor(jobIdx: number, opts: Partial<ProposalOptions> = {}) {
  const job = SAMPLE_JOBS[jobIdx];
  const r = analyzeJob(job);
  const ctx = buildContext(job, r.analysis, r.win, r.matches, r.defaultProjectIds, r.bid);
  return { ctx, r, ps: generateAllProposals(ctx, { ...base, ...opts }) };
}

describe('3-angle proposal generator', () => {
  it('produces exactly 3 angles in order', () => {
    expect(proposalsFor(0).ps.map((p) => p.angle)).toEqual(['prototype', 'architect', 'delivery']);
  });

  const matrix = SAMPLE_JOBS.flatMap((_j, i) => TONES.map((t) => [i, t] as const));
  it.each(matrix)('job #%i tone %s: every angle respects its word range', (i, tone) => {
    for (const p of proposalsFor(i, { tone }).ps) {
      const [min, max] = ANGLE_WORD_RANGES[p.angle];
      expect(p.bodyWordCount, `${p.angle} ${p.bodyWordCount}`).toBeGreaterThanOrEqual(min);
      expect(p.bodyWordCount, `${p.angle} ${p.bodyWordCount}`).toBeLessThanOrEqual(max);
    }
  });

  it.each(matrix)('job #%i tone %s: no cliché opener, strong hook, no template leaks', (i, tone) => {
    for (const p of proposalsFor(i, { tone, includeQuestions: true, includeDiagram: true }).ps) {
      expect(findBannedOpener(p.text)).toBeNull();
      expect(p.lint.issues.some((x) => x.severity === 'error')).toBe(false);
      expect(p.lint.hookScore).toBeGreaterThanOrEqual(70);
      expect(p.text).not.toMatch(/undefined|NaN|\[object Object\]|\$\{/);
    }
  });

  it('personalises: Angle 1 names the client’s own tech + Dũng’s project + real metric', () => {
    const { ps } = proposalsFor(0);
    const a1 = ps[0].text;
    expect(a1).toMatch(/Remotion/);
    expect(a1).toMatch(/Whisper/);
    expect(a1).toMatch(/6\.4x|82\/82|SSIM/);
    expect(a1).toMatch(/90-second/);
  });

  it('Angle 2 explains real technical traps and an architecture flow', () => {
    const { ps, r } = proposalsFor(1);
    const a2 = ps[1].body;
    expect(a2).toContain('1) ');
    expect(a2).toContain('→');
    expect(a2).toMatch(new RegExp(r.analysis.edgeCases[0].fixEn.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  it('Angle 3 lists milestones and the 7 gates G0→G6', () => {
    const { ps, r } = proposalsFor(2);
    const a3 = ps[2].body;
    expect(a3).toContain('G0');
    expect(a3).toContain('G6');
    expect(a3).toContain(`M${r.bid.milestones.length}`);
  });

  it('toggles closing questions and diagrams', () => {
    const off = proposalsFor(3).ps[0].text;
    const on = proposalsFor(3, { includeQuestions: true, includeDiagram: true, diagramFormat: 'mermaid' }).ps[0].text;
    expect(off).not.toContain('A few quick questions');
    expect(on).toContain('A few quick questions');
    expect(on).toContain('flowchart LR');
    const ascii = proposalsFor(3, { includeDiagram: true, diagramFormat: 'ascii' }).ps[0].text;
    expect(ascii).toContain('┌');
  });

  it('tones produce different wording', () => {
    const a = proposalsFor(4, { tone: 'punchy' }).ps[0].body;
    const b = proposalsFor(4, { tone: 'executive' }).ps[0].body;
    expect(a).not.toBe(b);
  });

  it('adds a greeting only when a client name is given and still signs off', () => {
    const p = proposalsFor(0, { clientName: 'Sarah' }).ps[0];
    expect(p.text.startsWith('Hi Sarah,')).toBe(true);
    expect(p.text.trim().endsWith('Dũng')).toBe(true);
  });

  it('every proposal carries Vietnamese strategy notes + summary', () => {
    for (const p of proposalsFor(5).ps) {
      expect(p.strategyVi.length).toBeGreaterThanOrEqual(3);
      expect(p.summaryVi.length).toBeGreaterThan(20);
    }
  });

  it('closing questions are 3 unique niche-specific questions', () => {
    const { r } = proposalsFor(4);
    const qs = closingQuestions(r.analysis);
    expect(qs).toHaveLength(3);
    expect(new Set(qs).size).toBe(3);
    expect(qs.join(' ')).toMatch(/OTA|Channex|parity|propert/i);
  });
});

describe('helpers', () => {
  it('compose() fills optional sentences up to the range', () => {
    const out = compose(
      [
        { para: 0, text: 'one two three' },
        { para: 0, text: 'four five six seven', opt: 1 },
        { para: 1, text: 'eight nine', opt: 2 },
      ],
      [5, 8],
    );
    expect(out).toBe('one two three four five six seven');
  });

  it('lowerFirst keeps product names and acronyms', () => {
    expect(lowerFirst('Remotion renders crawl')).toBe('Remotion renders crawl');
    expect(lowerFirst('JSON compiler')).toBe('JSON compiler');
    expect(lowerFirst('Manual work')).toBe('manual work');
  });

  it('projectNoun strips verbs and trailing "with …"', () => {
    expect(projectNoun('Build Automated Faceless TikTok/Reels Video Pipeline with Remotion & Whisper')).toBe('Automated Faceless TikTok/Reels Video Pipeline');
    expect(projectNoun('React Video Editor like CapCut in Browser with FFmpeg Backend')).toBe('React Video Editor');
  });
});

describe('above-the-fold linter', () => {
  it.each([
    'Hi, I am an experienced developer with 10 years…',
    'Dear Hiring Manager, I would like to apply…',
    'I am an experienced full-stack developer.',
    'My name is John and I can help.',
    'I have read your job description carefully.',
  ])('flags cliché opener: %s', (t) => {
    const l = lintProposal(t, ['remotion']);
    expect(l.issues.some((i) => i.id === 'banned-opener' && i.severity === 'error')).toBe(true);
    expect(l.hookScore).toBeLessThan(40);
  });

  it('rewards a proof-first hook with numbers and client terms', () => {
    const l = lintProposal('I already run a working Remotion + Whisper pipeline that renders your videos 6.4x faster — want a 90-second demo?', ['Remotion', 'Whisper']);
    expect(l.grade).toBe('A');
    expect(l.issues).toHaveLength(0);
  });

  it('preview is ~200 chars cut on a word boundary', () => {
    const p = abovePreview('word '.repeat(100));
    expect(p.length).toBeLessThanOrEqual(201);
    expect(p.endsWith('…')).toBe(true);
  });
});

describe('architecture generator', () => {
  it('builds niche-specific stages with Mermaid + ASCII', () => {
    const r = analyzeJob(SAMPLE_JOBS[0]);
    const d = generateArchitecture(r.analysis);
    expect(d.stages.map((s) => s.id)).toEqual(expect.arrayContaining(['asr', 'compose', 'render', 'audio', 'qa']));
    expect(d.mermaid.startsWith('flowchart LR')).toBe(true);
    expect(d.mermaid.match(/-->/g)!.length).toBe(d.stages.length - 1);
  });

  it('only includes optional stages when the JD needs them', () => {
    const ota = generateArchitecture(analyzeJob(SAMPLE_JOBS[4]).analysis);
    expect(ota.stages.map((s) => s.id)).toContain('alert');
    const tiktok = generateArchitecture(analyzeJob(SAMPLE_JOBS[0]).analysis);
    expect(tiktok.stages.map((s) => s.id)).not.toContain('editor');
    const editor = generateArchitecture(analyzeJob(SAMPLE_JOBS[5]).analysis);
    expect(editor.stages.map((s) => s.id)).toContain('editor');
  });

  it('ASCII boxes have consistent width', () => {
    const ascii = toAscii([
      { id: 'a', label: 'Short', detail: 'x' },
      { id: 'b', label: 'A much longer stage label', detail: 'with a longer detail line here' },
    ]);
    const boxLines = ascii.split('\n').filter((l) => l.startsWith('│') || l.startsWith('┌'));
    expect(new Set(boxLines.map((l) => [...l].length)).size).toBe(1);
  });
});
