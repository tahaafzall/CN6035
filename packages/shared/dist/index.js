// src/constants.ts
var participantRoles = [
  "ADMIN",
  "MANUFACTURER",
  "LOGISTICS",
  "DISTRIBUTOR",
  "PHARMACY",
  "REGULATOR"
];
var batchStatuses = [
  "DRAFT",
  "REGISTERED",
  "IN_TRANSIT",
  "DELIVERED",
  "RECALLED",
  "DISPENSED",
  "ANOMALY"
];
var severityLevels = ["LOW", "MEDIUM", "HIGH"];
var contractStateLabels = {
  0: "REGISTERED",
  1: "IN_TRANSIT",
  2: "DELIVERED",
  3: "RECALLED",
  4: "DISPENSED"
};
var roleDescriptions = {
  ADMIN: "System operator responsible for deployment, governance, and emergency controls.",
  MANUFACTURER: "Creates pharmaceutical batches and originates the immutable audit trail.",
  LOGISTICS: "Handles transport checkpoints and shipping custody transitions.",
  DISTRIBUTOR: "Receives and redistributes batches across regional supply nodes.",
  PHARMACY: "Accepts delivery, dispenses stock, and verifies authenticity to patients.",
  REGULATOR: "Performs compliance oversight and can trigger recalls."
};
var chainDisplayNames = {
  31337: "Hardhat Local",
  11155111: "Ethereum Sepolia"
};
var supportedChainIds = Object.keys(chainDisplayNames).map(Number);

