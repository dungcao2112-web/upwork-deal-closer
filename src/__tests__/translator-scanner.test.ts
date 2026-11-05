import { describe, expect, it, vi } from 'vitest';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { sampleDeals } from '../data/sampleDeals';
import {
  UNKNOWN_HIRE_RATE,
  alignTranslation,
  analyzeJob,
  briefToText,
  buildGoogleUrl,
  buildTranslatePrompt,
  buildViBrief,
  chunkText,
  fixTerms,
  glossLine,
  googleTranslateWebUrl,
  parseGoogleResponse,
  parseScanInput,
  scanJobs,
  splitJobBlocks,
  splitParagraphs,
  translateJobGoogle,
  translateJobLlm,
  translationKey,
  translationToText,
  verbVi,
} from '../engine';

// ─────────────────────────────────────────────────────────────
// Translator
// ─────────────────────────────────────────────────────────────
const gtx = (vi: string) => [[[vi, 'src', null, null, 3]], null, 'en'];

describe('JD translator — Google (free, no key)', () => {
  it('splits paragraphs on blank lines and keeps bullets together', () => {
    expect(splitParagraphs('A\n\n- b\n- c\r\n\r\nD')).toEqual(['A', '- b\n- c', 'D']);
  });

  it('chunks long text under the limit without losing words', () => {
    const long = Array.from({ length: 80 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const chunks = chunkText(long, 300);
    expect(chunks.length).toBeGreaterThan(3);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(300);
    expect(chunks.join(' ').split(/\s+/).length).toBe(long.split(/\s+/).length);
    expect(chunkText('short')).toEqual(['short']);
  });

  it('builds the gtx URL and parses segmented responses', () => {
    const url = new URL(buildGoogleUrl('Hello world'));
    expect(url.hostname).toBe('translate.googleapis.com');
    expect(url.searchParams.get('tl')).toBe('vi');
    expect(url.searchParams.get('q')).toBe('Hello world');
    expect(parseGoogleResponse([[['Xin chào ', 'Hello '], ['thế giới', 'world']]])).toBe('Xin chào thế giới');
    expect(() => parseGoogleResponse({ error: 1 })).toThrow();
  });

  it('fixes machine-translated jargon only when the English source uses it (real Google outputs)', () => {
    const src = 'We want a fully automated pipeline. Background music with ducking. Faceless channels. Check rate parity on the extranet.';
    const vi = 'Chúng tôi muốn một đường dẫn hoàn toàn tự động. Nhạc nền có hình vịt. Kênh vô danh. Kiểm tra tính chẵn lẻ trên mạng ngoại vi.';
    const fixed = fixTerms(vi, src);
    expect(fixed).toContain('pipeline');
    expect(fixed).toContain('ducking');
    expect(fixed).toContain('faceless');
    expect(fixed).toContain('rate parity');
    expect(fixed).toContain('extranet');
    expect(fixed).not.toMatch(/hình vịt|chẵn lẻ|vô danh/);
    // no English trigger → untouched
    expect(fixTerms('đường ống nước', 'water pipe')).toBe('đường ống nước');
  });

  it('maps "đại lý" back to "agent" only in AI context', () => {
    expect(fixTerms('các đại lý chạy song song', 'AI agents run in parallel with Claude')).toBe('các agent chạy song song');
    expect(fixTerms('đại lý du lịch', 'travel agency partners')).toBe('đại lý du lịch');
  });

  it('translates title + every paragraph and keeps EN↔VI alignment', async () => {
    const job = SAMPLE_JOBS[0];
    const fetchMock = vi.fn(async (url: string) => {
      const q = new URL(url).searchParams.get('q')!;
      return new Response(JSON.stringify(gtx(`VI:${q.slice(0, 20)} đường ống`)), { status: 200 });
    });
    const t = await translateJobGoogle(job, fetchMock as unknown as typeof fetch);
    expect(t.engine).toBe('google');
    expect(t.titleVi.startsWith('VI:Build')).toBe(true);
    expect(t.blocks).toHaveLength(splitParagraphs(job.description).length);
    expect(t.blocks[0].en).toBe(splitParagraphs(job.description)[0]);
    expect(t.blocks[0].vi).toContain('pipeline'); // glossary applied
    expect(translationToText(t)).toContain(t.titleVi);
    expect(translationToText(t, true)).toContain('→ ');
  });

  it('surfaces HTTP errors from the free endpoint', async () => {
    const bad = vi.fn(async () => new Response('x', { status: 429 }));
    await expect(translateJobGoogle({ title: 'a', description: 'b' }, bad as unknown as typeof fetch)).rejects.toThrow(/429/);
  });

  it('opens Google Translate web as a zero-API fallback', () => {
    const u = new URL(googleTranslateWebUrl('x'.repeat(9000)));
    expect(u.hostname).toBe('translate.google.com');
    expect(u.searchParams.get('text')!.length).toBe(5000);
  });

  it('cache key changes with engine and content', () => {
    const a = translationKey({ title: 't', description: 'd' }, 'google');
    expect(a).toBe(translationKey({ title: 't', description: 'd' }, 'google'));
    expect(a).not.toBe(translationKey({ title: 't', description: 'd' }, 'llm'));
    expect(a).not.toBe(translationKey({ title: 't', description: 'e' }, 'google'));
  });
});

describe('JD translator — LLM bridge', () => {
  const job = { title: 'Build a bot', description: 'Para one.\n\nPara two.' };

  it('prompt puts the title first and keeps paragraphs', () => {
    expect(buildTranslatePrompt(job)).toBe('Build a bot\n\nPara one.\n\nPara two.');
  });

  it('aligns paragraph-for-paragraph, falls back to one block on mismatch', () => {
    expect(alignTranslation(job, 'Xây bot\n\nĐoạn một.\n\nĐoạn hai.').blocks).toEqual([
      { en: 'Para one.', vi: 'Đoạn một.' },
      { en: 'Para two.', vi: 'Đoạn hai.' },
    ]);
    const fb = alignTranslation(job, 'Xây bot\n\nTất cả gộp lại.');
    expect(fb.titleVi).toBe('Xây bot');
    expect(fb.blocks).toHaveLength(1);
  });

  it('sends a translation system prompt (keeps tech terms in English) via Ollama', async () => {
    const fetchMock = vi.fn(async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.system).toMatch(/translator/i);
      expect(body.system).toMatch(/Keep technical terms/);
      return new Response(JSON.stringify({ response: 'Xây bot\n\nĐoạn một.\n\nĐoạn hai.' }), { status: 200 });
    });
    const t = await translateJobLlm({ provider: 'ollama', apiKey: '', model: 'qwen', baseUrl: 'http://localhost:11434' }, job, fetchMock as unknown as typeof fetch);
    expect(t.engine).toBe('llm');
    expect(t.blocks[1].vi).toBe('Đoạn hai.');
  });
});

