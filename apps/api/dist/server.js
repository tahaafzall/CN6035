// src/server.ts
import "dotenv/config";

// src/app.ts
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { fileURLToPath } from "url";

// src/config/env.ts
import { z } from "zod";
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4e3),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("postgresql://tracechain:tracechain@localhost:5432/tracechain"),
  JWT_SECRET: z.string().min(16).default("tracechain-development-secret"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  RPC_URL: z.string().default("http://127.0.0.1:8545"),
  CHAIN_ID: z.coerce.number().int().positive().default(31337),
  CONTRACT_ADDRESS: z.string().optional(),
  CHAIN_SYNC_INTERVAL_MS: z.coerce.number().int().positive().default(15e3),
  IPFS_API_URL: z.string().optional(),
  IPFS_GATEWAY_BASE_URL: z.string().default("http://127.0.0.1:8080/ipfs")
});
var env = envSchema.parse(process.env);

// src/config/logger.ts
import pino from "pino";
var logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport: env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard"
    }
  } : void 0
});

// src/middleware/request-id.ts
import { randomUUID } from "crypto";
function attachRequestId(request, response, next) {
  request.requestId = randomUUID();
  response.setHeader("x-request-id", request.requestId);
  next();
}

// src/middleware/error-handler.ts
import { ZodError } from "zod";

// src/utils/api-error.ts
var ApiError = class _ApiError extends Error {
  statusCode;
  details;
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
  static badRequest(message, details) {
    return new _ApiError(400, message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new _ApiError(401, message);
  }
  static forbidden(message = "Permission denied") {
    return new _ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new _ApiError(404, message);
  }
};

// src/middleware/error-handler.ts
function errorHandler(error, request, response, _next) {
  void _next;
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: "Validation failed",
      requestId: request.requestId,
      details: error.flatten()
    });
  }
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      error: error.message,
      requestId: request.requestId,
      details: error.details
    });
  }
  logger.error({ err: error, requestId: request.requestId }, "Unhandled API error");
  return response.status(500).json({
    error: "Internal server error",
    requestId: request.requestId
  });
}

// src/modules/auth/auth.router.ts
import { requestNonceSchema, verifySignatureSchema } from "@tracechain/shared";
import { Router } from "express";

// src/utils/async-handler.ts
function asyncHandler(handler) {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}

// src/middleware/validate.ts
function validate(schema, source = "body") {
  return (request, _response, next) => {
    const parsed = schema.parse(request[source]);
    request[source] = parsed;
    next();
  };
}

// src/config/prisma.ts
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient();

// src/utils/addresses.ts
import { getAddress } from "viem";
function normalizeWalletAddress(walletAddress) {
  return getAddress(walletAddress);
}

