import { format } from 'date-fns';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatINR(value: number): string {
  return inr.format(value);
}

export function nowStamp(): string {
  return format(new Date(), 'dd MMM, HH:mm');
}

export function clockTime(): string {
  return format(new Date(), 'HH:mm:ss');
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Overdue';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${pad(m)}m ${pad(s)}s`;
}

export function minutesAgoLabel(min: number): string {
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m ago`;
}