import { useEffect, useState } from 'react';
import { ExternalLink, Plus, Radar, UserRound, X } from 'lucide-react';
import type { BooleanOptions, NicheId } from '../types';
import { NICHES, NICHE_BY_ID } from '../data/niches';
import { buildBooleanQuery, buildUpworkSearchUrl, defaultBooleanOptions } from '../engine';
import { Card, CopyButton, Pre, Segmented, Toggle } from './ui';

const EXTRA_EXCLUDES = ['shopify theme', 'logo design', 'translation', 'seo', 'cold calling', 'unity', 'php', 'crypto'];

export function NicheRadar({ initialNiche }: { initialNiche: NicheId }) {
  const [niche, setNiche] = useState<NicheId>(initialNiche);
  const n = NICHE_BY_ID[niche];
  const [o, setO] = useState<BooleanOptions>(() => defaultBooleanOptions(n));
  const [custom, setCustom] = useState('');
  useEffect(() => setO(defaultBooleanOptions(NICHE_BY_ID[niche])), [niche]);

  const toggleIn = (key: 'coreTerms' | 'plusTerms' | 'excludeTerms', term: string) =>
    setO((s) => ({ ...s, [key]: s[key].includes(term) ? s[key].filter((t) => t !== term) : [...s[key], term] }));

  const query = buildBooleanQuery(o);
  const url = buildUpworkSearchUrl(o);
  const allExcludes = [...new Set([...n.defaultExcludes, ...EXTRA_EXCLUDES, ...o.excludeTerms])];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" data-testid="niche-cards">
        {NICHES.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setNiche(x.id)}
            className={`rounded-xl border p-3 text-left transition ${niche === x.id ? 'border-accent/60 bg-accent/10' : 'border-studio-700 bg-studio-900 hover:border-studio-500'}`}
          >
            <p className="text-lg">{x.emoji}</p>
            <p className="text-sm font-semibold leading-tight text-slate-100">{x.name}</p>
            <p className="mt-1 text-[11px] text-slate-400">{x.nameVi}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <Card title="Upwork Search Query & Boolean Generator" icon={<Radar size={16} className="text-accent" />} subtitle={n.pipelineVi}>
          <p className="label">Từ khóa lõi (OR)</p>
          <div className="mb-3 flex flex-wrap gap-1.5" data-testid="core-terms">
            {n.coreTerms.map((t) => (
              <TermChip key={t} term={t} on={o.coreTerms.includes(t)} onClick={() => toggleIn('coreTerms', t)} />
            ))}
          </div>
          <p className="label">Từ khóa cộng thêm (AND … OR)</p>
          <div className="mb-3 flex flex-wrap gap-1.5" data-testid="plus-terms">
            {[...new Set([...n.plusTerms, ...o.plusTerms])].map((t) => (
              <TermChip key={t} term={t} on={o.plusTerms.includes(t)} onClick={() => toggleIn('plusTerms', t)} color="sky" />
            ))}
          </div>
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = custom.trim();
              if (t && !o.plusTerms.includes(t)) setO((s) => ({ ...s, plusTerms: [...s.plusTerms, t] }));
              setCustom('');
            }}
          >
            <input className="input" placeholder="Thêm từ khóa tùy chỉnh…" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button type="submit" className="btn-ghost">
              <Plus size={14} />
            </button>
          </form>
          <p className="label">Từ khóa loại trừ</p>
          <div className="mb-3 flex flex-wrap gap-1.5" data-testid="exclude-terms">
            {allExcludes.map((t) => (
              <TermChip key={t} term={t} on={o.excludeTerms.includes(t)} onClick={() => toggleIn('excludeTerms', t)} color="rose" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Kiểu hợp đồng</label>
              <Segmented
                value={o.contractType}
                onChange={(contractType) => setO({ ...o, contractType })}
                options={[
                  { id: 'any', label: 'Tất cả' },
                  { id: 'fixed', label: 'Fixed' },
                  { id: 'hourly', label: 'Hourly' },
                ]}
              />
            </div>
            <div>
              <label className="label">Cú pháp loại trừ</label>
              <Segmented
                value={o.excludeStyle}
                onChange={(excludeStyle) => setO({ ...o, excludeStyle })}
                options={[
                  { id: 'NOT', label: 'NOT term' },
                  { id: 'minus', label: '-term' },
                ]}
              />
            </div>
            <div>
              <label className="label">Budget tối thiểu ($)</label>
              <input type="number" className="input" data-testid="min-budget" value={o.minBudget} onChange={(e) => setO({ ...o, minBudget: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">Hourly tối thiểu ($/h)</label>
              <input type="number" className="input" value={o.minHourly} onChange={(e) => setO({ ...o, minHourly: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="mt-3">
            <Toggle checked={o.paymentVerified} onChange={(v) => setO({ ...o, paymentVerified: v })} label="Chỉ khách Payment Verified" />
          </div>
          <div className="mt-4 space-y-2">
            <p className="label">Chuỗi Boolean Search</p>
            <Pre className="!whitespace-pre-wrap text-[12.5px] text-accent">{query || '(chọn ít nhất 1 từ khóa)'}</Pre>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={query} label="Copy Boolean" />
              <a className="btn-primary" href={url} target="_blank" rel="noreferrer" data-testid="open-upwork">
                <ExternalLink size={14} /> Mở trang tìm kiếm Upwork
              </a>
              <CopyButton text={url} label="Copy URL" />
            </div>
          </div>
        </Card>

        <Card title="Specialized Profile — Title, Overview & Skills" icon={<UserRound size={16} className="text-sky-300" />} subtitle="Copy dán lên Specialized Profile trên Upwork">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="label !mb-0">Profile Title ({n.profileTitle.length}/70 ký tự)</p>
                <CopyButton text={n.profileTitle} size="xs" />
              </div>
              <p className="rounded-lg border border-studio-700 bg-studio-950 p-3 text-sm font-semibold text-white" data-testid="profile-title">{n.profileTitle}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="label !mb-0">Overview (SEO)</p>
                <CopyButton text={n.profileOverview} size="xs" />
              </div>
              <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-studio-700 bg-studio-950 p-3 text-[12.5px] leading-relaxed text-slate-300">{n.profileOverview}</div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="label !mb-0">Skills gợi ý ({n.skills.length})</p>
                <CopyButton text={n.skills.join(', ')} size="xs" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {n.skills.map((s) => (
                  <span key={s} className="chip border-studio-600 bg-studio-850 text-slate-300">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TermChip({ term, on, onClick, color = 'accent' }: { term: string; on: boolean; onClick: () => void; color?: 'accent' | 'sky' | 'rose' }) {
  const onCls = color === 'accent' ? 'border-accent/50 bg-accent/15 text-accent' : color === 'sky' ? 'border-sky-500/50 bg-sky-500/15 text-sky-300' : 'border-rose-500/50 bg-rose-500/15 text-rose-300';
  return (
    <button type="button" onClick={onClick} className={`chip transition ${on ? onCls : 'border-studio-600 text-slate-500 hover:text-slate-300'}`}>
      {on ? '✓' : <X size={10} className="opacity-0" />} {term}
    </button>
  );
}