describe('offline Vietnamese brief (tóm ý nhanh, 0 network)', () => {
  it('maps action verbs and tech terms to Vietnamese', () => {
    expect(verbVi('Transcribe the voiceover with Whisper')).toBe('Chuyển giọng nói thành chữ');
    expect(verbVi('Zzz unknown')).toBe('Yêu cầu');
    const g = glossLine('Transcribe the voiceover with Whisper to get word-level timestamps');
    expect(g.vi).toContain('Whisper (giọng nói → chữ)');
    expect(g.en).toContain('Transcribe');
  });

  it.each(SAMPLE_JOBS.map((j) => [j.label, j] as const))('%s → complete brief with money, client, pains, verdict', (_l, j) => {
    const r = analyzeJob(j);
    const b = buildViBrief(j, r.analysis, r.win, r.matches, r.bid);
    const ids = b.sections.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['needs', 'money', 'client', 'pain', 'tech', 'verdict']));
    const text = briefToText(b);
    expect(text).toContain('phí 10%');
    expect(text).toContain(`${r.win.total}%`);
    expect(text).not.toMatch(/undefined|NaN/);
  });

  it('warns in Vietnamese for red-flag jobs', () => {
    const j = SAMPLE_JOBS.find((x) => x.id === 'job-electron-reverse')!;
    const r = analyzeJob(j);
    const warn = buildViBrief(j, r.analysis, r.win, r.matches, r.bid).sections.find((s) => s.id === 'warn')!;
    expect(warn.items.map((i) => i.vi).join(' ')).toMatch(/ngoài Upwork/);
  });
});

// ─────────────────────────────────────────────────────────────
// Batch scanner
// ─────────────────────────────────────────────────────────────
const UPWORK_PAGE_COPY = `Search results
Jobs you might like
Posted 12 minutes ago
Remotion Developer for Automated TikTok Video Pipeline
Hourly: $40-$75 - Expert - Est. time: 1 to 3 months, Less than 30 hrs/week
We need a Remotion + Whisper pipeline that renders 30 faceless TikTok videos per day with karaoke captions. GPU rendering with FFmpeg NVENC preferred.
more
Remotion
FFmpeg
Whisper
Payment verified
Rating is 4.9 out of 5.
$20K+
spent
United States
Proposals: 5 to 10
Posted 1 hour ago
WordPress website fix and data entry
Fixed-price - Entry level - Est. budget: $50
Need a cheap WordPress developer to fix my site and do data entry. Quick and easy task. Contact me on WhatsApp.
WordPress
Payment unverified
Rating is 0 out of 5.
$0
spent
India
Proposals: 50+
Posted 3 hours ago
Channex rate parity checker for boutique hotels
Fixed-price - Intermediate - Est. budget: $1,200
Our revenue team checks Booking.com and Agoda parity manually every day. Build a tool using the Channex API to flag rate parity issues and send Telegram alerts.
Channex
Booking.com
Payment verified
Rating is 4.7 out of 5.
$5K+
spent
Vietnam
Proposals: Less than 5
`;

