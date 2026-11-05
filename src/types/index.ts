// ─────────────────────────────────────────────────────────────
// Upwork Deal Closer Studio — strict domain types
// ─────────────────────────────────────────────────────────────

export type NicheId = 'video' | 'agents' | 'localai' | '3d' | 'ota';
export type ContractType = 'fixed' | 'hourly';
export type Difficulty = 1 | 2 | 3 | 4 | 5;

// ── Portfolio ────────────────────────────────────────────────
export interface Metric {
  label: string;
  value: string;
}

export interface LoomSegment {
  start: string; // "0:00"
  end: string; // "0:15"
  actionVi: string; // what to open / click (Vietnamese, for Dũng)
  sayEn: string; // what to say on camera
  sayVi: string; // Vietnamese translation
}

export interface PortfolioProject {
  id: string;
  code: string; // "P1"
  name: string;
  shortName: string;
  localPath?: string;
  github?: string;
  niches: NicheId[];
  taglineEn: string;
  summaryVi: string;
  stack: string[];
  /** lexicon ids this project proves */
  keywords: string[];
  highlightsVi: string[];
  metrics: Metric[];
  proofOfWork: string; // English, copy-ready
  demoAsset: string; // what to show (screen / video)
  reusableModules: string[];
  loomScript: LoomSegment[];
  custom?: boolean;
}

export interface CorePositioning {
  name: string;
  roles: string[];
  headlineEn: string;
  uniqueEdgeVi: string;
  uniqueEdgeEn: string;
  hardware: string;
  llmStack: string[];
  signatureMetrics: Metric[];
}

// ── Knowledge base ───────────────────────────────────────────
export interface TechTerm {
  id: string;
  label: string;
  aliases: string[]; // lowercase match phrases
  niches: NicheId[];
  difficulty: Difficulty;
  /** true when Dũng has shipped real work with it */
  dungHas: boolean;
  implies?: string[]; // ids of implied (unstated) tech
}

export interface EdgeCase {
  id: string;
  title: string;
  triggers: string[]; // lexicon ids
  niche: NicheId;
  trapEn: string;
  fixEn: string;
  noteVi: string;
  provenBy: string; // project id
}

export interface NicheProfile {
  id: NicheId;
  emoji: string;
  name: string;
  nameVi: string;
  coreTerms: string[]; // boolean OR group
  plusTerms: string[]; // optional add-on terms
  defaultExcludes: string[];
  minHourly: number;
  marketRate: number; // $/h typical market for this niche
  profileTitle: string;
  profileOverview: string;
  skills: string[];
  pipelineVi: string;
}

// ── Job input ────────────────────────────────────────────────
export interface ClientInfo {
  country: string;
  paymentVerified: boolean;
  totalSpent: number; // USD
  hireRate: number; // %
  proposals: number; // current proposals count
  rating?: number; // 0-5
}

export interface JobInput {
  id?: string;
  title: string;
  description: string;
  contractType: ContractType;
  budget: number; // fixed-price budget in USD (0 = not set)
  hourlyMin: number;
  hourlyMax: number;
  client: ClientInfo;
  url?: string;
}

export interface SampleJob extends JobInput {
  id: string;
  niche: NicheId;
  label: string;
}

// ── Analysis ─────────────────────────────────────────────────
export interface DetectedKeyword {
  term: TechTerm;
  count: number;
  inTitle: boolean;
}

export interface PainPoint {
  id: string;
  titleEn: string;
  titleVi: string;
  evidence: string;
  addressEn: string;
}

export type FlagSeverity = 'low' | 'medium' | 'high';

export interface Flag {
  id: string;
  textEn: string;
  textVi: string;
  severity: FlagSeverity;
}

export interface JobAnalysis {
  keywords: DetectedKeyword[];
  matchedIds: string[];
  mismatchIds: string[];
  impliedStack: TechTerm[];
  nicheScores: Record<NicheId, number>; // 0-100 share
  primaryNiche: NicheId;
  painPoints: PainPoint[];
  redFlags: Flag[];
  greenFlags: Flag[];
  edgeCases: EdgeCase[];
  deliverables: string[];
  wordCount: number;
  avgDifficulty: number;
}

export interface ScoreDimension {
  key: 'stack' | 'prototype' | 'moat' | 'reuse' | 'client';
  label: string;
  labelVi: string;
  score: number; // 0-100
  weight: number; // 0-1
  explanationVi: string;
}

export type Verdict = 'MUST-BID' | 'STRONG' | 'CONSIDER' | 'SKIP';

export interface WinRateResult {
  total: number; // 0-100
  dimensions: ScoreDimension[];
  verdict: Verdict;
  verdictVi: string;
  reuseMultiplier: number;
}

export interface ProjectMatch {
  project: PortfolioProject;
  score: number; // 0-100
  matchedKeywords: string[]; // labels
  reasonsVi: string[];
}

