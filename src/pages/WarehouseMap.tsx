import React, { useState } from 'react';
import { LockIcon, MapPinIcon, ClockIcon, ClipboardCheckIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { warehouses as seed } from '../data/warehouses';
import { Warehouse } from '../types/domain';
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

const roleTone: Record<Warehouse['role'], Tone> = { Affected: 'danger', 'Transfer source': 'accent', Nearby: 'neutral' };

function stockLevel(w: Warehouse) {
  if (w.role === 'Affected') return w.stock < 50 ? riskHex.Critical : riskHex.High;
  return w.stock >= 100 ? riskHex.Low : riskHex.Moderate;
}

export function WarehouseMap() {
  const { role, logAudit } = useApp();
  const [items, setItems] = useState<Warehouse[]>(seed);
  const [selectedId, setSelectedId] = useState('WH-BLR-02');
  const [reveal, setReveal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [count, setCount] = useState('');
  const [countError, setCountError] = useState('');

  const isParent = role === 'parent_company';
  const isOperator = role === 'warehouse_operator';
  const showQty = isParent && reveal;
  const selected = items.find((w) => w.id === selectedId) as Warehouse;

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
    setItems((ws) => ws.map((w) => w.id === selected.id ? { ...w, stock: n, lastCount: nowStamp() } : w));
    logAudit({ action: 'Data update', target: `${selected.id} · ICM-220`, reason: 'Physical stock count confirmed', before: `On hand: ${before}`, after: `On hand: ${n}` });
    toast.success(`Stock confirmed at ${selected.id}`, { description: n === before ? 'Count matches system record' : `Adjusted ${before} → ${n}` });
    setConfirmOpen(false);
    setCount('');
    setCountError('');
  };

  const Qty = ({ w }: {w: Warehouse;}) =>
  showQty ?
  <span className="text-sm font-semibold tabular-nums text-ink">{w.stock}</span> :

  <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted">
        <LockIcon className="h-3 w-3" aria-hidden /> Restricted
      </span>;


  return (
    <>
      <PageHeader
        title="Warehouses & inventory"
        description="Nearby sites for ICM-220 relative to Chennai. Stock quantities belong to Kaveri Industries and are masked for delivery-partner roles."
        actions={
        <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <Switch
            checked={showQty}
            onChange={setReveal}
            disabled={!isParent}
            label="Reveal stock levels"
            description={isParent ? 'Parent Company view' : 'Parent Company only'} />
          
          </div>
        } />
      

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="order-2 self-start lg:order-1">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-semibold text-ink">Sites by distance</h2>
            <p className="text-xs text-muted">From WH-CHN-01 · road ETA</p>
          </div>
          <ul className="divide-y divide-line">
            {items.map((w) =>
            <li key={w.id}>
                <button
                onClick={() => setSelectedId(w.id)}
                aria-pressed={w.id === selectedId}
                className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2', w.id === selectedId && 'bg-accent/5')}>
                
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
            )}
          </ul>
        </Card>

        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          <MapView className="h-[340px] md:h-[440px]" markers={markers} center={[13.0, 79.2]} zoom={6} selectedId={selectedId} onSelect={setSelectedId} fitBounds />

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
              <Button
                variant={isOperator ? 'primary' : 'secondary'}
                icon={<ClipboardCheckIcon className="h-4 w-4" />}
                disabled={!isOperator}
                onClick={() => {
                  setCount(String(selected.stock));
                  setConfirmOpen(true);
                }}
                title={isOperator ? undefined : 'Only a Warehouse Operator can confirm stock'}>
                
                Confirm stock
              </Button>
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
                <dd className="mt-1 text-sm text-ink">{selected.role === 'Transfer source' ? 'Yes · verified' : selected.role === 'Affected' ? 'No · short' : 'Partial'}</dd>
              </div>
            </dl>
            {!isOperator && <p className="mt-4 text-xs text-muted">Switch to Warehouse Operator to confirm a physical stock count.</p>}
          </Card>
        </div>
      </div>

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
        }>
        
        <Field label="Counted quantity" htmlFor="count" required error={countError} hint={`System record: ${selected.stock} units`}>
          <input id="count" type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} className={inputClass} />
        </Field>
      </Modal>
    </>);

}