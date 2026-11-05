import { useMemo, useState } from 'react';
import { Calculator, KanbanSquare, Languages, PenLine, Radar, Satellite, Save, ScanSearch, Search, Trophy } from 'lucide-react';
import type { BidOptions, Deal, JobInput, PortfolioProject, ProposalAngleId, ProposalOptions } from './types';
import { CORE_POSITIONING, PORTFOLIO_PROJECTS } from './data/portfolioData';
import { SAMPLE_JOBS } from './data/sampleJobs';
import { NICHE_BY_ID } from './data/niches';
import { sampleDeals } from './data/sampleDeals';
import { DEFAULT_BID_OPTIONS, DEFAULT_PROPOSAL_OPTIONS, analyzeJob, buildContext, createDeal, formatUsd, generateAllProposals } from './engine';
import { useLocalStorage } from './hooks/useLocalStorage';
import { JobAnalyzer } from './components/JobAnalyzer';
import { PortfolioMatcher } from './components/PortfolioMatcher';
import { ProposalStudio } from './components/ProposalStudio';
import { BidCalculator } from './components/BidCalculator';
import { NicheRadar } from './components/NicheRadar';
import { PipelineCRM } from './components/PipelineCRM';
import { JdTranslator } from './components/JdTranslator';
import { JobScanner } from './components/JobScanner';
import { scoreColor, useToast } from './components/ui';

