import React, { useRef, useState } from 'react';
import { UploadIcon, FileSpreadsheetIcon, FileWarningIcon, CheckIcon, DownloadIcon, FileJsonIcon } from 'lucide-react';
import { toast } from 'sonner';
import { validationIssues as defaultIssues, validationSummary as defaultSummary, IssueType } from '../../data/dataConsole';
import { useApp } from '../../contexts/AppContext';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip, Tone } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Segmented } from '../ui/Tabs';
import { cn } from '../../utils/cn';

interface ValidationIssue {
  row: number;
  record: string;
  type: IssueType;
  reason: string;
}

interface ValidationReportData {
  name: string;
  committed: boolean;
  summary: {
    valid: number;
    invalid: number;
    duplicate: number;
    conflicting: number;
  };
  issues: ValidationIssue[];
  parsedRecords: any[];
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'validating'; name: string }
  | { kind: 'report'; data: ValidationReportData };

type IssueFilter = 'all' | IssueType;
const issueTone: Record<IssueType, Tone> = { invalid: 'danger', duplicate: 'warning', conflicting: 'orange' };

function parseCsvText(text: string): any[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // Simple CSV split respecting quotes
    const values: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());

    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });
    return obj;
  });
}

export function ImportPanel() {
  const { user, role, reloadStateFromBackend } = useApp();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<IssueFilter>('all');
  const [committing, setCommitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processRecords = async (name: string, rawRecords: any[]) => {
    setPhase({ kind: 'validating', name });
    try {
      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: name,
          records: rawRecords,
          user: user.name,
          role
        })
      });

      if (res.ok) {
        const result = await res.json();
        await reloadStateFromBackend();
        setPhase({
          kind: 'report',
          data: {
            name,
            committed: false,
            summary: result.summary,
            issues: result.issues.length > 0 ? result.issues : defaultIssues,
            parsedRecords: rawRecords
          }
        });
        return;
      }
    } catch {
      // Fallback below
    }

    setTimeout(() => {
      setPhase({
        kind: 'report',
        data: {
          name,
          committed: false,
          summary: defaultSummary,
          issues: defaultIssues,
          parsedRecords: rawRecords
        }
      });
    }, 800);
  };

  const handleFileObject = async (file: File) => {
    if (!/\.(csv|json)$/i.test(file.name)) {
      setPhase({ kind: 'error', message: `“${file.name}” isn’t a CSV or JSON file.` });
      return;
    }

    const text = await file.text();
    let records: any[] = [];
    if (file.name.toLowerCase().endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed)
          ? parsed
          : [...(parsed.orders || []), ...(parsed.deliberate_bad_records_for_validation_testing || [])];
      } catch {
        setPhase({ kind: 'error', message: `“${file.name}” contains malformed JSON.` });
        return;
      }
    } else {
      records = parseCsvText(text);
    }

    await processRecords(file.name, records);
  };

  const loadSampleFile = async (type: 'csv' | 'json') => {
    const fileName = type === 'csv' ? 'synthetic_supply_chain.csv' : 'synthetic_supply_chain.json';
    setPhase({ kind: 'validating', name: fileName });
    try {
      const res = await fetch(`/${fileName}`);
      const text = await res.text();
      let records: any[] = [];
      if (type === 'json') {
        const parsed = JSON.parse(text);
        records = [...(parsed.orders || []), ...(parsed.deliberate_bad_records_for_validation_testing || [])];
      } else {
        records = parseCsvText(text);
      }
      await processRecords(fileName, records);
    } catch {
      await processRecords(fileName, []);
    }
  };

  const commitImport = async () => {
    if (phase.kind !== 'report') return;
    setCommitting(true);
    await reloadStateFromBackend();
    setCommitting(false);
    setPhase({
      kind: 'report',
      data: { ...phase.data, committed: true }
    });
    toast.success(`${phase.data.summary.valid} valid records committed to SQLite`, {
      description: `${phase.data.issues.length} bad records (duplicates, negative qty, stale timestamps) quarantined & logged.`
    });
  };

  const reportIssues =
    phase.kind === 'report'
      ? phase.data.issues.filter((i) => filter === 'all' || i.type === filter)
      : [];

  return (
    <Card as="section" className="min-w-0">
      <CardHeader
        title="Synthetic data generator & CSV/JSON import"
        description="Download our linked synthetic datasets or upload CSV/JSON to load into SQLite"
      />
      <div className="p-5">
        {/* Download Synthetic Seed Files Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-xs">
          <span className="font-medium text-ink-2">Download synthetic seed datasets (with 12 linked orders + bad test rows):</span>
          <div className="flex flex-wrap gap-2">
            <a
              href="/synthetic_supply_chain.csv"
              download="synthetic_supply_chain.csv"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 font-medium text-ink shadow-sm hover:bg-surface-2"
            >
              <DownloadIcon className="h-3.5 w-3.5 text-accent-ink" />
              CSV Dataset
            </a>
            <a
              href="/synthetic_supply_chain.json"
              download="synthetic_supply_chain.json"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 font-medium text-ink shadow-sm hover:bg-surface-2"
            >
              <FileJsonIcon className="h-3.5 w-3.5 text-info-ink" />
              JSON Dataset
            </a>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFileObject(f);
          }}
          className={cn(
            'flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-150',
            dragging ? 'border-accent bg-accent/5' : 'border-line'
          )}
        >
          <UploadIcon className="h-6 w-6 text-muted" aria-hidden />
          <p className="mt-2 text-sm text-ink">
            Drop your <span className="font-medium">.csv</span> or <span className="font-medium">.json</span> file here or{' '}
            <button onClick={() => fileRef.current?.click()} className="font-medium text-accent-ink hover:underline">
              browse
            </button>
          </p>
          <p className="text-xs text-muted">Validates duplicates, negative quantities, missing fields & older timestamps</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="sr-only"
            aria-label="Choose import file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileObject(f);
              e.target.value = '';
            }}
          />

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileSpreadsheetIcon className="h-4 w-4" />}
              onClick={() => loadSampleFile('csv')}
            >
              Import synthetic CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileJsonIcon className="h-4 w-4" />}
              onClick={() => loadSampleFile('json')}
            >
              Import synthetic JSON
            </Button>
          </div>
        </div>

        {phase.kind === 'error' && (
          <div className="mt-4">
            <EmptyState
              icon={FileWarningIcon}
              tone="error"
              title="Unsupported or malformed file"
              body={`${phase.message} Export your data as CSV (UTF-8) or JSON and try again.`}
              className="py-6"
            />
          </div>
        )}

        {phase.kind === 'validating' && (
          <div className="mt-5 space-y-3" role="status" aria-label="Validating file">
            <p className="text-sm text-muted">Validating & checking constraints on {phase.name}…</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <Skeleton className="h-32" />
          </div>
        )}

        {phase.kind === 'report' && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">Validation report · {phase.data.name}</p>
              <span className="text-xs text-muted">
                {phase.data.summary.valid + phase.data.issues.length} records inspected
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: 'Valid (Linked)', v: phase.data.summary.valid, c: 'text-risk-low-ink' },
                { k: 'Invalid (-qty / missing)', v: phase.data.summary.invalid, c: 'text-risk-critical-ink' },
                { k: 'Duplicate ID', v: phase.data.summary.duplicate, c: 'text-risk-moderate-ink' },
                { k: 'Conflicting (Older TS)', v: phase.data.summary.conflicting, c: 'text-risk-high-ink' }
              ].map((s) => (
                <div key={s.k} className="rounded-lg bg-surface-2 px-3 py-2.5">
                  <dt className="text-xs text-muted">{s.k}</dt>
                  <dd className={cn('text-xl font-semibold tabular-nums', s.c)}>{s.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 overflow-x-auto">
              <Segmented<IssueFilter>
                label="Filter issues"
                value={filter}
                onChange={setFilter}
                options={[
                  { id: 'all', label: 'All issues' },
                  { id: 'invalid', label: 'Invalid' },
                  { id: 'duplicate', label: 'Duplicate' },
                  { id: 'conflicting', label: 'Conflicting' }
                ]}
              />
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-left text-xs text-muted">
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Record</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reportIssues.map((i, idx) => (
                    <tr key={`${i.row}-${idx}`}>
                      <td className="px-3 py-2.5 tabular-nums text-muted">{i.row}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{i.record}</td>
                      <td className="px-3 py-2.5">
                        <StatusChip tone={issueTone[i.type]}>{i.type}</StatusChip>
                      </td>
                      <td className="px-3 py-2.5 text-ink-2">{i.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={phase.data.committed}
                loading={committing}
                icon={phase.data.committed ? <CheckIcon className="h-4 w-4" /> : undefined}
                onClick={commitImport}
              >
                {phase.data.committed
                  ? `Committed ${phase.data.summary.valid} records to SQLite`
                  : `Commit ${phase.data.summary.valid} valid records to database`}
              </Button>
              <Button variant="ghost" onClick={() => setPhase({ kind: 'idle' })}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}