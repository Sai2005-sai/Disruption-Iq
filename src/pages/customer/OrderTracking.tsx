import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, HeadsetIcon, BadgeCheckIcon, PackageSearchIcon, CheckIcon, CircleAlertIcon } from 'lucide-react';
import { customerOrders } from '../../data/customer';
import { CustomerOrder, AgentTicket } from '../../types/domain';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { MapView } from '../../components/ui/MapView';
import { inputClass } from '../../components/ui/Field';
import { cn } from '../../utils/cn';

type LookupState = {status: 'loading';} | {status: 'found';order: CustomerOrder;} | {status: 'missing';query: string;};

export function OrderTracking() {
  const navigate = useNavigate();
  const { workflow, agentTickets } = useApp();
  const [query, setQuery] = useState('ORD-10482');
  const [state, setState] = useState<LookupState>({ status: 'loading' });

  const lookup = (id: string) => {
    setState({ status: 'loading' });
    setTimeout(() => {
      const order = customerOrders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
      setState(order ? { status: 'found', order } : { status: 'missing', query: id.trim() });
    }, 400);
  };

  useEffect(() => {
    lookup('ORD-10482');
  }, []);

  const executed = workflow.state === 'executed';
  const matchedTicket = state.status === 'found'
    ? agentTickets.find((t) => t.orderId.toLowerCase() === state.order.id.toLowerCase() && t.solutionStatus === 'Forwarded to Agent')
    : undefined;

  return (
    <>
      <PageHeader title="Track your order" description="Sundaram Motors · Ambattur Industrial Estate, Chennai" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(query);
        }}
        className="mb-6 flex max-w-xl gap-2">
        
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order number, e.g. ORD-10482" className={`${inputClass} h-10 pl-9`} aria-label="Order number" />
        </div>
        <Button type="submit">Track</Button>
      </form>
      <p className="-mt-4 mb-6 text-xs text-muted">Your orders: {customerOrders.map((o) => o.id).join(', ')}</p>

      {state.status === 'loading' &&
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="space-y-4 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </Card>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      }

      {state.status === 'missing' &&
      <Card>
          <EmptyState
          icon={PackageSearchIcon}
          tone="error"
          title={`We couldn’t find “${state.query}”`}
          body="Check the order number on your confirmation email. Order numbers start with ORD- followed by 5 digits."
          action={
          <Button variant="secondary" onClick={() => navigate('/customer/care?tab=chat')}>
                Ask customer care
              </Button>
          } />
        
        </Card>
      }

      {state.status === 'found' && (
        <OrderResult
          order={state.order}
          executed={executed}
          agentTicket={matchedTicket}
          onContact={() => navigate('/customer/care?tab=chat')}
        />
      )}
    </>);

}

