import { organizationProfileSchema } from '@tracechain/shared';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getMyOrganization,
  listOrganizations,
  upsertMyOrganization
} from './organizations.service.js';

export const organizationsRouter = Router();

organizationsRouter.get(
  '/',
  asyncHandler(async (_request, response) => {
    response.json(await listOrganizations());
  })
);

organizationsRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json(await getMyOrganization(request.user!));
  })
);

organizationsRouter.put(
  '/me',
  requireAuth,
  validate(organizationProfileSchema),
  asyncHandler(async (request, response) => {
    response.json(await upsertMyOrganization(request.user!, request.body));
  })
);
