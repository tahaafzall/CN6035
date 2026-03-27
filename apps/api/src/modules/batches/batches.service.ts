import { BatchStatus, ParticipantRole, Prisma, TransferStatus } from '@prisma/client';
import type {
  BatchFilterInput,
  CreateBatchDraftInput,
  CreateTransferLogInput,
  LinkOnChainBatchInput
} from '@tracechain/shared';

import { prisma } from '../../config/prisma.js';
import type { AuthenticatedUser } from '../../types/auth.js';
import { ApiError } from '../../utils/api-error.js';
import { buildDocumentHashFromCid, buildMetadataHash, buildShipmentHash } from '../../utils/hash.js';
import { normalizeWalletAddress } from '../../utils/addresses.js';

async function requireOrganization(user: AuthenticatedUser) {
  const organization = await prisma.organization.findUnique({
    where: {
      walletAddress: user.walletAddress
    }
  });

  if (!organization) {
    throw ApiError.unauthorized('Complete wallet authentication before using protected endpoints.');
  }

  return organization;
}

async function writeAuditEvent(data: Prisma.AuditEventCreateInput) {
  return prisma.auditEvent.create({
    data
  });
}

function canAdminister(user: AuthenticatedUser) {
  return user.role === ParticipantRole.ADMIN || user.role === ParticipantRole.REGULATOR;
}

export async function listBatches(filters: BatchFilterInput) {
  const where: Prisma.BatchWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { batchCode: { contains: filters.q, mode: 'insensitive' } },
            { productName: { contains: filters.q, mode: 'insensitive' } },
            { category: { contains: filters.q, mode: 'insensitive' } },
            { manufacturer: { is: { name: { contains: filters.q, mode: 'insensitive' } } } }
          ]
        }
      : {}),
    ...(filters.role ? { manufacturer: { is: { role: filters.role } } } : {})
  };

  return prisma.batch.findMany({
    where,
    include: {
      manufacturer: true,
      currentCustodian: true,
      telemetry: {
        take: 1,
        orderBy: { recordedAt: 'desc' }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

export async function createBatchDraft(user: AuthenticatedUser, input: CreateBatchDraftInput) {
  const organization = await requireOrganization(user);

  if (!organization.isProfileComplete || organization.role !== ParticipantRole.MANUFACTURER) {
    throw ApiError.forbidden(
      'Only a complete manufacturer profile can create new pharmaceutical batches.'
    );
  }

  if (input.storageTempMin >= input.storageTempMax) {
    throw ApiError.badRequest('Minimum storage temperature must be below the maximum.');
  }

  const metadataHash = buildMetadataHash({
    ...input,
    manufacturerWalletAddress: user.walletAddress
  });
  const documentHash = buildDocumentHashFromCid(input.documentCid);

  const batch = await prisma.batch.create({
    data: {
      batchCode: input.batchCode,
      productName: input.productName,
      category: input.category,
      description: input.description,
      originCountry: input.originCountry,
      destinationMarket: input.destinationMarket,
      unitCount: input.unitCount,
      storageTempMin: input.storageTempMin,
      storageTempMax: input.storageTempMax,
      manufacturedAt: new Date(input.manufacturedAt),
      expiresAt: new Date(input.expiresAt),
      metadataCid: input.metadataCid,
      metadataHash,
      documentCid: input.documentCid,
      documentHash,
      status: BatchStatus.DRAFT,
      manufacturerId: organization.id,
      currentCustodianId: organization.id
    },
    include: {
      manufacturer: true
    }
  });

  await writeAuditEvent({
    eventRef: `draft:${batch.id}`,
    batch: { connect: { id: batch.id } },
    organization: { connect: { id: organization.id } },
    eventType: 'BATCH_DRAFT_CREATED',
    actorWallet: user.walletAddress,
    payload: {
      metadataHash,
      documentHash
    }
  });

  return batch;
}

export async function linkOnChainBatch(
  batchId: string,
  user: AuthenticatedUser,
  input: LinkOnChainBatchInput
) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      manufacturer: true
    }
  });

  if (!batch) {
    throw ApiError.notFound('Batch draft not found.');
  }

  if (
    batch.manufacturer.walletAddress !== user.walletAddress &&
    batch.currentCustodianId !== user.organizationId &&
    !canAdminister(user)
  ) {
    throw ApiError.forbidden('Only the manufacturer or a privileged reviewer can link batches.');
  }

  const updatedBatch = await prisma.batch.update({
    where: { id: batchId },
    data: {
      onChainBatchId: input.onChainBatchId,
      lastTxHash: input.txHash,
      status: BatchStatus.REGISTERED
    },
    include: {
      manufacturer: true,
      currentCustodian: true
    }
  });

  await writeAuditEvent({
    eventRef: `link:${batch.id}:${input.onChainBatchId}`,
    batch: { connect: { id: batch.id } },
    organization: { connect: { id: batch.manufacturerId } },
    eventType: 'BATCH_LINKED_ONCHAIN',
    actorWallet: user.walletAddress,
    txHash: input.txHash,
    payload: {
      onChainBatchId: input.onChainBatchId
    }
  });

  return updatedBatch;
}

