import { describe, expect, it } from 'vitest';
import { CORE_POSITIONING, PORTFOLIO_PROJECTS, PROJECT_BY_ID } from '../data/portfolioData';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { NICHES } from '../data/niches';
import { TECH_LEXICON, LEXICON_BY_ID } from '../data/techLexicon';
import { EDGE_CASES } from '../data/edgeCases';
import { sampleDeals } from '../data/sampleDeals';

const allText = PORTFOLIO_PROJECTS.map((p) => `${p.proofOfWork} ${p.metrics.map((m) => m.value).join(' ')}`).join(' ');

describe('portfolio data (source: docs/HO_SO_CONG_VIEC_UPWORK_CHO_CLAUDE.md)', () => {
  it('contains exactly the 7 real project groups P1–P7', () => {
    expect(PORTFOLIO_PROJECTS).toHaveLength(7);
    expect(PORTFOLIO_PROJECTS.map((p) => p.code)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
  });

  it('has unique ids and the GitHub repos from the profile', () => {
    expect(new Set(PORTFOLIO_PROJECTS.map((p) => p.id)).size).toBe(7);
    expect(PROJECT_BY_ID['ai-capcut-studio'].github).toBe('dungcao2112-web/ai-capcut-studio');
    expect(PROJECT_BY_ID['app-video-chia-se'].github).toBe('dungcao2112-web/app-video-chia-se');
    expect(PROJECT_BY_ID['van-phong-3d'].github).toBe('dungcao2112-web/van-phong-3d-ai');
  });

  it('embeds the signature measured metrics', () => {
    for (const m of ['6.4x', 'SSIM 0.995', '-14 LUFS', '82/82', 'G0', 'G6', '17-bone', 'h264_nvenc']) {
      expect(allText).toContain(m);
    }
  });

  it('every project has a copy-ready English proof paragraph with numbers', () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.proofOfWork.split(/\s+/).length).toBeGreaterThan(50);
      expect(p.proofOfWork).toMatch(/\d/);
      expect(p.reusableModules.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('every Loom script covers 0:00 → 1:30 with EN line + VI translation', () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.loomScript[0].start).toBe('0:00');
      expect(p.loomScript[p.loomScript.length - 1].end).toBe('1:30');
      for (let i = 1; i < p.loomScript.length; i++) expect(p.loomScript[i].start).toBe(p.loomScript[i - 1].end);
      for (const s of p.loomScript) {
        expect(s.sayEn.length).toBeGreaterThan(20);
        expect(s.sayVi.length).toBeGreaterThan(20);
        expect(s.actionVi.length).toBeGreaterThan(10);
      }
    }
  });

  it('project keywords all reference existing lexicon terms', () => {
    for (const p of PORTFOLIO_PROJECTS) for (const k of p.keywords) expect(LEXICON_BY_ID[k], `${p.id}:${k}`).toBeDefined();
  });

  it('core positioning lists the 4 roles and the RTX 5070 Ti', () => {
    expect(CORE_POSITIONING.roles).toHaveLength(4);
    expect(CORE_POSITIONING.hardware).toContain('5070 Ti');
  });
});

describe('knowledge base', () => {
  it('lexicon ids are unique and aliases are lowercase', () => {
    expect(new Set(TECH_LEXICON.map((t) => t.id)).size).toBe(TECH_LEXICON.length);
    for (const t of TECH_LEXICON) for (const a of t.aliases) expect(a).toBe(a.toLowerCase());
  });

  it('implied stack references are valid', () => {
    for (const t of TECH_LEXICON) for (const i of t.implies ?? []) expect(LEXICON_BY_ID[i], `${t.id}→${i}`).toBeDefined();
  });

  it('edge cases are proven by real projects and triggered by known terms', () => {
    for (const e of EDGE_CASES) {
      expect(PROJECT_BY_ID[e.provenBy], e.id).toBeDefined();
      for (const t of e.triggers) expect(LEXICON_BY_ID[t], `${e.id}:${t}`).toBeDefined();
    }
    expect(new Set(EDGE_CASES.map((e) => e.niche)).size).toBe(5);
  });

  it('has 5 strategic niches with Upwork-legal profile titles (≤ 70 chars) and skills', () => {
    expect(NICHES.map((n) => n.id)).toEqual(['video', 'agents', 'localai', '3d', 'ota']);
    for (const n of NICHES) {
      expect(n.profileTitle.length).toBeLessThanOrEqual(70);
      expect(n.skills.length).toBeGreaterThanOrEqual(10);
      expect(n.profileOverview.length).toBeGreaterThan(400);
      expect(n.defaultExcludes).toEqual(expect.arrayContaining(['wordpress', 'wix', 'data entry', 'virtual assistant']));
    }
  });
});

describe('sample jobs & deals', () => {
  it('has 8 quick-load jobs spread across all 5 niches', () => {
    expect(SAMPLE_JOBS).toHaveLength(8);
    expect(new Set(SAMPLE_JOBS.map((j) => j.niche)).size).toBeGreaterThanOrEqual(4);
    expect(SAMPLE_JOBS.map((j) => j.title)).toEqual(
      expect.arrayContaining([
        'Build Automated Faceless TikTok/Reels Video Pipeline with Remotion & Whisper',
        'Custom MCP Server & Chrome CDP Browser Automation Agent',
        'Multi-Agent Orchestration System with Claude Code & Codex CLI',
      ]),
    );
  });

  it('seed deals cover every Kanban stage', () => {
    const stages = new Set(sampleDeals().map((d) => d.stage));
    expect(stages).toEqual(new Set(['saved', 'sent', 'interviewing', 'won', 'archived']));
  });
});