// src/utils/auth-message.ts
function buildAuthMessage(walletAddress, nonce) {
  return [
    "TraceChain Pharma Supply Network",
    "Sign this message to authenticate your wallet for the off-chain API.",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${(/* @__PURE__ */ new Date()).toISOString()}`
  ].join("\n");
}

// src/modules/auth/auth.service.ts
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { recoverMessageAddress } from "viem";
async function issueAuthNonce(walletAddressInput) {
  const walletAddress = normalizeWalletAddress(walletAddressInput);
  const nonce = randomBytes(16).toString("hex");
  const message = buildAuthMessage(walletAddress, nonce);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
  await prisma.authNonce.upsert({
    where: { walletAddress },
    update: { nonce, message, expiresAt },
    create: { walletAddress, nonce, message, expiresAt }
  });
  return { walletAddress, nonce, message, expiresAt };
}
async function verifyWalletSignature(walletAddressInput, signature) {
  const walletAddress = normalizeWalletAddress(walletAddressInput);
  const record = await prisma.authNonce.findUnique({ where: { walletAddress } });
  if (!record) {
    throw ApiError.badRequest("No active nonce was found for this wallet.");
  }
  if (record.expiresAt < /* @__PURE__ */ new Date()) {
    throw ApiError.badRequest("The authentication nonce has expired. Request a new one.");
  }
  const recoveredAddress = normalizeWalletAddress(
    await recoverMessageAddress({
      message: record.message,
      signature
    })
  );
  if (recoveredAddress !== walletAddress) {
    throw ApiError.unauthorized("The supplied signature does not match the wallet address.");
  }
  const organization = await prisma.organization.upsert({
    where: { walletAddress },
    update: {},
    create: {
      walletAddress
    }
  });
  await prisma.authNonce.delete({ where: { walletAddress } });
  const token = jwt.sign(
    {
      sub: organization.id,
      organizationId: organization.id,
      walletAddress: organization.walletAddress,
      role: organization.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  return {
    token,
    organization
  };
}

// src/modules/auth/auth.router.ts
var authRouter = Router();
authRouter.post(
  "/nonce",
  validate(requestNonceSchema),
  asyncHandler(async (request, response) => {
    const result = await issueAuthNonce(request.body.walletAddress);
    response.json(result);
  })
);
authRouter.post(
  "/verify",
  validate(verifySignatureSchema),
  asyncHandler(async (request, response) => {
    const result = await verifyWalletSignature(request.body.walletAddress, request.body.signature);
    response.json(result);
  })
);

// src/modules/batches/batches.router.ts
import {
  batchFilterSchema,
  createBatchDraftSchema,
  createTransferLogSchema,
  linkOnChainBatchSchema
} from "@tracechain/shared";
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
function requireAuth(request, _response, next) {
  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized());
  }
  try {
    const token = authorizationHeader.replace("Bearer ", "");
    const payload = jwt2.verify(token, env.JWT_SECRET);
    request.user = {
      organizationId: payload.organizationId,
      walletAddress: payload.walletAddress,
      role: payload.role ?? null
    };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired token."));
  }
}

// src/modules/batches/batches.service.ts
import { BatchStatus, ParticipantRole, TransferStatus } from "@prisma/client";

// src/utils/hash.ts
import { keccak256, stringToHex, toHex, zeroHash } from "viem";
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(
      ([left], [right]) => left.localeCompare(right)
    );
    return `{${entries.map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function buildMetadataHash(payload) {
  return keccak256(stringToHex(stableStringify(payload)));
}
function buildDocumentHashFromCid(cid) {
  return cid ? keccak256(stringToHex(cid)) : zeroHash;
}
function buildShipmentHash(payload) {
  return keccak256(
    stringToHex(
      `${payload.batchCode}|${payload.toWalletAddress.toLowerCase()}|${payload.shipmentReference}`
    )
  );
}
function buildCheckpointHash(payload) {
  return keccak256(stringToHex(stableStringify(payload)));
}
function buildFileHash(buffer) {
  return keccak256(toHex(buffer));
}

// src/modules/batches/batches.service.ts
async function requireOrganization(user) {
  const organization = await prisma.organization.findUnique({
    where: {
      walletAddress: user.walletAddress
    }
  });
  if (!organization) {
    throw ApiError.unauthorized("Complete wallet authentication before using protected endpoints.");
  }
  return organization;
}
async function writeAuditEvent(data) {
  return prisma.auditEvent.create({
    data
  });
}
function canAdminister(user) {
  return user.role === ParticipantRole.ADMIN || user.role === ParticipantRole.REGULATOR;
}
async function listBatches(filters) {
  const where = {
    ...filters.status ? { status: filters.status } : {},
    ...filters.q ? {
      OR: [
        { batchCode: { contains: filters.q, mode: "insensitive" } },
        { productName: { contains: filters.q, mode: "insensitive" } },
        { category: { contains: filters.q, mode: "insensitive" } },
        { manufacturer: { is: { name: { contains: filters.q, mode: "insensitive" } } } }
      ]
    } : {},
    ...filters.role ? { manufacturer: { is: { role: filters.role } } } : {}
  };
  return prisma.batch.findMany({
    where,
    include: {
      manufacturer: true,
      currentCustodian: true,
      telemetry: {
        take: 1,
        orderBy: { recordedAt: "desc" }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}
async function createBatchDraft(user, input) {
  const organization = await requireOrganization(user);
  if (!organization.isProfileComplete || organization.role !== ParticipantRole.MANUFACTURER) {
    throw ApiError.forbidden(
      "Only a complete manufacturer profile can create new pharmaceutical batches."
    );
  }
  if (input.storageTempMin >= input.storageTempMax) {
    throw ApiError.badRequest("Minimum storage temperature must be below the maximum.");
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
    eventType: "BATCH_DRAFT_CREATED",
    actorWallet: user.walletAddress,
    payload: {
      metadataHash,
      documentHash
    }
  });
  return batch;
}
async function linkOnChainBatch(batchId, user, input) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      manufacturer: true
    }
  });
  if (!batch) {
    throw ApiError.notFound("Batch draft not found.");
  }
  if (batch.manufacturer.walletAddress !== user.walletAddress && batch.currentCustodianId !== user.organizationId && !canAdminister(user)) {
    throw ApiError.forbidden("Only the manufacturer or a privileged reviewer can link batches.");
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
    eventType: "BATCH_LINKED_ONCHAIN",
    actorWallet: user.walletAddress,
    txHash: input.txHash,
    payload: {
      onChainBatchId: input.onChainBatchId
    }
  });
  return updatedBatch;
}
async function getBatchByIdentifier(identifier) {
  const isNumeric = /^\d+$/.test(identifier);
  const batch = await prisma.batch.findFirst({
    where: isNumeric ? {
      onChainBatchId: Number(identifier)
    } : {
      OR: [{ id: identifier }, { batchCode: identifier }]
    },
    include: {
      manufacturer: true,
      currentCustodian: true,
      telemetry: {
        orderBy: { recordedAt: "desc" },
        take: 25
      },
      transfers: {
        include: {
          fromOrg: true,
          toOrg: true
        },
        orderBy: { requestedAt: "desc" }
      },
      auditEvents: {
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  });
  if (!batch) {
    throw ApiError.notFound("Batch not found.");
  }
  return batch;
}
async function getBatchTimeline(identifier) {
  const batch = await getBatchByIdentifier(identifier);
  const timeline = [
    ...batch.auditEvents.map((event) => ({
      id: event.id,
      type: "AUDIT",
      title: event.eventType,
      occurredAt: event.createdAt,
      payload: event.payload,
      txHash: event.txHash
    })),
    ...batch.transfers.map((transfer) => ({
      id: transfer.id,
      type: "TRANSFER",
      title: `${transfer.fromOrg?.name || "Unknown sender"} -> ${transfer.toOrg?.name || transfer.toWalletAddress}`,
      occurredAt: transfer.acceptedAt || transfer.requestedAt,
      payload: {
        status: transfer.status,
        shipmentReference: transfer.shipmentReference
      },
      txHash: transfer.txHash
    })),
    ...batch.telemetry.map((reading) => ({
      id: reading.id,
      type: "TELEMETRY",
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
async function createTransferLog(batchId, user, input) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      currentCustodian: true
    }
  });
  if (!batch) {
    throw ApiError.notFound("Batch not found.");
  }
  if (!batch.currentCustodian || batch.currentCustodian.walletAddress !== user.walletAddress) {
    throw ApiError.forbidden("Only the current custodian can log a transfer request.");
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
    organization: batch.currentCustodianId ? { connect: { id: batch.currentCustodianId } } : void 0,
    eventType: "TRANSFER_LOGGED_OFFCHAIN",
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

// src/modules/batches/batches.router.ts
var batchesRouter = Router2();
batchesRouter.get(
  "/",
  validate(batchFilterSchema, "query"),
  asyncHandler(async (request, response) => {
    response.json(await listBatches(request.query));
  })
);
batchesRouter.post(
  "/draft",
  requireAuth,
  validate(createBatchDraftSchema),
  asyncHandler(async (request, response) => {
    response.status(201).json(await createBatchDraft(request.user, request.body));
  })
);
batchesRouter.post(
  "/:id/link-onchain",
  requireAuth,
  validate(linkOnChainBatchSchema),
  asyncHandler(async (request, response) => {
    response.json(await linkOnChainBatch(request.params.id, request.user, request.body));
  })
);
batchesRouter.post(
  "/:id/transfers",
  requireAuth,
  validate(createTransferLogSchema),
  asyncHandler(async (request, response) => {
    response.status(201).json(await createTransferLog(request.params.id, request.user, request.body));
  })
);
batchesRouter.get(
  "/:identifier/timeline",
  asyncHandler(async (request, response) => {
    response.json(await getBatchTimeline(request.params.identifier));
  })
);
batchesRouter.get(
  "/:identifier",
  asyncHandler(async (request, response) => {
    response.json(await getBatchByIdentifier(request.params.identifier));
  })
);

// src/modules/chain/chain.router.ts
import { Router as Router3 } from "express";

// src/modules/chain/chain.service.ts
import { BatchStatus as BatchStatus2, ParticipantRole as ParticipantRole2, TransferStatus as TransferStatus2 } from "@prisma/client";
import { PHARMA_TRACE_ABI, contractStateLabels } from "@tracechain/shared";
import { createPublicClient, decodeEventLog, http, keccak256 as keccak2562, stringToHex as stringToHex2 } from "viem";
function makeEventRef(blockNumber, logIndex) {
  return `${env.CHAIN_ID}:${blockNumber.toString()}:${logIndex}`;
}
var DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
var roleHashToParticipantRole = {
  [DEFAULT_ADMIN_ROLE]: ParticipantRole2.ADMIN,
  [keccak2562(stringToHex2("MANUFACTURER_ROLE"))]: ParticipantRole2.MANUFACTURER,
  [keccak2562(stringToHex2("LOGISTICS_ROLE"))]: ParticipantRole2.LOGISTICS,
  [keccak2562(stringToHex2("DISTRIBUTOR_ROLE"))]: ParticipantRole2.DISTRIBUTOR,
  [keccak2562(stringToHex2("PHARMACY_ROLE"))]: ParticipantRole2.PHARMACY,
  [keccak2562(stringToHex2("REGULATOR_ROLE"))]: ParticipantRole2.REGULATOR
};
function toJsonPayload(value) {
  return JSON.parse(
    JSON.stringify(
      value,
      (_key, nestedValue) => typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue
    )
  );
}
async function ensureOrganization(walletAddressInput, role) {
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
function participantRoleFromHash(roleHash) {
  return roleHashToParticipantRole[roleHash] ?? null;
}
function isUnknownEventSignatureError(error) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbiEventSignatureNotFoundError";
}
async function handleRoleGranted(args, txHash, blockNumber, logIndex) {
  const mappedRole = participantRoleFromHash(args.role);
  const organization = await ensureOrganization(args.account, mappedRole ?? void 0);
  await prisma.auditEvent.upsert({
    where: { eventRef: makeEventRef(blockNumber, logIndex) },
    update: {},
    create: {
      eventRef: makeEventRef(blockNumber, logIndex),
      organizationId: organization.id,
      eventType: mappedRole ? "CHAIN_ROLE_GRANTED" : "CHAIN_ROLE_GRANTED_UNMAPPED",
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
async function handleRoleRevoked(args, txHash, blockNumber, logIndex) {
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
      eventType: mappedRole ? "CHAIN_ROLE_REVOKED" : "CHAIN_ROLE_REVOKED_UNMAPPED",
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
async function handleBatchRegistered(args, txHash, blockNumber, logIndex) {
  const manufacturer = await ensureOrganization(args.manufacturer, ParticipantRole2.MANUFACTURER);
  const existing = await prisma.batch.findFirst({
    where: {
      OR: [{ onChainBatchId: Number(args.batchId) }, { metadataHash: args.metadataHash }]
    }
  });
  const batch = existing || await prisma.batch.create({
    data: {
      onChainBatchId: Number(args.batchId),
      batchCode: args.batchCode,
      productName: args.productName,
      category: "Recovered from chain",
      description: "Recovered from blockchain event indexing.",
      originCountry: "Unknown",
      destinationMarket: "Unknown",
      unitCount: 0,
      storageTempMin: 2,
      storageTempMax: 8,
      manufacturedAt: /* @__PURE__ */ new Date(),
      expiresAt: new Date(Number(args.expiresAt) * 1e3),
      metadataHash: args.metadataHash,
      documentHash: args.documentHash || buildDocumentHashFromCid(null),
      status: BatchStatus2.REGISTERED,
      manufacturerId: manufacturer.id,
      currentCustodianId: manufacturer.id
    }
  });
  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      onChainBatchId: Number(args.batchId),
      batchCode: args.batchCode,
      productName: args.productName,
      expiresAt: new Date(Number(args.expiresAt) * 1e3),
      lastTxHash: txHash,
      status: BatchStatus2.REGISTERED,
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
      eventType: "CHAIN_BATCH_REGISTERED",
      actorWallet: manufacturer.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}
async function handleTransferRequested(args, txHash, blockNumber, logIndex) {
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
      status: TransferStatus2.REQUESTED
    },
    create: {
      batchId: batch.id,
      fromOrgId: fromOrg.id,
      toOrgId: toOrg.id,
      toWalletAddress: toOrg.walletAddress,
      shipmentReference: args.shipmentHash.slice(0, 12),
      shipmentHash: args.shipmentHash,
      txHash,
      status: TransferStatus2.REQUESTED
    }
  });
  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus2.IN_TRANSIT,
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
      eventType: "CHAIN_TRANSFER_REQUESTED",
      actorWallet: fromOrg.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}
async function handleTransferAccepted(args, txHash, blockNumber, logIndex) {
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
      status: TransferStatus2.REQUESTED
    },
    data: {
      status: TransferStatus2.ACCEPTED,
      acceptedAt: /* @__PURE__ */ new Date(),
      txHash
    }
  });
  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus2.DELIVERED,
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
      eventType: "CHAIN_TRANSFER_ACCEPTED",
      actorWallet: toOrg.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}
async function handleCheckpointRecorded(args, txHash, blockNumber, logIndex) {
  const batch = await prisma.batch.findUnique({
    where: { onChainBatchId: Number(args.batchId) }
  });
  if (!batch) {
    return;
  }
  const actor = await ensureOrganization(args.actor);
  const mappedStatus = contractStateLabels[Number(args.newState)] || BatchStatus2.REGISTERED;
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
      eventType: "CHAIN_CHECKPOINT_RECORDED",
      actorWallet: actor.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}
async function handleBatchRecalled(args, txHash, blockNumber, logIndex) {
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
      status: BatchStatus2.RECALLED,
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
      eventType: "CHAIN_BATCH_RECALLED",
      actorWallet: actor.walletAddress,
      txHash,
      blockNumber: Number(blockNumber),
      chainId: env.CHAIN_ID,
      payload: toJsonPayload(args)
    }
  });
}
async function syncChainProjection() {
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
    address: env.CONTRACT_ADDRESS,
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
        case "RoleGranted":
          await handleRoleGranted(decoded.args, txHash, blockNumber, logIndex);
          break;
        case "RoleRevoked":
          await handleRoleRevoked(decoded.args, txHash, blockNumber, logIndex);
          break;
        case "BatchRegistered":
          await handleBatchRegistered(decoded.args, txHash, blockNumber, logIndex);
          break;
        case "TransferRequested":
          await handleTransferRequested(decoded.args, txHash, blockNumber, logIndex);
          break;
        case "TransferAccepted":
          await handleTransferAccepted(decoded.args, txHash, blockNumber, logIndex);
          break;
        case "CheckpointRecorded":
          await handleCheckpointRecorded(decoded.args, txHash, blockNumber, logIndex);
          break;
        case "BatchRecalled":
          await handleBatchRecalled(decoded.args, txHash, blockNumber, logIndex);
          break;
        default:
          break;
      }
    } catch (error) {
      if (isUnknownEventSignatureError(error)) {
        continue;
      }
      logger.warn({ err: error }, "Failed to decode one contract event log");
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
async function getChainStatus() {
  const cursor = await prisma.chainCursor.findUnique({
    where: {
      chainId: env.CHAIN_ID
    }
  });
  return {
    contractAddress: env.CONTRACT_ADDRESS ?? null,
    chainId: env.CHAIN_ID,
    rpcUrl: env.RPC_URL,
    lastProcessedBlock: cursor?.lastProcessedBlock.toString() ?? "0"
  };
}
function assertCanForceSync(user) {
  if (user.role !== ParticipantRole2.ADMIN && user.role !== ParticipantRole2.REGULATOR) {
    throw ApiError.forbidden("Only an administrator or regulator can force a sync.");
  }
}

// src/modules/chain/chain.router.ts
var chainRouter = Router3();
chainRouter.get(
  "/status",
  asyncHandler(async (_request, response) => {
    response.json(await getChainStatus());
  })
);
chainRouter.post(
  "/sync",
  requireAuth,
  asyncHandler(async (request, response) => {
    assertCanForceSync(request.user);
    response.json(await syncChainProjection());
  })
);

// src/modules/documents/documents.router.ts
import { Router as Router4 } from "express";
import multer from "multer";

// src/services/ipfs.service.ts
import { create as createIpfsClient } from "ipfs-http-client";
var ipfsClient = null;
function getIpfsClient() {
  if (!env.IPFS_API_URL) {
    throw new ApiError(
      503,
      "IPFS is not configured. Set IPFS_API_URL to enable document uploads."
    );
  }
  ipfsClient ??= createIpfsClient({ url: env.IPFS_API_URL });
  return ipfsClient;
}
async function uploadDocumentBuffer(buffer, filename, mimetype) {
  const client = getIpfsClient();
  const result = await client.add({
    path: filename,
    content: buffer
  });
  const cid = result.cid.toString();
  return {
    cid,
    hash: buildFileHash(buffer),
    filename,
    mimetype,
    size: buffer.byteLength,
    gatewayUrl: `${env.IPFS_GATEWAY_BASE_URL}/${cid}`
  };
}

// src/modules/documents/documents.router.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});
var documentsRouter = Router4();
documentsRouter.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      throw ApiError.badRequest("A file upload is required.");
    }
    const result = await uploadDocumentBuffer(
      request.file.buffer,
      request.file.originalname,
      request.file.mimetype
    );
    response.status(201).json(result);
  })
);

