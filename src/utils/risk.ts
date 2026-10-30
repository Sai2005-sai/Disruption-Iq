import { RiskLevel, Severity } from '../types/domain';

export const riskHex: Record<RiskLevel, string> = {
  Low: '#16A34A',
  Moderate: '#D97706',
  High: '#EA580C',
  Critical: '#DC2626'
};

export const riskStyles: Record<RiskLevel, {badge: string;dot: string;text: string;bar: string;soft: string;}> = {
  Low: {
    badge: 'bg-risk-low/10 text-risk-low-ink ring-risk-low/25',
    dot: 'bg-risk-low',
    text: 'text-risk-low-ink',
    bar: 'bg-risk-low',
    soft: 'bg-risk-low/10 border-risk-low/30'
  },
  Moderate: {
    badge: 'bg-risk-moderate/10 text-risk-moderate-ink ring-risk-moderate/25',
    dot: 'bg-risk-moderate',
    text: 'text-risk-moderate-ink',
    bar: 'bg-risk-moderate',
    soft: 'bg-risk-moderate/10 border-risk-moderate/30'
  },
  High: {
    badge: 'bg-risk-high/10 text-risk-high-ink ring-risk-high/25',
    dot: 'bg-risk-high',
    text: 'text-risk-high-ink',
    bar: 'bg-risk-high',
    soft: 'bg-risk-high/10 border-risk-high/30'
  },
  Critical: {
    badge: 'bg-risk-critical/10 text-risk-critical-ink ring-risk-critical/25',
    dot: 'bg-risk-critical',
    text: 'text-risk-critical-ink',
    bar: 'bg-risk-critical',
    soft: 'bg-risk-critical/10 border-risk-critical/30'
  }
};

export const severityToRisk: Record<Severity, RiskLevel> = {
  Minor: 'Low',
  Moderate: 'Moderate',
  Major: 'High',
  Critical: 'Critical'
};

export const severityRank: Record<Severity | 'Unclassified', number> = {
  Unclassified: 0,
  Minor: 1,
  Moderate: 2,
  Major: 3,
  Critical: 4
};

export function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Low';
}

export function scoreOf(factors: {points: number;}[]): number {
  return factors.reduce((sum, f) => sum + f.points, 0);
}