// src/contracts.ts
var PHARMA_TRACE_ABI = [
  {
    type: "function",
    stateMutability: "view",
    name: "MANUFACTURER_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "LOGISTICS_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "DISTRIBUTOR_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "PHARMACY_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "REGULATOR_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "grantSupplyChainRole",
    inputs: [
      { name: "account", type: "address" },
      { name: "role", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "revokeSupplyChainRole",
    inputs: [
      { name: "account", type: "address" },
      { name: "role", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "createBatch",
    inputs: [
      { name: "batchCode", type: "string" },
      { name: "productName", type: "string" },
      { name: "expiresAt", type: "uint64" },
      { name: "metadataHash", type: "bytes32" },
      { name: "documentHash", type: "bytes32" }
    ],
    outputs: [{ name: "batchId", type: "uint256" }]
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "requestTransfer",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "to", type: "address" },
      { name: "shipmentHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "acceptTransfer",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "recordCheckpoint",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "checkpointHash", type: "bytes32" },
      { name: "nextState", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "recallBatch",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "recallHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getBatch",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "batchCode", type: "string" },
          { name: "productName", type: "string" },
          { name: "manufacturer", type: "address" },
          { name: "currentCustodian", type: "address" },
          { name: "manufacturedAt", type: "uint64" },
          { name: "expiresAt", type: "uint64" },
          { name: "metadataHash", type: "bytes32" },
          { name: "documentHash", type: "bytes32" },
          { name: "state", type: "uint8" },
          { name: "exists", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "pendingTransfers",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "requestedAt", type: "uint64" },
      { name: "shipmentHash", type: "bytes32" },
      { name: "exists", type: "bool" }
    ]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "hasRole",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "event",
    anonymous: false,
    name: "RoleAdminChanged",
    inputs: [
      { indexed: true, name: "role", type: "bytes32" },
      { indexed: true, name: "previousAdminRole", type: "bytes32" },
      { indexed: true, name: "newAdminRole", type: "bytes32" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "RoleGranted",
    inputs: [
      { indexed: true, name: "role", type: "bytes32" },
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "sender", type: "address" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "RoleRevoked",
    inputs: [
      { indexed: true, name: "role", type: "bytes32" },
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "sender", type: "address" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "Paused",
    inputs: [{ indexed: false, name: "account", type: "address" }]
  },
  {
    type: "event",
    anonymous: false,
    name: "Unpaused",
    inputs: [{ indexed: false, name: "account", type: "address" }]
  },
  {
    type: "event",
    anonymous: false,
    name: "BatchRegistered",
    inputs: [
      { indexed: true, name: "batchId", type: "uint256" },
      { indexed: false, name: "batchCode", type: "string" },
      { indexed: false, name: "productName", type: "string" },
      { indexed: true, name: "manufacturer", type: "address" },
      { indexed: false, name: "metadataHash", type: "bytes32" },
      { indexed: false, name: "documentHash", type: "bytes32" },
      { indexed: false, name: "expiresAt", type: "uint64" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "TransferRequested",
    inputs: [
      { indexed: true, name: "batchId", type: "uint256" },
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "shipmentHash", type: "bytes32" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "TransferAccepted",
    inputs: [
      { indexed: true, name: "batchId", type: "uint256" },
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "CheckpointRecorded",
    inputs: [
      { indexed: true, name: "batchId", type: "uint256" },
      { indexed: true, name: "actor", type: "address" },
      { indexed: false, name: "newState", type: "uint8" },
      { indexed: false, name: "checkpointHash", type: "bytes32" }
    ]
  },
  {
    type: "event",
    anonymous: false,
    name: "BatchRecalled",
    inputs: [
      { indexed: true, name: "batchId", type: "uint256" },
      { indexed: true, name: "actor", type: "address" },
      { indexed: false, name: "recallHash", type: "bytes32" }
    ]
  }
];
var contractRoleKeys = {
  MANUFACTURER: "MANUFACTURER_ROLE",
  LOGISTICS: "LOGISTICS_ROLE",
  DISTRIBUTOR: "DISTRIBUTOR_ROLE",
  PHARMACY: "PHARMACY_ROLE",
  REGULATOR: "REGULATOR_ROLE"
};
var contractBatchStates = {
  REGISTERED: 0,
  IN_TRANSIT: 1,
  DELIVERED: 2,
  RECALLED: 3,
  DISPENSED: 4
};

// src/schemas.ts
import { z } from "zod";
var walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "A valid EVM wallet address is required.");
var transactionHashSchema = z.string().regex(/^0x([A-Fa-f0-9]{64})$/, "A valid transaction hash is required.");
var requestNonceSchema = z.object({
  walletAddress: walletAddressSchema
});
var verifySignatureSchema = z.object({
  walletAddress: walletAddressSchema,
  signature: z.string().min(10, "A wallet signature is required.")
});
var organizationProfileSchema = z.object({
  name: z.string().min(3).max(120),
  role: z.enum(participantRoles),
  contactEmail: z.string().email(),
  location: z.string().min(2).max(160),
  complianceId: z.string().min(3).max(80),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal(""))
});
var createBatchDraftSchema = z.object({
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
var linkOnChainBatchSchema = z.object({
  onChainBatchId: z.coerce.number().int().positive(),
  txHash: transactionHashSchema
});
var createTransferLogSchema = z.object({
  toWalletAddress: walletAddressSchema,
  shipmentReference: z.string().min(3).max(80),
  notes: z.string().max(500).optional().nullable(),
  checkpointCid: z.string().max(255).optional().nullable(),
  txHash: transactionHashSchema
});
var telemetrySchema = z.object({
  temperatureC: z.coerce.number().min(-80).max(60),
  humidityPercent: z.coerce.number().min(0).max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  recordedAt: z.string().datetime(),
  deviceId: z.string().min(3).max(80),
  severity: z.enum(severityLevels).default("LOW"),
  batchCode: z.string().min(4).max(40).optional(),
  onChainBatchId: z.coerce.number().int().positive().optional()
});
var batchFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(batchStatuses).optional(),
  role: z.enum(participantRoles).optional()
});
export {
  PHARMA_TRACE_ABI,
  batchFilterSchema,
  batchStatuses,
  chainDisplayNames,
  contractBatchStates,
  contractRoleKeys,
  contractStateLabels,
  createBatchDraftSchema,
  createTransferLogSchema,
  linkOnChainBatchSchema,
  organizationProfileSchema,
  participantRoles,
  requestNonceSchema,
  roleDescriptions,
  severityLevels,
  supportedChainIds,
  telemetrySchema,
  transactionHashSchema,
  verifySignatureSchema,
  walletAddressSchema
};