// src/modules/organizations/organizations.router.ts
import { organizationProfileSchema } from "@tracechain/shared";
import { Router as Router5 } from "express";

// src/modules/organizations/organizations.service.ts
async function listOrganizations() {
  return prisma.organization.findMany({
    where: {
      isProfileComplete: true
    },
    select: {
      id: true,
      walletAddress: true,
      name: true,
      role: true,
      location: true,
      complianceId: true,
      website: true
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });
}
async function getMyOrganization(user) {
  const organization = await prisma.organization.findUnique({
    where: {
      walletAddress: user.walletAddress
    }
  });
  if (!organization) {
    throw ApiError.notFound("No organization profile was found for this wallet.");
  }
  return organization;
}
async function upsertMyOrganization(user, input) {
  return prisma.organization.upsert({
    where: {
      walletAddress: user.walletAddress
    },
    update: {
      ...input,
      website: input.website || null,
      notes: input.notes || null,
      isProfileComplete: true
    },
    create: {
      walletAddress: user.walletAddress,
      ...input,
      website: input.website || null,
      notes: input.notes || null,
      isProfileComplete: true
    }
  });
}

// src/modules/organizations/organizations.router.ts
var organizationsRouter = Router5();
organizationsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json(await listOrganizations());
  })
);
organizationsRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json(await getMyOrganization(request.user));
  })
);
organizationsRouter.put(
  "/me",
  requireAuth,
  validate(organizationProfileSchema),
  asyncHandler(async (request, response) => {
    response.json(await upsertMyOrganization(request.user, request.body));
  })
);

