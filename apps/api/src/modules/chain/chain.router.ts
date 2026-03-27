import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { assertCanForceSync, getChainStatus, syncChainProjection } from './chain.service.js';

export const chainRouter = Router();

chainRouter.get(
  '/status',
  asyncHandler(async (_request, response) => {
    response.json(await getChainStatus());
  })
);

chainRouter.post(
  '/sync',
  requireAuth,
  asyncHandler(async (request, response) => {
    assertCanForceSync(request.user!);
    response.json(await syncChainProjection());
  })
);
