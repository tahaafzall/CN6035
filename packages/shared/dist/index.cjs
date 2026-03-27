"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PHARMA_TRACE_ABI: () => PHARMA_TRACE_ABI,
  batchFilterSchema: () => batchFilterSchema,
  batchStatuses: () => batchStatuses,
  chainDisplayNames: () => chainDisplayNames,
  contractBatchStates: () => contractBatchStates,
  contractRoleKeys: () => contractRoleKeys,
  contractStateLabels: () => contractStateLabels,
  createBatchDraftSchema: () => createBatchDraftSchema,
  createTransferLogSchema: () => createTransferLogSchema,
  linkOnChainBatchSchema: () => linkOnChainBatchSchema,
  organizationProfileSchema: () => organizationProfileSchema,
  participantRoles: () => participantRoles,
  requestNonceSchema: () => requestNonceSchema,
  roleDescriptions: () => roleDescriptions,
  severityLevels: () => severityLevels,
  supportedChainIds: () => supportedChainIds,
  telemetrySchema: () => telemetrySchema,
  transactionHashSchema: () => transactionHashSchema,
  verifySignatureSchema: () => verifySignatureSchema,
  walletAddressSchema: () => walletAddressSchema
});
module.exports = __toCommonJS(index_exports);

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
var import_zod = require("zod");
var walletAddressSchema = import_zod.z.string().regex(/^0x[a-fA-F0-9]{40}$/, "A valid EVM wallet address is required.");
var transactionHashSchema = import_zod.z.string().regex(/^0x([A-Fa-f0-9]{64})$/, "A valid transaction hash is required.");
var requestNonceSchema = import_zod.z.object({
  walletAddress: walletAddressSchema
});
var verifySignatureSchema = import_zod.z.object({
  walletAddress: walletAddressSchema,
  signature: import_zod.z.string().min(10, "A wallet signature is required.")
});
var organizationProfileSchema = import_zod.z.object({
  name: import_zod.z.string().min(3).max(120),
  role: import_zod.z.enum(participantRoles),
  contactEmail: import_zod.z.string().email(),
  location: import_zod.z.string().min(2).max(160),
  complianceId: import_zod.z.string().min(3).max(80),
  website: import_zod.z.string().url().optional().or(import_zod.z.literal("")),
  notes: import_zod.z.string().max(500).optional().or(import_zod.z.literal(""))
});
var createBatchDraftSchema = import_zod.z.object({
  batchCode: import_zod.z.string().min(4).max(40),
  productName: import_zod.z.string().min(3).max(120),
  category: import_zod.z.string().min(3).max(80),
  description: import_zod.z.string().min(20).max(1200),
  originCountry: import_zod.z.string().min(2).max(80),
  destinationMarket: import_zod.z.string().min(2).max(80),
  unitCount: import_zod.z.coerce.number().int().positive(),
  storageTempMin: import_zod.z.coerce.number().min(-80).max(40),
  storageTempMax: import_zod.z.coerce.number().min(-80).max(40),
  manufacturedAt: import_zod.z.string().datetime(),
  expiresAt: import_zod.z.string().datetime(),
  metadataCid: import_zod.z.string().max(255).optional().nullable(),
  documentCid: import_zod.z.string().max(255).optional().nullable(),
  notes: import_zod.z.string().max(500).optional().nullable()
});
var linkOnChainBatchSchema = import_zod.z.object({
  onChainBatchId: import_zod.z.coerce.number().int().positive(),
  txHash: transactionHashSchema
});
var createTransferLogSchema = import_zod.z.object({
  toWalletAddress: walletAddressSchema,
  shipmentReference: import_zod.z.string().min(3).max(80),
  notes: import_zod.z.string().max(500).optional().nullable(),
  checkpointCid: import_zod.z.string().max(255).optional().nullable(),
  txHash: transactionHashSchema
});
var telemetrySchema = import_zod.z.object({
  temperatureC: import_zod.z.coerce.number().min(-80).max(60),
  humidityPercent: import_zod.z.coerce.number().min(0).max(100),
  latitude: import_zod.z.coerce.number().min(-90).max(90),
  longitude: import_zod.z.coerce.number().min(-180).max(180),
  recordedAt: import_zod.z.string().datetime(),
  deviceId: import_zod.z.string().min(3).max(80),
  severity: import_zod.z.enum(severityLevels).default("LOW"),
  batchCode: import_zod.z.string().min(4).max(40).optional(),
  onChainBatchId: import_zod.z.coerce.number().int().positive().optional()
});
var batchFilterSchema = import_zod.z.object({
  q: import_zod.z.string().optional(),
  status: import_zod.z.enum(batchStatuses).optional(),
  role: import_zod.z.enum(participantRoles).optional()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
