import React, { useState } from 'react';
import {
  LockIcon,
  MapPinIcon,
  ClockIcon,
  ClipboardCheckIcon,
  UserIcon,
  SparklesIcon,
  CheckCircle2Icon,
  TruckIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  BoxesIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { warehouses as seed } from '../data/warehouses';
import { Warehouse, AiWarehouseReplenishment } from '../types/domain';
import { useApp } from '../contexts/AppContext';
import { nowStamp } from '../utils/format';
import { riskHex } from '../utils/risk';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusChip, Tone } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Switch } from '../components/ui/Switch';
import { MapView } from '../components/ui/MapView';
import { Modal } from '../components/ui/Modal';
import { Field, inputClass } from '../components/ui/Field';
import { cn } from '../utils/cn';

const roleTone: Record<Warehouse['role'], Tone> = {
  Affected: 'danger',
  'Transfer source': 'accent',
  Nearby: 'neutral'
};

function stockLevel(w: Warehouse) {
  if (w.role === 'Affected') return w.stock < 50 ? riskHex.Critical : riskHex.High;
  return w.stock >= 100 ? riskHex.Low : riskHex.Moderate;
}

export function WarehouseMap() {
  const { role, logAudit, solveWarehouseReplenishmentWithAi, executeWarehouseReplenishment, warehouses: dbWarehouses, reloadStateFromBackend } = useApp();
  const [selectedId, setSelectedId] = useState('WH-BLR-02');
  const [reveal, setReveal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [count, setCount] = useState('');
  const [countError, setCountError] = useState('');

  // AI Replenishment State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isSolvingAi, setIsSolvingAi] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [aiPlan, setAiPlan] = useState<AiWarehouseReplenishment | null>(null);

  // Sync warehouse inventory from live database
  const items = React.useMemo<Warehouse[]>(() => {
    if (!dbWarehouses || dbWarehouses.length === 0) return seed;
    return seed.map((s) => {
      const match = dbWarehouses.find((dw) => dw.id === s.id);
      if (!match) return s;
      return {
        ...s,
        stock: match.stock ?? s.stock,
        lastCount: match.lastCount || match.last_count || s.lastCount,
        capacity: match.capacity ?? s.capacity,
        role: match.role || s.role
      };
    });
  }, [dbWarehouses]);

  const isParent = role === 'parent_company';
  const isOperator = role === 'warehouse_operator';
  const showQty = isParent && reveal;
  const selected = items.find((w) => w.id === selectedId) || items[0];

  const markers = items.map((w) => ({
    id: w.id,
    lat: w.lat,
    lng: w.lng,
    color: showQty ? stockLevel(w) : w.role === 'Affected' ? riskHex.Critical : '#0F2A4A',
    label: w.name,
    sublabel: showQty ? `${w.stock} × ICM-220` : w.distanceKm ? `${w.distanceKm} km · ${w.eta}` : 'Affected site',
    radius: w.role === 'Affected' ? 10 : 8
  }));

  const confirmStock = () => {
    const n = Number(count);
    if (!count || Number.isNaN(n) || n < 0) return setCountError('Enter the physical count as a whole number.');
    const before = selected.stock;
    logAudit({
      action: 'Data update',
      target: `${selected.id} · ICM-220`,
      reason: 'Physical stock count confirmed',
      before: `On hand: ${before}`,
      after: `On hand: ${n}`
    });
    toast.success(`Stock confirmed at ${selected.id}`, {
      description: n === before ? 'Count matches system record' : `Adjusted ${before} → ${n}`
    });
    setConfirmOpen(false);
    setCount('');
    setCountError('');
  };

  const handleSolveAi = async () => {
    setIsSolvingAi(true);
    setAiModalOpen(true);
    try {
      const plan = await solveWarehouseReplenishmentWithAi(selected.id);
      setAiPlan(plan);
    } catch (err: any) {
      toast.error('AI replenishment optimization failed', {
        description: err.message || 'Please check your connection and try again.'
      });
    } finally {
      setIsSolvingAi(false);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!aiPlan) return;
    setIsExecuting(true);
    try {
      const sourceId = selected.id === 'WH-BLR-02' ? 'WH-PDY-05' : 'WH-BLR-02';
      const transferQty = 120;
      await executeWarehouseReplenishment(selected.id, sourceId, transferQty);
      await reloadStateFromBackend();

      toast.success('Replenishment transfer executed successfully!', {
        description: `Transferred ${transferQty} units of ICM-220 from ${sourceId} to ${selected.name}.`
      });
      setAiModalOpen(false);
    } catch (err: any) {
      toast.error('Replenishment execution failed', {
        description: err.message || 'Failed to execute transfer.'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const Qty = ({ w }: { w: Warehouse }) =>
    showQty ? (
      <span className="text-sm font-semibold tabular-nums text-ink">{w.stock}</span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted">
        <LockIcon className="h-3 w-3" aria-hidden /> Restricted
      </span>
    );

  return (
    <>
      <PageHeader
        title="Warehouses & inventory"
        description="Regional stocking network for ICM-220 relative to Chennai. Stock quantities are tracked with real-time AI replenishment planning."
        actions={
          <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <Switch
              checked={showQty}
              onChange={setReveal}
              disabled={!isParent}
              label="Reveal stock levels"
              description={isParent ? 'Parent Company view' : 'Parent Company only'}
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="order-2 self-start lg:order-1">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-semibold text-ink">Sites by distance</h2>
            <p className="text-xs text-muted">From WH-CHN-01 · road ETA</p>
          </div>
          <ul className="divide-y divide-line">
            {items.map((w) => (
              <li key={w.id}>
                <button
                  onClick={() => setSelectedId(w.id)}
                  aria-pressed={w.id === selectedId}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2',
                    w.id === selectedId && 'bg-accent/5'
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{w.name}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {w.id} · {w.distanceKm ? `${w.distanceKm} km · ${w.eta}` : 'Origin'}
                    </span>
                    <span className="mt-1.5 block">
                      <StatusChip tone={roleTone[w.role]}>{w.role}</StatusChip>
                    </span>
                  </span>
                  <Qty w={w} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          <MapView
            className="h-[340px] md:h-[440px]"
            markers={markers}
            center={[13.0, 79.2]}
            zoom={6}
            selectedId={selectedId}
            onSelect={setSelectedId}
            fitBounds
          />

          <Card className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">{selected.name}</h2>
                  <StatusChip tone={roleTone[selected.role]}>{selected.role}</StatusChip>
                </div>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
                    {selected.distanceKm ? `${selected.distanceKm} km from Chennai` : 'Affected origin site'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" aria-hidden />
                    {selected.eta === 'Origin' ? '—' : `${selected.eta} by road`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" aria-hidden />
                    {selected.operator}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  icon={<SparklesIcon className="h-4 w-4 text-amber-400" />}
                  onClick={handleSolveAi}
                  loading={isSolvingAi}
                  title="Generate dynamic AI stock replenishment and buffer optimization plan"
                >
                  Solve with AI: Stock Replenishment
                </Button>
                <Button
                  variant="secondary"
                  icon={<ClipboardCheckIcon className="h-4 w-4" />}
                  disabled={!isOperator}
                  onClick={() => {
                    setCount(String(selected.stock));
                    setConfirmOpen(true);
                  }}
                  title={isOperator ? undefined : 'Only a Warehouse Operator can confirm stock'}
                >
                  Confirm stock
                </Button>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted">ICM-220 on hand</dt>
                <dd className="mt-1">
                  <Qty w={selected} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Capacity</dt>
                <dd className="mt-1 text-sm tabular-nums text-ink">{showQty ? `${selected.capacity} units` : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Last count</dt>
                <dd className="mt-1 text-sm text-ink">{selected.lastCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Transfer feasible</dt>
                <dd className="mt-1 text-sm text-ink">
                  {selected.role === 'Transfer source'
                    ? 'Yes · verified'
                    : selected.role === 'Affected'
                    ? 'No · short'
                    : 'Partial'}
                </dd>
              </div>
            </dl>
            {!isOperator && (
              <p className="mt-4 text-xs text-muted">
                Requires Warehouse Operator portal credentials to confirm a physical stock count.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Physical Count Confirmation Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Confirm stock at ${selected.id}`}
        description="ICM-220 Industrial Control Module · physical count"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStock}>Confirm count</Button>
          </>
        }
      >
        <Field label="Counted quantity" htmlFor="count" required error={countError} hint={`System record: ${selected.stock} units`}>
          <input
            id="count"
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Modal>

      {/* AI Stock Replenishment Modal */}
      {aiModalOpen && (
        <Modal
          open={aiModalOpen}
          onClose={() => {
            if (!isSolvingAi && !isExecuting) {
              setAiModalOpen(false);
              setAiPlan(null);
            }
          }}
          title={`Gemini AI Replenishment: ${selected.name} (${selected.id})`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Top Inventory Banner */}
            <div className="rounded-xl border border-line bg-surface-2 p-4 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
                <div className="flex items-center gap-2">
                  <BoxesIcon className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-ink text-sm">{selected.name}</span>
                  <StatusChip tone={roleTone[selected.role]}>{selected.role}</StatusChip>
                </div>
                <div className="text-muted">
                  Capacity: <span className="font-semibold text-ink">{selected.capacity} units</span> · On Hand:{' '}
                  <span className="font-semibold text-ink">{selected.stock} units</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted">
                <div>
                  City: <span className="text-ink font-medium">{selected.city}</span>
                </div>
                <div>
                  Transit to Chennai:{' '}
                  <span className="text-ink font-medium">
                    {selected.distanceKm ? `${selected.distanceKm} km (${selected.eta})` : '0 km (Origin Hub)'}
                  </span>
                </div>
                <div>
                  Site Operator: <span className="text-ink font-medium">{selected.operator}</span>
                </div>
              </div>
            </div>

            {/* AI Loading State */}
            {isSolvingAi && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-sm font-medium text-ink">Analyzing regional network inventory...</p>
                <p className="text-xs text-muted text-center max-w-md">
                  Consulting Gemini AI Supply Chain Agent. Formulating real-time replenishment directives, transfer corridors, and safety buffer optimization.
                </p>
              </div>
            )}

            {/* AI Plan Display */}
            {!isSolvingAi && aiPlan && (
              <div className="space-y-4">
                {/* Stock Assessment */}
                <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <TrendingUpIcon className="h-4 w-4 text-accent" />
                    Inventory Health & Utilization Diagnostic
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2">{aiPlan.stockAssessment}</p>
                </div>

                {/* Recommended Directives */}
                <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <SparklesIcon className="h-4 w-4 text-amber-500" />
                    Recommended Tactical Directives for Stock Filling
                  </div>
                  <div className="space-y-2">
                    {aiPlan.recommendedDirectives.map((directive, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-line/60 bg-surface-2 p-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed text-ink">{directive}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route, ETA & Cost Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-muted">
                      <TruckIcon className="h-3.5 w-3.5 text-accent" />
                      Logistics Transit Corridor
                    </div>
                    <div className="font-semibold text-ink">{aiPlan.transferRoute}</div>
                    <div className="text-[11px] text-muted">ETA: {aiPlan.etaHours}</div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-muted">
                      <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />
                      Estimated Transfer Cost
                    </div>
                    <div className="font-semibold text-ink">₹{aiPlan.estimatedCost.toLocaleString()} INR</div>
                    <div className="text-[11px] text-muted">Handling & freight combined</div>
                  </div>
                </div>

                {/* Risk Reduction & SLA Impact */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2Icon className="h-4 w-4" />
                    Risk Mitigation & Buffer Restoration
                  </div>
                  <p className="leading-relaxed text-ink-2">{aiPlan.riskReduction}</p>
                </div>

                {/* AI Attribution Badge */}
                <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                  <span>Engine: {aiPlan.source}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">High Confidence Diagnostic</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-line">
              <Button
                variant="secondary"
                onClick={() => {
                  setAiModalOpen(false);
                  setAiPlan(null);
                }}
                disabled={isExecuting}
              >
                Close
              </Button>

              {aiPlan && (
                <Button
                  variant="primary"
                  icon={<TruckIcon className="h-4 w-4" />}
                  onClick={handleExecuteTransfer}
                  loading={isExecuting}
                >
                  {selected.role === 'Affected' || selected.id === 'WH-CHN-01'
                    ? 'Execute Replenishment (120 units from WH-BLR-02)'
                    : 'Execute Network Rebalancing Transfer'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}