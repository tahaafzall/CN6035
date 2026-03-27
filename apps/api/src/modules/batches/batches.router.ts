import {
  batchFilterSchema,
  createBatchDraftSchema,
  createTransferLogSchema,
  linkOnChainBatchSchema
} from '@tracechain/shared';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createBatchDraft,
  createTransferLog,
  getBatchByIdentifier,
  getBatchTimeline,
  linkOnChainBatch,
  listBatches
} from './batches.service.js';

export const batchesRouter = Router();

batchesRouter.get(
  '/',
  validate(batchFilterSchema, 'query'),
  asyncHandler(async (request, response) => {
    response.json(await listBatches(request.query as never));
  })
);

batchesRouter.post(
  '/draft',
  requireAuth,
  validate(createBatchDraftSchema),
  asyncHandler(async (request, response) => {
    response.status(201).json(await createBatchDraft(request.user!, request.body));
  })
);

batchesRouter.post(
  '/:id/link-onchain',
  requireAuth,
  validate(linkOnChainBatchSchema),
  asyncHandler(async (request, response) => {
    response.json(await linkOnChainBatch(request.params.id, request.user!, request.body));
  })
);

batchesRouter.post(
  '/:id/transfers',
  requireAuth,
  validate(createTransferLogSchema),
  asyncHandler(async (request, response) => {
    response.status(201).json(await createTransferLog(request.params.id, request.user!, request.body));
  })
);

batchesRouter.get(
  '/:identifier/timeline',
  asyncHandler(async (request, response) => {
    response.json(await getBatchTimeline(request.params.identifier));
  })
);

batchesRouter.get(
  '/:identifier',
  asyncHandler(async (request, response) => {
    response.json(await getBatchByIdentifier(request.params.identifier));
  })
);
