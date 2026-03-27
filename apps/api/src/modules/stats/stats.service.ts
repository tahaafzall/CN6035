import { BatchStatus } from '@prisma/client';

import { prisma } from '../../config/prisma.js';

export async function getOverviewStats() {
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
    prisma.batch.count({ where: { status: BatchStatus.REGISTERED } }),
    prisma.batch.count({ where: { status: BatchStatus.IN_TRANSIT } }),
    prisma.batch.count({ where: { status: BatchStatus.RECALLED } }),
    prisma.batch.count({ where: { status: BatchStatus.ANOMALY } }),
    prisma.organization.count({ where: { isProfileComplete: true } }),
    prisma.auditEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
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
