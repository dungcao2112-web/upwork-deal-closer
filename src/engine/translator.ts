import type {
  BidResult,
  JobAnalysis,
  JobInput,
  JobTranslation,
  LlmConfig,
  ProjectMatch,
  TranslatedBlock,
  ViBrief,
  ViBriefItem,
  WinRateResult,
} from '../types';
import { NICHE_BY_ID } from '../data/niches';
import { detectKeywords } from './jdAnalyzer';
import { callLlm } from './llmBridge';
import { truncate } from './text';

// ═════════════════════════════════════════════════════════════
// 1. Full translation — free Google endpoint (no key) or the LLM bridge
// ═════════════════════════════════════════════════════════════

export const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
/** Keep GET URLs well under browser/server limits (≈3× after encoding). */
export const MAX_CHUNK_CHARS = 1000;

export function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Split a long paragraph on line, then sentence boundaries so each chunk ≤ max. */
export function chunkText(paragraph: string, max = MAX_CHUNK_CHARS): string[] {
  if (paragraph.length <= max) return [paragraph];
  const pieces = paragraph.split(/(?<=\n)|(?<=[.!?])\s+/).filter((s) => s.length);
  const out: string[] = [];
  let cur = '';
  for (const piece of pieces) {
    if (piece.length > max) {
      if (cur) out.push(cur);
      cur = '';
      for (let i = 0; i < piece.length; i += max) out.push(piece.slice(i, i + max));
      continue;
    }
    const joined = cur ? (cur.endsWith('\n') ? cur + piece : `${cur} ${piece}`) : piece;
    if (joined.length > max) {
      out.push(cur);
      cur = piece;
    } else cur = joined;
  }
  if (cur) out.push(cur);
  return out.map((c) => c.trim()).filter(Boolean);
}

export function buildGoogleUrl(q: string, sl = 'en', tl = 'vi'): string {
  const p = new URLSearchParams({ client: 'gtx', sl, tl, dt: 't', q });
  return `${GOOGLE_TRANSLATE_ENDPOINT}?${p.toString()}`;
}

export function parseGoogleResponse(data: unknown): string {
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('Phản hồi dịch không hợp lệ');
  return (data[0] as unknown[])
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
    .join('')
    .trim();
}

/** Open the same text on translate.google.com (always works, no API). */
export function googleTranslateWebUrl(text: string): string {
  const p = new URLSearchParams({ sl: 'en', tl: 'vi', text: text.slice(0, 5000), op: 'translate' });
  return `https://translate.google.com/?${p.toString()}`;
}

// ── Terminology post-fix ─────────────────────────────────────
interface GlossaryRule {
  from: RegExp;
  to: string;
  /** only applied when the English source matches */
  when?: RegExp;
}

/**
 * Machine translation mangles tech jargon ("pipeline" → "đường ống",
 * "ducking" → "có hình vịt", "parity" → "tính chẵn lẻ"…). These rules
 * put the industry term back — only when the English source uses it.
 */
