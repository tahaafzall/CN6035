import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { ApiError } from '../utils/api-error.js';

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  try {
    const token = authorizationHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser & { sub: string };

    request.user = {
      organizationId: payload.organizationId,
      walletAddress: payload.walletAddress,
      role: payload.role ?? null
    };

    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token.'));
  }
}
