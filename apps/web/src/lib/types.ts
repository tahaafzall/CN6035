export type OrganizationRecord = {
  id: string;
  walletAddress: string;
  name: string | null;
  role: string | null;
  contactEmail?: string | null;
  location?: string | null;
  complianceId?: string | null;
  website?: string | null;
  notes?: string | null;
  isProfileComplete?: boolean;
};

export type TelemetryRecord = {
  id: string;
  temperatureC: number;
  humidityPercent: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
  deviceId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  note?: string | null;
};

export type TransferRecord = {
  id: string;
  toWalletAddress: string;
  shipmentReference: string;
  shipmentHash: string;
  txHash?: string | null;
  status: string;
  requestedAt: string;
  acceptedAt?: string | null;
  notes?: string | null;
  fromOrg?: OrganizationRecord | null;
  toOrg?: OrganizationRecord | null;
};

export type AuditEventRecord = {
  id: string;
  eventType: string;
  actorWallet: string;
  txHash?: string | null;
  blockNumber?: number | null;
  chainId?: number | null;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type BatchRecord = {
  id: string;
  onChainBatchId?: number | null;
  batchCode: string;
  productName: string;
  category: string;
  description: string;
  originCountry: string;
  destinationMarket: string;
  unitCount: number;
  storageTempMin: number;
  storageTempMax: number;
  manufacturedAt: string;
  expiresAt: string;
  metadataCid?: string | null;
  metadataHash: `0x${string}`;
  documentCid?: string | null;
  documentHash: `0x${string}`;
  lastTxHash?: string | null;
  status: string;
  manufacturer: OrganizationRecord;
  currentCustodian?: OrganizationRecord | null;
  telemetry: TelemetryRecord[];
  transfers: TransferRecord[];
  auditEvents: AuditEventRecord[];
};

export type OverviewStats = {
  metrics: {
    totalBatches: number;
    registeredBatches: number;
    inTransitBatches: number;
    recalledBatches: number;
    anomalyBatches: number;
    organizations: number;
  };
  recentAuditEvents: Array<
    AuditEventRecord & {
      batch?: {
        batchCode: string;
      } | null;
    }
  >;
};