export const GLOSSARY: GlossaryRule[] = [
  { from: /đường (ống|dẫn)( dữ liệu)?/gi, to: 'pipeline', when: /pipeline/i },
  { from: /(nhạc nền )?có hình vịt/gi, to: '$1tự giảm âm khi có giọng nói (ducking)', when: /duck/i },
  { from: /vô danh/gi, to: 'faceless (không lộ mặt)', when: /faceless/i },
  { from: /tập lệnh/gi, to: 'kịch bản (script)', when: /script.{0,80}(voiceover|video|tts)|(voiceover|video).{0,80}script/is },
  { from: /(tỷ lệ|tính) (ngang bằng|chẵn lẻ)/gi, to: 'đồng nhất giá (rate parity)', when: /parity/i },
  { from: /mạng ngoại vi/gi, to: 'extranet', when: /extranet/i },
  { from: /trình duyệt (không có giao diện người dùng|không đầu|không giao diện)/gi, to: 'trình duyệt headless', when: /headless/i },
  { from: /(Phần thưởng|Tiền thưởng)/g, to: 'Điểm cộng', when: /\bbonus\b/i },
  { from: /chú thích/gi, to: 'phụ đề', when: /caption/i },
  { from: /mô hình địa phương/gi, to: 'model chạy local', when: /local models?/i },
  { from: /tác nhân công nhân/gi, to: 'agent worker', when: /worker agents?/i },
  { from: /(các )?đại lý/gi, to: '$1agent', when: /\b(ai|llm|claude|codex|gemini|orchestrat\w*)\b[\s\S]*\bagents?\b|\bagents?\b[\s\S]*\b(ai|llm|claude|codex|gemini)\b/i },
  { from: /gây ảo giác/gi, to: 'bịa ra (hallucinate)', when: /hallucinat/i },
  { from: /vận chuyển stdio/gi, to: 'stdio transport', when: /stdio/i },
  { from: /Tự động hóa giao diện người dùng/g, to: 'UI Automation', when: /ui automation/i },
  { from: /thư viện kho/gi, to: 'kho video stock', when: /stock library/i },
  { from: /Hiển thị (video|các video)/g, to: 'Render $1', when: /\brender/i },
  { from: /Kéo giá/g, to: 'Lấy giá', when: /pulls? rates/i },
  { from: /bộ thử nghiệm/gi, to: 'bộ test tự động', when: /test suite/i },
  { from: /quá yên tĩnh/gi, to: 'quá nhỏ tiếng', when: /too quiet/i },
  { from: /(đã )?nhận được quá nhiều lượt đặt phòng/gi, to: 'bị overbooking (bán trùng phòng)', when: /overbook/i },
  { from: /tỷ giá sai/gi, to: 'giá phòng sai', when: /wrong rate/i },
  { from: /\bagoda\b/g, to: 'Agoda' },
  { from: /\bexpedia\b/g, to: 'Expedia' },
];

