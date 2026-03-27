import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PHARMA_TRACE_ABI } from '@tracechain/shared';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';

import { SectionCard } from '../components/section-card';
import { StatusBadge } from '../components/status-badge';
import { TimelineList } from '../components/timeline-list';
import { useWalletAuth } from '../features/auth/auth-context';
import { apiRequest } from '../lib/api';
import { appConfig } from '../lib/config';
import { formatDate, shortHash } from '../lib/formatters';
import { buildShipmentHash, buildTextHash } from '../lib/hashes';
import type { BatchRecord, OrganizationRecord } from '../lib/types';

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

export function BatchDetailPage() {
  const { identifier = '' } = useParams();
  const { address } = useAccount();
  const auth = useWalletAuth();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [toWalletAddress, setToWalletAddress] = useState('');
  const [shipmentReference, setShipmentReference] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [recallReason, setRecallReason] = useState('');

  const batchQuery = useQuery({
    queryKey: ['batch', identifier],
    queryFn: () => apiRequest<BatchRecord>(`/api/batches/${identifier}`),
    enabled: Boolean(identifier)
  });

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiRequest<OrganizationRecord[]>('/api/organizations')
  });

  const timelineQuery = useQuery({
    queryKey: ['timeline', identifier],
    queryFn: () => apiRequest<TimelineResponse>(`/api/batches/${identifier}/timeline`),
    enabled: Boolean(identifier)
  });

  const onChainQuery = useQuery({
    queryKey: ['on-chain-batch', batchQuery.data?.onChainBatchId],
    enabled: Boolean(publicClient && batchQuery.data?.onChainBatchId && appConfig.contractAddress),
    queryFn: async () => {
      const batchId = BigInt(batchQuery.data!.onChainBatchId!);
      const [batchState, pendingTransfer] = await Promise.all([
        publicClient!.readContract({
          address: appConfig.contractAddress!,
          abi: PHARMA_TRACE_ABI,
          functionName: 'getBatch',
          args: [batchId]
        }),
        publicClient!.readContract({
          address: appConfig.contractAddress!,
          abi: PHARMA_TRACE_ABI,
          functionName: 'pendingTransfers',
          args: [batchId]
        })
      ]);

      return { batchState, pendingTransfer };
    }
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const batch = batchQuery.data;

      if (
        !batch ||
        !batch.onChainBatchId ||
        !address ||
        !publicClient ||
        !appConfig.contractAddress
      ) {
        throw new Error('Batch, wallet, and contract configuration are required.');
      }

      const token = auth.token ?? (await auth.authenticate());
      const shipmentHash = buildShipmentHash(batch.batchCode, toWalletAddress, shipmentReference);

      const txHash = await writeContractAsync({
        address: appConfig.contractAddress,
        abi: PHARMA_TRACE_ABI,
        functionName: 'requestTransfer',
        args: [BigInt(batch.onChainBatchId), toWalletAddress as `0x${string}`, shipmentHash]
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await apiRequest(`/api/batches/${batch.id}/transfers`, {
        method: 'POST',
        token,
        body: {
          toWalletAddress,
          shipmentReference,
          notes: transferNotes,
          txHash
        }
      });
    },
    onSuccess: async () => {
      setTransferNotes('');
      setShipmentReference('');
      setToWalletAddress('');
      await queryClient.invalidateQueries({ queryKey: ['batch', identifier] });
      await queryClient.invalidateQueries({ queryKey: ['timeline', identifier] });
      await queryClient.invalidateQueries({ queryKey: ['on-chain-batch'] });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const batch = batchQuery.data;

      if (!batch?.onChainBatchId || !publicClient || !appConfig.contractAddress) {
        throw new Error('Batch is not linked to the blockchain yet.');
      }

      const txHash = await writeContractAsync({
        address: appConfig.contractAddress,
        abi: PHARMA_TRACE_ABI,
        functionName: 'acceptTransfer',
        args: [BigInt(batch.onChainBatchId)]
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['batch', identifier] });
      await queryClient.invalidateQueries({ queryKey: ['timeline', identifier] });
      await queryClient.invalidateQueries({ queryKey: ['on-chain-batch'] });
    }
  });

  const recallMutation = useMutation({
    mutationFn: async () => {
      const batch = batchQuery.data;

      if (!batch?.onChainBatchId || !publicClient || !appConfig.contractAddress) {
        throw new Error('Batch is not linked to the blockchain yet.');
      }

      const txHash = await writeContractAsync({
        address: appConfig.contractAddress,
        abi: PHARMA_TRACE_ABI,
        functionName: 'recallBatch',
        args: [BigInt(batch.onChainBatchId), buildTextHash(recallReason || 'recall')]
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
    },
    onSuccess: async () => {
      setRecallReason('');
      await queryClient.invalidateQueries({ queryKey: ['batch', identifier] });
      await queryClient.invalidateQueries({ queryKey: ['timeline', identifier] });
      await queryClient.invalidateQueries({ queryKey: ['on-chain-batch'] });
    }
  });

  const pendingTransferTuple = onChainQuery.data?.pendingTransfer;
  const pendingTransfer = pendingTransferTuple
    ? {
        from: pendingTransferTuple[0],
        to: pendingTransferTuple[1],
        requestedAt: pendingTransferTuple[2],
        shipmentHash: pendingTransferTuple[3],
        exists: pendingTransferTuple[4]
      }
    : null;
  const connectedWalletIsPendingRecipient =
    Boolean(address) &&
    Boolean(pendingTransfer?.exists) &&
    pendingTransfer?.to.toLowerCase() === address?.toLowerCase();

  if (batchQuery.isLoading) {
    return <p className="text-ink/60">Loading batch...</p>;
  }

  if (batchQuery.error || !batchQuery.data) {
    return (
      <p className="notice-error">{batchQuery.error?.message || 'Batch could not be loaded.'}</p>
    );
  }

  const batch = batchQuery.data;

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Batch Detail"
        title={`${batch.productName} / ${batch.batchCode}`}
        actions={<StatusBadge status={batch.status} />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="data-tile p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">Category</p>
            <p className="mt-2 text-ink">{batch.category}</p>
          </div>
          <div className="data-tile p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
              Manufacturer
            </p>
            <p className="mt-2 text-ink">
              {batch.manufacturer.name || batch.manufacturer.walletAddress}
            </p>
          </div>
          <div className="data-tile p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
              Current custodian
            </p>
            <p className="mt-2 text-ink">
              {batch.currentCustodian?.name || batch.currentCustodian?.walletAddress || 'Pending'}
            </p>
          </div>
          <div className="data-tile p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">Expiry</p>
            <p className="mt-2 text-ink">{formatDate(batch.expiresAt)}</p>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7 text-ink/65">{batch.description}</p>
      </SectionCard>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard eyebrow="On-chain Projection" title="Live blockchain state">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="data-tile p-4 text-sm text-ink/65">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">Batch ID</p>
              <p className="mt-2 text-ink">{batch.onChainBatchId ?? 'Not linked yet'}</p>
            </div>
            <div className="data-tile p-4 text-sm text-ink/65">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
                Last transaction
              </p>
              <p className="mt-2 font-mono text-ink">
                {batch.lastTxHash ? shortHash(batch.lastTxHash) : 'No transaction'}
              </p>
            </div>
            <div className="data-tile p-4 text-sm text-ink/65 md:col-span-2">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
                Pending transfer
              </p>
              <p className="mt-2 text-ink">
                {pendingTransfer?.exists
                  ? `${pendingTransfer.to} awaiting acceptance`
                  : 'No pending transfer on contract.'}
              </p>
            </div>
          </div>

          {connectedWalletIsPendingRecipient ? (
            <button
              type="button"
              onClick={() => {
                void acceptMutation.mutateAsync();
              }}
              disabled={acceptMutation.isPending}
              className="btn-primary mt-6 px-5 py-3"
            >
              {acceptMutation.isPending ? 'Accepting...' : 'Accept pending transfer'}
            </button>
          ) : null}
        </SectionCard>

        <SectionCard eyebrow="Operational Actions" title="Transfer or recall">
          <div className="space-y-5">
            <div className="surface-card-soft p-5">
              <h3 className="font-display text-2xl text-ink">Request custody transfer</h3>
              <div className="mt-4 space-y-3">
                <select
                  value={toWalletAddress}
                  onChange={(event) => setToWalletAddress(event.target.value)}
                  className="field-input"
                >
                  <option value="">Select recipient</option>
                  {organizationsQuery.data?.map((organization) => (
                    <option key={organization.id} value={organization.walletAddress}>
                      {organization.name || organization.walletAddress}
                    </option>
                  ))}
                </select>
                <input
                  value={shipmentReference}
                  onChange={(event) => setShipmentReference(event.target.value)}
                  placeholder="Shipment reference"
                  className="field-input"
                />
                <textarea
                  rows={3}
                  value={transferNotes}
                  onChange={(event) => setTransferNotes(event.target.value)}
                  placeholder="Operational notes"
                  className="field-textarea"
                />
                <button
                  type="button"
                  onClick={() => {
                    void transferMutation.mutateAsync();
                  }}
                  disabled={transferMutation.isPending || !toWalletAddress || !shipmentReference}
                  className="btn-accent px-5 py-3"
                >
                  {transferMutation.isPending ? 'Submitting transfer...' : 'Submit transfer'}
                </button>
              </div>
            </div>

            <div className="surface-card-soft border-danger/20 bg-danger/5 p-5">
              <h3 className="font-display text-2xl text-ink">Recall batch</h3>
              <textarea
                rows={3}
                value={recallReason}
                onChange={(event) => setRecallReason(event.target.value)}
                placeholder="Reason for recall"
                className="field-textarea mt-4 border-danger/25 focus:border-danger/45"
              />
              <button
                type="button"
                onClick={() => {
                  void recallMutation.mutateAsync();
                }}
                disabled={recallMutation.isPending || !recallReason}
                className="btn-danger mt-4 px-5 py-3"
              >
                {recallMutation.isPending ? 'Broadcasting recall...' : 'Broadcast recall'}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard eyebrow="Batch Activity" title="Unified timeline">
        <TimelineList items={timelineQuery.data?.timeline ?? []} />
      </SectionCard>
    </div>
  );
}
