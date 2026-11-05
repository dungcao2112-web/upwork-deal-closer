import { describe, expect, it, vi } from 'vitest';
import type { Deal } from '../types';
import { NICHE_BY_ID } from '../data/niches';
import { sampleDeals } from '../data/sampleDeals';
import {
  buildBooleanQuery,
  buildLlmRequest,
  buildUpworkSearchUrl,
  callLlm,
  computeStats,
  createDeal,
  defaultBooleanOptions,
  exportDealsCsv,
  exportDealsJson,
  extractLlmText,
  importDealsCsv,
  importDealsJson,
  mergeDeals,
  moveDeal,
  parseCsv,
  quoteTerm,
} from '../engine';

describe('boolean search builder', () => {
  it('builds (core OR …) AND (plus OR …) NOT exclusions', () => {
    const q = buildBooleanQuery({ coreTerms: ['remotion', 'ffmpeg'], plusTerms: ['tiktok', 'youtube shorts'], excludeTerms: ['wordpress', 'data entry'], excludeStyle: 'NOT' });
    expect(q).toBe('(remotion OR ffmpeg) AND (tiktok OR "youtube shorts") NOT wordpress NOT "data entry"');
  });

  it('supports minus-style exclusions', () => {
    const q = buildBooleanQuery({ coreTerms: ['mcp server'], plusTerms: [], excludeTerms: ['wix', 'virtual assistant'], excludeStyle: 'minus' });
    expect(q).toBe('"mcp server" -wix -"virtual assistant"');
  });

  it('quotes multi-word & dotted terms and de-duplicates', () => {
    expect(quoteTerm('three.js')).toBe('"three.js"');
    expect(quoteTerm('comfyui')).toBe('comfyui');
    expect(buildBooleanQuery({ coreTerms: ['a', 'A', ''], plusTerms: [], excludeTerms: [], excludeStyle: 'NOT' })).toBe('a');
  });

  it('builds the Upwork search URL with filters', () => {
    const o = { ...defaultBooleanOptions(NICHE_BY_ID.video), contractType: 'fixed' as const, minBudget: 1000 };
    const url = new URL(buildUpworkSearchUrl(o));
    expect(url.hostname).toBe('www.upwork.com');
    expect(url.searchParams.get('payment_verified')).toBe('1');
    expect(url.searchParams.get('t')).toBe('1');
    expect(url.searchParams.get('amount')).toBe('1000-');
    expect(url.searchParams.get('q')).toContain('remotion');
    expect(url.searchParams.get('q')).toContain('NOT wordpress');
  });

  it('every niche default query includes its core terms & default exclusions', () => {
    for (const id of ['video', 'agents', 'localai', '3d', 'ota'] as const) {
      const q = buildBooleanQuery(defaultBooleanOptions(NICHE_BY_ID[id]));
      expect(q.startsWith('(')).toBe(true);
      expect(q).toContain('NOT wix');
    }
  });
});