// src/modules/stats/stats.router.ts
import { Router as Router6 } from "express";

// src/modules/stats/stats.service.ts
import { BatchStatus as BatchStatus3 } from "@prisma/client";
async function getOverviewStats() {
  const [
    totalBatches,
    registeredBatches,
    inTransitBatches,
    recalledBatches,
    anomalyBatches,
    organizations,
    recentAuditEvents
  ] = await Promise.all([
    prisma.batch.count(),
    prisma.batch.count({ where: { status: BatchStatus3.REGISTERED } }),
    prisma.batch.count({ where: { status: BatchStatus3.IN_TRANSIT } }),
    prisma.batch.count({ where: { status: BatchStatus3.RECALLED } }),
    prisma.batch.count({ where: { status: BatchStatus3.ANOMALY } }),
    prisma.organization.count({ where: { isProfileComplete: true } }),
    prisma.auditEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          select: {
            batchCode: true
          }
        }
      }
    })
  ]);
  return {
    metrics: {
      totalBatches,
      registeredBatches,
      inTransitBatches,
      recalledBatches,
      anomalyBatches,
      organizations
    },
    recentAuditEvents
  };
}

// src/modules/stats/stats.router.ts
var statsRouter = Router6();
statsRouter.get(
  "/overview",
  asyncHandler(async (_request, response) => {
    response.json(await getOverviewStats());
  })
);

