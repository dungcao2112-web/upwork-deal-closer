import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Download, FileJson, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';
import type { Deal, DealStage } from '../types';
import { STAGES, computeStats, exportDealsCsv, exportDealsJson, formatUsd, importDealsCsv, importDealsJson, mergeDeals, moveDeal } from '../engine';
import { NICHE_BY_ID } from '../data/niches';
import { PROJECT_BY_ID } from '../data/portfolioData';
import { downloadFile, readFileText } from '../utils/browser';
import { CopyButton, scoreColor, useToast } from './ui';

interface Props {
  deals: Deal[];
  setDeals: (d: Deal[]) => void;
  resetDeals: () => void;
  connectPrice: number;
}

export function PipelineCRM({ deals, setDeals, resetDeals, connectPrice }: Props) {
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = useMemo(() => computeStats(deals, connectPrice), [deals, connectPrice]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return deals.filter((d) => !s || `${d.title} ${d.notes} ${d.clientCountry} ${d.niche}`.toLowerCase().includes(s));
  }, [deals, q]);
  const openDeal = deals.find((d) => d.id === open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const move = (id: string, stage: DealStage) => setDeals(deals.map((d) => (d.id === id ? moveDeal(d, stage) : d)));
  const update = (id: string, patch: Partial<Deal>) => setDeals(deals.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)));
  const stamp = new Date().toISOString().slice(0, 10);

  const onImport = async (file: File) => {
    try {
      const text = await readFileText(file);
      const looksJson = /^\s*[[{]/.test(text);
      const incoming = looksJson ? importDealsJson(text) : importDealsCsv(text);
      setDeals(mergeDeals(deals, incoming));
      notify(`📥 Đã nhập ${incoming.length} deal`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'File không hợp lệ', 'err');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="crm-stats">
        <StatCard label="Tổng đơn đã gửi" value={String(stats.sent)} sub={`${stats.total} deal trong phễu`} />
        <StatCard label="Reply Rate" value={`${stats.replyRate}%`} sub={`${stats.replied} khách phản hồi`} color={scoreColor(stats.replyRate * 1.5)} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.won} hợp đồng`} color={scoreColor(stats.winRate * 2)} />
        <StatCard label="Connects đầu tư" value={String(stats.connects)} sub={`≈ ${formatUsd(stats.connectsUsd)}`} />
        <StatCard label="Giá trị Pipeline" value={formatUsd(stats.pipelineValue)} sub="không tính Archived" color="#14e0b0" />
        <StatCard label="Đã chốt" value={formatUsd(stats.wonValue)} sub="tổng hợp đồng Won" color="#fbbf24" />
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input className="input pl-8" placeholder="Tìm deal theo tên, ghi chú, quốc gia…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="crm-search" />
        </div>
        <button type="button" className="btn-ghost" onClick={() => downloadFile(`upwork-pipeline-${stamp}.json`, exportDealsJson(deals), 'application/json')} data-testid="export-json">
          <FileJson size={14} /> Export JSON
        </button>
        <button type="button" className="btn-ghost" onClick={() => downloadFile(`upwork-pipeline-${stamp}.csv`, exportDealsCsv(deals), 'text/csv;charset=utf-8')} data-testid="export-csv">
          <Download size={14} /> Export CSV
        </button>
        <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Import JSON/CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          data-testid="import-file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (confirm('Khôi phục dữ liệu mẫu? Toàn bộ deal hiện tại sẽ bị thay thế.')) {
              resetDeals();
              notify('Đã nạp lại dữ liệu mẫu');
            }
          }}
        >
          <RotateCcw size={14} /> Dữ liệu mẫu
        </button>
      </div>

      <div className="grid gap-3 overflow-x-auto pb-2 lg:grid-cols-5" data-testid="kanban">
        {STAGES.map((s, si) => {
          const col = filtered.filter((d) => d.stage === s.id);
          const value = col.reduce((sum, d) => sum + d.bidAmount, 0);
          return (
            <div
              key={s.id}
              className={`flex min-h-[320px] min-w-[230px] flex-col rounded-xl border bg-studio-900/70 ${dragId ? 'border-dashed border-studio-500' : 'border-studio-700'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) move(dragId, s.id);
                setDragId(null);
              }}
              data-testid={`column-${s.id}`}
            >
              <header className="border-b border-studio-700 px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-100">{s.emoji} {s.label}</p>
                <p className="text-[11px] text-slate-500">{s.labelVi} · {col.length} deal · {formatUsd(value)}</p>
              </header>
              <div className="flex-1 space-y-2 p-2">
                {col.map((d) => (
                  <article
                    key={d.id}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setOpen(d.id)}
                    className="cursor-pointer rounded-lg border border-studio-700 bg-studio-850 p-2.5 transition hover:border-accent/50"
                    data-testid="deal-card"
                  >
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-100">{d.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="chip border-studio-600 text-slate-300">{NICHE_BY_ID[d.niche]?.emoji} {d.niche}</span>
                      <span className="font-semibold" style={{ color: scoreColor(d.winRate) }}>{d.winRate}%</span>
                      <span className="text-slate-300">{formatUsd(d.bidAmount)}</span>
                      {d.connects > 0 && <span className="text-slate-500">· {d.connects}c</span>}
                    </div>
                    <div className="mt-2 flex justify-between">
                      <button type="button" className="btn-ghost btn-xs" disabled={si === 0} onClick={(e) => { e.stopPropagation(); move(d.id, STAGES[si - 1].id); }} aria-label="Lùi giai đoạn">
                        <ArrowLeft size={12} />
                      </button>
                      <button type="button" className="btn-ghost btn-xs" disabled={si === STAGES.length - 1} onClick={(e) => { e.stopPropagation(); move(d.id, STAGES[si + 1].id); }} aria-label="Tiến giai đoạn" data-testid="move-next">
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {openDeal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(null)}>
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="deal-modal">
            <header className="flex items-start justify-between gap-3 border-b border-studio-700 p-4">
              <div>
                <p className="text-base font-semibold text-white">{openDeal.title}</p>
                <p className="text-xs text-slate-400">
                  {openDeal.clientCountry || '—'} · {openDeal.contractType} · Win-Rate {openDeal.winRate}% · tạo {openDeal.createdAt.slice(0, 10)}
                </p>
              </div>
              <button type="button" className="btn-ghost btn-xs" onClick={() => setOpen(null)} aria-label="Đóng">
                <X size={14} />
              </button>
            </header>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="label">Giai đoạn</label>
                  <select className="input" value={openDeal.stage} onChange={(e) => move(openDeal.id, e.target.value as DealStage)}>
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Giá bid ($)</label>
                    <input type="number" className="input" value={openDeal.bidAmount} onChange={(e) => update(openDeal.id, { bidAmount: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="label">Connects đã tốn</label>
                    <input type="number" className="input" value={openDeal.connects} onChange={(e) => update(openDeal.id, { connects: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label className="label">Ghi chú</label>
                  <textarea className="input min-h-[100px]" value={openDeal.notes} onChange={(e) => update(openDeal.id, { notes: e.target.value })} data-testid="deal-notes" />
                </div>
                <div className="text-xs text-slate-400">
                  <p>Dự án mẫu: {openDeal.projectIds.map((id) => PROJECT_BY_ID[id]?.shortName ?? id).join(', ') || '—'}</p>
                  <p>Proposal angle: {openDeal.proposalAngle}</p>
                  <p>Sent: {openDeal.sentAt?.slice(0, 10) ?? '—'} · Replied: {openDeal.repliedAt?.slice(0, 10) ?? '—'} · Won: {openDeal.wonAt?.slice(0, 10) ?? '—'}</p>
                </div>
                {openDeal.milestones.length > 0 && (
                  <ul className="space-y-1 text-xs text-slate-300">
                    {openDeal.milestones.map((m) => (
                      <li key={m.index}>M{m.index} · {m.title} — {formatUsd(m.amount)} ({m.percent}%)</li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="btn-ghost btn-xs text-rose-300"
                  onClick={() => {
                    if (confirm('Xóa deal này?')) {
                      setDeals(deals.filter((d) => d.id !== openDeal.id));
                      setOpen(null);
                    }
                  }}
                >
                  <Trash2 size={13} /> Xóa deal
                </button>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="label !mb-0">Proposal đã gửi</p>
                  {openDeal.proposalText && <CopyButton text={openDeal.proposalText} size="xs" />}
                </div>
                <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-studio-700 bg-studio-950 p-3 text-xs leading-relaxed text-slate-300">
                  {openDeal.proposalText || 'Chưa có proposal.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="card p-3">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        <BarChart3 size={11} /> {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: color ?? '#fff' }}>{value}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}
