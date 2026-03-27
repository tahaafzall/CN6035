export const participantRoles = [
  'ADMIN',
  'MANUFACTURER',
  'LOGISTICS',
  'DISTRIBUTOR',
  'PHARMACY',
  'REGULATOR'
] as const;

export type ParticipantRole = (typeof participantRoles)[number];

export const batchStatuses = [
  'DRAFT',
  'REGISTERED',
  'IN_TRANSIT',
  'DELIVERED',
  'RECALLED',
  'DISPENSED',
  'ANOMALY'
] as const;

export type BatchStatus = (typeof batchStatuses)[number];

export const severityLevels = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type SeverityLevel = (typeof severityLevels)[number];

export const contractStateLabels: Record<number, BatchStatus> = {
  0: 'REGISTERED',
  1: 'IN_TRANSIT',
  2: 'DELIVERED',
  3: 'RECALLED',
  4: 'DISPENSED'
};

export const roleDescriptions: Record<ParticipantRole, string> = {
  ADMIN: 'System operator responsible for deployment, governance, and emergency controls.',
  MANUFACTURER: 'Creates pharmaceutical batches and originates the immutable audit trail.',
  LOGISTICS: 'Handles transport checkpoints and shipping custody transitions.',
  DISTRIBUTOR: 'Receives and redistributes batches across regional supply nodes.',
  PHARMACY: 'Accepts delivery, dispenses stock, and verifies authenticity to patients.',
  REGULATOR: 'Performs compliance oversight and can trigger recalls.'
};

export const chainDisplayNames: Record<number, string> = {
  31337: 'Hardhat Local',
  11155111: 'Ethereum Sepolia'
};

export const supportedChainIds = Object.keys(chainDisplayNames).map(Number);