describe('deal pipeline CRM', () => {
  const deal = (): Deal =>
    createDeal({
      title: 'Test, "quoted" job\nline2',
      niche: 'video',
      contractType: 'fixed',
      clientCountry: 'US',
      winRate: 80,
      projectIds: ['ai-capcut-studio', 'code-video-render'],
      proposalAngle: 'prototype',
      proposalText: 'Hello, world',
      bidAmount: 1500,
      milestones: [],
      connects: 12,
      jobDescription: 'JD',
    });

  it('creates deals in the Saved stage', () => {
    const d = deal();
    expect(d.stage).toBe('saved');
    expect(d.id).toMatch(/^deal_/);
  });

  it('moving to Won stamps sent/replied/won cumulatively', () => {
    const d = moveDeal(deal(), 'won', '2026-01-01T00:00:00.000Z');
    expect(d.sentAt).toBe('2026-01-01T00:00:00.000Z');
    expect(d.repliedAt).toBeDefined();
    expect(d.wonAt).toBeDefined();
    const archived = moveDeal(d, 'archived');
    expect(archived.wonAt).toBe(d.wonAt);
  });

  it('computes reply rate, win rate, connects and pipeline value', () => {
    const s = computeStats(sampleDeals(), 0.15);
    expect(s.total).toBe(7);
    expect(s.sent).toBe(5);
    expect(s.replied).toBe(3);
    expect(s.won).toBe(1);
    expect(s.replyRate).toBe(60);
    expect(s.winRate).toBe(20);
    expect(s.connects).toBe(64);
    expect(s.connectsUsd).toBe(9.6);
    expect(s.pipelineValue).toBe(2200 + 1900 + 1500 + 900 + 1100);
    expect(s.byStage.archived).toBe(2);
  });

  it('empty pipeline has zero rates', () => {
    const s = computeStats([]);
    expect(s.replyRate).toBe(0);
    expect(s.winRate).toBe(0);
  });

  it('JSON export → import round-trips', () => {
    const deals = [deal(), ...sampleDeals()];
    const back = importDealsJson(exportDealsJson(deals));
    expect(back).toHaveLength(deals.length);
    expect(back[0].title).toBe(deals[0].title);
    expect(back[0].projectIds).toEqual(deals[0].projectIds);
  });

  it('JSON import rejects garbage', () => {
    expect(() => importDealsJson('{"foo":1}')).toThrow();
    expect(() => importDealsJson('[{"x":1}]')).toThrow();
  });

  it('CSV export escapes commas/quotes/newlines and imports back', () => {
    const d = moveDeal(deal(), 'sent');
    const csv = exportDealsCsv([d]);
    expect(csv.split('\n')[0]).toContain('title,stage');
    const back = importDealsCsv(csv);
    expect(back).toHaveLength(1);
    expect(back[0].title).toBe(d.title);
    expect(back[0].proposalText).toBe('Hello, world');
    expect(back[0].stage).toBe('sent');
    expect(back[0].projectIds).toEqual(['ai-capcut-studio', 'code-video-render']);
    expect(back[0].bidAmount).toBe(1500);
  });

  it('parseCsv handles CRLF and escaped quotes', () => {
    expect(parseCsv('a,b\r\n"x ""y""",2\r\n')).toEqual([['a', 'b'], ['x "y"', '2']]);
  });

  it('mergeDeals overwrites by id and appends new ones', () => {
    const a = deal();
    const merged = mergeDeals([a], [{ ...a, notes: 'updated' }, deal()]);
    expect(merged).toHaveLength(2);
    expect(merged.find((x) => x.id === a.id)!.notes).toBe('updated');
  });
});

describe('optional LLM bridge', () => {
  it('builds a Claude Messages API request', () => {
    const r = buildLlmRequest({ provider: 'claude', apiKey: 'k', model: 'claude-sonnet-5-5' }, 'hi');
    expect(r.url).toBe('https://api.anthropic.com/v1/messages');
    expect(r.init.headers['x-api-key']).toBe('k');
    expect(r.init.headers['anthropic-version']).toBe('2023-06-01');
    expect(JSON.parse(r.init.body).messages[0].content).toBe('hi');
  });

  it('builds OpenAI / Gemini / Ollama requests', () => {
    expect(buildLlmRequest({ provider: 'openai', apiKey: 'k', model: 'm' }, 'x').init.headers.authorization).toBe('Bearer k');
    expect(buildLlmRequest({ provider: 'gemini', apiKey: 'k', model: 'gemini-2.5-flash' }, 'x').url).toContain('gemini-2.5-flash:generateContent');
    const o = buildLlmRequest({ provider: 'ollama', apiKey: '', model: 'qwen', baseUrl: 'http://localhost:11434/' }, 'x');
    expect(o.url).toBe('http://localhost:11434/api/generate');
    expect(JSON.parse(o.init.body).stream).toBe(false);
  });

  it('extracts text from each provider response shape', () => {
    expect(extractLlmText('claude', { content: [{ type: 'text', text: 'A' }] })).toBe('A');
    expect(extractLlmText('openai', { choices: [{ message: { content: 'B' } }] })).toBe('B');
    expect(extractLlmText('gemini', { candidates: [{ content: { parts: [{ text: 'C' }] } }] })).toBe('C');
    expect(extractLlmText('ollama', { response: 'D' })).toBe('D');
  });

  it('callLlm uses fetch and surfaces errors; requires a key for cloud providers', async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify({ response: 'rewritten' }), { status: 200 }));
    await expect(callLlm({ provider: 'ollama', apiKey: '', model: 'q' }, 'p', ok as unknown as typeof fetch)).resolves.toBe('rewritten');
    const bad = vi.fn(async () => new Response('nope', { status: 401 }));
    await expect(callLlm({ provider: 'openai', apiKey: 'k', model: 'm' }, 'p', bad as unknown as typeof fetch)).rejects.toThrow(/401/);
    await expect(callLlm({ provider: 'claude', apiKey: '', model: 'm' }, 'p')).rejects.toThrow(/API key/);
  });
});
