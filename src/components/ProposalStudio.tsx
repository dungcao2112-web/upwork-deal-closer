import { useState } from 'react';
import { Bot, Columns3, Eye, FileText, GitBranch, Loader2, RotateCcw, Wand2 } from 'lucide-react';
import type { ArchitectureDiagram, LlmConfig, LlmProvider, Proposal, ProposalAngleId, ProposalOptions } from '../types';
import { LLM_DEFAULTS, buildRewritePrompt, callLlm, lintProposal, wordCount } from '../engine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Card, CopyButton, Pre, Segmented, Toggle, useToast } from './ui';

interface Props {
  proposals: Proposal[];
  options: ProposalOptions;
  setOptions: (o: ProposalOptions) => void;
  edits: Partial<Record<ProposalAngleId, string>>;
  setEdit: (angle: ProposalAngleId, text: string | undefined) => void;
  activeAngle: ProposalAngleId;
  setActiveAngle: (a: ProposalAngleId) => void;
  diagram: ArchitectureDiagram;
  jobTitle: string;
  clientTerms: string[];
}

const GRADE_STYLE: Record<string, string> = {
  A: 'text-accent border-accent/50 bg-accent/10',
  B: 'text-sky-300 border-sky-500/50 bg-sky-500/10',
  C: 'text-amber-300 border-amber-500/50 bg-amber-500/10',
  D: 'text-orange-300 border-orange-500/50 bg-orange-500/10',
  F: 'text-rose-300 border-rose-500/50 bg-rose-500/10',
};

function AboveFold({ preview, grade, score }: { preview: string; grade: string; score: number }) {
  return (
    <div className="rounded-lg border border-studio-600 bg-white p-3 text-slate-800" data-testid="above-fold">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">D</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-700">Dũng C. <span className="text-xs font-normal text-slate-500">· AI Automation Architect</span></p>
          <p className="text-[11px] text-slate-500">Vietnam · Proposal preview</p>
        </div>
        <span className={`chip border font-bold ${GRADE_STYLE[grade]}`} title="Hook score">
          {grade} · {score}
        </span>
      </div>
      <p className="line-clamp-2 text-[13px] leading-snug">{preview}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Mô phỏng 2 dòng khách thấy trong danh sách ứng viên Upwork</p>
    </div>
  );
}

