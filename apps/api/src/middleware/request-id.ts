import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export function attachRequestId(request: Request, response: Response, next: NextFunction) {
  request.requestId = randomUUID();
  response.setHeader('x-request-id', request.requestId);
  next();
}
