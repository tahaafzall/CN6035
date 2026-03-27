import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { SectionCard } from '../components/section-card';
import { StatusBadge } from '../components/status-badge';
import { TimelineList } from '../components/timeline-list';
import { apiRequest } from '../lib/api';
import { formatDate, shortHash } from '../lib/formatters';
import type { BatchRecord } from '../lib/types';

type TimelineResponse = {
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    occurredAt: string;
    payload: Record<string, unknown>;
    txHash?: string | null;
  }>;
};

export function VerifyPage() {
  const [lookup, setLookup] = useState('BATCH-SEED-001');
  const [submittedLookup, setSubmittedLookup] = useState('BATCH-SEED-001');

  const batchQuery = useQuery({
    queryKey: ['verify-batch', submittedLookup],
    queryFn: () => apiRequest<BatchRecord>(`/api/batches/${encodeURIComponent(submittedLookup)}`),
    enabled: Boolean(submittedLookup)
  });

  const timelineQuery = useQuery({
    queryKey: ['verify-batch-timeline', submittedLookup],
    queryFn: () =>
      apiRequest<TimelineResponse>(`/api/batches/${encodeURIComponent(submittedLookup)}/timeline`),
    enabled: Boolean(submittedLookup)
  });

  return (
    <div className="space-y-8">
      <SectionCard eyebrow="Public Verification" title="Verify a batch without privileged access">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedLookup(lookup);
          }}
        >
          <input
            value={lookup}
            onChange={(event) => setLookup(event.target.value)}
            placeholder="Enter batch code or on-chain batch ID"
            className="field-input min-w-[280px] flex-1 rounded-full px-5 py-3"
          />
          <button type="submit" className="btn-primary px-6 py-3">
            Verify provenance
          </button>
        </form>
      </SectionCard>

      {batchQuery.error ? <p className="notice-error">{batchQuery.error.message}</p> : null}

      {batchQuery.data ? (
        <>
          <SectionCard
            eyebrow="Verification Result"
            title={`${batchQuery.data.productName} (${batchQuery.data.batchCode})`}
            actions={<StatusBadge status={batchQuery.data.status} />}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="data-tile p-4">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
                  Manufacturer
                </p>
                <p className="mt-2 text-ink">{batchQuery.data.manufacturer.name || 'Unknown'}</p>
              </div>
              <div className="data-tile p-4">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">Expiry</p>
                <p className="mt-2 text-ink">{formatDate(batchQuery.data.expiresAt)}</p>
              </div>
              <div className="data-tile p-4">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
                  Last transaction
                </p>
                <p className="mt-2 font-mono text-ink">
                  {batchQuery.data.lastTxHash
                    ? shortHash(batchQuery.data.lastTxHash)
                    : 'Not linked'}
                </p>
              </div>
              <div className="data-tile p-4">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
                  Current custodian
                </p>
                <p className="mt-2 text-ink">
                  {batchQuery.data.currentCustodian?.name || 'Pending on-chain acceptance'}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-ink/65">{batchQuery.data.description}</p>

            <Link to={`/batches/${batchQuery.data.id}`} className="btn-secondary mt-6">
              Open operator detail view
            </Link>
          </SectionCard>

          <SectionCard eyebrow="Timeline" title="Audit chronology">
            <TimelineList items={timelineQuery.data?.timeline ?? []} />
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
