import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { SectionCard } from '../components/section-card';
import { StatCard } from '../components/stat-card';
import { StatusBadge } from '../components/status-badge';
import { apiRequest } from '../lib/api';
import { formatDate, shortHash } from '../lib/formatters';
import type { BatchRecord, OverviewStats } from '../lib/types';

export function DashboardPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const overviewQuery = useQuery({
    queryKey: ['overview'],
    queryFn: () => apiRequest<OverviewStats>('/api/stats/overview')
  });

  const batchesQuery = useQuery({
    queryKey: ['batches', deferredSearch],
    queryFn: () =>
      apiRequest<BatchRecord[]>(
        `/api/batches${deferredSearch ? `?q=${encodeURIComponent(deferredSearch)}` : ''}`
      )
  });

  const metrics = overviewQuery.data?.metrics;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total"
          value={metrics?.totalBatches ?? '--'}
          hint="Tracked across the platform."
        />
        <StatCard
          label="Registered"
          value={metrics?.registeredBatches ?? '--'}
          hint="Anchored on chain."
        />
        <StatCard
          label="In Transit"
          value={metrics?.inTransitBatches ?? '--'}
          hint="Current handovers in progress."
        />
        <StatCard
          label="Recalled"
          value={metrics?.recalledBatches ?? '--'}
          hint="Safety interventions."
        />
        <StatCard
          label="Anomalies"
          value={metrics?.anomalyBatches ?? '--'}
          hint="Telemetry alarms."
        />
      </section>

      <SectionCard
        eyebrow="Operational View"
        title="Batch registry"
        actions={
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by batch code, product, category, or manufacturer"
            className="field-input min-w-[280px] rounded-full px-5 py-2.5"
          />
        }
      >
        {batchesQuery.isLoading ? (
          <p className="text-ink/60">Loading batches...</p>
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-line/70 bg-white/75 shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-mist/55 text-ink/48">
                  <tr>
                    <th className="px-5 py-4 font-medium">Batch</th>
                    <th className="px-5 py-4 font-medium">Product</th>
                    <th className="px-5 py-4 font-medium">Manufacturer</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Last update</th>
                    <th className="px-5 py-4 font-medium">On-chain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {batchesQuery.data?.map((batch) => (
                    <tr key={batch.id} className="transition hover:bg-mist/35">
                      <td className="px-5 py-4">
                        <Link
                          to={`/batches/${batch.id}`}
                          className="font-semibold text-ink transition hover:text-accent"
                        >
                          {batch.batchCode}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-ink/75">{batch.productName}</td>
                      <td className="px-5 py-4 text-ink/75">
                        {batch.manufacturer.name || 'Pending profile'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-5 py-4 text-ink/60">{formatDate(batch.manufacturedAt)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-ink/60">
                        {batch.lastTxHash ? shortHash(batch.lastTxHash) : 'Not linked'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="Recent Events" title="Indexed audit feed">
        <div className="space-y-3">
          {overviewQuery.data?.recentAuditEvents.map((event) => (
            <div
              key={event.id}
              className="data-tile flex flex-wrap items-center justify-between gap-3 px-4 py-4"
            >
              <div>
                <p className="font-semibold text-ink">{event.eventType}</p>
                <p className="text-sm text-ink/55">
                  {event.batch?.batchCode ? `Batch ${event.batch.batchCode}` : 'System event'}
                </p>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p>{formatDate(event.createdAt)}</p>
                <p className="font-mono">{event.txHash ? shortHash(event.txHash) : 'off-chain'}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
