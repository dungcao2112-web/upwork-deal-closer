import { useMemo, useState } from 'react';
import { Clapperboard, FolderGit2, Pencil, Plus, RotateCcw, Save, Search, Trash2, Trophy } from 'lucide-react';
import type { NicheId, PortfolioProject, ProjectMatch } from '../types';
import { NICHES, NICHE_BY_ID } from '../data/niches';
import { TECH_LEXICON } from '../data/techLexicon';
import { Card, CopyButton, Segmented, scoreColor, useToast } from './ui';

interface Props {
  matches: ProjectMatch[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  projects: PortfolioProject[];
  setProjects: (p: PortfolioProject[]) => void;
  resetProjects: () => void;
}

export function loomToText(p: PortfolioProject): string {
  return [
    `🎬 90-SECOND LOOM SCRIPT — ${p.shortName}`,
    ...p.loomScript.map((s) => `\n[${s.start}–${s.end}] 🖱 ${s.actionVi}\n🗣 EN: "${s.sayEn}"\n🇻🇳 VI: ${s.sayVi}`),
  ].join('\n');
}

export function PortfolioMatcher(props: Props) {
  const [view, setView] = useState<'matcher' | 'manager'>('matcher');
  return (
    <div className="space-y-4">
      <Segmented
        value={view}
        onChange={setView}
        testId="portfolio-view"
        options={[
          { id: 'matcher', label: '🏆 Portfolio Matcher & Loom' },
          { id: 'manager', label: '🗂️ Quản lý Kho Dự Án' },
        ]}
      />
      {view === 'matcher' ? <Matcher {...props} /> : <Manager {...props} />}
    </div>
  );
}

function Matcher({ matches, selectedIds, setSelectedIds }: Props) {
  const [focus, setFocus] = useState<string>(selectedIds[0] ?? matches[0]?.project.id);
  const focused = matches.find((m) => m.project.id === focus) ?? matches[0];
  const toggle = (id: string) =>
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id].sort((a, b) => matches.findIndex((m) => m.project.id === a) - matches.findIndex((m) => m.project.id === b)));

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
      <Card title="Xếp hạng dự án khớp Job" icon={<Trophy size={16} className="text-amber-300" />} subtitle="Tick để chọn dự án đưa vào Proposal (dự án đầu = vũ khí chính)">
        <ul className="space-y-2" data-testid="project-ranking">
          {matches.map((m, i) => {
            const on = selectedIds.includes(m.project.id);
            return (
              <li
                key={m.project.id}
                className={`cursor-pointer rounded-lg border p-3 transition ${focus === m.project.id ? 'border-accent/60 bg-accent/5' : 'border-studio-700 bg-studio-850/60 hover:border-studio-500'}`}
                onClick={() => setFocus(m.project.id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#14e0b0]"
                    checked={on}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggle(m.project.id)}
                    aria-label={`Chọn ${m.project.shortName}`}
                  />
                  <span className="w-6 text-center text-xs font-bold text-slate-500">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {m.project.code} · {m.project.shortName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{m.matchedKeywords.slice(0, 4).join(' · ') || '—'}</p>
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor(m.score) }}>
                    {m.score}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {focused && (
        <div className="space-y-4">
          <Card
            title={`${focused.project.code} · ${focused.project.name}`}
            icon={<FolderGit2 size={16} className="text-accent" />}
            subtitle={focused.project.github ? `GitHub: ${focused.project.github}${focused.project.localPath ? ` · ${focused.project.localPath}` : ''}` : focused.project.localPath}
          >
            <ul className="mb-3 space-y-1 text-xs text-slate-400">
              {focused.reasonsVi.map((r) => (
                <li key={r}>✔ {r}</li>
              ))}
            </ul>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {focused.project.metrics.map((m) => (
                <span key={m.label} className="chip border-studio-600 bg-studio-850 text-slate-300">
                  {m.label}: <b className="text-accent">{m.value}</b>
                </span>
              ))}
            </div>
            <div className="rounded-lg border border-studio-700 bg-studio-950 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="label !mb-0">Proof-of-Work Paragraph (EN)</p>
                <CopyButton text={focused.project.proofOfWork} size="xs" />
              </div>
              <p className="text-sm leading-relaxed text-slate-200" data-testid="proof-of-work">{focused.project.proofOfWork}</p>
            </div>
            <p className="mt-2 text-xs text-slate-500">🎥 Demo asset: {focused.project.demoAsset}</p>
          </Card>

          <Card
            title="90-Second Loom Video Demo Script"
            icon={<Clapperboard size={16} className="text-rose-400" />}
            subtitle="Quay màn hình theo đúng kịch bản — gắn link Loom vào Proposal"
            actions={<CopyButton text={loomToText(focused.project)} label="Copy kịch bản" size="xs" />}
          >
            <ol className="space-y-3" data-testid="loom-script">
              {focused.project.loomScript.map((s) => (
                <li key={s.start} className="grid gap-2 rounded-lg border border-studio-700 bg-studio-850/60 p-3 md:grid-cols-[90px_minmax(0,1fr)]">
                  <span className="mono text-sm font-bold text-rose-300">
                    {s.start}–{s.end}
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-xs text-amber-200">🖱 {s.actionVi}</p>
                    <p className="text-sm text-slate-100">🗣 “{s.sayEn}”</p>
                    <p className="text-xs text-slate-400">🇻🇳 {s.sayVi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}

const blank = (): PortfolioProject => ({
  id: `custom-${Date.now().toString(36)}`,
  code: 'P+',
  name: '',
  shortName: '',
  niches: ['agents'],
  taglineEn: '',
  summaryVi: '',
  stack: [],
  keywords: [],
  highlightsVi: [],
  metrics: [],
  proofOfWork: '',
  demoAsset: '',
  reusableModules: [],
  loomScript: [
    { start: '0:00', end: '0:15', actionVi: '', sayEn: '', sayVi: '' },
    { start: '0:15', end: '0:45', actionVi: '', sayEn: '', sayVi: '' },
    { start: '0:45', end: '1:30', actionVi: '', sayEn: '', sayVi: '' },
  ],
  custom: true,
});

function Manager({ projects, setProjects, resetProjects }: Props) {
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const list = useMemo(() => {
    const s = q.toLowerCase();
    return projects.filter((p) => !s || `${p.name} ${p.shortName} ${p.stack.join(' ')} ${p.summaryVi}`.toLowerCase().includes(s));
  }, [projects, q]);

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return notify('Cần nhập tên dự án', 'err');
    const p = { ...editing, shortName: editing.shortName || editing.name };
    const exists = projects.some((x) => x.id === p.id);
    setProjects(exists ? projects.map((x) => (x.id === p.id ? p : x)) : [...projects, p]);
    setEditing(null);
    notify('💾 Đã lưu dự án vào kho (localStorage)');
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card
        title={`Kho dự án (${projects.length})`}
        icon={<FolderGit2 size={16} className="text-accent" />}
        actions={
          <>
            <button type="button" className="btn-primary btn-xs" onClick={() => setEditing(blank())} data-testid="add-project">
              <Plus size={14} /> Thêm dự án
            </button>
            <button
              type="button"
              className="btn-ghost btn-xs"
              onClick={() => {
                if (confirm('Khôi phục 7 dự án gốc? Dự án tự thêm sẽ bị xóa.')) {
                  resetProjects();
                  notify('Đã khôi phục kho gốc');
                }
              }}
            >
              <RotateCcw size={14} /> Khôi phục
            </button>
          </>
        }
      >
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input className="input pl-8" placeholder="Tìm dự án / công nghệ…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ul className="space-y-2" data-testid="project-list">
          {list.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-lg border border-studio-700 bg-studio-850/60 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">
                  {p.code} · {p.shortName} {p.custom && <span className="chip ml-1 border-sky-500/40 text-sky-300">custom</span>}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{p.summaryVi || p.taglineEn}</p>
                <p className="mt-1 text-[11px] text-slate-500">{p.niches.map((n) => NICHE_BY_ID[n].emoji).join(' ')} {p.stack.slice(0, 6).join(' · ')}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" className="btn-ghost btn-xs" onClick={() => setEditing(structuredClone(p))} aria-label="Sửa">
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-xs text-rose-300"
                  aria-label="Xóa"
                  onClick={() => {
                    if (confirm(`Xóa "${p.shortName}" khỏi kho?`)) setProjects(projects.filter((x) => x.id !== p.id));
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {editing ? (
        <ProjectEditor value={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <Card title="Chi tiết dự án">
          <p className="text-sm text-slate-400">Chọn ✏️ để sửa một dự án hoặc bấm “Thêm dự án” để bổ sung vũ khí mới. Dữ liệu được lưu trong trình duyệt (localStorage) và dùng ngay cho bộ Matcher + Proposal.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {projects.map((p) => (
              <div key={p.id} className="rounded-lg border border-studio-700 p-3 text-xs">
                <p className="font-semibold text-slate-200">{p.code} · {p.shortName}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-400">
                  {p.highlightsVi.slice(0, 3).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ProjectEditor({ value: v, onChange, onSave, onCancel }: { value: PortfolioProject; onChange: (p: PortfolioProject) => void; onSave: () => void; onCancel: () => void }) {
  const set = (patch: Partial<PortfolioProject>) => onChange({ ...v, ...patch });
  const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  return (
    <Card
      title={v.name ? `Sửa: ${v.shortName || v.name}` : 'Dự án mới'}
      icon={<Pencil size={16} className="text-accent" />}
      actions={
        <>
          <button type="button" className="btn-ghost btn-xs" onClick={onCancel}>Hủy</button>
          <button type="button" className="btn-primary btn-xs" onClick={onSave} data-testid="save-project">
            <Save size={14} /> Lưu
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Tên dự án</label>
          <input className="input" data-testid="project-name" value={v.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <label className="label">Tên ngắn</label>
          <input className="input" value={v.shortName} onChange={(e) => set({ shortName: e.target.value })} />
        </div>
        <div>
          <label className="label">Mã</label>
          <input className="input" value={v.code} onChange={(e) => set({ code: e.target.value })} />
        </div>
        <div>
          <label className="label">GitHub</label>
          <input className="input" value={v.github ?? ''} onChange={(e) => set({ github: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Ngách</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <label key={n.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="accent-[#14e0b0]"
                  checked={v.niches.includes(n.id)}
                  onChange={(e) => set({ niches: e.target.checked ? [...v.niches, n.id] : v.niches.filter((x) => x !== n.id) as NicheId[] })}
                />
                {n.emoji} {n.nameVi}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tagline (EN)</label>
          <input className="input" value={v.taglineEn} onChange={(e) => set({ taglineEn: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tóm tắt (VI)</label>
          <textarea className="input min-h-[60px]" value={v.summaryVi} onChange={(e) => set({ summaryVi: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Stack (phân tách dấu phẩy)</label>
          <input className="input" value={v.stack.join(', ')} onChange={(e) => set({ stack: list(e.target.value) })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Keyword ID để Matcher chấm điểm</label>
          <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded-lg border border-studio-700 p-2">
            {TECH_LEXICON.filter((t) => t.dungHas).map((t) => {
              const on = v.keywords.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => set({ keywords: on ? v.keywords.filter((x) => x !== t.id) : [...v.keywords, t.id] })}
                  className={`chip ${on ? 'border-accent/50 bg-accent/15 text-accent' : 'border-studio-600 text-slate-400'}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Proof-of-Work Paragraph (EN)</label>
          <textarea className="input min-h-[100px]" value={v.proofOfWork} onChange={(e) => set({ proofOfWork: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Module tái sử dụng (dấu phẩy)</label>
          <input className="input" value={v.reusableModules.join(', ')} onChange={(e) => set({ reusableModules: list(e.target.value) })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Chỉ số (dạng “Nhãn: Giá trị”, dấu phẩy)</label>
          <input
            className="input"
            value={v.metrics.map((m) => `${m.label}: ${m.value}`).join(', ')}
            onChange={(e) =>
              set({
                metrics: list(e.target.value).map((s) => {
                  const [label, ...rest] = s.split(':');
                  return { label: label.trim(), value: rest.join(':').trim() };
                }),
              })
            }
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <label className="label">Kịch bản Loom</label>
          {v.loomScript.map((s, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-studio-700 p-2 sm:grid-cols-[70px_70px_minmax(0,1fr)]">
              <input className="input mono text-xs" value={s.start} onChange={(e) => set({ loomScript: v.loomScript.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} />
              <input className="input mono text-xs" value={s.end} onChange={(e) => set({ loomScript: v.loomScript.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })} />
              <div className="space-y-1">
                <input className="input text-xs" placeholder="Hành động (VI)" value={s.actionVi} onChange={(e) => set({ loomScript: v.loomScript.map((x, j) => (j === i ? { ...x, actionVi: e.target.value } : x)) })} />
                <input className="input text-xs" placeholder="Câu nói (EN)" value={s.sayEn} onChange={(e) => set({ loomScript: v.loomScript.map((x, j) => (j === i ? { ...x, sayEn: e.target.value } : x)) })} />
                <input className="input text-xs" placeholder="Dịch (VI)" value={s.sayVi} onChange={(e) => set({ loomScript: v.loomScript.map((x, j) => (j === i ? { ...x, sayVi: e.target.value } : x)) })} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
