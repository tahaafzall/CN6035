import clsx from 'clsx';

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function shortHash(value: string, left = 6, right = 4) {
  if (value.length <= left + right) {
    return value;
  }

  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function statusClasses(status: string) {
  switch (status) {
    case 'REGISTERED':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'IN_TRANSIT':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'DELIVERED':
      return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';
    case 'ANOMALY':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    case 'RECALLED':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
    case 'DISPENSED':
      return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}