export async function getBatchByIdentifier(identifier: string) {
  const isNumeric = /^\d+$/.test(identifier);

  const batch = await prisma.batch.findFirst({
    where: isNumeric
      ? {
          onChainBatchId: Number(identifier)
        }
      : {
          OR: [{ id: identifier }, { batchCode: identifier }]
        },
    include: {
      manufacturer: true,
      currentCustodian: true,
      telemetry: {
        orderBy: { recordedAt: 'desc' },
        take: 25
      },
      transfers: {
        include: {
          fromOrg: true,
          toOrg: true
        },
        orderBy: { requestedAt: 'desc' }
      },
      auditEvents: {
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });

  if (!batch) {
    throw ApiError.notFound('Batch not found.');
  }

  return batch;
}

export async function getBatchTimeline(identifier: string) {
  const batch = await getBatchByIdentifier(identifier);

  const timeline = [
    ...batch.auditEvents.map((event) => ({
      id: event.id,
      type: 'AUDIT',
      title: event.eventType,
      occurredAt: event.createdAt,
      payload: event.payload,
      txHash: event.txHash
    })),
    ...batch.transfers.map((transfer) => ({
      id: transfer.id,
      type: 'TRANSFER',
      title: `${transfer.fromOrg?.name || 'Unknown sender'} -> ${transfer.toOrg?.name || transfer.toWalletAddress}`,
      occurredAt: transfer.acceptedAt || transfer.requestedAt,
      payload: {
        status: transfer.status,
        shipmentReference: transfer.shipmentReference
      },
      txHash: transfer.txHash
    })),
    ...batch.telemetry.map((reading) => ({
      id: reading.id,
      type: 'TELEMETRY',
      title: `${reading.temperatureC}C / ${reading.humidityPercent}%`,
      occurredAt: reading.recordedAt,
      payload: {
        severity: reading.severity,
        latitude: reading.latitude,
        longitude: reading.longitude,
        deviceId: reading.deviceId
      }
    }))
  ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

  return { batch, timeline };
}

export async function createTransferLog(
  batchId: string,
  user: AuthenticatedUser,
  input: CreateTransferLogInput
) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      currentCustodian: true
    }
  });

  if (!batch) {
    throw ApiError.notFound('Batch not found.');
  }

  if (!batch.currentCustodian || batch.currentCustodian.walletAddress !== user.walletAddress) {
    throw ApiError.forbidden('Only the current custodian can log a transfer request.');
  }

  const toWalletAddress = normalizeWalletAddress(input.toWalletAddress);
  const toOrganization = await prisma.organization.findUnique({
    where: { walletAddress: toWalletAddress }
  });

  const shipmentHash = buildShipmentHash({
    batchCode: batch.batchCode,
    toWalletAddress,
    shipmentReference: input.shipmentReference
  });

  const transfer = await prisma.transfer.create({
    data: {
      batchId: batch.id,
      fromOrgId: batch.currentCustodianId,
      toOrgId: toOrganization?.id,
      toWalletAddress,
      shipmentReference: input.shipmentReference,
      shipmentHash,
      checkpointCid: input.checkpointCid,
      notes: input.notes,
      txHash: input.txHash,
      status: TransferStatus.REQUESTED
    },
    include: {
      fromOrg: true,
      toOrg: true
    }
  });

  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus.IN_TRANSIT,
      lastTxHash: input.txHash
    }
  });

  await writeAuditEvent({
    eventRef: `transfer:${transfer.id}`,
    batch: { connect: { id: batch.id } },
    organization: batch.currentCustodianId
      ? { connect: { id: batch.currentCustodianId } }
      : undefined,
    eventType: 'TRANSFER_LOGGED_OFFCHAIN',
    actorWallet: user.walletAddress,
    txHash: input.txHash,
    payload: {
      toWalletAddress,
      shipmentHash,
      shipmentReference: input.shipmentReference
    }
  });

  return transfer;
}
