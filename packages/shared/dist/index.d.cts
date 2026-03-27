import { z } from 'zod';

declare const participantRoles: readonly ["ADMIN", "MANUFACTURER", "LOGISTICS", "DISTRIBUTOR", "PHARMACY", "REGULATOR"];
type ParticipantRole = (typeof participantRoles)[number];
declare const batchStatuses: readonly ["DRAFT", "REGISTERED", "IN_TRANSIT", "DELIVERED", "RECALLED", "DISPENSED", "ANOMALY"];
type BatchStatus = (typeof batchStatuses)[number];
declare const severityLevels: readonly ["LOW", "MEDIUM", "HIGH"];
type SeverityLevel = (typeof severityLevels)[number];
declare const contractStateLabels: Record<number, BatchStatus>;
declare const roleDescriptions: Record<ParticipantRole, string>;
declare const chainDisplayNames: Record<number, string>;
declare const supportedChainIds: number[];

declare const PHARMA_TRACE_ABI: readonly [{
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "MANUFACTURER_ROLE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "LOGISTICS_ROLE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "DISTRIBUTOR_ROLE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "PHARMACY_ROLE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "REGULATOR_ROLE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "grantSupplyChainRole";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly name: "role";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "revokeSupplyChainRole";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly name: "role";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "createBatch";
    readonly inputs: readonly [{
        readonly name: "batchCode";
        readonly type: "string";
    }, {
        readonly name: "productName";
        readonly type: "string";
    }, {
        readonly name: "expiresAt";
        readonly type: "uint64";
    }, {
        readonly name: "metadataHash";
        readonly type: "bytes32";
    }, {
        readonly name: "documentHash";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "requestTransfer";
    readonly inputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "shipmentHash";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "acceptTransfer";
    readonly inputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "recordCheckpoint";
    readonly inputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly name: "checkpointHash";
        readonly type: "bytes32";
    }, {
        readonly name: "nextState";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly name: "recallBatch";
    readonly inputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly name: "recallHash";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "getBatch";
    readonly inputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly name: "batchCode";
            readonly type: "string";
        }, {
            readonly name: "productName";
            readonly type: "string";
        }, {
            readonly name: "manufacturer";
            readonly type: "address";
        }, {
            readonly name: "currentCustodian";
            readonly type: "address";
        }, {
            readonly name: "manufacturedAt";
            readonly type: "uint64";
        }, {
            readonly name: "expiresAt";
            readonly type: "uint64";
        }, {
            readonly name: "metadataHash";
            readonly type: "bytes32";
        }, {
            readonly name: "documentHash";
            readonly type: "bytes32";
        }, {
            readonly name: "state";
            readonly type: "uint8";
        }, {
            readonly name: "exists";
            readonly type: "bool";
        }];
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "pendingTransfers";
    readonly inputs: readonly [{
        readonly name: "batchId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "requestedAt";
        readonly type: "uint64";
    }, {
        readonly name: "shipmentHash";
        readonly type: "bytes32";
    }, {
        readonly name: "exists";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly stateMutability: "view";
    readonly name: "hasRole";
    readonly inputs: readonly [{
        readonly name: "role";
        readonly type: "bytes32";
    }, {
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "RoleAdminChanged";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "role";
        readonly type: "bytes32";
    }, {
        readonly indexed: true;
        readonly name: "previousAdminRole";
        readonly type: "bytes32";
    }, {
        readonly indexed: true;
        readonly name: "newAdminRole";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "RoleGranted";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "role";
        readonly type: "bytes32";
    }, {
        readonly indexed: true;
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly name: "sender";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "RoleRevoked";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "role";
        readonly type: "bytes32";
    }, {
        readonly indexed: true;
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly name: "sender";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "Paused";
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly name: "account";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "Unpaused";
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly name: "account";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "BatchRegistered";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly indexed: false;
        readonly name: "batchCode";
        readonly type: "string";
    }, {
        readonly indexed: false;
        readonly name: "productName";
        readonly type: "string";
    }, {
        readonly indexed: true;
        readonly name: "manufacturer";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly name: "metadataHash";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly name: "documentHash";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly name: "expiresAt";
        readonly type: "uint64";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "TransferRequested";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly indexed: true;
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly name: "shipmentHash";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "TransferAccepted";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly indexed: true;
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly name: "to";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "CheckpointRecorded";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly indexed: true;
        readonly name: "actor";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly name: "newState";
        readonly type: "uint8";
    }, {
        readonly indexed: false;
        readonly name: "checkpointHash";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly name: "BatchRecalled";
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "batchId";
        readonly type: "uint256";
    }, {
        readonly indexed: true;
        readonly name: "actor";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly name: "recallHash";
        readonly type: "bytes32";
    }];
}];
declare const contractRoleKeys: {
    readonly MANUFACTURER: "MANUFACTURER_ROLE";
    readonly LOGISTICS: "LOGISTICS_ROLE";
    readonly DISTRIBUTOR: "DISTRIBUTOR_ROLE";
    readonly PHARMACY: "PHARMACY_ROLE";
    readonly REGULATOR: "REGULATOR_ROLE";
};
declare const contractBatchStates: {
    readonly REGISTERED: 0;
    readonly IN_TRANSIT: 1;
    readonly DELIVERED: 2;
    readonly RECALLED: 3;
    readonly DISPENSED: 4;
};

declare const walletAddressSchema: z.ZodString;
declare const transactionHashSchema: z.ZodString;
declare const requestNonceSchema: z.ZodObject<{
    walletAddress: z.ZodString;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
}, {
    walletAddress: string;
}>;
declare const verifySignatureSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    signature: string;
}, {
    walletAddress: string;
    signature: string;
}>;
declare const organizationProfileSchema: z.ZodObject<{
    name: z.ZodString;
    role: z.ZodEnum<["ADMIN", "MANUFACTURER", "LOGISTICS", "DISTRIBUTOR", "PHARMACY", "REGULATOR"]>;
    contactEmail: z.ZodString;
    location: z.ZodString;
    complianceId: z.ZodString;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "MANUFACTURER" | "LOGISTICS" | "DISTRIBUTOR" | "PHARMACY" | "REGULATOR";
    name: string;
    contactEmail: string;
    location: string;
    complianceId: string;
    website?: string | undefined;
    notes?: string | undefined;
}, {
    role: "ADMIN" | "MANUFACTURER" | "LOGISTICS" | "DISTRIBUTOR" | "PHARMACY" | "REGULATOR";
    name: string;
    contactEmail: string;
    location: string;
    complianceId: string;
    website?: string | undefined;
    notes?: string | undefined;
}>;
declare const createBatchDraftSchema: z.ZodObject<{
    batchCode: z.ZodString;
    productName: z.ZodString;
    category: z.ZodString;
    description: z.ZodString;
    originCountry: z.ZodString;
    destinationMarket: z.ZodString;
    unitCount: z.ZodNumber;
    storageTempMin: z.ZodNumber;
    storageTempMax: z.ZodNumber;
    manufacturedAt: z.ZodString;
    expiresAt: z.ZodString;
    metadataCid: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    documentCid: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    batchCode: string;
    productName: string;
    expiresAt: string;
    manufacturedAt: string;
    category: string;
    description: string;
    originCountry: string;
    destinationMarket: string;
    unitCount: number;
    storageTempMin: number;
    storageTempMax: number;
    notes?: string | null | undefined;
    metadataCid?: string | null | undefined;
    documentCid?: string | null | undefined;
}, {
    batchCode: string;
    productName: string;
    expiresAt: string;
    manufacturedAt: string;
    category: string;
    description: string;
    originCountry: string;
    destinationMarket: string;
    unitCount: number;
    storageTempMin: number;
    storageTempMax: number;
    notes?: string | null | undefined;
    metadataCid?: string | null | undefined;
    documentCid?: string | null | undefined;
}>;
declare const linkOnChainBatchSchema: z.ZodObject<{
    onChainBatchId: z.ZodNumber;
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    onChainBatchId: number;
    txHash: string;
}, {
    onChainBatchId: number;
    txHash: string;
}>;
declare const createTransferLogSchema: z.ZodObject<{
    toWalletAddress: z.ZodString;
    shipmentReference: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checkpointCid: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    txHash: string;
    toWalletAddress: string;
    shipmentReference: string;
    notes?: string | null | undefined;
    checkpointCid?: string | null | undefined;
}, {
    txHash: string;
    toWalletAddress: string;
    shipmentReference: string;
    notes?: string | null | undefined;
    checkpointCid?: string | null | undefined;
}>;
declare const telemetrySchema: z.ZodObject<{
    temperatureC: z.ZodNumber;
    humidityPercent: z.ZodNumber;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    recordedAt: z.ZodString;
    deviceId: z.ZodString;
    severity: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    batchCode: z.ZodOptional<z.ZodString>;
    onChainBatchId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    temperatureC: number;
    humidityPercent: number;
    latitude: number;
    longitude: number;
    recordedAt: string;
    deviceId: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    batchCode?: string | undefined;
    onChainBatchId?: number | undefined;
}, {
    temperatureC: number;
    humidityPercent: number;
    latitude: number;
    longitude: number;
    recordedAt: string;
    deviceId: string;
    batchCode?: string | undefined;
    onChainBatchId?: number | undefined;
    severity?: "LOW" | "MEDIUM" | "HIGH" | undefined;
}>;
declare const batchFilterSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "REGISTERED", "IN_TRANSIT", "DELIVERED", "RECALLED", "DISPENSED", "ANOMALY"]>>;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANUFACTURER", "LOGISTICS", "DISTRIBUTOR", "PHARMACY", "REGULATOR"]>>;
}, "strip", z.ZodTypeAny, {
    role?: "ADMIN" | "MANUFACTURER" | "LOGISTICS" | "DISTRIBUTOR" | "PHARMACY" | "REGULATOR" | undefined;
    status?: "DRAFT" | "REGISTERED" | "IN_TRANSIT" | "DELIVERED" | "RECALLED" | "DISPENSED" | "ANOMALY" | undefined;
    q?: string | undefined;
}, {
    role?: "ADMIN" | "MANUFACTURER" | "LOGISTICS" | "DISTRIBUTOR" | "PHARMACY" | "REGULATOR" | undefined;
    status?: "DRAFT" | "REGISTERED" | "IN_TRANSIT" | "DELIVERED" | "RECALLED" | "DISPENSED" | "ANOMALY" | undefined;
    q?: string | undefined;
}>;
type RequestNonceInput = z.infer<typeof requestNonceSchema>;
type VerifySignatureInput = z.infer<typeof verifySignatureSchema>;
type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
type CreateBatchDraftInput = z.infer<typeof createBatchDraftSchema>;
type LinkOnChainBatchInput = z.infer<typeof linkOnChainBatchSchema>;
type CreateTransferLogInput = z.infer<typeof createTransferLogSchema>;
type TelemetryInput = z.infer<typeof telemetrySchema>;
type BatchFilterInput = z.infer<typeof batchFilterSchema>;

export { type BatchFilterInput, type BatchStatus, type CreateBatchDraftInput, type CreateTransferLogInput, type LinkOnChainBatchInput, type OrganizationProfileInput, PHARMA_TRACE_ABI, type ParticipantRole, type RequestNonceInput, type SeverityLevel, type TelemetryInput, type VerifySignatureInput, batchFilterSchema, batchStatuses, chainDisplayNames, contractBatchStates, contractRoleKeys, contractStateLabels, createBatchDraftSchema, createTransferLogSchema, linkOnChainBatchSchema, organizationProfileSchema, participantRoles, requestNonceSchema, roleDescriptions, severityLevels, supportedChainIds, telemetrySchema, transactionHashSchema, verifySignatureSchema, walletAddressSchema };
