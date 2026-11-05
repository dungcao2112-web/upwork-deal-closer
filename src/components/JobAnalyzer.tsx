import { AlertTriangle, Bug, CheckCircle2, ClipboardPaste, Flame, Layers, ShieldAlert, Sparkles, Target } from 'lucide-react';
import type { JobInput } from '../types';
import type { FullAnalysis } from '../engine';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { NICHE_BY_ID } from '../data/niches';
import { Card, Gauge, ProgressBar, scoreColor } from './ui';

interface Props {
  job: JobInput;
  setJob: (j: JobInput) => void;
  full: FullAnalysis;
  goTo: (tab: string) => void;
}

const VERDICT_STYLE: Record<string, string> = {
  'MUST-BID': 'bg-accent/15 text-accent border-accent/40',
  STRONG: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  CONSIDER: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  SKIP: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

export function JobAnalyzer({ job, setJob, full, goTo }: Props) {
  const { analysis, win, matches } = full;
  const upd = (patch: Partial<JobInput>) => setJob({ ...job, ...patch, id: undefined });
  const updClient = (patch: Partial<JobInput['client']>) => upd({ client: { ...job.client, ...patch } });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ── LEFT: input ─────────────────────────────── */}
      <div className="space-y-4">
        <Card title="Kho 8 Job Upwork mẫu (Quick-Load)" icon={<Sparkles size={16} className="text-accent" />}>
          <div className="grid gap-1.5 sm:grid-cols-2" data-testid="sample-jobs">
            {SAMPLE_JOBS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setJob({ ...s })}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                  job.id === s.id ? 'border-accent/60 bg-accent/10 text-accent' : 'border-studio-700 bg-studio-850 text-slate-300 hover:border-studio-500'
                }`}
              >
                <span className="mr-1">{NICHE_BY_ID[s.niche].emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Dán Job Description"
          icon={<ClipboardPaste size={16} className="text-accent" />}
          actions={
            <>
            <button type="button" className="btn-ghost btn-xs" onClick={() => goTo('translate')} data-testid="goto-translate">
              🇻🇳 Dịch JD
            </button>
            <button
              type="button"
              className="btn-ghost btn-xs"
              onClick={() =>
                setJob({ title: '', description: '', contractType: 'fixed', budget: 0, hourlyMin: 0, hourlyMax: 0, client: { country: '', paymentVerified: true, totalSpent: 0, hireRate: 0, proposals: 0 } })
              }
            >
              Xóa form
            </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="job-title">Tiêu đề Job</label>
              <input id="job-title" data-testid="job-title" className="input" value={job.title} placeholder="VD: Build Remotion video pipeline…" onChange={(e) => upd({ title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="job-desc">Toàn văn mô tả (JD)</label>
              <textarea
                id="job-desc"
                data-testid="job-description"
                className="input mono min-h-[220px] text-xs leading-relaxed"
                value={job.description}
                placeholder="Dán toàn bộ JD từ Upwork vào đây…"
                onChange={(e) => upd({ description: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-slate-500">{analysis.wordCount} từ · phân tích tức thì (0ms, không cần API)</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className="label">Loại hợp đồng</label>
                <div className="flex gap-1">
                  {(['fixed', 'hourly'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => upd({ contractType: t })} className={`btn btn-xs flex-1 border ${job.contractType === t ? 'border-accent bg-accent/15 text-accent' : 'border-studio-600 bg-studio-850 text-slate-300'}`}>
                      {t === 'fixed' ? 'Fixed-Price' : 'Hourly'}
                    </button>
                  ))}
                </div>
              </div>
              {job.contractType === 'fixed' ? (
                <div className="col-span-2">
                  <label className="label">Ngân sách ($)</label>
                  <input type="number" min={0} data-testid="job-budget" className="input" value={job.budget} onChange={(e) => upd({ budget: Number(e.target.value) })} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">$/h min</label>
                    <input type="number" min={0} className="input" value={job.hourlyMin} onChange={(e) => upd({ hourlyMin: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label">$/h max</label>
                    <input type="number" min={0} className="input" value={job.hourlyMax} onChange={(e) => upd({ hourlyMax: Number(e.target.value) })} />
                  </div>
                </>
              )}
            </div>
            <div className="rounded-lg border border-studio-700 bg-studio-850/60 p-3">
              <p className="label">Thông tin khách hàng</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Quốc gia</label>
                  <input className="input" value={job.client.country} onChange={(e) => updClient({ country: e.target.value })} />
                </div>
                <div>
                  <label className="label">Tổng chi ($)</label>
                  <input type="number" min={0} className="input" value={job.client.totalSpent} onChange={(e) => updClient({ totalSpent: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Hire rate (%)</label>
                  <input type="number" min={0} max={100} className="input" value={job.client.hireRate} onChange={(e) => updClient({ hireRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Số proposals</label>
                  <input type="number" min={0} data-testid="job-proposals" className="input" value={job.client.proposals} onChange={(e) => updClient({ proposals: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Rating ★</label>
                  <input type="number" min={0} max={5} step={0.1} className="input" value={job.client.rating ?? 0} onChange={(e) => updClient({ rating: Number(e.target.value) })} />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
                    <input type="checkbox" data-testid="payment-verified" className="h-4 w-4 accent-[#14e0b0]" checked={job.client.paymentVerified} onChange={(e) => updClient({ paymentVerified: e.target.checked })} />
                    Payment Verified
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── RIGHT: results ──────────────────────────── */}
      <div className="space-y-4">
        <Card title="Win-Rate Scorer — 5 chỉ số" icon={<Target size={16} className="text-accent" />} subtitle={`Ngách chính: ${NICHE_BY_ID[analysis.primaryNiche].emoji} ${NICHE_BY_ID[analysis.primaryNiche].name}`}>
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex flex-col items-center gap-2">
              <Gauge value={win.total} label="Win-Rate" />
              <span className={`chip border font-semibold ${VERDICT_STYLE[win.verdict]}`} data-testid="verdict">
                {win.verdict}
              </span>
              <p className="max-w-[200px] text-center text-xs text-slate-400">{win.verdictVi}</p>
            </div>
            <div className="flex-1 space-y-3" data-testid="score-dimensions">
              {win.dimensions.map((d) => (
                <div key={d.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {d.label} <span className="text-xs font-normal text-slate-500">· {d.labelVi} · {Math.round(d.weight * 100)}%</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: scoreColor(d.score) }}>
                      {d.score}
                    </span>
                  </div>
                  <ProgressBar value={d.score} />
                  <p className="mt-1 text-[11.5px] leading-snug text-slate-400">{d.explanationVi}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-studio-700/70 pt-3">
            <span className="text-xs text-slate-400">Vũ khí chốt khách:</span>
            {matches.slice(0, 3).map((m) => (
              <span key={m.project.id} className="chip border-studio-600 bg-studio-850 text-slate-200">
                {m.project.code} {m.project.shortName} <b style={{ color: scoreColor(m.score) }}>{m.score}%</b>
              </span>
            ))}
            <button type="button" className="btn-primary btn-xs ml-auto" onClick={() => goTo('proposal')}>
              ✍️ Soạn Proposal ngay →
            </button>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Client's Core Pain Points" icon={<Flame size={16} className="text-orange-400" />}>
            <ul className="space-y-2.5" data-testid="pain-points">
              {analysis.painPoints.map((p) => (
                <li key={p.id} className="rounded-lg border border-studio-700 bg-studio-850/60 p-2.5">
                  <p className="text-sm font-medium text-slate-100">{p.titleVi}</p>
                  <p className="text-xs text-slate-400">{p.titleEn}</p>
                  <p className="mt-1 border-l-2 border-orange-400/60 pl-2 text-[11.5px] italic text-slate-400">“{p.evidence}”</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Detected Tech & Implied Stack" icon={<Layers size={16} className="text-sky-400" />}>
            <p className="label">Khách nêu trong JD ({analysis.keywords.length})</p>
            <div className="mb-3 flex flex-wrap gap-1.5" data-testid="keywords">
              {analysis.keywords.map((k) => (
                <span
                  key={k.term.id}
                  className={`chip ${k.term.dungHas ? 'border-accent/30 bg-accent/10 text-accent' : 'border-rose-500/40 bg-rose-500/10 text-rose-300'}`}
                  title={`Độ khó ${k.term.difficulty}/5 · xuất hiện ${k.count} lần${k.inTitle ? ' · có trong tiêu đề' : ''}`}
                >
                  {k.term.dungHas ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  {k.term.label}
                  {k.inTitle && <span className="text-[9px] opacity-70">TITLE</span>}
                </span>
              ))}
              {!analysis.keywords.length && <span className="text-xs text-slate-500">Chưa phát hiện công nghệ — dán JD đầy đủ hơn.</span>}
            </div>
            <p className="label">Công nghệ ngầm cần dùng</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {analysis.impliedStack.map((t) => (
                <span key={t.id} className="chip border-sky-500/30 bg-sky-500/10 text-sky-300">+ {t.label}</span>
              ))}
              {!analysis.impliedStack.length && <span className="text-xs text-slate-500">—</span>}
            </div>
            <p className="label">Phân bổ ngách</p>
            <div className="space-y-1.5">
              {Object.entries(analysis.nicheScores)
                .sort((a, b) => b[1] - a[1])
                .map(([n, v]) => (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-28 shrink-0 truncate text-slate-400">{NICHE_BY_ID[n as keyof typeof NICHE_BY_ID].emoji} {NICHE_BY_ID[n as keyof typeof NICHE_BY_ID].nameVi.split(' ')[0]} {n}</span>
                    <ProgressBar value={v} color="#38bdf8" />
                    <span className="w-9 text-right tabular-nums text-slate-300">{v}%</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <Card title="Hidden Edge Cases / Technical Traps — vũ khí hạ gục" icon={<Bug size={16} className="text-fuchsia-400" />} subtitle="Bẫy thực tế chỉ người đã làm mới biết → đưa vào Proposal Angle 2">
          <div className="grid gap-2.5 md:grid-cols-2" data-testid="edge-cases">
            {analysis.edgeCases.map((e) => (
              <div key={e.id} className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
                <p className="text-sm font-semibold text-fuchsia-200">{e.title}</p>
                <p className="mt-1 text-xs text-slate-300"><b className="text-rose-300">Trap:</b> {e.trapEn}</p>
                <p className="mt-1 text-xs text-slate-300"><b className="text-accent">Fix:</b> {e.fixEn}</p>
                <p className="mt-1.5 text-[11px] text-slate-500">🇻🇳 {e.noteVi}</p>
              </div>
            ))}
            {!analysis.edgeCases.length && <p className="text-sm text-slate-500">Chưa phát hiện bẫy kỹ thuật đặc thù.</p>}
          </div>
        </Card>

        <Card title="Red Flags & Green Flags" icon={<ShieldAlert size={16} className="text-amber-400" />}>
          <div className="grid gap-3 md:grid-cols-2">
            <ul className="space-y-1.5" data-testid="red-flags">
              {analysis.redFlags.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.severity === 'high' ? 'bg-rose-500' : f.severity === 'medium' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                  <span className="text-rose-200">{f.textVi}</span>
                </li>
              ))}
              {!analysis.redFlags.length && <li className="text-sm text-slate-500">✅ Không có red flag.</li>}
            </ul>
            <ul className="space-y-1.5">
              {analysis.greenFlags.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm text-emerald-200">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" /> {f.textVi}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
