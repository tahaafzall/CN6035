import { Router } from 'express';

import { asyncHandler } from '../../utils/async-handler.js';
import { getOverviewStats } from './stats.service.js';

export const statsRouter = Router();

statsRouter.get(
  '/overview',
  asyncHandler(async (_request, response) => {
    response.json(await getOverviewStats());
  })
);
