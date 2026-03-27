import { BatchStatus, Prisma, SeverityLevel } from '@prisma/client';
import type { TelemetryInput } from '@tracechain/shared';

import { prisma } from '../../config/prisma.js';
import type { AuthenticatedUser } from '../../types/auth.js';
import { ApiError } from '../../utils/api-error.js';
import { buildCheckpointHash } from '../../utils/hash.js';

async function resolveBatch(input: TelemetryInput) {
  if (input.onChainBatchId) {
    return prisma.batch.findUnique({
      where: {
        onChainBatchId: input.onChainBatchId
      }
    });
  }

  if (input.batchCode) {
    return prisma.batch.findUnique({
      where: {
        batchCode: input.batchCode
      }
    });
  }

  throw ApiError.badRequest('Either batchCode or onChainBatchId must be provided.');
}

export async function recordTelemetry(user: AuthenticatedUser, input: TelemetryInput) {
  const batch = await resolveBatch(input);

  if (!batch) {
    throw ApiError.notFound('The target batch was not found.');
  }

  const outOfRange =
    input.temperatureC < batch.storageTempMin || input.temperatureC > batch.storageTempMax;

  const severity = outOfRange ? SeverityLevel.HIGH : input.severity;
  const note = outOfRange
    ? `Temperature out of range. Expected ${batch.storageTempMin}C to ${batch.storageTempMax}C.`
    : null;

  const reading = await prisma.sensorReading.create({
    data: {
      batchId: batch.id,
      temperatureC: input.temperatureC,
      humidityPercent: input.humidityPercent,
      latitude: input.latitude,
      longitude: input.longitude,
      recordedAt: new Date(input.recordedAt),
      deviceId: input.deviceId,
      severity,
      note
    }
  });

  const updatePayload: Prisma.BatchUpdateInput = {};

  if (
    outOfRange &&
    batch.status !== BatchStatus.RECALLED &&
    batch.status !== BatchStatus.DISPENSED
  ) {
    updatePayload.status = BatchStatus.ANOMALY;
  }

  if (Object.keys(updatePayload).length > 0) {
    await prisma.batch.update({
      where: { id: batch.id },
      data: updatePayload
    });
  }

  await prisma.auditEvent.create({
    data: {
      eventRef: `telemetry:${reading.id}`,
      batchId: batch.id,
      organizationId: user.organizationId,
      eventType: outOfRange ? 'TELEMETRY_ANOMALY_RECORDED' : 'TELEMETRY_RECORDED',
      actorWallet: user.walletAddress,
      payload: {
        checkpointHash: buildCheckpointHash({
          batchCode: batch.batchCode,
          temperatureC: input.temperatureC,
          humidityPercent: input.humidityPercent,
          location: `${input.latitude},${input.longitude}`,
          recordedAt: input.recordedAt
        }),
        severity,
        note
      }
    }
  });

  return reading;
}
