import type {
  ArchitectureDiagram,
  BidResult,
  DetectedKeyword,
  EdgeCase,
  JobAnalysis,
  JobInput,
  NicheId,
  PortfolioProject,
  Proposal,
  ProposalAngleId,
  ProposalOptions,
  ProjectMatch,
  Tone,
  WinRateResult,
} from '../types';
import { EDGE_CASES } from '../data/edgeCases';
import { NICHE_BY_ID } from '../data/niches';
import { generateArchitecture, toInline } from './architecture';
import { lintProposal } from './proposalLinter';
import { clamp, escapeRegExp, joinNatural, normalize, termRegex, truncate, wordCount } from './text';

export const ANGLE_WORD_RANGES: Record<ProposalAngleId, [number, number]> = {
  prototype: [130, 170],
  architect: [180, 260],
  delivery: [180, 260],
};

export const DEFAULT_PROPOSAL_OPTIONS: ProposalOptions = {
  tone: 'punchy',
  includeQuestions: true,
  includeDiagram: false,
  diagramFormat: 'ascii',
};

// ── Context ──────────────────────────────────────────────────
export interface ProposalContext {
  job: JobInput;
  analysis: JobAnalysis;
  win: WinRateResult;
  projects: PortfolioProject[]; // selected, best first
  bid?: BidResult;
  diagram: ArchitectureDiagram;
  terms: string[]; // client's own wording for detected tech, best first
  edges: EdgeCase[];
  coveragePct: number;
  shortTitle: string;
  assetNoun: string;
}

/** Return the client's own spelling of a term (e.g. "ComfyUI", "Booking.com"). */
export function clientWording(job: JobInput, k: DetectedKeyword): string {
  const raw = `${job.title}\n${job.description}`;
  const norm = normalize(raw);
  for (const alias of k.term.aliases) {
    const re = termRegex(alias);
    const m = re.exec(norm);
    if (m) {
      const exact = new RegExp(escapeRegExp(alias), 'i').exec(raw);
      if (exact) return exact[0];
    }
  }
  return k.term.label.split(' (')[0].split(' / ')[0];
}

const ASSET_NOUN: Record<NicheId, string> = {
  video: 'footage or scripts',
  agents: 'real workflow',
  localai: 'sample files',
  '3d': 'character models',
  ota: 'property data',
};

export function buildContext(
  job: JobInput,
  analysis: JobAnalysis,
  win: WinRateResult,
  matches: ProjectMatch[],
  selectedIds: string[],
  bid?: BidResult,
): ProposalContext {
  const selected = matches.filter((m) => selectedIds.includes(m.project.id)).map((m) => m.project);
  const projects = selected.length ? selected : matches.slice(0, 1).map((m) => m.project);
  const seen = new Set<string>();
  const terms: string[] = [];
  const ranked = analysis.keywords
    .filter((x) => x.term.dungHas)
    .map((k, i) => ({ k, i }))
    .sort((a, b) => Number(b.k.term.difficulty >= 3) - Number(a.k.term.difficulty >= 3) || a.i - b.i)
    .map((x) => x.k);
  for (const k of ranked) {
    const w = clientWording(job, k);
    if (!seen.has(w.toLowerCase())) {
      seen.add(w.toLowerCase());
      terms.push(w);
    }
  }
  const edges = analysis.edgeCases.length >= 2
    ? analysis.edgeCases
    : [...analysis.edgeCases, ...EDGE_CASES.filter((e) => e.niche === analysis.primaryNiche && !analysis.edgeCases.includes(e))].slice(0, 3);
  const reuse = win.dimensions.find((d) => d.key === 'reuse')?.score ?? 60;
  return {
    job,
    analysis,
    win,
    projects,
    bid,
    diagram: generateArchitecture(analysis),
    terms: terms.length ? terms : [NICHE_BY_ID[analysis.primaryNiche].coreTerms[0]],
    edges,
    coveragePct: clamp(Math.round(reuse / 5) * 5, 60, 95),
    shortTitle: projectNoun(job.title),
    assetNoun: ASSET_NOUN[analysis.primaryNiche],
  };
}

