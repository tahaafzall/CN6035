import type { PropsWithChildren, ReactNode } from 'react';

type SectionCardProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
}>;

export function SectionCard({ title, eyebrow, actions, children }: SectionCardProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
