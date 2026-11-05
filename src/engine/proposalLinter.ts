import type { LintIssue, LintResult } from '../types';
import { clamp, wordCount } from './text';

/** Approximate number of characters Upwork shows in the client's proposal list (2 lines). */
export const ABOVE_FOLD_CHARS = 200;

export const BANNED_OPENERS: { re: RegExp; label: string }[] = [
  { re: /^\s*dear (hiring manager|sir|madam|client|team)/i, label: 'Dear Hiring Manager / Dear Sir…' },
  { re: /^\s*(hi|hello|hey)[\s,!]*(there|sir|dear)?[\s,!]*(i am|i'm|my name is)/i, label: 'Hi, I am…' },
  { re: /^\s*(i am|i'm) (an? )?(experienced|senior|professional|skilled|expert|full[- ]stack|passionate)/i, label: 'I am an experienced developer…' },
  { re: /^\s*my name is/i, label: 'My name is…' },
  { re: /^\s*(i have|i've) (read|gone through|reviewed) (your|the) (job|project|description)/i, label: 'I have read your job description…' },
  { re: /^\s*(i am|i'm) (very )?(interested|excited) (in|about)/i, label: 'I am interested in your job…' },
  { re: /^\s*(i can do (this|it)|i am the best|i will do (this|it))/i, label: 'I can do this job…' },
  { re: /^\s*(greetings|good (morning|day|afternoon))/i, label: 'Greetings / Good morning…' },
];

const FILLER = /\b(passionate|hard[- ]?working|dedicated|best quality|100% satisfaction|expert in all|guru|ninja|rockstar)\b/i;
const PROOF = /\b(built|build|run|running|shipped|production|demo|working|live|already|prototype)\b/i;

export function abovePreview(text: string, limit = ABOVE_FOLD_CHARS): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > limit * 0.7 ? lastSpace : limit).trimEnd()}…`;
}

export function findBannedOpener(text: string): string | null {
  for (const b of BANNED_OPENERS) if (b.re.test(text)) return b.label;
  return null;
}

/**
 * Score the hook (what the client sees before clicking).
 * @param clientTerms lowercase tech/pain words from the JD
 */
export function lintProposal(text: string, clientTerms: string[] = []): LintResult {
  const preview = abovePreview(text);
  const lower = preview.toLowerCase();
  const issues: LintIssue[] = [];
  let score = 25;

  const banned = findBannedOpener(text);
  if (banned) {
    score -= 45;
    issues.push({ id: 'banned-opener', severity: 'error', messageVi: `Mở đầu sáo rỗng "${banned}" — khách lướt qua ngay. Hãy mở bằng kết quả/demo cụ thể.` });
  } else if (/^\s*(hi|hello|hey|dear)\b/i.test(text)) {
    score -= 10;
    issues.push({ id: 'greeting', severity: 'warning', messageVi: 'Lời chào chiếm chỗ vàng trong 2 dòng preview — nên đưa hook lên đầu.' });
  }

  if (/\d/.test(preview)) score += 15;
  else issues.push({ id: 'no-number', severity: 'warning', messageVi: 'Preview chưa có con số đo được (VD: 6.4x, 82/82 tests, -14 LUFS).' });

  const termsHit = clientTerms.filter((t) => t && lower.includes(t.toLowerCase()));
  if (termsHit.length >= 2) score += 25;
  else if (termsHit.length === 1) score += 15;
  else issues.push({ id: 'no-client-terms', severity: 'warning', messageVi: 'Preview chưa nhắc công nghệ/vấn đề khách nêu trong JD — giảm độ liên quan.' });

  if (PROOF.test(preview)) score += 15;
  else issues.push({ id: 'no-proof', severity: 'warning', messageVi: 'Thiếu tín hiệu "đã làm thật" (built / running in production / demo).' });

  if (/\b(you|your)\b/i.test(preview)) score += 10;
  else issues.push({ id: 'no-you', severity: 'info', messageVi: 'Nên hướng về khách ("you/your") thay vì nói về bản thân.' });

  const firstSentence = preview.split(/(?<=[.!?—])\s/)[0] ?? preview;
  if (wordCount(firstSentence) <= 32) score += 10;
  else issues.push({ id: 'long-first', severity: 'info', messageVi: 'Câu đầu quá dài — cắt gọn dưới 30 từ.' });

  const iCount = (preview.match(/\bI\b/g) ?? []).length;
  if (iCount > 3) {
    score -= 10;
    issues.push({ id: 'too-many-i', severity: 'warning', messageVi: `Dùng "I" ${iCount} lần trong preview — quá tập trung vào bản thân.` });
  }
  if (FILLER.test(text)) {
    score -= 10;
    issues.push({ id: 'filler', severity: 'warning', messageVi: 'Có từ sáo rỗng (passionate / hard-working / 100% satisfaction…).' });
  }

  score = clamp(Math.round(score), 0, 100);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  return { preview, hookScore: score, grade, issues };
}
