import { telemetrySchema } from '@tracechain/shared';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { recordTelemetry } from './telemetry.service.js';

export const telemetryRouter = Router();

telemetryRouter.post(
  '/',
  requireAuth,
  validate(telemetrySchema),
  asyncHandler(async (request, response) => {
    response.status(201).json(await recordTelemetry(request.user!, request.body));
  })
);
