import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataQuality } from '../../data/users';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

export function DataQuality() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {dataQuality.totals.map((t) =>
        <Card key={t.label} className="p-4">
            <dt className="text-[13px] text-muted">{t.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{t.value}</dd>
            <dd className="mt-0.5 text-xs text-muted">{t.note}</dd>
          </Card>
        )}
      </dl>
      <Card as="section">
        <CardHeader
          title="By source · last 30 days"
          action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/data')}>
              Open import console
            </Button>
          } />
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-4 py-3 text-right font-medium">Records</th>
                <th className="px-4 py-3 text-right font-medium">Duplicates</th>
                <th className="px-4 py-3 text-right font-medium">Invalid</th>
                <th className="px-5 py-3 text-right font-medium">Conflicts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dataQuality.bySource.map((s) =>
              <tr key={s.source}>
                  <td className="px-5 py-3 text-ink">{s.source}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-2">{s.records.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-risk-moderate-ink">{s.duplicates}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-risk-critical-ink">{s.invalid}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-risk-high-ink">{s.conflicts}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}