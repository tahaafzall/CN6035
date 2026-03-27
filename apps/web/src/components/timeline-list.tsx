import { formatDate, shortHash } from '../lib/formatters';

type TimelineItem = {
  id: string;
  type: string;
  title: string;
  occurredAt: string | Date;
  payload?: Record<string, unknown>;
  txHash?: string | null;
};

type TimelineListProps = {
  items: TimelineItem[];
};

export function TimelineList({ items }: TimelineListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-ink/55">No activity has been indexed yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="data-tile px-4 py-4 text-sm text-ink/72">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{item.type}</p>
              <p className="mt-2 text-base font-semibold text-ink">{item.title}</p>
            </div>
            <div className="text-right text-ink/60">
              <p>{formatDate(item.occurredAt)}</p>
              {item.txHash ? <p className="font-mono text-xs">{shortHash(item.txHash)}</p> : null}
            </div>
          </div>
          {item.payload ? (
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-line/60 bg-mist/70 p-4 font-mono text-xs text-ink/62">
              {JSON.stringify(item.payload, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
