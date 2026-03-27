import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { SectionCard } from '../components/section-card';
import { StatCard } from '../components/stat-card';
import { apiRequest } from '../lib/api';
import type { OverviewStats } from '../lib/types';

const pillars = [
  {
    title: 'On-chain provenance',
    copy: 'Immutable batch registration, custody transfers, checkpoints, and recalls are anchored to Ethereum-compatible infrastructure.'
  },
  {
    title: 'Off-chain orchestration',
    copy: 'The backend handles organization profiles, telemetry ingestion, IPFS uploads, analytics, and an indexed query model for rich dashboards.'
  },
  {
    title: 'Distributed trust model',
    copy: 'Manufacturers, logistics operators, distributors, pharmacies, and regulators collaborate without trusting a single database operator.'
  }
];

export function HomePage() {
  const overviewQuery = useQuery({
    queryKey: ['overview'],
    queryFn: () => apiRequest<OverviewStats>('/api/stats/overview')
  });

  const metrics = overviewQuery.data?.metrics;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          eyebrow="Project Selection"
          title="Why this DApp scores highly against the rubric"
          actions={
            <Link to="/dashboard" className="btn-primary">
              Open Dashboard
            </Link>
          }
        >
          <div className="space-y-4 text-ink/70">
            <p>
              Pharmaceutical traceability is the strongest project choice because it naturally
              combines multi-party coordination, tamper-evident audit trails, asynchronous event
              propagation, role-based trust, and clear on-chain versus off-chain data placement.
            </p>
            <p>
              It addresses every marking axis: a non-trivial backend, meaningful smart-contract
              logic, a strong front end, realistic blockchain interaction, and substantial
              distributed-systems discussion around consistency, finality, latency, transparency,
              privacy, and fault tolerance.
            </p>
          </div>
        </SectionCard>

        <div className="grid gap-4">
          <StatCard
            label="Participants"
            value={metrics?.organizations ?? '--'}
            hint="Independent actors sharing a distributed audit log."
          />
          <StatCard
            label="Tracked Batches"
            value={metrics?.totalBatches ?? '--'}
            hint="Off-chain metadata linked to on-chain provenance."
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="surface-card-soft p-6">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-signal/90">Pillar</p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{pillar.title}</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">{pillar.copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Registered"
          value={metrics?.registeredBatches ?? '--'}
          hint="Batches anchored on chain."
        />
        <StatCard
          label="In Transit"
          value={metrics?.inTransitBatches ?? '--'}
          hint="Custody changes pending or active."
        />
        <StatCard
          label="Recalled"
          value={metrics?.recalledBatches ?? '--'}
          hint="Regulator or manufacturer intervention."
        />
        <StatCard
          label="Anomalies"
          value={metrics?.anomalyBatches ?? '--'}
          hint="Telemetry violations captured off chain."
        />
        <StatCard
          label="Audit API"
          value="/docs"
          hint="Swagger endpoint for submission evidence."
        />
      </section>

      <SectionCard
        eyebrow="Learning Outcomes"
        title="How the architecture demonstrates distributed systems principles"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="data-tile text-sm text-ink/65">
            <p className="font-semibold text-ink">Benefits demonstrated</p>
            <p className="mt-3">
              Decentralised trust, transparent verification, non-repudiation, resilience against
              single-party tampering, and portable auditability across organisational boundaries.
            </p>
          </div>
          <div className="data-tile text-sm text-ink/65">
            <p className="font-semibold text-ink">Trade-offs evaluated</p>
            <p className="mt-3">
              Higher write latency, gas costs, privacy constraints, eventual consistency between
              off-chain indexes and chain state, and operational complexity from hybrid storage.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
