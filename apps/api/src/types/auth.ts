import type { ParticipantRole } from '@prisma/client';

export type AuthenticatedUser = {
  organizationId: string;
  walletAddress: string;
  role: ParticipantRole | null;
};