// ── Proposal ─────────────────────────────────────────────────
export type Tone = 'punchy' | 'technical' | 'executive';
export type ProposalAngleId = 'prototype' | 'architect' | 'delivery';
export type DiagramFormat = 'ascii' | 'mermaid';

export interface ProposalOptions {
  tone: Tone;
  includeQuestions: boolean;
  includeDiagram: boolean;
  diagramFormat: DiagramFormat;
  clientName?: string;
}

export interface LintIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  messageVi: string;
}

export interface LintResult {
  preview: string; // above-the-fold ~200 chars
  hookScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: LintIssue[];
}

export interface Proposal {
  angle: ProposalAngleId;
  emoji: string;
  title: string;
  titleVi: string;
  body: string; // core letter (word-count governed)
  text: string; // body + optional add-ons, copy-ready
  bodyWordCount: number;
  targetWords: [number, number];
  strategyVi: string[];
  summaryVi: string;
  lint: LintResult;
}

export interface ArchitectureStage {
  id: string;
  label: string;
  detail: string;
}

export interface ArchitectureDiagram {
  title: string;
  stages: ArchitectureStage[];
  mermaid: string;
  ascii: string;
}

// ── Bid ──────────────────────────────────────────────────────
export type BidTierId = 'aggressive' | 'optimal' | 'premium';

export interface BidTier {
  id: BidTierId;
  label: string;
  labelVi: string;
  gross: number; // USD client pays (fixed) or est. contract value (hourly)
  rate?: number; // hourly rate (hourly contracts)
  fee: number;
  net: number;
  netVnd: number;
  effectiveHourly: number; // net per real Dũng hour
  rationaleVi: string;
}

export interface Milestone {
  index: number;
  title: string;
  percent: number;
  amount: number;
  deliverables: string[];
}

export interface BidOptions {
  vndRate: number;
  tier: BidTierId;
  milestoneCount?: 3 | 4;
  connectPrice: number; // USD per connect
}

export interface BidResult {
  contractType: ContractType;
  marketHours: number;
  dungHours: number;
  reuseMultiplier: number;
  marketRate: number;
  tiers: BidTier[];
  selected: BidTier;
  milestones: Milestone[];
  connectsSuggested: number;
  connectsCostUsd: number;
  expectedValue: number; // winRate * net
  connectsRoi: number; // expectedValue / connectsCost
  daysToDeliver: number;
}

// ── Boolean search ───────────────────────────────────────────
export interface BooleanOptions {
  coreTerms: string[];
  plusTerms: string[];
  excludeTerms: string[];
  excludeStyle: 'NOT' | 'minus';
  paymentVerified: boolean;
  minBudget: number;
  minHourly: number;
  contractType: 'any' | ContractType;
}

// ── CRM ──────────────────────────────────────────────────────
export type DealStage = 'saved' | 'sent' | 'interviewing' | 'won' | 'archived';

export interface Deal {
  id: string;
  createdAt: string;
  updatedAt: string;
  stage: DealStage;
  title: string;
  niche: NicheId;
  contractType: ContractType;
  clientCountry: string;
  winRate: number;
  projectIds: string[];
  proposalAngle: ProposalAngleId;
  proposalText: string;
  bidAmount: number;
  milestones: Milestone[];
  connects: number;
  notes: string;
  jobDescription: string;
  sentAt?: string;
  repliedAt?: string;
  wonAt?: string;
}

export interface CrmStats {
  total: number;
  sent: number;
  replied: number;
  won: number;
  replyRate: number; // %
  winRate: number; // %
  connects: number;
  connectsUsd: number;
  pipelineValue: number;
  wonValue: number;
  byStage: Record<DealStage, number>;
}

// ── LLM bridge ───────────────────────────────────────────────
export type LlmProvider = 'claude' | 'openai' | 'gemini' | 'ollama';

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  baseUrl?: string; // for ollama
}

export interface LlmRequest {
  url: string;
  init: { method: 'POST'; headers: Record<string, string>; body: string };
}

// ── Vietnamese translation ───────────────────────────────────
export type TranslateEngine = 'google' | 'llm';

export interface TranslatedBlock {
  en: string;
  vi: string;
}

export interface JobTranslation {
  engine: TranslateEngine;
  titleVi: string;
  blocks: TranslatedBlock[];
  createdAt: string;
}

export interface ViBriefItem {
  vi: string;
  en?: string;
}

export interface ViBriefSection {
  id: string;
  title: string;
  items: ViBriefItem[];
}

export interface ViBrief {
  headline: string;
  sections: ViBriefSection[];
}

// ── Batch job scanner ────────────────────────────────────────
export interface ScannedJob {
  id: string; // stable hash of title + description
  job: JobInput;
  postedText?: string;
  /** fields the parser could not find (defaults were used) */
  missing: string[];
}

export interface ScanResult {
  scanned: ScannedJob;
  winRate: number;
  verdict: Verdict;
  niche: NicheId;
  topProject: string;
  topProjectScore: number;
  bidLabel: string;
  redFlags: number;
  duplicateOf?: string; // CRM deal id
}
