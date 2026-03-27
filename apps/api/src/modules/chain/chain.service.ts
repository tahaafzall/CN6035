import { BatchStatus, ParticipantRole, TransferStatus } from '@prisma/client';
import { PHARMA_TRACE_ABI, contractStateLabels } from '@tracechain/shared';
import { type Address, createPublicClient, decodeEventLog, http, keccak256, stringToHex } from 'viem';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../config/prisma.js';
import type { AuthenticatedUser } from '../../types/auth.js';
import { ApiError } from '../../utils/api-error.js';
import { buildDocumentHashFromCid } from '../../utils/hash.js';
import { normalizeWalletAddress } from '../../utils/addresses.js';

function makeEventRef(blockNumber: bigint, logIndex: number) {
  return `${env.CHAIN_ID}:${blockNumber.toString()}:${logIndex}`;
}

const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

const roleHashToParticipantRole: Record<string, ParticipantRole> = {
  [DEFAULT_ADMIN_ROLE]: ParticipantRole.ADMIN,
  [keccak256(stringToHex('MANUFACTURER_ROLE'))]: ParticipantRole.MANUFACTURER,
  [keccak256(stringToHex('LOGISTICS_ROLE'))]: ParticipantRole.LOGISTICS,
  [keccak256(stringToHex('DISTRIBUTOR_ROLE'))]: ParticipantRole.DISTRIBUTOR,
  [keccak256(stringToHex('PHARMACY_ROLE'))]: ParticipantRole.PHARMACY,
  [keccak256(stringToHex('REGULATOR_ROLE'))]: ParticipantRole.REGULATOR
};

function toJsonPayload(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue
    )
  );
}

async function ensureOrganization(walletAddressInput: string, role?: ParticipantRole) {
  const walletAddress = normalizeWalletAddress(walletAddressInput);

  return prisma.organization.upsert({
    where: { walletAddress },
    update: role ? { role } : {},
    create: {
      walletAddress,
      role
    }
  });
}

function participantRoleFromHash(roleHash: string) {
  return roleHashToParticipantRole[roleHash] ?? null;
}

function isUnknownEventSignatureError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbiEventSignatureNotFoundError'
  );
}

async function handleRoleGranted(
  args: {
    role: string;
    account: Address;
    sender: Address;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const mappedRole = participantRoleFromHash(args.role);
  const organization = await ensureOrganization(args.account, mappedRole ?? undefined);

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      organizationId: organization.id,
      eventType: mappedRole ? 'CHAIN_ROLE_GRANTED' : 'CHAIN_ROLE_GRANTED_UNMAPPED',
      actorWallet: normalizeWalletAddress(args.sender),
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload({
        ...args,
        mappedRole
      })
    }
  });
}

async function handleRoleRevoked(
  args: {
    role: string;
    account: Address;
    sender: Address;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const mappedRole = participantRoleFromHash(args.role);
  const walletAddress = normalizeWalletAddress(args.account);

  const organization = await prisma.organization.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress }
  });

  if (mappedRole && organization.role === mappedRole) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        role: null
      }
    });
  }

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      organizationId: organization.id,
      eventType: mappedRole ? 'CHAIN_ROLE_REVOKED' : 'CHAIN_ROLE_REVOKED_UNMAPPED',
      actorWallet: normalizeWalletAddress(args.sender),
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload({
        ...args,
        mappedRole
      })
    }
  });
}

