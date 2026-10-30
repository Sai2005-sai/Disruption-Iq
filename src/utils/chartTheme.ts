import type { CSSProperties } from 'react';

export function chartTheme(dark: boolean) {
  const tooltip: CSSProperties = {
    backgroundColor: dark ? '#111827' : '#FFFFFF',
    border: `1px solid ${dark ? '#273246' : '#E2E8F0'}`,
    borderRadius: 10,
    fontSize: 12,
    color: dark ? '#ECF1F7' : '#0F172A',
    boxShadow: '0 8px 24px -8px rgba(15,23,42,0.2)'
  };
  return {
    grid: dark ? '#273246' : '#E2E8F0',
    tick: dark ? '#8C98AA' : '#64748B',
    primary: dark ? '#E2E8F0' : '#0F2A4A',
    accent: '#14B8A6',
    tooltip,
    cursor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,42,74,0.04)'
  };
}