function OrderResult({
  order,
  executed,
  agentTicket,
  onContact
}: {
  order: CustomerOrder;
  executed: boolean;
  agentTicket?: AgentTicket;
  onContact: () => void;
}) {
  const isDelayed = order.status === 'Delayed' || !!agentTicket;
  const revised = agentTicket?.revisedEta ?? (isDelayed && executed ? 'Fri, 30 Oct · 2 PM – 5 PM' : order.revisedEta);
  const explanation = agentTicket
    ? `En-route field delay reported: ${agentTicket.reason}. Operations recovery action taken: ${agentTicket.adminSolution}`
    : order.explanation;

  const timeline = order.timeline.map((s) => {
    if (agentTicket && s.label === 'Out for delivery') {
      return { ...s, state: 'current' as const, note: `In Transit · Revised ETA: ${agentTicket.revisedEta || 'Delayed'}` };
    }
    return executed && isDelayed && s.label === 'Replacement stock arranged'
      ? { ...s, state: 'done' as const, time: '29 Oct, 11:30' }
      : executed && isDelayed && s.label === 'Out for delivery'
      ? { ...s, state: 'current' as const, time: 'Expected 30 Oct' }
      : s;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <Card className="p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted">
                {order.id} · placed {order.placed}
              </p>
              <p className="text-[15px] font-medium text-ink">{order.items}</p>
            </div>
            <StatusChip tone={isDelayed ? 'warning' : 'success'} dot>
              {isDelayed ? 'Delayed' : order.status}
            </StatusChip>
          </div>

          <div className={cn('mt-5 rounded-xl p-5', revised ? 'border border-accent/40 bg-accent/5' : 'bg-surface-2')}>
            <p className="text-sm text-ink-2">{order.status === 'Delivered' ? 'Delivered on' : revised ? 'New expected delivery' : 'Expected delivery'}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{revised ?? order.originalEta}</p>
            {revised && <p className="mt-1 text-sm text-muted line-through">Originally {order.originalEta}</p>}
          </div>

          {agentTicket && (
            <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-accent-ink">
                <span>⚡ Real-Time Transit Recovery Notice</span>
                <span className="text-[11px] bg-accent/20 px-2 py-0.5 rounded">Forwarded by Partner Admin</span>
              </div>
              <p className="text-ink leading-relaxed">
                {agentTicket.adminSolution}
              </p>
            </div>
          )}

          {explanation && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-ink">Why is my order late?</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{explanation}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-risk-low-ink">
                <BadgeCheckIcon className="h-4 w-4" aria-hidden /> Verified by Logistics Dispatch · Today
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:p-6">
          <h2 className="text-[15px] font-semibold text-ink">Shipment progress</h2>
          <ol className="mt-5">
            {timeline.map((s, i) =>
            <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
                {i < timeline.length - 1 && <span aria-hidden className={cn('absolute left-[11px] top-6 h-full w-px', s.state === 'done' || s.state === 'issue' ? 'bg-accent' : 'bg-line')} />}
                <span
                className={cn(
                  'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  s.state === 'done' && 'border-accent bg-accent text-navy',
                  s.state === 'issue' && 'border-risk-moderate bg-risk-moderate text-white',
                  s.state === 'current' && 'border-primary bg-surface',
                  s.state === 'upcoming' && 'border-line bg-surface'
                )}>
                
                  {s.state === 'done' && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                  {s.state === 'issue' && <CircleAlertIcon className="h-3.5 w-3.5" />}
                  {s.state === 'current' && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div className="-mt-0.5">
                  <p className={cn('text-sm font-medium', s.state === 'upcoming' ? 'text-muted' : 'text-ink')}>{s.label}</p>
                  <p className="text-xs text-muted">{s.time}</p>
                  {s.note && <p className="mt-0.5 text-xs text-ink-2">{s.note}</p>}
                </div>
              </li>
            )}
          </ol>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">
        <Card className="overflow-hidden p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">Live Delivery Route &amp; Map</h2>
              <p className="text-xs text-muted">Koyambedu Hub ➔ Ambattur Facility</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
              11.4 km · Route
            </span>
          </div>

          <MapView
            className="h-[320px] w-full"
            center={[order.destination.lat, order.destination.lng]}
            zoom={12}
            fitBounds={order.status !== 'Delivered'}
            route={
              order.status !== 'Delivered'
                ? [
                    [order.current.lat, order.current.lng],
                    [order.destination.lat, order.destination.lng]
                  ]
                : undefined
            }
            markers={[
              ...(order.status !== 'Delivered'
                ? [
                    {
                      id: 'cur',
                      lat: order.current.lat,
                      lng: order.current.lng,
                      color: '#0D9488',
                      label: order.current.label,
                      sublabel: 'Dispatch Hub (Current location)'
                    }
                  ]
                : []),
              {
                id: 'dst',
                lat: order.destination.lat,
                lng: order.destination.lng,
                color: '#0F2A4A',
                label: order.destination.label,
                sublabel: 'Destination (Delivery address)'
              }
            ]}
          />

          <div className="mt-3.5 space-y-2 border-t border-line pt-3 text-xs">
            <div className="flex items-start gap-2 text-ink-2">
              <span className="h-2 w-2 rounded-full bg-accent mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-ink">Package Hub: </span>
                <span>{order.current.label}</span>
                <span className="block text-[11px] text-muted">
                  GPS: {order.current.lat.toFixed(4)}°N, {order.current.lng.toFixed(4)}°E
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-ink-2">
              <span className="h-2 w-2 rounded-full bg-navy dark:bg-slate-300 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-ink">Delivery Destination: </span>
                <span>{order.destination.label}</span>
                <span className="block text-[11px] text-muted">
                  GPS: {order.destination.lat.toFixed(4)}°N, {order.destination.lng.toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Need help with this order?</h2>
          <p className="mt-1 text-sm text-muted">Our care team replies in under 2 minutes, 7 AM – 11 PM.</p>
          <Button className="mt-4 w-full" icon={<HeadsetIcon className="h-4 w-4" />} onClick={onContact}>
            Contact customer care
          </Button>
        </Card>
      </div>
    </div>);

}