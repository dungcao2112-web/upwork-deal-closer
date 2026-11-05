import { Clock, Coins, Gauge as GaugeIcon, ListChecks, Zap } from 'lucide-react';
import type { BidOptions, BidResult, BidTierId } from '../types';
import { UPWORK_FEE, formatUsd, formatVnd, milestoneToText, milestonesToText } from '../engine';
import { Card, CopyButton, ProgressBar, Segmented } from './ui';

interface Props {
  bid: BidResult;
  options: BidOptions;
  setOptions: (o: BidOptions) => void;
  winRate: number;
}

const TIER_STYLE: Record<BidTierId, string> = {
  aggressive: 'from-sky-500/20 border-sky-500/40',
  optimal: 'from-accent/20 border-accent/50',
  premium: 'from-amber-500/20 border-amber-500/40',
};

export function BidCalculator({ bid, options, setOptions, winRate }: Props) {
  const set = (patch: Partial<BidOptions>) => setOptions({ ...options, ...patch });
  const saved = bid.marketHours - bid.dungHours;
  const milestonesTotal = bid.milestones.reduce((s, m) => s + m.amount, 0);
  const pctTotal = bid.milestones.reduce((s, m) => s + m.percent, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Thời gian: Thị trường vs Dũng" icon={<Clock size={16} className="text-sky-400" />}>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm"><span className="text-slate-400">Freelancer thị trường</span><b className="tabular-nums text-slate-200">{bid.marketHours} giờ</b></div>
              <ProgressBar value={100} color="#64748b" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span className="text-slate-400">Dũng (tái sử dụng module)</span><b className="tabular-nums text-accent" data-testid="dung-hours">{bid.dungHours} giờ</b></div>
              <ProgressBar value={(bid.dungHours / bid.marketHours) * 100} color="#14e0b0" />
            </div>
            <p className="text-xs text-slate-400">
              Reuse Multiplier <b className="text-accent">{bid.reuseMultiplier}x</b> → tiết kiệm {saved} giờ · bàn giao ~{bid.daysToDeliver} ngày làm việc (đã cộng 30% dự phòng). Giá thị trường ngách ≈ {formatUsd(bid.marketRate)}/h.
            </p>
          </div>
        </Card>
        <Card title="Cài đặt" icon={<GaugeIcon size={16} className="text-accent" />}>
          <div className="space-y-3">
            <div>
              <label className="label">Tỷ giá USD → VNĐ</label>
              <input type="number" className="input" data-testid="vnd-rate" value={options.vndRate} onChange={(e) => set({ vndRate: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">Số Milestones</label>
              <Segmented
                value={String(options.milestoneCount ?? 'auto') as 'auto' | '3' | '4'}
                onChange={(v) => set({ milestoneCount: v === 'auto' ? undefined : (Number(v) as 3 | 4) })}
                testId="milestone-count"
                options={[
                  { id: 'auto', label: 'Tự động' },
                  { id: '3', label: '3 giai đoạn' },
                  { id: '4', label: '4 giai đoạn' },
                ]}
              />
            </div>
            <div>
              <label className="label">Giá 1 Connect ($)</label>
              <input type="number" step={0.01} className="input" value={options.connectPrice} onChange={(e) => set({ connectPrice: Number(e.target.value) || 0 })} />
            </div>
          </div>
        </Card>
        <Card title="ROI Connects" icon={<Coins size={16} className="text-amber-300" />}>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="Connects đề xuất" value={`${bid.connectsSuggested}`} sub={formatUsd(bid.connectsCostUsd)} />
            <Stat label="Giá trị kỳ vọng" value={formatUsd(Math.round(bid.expectedValue))} sub={`${winRate}% × Net`} />
            <Stat label="ROI Connects" value={`${bid.connectsRoi}x`} sub="EV / chi phí connects" accent />
            <Stat label="Phí Upwork" value={`${Math.round(UPWORK_FEE * 100)}%`} sub="flat fee" />
          </div>
        </Card>
      </div>

      <Card title="3 mức Giá Bid đề xuất" icon={<Zap size={16} className="text-accent" />} subtitle={`${bid.contractType === 'fixed' ? 'Fixed-Price' : 'Hourly (ước tính theo giờ thực Dũng làm)'} · bấm để chọn mức giá dùng cho Milestones & Proposal`}>
        <div className="grid gap-3 md:grid-cols-3" data-testid="bid-tiers">
          {bid.tiers.map((t) => {
            const on = bid.selected.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ tier: t.id })}
                className={`rounded-xl border bg-gradient-to-b to-transparent p-4 text-left transition ${TIER_STYLE[t.id]} ${on ? 'ring-2 ring-accent' : 'opacity-80 hover:opacity-100'}`}
                data-testid={`tier-${t.id}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">{t.label}</p>
                  {on && <span className="chip border-accent/50 bg-accent/20 text-accent">Đang chọn</span>}
                </div>
                <p className="text-xs text-slate-400">{t.labelVi}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">{t.rate !== undefined ? `$${t.rate}/h` : formatUsd(t.gross)}</p>
                {t.rate !== undefined && <p className="text-xs text-slate-400">≈ {formatUsd(t.gross)} cho {bid.dungHours} giờ</p>}
                <div className="mt-3 space-y-1 text-xs">
                  <Row k="Phí Upwork 10%" v={`-${formatUsd(t.fee)}`} />
                  <Row k="Thu nhập ròng" v={formatUsd(t.net)} strong />
                  <Row k="Quy đổi VNĐ" v={formatVnd(t.netVnd)} />
                  <Row k="$/giờ thực làm" v={`${formatUsd(t.effectiveHourly)}/h`} strong />
                </div>
                <p className="mt-2 text-[11px] leading-snug text-slate-400">{t.rationaleVi}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card
        title={`Bảng Milestones chuẩn Upwork (${bid.milestones.length} giai đoạn)`}
        icon={<ListChecks size={16} className="text-accent" />}
        subtitle={`Tổng ${pctTotal}% = ${formatUsd(Math.round(milestonesTotal * 100) / 100)} (khớp giá ${bid.selected.label})`}
        actions={<CopyButton text={milestonesToText(bid.milestones)} label="Copy trọn bộ Milestones" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm" data-testid="milestones-table">
            <thead>
              <tr className="border-b border-studio-700 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Milestone</th>
                <th className="py-2 pr-2">%</th>
                <th className="py-2 pr-2">Số tiền</th>
                <th className="py-2 pr-2">Deliverables</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {bid.milestones.map((m) => (
                <tr key={m.index} className="border-b border-studio-800 align-top">
                  <td className="py-2.5 pr-2 font-bold text-accent">M{m.index}</td>
                  <td className="py-2.5 pr-2 font-medium text-slate-100">{m.title}</td>
                  <td className="py-2.5 pr-2 tabular-nums text-slate-300">{m.percent}%</td>
                  <td className="py-2.5 pr-2 font-semibold tabular-nums text-white">{formatUsd(m.amount)}</td>
                  <td className="py-2.5 pr-2">
                    <ul className="space-y-0.5 text-xs text-slate-400">
                      {m.deliverables.map((d) => (
                        <li key={d}>• {d}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2.5">
                    <CopyButton text={milestoneToText(m)} label="" size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{k}</span>
      <span className={`tabular-nums ${strong ? 'font-semibold text-accent' : 'text-slate-200'}`}>{v}</span>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-studio-700 bg-studio-850/60 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${accent ? 'text-accent' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