async function handleBatchRegistered(
  args: {
    batchId: bigint;
    batchCode: string;
    productName: string;
    manufacturer: Address;
    metadataHash: string;
    documentHash: string;
    expiresAt: bigint;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const manufacturer = await ensureOrganization(args.manufacturer, ParticipantRole.MANUFACTURER);

  const existing = await prisma.batch.findFirst({
    where: {
      OR: [{ onChainBatchId: Number(args.batchId) }, { metadataHash: args.metadataHash }]
    }
  });

  const batch =
    existing ||
    (await prisma.batch.create({
      data: {
        onChainBatchId: Number(args.batchId),
        batchCode: args.batchCode,
        productName: args.productName,
        category: 'Recovered from chain',
        description: 'Recovered from blockchain event indexing.',
        originCountry: 'Unknown',
        destinationMarket: 'Unknown',
        unitCount: 0,
        storageTempMin: 2,
        storageTempMax: 8,
        manufacturedAt: new Date(),
        expiresAt: new Date(Number(args.expiresAt) * 1000),
        metadataHash: args.metadataHash,
        documentHash: args.documentHash || buildDocumentHashFromCid(null),
        status: BatchStatus.REGISTERED,
        manufacturerId: manufacturer.id,
        currentCustodianId: manufacturer.id
      }
    }));

  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      onChainBatchId: Number(args.batchId),
      batchCode: args.batchCode,
      productName: args.productName,
      expiresAt: new Date(Number(args.expiresAt) * 1000),
      lastTxHash: txHash,
      status: BatchStatus.REGISTERED,
      manufacturerId: manufacturer.id,
      currentCustodianId: manufacturer.id
    }
  });

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      batchId: batch.id,
      organizationId: manufacturer.id,
      eventType: 'CHAIN_BATCH_REGISTERED',
      actorWallet: manufacturer.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}

async function handleTransferRequested(
  args: {
    batchId: bigint;
    from: Address;
    to: Address;
    shipmentHash: string;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const batch = await prisma.batch.findUnique({
    where: { onChainBatchId: Number(args.batchId) }
  });

  if (!batch) {
    return;
  }

  const fromOrg = await ensureOrganization(args.from);
  const toOrg = await ensureOrganization(args.to);

  await prisma.transfer.upsert({
    where: { shipmentHash: args.shipmentHash },
    update: {
      batchId: batch.id,
      fromOrgId: fromOrg.id,
      toOrgId: toOrg.id,
      toWalletAddress: toOrg.walletAddress,
      txHash,
      status: TransferStatus.REQUESTED
    },
    create: {
      batchId: batch.id,
      fromOrgId: fromOrg.id,
      toOrgId: toOrg.id,
      toWalletAddress: toOrg.walletAddress,
      shipmentReference: args.shipmentHash.slice(0, 12),
      shipmentHash: args.shipmentHash,
      txHash,
      status: TransferStatus.REQUESTED
    }
  });

  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus.IN_TRANSIT,
      lastTxHash: txHash
    }
  });

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      batchId: batch.id,
      organizationId: fromOrg.id,
      eventType: 'CHAIN_TRANSFER_REQUESTED',
      actorWallet: fromOrg.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}

async function handleTransferAccepted(
  args: {
    batchId: bigint;
    from: Address;
    to: Address;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const batch = await prisma.batch.findUnique({
    where: { onChainBatchId: Number(args.batchId) }
  });

  if (!batch) {
    return;
  }

  const toOrg = await ensureOrganization(args.to);

  await prisma.transfer.updateMany({
    where: {
      batchId: batch.id,
      toWalletAddress: toOrg.walletAddress,
      status: TransferStatus.REQUESTED
    },
    data: {
      status: TransferStatus.ACCEPTED,
      acceptedAt: new Date(),
      txHash
    }
  });

  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus.DELIVERED,
      currentCustodianId: toOrg.id,
      lastTxHash: txHash
    }
  });

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      batchId: batch.id,
      organizationId: toOrg.id,
      eventType: 'CHAIN_TRANSFER_ACCEPTED',
      actorWallet: toOrg.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}

async function handleCheckpointRecorded(
  args: {
    batchId: bigint;
    actor: Address;
    newState: number;
    checkpointHash: string;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const batch = await prisma.batch.findUnique({
    where: { onChainBatchId: Number(args.batchId) }
  });

  if (!batch) {
    return;
  }

  const actor = await ensureOrganization(args.actor);
  const mappedStatus = contractStateLabels[Number(args.newState)] || BatchStatus.REGISTERED;

  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: mappedStatus,
      lastTxHash: txHash
    }
  });

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      batchId: batch.id,
      organizationId: actor.id,
      eventType: 'CHAIN_CHECKPOINT_RECORDED',
      actorWallet: actor.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}