export function ProposalStudio(p: Props) {
  const [mode, setMode] = useState<'focus' | 'compare'>('focus');
  const { options: o, setOptions } = p;
  const set = (patch: Partial<ProposalOptions>) => setOptions({ ...o, ...patch });

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-3" data-testid="proposal-toolbar">
        <div className="flex items-center gap-2">
          <span className="label !mb-0">Giọng điệu</span>
          <Segmented
            value={o.tone}
            onChange={(tone) => set({ tone })}
            testId="tone-switch"
            options={[
              { id: 'punchy', label: 'Punchy & Concise' },
              { id: 'technical', label: 'Deep Technical' },
              { id: 'executive', label: 'Executive Consultant' },
            ]}
          />
        </div>
        <Toggle checked={o.includeQuestions} onChange={(v) => set({ includeQuestions: v })} label="3 câu hỏi chốt" testId="toggle-questions" />
        <Toggle checked={o.includeDiagram} onChange={(v) => set({ includeDiagram: v })} label="Sơ đồ kiến trúc" testId="toggle-diagram" />
        {o.includeDiagram && (
          <Segmented
            value={o.diagramFormat}
            onChange={(diagramFormat) => set({ diagramFormat })}
            options={[
              { id: 'ascii', label: 'ASCII' },
              { id: 'mermaid', label: 'Mermaid' },
            ]}
          />
        )}
        <input className="input !w-40 !py-1 text-xs" placeholder="Tên khách (tùy chọn)" value={o.clientName ?? ''} onChange={(e) => set({ clientName: e.target.value || undefined })} />
        <div className="ml-auto">
          <Segmented
            value={mode}
            onChange={setMode}
            testId="proposal-mode"
            options={[
              { id: 'focus', label: <span className="inline-flex items-center gap-1"><FileText size={12} /> Từng bản</span> },
              { id: 'compare', label: <span className="inline-flex items-center gap-1"><Columns3 size={12} /> So sánh 3 bản</span> },
            ]}
          />
        </div>
      </div>

      {mode === 'focus' ? <Focus {...p} /> : <Compare {...p} />}

      <div className="grid gap-4">
        <Card
          title={`Sơ đồ Kiến trúc Giải pháp — ${p.diagram.title}`}
          icon={<GitBranch size={16} className="text-sky-400" />}
          subtitle="Tự sinh theo luồng dữ liệu của Job — dán thẳng vào chat Upwork"
          actions={
            <>
              <CopyButton text={p.diagram.ascii} label="ASCII" size="xs" />
              <CopyButton text={p.diagram.mermaid} label="Mermaid" size="xs" />
            </>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Pre className="max-h-[480px]">{p.diagram.ascii}</Pre>
            <div>
              <p className="label">Mermaid</p>
              <Pre className="max-h-[200px]">{p.diagram.mermaid}</Pre>
              <p className="label mt-3">Luồng xử lý</p>
              <ol className="space-y-1 text-xs text-slate-300" data-testid="architecture-stages">
                {p.diagram.stages.map((s, i) => (
                  <li key={s.id}>
                    <b className="text-sky-300">{i + 1}. {s.label}</b> — <span className="text-slate-400">{s.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>
        <LlmBridge {...p} />
      </div>
    </div>
  );
}

function currentText(p: Props, pr: Proposal): string {
  return p.edits[pr.angle] ?? pr.text;
}

function Focus(p: Props) {
  const pr = p.proposals.find((x) => x.angle === p.activeAngle) ?? p.proposals[0];
  const text = currentText(p, pr);
  const edited = p.edits[pr.angle] !== undefined;
  const lint = edited ? lintProposal(text, p.clientTerms) : pr.lint;
  const [min, max] = pr.targetWords;
  const inRange = pr.bodyWordCount >= min && pr.bodyWordCount <= max;
  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-3" data-testid="angle-tabs">
        {p.proposals.map((x) => (
          <button
            key={x.angle}
            type="button"
            onClick={() => p.setActiveAngle(x.angle)}
            className={`rounded-xl border p-3 text-left transition ${p.activeAngle === x.angle ? 'border-accent/60 bg-accent/10' : 'border-studio-700 bg-studio-900 hover:border-studio-500'}`}
          >
            <p className="text-sm font-semibold text-slate-100">
              {x.emoji} {x.title}
            </p>
            <p className="text-xs text-slate-400">{x.titleVi} · {x.bodyWordCount} từ · Hook {x.lint.grade}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <Card
          title={`${pr.emoji} ${pr.title}`}
          subtitle={
            <span>
              Thân thư: <b className={inRange ? 'text-accent' : 'text-amber-300'}>{pr.bodyWordCount} từ</b> (mục tiêu {min}–{max}) · Toàn bộ: {wordCount(text)} từ
              {edited && <span className="ml-2 text-amber-300">· đã chỉnh tay</span>}
            </span>
          }
          actions={
            <>
              {edited && (
                <button type="button" className="btn-ghost btn-xs" onClick={() => p.setEdit(pr.angle, undefined)}>
                  <RotateCcw size={13} /> Bản gốc
                </button>
              )}
              <CopyButton text={text} label="Copy Proposal" />
            </>
          }
        >
          <textarea
            className="input min-h-[460px] text-[13px] leading-relaxed"
            value={text}
            onChange={(e) => p.setEdit(pr.angle, e.target.value)}
            data-testid="proposal-text"
          />
        </Card>
        <div className="space-y-4">
          <Card title="Upwork Above-the-Fold Preview & Linter" icon={<Eye size={16} className="text-accent" />}>
            <AboveFold preview={lint.preview} grade={lint.grade} score={lint.hookScore} />
            <ul className="mt-3 space-y-1.5" data-testid="lint-issues">
              {lint.issues.length === 0 && <li className="text-sm text-accent">✅ Hook hoàn hảo — không có cảnh báo.</li>}
              {lint.issues.map((i) => (
                <li key={i.id} className={`text-xs ${i.severity === 'error' ? 'font-semibold text-rose-300' : i.severity === 'warning' ? 'text-amber-200' : 'text-slate-400'}`}>
                  {i.severity === 'error' ? '⛔' : i.severity === 'warning' ? '⚠️' : 'ℹ️'} {i.messageVi}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="🇻🇳 Ghi chú chiến thuật" subtitle={pr.titleVi}>
            <ul className="space-y-1.5 text-sm text-slate-300" data-testid="strategy-notes">
              {pr.strategyVi.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg border border-studio-700 bg-studio-850 p-2.5 text-xs text-slate-400">
              <b className="text-slate-300">Tóm tắt:</b> {pr.summaryVi}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Compare(p: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-3" data-testid="compare-view">
      {p.proposals.map((pr) => {
        const text = currentText(p, pr);
        return (
          <Card
            key={pr.angle}
            title={`${pr.emoji} ${pr.title}`}
            subtitle={`${pr.titleVi} · ${pr.bodyWordCount} từ`}
            actions={
              <>
                <button type="button" className={`btn-xs btn ${p.activeAngle === pr.angle ? 'bg-accent/20 text-accent' : 'btn-ghost'}`} onClick={() => p.setActiveAngle(pr.angle)}>
                  {p.activeAngle === pr.angle ? '★ Đã chọn' : 'Chọn bản này'}
                </button>
                <CopyButton text={text} size="xs" />
              </>
            }
          >
            <AboveFold preview={pr.lint.preview} grade={pr.lint.grade} score={pr.lint.hookScore} />
            <div className="mt-3 max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-studio-700 bg-studio-950 p-3 text-[12.5px] leading-relaxed text-slate-200">{text}</div>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              {pr.strategyVi.slice(0, 3).map((s) => (
                <li key={s}>🇻🇳 {s}</li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function LlmBridge(p: Props) {
  const { notify } = useToast();
  const [cfg, setCfg] = useLocalStorage<LlmConfig>('udc.llm', { provider: 'claude', apiKey: '', model: LLM_DEFAULTS.claude.model, baseUrl: LLM_DEFAULTS.ollama.baseUrl });
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const pr = p.proposals.find((x) => x.angle === p.activeAngle) ?? p.proposals[0];

  const run = async () => {
    setBusy(true);
    setResult('');
    try {
      const out = await callLlm(cfg, buildRewritePrompt(currentText(p, pr), instruction, p.jobTitle));
      setResult(out);
      notify('🤖 LLM đã viết lại xong');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Lỗi LLM', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Optional Live LLM Bridge" icon={<Bot size={16} className="text-violet-300" />} subtitle="Không bắt buộc — 3 bản Proposal ở trên đã sinh cục bộ, không cần API key">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nhà cung cấp</label>
          <select
            className="input"
            value={cfg.provider}
            onChange={(e) => {
              const provider = e.target.value as LlmProvider;
              setCfg({ ...cfg, provider, model: LLM_DEFAULTS[provider].model });
            }}
          >
            {(Object.keys(LLM_DEFAULTS) as LlmProvider[]).map((k) => (
              <option key={k} value={k}>{LLM_DEFAULTS[k].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Model</label>
          <input className="input" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} />
        </div>
        {cfg.provider === 'ollama' ? (
          <div className="sm:col-span-2">
            <label className="label">Ollama URL</label>
            <input className="input" value={cfg.baseUrl ?? ''} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="label">API Key (chỉ lưu trong trình duyệt của anh)</label>
            <input className="input mono" type="password" value={cfg.apiKey} placeholder="sk-…" onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Yêu cầu đặc biệt cho bản “{pr.title}”</label>
          <input className="input" value={instruction} placeholder="VD: thêm 1 câu về kinh nghiệm Booking.com, giữ dưới 160 từ" onChange={(e) => setInstruction(e.target.value)} />
        </div>
      </div>
      <button type="button" className="btn-primary mt-3" disabled={busy} onClick={run}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Viết lại bằng LLM
      </button>
      {result && (
        <div className="mt-3 space-y-2">
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-violet-500/30 bg-studio-950 p-3 text-[12.5px] text-slate-200">{result}</div>
          <div className="flex gap-2">
            <CopyButton text={result} size="xs" />
            <button type="button" className="btn-ghost btn-xs" onClick={() => { p.setEdit(pr.angle, result); notify('Đã áp dụng vào Proposal'); }}>
              Áp dụng vào bản này
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
