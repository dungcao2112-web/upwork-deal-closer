import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Languages, Loader2, NotebookText, RefreshCw } from 'lucide-react';
import type { JobInput, JobTranslation, LlmConfig, TranslateEngine } from '../types';
import type { FullAnalysis } from '../engine';
import {
  LLM_DEFAULTS,
  briefToText,
  buildViBrief,
  googleTranslateWebUrl,
  translateJobGoogle,
  translateJobLlm,
  translationKey,
  translationToText,
} from '../engine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Card, CopyButton, Segmented, Toggle, useToast } from './ui';

interface Props {
  job: JobInput;
  full: FullAnalysis;
}

const MAX_CACHE = 30;

export function JdTranslator({ job, full }: Props) {
  const { notify } = useToast();
  const [engine, setEngine] = useLocalStorage<TranslateEngine>('udc.translateEngine', 'google');
  const [autoRun, setAutoRun] = useLocalStorage<boolean>('udc.translateAuto', true);
  const [bilingual, setBilingual] = useLocalStorage<boolean>('udc.translateBilingual', true);
  const [cache, setCache] = useLocalStorage<Record<string, JobTranslation>>('udc.translations', {});
  const [llm] = useLocalStorage<LlmConfig>('udc.llm', { provider: 'claude', apiKey: '', model: LLM_DEFAULTS.claude.model, baseUrl: LLM_DEFAULTS.ollama.baseUrl });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inflight = useRef<string | null>(null);

  const brief = useMemo(() => buildViBrief(job, full.analysis, full.win, full.matches, full.bid), [job, full]);
  const key = translationKey(job, engine);
  const tr = cache[key];
  const hasText = job.description.trim().length > 0 || job.title.trim().length > 0;

  const run = useCallback(async () => {
    if (!hasText || inflight.current === key) return;
    inflight.current = key;
    setBusy(true);
    setError('');
    try {
      const t = engine === 'google' ? await translateJobGoogle(job) : await translateJobLlm(llm, job);
      setCache((c) => {
        const entries = Object.entries({ ...c, [key]: t }).sort((a, b) => b[1].createdAt.localeCompare(a[1].createdAt));
        return Object.fromEntries(entries.slice(0, MAX_CACHE));
      });
      notify('🇻🇳 Đã dịch xong JD');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi dịch';
      setError(msg);
      notify(msg, 'err');
    } finally {
      inflight.current = null;
      setBusy(false);
    }
  }, [engine, hasText, job, key, llm, notify, setCache]);

  useEffect(() => {
    if (autoRun && engine === 'google' && !tr && hasText && !busy && !error) void run();
  }, [key, autoRun, engine]);

  useEffect(() => setError(''), [key]);

  const llmReady = llm.provider === 'ollama' || !!llm.apiKey;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-3" data-testid="translate-toolbar">
        <div className="flex items-center gap-2">
          <span className="label !mb-0">Bộ dịch</span>
          <Segmented
            value={engine}
            onChange={setEngine}
            testId="translate-engine"
            options={[
              { id: 'google', label: 'Google Dịch (miễn phí)' },
              { id: 'llm', label: `LLM · ${LLM_DEFAULTS[llm.provider].label}` },
            ]}
          />
        </div>
        <Toggle checked={bilingual} onChange={setBilingual} label="Song ngữ EN ↔ VI" testId="toggle-bilingual" />
        <Toggle checked={autoRun} onChange={setAutoRun} label="Tự dịch khi mở" />
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => void run()} disabled={busy || !hasText || (engine === 'llm' && !llmReady)} data-testid="translate-run">
            {busy ? <Loader2 size={14} className="animate-spin" /> : tr ? <RefreshCw size={14} /> : <Languages size={14} />}
            {tr ? 'Dịch lại' : 'Dịch ngay'}
          </button>
          <a className="btn-ghost" href={googleTranslateWebUrl(`${job.title}\n\n${job.description}`)} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Mở Google Dịch
          </a>
        </div>
        {engine === 'llm' && !llmReady && (
          <p className="w-full text-xs text-amber-300">Chưa có API key — nhập ở Phân hệ “Soạn Proposal” → Optional Live LLM Bridge (hoặc chọn Local Ollama, không cần key).</p>
        )}
        {engine === 'google' && <p className="w-full text-[11px] text-slate-500">Google Dịch miễn phí: nội dung JD (vốn công khai trên Upwork) được gửi tới translate.googleapis.com. Thuật ngữ kỹ thuật bị dịch sai (pipeline, ducking, rate parity…) được tự sửa lại.</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card
          title="Tóm ý nhanh tiếng Việt (offline, tức thì)"
          icon={<NotebookText size={16} className="text-accent" />}
          subtitle="Không cần mạng — rút từ bộ phân tích JD"
          actions={<CopyButton text={briefToText(brief)} size="xs" />}
        >
          <div className="mb-3 rounded-lg border border-accent/30 bg-accent/5 p-2.5">
            <p className="text-sm font-semibold text-accent" data-testid="brief-headline">{brief.headline}</p>
            {tr && <p className="mt-1 text-sm text-slate-200">🇻🇳 {tr.titleVi}</p>}
          </div>
          <div className="space-y-4" data-testid="vi-brief">
            {brief.sections.map((s) => (
              <div key={s.id}>
                <p className="mb-1.5 text-sm font-semibold text-slate-100">{s.title}</p>
                <ul className="space-y-1.5">
                  {s.items.map((i, idx) => (
                    <li key={idx} className="text-[13px] leading-snug text-slate-300">
                      • {i.vi}
                      {i.en && s.id !== 'tech' && <span className="mt-0.5 block pl-3 text-[11px] italic text-slate-500">“{i.en}”</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Bản dịch đầy đủ"
          icon={<Languages size={16} className="text-sky-300" />}
          subtitle={tr ? `${tr.engine === 'google' ? 'Google Dịch + sửa thuật ngữ' : 'LLM'} · ${new Date(tr.createdAt).toLocaleString('vi-VN')} · đã lưu cache` : 'Chưa dịch'}
          actions={tr ? <CopyButton text={translationToText(tr, bilingual)} label={bilingual ? 'Copy song ngữ' : 'Copy bản dịch'} size="xs" /> : undefined}
        >
          {!hasText && <p className="text-sm text-slate-500">Chưa có JD — dán JD ở Phân hệ 1.</p>}
          {busy && !tr && (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Đang dịch…
            </p>
          )}
          {error && !tr && (
            <p className="text-sm text-rose-300">
              ⛔ {error}. Thử bấm “Dịch lại”, chuyển sang LLM, hoặc “Mở Google Dịch”.
            </p>
          )}
          {tr && (
            <div className="space-y-3" data-testid="translation">
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Tiêu đề</p>
                {bilingual && <p className="text-xs text-slate-400">{job.title}</p>}
                <p className="text-base font-semibold text-white" data-testid="title-vi">{tr.titleVi}</p>
              </div>
              {tr.blocks.map((b, i) =>
                bilingual ? (
                  <div key={i} className="grid gap-3 rounded-lg border border-studio-700 bg-studio-850/50 p-3 md:grid-cols-2">
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-400">{b.en}</p>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-100">{b.vi}</p>
                  </div>
                ) : (
                  <p key={i} className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-100">{b.vi}</p>
                ),
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
