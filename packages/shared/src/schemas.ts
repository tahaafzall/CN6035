import { z } from 'zod';

import { batchStatuses, participantRoles, severityLevels } from './constants';

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'A valid EVM wallet address is required.');

export const transactionHashSchema = z
  .string()
  .regex(/^0x([A-Fa-f0-9]{64})$/, 'A valid transaction hash is required.');

export const requestNonceSchema = z.object({
  walletAddress: walletAddressSchema
});

export const verifySignatureSchema = z.object({
  walletAddress: walletAddressSchema,
  signature: z.string().min(10, 'A wallet signature is required.')
});

export const organizationProfileSchema = z.object({
  name: z.string().min(3).max(120),
  role: z.enum(participantRoles),
  contactEmail: z.string().email(),
  location: z.string().min(2).max(160),
  complianceId: z.string().min(3).max(80),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal(''))
});

export const createBatchDraftSchema = z.object({
  batchCode: z.string().min(4).max(40),
  productName: z.string().min(3).max(120),
  category: z.string().min(3).max(80),
  description: z.string().min(20).max(1200),
  originCountry: z.string().min(2).max(80),
  destinationMarket: z.string().min(2).max(80),
  unitCount: z.coerce.number().int().positive(),
  storageTempMin: z.coerce.number().min(-80).max(40),
  storageTempMax: z.coerce.number().min(-80).max(40),
  manufacturedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  metadataCid: z.string().max(255).optional().nullable(),
  documentCid: z.string().max(255).optional().nullable(),
  notes: z.string().max(500).optional().nullable()
});

export const linkOnChainBatchSchema = z.object({
  onChainBatchId: z.coerce.number().int().positive(),
  txHash: transactionHashSchema
});

export const createTransferLogSchema = z.object({
  toWalletAddress: walletAddressSchema,
  shipmentReference: z.string().min(3).max(80),
  notes: z.string().max(500).optional().nullable(),
  checkpointCid: z.string().max(255).optional().nullable(),
  txHash: transactionHashSchema
});

export const telemetrySchema = z.object({
  temperatureC: z.coerce.number().min(-80).max(60),
  humidityPercent: z.coerce.number().min(0).max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  recordedAt: z.string().datetime(),
  deviceId: z.string().min(3).max(80),
  severity: z.enum(severityLevels).default('LOW'),
  batchCode: z.string().min(4).max(40).optional(),
  onChainBatchId: z.coerce.number().int().positive().optional()
});

export const batchFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(batchStatuses).optional(),
  role: z.enum(participantRoles).optional()
});

export type RequestNonceInput = z.infer<typeof requestNonceSchema>;
export type VerifySignatureInput = z.infer<typeof verifySignatureSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
export type CreateBatchDraftInput = z.infer<typeof createBatchDraftSchema>;
export type LinkOnChainBatchInput = z.infer<typeof linkOnChainBatchSchema>;
export type CreateTransferLogInput = z.infer<typeof createTransferLogSchema>;
export type TelemetryInput = z.infer<typeof telemetrySchema>;
export type BatchFilterInput = z.infer<typeof batchFilterSchema>;