describe('batch job scanner (paste from Upwork search page)', () => {
  it('splits a copied search page into one block per job and drops page chrome', () => {
    const blocks = splitJobBlocks(UPWORK_PAGE_COPY);
    expect(blocks).toHaveLength(3);
    expect(blocks[0][0]).toBe('Posted 12 minutes ago');
  });

  it('extracts title, hourly range, payment, spent, country, proposals and rating', () => {
    const [a, b, c] = parseScanInput(UPWORK_PAGE_COPY);
    expect(a.job.title).toBe('Remotion Developer for Automated TikTok Video Pipeline');
    expect(a.job.contractType).toBe('hourly');
    expect([a.job.hourlyMin, a.job.hourlyMax]).toEqual([40, 75]);
    expect(a.job.client).toMatchObject({ paymentVerified: true, totalSpent: 20000, country: 'United States', proposals: 8, rating: 4.9 });
    expect(a.job.description).toContain('karaoke captions');
    expect(a.job.description).not.toMatch(/Payment verified|Proposals:/);
    expect(a.postedText).toBe('Posted 12 minutes ago');

    expect(b.job.contractType).toBe('fixed');
    expect(b.job.budget).toBe(50);
    expect(b.job.client).toMatchObject({ paymentVerified: false, totalSpent: 0, country: 'India', proposals: 50 });

    expect(c.job.budget).toBe(1200);
    expect(c.job.client.proposals).toBe(3);
    expect(c.job.client.totalSpent).toBe(5000);
  });

  it('uses a neutral hire rate when the tile does not show it, and reports missing fields', () => {
    const [a] = parseScanInput(UPWORK_PAGE_COPY);
    expect(a.job.client.hireRate).toBe(UNKNOWN_HIRE_RATE);
    expect(a.missing).toContain('hire rate');
  });

  it('ranks jobs by win-rate: niche jobs on top, the WordPress trap is SKIP', () => {
    const res = scanJobs(UPWORK_PAGE_COPY);
    expect(res).toHaveLength(3);
    for (let i = 1; i < res.length; i++) expect(res[i - 1].winRate).toBeGreaterThanOrEqual(res[i].winRate);
    const wp = res.find((r) => r.scanned.job.title.startsWith('WordPress'))!;
    expect(wp.verdict).toBe('SKIP');
    expect(res[res.length - 1]).toBe(wp);
    const remotion = res.find((r) => r.scanned.job.title.startsWith('Remotion'))!;
    expect(remotion.niche).toBe('video');
    expect(remotion.winRate).toBeGreaterThanOrEqual(58);
    expect(remotion.bidLabel).toMatch(/\/h$/);
    const hotel = res.find((r) => r.scanned.job.title.startsWith('Channex'))!;
    expect(hotel.topProject).toContain('P7');
  });

  it('an off-niche job (Unity / C# / native mobile) is SKIP even with a verified client', () => {
    const txt = 'Posted 5 hours ago\nUnity mobile game developer needed (C#)\nHourly: $15-$25 - Intermediate\nBuild a casual mobile game for iOS app and Android app in Unity with C#.\nPayment verified\n$1K+\nspent\nPakistan\nProposals: 20 to 50';
    const [r] = scanJobs(txt);
    expect(r.verdict).toBe('SKIP');
    expect(r.winRate).toBeLessThanOrEqual(35);
  });

  it('supports manual "---" separated JDs with Title:/Budget: labels', () => {
    const txt = 'Title: MCP server for Claude Desktop\nBudget: $800\nWe need an MCP server in Node.js with Chrome CDP tools.\n---\nTitle: Blender auto rigging script\nHourly: $50\nRig GLB characters with Blender Python.';
    const jobs = parseScanInput(txt);
    expect(jobs.map((j) => j.job.title)).toEqual(['MCP server for Claude Desktop', 'Blender auto rigging script']);
    expect(jobs[0].job.budget).toBe(800);
    expect(jobs[1].job.contractType).toBe('hourly');
    expect(jobs[1].job.hourlyMax).toBe(50);
  });

  it('accepts a JSON array (e.g. a future Upwork API feed)', () => {
    const jobs = parseScanInput(JSON.stringify([{ title: 'ComfyUI face swap API', description: 'ComfyUI + BiRefNet', budget: 900, client: { paymentVerified: true } }, { foo: 1 }]));
    expect(jobs).toHaveLength(1);
    expect(jobs[0].job.budget).toBe(900);
  });

  it('de-duplicates repeated pastes and flags jobs already in the CRM', () => {
    const twice = parseScanInput(`${UPWORK_PAGE_COPY}\n${UPWORK_PAGE_COPY}`);
    expect(twice).toHaveLength(3);
    const deals = [{ ...sampleDeals()[0], id: 'deal_x', title: 'channex rate parity checker for boutique hotels' }];
    const res = scanJobs(UPWORK_PAGE_COPY, undefined, deals);
    expect(res.find((r) => r.scanned.job.title.startsWith('Channex'))!.duplicateOf).toBe('deal_x');
  });

  it('a single pasted JD without markers still works; empty input returns []', () => {
    expect(parseScanInput(SAMPLE_JOBS[1].title + '\n' + SAMPLE_JOBS[1].description)).toHaveLength(1);
    expect(parseScanInput('   ')).toEqual([]);
  });
});
