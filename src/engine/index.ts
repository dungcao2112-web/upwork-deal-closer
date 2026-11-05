import type {
  BidOptions,
  BidResult,
  JobAnalysis,
  JobInput,
  PortfolioProject,
  ProjectMatch,
  WinRateResult,
} from '../types';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData';
import { analyzeJD } from './jdAnalyzer';
import { defaultSelection, matchProjects } from './portfolioMatcher';
import { scoreWinRate } from './winRateScorer';
import { calculateBid, DEFAULT_BID_OPTIONS } from './bidCalculator';

export interface FullAnalysis {
  analysis: JobAnalysis;
  matches: ProjectMatch[];
  win: WinRateResult;
  bid: BidResult;
  defaultProjectIds: string[];
}

/** Run the whole deterministic pipeline (0 network, ~1ms). */
export function analyzeJob(
  job: JobInput,
  projects: PortfolioProject[] = PORTFOLIO_PROJECTS,
  bidOptions: BidOptions = DEFAULT_BID_OPTIONS,
): FullAnalysis {
  const analysis = analyzeJD(job);
  const matches = matchProjects(analysis, projects);
  const win = scoreWinRate(job, analysis, matches);
  const bid = calculateBid(job, analysis, win, bidOptions);
  return { analysis, matches, win, bid, defaultProjectIds: defaultSelection(matches) };
}

export * from './jdAnalyzer';
export * from './portfolioMatcher';
export * from './winRateScorer';
export * from './bidCalculator';
export * from './proposalGenerator';
export * from './proposalLinter';
export * from './architecture';
export * from './booleanBuilder';
export * from './crm';
export * from './llmBridge';
export * from './text';
