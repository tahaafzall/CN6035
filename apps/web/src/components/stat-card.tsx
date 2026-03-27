type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="surface-card flex h-full flex-col justify-between p-5">
      <div className="h-1 w-14 rounded-full bg-signal/55" />
      <div className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/42">{label}</p>
        <p className="mt-4 font-display text-4xl font-semibold text-ink">{value}</p>
        <p className="mt-3 text-sm leading-6 text-ink/65">{hint}</p>
      </div>
    </article>
  );
}
