import type { LlmConfig, LlmProvider, LlmRequest } from '../types';

/**
 * Optional live LLM bridge. The app NEVER needs this to work —
 * proposals are generated locally. Keys are only kept in the browser.
 */
export const LLM_DEFAULTS: Record<LlmProvider, { model: string; baseUrl?: string; label: string }> = {
  claude: { model: 'claude-sonnet-5-5', label: 'Claude (Anthropic)' },
  openai: { model: 'gpt-4o-mini', label: 'OpenAI' },
  gemini: { model: 'gemini-2.5-flash', label: 'Google Gemini' },
  ollama: { model: 'qwen2.5:14b', baseUrl: 'http://localhost:11434', label: 'Local Ollama' },
};

export const SYSTEM_PROMPT =
  'You rewrite Upwork proposals for Dũng, an AI Automation Architect. Keep every factual claim, project name and metric exactly as given — never invent new numbers, clients or projects. ' +
  'Never open with "Hi, I am", "Dear Hiring Manager" or similar clichés: the first 2 lines must hook the client with proof. Return only the proposal text.';

export function buildRewritePrompt(proposal: string, instruction: string, jobTitle: string): string {
  return `Job title: ${jobTitle}\n\nInstruction: ${instruction || 'Make it sharper and more persuasive while keeping the same length.'}\n\nProposal:\n${proposal}`;
}

export function buildLlmRequest(cfg: LlmConfig, userPrompt: string, system: string = SYSTEM_PROMPT): LlmRequest {
  const model = cfg.model || LLM_DEFAULTS[cfg.provider].model;
  switch (cfg.provider) {
    case 'claude':
      return {
        url: 'https://api.anthropic.com/v1/messages',
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': cfg.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({ model, max_tokens: 4000, system, messages: [{ role: 'user', content: userPrompt }] }),
        },
      };
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        init: {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: userPrompt }] }),
        },
      };
    case 'gemini':
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        init: {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: userPrompt }] }] }),
        },
      };
    case 'ollama': {
      const base = (cfg.baseUrl || LLM_DEFAULTS.ollama.baseUrl || '').replace(/\/$/, '');
      return {
        url: `${base}/api/generate`,
        init: {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model, system, prompt: userPrompt, stream: false }),
        },
      };
    }
  }
}

export function extractLlmText(provider: LlmProvider, data: unknown): string {
  const d = data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (provider) {
    case 'claude':
      return (d.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim();
    case 'openai':
      return String(d.choices?.[0]?.message?.content ?? '').trim();
    case 'gemini':
      return (d.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('').trim();
    case 'ollama':
      return String(d.response ?? '').trim();
  }
}

export async function callLlm(cfg: LlmConfig, userPrompt: string, fetchImpl: typeof fetch = fetch, system: string = SYSTEM_PROMPT): Promise<string> {
  if (cfg.provider !== 'ollama' && !cfg.apiKey) throw new Error('Thiếu API key');
  const req = buildLlmRequest(cfg, userPrompt, system);
  const res = await fetchImpl(req.url, req.init);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`LLM ${cfg.provider} lỗi ${res.status}: ${t.slice(0, 200)}`);
  }
  const text = extractLlmText(cfg.provider, await res.json());
  if (!text) throw new Error('LLM trả về nội dung rỗng');
  return text;
}