// src/modules/telemetry/telemetry.router.ts
import { telemetrySchema } from "@tracechain/shared";
import { Router as Router7 } from "express";

// src/modules/telemetry/telemetry.service.ts
import { BatchStatus as BatchStatus4, SeverityLevel } from "@prisma/client";
async function resolveBatch(input) {
  if (input.onChainBatchId) {
    return prisma.batch.findUnique({
      where: {
        onChainBatchId: input.onChainBatchId
      }
    });
  }
  if (input.batchCode) {
    return prisma.batch.findUnique({
      where: {
        batchCode: input.batchCode
      }
    });
  }
  throw ApiError.badRequest("Either batchCode or onChainBatchId must be provided.");
}
async function recordTelemetry(user, input) {
  const batch = await resolveBatch(input);
  if (!batch) {
    throw ApiError.notFound("The target batch was not found.");
  }
  const outOfRange = input.temperatureC < batch.storageTempMin || input.temperatureC > batch.storageTempMax;
  const severity = outOfRange ? SeverityLevel.HIGH : input.severity;
  const note = outOfRange ? `Temperature out of range. Expected ${batch.storageTempMin}C to ${batch.storageTempMax}C.` : null;
  const reading = await prisma.sensorReading.create({
    data: {
      batchId: batch.id,
      temperatureC: input.temperatureC,
      humidityPercent: input.humidityPercent,
      latitude: input.latitude,
      longitude: input.longitude,
      recordedAt: new Date(input.recordedAt),
      deviceId: input.deviceId,
      severity,
      note
    }
  });
  const updatePayload = {};
  if (outOfRange && batch.status !== BatchStatus4.RECALLED && batch.status !== BatchStatus4.DISPENSED) {
    updatePayload.status = BatchStatus4.ANOMALY;
  }
  if (Object.keys(updatePayload).length > 0) {
    await prisma.batch.update({
      where: { id: batch.id },
      data: updatePayload
    });
  }
  await prisma.auditEvent.create({
    data: {
      eventRef: `telemetry:${reading.id}`,
      batchId: batch.id,
      organizationId: user.organizationId,
      eventType: outOfRange ? "TELEMETRY_ANOMALY_RECORDED" : "TELEMETRY_RECORDED",
      actorWallet: user.walletAddress,
      payload: {
        checkpointHash: buildCheckpointHash({
          batchCode: batch.batchCode,
          temperatureC: input.temperatureC,
          humidityPercent: input.humidityPercent,
          location: `${input.latitude},${input.longitude}`,
          recordedAt: input.recordedAt
        }),
        severity,
        note
      }
    }
  });
  return reading;
}

