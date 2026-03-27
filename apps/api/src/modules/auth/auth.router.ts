import { requestNonceSchema, verifySignatureSchema } from '@tracechain/shared';
import { Router } from 'express';

import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { issueAuthNonce, verifyWalletSignature } from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/nonce',
  validate(requestNonceSchema),
  asyncHandler(async (request, response) => {
    const result = await issueAuthNonce(request.body.walletAddress);
    response.json(result);
  })
);

authRouter.post(
  '/verify',
  validate(verifySignatureSchema),
  asyncHandler(async (request, response) => {
    const result = await verifyWalletSignature(request.body.walletAddress, request.body.signature);
    response.json(result);
  })
);
