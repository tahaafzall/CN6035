import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PHARMA_TRACE_ABI, createBatchDraftSchema } from '@tracechain/shared';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { decodeEventLog } from 'viem';
import { z } from 'zod';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';

import { SectionCard } from '../components/section-card';
import { useWalletAuth } from '../features/auth/auth-context';
import { apiRequest, uploadDocument } from '../lib/api';
import { appConfig } from '../lib/config';
import type { BatchRecord } from '../lib/types';

const batchFormSchema = createBatchDraftSchema
  .omit({
    manufacturedAt: true,
    expiresAt: true
  })
  .extend({
    manufacturedAtLocal: z.string().min(1),
    expiresAtLocal: z.string().min(1)
  });

type BatchFormValues = z.infer<typeof batchFormSchema>;

function toLocalDateInput(hoursAhead: number) {
  const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
}

export function CreateBatchPage() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const auth = useWalletAuth();
  const queryClient = useQueryClient();
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const defaultValues = useMemo<BatchFormValues>(
    () => ({
      batchCode: '',
      productName: '',
      category: 'Vaccines',
      description: '',
      originCountry: 'Switzerland',
      destinationMarket: 'United Kingdom',
      unitCount: 1000,
      storageTempMin: 2,
      storageTempMax: 8,
      metadataCid: null,
      documentCid: null,
      notes: '',
      manufacturedAtLocal: toLocalDateInput(-1),
      expiresAtLocal: toLocalDateInput(24 * 90)
    }),
    []
  );

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues
  });

  const mutation = useMutation({
    mutationFn: async (values: BatchFormValues) => {
      if (!address) {
        throw new Error('Connect MetaMask before creating a batch.');
      }

      if (!appConfig.contractAddress) {
        throw new Error('Set VITE_CONTRACT_ADDRESS before submitting blockchain transactions.');
      }

      if (!publicClient) {
        throw new Error('No public blockchain client is available.');
      }

      const token = auth.token ?? (await auth.authenticate());

      let uploadedDocumentCid: string | null = values.documentCid ?? null;
      if (documentFile) {
        const uploadResult = await uploadDocument(documentFile, token);
        uploadedDocumentCid = uploadResult.cid;
      }

      const payload = {
        ...values,
        manufacturedAt: new Date(values.manufacturedAtLocal).toISOString(),
        expiresAt: new Date(values.expiresAtLocal).toISOString(),
        documentCid: uploadedDocumentCid
      };

      const draft = await apiRequest<BatchRecord>('/api/batches/draft', {
        method: 'POST',
        token,
        body: payload
      });

      const txHash = await writeContractAsync({
        address: appConfig.contractAddress,
        abi: PHARMA_TRACE_ABI,
        functionName: 'createBatch',
        args: [
          values.batchCode,
          values.productName,
          BigInt(Math.floor(new Date(payload.expiresAt).getTime() / 1000)),
          draft.metadataHash,
          draft.documentHash
        ]
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      let onChainBatchId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: PHARMA_TRACE_ABI,
            data: log.data,
            topics: log.topics
          });

          if (decoded.eventName === 'BatchRegistered') {
            onChainBatchId = Number((decoded.args as { batchId: bigint }).batchId);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!onChainBatchId) {
        throw new Error('Transaction confirmed but batch ID could not be extracted from logs.');
      }

      await apiRequest(`/api/batches/${draft.id}/link-onchain`, {
        method: 'POST',
        token,
        body: {
          onChainBatchId,
          txHash
        }
      });

      return { batchId: draft.id };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['batches'] });
      await queryClient.invalidateQueries({ queryKey: ['overview'] });
      navigate(`/batches/${result.batchId}`);
    }
  });

  return (
    <SectionCard eyebrow="Front-end + Blockchain" title="Register a new pharmaceutical batch">
      <form
        className="grid gap-5 lg:grid-cols-2"
        onSubmit={form.handleSubmit((values) => {
          void mutation.mutateAsync(values);
        })}
      >
        <label className="block">
          <span className="field-label">Batch code</span>
          <input {...form.register('batchCode')} className="field-input" />
        </label>

        <label className="block">
          <span className="field-label">Product name</span>
          <input {...form.register('productName')} className="field-input" />
        </label>

        <label className="block">
          <span className="field-label">Category</span>
          <input {...form.register('category')} className="field-input" />
        </label>

        <label className="block">
          <span className="field-label">Unit count</span>
          <input
            type="number"
            {...form.register('unitCount', { valueAsNumber: true })}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="field-label">Origin country</span>
          <input {...form.register('originCountry')} className="field-input" />
        </label>

        <label className="block">
          <span className="field-label">Destination market</span>
          <input {...form.register('destinationMarket')} className="field-input" />
        </label>

        <label className="block">
          <span className="field-label">Manufactured at</span>
          <input
            type="datetime-local"
            {...form.register('manufacturedAtLocal')}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="field-label">Expires at</span>
          <input
            type="datetime-local"
            {...form.register('expiresAtLocal')}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="field-label">Minimum storage temperature</span>
          <input
            type="number"
            step="0.1"
            {...form.register('storageTempMin', { valueAsNumber: true })}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="field-label">Maximum storage temperature</span>
          <input
            type="number"
            step="0.1"
            {...form.register('storageTempMax', { valueAsNumber: true })}
            className="field-input"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="field-label">Description</span>
          <textarea rows={5} {...form.register('description')} className="field-textarea" />
        </label>

        <label className="block lg:col-span-2">
          <span className="field-label">Supporting document</span>
          <input
            type="file"
            onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-2xl border border-dashed border-line/90 bg-white/60 px-4 py-4 text-sm text-ink/60 shadow-soft"
          />
        </label>

        <div className="surface-card-soft flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:col-span-2">
          <p className="max-w-2xl text-sm leading-7 text-ink/60">
            Submission flow: create deterministic off-chain metadata, upload optional evidence to
            IPFS, submit the manufacturer transaction through MetaMask, extract the emitted batch
            ID, then link the indexed backend record to the chain transaction.
          </p>
          <button type="submit" disabled={mutation.isPending} className="btn-primary px-6 py-3">
            {mutation.isPending ? 'Submitting...' : 'Create On-chain Batch'}
          </button>
        </div>
      </form>

      {mutation.error ? <p className="notice-error mt-5">{mutation.error.message}</p> : null}
    </SectionCard>
  );
}