// src/modules/telemetry/telemetry.router.ts
var telemetryRouter = Router7();
telemetryRouter.post(
  "/",
  requireAuth,
  validate(telemetrySchema),
  asyncHandler(async (request, response) => {
    response.status(201).json(await recordTelemetry(request.user, request.body));
  })
);

// src/app.ts
var openApiPath = fileURLToPath(new URL("../openapi/openapi.yaml", import.meta.url));
var swaggerDocument = YAML.load(openApiPath);
function createApp() {
  const app2 = express();
  app2.use(helmet());
  app2.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app2.use(express.json({ limit: "2mb" }));
  app2.use(express.urlencoded({ extended: true }));
  app2.use(attachRequestId);
  app2.use(
    pinoHttp({
      logger,
      customProps(request) {
        return { requestId: request.requestId };
      }
    })
  );
  app2.get("/health", (_request, response) => {
    response.json({
      service: "tracechain-api",
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      chainSyncEnabled: Boolean(env.CONTRACT_ADDRESS && env.RPC_URL)
    });
  });
  app2.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app2.use("/api/auth", authRouter);
  app2.use("/api/organizations", organizationsRouter);
  app2.use("/api/batches", batchesRouter);
  app2.use("/api/documents", documentsRouter);
  app2.use("/api/telemetry", telemetryRouter);
  app2.use("/api/stats", statsRouter);
  app2.use("/api/chain", chainRouter);
  app2.use((_request, response) => {
    response.status(404).json({ error: "Route not found" });
  });
  app2.use(errorHandler);
  return app2;
}

// src/server.ts
var app = createApp();
var server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "TraceChain API started");
});
var chainSyncTimer;
async function bootstrapChainSync() {
  if (!env.CONTRACT_ADDRESS || !env.RPC_URL) {
    logger.warn("Chain sync disabled because CONTRACT_ADDRESS or RPC_URL is missing");
    return;
  }
  try {
    await syncChainProjection();
  } catch (error) {
    logger.error({ err: error }, "Initial chain projection sync failed");
  }
  chainSyncTimer = setInterval(() => {
    void syncChainProjection().catch((error) => {
      logger.error({ err: error }, "Scheduled chain projection sync failed");
    });
  }, env.CHAIN_SYNC_INTERVAL_MS);
}
void bootstrapChainSync();
async function shutdown(signal) {
  logger.info({ signal }, "Shutting down TraceChain API");
  if (chainSyncTimer) {
    clearInterval(chainSyncTimer);
  }
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
