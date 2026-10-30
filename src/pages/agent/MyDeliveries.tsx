import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, MapPinIcon, NavigationIcon, PackageIcon, FileWarningIcon, InboxIcon } from 'lucide-react';
import { toast } from 'sonner';
import { deliveries, routeHub } from '../../data/deliveries';
import { Delivery, DeliveryStatus } from '../../types/domain';
import { useApp } from '../../contexts/AppContext';
import { useSimulatedLoading } from '../../hooks/useSimulatedLoading';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip, Tone } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Segmented } from '../../components/ui/Tabs';
import { MapView } from '../../components/ui/MapView';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

type Filter = 'all' | 'active' | 'delayed' | 'done';

const statusTone: Record<DeliveryStatus, Tone> = {
  Delivered: 'success',
  'In transit': 'info',
  'Next stop': 'accent',
  Delayed: 'danger',
  Pending: 'neutral'
};

const statusHex: Record<DeliveryStatus, string> = {
  Delivered: '#16A34A',
  'In transit': '#2563EB',
  'Next stop': '#14B8A6',
  Delayed: '#DC2626',
  Pending: '#94A3B8'
};

export function MyDeliveries() {
  const navigate = useNavigate();
  const { user } = useApp();
  const loading = useSimulatedLoading(600);
  const [filter, setFilter] = useState<Filter>('all');

  const next = deliveries.find((d) => d.status === 'Next stop');
  const done = deliveries.filter((d) => d.status === 'Delivered').length;
  const list = useMemo(
    () =>
    deliveries.filter((d) => {
      if (d.id === next?.id) return false;
      if (filter === 'active') return d.status === 'In transit' || d.status === 'Pending';
      if (filter === 'delayed') return d.status === 'Delayed';
      if (filter === 'done') return d.status === 'Delivered';
      return true;
    }),
    [filter, next?.id]
  );

  const markers = [
  { id: 'hub', lat: routeHub.lat, lng: routeHub.lng, color: '#0F2A4A', label: routeHub.label, radius: 7 },
  ...deliveries.map((d) => ({ id: d.id, lat: d.lat, lng: d.lng, color: statusHex[d.status], label: `${d.orderId} · ${d.area}`, sublabel: `${d.status} · ETA ${d.eta}` }))];

  const route: [number, number][] = [[routeHub.lat, routeHub.lng], ...deliveries.map((d) => [d.lat, d.lng] as [number, number])];

  const report = (d: Delivery) => navigate(`/agent/report?order=${d.orderId}`);

  return (
    <>
      <PageHeader
        title={`Good afternoon, ${user.name.split(' ')[0]}`}
        description="Thursday, 29 October · Chennai West route CW-14 · Vehicle TN-09-CK-2210"
        actions={
        <Button variant="secondary" icon={<FileWarningIcon className="h-4 w-4" />} onClick={() => navigate('/agent/report')}>
            Report delay
          </Button>
        } />
      

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {next &&
          <Card className="border-accent/40 p-5">
              {loading ?
            <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div> :

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <StatusChip tone="accent" dot>
                      Next stop
                    </StatusChip>
                    <h2 className="mt-3 text-xl font-semibold text-ink">{next.customer}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPinIcon className="h-4 w-4" aria-hidden /> {next.area}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <PackageIcon className="h-4 w-4" aria-hidden /> {next.packages} packages · {next.orderId}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-end gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted">ETA</p>
                      <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{next.eta}</p>
                      <p className="text-xs text-muted">Window {next.window}</p>
                    </div>
                  </div>
                </div>
            }
              {!loading &&
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button icon={<NavigationIcon className="h-4 w-4" />} onClick={() => toast.success('Navigation started', { description: `Route to ${next.area} · 4.2 km` })}>
                    Navigate
                  </Button>
                  <Button variant="secondary" icon={<FileWarningIcon className="h-4 w-4" />} onClick={() => report(next)}>
                    Report delay
                  </Button>
                </div>
            }
            </Card>
          }

          <Card>
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[15px] font-semibold text-ink">Assigned deliveries</h2>
              <Segmented<Filter>
                label="Filter deliveries"
                value={filter}
                onChange={setFilter}
                options={[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Upcoming' },
                { id: 'delayed', label: 'Delayed' },
                { id: 'done', label: 'Delivered' }]
                } />
              
            </div>
            {loading ?
            <div className="space-y-4 p-5">
                {[0, 1, 2, 3].map((i) =>
              <Skeleton key={i} className="h-14 w-full" />
              )}
              </div> :
            list.length === 0 ?
            <EmptyState icon={InboxIcon} title="Nothing here" body="No deliveries match this filter for today’s route." /> :

            <ul className="divide-y divide-line">
                {list.map((d) =>
              <li key={d.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="w-14 shrink-0 pt-0.5 text-right">
                        <p className="text-sm font-semibold tabular-nums text-ink">{d.eta}</p>
                        <p className="text-[11px] text-muted">ETA</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-ink">{d.customer}</p>
                          <StatusChip tone={statusTone[d.status]}>{d.status}</StatusChip>
                        </div>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-muted">
                          <span>{d.orderId}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
                            {d.area}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" aria-hidden />
                            {d.window}
                          </span>
                        </p>
                      </div>
                    </div>
                    {d.status !== 'Delivered' &&
                <Button size="sm" variant="secondary" className="self-start sm:self-center" onClick={() => report(d)}>
                        Report delay
                      </Button>
                }
                  </li>
              )}
              </ul>
            }
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-0 lg:self-start">
          <Card>
            <CardHeader title="Today’s route" description="CW-14 · started 08:40 from Koyambedu hub" />
            <div className="px-5 pb-5 pt-4">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
                  {done}
                  <span className="text-lg text-muted">/{deliveries.length}</span>
                </p>
                <p className="text-sm text-muted">stops completed</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${done / deliveries.length * 100}%` }} />
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                { k: 'Distance', v: '42.6 km' },
                { k: 'Remaining', v: '3h 40m' },
                { k: 'On-time', v: '88%' }].
                map((s) =>
                <div key={s.k} className="rounded-lg bg-surface-2 px-2 py-2.5">
                    <dt className="text-[11px] text-muted">{s.k}</dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{s.v}</dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>
          <MapView className="h-72" markers={markers} route={route} center={[13.05, 80.21]} zoom={11} fitBounds />
        </div>
      </div>
    </>);

}