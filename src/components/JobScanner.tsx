import { useMemo } from 'react';
import { ClipboardPaste, ExternalLink, Info, Satellite, Save, ScanSearch, ShieldCheck, Trash2, X } from 'lucide-react';
import type { Deal, JobInput, PortfolioProject, ScanResult } from '../types';
import { NICHES, NICHE_BY_ID } from '../data/niches';
import { SAMPLE_SCAN_PASTE } from '../data/sampleScan';
import {
  analyzeJob,
  buildContext,
  buildUpworkSearchUrl,
  createDeal,
  defaultBooleanOptions,
  generateProposal,
  scanJobs,
} from '../engine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Card, Toggle, scoreColor, useToast } from './ui';

interface Props {
  projects: PortfolioProject[];
  deals: Deal[];
  setDeals: (d: Deal[]) => void;
  onAnalyze: (job: JobInput) => void;
}

const VERDICT_STYLE: Record<string, string> = {
  'MUST-BID': 'bg-accent/15 text-accent border-accent/40',
  STRONG: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  CONSIDER: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  SKIP: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

const MISSING_VI: Record<string, string> = {
  budget: 'ngân sách',
  'hourly rate': 'giá/giờ',
  payment: 'xác minh thanh toán',
  spent: 'tổng chi',
  proposals: 'số proposals',
  'hire rate': 'hire rate',
  country: 'quốc gia',
};

export function JobScanner({ projects, deals, setDeals, onAnalyze }: Props) {
  const { notify } = useToast();
  const [text, setText] = useLocalStorage<string>('udc.scanText', '');
  const [submitted, setSubmitted] = useLocalStorage<string>('udc.scanSubmitted', '');
  const [skipped, setSkipped] = useLocalStorage<string[]>('udc.scanSkipped', []);
  const [minWin, setMinWin] = useLocalStorage<number>('udc.scanMinWin', 0);
  const [hideSkip, setHideSkip] = useLocalStorage<boolean>('udc.scanHideSkip', false);
  const [hideDup, setHideDup] = useLocalStorage<boolean>('udc.scanHideDup', false);
  const [verifiedOnly, setVerifiedOnly] = useLocalStorage<boolean>('udc.scanVerifiedOnly', false);
  const { results, error } = useMemo<{ results: ScanResult[]; error: string }>(() => {
    try {
      return { results: scanJobs(submitted, projects, deals), error: '' };
    } catch (e) {
      return { results: [], error: e instanceof Error ? e.message : 'Không đọc được dữ liệu' };
    }
  }, [submitted, projects, deals]);

  const visible = results.filter(
    (r) =>
      !skipped.includes(r.scanned.id) &&
      r.winRate >= minWin &&
      (!hideSkip || r.verdict !== 'SKIP') &&
      (!hideDup || !r.duplicateOf) &&
      (!verifiedOnly || r.scanned.job.client.paymentVerified),
  );
  const count = (v: string) => results.filter((r) => r.verdict === v).length;

  const scan = (t = text) => {
    setSubmitted(t);
    let n = 0;
    try {
      n = scanJobs(t, projects, deals).length;
    } catch {
      /* error shown below the input */
    }
    notify(n ? `🛰️ Đã quét ${n} job` : 'Không tìm thấy job nào — kiểm tra lại nội dung dán', n ? 'ok' : 'err');
  };

  const saveDeal = (r: ScanResult) => {
    const job = r.scanned.job;
    const full = analyzeJob(job, projects);
    const ctx = buildContext(job, full.analysis, full.win, full.matches, full.defaultProjectIds, full.bid);
    const pr = generateProposal('prototype', ctx);
    const deal = createDeal({
      title: job.title,
      niche: full.analysis.primaryNiche,
      contractType: job.contractType,
      clientCountry: job.client.country,
      winRate: full.win.total,
      projectIds: ctx.projects.map((p) => p.id),
      proposalAngle: 'prototype',
      proposalText: pr.text,
      bidAmount: full.bid.selected.gross,
      milestones: full.bid.milestones,
      connects: 0,
      notes: `Từ Máy quét Job · ${r.scanned.postedText ?? ''} · Verdict ${full.win.verdict}`,
      jobDescription: job.description,
    });
    setDeals([deal, ...deals]);
    notify(`💾 Đã lưu "${job.title.slice(0, 40)}" vào CRM`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card title="Máy quét Job hàng loạt" icon={<Satellite size={16} className="text-accent" />} subtitle="Dán 1 lần — chấm điểm & xếp hạng toàn bộ job trong 0ms">
          <ol className="mb-3 space-y-1 text-xs text-slate-400">
            <li><b className="text-slate-200">1.</b> Mở trang tìm kiếm Upwork của ngách (link bên dưới) → đăng nhập bình thường.</li>
            <li><b className="text-slate-200">2.</b> Nhấn <span className="mono rounded bg-studio-800 px-1">Ctrl+A</span> rồi <span className="mono rounded bg-studio-800 px-1">Ctrl+C</span> trên trang kết quả (hoặc copy email Job Alert).</li>
            <li><b className="text-slate-200">3.</b> Dán vào đây → <b className="text-accent">Quét & chấm điểm</b>. Có thể dán nhiều JD, mỗi JD cách nhau bằng dòng <span className="mono">---</span>, hoặc mảng JSON.</li>
          </ol>
          <textarea
            className="input mono min-h-[260px] text-xs"
            placeholder="Dán nội dung trang kết quả tìm kiếm Upwork vào đây…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid="scan-input"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => scan()} disabled={!text.trim()} data-testid="scan-run">
              <ScanSearch size={14} /> Quét & chấm điểm
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setText(SAMPLE_SCAN_PASTE);
                scan(SAMPLE_SCAN_PASTE);
              }}
              data-testid="scan-sample"
            >
              <ClipboardPaste size={14} /> Dán dữ liệu mẫu
            </button>
            <button type="button" className="btn-ghost" onClick={() => { setText(''); setSubmitted(''); }}>
              <Trash2 size={14} /> Xóa
            </button>
            {skipped.length > 0 && (
              <button type="button" className="btn-ghost" onClick={() => setSkipped([])}>
                Hiện lại {skipped.length} job đã bỏ qua
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-rose-300">⛔ {error}</p>}

          <p className="label mt-4">Mở nhanh trang tìm kiếm 5 ngách (đã gắn Boolean + lọc Payment Verified)</p>
          <div className="flex flex-wrap gap-1.5" data-testid="niche-search-links">
            {NICHES.map((n) => (
              <a key={n.id} className="btn-ghost btn-xs" href={buildUpworkSearchUrl(defaultBooleanOptions(n))} target="_blank" rel="noreferrer">
                {n.emoji} {n.nameVi.split(' & ')[0]} <ExternalLink size={11} />
              </a>
            ))}
          </div>
          <div className="mt-4 flex gap-2 rounded-lg border border-studio-700 bg-studio-850/60 p-3 text-[11.5px] leading-relaxed text-slate-400">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
            <p>
              An toàn tài khoản: ứng dụng <b className="text-slate-200">không tự truy cập Upwork</b>. Upwork đã tắt RSS từ 20/08/2024 và cấm bot cào dữ liệu — mọi dữ liệu do anh tự mở &amp; copy như người dùng bình thường. Muốn quét hoàn toàn tự động cần API chính thức của Upwork (xin key).
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" data-testid="scan-summary">
            <Mini label="Đã quét" value={results.length} />
            <Mini label="MUST-BID" value={count('MUST-BID')} color="#14e0b0" />
            <Mini label="STRONG" value={count('STRONG')} color="#38bdf8" />
            <Mini label="CONSIDER" value={count('CONSIDER')} color="#fbbf24" />
            <Mini label="SKIP" value={count('SKIP')} color="#f87171" />
          </div>
          <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Win-Rate tối thiểu
              <input type="range" min={0} max={90} step={5} value={minWin} onChange={(e) => setMinWin(Number(e.target.value))} className="accent-[#14e0b0]" data-testid="scan-min-win" />
              <b className="w-10 tabular-nums text-accent">{minWin}%</b>
            </label>
            <Toggle checked={hideSkip} onChange={setHideSkip} label="Ẩn SKIP" testId="scan-hide-skip" />
            <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label="Chỉ Payment Verified" />
            <Toggle checked={hideDup} onChange={setHideDup} label="Ẩn job đã có trong CRM" />
          </div>

          <Card title={`Bảng xếp hạng (${visible.length}/${results.length})`} icon={<ScanSearch size={16} className="text-accent" />} subtitle="Xếp theo Win-Rate — job tốt nhất ở trên cùng">
            {!results.length ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu. Dán trang kết quả Upwork hoặc bấm “Dán dữ liệu mẫu”.</p>
            ) : (
              <ul className="space-y-2" data-testid="scan-results">
                {visible.map((r, i) => {
                  const j = r.scanned.job;
                  const c = j.client;
                  return (
                    <li key={r.scanned.id} className="rounded-lg border border-studio-700 bg-studio-850/60 p-3" data-testid="scan-row">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex w-14 shrink-0 flex-col items-center">
                          <span className="text-[10px] text-slate-500">#{i + 1}</span>
                          <span className="text-xl font-bold tabular-nums" style={{ color: scoreColor(r.winRate) }}>{r.winRate}%</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`chip border font-semibold ${VERDICT_STYLE[r.verdict]}`}>{r.verdict}</span>
                            <span className="chip border-studio-600 text-slate-300">{NICHE_BY_ID[r.niche].emoji} {r.niche}</span>
                            {r.duplicateOf && <span className="chip border-violet-500/40 text-violet-300">Đã có trong CRM</span>}
                            {r.scanned.postedText && <span className="text-[11px] text-slate-500">{r.scanned.postedText}</span>}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-100">{j.title}</p>
                          <p className="mt-0.5 text-[11.5px] text-slate-400">
                            {j.contractType === 'fixed' ? `Fixed ${j.budget ? `$${j.budget.toLocaleString('en-US')}` : '—'}` : `Hourly $${j.hourlyMin}–$${j.hourlyMax}`}
                            {' · '}Bid gợi ý <b className="text-slate-200">{r.bidLabel}</b>
                            {' · '}{c.proposals} proposals · {c.country || '—'} · {c.paymentVerified ? '✅ verified' : '⛔ unverified'} · chi ${c.totalSpent.toLocaleString('en-US')}
                            {r.redFlags > 0 && <span className="text-rose-300"> · 🚩 {r.redFlags}</span>}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-slate-500">🏆 {r.topProject} ({r.topProjectScore}%)</p>
                          {r.scanned.missing.length > 0 && (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                              <Info size={11} /> Không thấy trên tile: {r.scanned.missing.map((m) => MISSING_VI[m] ?? m).join(', ')} — đã dùng giá trị trung tính
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col gap-1.5">
                          <button type="button" className="btn-primary btn-xs" onClick={() => onAnalyze(j)} data-testid="scan-analyze">
                            🔍 Phân tích & soạn đơn
                          </button>
                          <button type="button" className="btn-ghost btn-xs" onClick={() => saveDeal(r)} data-testid="scan-save">
                            <Save size={12} /> Lưu CRM
                          </button>
                          <button type="button" className="btn-ghost btn-xs" onClick={() => setSkipped([...skipped, r.scanned.id])} data-testid="scan-skip">
                            <X size={12} /> Bỏ qua
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {!visible.length && <li className="text-sm text-slate-500">Tất cả job đã bị lọc — nới bộ lọc ở trên.</li>}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color: color ?? '#fff' }}>{value}</p>
    </div>
  );
}
