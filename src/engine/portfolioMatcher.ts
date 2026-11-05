import type { JobAnalysis, PortfolioProject, ProjectMatch } from '../types';
import { keywordWeight } from './jdAnalyzer';
import { clamp, round } from './text';

/**
 * Rank Dũng's projects against a job.
 * score = 75 × (weighted keyword coverage) + niche bonus (up to 25).
 */
export function matchProjects(analysis: JobAnalysis, projects: PortfolioProject[]): ProjectMatch[] {
  const relevant = analysis.keywords.filter((k) => k.term.dungHas);
  // denominator = ALL detected tech, so out-of-scope stacks (Unity, PHP…) cap the match
  const maxWeight = analysis.keywords.reduce((s, k) => s + keywordWeight(k), 0);

  const matches = projects.map<ProjectMatch>((project) => {
    const kwSet = new Set(project.keywords);
    const hits = relevant.filter((k) => kwSet.has(k.term.id));
    const hitWeight = hits.reduce((s, k) => s + keywordWeight(k), 0);
    const coverage = maxWeight > 0 ? hitWeight / maxWeight : 0;

    const primaryHit = project.niches.includes(analysis.primaryNiche);
    const secondaryShare = Math.max(
      0,
      ...project.niches.filter((n) => n !== analysis.primaryNiche).map((n) => analysis.nicheScores[n]),
    );
    const nicheBonus = primaryHit ? 25 : secondaryShare >= 20 ? 12 : secondaryShare >= 8 ? 5 : 0;
    const score = clamp(round(coverage * 75 + nicheBonus), 0, 100);

    const reasonsVi: string[] = [];
    if (hits.length) reasonsVi.push(`Khớp ${hits.length} công nghệ: ${hits.slice(0, 5).map((h) => h.term.label).join(', ')}`);
    if (primaryHit) reasonsVi.push(`Đúng ngách chính của Job (${analysis.primaryNiche})`);
    const edge = analysis.edgeCases.filter((e) => e.provenBy === project.id);
    if (edge.length) reasonsVi.push(`Đã giải quyết thực tế ${edge.length} bẫy kỹ thuật: ${edge.map((e) => e.title).join('; ')}`);
    if (!reasonsVi.length) reasonsVi.push('Ít liên quan trực tiếp — chỉ dùng làm bằng chứng năng lực tổng quát');

    return { project, score, matchedKeywords: hits.map((h) => h.term.label), reasonsVi };
  });

  // tie-breaker: proven edge cases
  return matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ea = analysis.edgeCases.filter((e) => e.provenBy === a.project.id).length;
    const eb = analysis.edgeCases.filter((e) => e.provenBy === b.project.id).length;
    return eb - ea;
  });
}

/** Default selection: best match + the runner-up when it is close (≥ 45 and within 15 points). */
export function defaultSelection(matches: ProjectMatch[]): string[] {
  if (!matches.length) return [];
  const best = matches[0].score;
  const picked = matches.filter((m, i) => i === 0 || (m.score >= 45 && best - m.score <= 15)).slice(0, 2);
  return picked.map((m) => m.project.id);
}