async function handleBatchRecalled(
  args: {
    batchId: bigint;
    actor: Address;
    recallHash: string;
  },
  txHash: string,
  blockNumber: bigint,
  logIndex: number
) {
  const batch = await prisma.batch.findUnique({
    where: { onChainBatchId: Number(args.batchId) }
  });

  if (!batch) {
    return;
  }

  const actor = await ensureOrganization(args.actor);

  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus.RECALLED,
      lastTxHash: txHash
    }
  });

  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      batchId: batch.id,
      organizationId: actor.id,
      eventType: 'CHAIN_BATCH_RECALLED',
      actorWallet: actor.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}

export async function syncChainProjection() {
  if (!env.CONTRACT_ADDRESS) {
    return {
      enabled: false,
      processedLogs: 0,
      latestBlock: null
    };
  }

  const publicClient = createPublicClient({
    transport: http(env.RPC_URL)
  });

  const latestBlock = await publicClient.getBlockNumber();
  const cursor = await prisma.chainCursor.upsert({
    where: { chainId: env.CHAIN_ID },
    update: {},
    create: {
      chainId: env.CHAIN_ID,
      lastProcessedBlock: 0n
    }
  });

  const fromBlock = cursor.lastProcessedBlock === 0n ? 0n : cursor.lastProcessedBlock + 1n;

  if (latestBlock < fromBlock) {
    return {
      enabled: true,
      processedLogs: 0,
      latestBlock: latestBlock.toString(),
      fromBlock: fromBlock.toString()
    };
  }

  const logs = await publicClient.getLogs({
    address: env.CONTRACT_ADDRESS as Address,
    fromBlock,
    toBlock: latestBlock
  });

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: PHARMA_TRACE_ABI,
        topics: log.topics,
        data: log.data
      });

      const txHash = log.transactionHash ?? null;
      const blockNumber = log.blockNumber ?? 0n;
      const logIndex = log.logIndex ?? 0;

      if (!txHash) {
        continue;
      }

      switch (decoded.eventName) {
        case 'RoleGranted':
          await handleRoleGranted(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        case 'RoleRevoked':
          await handleRoleRevoked(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        case 'BatchRegistered':
          await handleBatchRegistered(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        case 'TransferRequested':
          await handleTransferRequested(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        case 'TransferAccepted':
          await handleTransferAccepted(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        case 'CheckpointRecorded':
          await handleCheckpointRecorded(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        case 'BatchRecalled':
          await handleBatchRecalled(decoded.args as never, txHash, blockNumber, logIndex);
          break;
        default:
          break;
      }
    } catch (error) {
      if (isUnknownEventSignatureError(error)) {
        continue;
      }

      logger.warn({ err: error }, 'Failed to decode one contract event log');
    }
  }

  await prisma.chainCursor.update({
    where: {
      chainId: env.CHAIN_ID
    },
    data: {
      lastProcessedBlock: latestBlock
    }
  });

  return {
    enabled: true,
    processedLogs: logs.length,
    latestBlock: latestBlock.toString(),
    fromBlock: fromBlock.toString()
  };
}

export async function getChainStatus() {
  const cursor = await prisma.chainCursor.findUnique({
    where: {
      chainId: env.CHAIN_ID
    }
  });

  return {
    contractAddress: env.CONTRACT_ADDRESS ?? null,
    chainId: env.CHAIN_ID,
    rpcUrl: env.RPC_URL,
    lastProcessedBlock: cursor?.lastProcessedBlock.toString() ?? '0'
  };
}

export function assertCanForceSync(user: AuthenticatedUser) {
  if (user.role !== ParticipantRole.ADMIN && user.role !== ParticipantRole.REGULATOR) {
    throw ApiError.forbidden('Only an administrator or regulator can force a sync.');
  }
}