// ── Length-governed composer ─────────────────────────────────
interface Item {
  para: number;
  text: string;
  /** undefined = required; lower number = added first */
  opt?: number;
}

export function compose(items: Item[], [min, max]: [number, number], listParas: number[] = []): string {
  const chosen = new Set<number>();
  let total = 0;
  items.forEach((it, i) => {
    if (it.opt === undefined) {
      chosen.add(i);
      total += wordCount(it.text);
    }
  });
  const target = min + (max - min) * 0.55;
  const optional = items
    .map((it, i) => ({ it, i }))
    .filter((x) => x.it.opt !== undefined)
    .sort((a, b) => (a.it.opt ?? 0) - (b.it.opt ?? 0));
  for (const pass of [target, min]) {
    for (const { it, i } of optional) {
      if (total >= pass) break;
      if (chosen.has(i)) continue;
      const wc = wordCount(it.text);
      if (total + wc <= max) {
        chosen.add(i);
        total += wc;
      }
    }
  }
  const paras = new Map<number, string[]>();
  items.forEach((it, i) => {
    if (!chosen.has(i)) return;
    const arr = paras.get(it.para) ?? [];
    arr.push(it.text);
    paras.set(it.para, arr);
  });
  return [...paras.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, arr]) => arr.join(listParas.includes(p) ? '\n' : ' '))
    .join('\n\n');
}

const pick = (tone: Tone, v: Record<Tone, string>) => v[tone];

const PROPER_NOUNS = /^(Remotion|Whisper|Electron|ComfyUI|WebGL|Blender|Three\.js|Chrome|Cloudflare|Playwright|Upwork|Booking\.com|Agoda|Channex|GLB|MCP|NVENC|TTS|LLM|JSON|API|AI|CDP|FFmpeg|React|Node)\b/;