const TABS = [
  { id: 'analyzer', icon: ScanSearch, label: 'JD Analyzer & Win-Rate', vi: 'Phân tích Job' },
  { id: 'translate', icon: Languages, label: 'Dịch JD tiếng Việt', vi: 'Hiểu JD trong 30 giây' },
  { id: 'portfolio', icon: Trophy, label: 'Portfolio & Loom Script', vi: 'Vũ khí chốt khách' },
  { id: 'proposal', icon: PenLine, label: '3-Angle Proposal Studio', vi: 'Soạn Proposal' },
  { id: 'bid', icon: Calculator, label: 'Bid & Milestones', vi: 'Tính giá thầu' },
  { id: 'radar', icon: Radar, label: 'Niche Radar & Boolean', vi: 'Radar săn việc' },
  { id: 'scanner', icon: Satellite, label: 'Job Scanner hàng loạt', vi: 'Quét & xếp hạng job' },
  { id: 'pipeline', icon: KanbanSquare, label: 'Deal Pipeline CRM', vi: 'Phễu & thống kê' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const { notify } = useToast();
  const [tab, setTab] = useLocalStorage<TabId>('udc.tab', 'analyzer');
  const [job, setJob] = useLocalStorage<JobInput>('udc.job', { ...SAMPLE_JOBS[0] });
  const [projects, setProjects] = useLocalStorage<PortfolioProject[]>('udc.projects', PORTFOLIO_PROJECTS);
  const [deals, setDeals] = useLocalStorage<Deal[]>('udc.deals', sampleDeals);
  const [propOpts, setPropOpts] = useLocalStorage<ProposalOptions>('udc.proposalOptions', DEFAULT_PROPOSAL_OPTIONS);
  const [bidOpts, setBidOpts] = useLocalStorage<BidOptions>('udc.bidOptions', DEFAULT_BID_OPTIONS);
  const [activeAngle, setActiveAngle] = useState<ProposalAngleId>('prototype');
  const [search, setSearch] = useState('');

  const full = useMemo(() => analyzeJob(job, projects, bidOpts), [job, projects, bidOpts]);

  // selection & manual edits are scoped to the current job
  const jobKey = `${job.title}|${job.description}|${projects.map((p) => p.id).join(',')}`;
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({ key: '', ids: [] });
  const [editState, setEditState] = useState<{ key: string; edits: Partial<Record<ProposalAngleId, string>> }>({ key: '', edits: {} });
  const selectedIds = selection.key === jobKey ? selection.ids.filter((id) => projects.some((p) => p.id === id)) : full.defaultProjectIds;
  const edits = editState.key === jobKey ? editState.edits : {};
  const setSelectedIds = (ids: string[]) => setSelection({ key: jobKey, ids });
  const setEdit = (angle: ProposalAngleId, text: string | undefined) =>
    setEditState({ key: jobKey, edits: { ...edits, [angle]: text } });

  const ctx = useMemo(
    () => buildContext(job, full.analysis, full.win, full.matches, selectedIds, full.bid),
    [job, full, selectedIds],
  );
  const proposals = useMemo(() => generateAllProposals(ctx, propOpts), [ctx, propOpts]);

  const saveToCrm = () => {
    const pr = proposals.find((p) => p.angle === activeAngle) ?? proposals[0];
    const deal = createDeal({
      title: job.title || 'Untitled job',
      niche: full.analysis.primaryNiche,
      contractType: job.contractType,
      clientCountry: job.client.country,
      winRate: full.win.total,
      projectIds: ctx.projects.map((p) => p.id),
      proposalAngle: pr.angle,
      proposalText: edits[pr.angle] ?? pr.text,
      bidAmount: full.bid.selected.gross,
      milestones: full.bid.milestones,
      connects: full.bid.connectsSuggested,
      notes: `Verdict ${full.win.verdict} · Bid ${full.bid.selected.label}`,
      jobDescription: job.description,
    });
    setDeals([deal, ...deals]);
    notify(`💾 Đã lưu "${deal.title.slice(0, 40)}" vào Pipeline CRM`);
  };

  const results = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: { kind: string; label: string; act: () => void }[] = [];
    SAMPLE_JOBS.filter((j) => `${j.title} ${j.description}`.toLowerCase().includes(s)).forEach((j) =>
      out.push({ kind: 'Job mẫu', label: j.label, act: () => { setJob({ ...j }); setTab('analyzer'); } }),
    );
    projects.filter((p) => `${p.name} ${p.stack.join(' ')} ${p.summaryVi}`.toLowerCase().includes(s)).forEach((p) =>
      out.push({ kind: 'Dự án', label: `${p.code} · ${p.shortName}`, act: () => setTab('portfolio') }),
    );
    deals.filter((d) => `${d.title} ${d.notes}`.toLowerCase().includes(s)).forEach((d) =>
      out.push({ kind: 'Deal', label: d.title, act: () => setTab('pipeline') }),
    );
    TABS.filter((t) => `${t.label} ${t.vi}`.toLowerCase().includes(s)).forEach((t) => out.push({ kind: 'Phân hệ', label: t.label, act: () => setTab(t.id) }));
    return out.slice(0, 10);
  }, [search, projects, deals, setJob, setTab]);

  const niche = NICHE_BY_ID[full.analysis.primaryNiche];

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-studio-700 bg-studio-900 lg:flex">
        <div className="border-b border-studio-700 p-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <div>
              <p className="text-sm font-bold leading-tight text-white">Upwork Deal Closer</p>
              <p className="text-[11px] text-accent">Portfolio Matcher Studio</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2" data-testid="sidebar-nav">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-testid={`nav-${t.id}`}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  tab === t.id ? 'bg-accent/15 text-accent' : 'text-slate-300 hover:bg-studio-800 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{i + 1}. {t.label}</span>
                  <span className="block text-[11px] text-slate-500">{t.vi}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-studio-700 p-4 text-[11px] leading-relaxed text-slate-500">
          <p className="font-semibold text-slate-300">{CORE_POSITIONING.name} · {CORE_POSITIONING.roles[0]}</p>
          <p>{CORE_POSITIONING.hardware}</p>
          <p className="mt-1">{CORE_POSITIONING.signatureMetrics.map((m) => m.value).slice(0, 4).join(' · ')}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-studio-700 bg-studio-950/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Đang phân tích · {niche.emoji} {niche.name}</p>
              <p className="truncate text-sm font-semibold text-white" data-testid="current-job-title">{job.title || 'Chưa có Job — dán JD ở Phân hệ 1'}</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input className="input pl-8" placeholder="Tìm nhanh job, dự án, deal…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="global-search" />
              {results.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-lg border border-studio-600 bg-studio-850 p-1 shadow-2xl">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button type="button" className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-studio-700" onClick={() => { r.act(); setSearch(''); }}>
                        <span className="mr-2 text-[10px] uppercase text-accent">{r.kind}</span>
                        <span className="text-slate-200">{r.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-studio-700 bg-studio-900 px-3 py-1.5">
              <span className="text-[11px] text-slate-400">Win-Rate</span>
              <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor(full.win.total) }} data-testid="header-win-rate">{full.win.total}%</span>
              <span className="text-[11px] text-slate-400">· Bid</span>
              <span className="text-sm font-semibold text-white">{full.bid.selected.rate !== undefined ? `$${full.bid.selected.rate}/h` : formatUsd(full.bid.selected.gross)}</span>
            </div>
            <button type="button" className="btn-primary" onClick={saveToCrm} data-testid="save-to-crm">
              <Save size={15} /> 💾 Lưu vào Pipeline CRM
            </button>
          </div>
          {/* mobile tabs */}
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
            {TABS.map((t, i) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`shrink-0 rounded-md px-2.5 py-1 text-xs ${tab === t.id ? 'bg-accent text-studio-950' : 'bg-studio-800 text-slate-300'}`}>
                {i + 1}. {t.vi}
              </button>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4" data-testid={`panel-${tab}`}>
          {tab === 'analyzer' && <JobAnalyzer job={job} setJob={setJob} full={full} goTo={(t) => setTab(t as TabId)} />}
          {tab === 'translate' && <JdTranslator job={job} full={full} />}
          {tab === 'scanner' && (
            <JobScanner
              projects={projects}
              deals={deals}
              setDeals={setDeals}
              onAnalyze={(j) => {
                setJob({ ...j });
                setTab('analyzer');
                notify('🔍 Đã nạp job vào Phân hệ 1');
              }}
            />
          )}
          {tab === 'portfolio' && (
            <PortfolioMatcher
              matches={full.matches}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              projects={projects}
              setProjects={setProjects}
              resetProjects={() => setProjects(PORTFOLIO_PROJECTS)}
            />
          )}
          {tab === 'proposal' && (
            <ProposalStudio
              proposals={proposals}
              options={propOpts}
              setOptions={setPropOpts}
              edits={edits}
              setEdit={setEdit}
              activeAngle={activeAngle}
              setActiveAngle={setActiveAngle}
              diagram={ctx.diagram}
              jobTitle={job.title}
              clientTerms={[...ctx.terms.slice(0, 6), ...ctx.projects.map((p) => p.shortName)]}
            />
          )}
          {tab === 'bid' && <BidCalculator bid={full.bid} options={bidOpts} setOptions={setBidOpts} winRate={full.win.total} />}
          {tab === 'radar' && <NicheRadar initialNiche={full.analysis.primaryNiche} />}
          {tab === 'pipeline' && <PipelineCRM deals={deals} setDeals={setDeals} resetDeals={() => setDeals(sampleDeals())} connectPrice={bidOpts.connectPrice} />}
        </main>
      </div>
    </div>
  );
}
