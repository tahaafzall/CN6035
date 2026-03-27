import type { OrganizationProfileInput } from '@tracechain/shared';

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type { AuthenticatedUser } from '../../types/auth.js';

export async function listOrganizations() {
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
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });
}

export async function getMyOrganization(user: AuthenticatedUser) {
  const organization = await prisma.organization.findUnique({
    where: {
      walletAddress: user.walletAddress
    }
  });

  if (!organization) {
    throw ApiError.notFound('No organization profile was found for this wallet.');
  }

  return organization;
}

export async function upsertMyOrganization(user: AuthenticatedUser, input: OrganizationProfileInput) {
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