/** Lower-case the first letter unless the sentence starts with a product name or acronym. */
export function lowerFirst(s: string): string {
  if (!s) return s;
  if (PROPER_NOUNS.test(s)) return s;
  if (s.length > 1 && s[1] === s[1].toUpperCase() && /[A-Z]/.test(s[1])) return s; // acronym
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** "Build Automated Faceless TikTok Pipeline with Remotion" → "Automated Faceless TikTok Pipeline". */
export function projectNoun(title: string): string {
  let t = title.replace(/\s+/g, ' ').trim();
  t = t.replace(/^(build|create|develop|need|looking for|seeking|hiring|wanted|make)\s+(an?\s+|the\s+)?/i, '');
  t = t.split(/\s+(with|using|via|like|in|for)\s+/i)[0];
  if (t.length > 60) {
    const cut = t.slice(0, 60);
    t = cut.slice(0, cut.lastIndexOf(' ') > 30 ? cut.lastIndexOf(' ') : 60);
  }
  return t.replace(/[\s&,/-]+$/, '').trim();
}

function headlineMetric(p: PortfolioProject): string {
  const map: Record<string, string> = {
    'ai-capcut-studio': 'a 5-track timeline with 30fps real-time preview and NVENC export',
    'app-video-chia-se': '82/82 automated tests passing, Whisper large-v3 on CUDA and -14 LUFS audio',
    'code-video-render': '6.4x faster renders at SSIM 0.995',
    'ceo-multi-agent': 'a 7-gate QA pipeline (G0→G6) and real-Chrome CDP control',
    'local-tts-comfyui': '8 local TTS engines and BiRefNet batch cut-outs on one GPU',
    'van-phong-3d': '17-bone auto-rigged GLB avatars with zero foot sliding',
    'ecom-ota-social': 'daily parity checks across Booking.com, Agoda, Trip.com and Expedia',
  };
  if (map[p.id]) return map[p.id];
  const custom = p.metrics.map((m) => `${m.label}: ${m.value}`).slice(0, 2).join(', ');
  return custom || p.taglineEn || `${p.stack.slice(0, 3).join(' + ') || 'a working build'} running today`;
}

// ── Angle 1: Prototype-First ─────────────────────────────────
function anglePrototype(c: ProposalContext, tone: Tone): string {
  const p = c.projects[0];
  const p2 = c.projects[1];
  const t = c.terms;
  const stack = joinNatural(t.slice(0, 3));
  const pain = c.analysis.painPoints[0];
  const pain2 = c.analysis.painPoints[1];
  const e = c.edges[0];
  const modules = p.reusableModules.length ? joinNatural(p.reusableModules.slice(0, 3).map(lowerFirst)) : `${p.shortName} codebase`;
  const items: Item[] = [
    {
      para: 0,
      text: pick(tone, {
        punchy: `I already run a working ${stack} system that covers ~${c.coveragePct}% of your scope — ${headlineMetric(p)}.`,
        technical: `My ${p.shortName} is a production ${stack} system that maps to ~${c.coveragePct}% of your spec: ${headlineMetric(p)}.`,
        executive: `You can see this working before you hire: my ${p.shortName} already covers ~${c.coveragePct}% of your scope with ${stack} — ${headlineMetric(p)}.`,
      }),
    },
    {
      para: 0,
      text: pick(tone, {
        punchy: `I can show you a 90-second demo of it today.`,
        technical: `Happy to share a 90-second screen recording of the live build.`,
        executive: `I can send a 90-second demo so you judge real output, not promises.`,
      }),
    },
    {
      para: 1,
      text: pick(tone, {
        punchy: `For your ${c.shortTitle} I would reuse my ${modules} instead of starting from zero.`,
        technical: `For your ${c.shortTitle} I would extend existing modules — ${modules} — rather than write them from scratch.`,
        executive: `For your ${c.shortTitle}, most of the hard parts already exist (${modules}), which cuts both delivery time and risk.`,
      }),
    },
    {
      para: 1,
      text: `That directly solves your main issue — ${lowerFirst(pain.titleEn)} — because I ${pain.addressEn}.`,
    },
    pain2 ? { para: 1, opt: 2, text: `It also helps with ${lowerFirst(pain2.titleEn)}: I ${pain2.addressEn}.` } : { para: 1, opt: 9, text: '' },
    e ? { para: 2, opt: 1, text: `One trap I'd plan for from day one: ${lowerFirst(e.title)}. ${e.fixEn}` } : { para: 2, opt: 9, text: '' },
    p2 ? { para: 2, opt: 3, text: `My ${p2.shortName} adds ${headlineMetric(p2)} if you need it.` } : { para: 2, opt: 9, text: '' },
    c.bid
      ? { para: 3, opt: 4, text: `Because the core is built, I estimate about ${c.bid.daysToDeliver} working days to a production-ready MVP.` }
      : { para: 3, opt: 9, text: '' },
    {
      para: 3,
      text: pick(tone, {
        punchy: `Milestone 1 is a working build on your own ${c.assetNoun}.`,
        technical: `Milestone 1 delivers a working build running on your own ${c.assetNoun}, with tests.`,
        executive: `Milestone 1 is a working build on your own ${c.assetNoun}, so you approve real results before investing further.`,
      }),
    },
    { para: 3, opt: 5, text: `Every step is verified with automated checks before you see it.` },
    { para: 3, opt: 6, text: `You get clean, documented code that you fully own.` },
    {
      para: 4,
      text: pick(tone, {
        punchy: `Want the Loom link, or should I run one of your files through it first?`,
        technical: `Shall I send the Loom walkthrough, or run one of your files through the pipeline first?`,
        executive: `Would you prefer the demo video first, or a quick test on one of your files?`,
      }),
    },
  ];
  return compose(items.filter((i) => i.text), ANGLE_WORD_RANGES.prototype);
}

// ── Angle 2: Technical Architect & Edge-Case Solver ──────────
function angleArchitect(c: ProposalContext, tone: Tone): string {
  const p = c.projects[0];
  const [e1, e2, e3] = c.edges;
  const stack = joinNatural(c.terms.slice(0, 3));
  const inline = toInline(c.diagram.stages);
  const ms = c.bid?.milestones ?? [];
  const items: Item[] = [
    {
      para: 0,
      text: pick(tone, {
        punchy: `Your ${stack} build will hit ${e2 ? '2 hidden traps' : '1 hidden trap'}: ${lowerFirst(e1.title)}${e2 ? `, and ${lowerFirst(e2.title)}` : ''}. I have fixed ${e2 ? 'both' : 'it'} in production — here is how.`,
        technical: `On your ${stack} build, the hard part is not the happy path — it is ${lowerFirst(e1.title)}${e2 ? `, and ${lowerFirst(e2.title)}` : ''}. I have solved ${e2 ? 'both' : 'it'} in a system I run in production today.`,
        executive: `${e2 ? '2 risks' : '1 risk'} usually sink ${stack} projects like yours: ${lowerFirst(e1.title)}${e2 ? `, and ${lowerFirst(e2.title)}` : ''}. I have already solved ${e2 ? 'both' : 'it'} in production, so you don't pay for the learning curve.`,
      }),
    },
    { para: 1, text: `1) ${e1.trapEn} → ${e1.fixEn}` },
    e2 ? { para: 1, text: `2) ${e2.trapEn} → ${e2.fixEn}` } : { para: 1, opt: 9, text: '' },
    e3 ? { para: 1, opt: 3, text: `3) ${e3.trapEn} → ${e3.fixEn}` } : { para: 1, opt: 9, text: '' },
    {
      para: 2,
      text: pick(tone, {
        punchy: `Architecture I'd use: ${inline}.`,
        technical: `Proposed architecture: ${inline}.`,
        executive: `The solution flow: ${inline}.`,
      }),
    },
    ms.length
      ? { para: 3, opt: 1, text: `Roadmap: ${ms.map((m, i) => `(${i + 1}) ${m.title}`).join('; ')}.` }
      : { para: 3, opt: 1, text: `Roadmap: (1) architecture + working prototype on your data; (2) core pipeline; (3) integration, QA and handover.` },
    {
      para: 4,
      text: pick(tone, {
        punchy: `Proof: ${p.taglineEn}`,
        technical: `Reference implementation: ${p.taglineEn}`,
        executive: `Track record: ${p.taglineEn}`,
      }),
    },
    p.taglineEn.includes(headlineMetric(p).split(' ')[0]) ? { para: 4, opt: 9, text: '' } : { para: 4, opt: 2, text: `Key numbers: ${headlineMetric(p)}.` },
    c.projects[1] ? { para: 4, opt: 4, text: `Related: ${c.projects[1].taglineEn}` } : { para: 4, opt: 9, text: '' },
    { para: 4, opt: 5, text: `Your pain point "${truncate(c.analysis.painPoints[0].evidence, 90)}" is exactly what this setup removes.` },
    {
      para: 5,
      text: pick(tone, {
        punchy: `Happy to walk your tech lead through it on a 15-minute call.`,
        technical: `I can walk your tech lead through the design and trade-offs on a 15-minute call.`,
        executive: `I can walk you or your tech lead through the plan on a short 15-minute call.`,
      }),
    },
  ];
  return compose(items.filter((i) => i.text), ANGLE_WORD_RANGES.architect, [1]);
}

// ── Angle 3: End-to-End Delivery & 7-Gate QA ─────────────────
const QA_METRIC: Record<NicheId, string> = {
  video: 'ffprobe, SSIM and LUFS',
  agents: 'task success rate and replayable logs',
  localai: 'quality benchmarks on your hard samples and VRAM load tests',
  '3d': 'frame-rate on your target laptop and foot-lock checks',
  ota: 'parity diffs against live guest prices',
};

function angleDelivery(c: ProposalContext, tone: Tone): string {
  const p = c.projects[0];
  const ms = c.bid?.milestones ?? [];
  const metric = QA_METRIC[c.analysis.primaryNiche];
  const items: Item[] = [
    {
      para: 0,
      text: pick(tone, {
        punchy: `You never have to take my word for it: every deliverable on your ${c.terms[0]} project passes my 7-gate QA pipeline (G0→G6) before it reaches you.`,
        technical: `Your ${c.terms[0]} build would ship through the same 7-gate QA pipeline (G0→G6) I use on my own autonomous systems — nothing is "done" until an independent check passes.`,
        executive: `You get zero-surprise delivery on your ${c.terms[0]} project: each milestone passes a 7-gate QA pipeline (G0→G6) with measurable results before you approve it.`,
      }),
    },
    { para: 0, text: `You see working output in milestone one.` },
    ...(ms.length
      ? ms.map<Item>((m) => ({ para: 1, text: `• M${m.index} (${m.percent}%) ${m.title}` }))
      : [
          { para: 1, text: '• M1 (30%) Architecture + working prototype on your data' } as Item,
          { para: 1, text: '• M2 (45%) Core pipeline + integration' } as Item,
          { para: 1, text: '• M3 (25%) QA hardening, docs & handover' } as Item,
        ]),
    {
      para: 2,
      text: `The gates: G0 preconditions → G1 build → G2 unit tests → G3 run on your real data → G4 metrics (${metric}) → G5 independent acceptance script → G6 docs & handover.`,
    },
    { para: 2, opt: 3, text: `Each milestone comes with the gate report, so you can verify the numbers yourself.` },
    {
      para: 3,
      text: pick(tone, {
        punchy: `Same process behind my ${p.shortName}: ${headlineMetric(p)}.`,
        technical: `It is the process behind my ${p.shortName} (${headlineMetric(p)}).`,
        executive: `This is how I delivered ${p.shortName}: ${headlineMetric(p)}.`,
      }),
    },
    { para: 3, opt: 1, text: `It keeps risk on my side: if milestone one doesn't show real results on your data, you simply don't approve it.` },
    { para: 3, opt: 2, text: `You also get clean, documented code, a runbook and a recorded handover, so your team can own it from day one.` },
    c.bid ? { para: 3, opt: 4, text: `Since much of the core is already built, I expect the full scope in roughly ${c.bid.daysToDeliver} working days.` } : { para: 3, opt: 9, text: '' },
    { para: 3, opt: 5, text: `I'll share progress updates at least every two days.` },
    {
      para: 4,
      text: pick(tone, {
        punchy: `Want me to send the milestone plan with dates?`,
        technical: `Shall I send the detailed milestone plan with acceptance criteria per gate?`,
        executive: `Shall I send a one-page delivery plan with dates and acceptance criteria?`,
      }),
    },
  ];
  return compose(items.filter((i) => i.text), ANGLE_WORD_RANGES.delivery, [1]);
}

// ── Closing questions ────────────────────────────────────────
interface Q {
  text: string;
  when?: string[];
}

const QUESTION_BANK: Record<NicheId, Q[]> = {
  video: [
    { text: 'Roughly how many videos per day do you need at launch, and should rendering run on your own GPU or in the cloud?', when: ['queue', 'shortform', 'remotion', 'nvenc'] },
    { text: 'Do you have a caption style reference (font, highlight colour, position) I should match exactly?', when: ['captions', 'whisper'] },
    { text: 'Which TTS voice do you use today, and would a self-hosted voice clone be an option to cut per-minute costs?', when: ['tts'] },
    { text: 'Should final export run server-side only, or do you also need in-browser rendering for quick previews?', when: ['videoeditor', 'canvas'] },
    { text: 'Is there one reference video I can match frame-for-frame for the first milestone?' },
    { text: 'Where should finished videos land — Drive, S3, or straight to the platforms?' },
  ],
  agents: [
    { text: 'Which MCP clients must this work with first — Claude Code, Claude Desktop, Cursor or your own?', when: ['mcp'] },
    { text: 'Which sites or apps matter most, and are they behind a login or 2FA?', when: ['cdp', 'playwright', 'antibot'] },
    { text: 'How do you define "verified done" for a task today — tests, a human check, or a metric?', when: ['multiagent', 'qa', 'llm'] },
    { text: 'Do you have a monthly cost ceiling for LLM usage that routing should respect?', when: ['llm', 'openai', 'claude', 'ollama'] },
    { text: 'Do you hold the rights/licence to the app and a test account I can analyse safely?', when: ['reverse', 'electron'] },
    { text: 'Will this run on Windows, WSL2, Linux servers or a mix?' },
  ],
  localai: [
    { text: 'What GPU(s) will this run on in production, and how many concurrent requests do you expect at peak?', when: ['gpuserver', 'comfyui', 'queue'] },
    { text: 'Can you share 5 "hard" sample images (hair, glass, reflective packaging) so I benchmark edge quality first?', when: ['bgremoval'] },
    { text: 'For face swap, must the target lighting and expression be preserved exactly?', when: ['faceswap'] },
    { text: 'Which languages/accents matter for the voices, and do you have consent recordings for cloning?', when: ['tts'] },
    { text: 'How should results come back to your app — polling, webhook, or a storage bucket?' },
  ],
  '3d': [
    { text: 'Can you send one GLB/FBX character so I can show it walking in a test scene this week?', when: ['glb', 'rigging', 'blender'] },
    { text: 'What is the lowest-spec laptop that must stay smooth, and at what avatar count?', when: ['threejs', 'avatar'] },
    { text: 'Do your agent states already stream over WebSocket, or should I define the event schema?', when: ['avatar', 'gamedev'] },
    { text: 'Do you hold the rights/licence to the app and a test account I can analyse safely?', when: ['reverse'] },
    { text: 'Plain Three.js or React Three Fiber for your existing frontend?' },
  ],
  ota: [
    { text: 'How many properties, room types and rate plans are in scope, and which OTAs matter most?', when: ['ota', 'channex', 'hotel'] },
    { text: 'Do you already have Channex API access, or should I start from read-only extranet logins?', when: ['channex'] },
    { text: 'What parity tolerance should trigger an alert (e.g. >1% or >$2), and who should receive it?', when: ['rateparity', 'telegram'] },
    { text: 'Should the tool only report issues, or also close rooms / fix rates after approval?' },
    { text: 'Which format does your revenue team prefer — Excel, Google Sheets or a dashboard link?' },
  ],
};

export function closingQuestions(analysis: JobAnalysis, count = 3): string[] {
  const ids = new Set(analysis.keywords.map((k) => k.term.id));
  const bank = QUESTION_BANK[analysis.primaryNiche];
  const matched = bank.filter((q) => q.when?.some((w) => ids.has(w)));
  const generic = bank.filter((q) => !q.when);
  const rest = bank.filter((q) => q.when && !matched.includes(q));
  return [...matched, ...generic, ...rest].slice(0, count).map((q) => q.text);
}

// ── Vietnamese strategy notes ────────────────────────────────
function strategyNotes(angle: ProposalAngleId, c: ProposalContext): { strategyVi: string[]; summaryVi: string } {
  const p = c.projects[0];
  const e = c.edges[0];
  if (angle === 'prototype') {
    return {
      strategyVi: [
        `Hook 2 dòng đầu: khẳng định "${p.shortName}" đã chạy thật, phủ ~${c.coveragePct}% phạm vi + con số đo được.`,
        'Mời xem demo Loom 90s ngay câu thứ 2 → khách tò mò bấm mở proposal.',
        `Gọi đúng nỗi đau số 1: "${c.analysis.painPoints[0].titleVi}".`,
        'Ngắn gọn 130–170 từ: hợp với khách bận, job đông ứng viên.',
        'Kết thúc bằng câu hỏi lựa chọn (Loom hay chạy thử file) → tăng tỷ lệ phản hồi.',
      ],
      summaryVi: `Mở bằng sản phẩm chạy thật (${p.shortName}), nêu module tái sử dụng, cam kết milestone 1 chạy trên dữ liệu của khách, chốt bằng lời mời xem demo.`,
    };
  }
  if (angle === 'architect') {
    return {
      strategyVi: [
        `Đánh thẳng vào bẫy kỹ thuật: "${e.title}" — chỉ người làm rồi mới biết.`,
        'Mỗi bẫy đi kèm cách Dũng đã giải trong hệ thống thật → chứng minh chiều sâu.',
        'Đưa luồng kiến trúc + lộ trình milestone → CTO/Tech Lead thấy rõ kế hoạch.',
        'Dùng khi khách là kỹ sư, JD dài, có nhắc tới lần thử thất bại trước đó.',
      ],
      summaryVi: `Chỉ ra ${Math.min(c.edges.length, 3)} bẫy kỹ thuật & cách giải, trình bày kiến trúc ${c.diagram.title}, lộ trình và bằng chứng từ ${p.shortName}; mời gọi 15 phút.`,
    };
  }
  return {
    strategyVi: [
      'Bán sự an tâm: QA 7 cổng G0→G6, khách duyệt từng milestone với số đo thực.',
      'Liệt kê milestones + % ngân sách → khách thấy rủi ro thấp, dễ bấm Hire.',
      'Đảo ngược rủi ro: milestone 1 không ra kết quả thật thì không cần duyệt.',
      'Hợp với khách non-tech / chủ doanh nghiệp / khách đã từng bị freelancer bỏ dở.',
    ],
    summaryVi: `Cam kết bàn giao trọn gói qua ${c.bid?.milestones.length ?? 3} milestones, giải thích 7 cổng QA với chỉ số ${QA_METRIC[c.analysis.primaryNiche]}, dẫn chứng ${p.shortName}.`,
  };
}

const ANGLE_META: Record<ProposalAngleId, { emoji: string; title: string; titleVi: string }> = {
  prototype: { emoji: '⚡', title: 'Prototype-First / Direct Hook', titleVi: 'Chốt nhanh bằng sản phẩm có sẵn' },
  architect: { emoji: '🧠', title: 'Technical Architect & Edge-Case Solver', titleVi: 'Chinh phục CTO bằng chiều sâu kỹ thuật' },
  delivery: { emoji: '🛡️', title: 'End-to-End Delivery & 7-Gate QA', titleVi: 'Cam kết bàn giao & giảm rủi ro' },
};

export function generateProposal(angle: ProposalAngleId, c: ProposalContext, opts: ProposalOptions = DEFAULT_PROPOSAL_OPTIONS): Proposal {
  const body =
    angle === 'prototype' ? anglePrototype(c, opts.tone) : angle === 'architect' ? angleArchitect(c, opts.tone) : angleDelivery(c, opts.tone);
  const parts = [opts.clientName ? `Hi ${opts.clientName},\n\n${body}` : body];
  if (opts.includeDiagram) {
    parts.push(
      opts.diagramFormat === 'mermaid'
        ? `Solution architecture (Mermaid — paste into mermaid.live):\n${c.diagram.mermaid}`
        : `Solution architecture:\n${c.diagram.ascii}`,
    );
  }
  if (opts.includeQuestions) {
    const qs = closingQuestions(c.analysis);
    parts.push(`A few quick questions so I can tailor the plan:\n${qs.map((q, i) => `${i + 1}. ${q}`).join('\n')}`);
  }
  parts.push('Best,\nDũng');
  const text = parts.join('\n\n');
  const meta = ANGLE_META[angle];
  const notes = strategyNotes(angle, c);
  return {
    angle,
    emoji: meta.emoji,
    title: meta.title,
    titleVi: meta.titleVi,
    body,
    text,
    bodyWordCount: wordCount(body),
    targetWords: ANGLE_WORD_RANGES[angle],
    strategyVi: notes.strategyVi,
    summaryVi: notes.summaryVi,
    lint: lintProposal(text, [...c.terms.slice(0, 6), ...c.projects.map((p) => p.shortName)]),
  };
}

export function generateAllProposals(c: ProposalContext, opts: ProposalOptions = DEFAULT_PROPOSAL_OPTIONS): Proposal[] {
  return (['prototype', 'architect', 'delivery'] as ProposalAngleId[]).map((a) => generateProposal(a, c, opts));
}
