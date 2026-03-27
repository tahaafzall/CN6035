export const PHARMA_TRACE_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'MANUFACTURER_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'LOGISTICS_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'DISTRIBUTOR_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'PHARMACY_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'REGULATOR_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'grantSupplyChainRole',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'role', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'revokeSupplyChainRole',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'role', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'createBatch',
    inputs: [
      { name: 'batchCode', type: 'string' },
      { name: 'productName', type: 'string' },
      { name: 'expiresAt', type: 'uint64' },
      { name: 'metadataHash', type: 'bytes32' },
      { name: 'documentHash', type: 'bytes32' }
    ],
    outputs: [{ name: 'batchId', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'requestTransfer',
    inputs: [
      { name: 'batchId', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'shipmentHash', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'acceptTransfer',
    inputs: [{ name: 'batchId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'recordCheckpoint',
    inputs: [
      { name: 'batchId', type: 'uint256' },
      { name: 'checkpointHash', type: 'bytes32' },
      { name: 'nextState', type: 'uint8' }
    ],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'recallBatch',
    inputs: [
      { name: 'batchId', type: 'uint256' },
      { name: 'recallHash', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getBatch',
    inputs: [{ name: 'batchId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'batchCode', type: 'string' },
          { name: 'productName', type: 'string' },
          { name: 'manufacturer', type: 'address' },
          { name: 'currentCustodian', type: 'address' },
          { name: 'manufacturedAt', type: 'uint64' },
          { name: 'expiresAt', type: 'uint64' },
          { name: 'metadataHash', type: 'bytes32' },
          { name: 'documentHash', type: 'bytes32' },
          { name: 'state', type: 'uint8' },
          { name: 'exists', type: 'bool' }
        ]
      }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'pendingTransfers',
    inputs: [{ name: 'batchId', type: 'uint256' }],
    outputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'requestedAt', type: 'uint64' },
      { name: 'shipmentHash', type: 'bytes32' },
      { name: 'exists', type: 'bool' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'RoleAdminChanged',
    inputs: [
      { indexed: true, name: 'role', type: 'bytes32' },
      { indexed: true, name: 'previousAdminRole', type: 'bytes32' },
      { indexed: true, name: 'newAdminRole', type: 'bytes32' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'RoleGranted',
    inputs: [
      { indexed: true, name: 'role', type: 'bytes32' },
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'sender', type: 'address' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'RoleRevoked',
    inputs: [
      { indexed: true, name: 'role', type: 'bytes32' },
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'sender', type: 'address' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'Paused',
    inputs: [{ indexed: false, name: 'account', type: 'address' }]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'Unpaused',
    inputs: [{ indexed: false, name: 'account', type: 'address' }]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BatchRegistered',
    inputs: [
      { indexed: true, name: 'batchId', type: 'uint256' },
      { indexed: false, name: 'batchCode', type: 'string' },
      { indexed: false, name: 'productName', type: 'string' },
      { indexed: true, name: 'manufacturer', type: 'address' },
      { indexed: false, name: 'metadataHash', type: 'bytes32' },
      { indexed: false, name: 'documentHash', type: 'bytes32' },
      { indexed: false, name: 'expiresAt', type: 'uint64' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'TransferRequested',
    inputs: [
      { indexed: true, name: 'batchId', type: 'uint256' },
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'shipmentHash', type: 'bytes32' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'TransferAccepted',
    inputs: [
      { indexed: true, name: 'batchId', type: 'uint256' },
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'CheckpointRecorded',
    inputs: [
      { indexed: true, name: 'batchId', type: 'uint256' },
      { indexed: true, name: 'actor', type: 'address' },
      { indexed: false, name: 'newState', type: 'uint8' },
      { indexed: false, name: 'checkpointHash', type: 'bytes32' }
    ]
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BatchRecalled',
    inputs: [
      { indexed: true, name: 'batchId', type: 'uint256' },
      { indexed: true, name: 'actor', type: 'address' },
      { indexed: false, name: 'recallHash', type: 'bytes32' }
    ]
  }
] as const;

export const contractRoleKeys = {
  MANUFACTURER: 'MANUFACTURER_ROLE',
  LOGISTICS: 'LOGISTICS_ROLE',
  DISTRIBUTOR: 'DISTRIBUTOR_ROLE',
  PHARMACY: 'PHARMACY_ROLE',
  REGULATOR: 'REGULATOR_ROLE'
} as const;

export const contractBatchStates = {
  REGISTERED: 0,
  IN_TRANSIT: 1,
  DELIVERED: 2,
  RECALLED: 3,
  DISPENSED: 4
} as const;