export function fixTerms(vi: string, enSource: string): string {
  let out = vi;
  for (const r of GLOSSARY) {
    if (r.when && !r.when.test(enSource)) continue;
    out = out.replace(r.from, r.to);
  }
  return out;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function googleTranslate(text: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(buildGoogleUrl(text));
  if (!res.ok) throw new Error(`Google Dịch lỗi ${res.status}`);
  return parseGoogleResponse(await res.json());
}

/** Translate title + JD paragraph by paragraph (keeps EN↔VI alignment). */
export async function translateJobGoogle(job: Pick<JobInput, 'title' | 'description'>, fetchImpl: typeof fetch = fetch): Promise<JobTranslation> {
  const context = `${job.title}\n${job.description}`;
  const paragraphs = [job.title.trim(), ...splitParagraphs(job.description)].filter(Boolean);
  const translated = await mapLimit(paragraphs, 3, async (p) => {
    const parts = await mapLimit(chunkText(p), 2, (c) => googleTranslate(c, fetchImpl));
    return fixTerms(parts.join(' '), context);
  });
  const [titleVi = '', ...rest] = translated;
  const blocks: TranslatedBlock[] = paragraphs.slice(1).map((en, i) => ({ en, vi: rest[i] ?? '' }));
  return { engine: 'google', titleVi, blocks, createdAt: new Date().toISOString() };
}

export const TRANSLATE_SYSTEM_PROMPT =
  'You are a professional EN→VI translator for Upwork job posts in software, AI automation and media engineering. ' +
  'Translate into natural Vietnamese for a Vietnamese developer. Keep technical terms, product names, numbers, money and code identifiers in English ' +
  '(e.g. pipeline, render, MCP server, rate parity, Remotion, $2,500). Keep the exact paragraph structure: one translated paragraph per source paragraph, ' +
  'separated by a blank line, bullets stay bullets. The FIRST paragraph is the job title. Output only the translation.';

export function buildTranslatePrompt(job: Pick<JobInput, 'title' | 'description'>): string {
  return [job.title.trim(), ...splitParagraphs(job.description)].join('\n\n');
}

/** Align an LLM translation back onto source paragraphs; falls back to one block. */
export function alignTranslation(job: Pick<JobInput, 'title' | 'description'>, vi: string): { titleVi: string; blocks: TranslatedBlock[] } {
  const src = splitParagraphs(job.description);
  const out = splitParagraphs(vi);
  if (out.length === src.length + 1) {
    return { titleVi: out[0], blocks: src.map((en, i) => ({ en, vi: out[i + 1] })) };
  }
  return { titleVi: out[0] ?? '', blocks: [{ en: job.description.trim(), vi: out.slice(1).join('\n\n') || vi.trim() }] };
}

export async function translateJobLlm(cfg: LlmConfig, job: Pick<JobInput, 'title' | 'description'>, fetchImpl: typeof fetch = fetch): Promise<JobTranslation> {
  const vi = await callLlm(cfg, buildTranslatePrompt(job), fetchImpl, TRANSLATE_SYSTEM_PROMPT);
  const { titleVi, blocks } = alignTranslation(job, vi);
  return { engine: 'llm', titleVi, blocks, createdAt: new Date().toISOString() };
}

export function translationToText(t: JobTranslation, bilingual = false): string {
  const body = t.blocks.map((b) => (bilingual ? `${b.en}\n→ ${b.vi}` : b.vi)).join('\n\n');
  return `${t.titleVi}\n\n${body}`;
}

/** Cache key so the same JD is never translated twice. */
export function translationKey(job: Pick<JobInput, 'title' | 'description'>, engine: string): string {
  let h = 2166136261;
  const s = `${engine}|${job.title}|${job.description}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `tr_${(h >>> 0).toString(36)}`;
}

// ═════════════════════════════════════════════════════════════
// 2. Instant offline Vietnamese brief ("tóm ý nhanh")
// ═════════════════════════════════════════════════════════════

export const TERM_VI: Record<string, string> = {
  remotion: 'Remotion (dựng video bằng code React)', ffmpeg: 'FFmpeg (xử lý/encode video)', nvenc: 'GPU NVIDIA NVENC (render nhanh)',
  whisper: 'Whisper (giọng nói → chữ)', captions: 'phụ đề động / karaoke', shortform: 'video dọc TikTok/Reels/Shorts', youtube: 'YouTube',
  videoeditor: 'trình dựng video / timeline', motion: 'motion graphics', loudness: 'chuẩn hóa âm lượng (LUFS)', silence: 'cắt khoảng lặng',
  videoqa: 'đo chất lượng video', canvas: 'preview bằng Canvas/WebCodecs', mcp: 'MCP server (công cụ cho AI)', cdp: 'điều khiển Chrome thật (CDP)',
  playwright: 'tự động hóa trình duyệt', antibot: 'vượt chống bot / Cloudflare', claude: 'Claude AI', openai: 'OpenAI / Codex', gemini: 'Gemini',
  llm: 'tích hợp LLM', multiagent: 'hệ đa tác tử (multi-agent)', langchain: 'RAG / LangChain', ollama: 'LLM chạy local (Ollama)',
  desktop: 'tự động hóa app Windows', n8n: 'workflow n8n / Zapier', qa: 'kiểm thử tự động', telegram: 'bot / cảnh báo Telegram',
  comfyui: 'workflow ComfyUI', stablediffusion: 'tạo ảnh AI (SD / Flux / LoRA)', faceswap: 'hoán đổi khuôn mặt', bgremoval: 'tách nền ảnh',
  tts: 'giọng đọc AI / nhân bản giọng', python: 'Python', gpuserver: 'chạy trên GPU / server riêng', ocr: 'xử lý giấy tờ / OCR',
  vision: 'AI thị giác máy tính', threejs: '3D trên web (Three.js)', blender: 'tự động hóa Blender', glb: 'model 3D GLB/FBX',
  rigging: 'gắn xương & animation', avatar: 'avatar 3D', gamedev: 'game / realtime', reverse: 'dịch ngược phần mềm', electron: 'app desktop Electron',
  channex: 'channel manager (Channex / PMS)', ota: 'các OTA (Booking, Agoda…)', rateparity: 'đồng nhất giá phòng', hotel: 'vận hành khách sạn',
  affiliate: 'affiliate / e-commerce', excel: 'báo cáo Excel/CSV', social: 'mạng xã hội', dashboard: 'dashboard quản trị', react: 'React / TypeScript',
  nodejs: 'Node.js backend', docker: 'Docker / Linux / WSL2', api: 'API / Webhook', database: 'cơ sở dữ liệu', queue: 'hàng đợi xử lý hàng loạt',
  wordpress: 'WordPress (ngoài sở trường)', php: 'PHP (ngoài sở trường)', mobile: 'app mobile native (ngoài sở trường)',
  unity: 'Unity/Unreal (ngoài sở trường)', salesforce: 'ERP/CRM doanh nghiệp (ngoài sở trường)', blockchain: 'blockchain (ngoài sở trường)',
  dataentry: 'nhập liệu / trợ lý ảo (ngoài sở trường)',
};

const VERB_VI: Record<string, string> = {
  build: 'Xây dựng', create: 'Tạo', generate: 'Tạo tự động', develop: 'Phát triển', transcribe: 'Chuyển giọng nói thành chữ', render: 'Render',
  batch: 'Xử lý hàng loạt', export: 'Xuất kết quả', import: 'Nhập', input: 'Đầu vào', pull: 'Lấy dữ liệu', pulls: 'Lấy dữ liệu', check: 'Kiểm tra',
  checks: 'Kiểm tra', flag: 'Đánh dấu / cảnh báo', flags: 'Đánh dấu / cảnh báo', send: 'Gửi', sends: 'Gửi', handle: 'Xử lý', analyze: 'Phân tích',
  write: 'Viết', rebuild: 'Xây dựng lại', automate: 'Tự động hóa', integrate: 'Tích hợp', connect: 'Kết nối', attach: 'Kết nối vào', rig: 'Gắn xương',
  add: 'Thêm', support: 'Hỗ trợ', implement: 'Triển khai', design: 'Thiết kế', fix: 'Sửa lỗi', optimize: 'Tối ưu', deploy: 'Triển khai', scrape: 'Thu thập dữ liệu',
  monitor: 'Giám sát', track: 'Theo dõi', convert: 'Chuyển đổi', sync: 'Đồng bộ', test: 'Kiểm thử', document: 'Viết tài liệu', orchestrator: 'Bộ điều phối',
  shared: 'Trạng thái dùng chung', quality: 'Kiểm soát chất lượng', cost: 'Kiểm soát chi phí', 'real-time': 'Theo dõi thời gian thực', runs: 'Chạy trên',
  run: 'Chạy', must: 'Bắt buộc', 'multi-track': 'Timeline nhiều lớp', text: 'Chữ / overlay', auto: 'Tự động', mcp: 'MCP server',
  simple: 'Giao diện đơn giản', logging: 'Ghi log', natural: 'Chuyển động tự nhiên', clean: 'Code sạch', optional: 'Tùy chọn',
  bonus: 'Điểm cộng', 'server-side': 'Render phía server', 'real': 'Thời gian thực', 'multi-agent': 'Chế độ đa tác tử', 'local': 'Chạy local',
  'docker': 'Docker', 'api': 'API', 'webhook': 'Webhook', 'dashboard': 'Dashboard', 'auto-captions': 'Phụ đề tự động',
};

export function verbVi(line: string): string {
  const first = line.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z-]/g, '') ?? '';
  return VERB_VI[first] ?? 'Yêu cầu';
}

export function glossLine(line: string): ViBriefItem {
  const terms = detectKeywords('', line).map((k) => TERM_VI[k.term.id] ?? k.term.label);
  const vi = `${verbVi(line)}${terms.length ? ` — ${terms.slice(0, 4).join(', ')}` : ''}`;
  return { vi, en: line };
}

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

export function buildViBrief(job: JobInput, analysis: JobAnalysis, win: WinRateResult, matches: ProjectMatch[], bid: BidResult): ViBrief {
  const niche = NICHE_BY_ID[analysis.primaryNiche];
  const c = job.client;
  const budget =
    job.contractType === 'fixed'
      ? `Trọn gói (Fixed-price): ${job.budget > 0 ? fmt(job.budget) : 'khách chưa ghi ngân sách'}`
      : `Theo giờ (Hourly): ${job.hourlyMin || job.hourlyMax ? `$${job.hourlyMin}–$${job.hourlyMax}/giờ` : 'khách chưa ghi mức giá'}`;
  const best = matches[0];
  return {
    headline: `${verbVi(job.title)}: ${truncate(job.title, 90)} — ngách ${niche.emoji} ${niche.nameVi}`,
    sections: [
      {
        id: 'needs',
        title: '📌 Khách cần làm gì',
        items: analysis.deliverables.length ? analysis.deliverables.map(glossLine) : [{ vi: 'JD không liệt kê hạng mục rõ ràng — nên hỏi lại phạm vi.' }],
      },
      {
        id: 'money',
        title: '💵 Hình thức & ngân sách',
        items: [
          { vi: budget },
          { vi: `Đang có ${c.proposals} proposals cạnh tranh` },
          {
            vi: `Gợi ý bid ${bid.selected.labelVi}: ${bid.selected.rate !== undefined ? `$${bid.selected.rate}/giờ` : fmt(bid.selected.gross)} → thực nhận ${fmt(Math.round(bid.selected.net))} (≈ ${bid.selected.netVnd.toLocaleString('vi-VN')} ₫) sau phí 10%`,
          },
          { vi: `Thời gian ước tính: thị trường ~${bid.marketHours} giờ, Dũng ~${bid.dungHours} giờ (~${bid.daysToDeliver} ngày làm việc)` },
        ],
      },
      {
        id: 'client',
        title: '👤 Về khách hàng',
        items: [
          { vi: `Quốc gia: ${c.country || 'chưa rõ'} · ${c.paymentVerified ? 'ĐÃ xác minh thanh toán' : 'CHƯA xác minh thanh toán'}` },
          { vi: `Đã chi trên Upwork: ${c.totalSpent > 0 ? fmt(c.totalSpent) : 'chưa chi đồng nào'} · Tỷ lệ thuê: ${c.hireRate}%${c.rating ? ` · Đánh giá ${c.rating}★` : ''}` },
        ],
      },
      { id: 'pain', title: '🔥 Nỗi đau thật sự của khách', items: analysis.painPoints.map((p) => ({ vi: p.titleVi, en: p.evidence })) },
      {
        id: 'tech',
        title: '🛠️ Công nghệ yêu cầu',
        items: analysis.keywords.map((k) => ({ vi: `${k.term.dungHas ? '✅' : '⛔'} ${TERM_VI[k.term.id] ?? k.term.label}`, en: k.term.label })),
      },
      {
        id: 'warn',
        title: '⚠️ Cảnh báo & bẫy kỹ thuật',
        items: [
          ...analysis.redFlags.map((f) => ({ vi: `🚩 ${f.textVi}` })),
          ...analysis.edgeCases.slice(0, 3).map((e) => ({ vi: `🧨 ${e.noteVi}`, en: e.title })),
        ],
      },
      {
        id: 'verdict',
        title: '✅ Kết luận',
        items: [
          { vi: `Win-Rate ${win.total}% — ${win.verdictVi}` },
          ...(best ? [{ vi: `Vũ khí chốt khách: ${best.project.code} ${best.project.shortName} (khớp ${best.score}%)` }] : []),
        ],
      },
    ].filter((s) => s.items.length),
  };
}

export function briefToText(b: ViBrief): string {
  return [b.headline, ...b.sections.map((s) => `${s.title}\n${s.items.map((i) => `• ${i.vi}`).join('\n')}`)].join('\n\n');
}
