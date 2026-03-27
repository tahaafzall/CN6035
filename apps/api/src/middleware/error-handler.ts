import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction
) {
  void _next;

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: 'Validation failed',
      requestId: request.requestId,
      details: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      error: error.message,
      requestId: request.requestId,
      details: error.details
    });
  }

  logger.error({ err: error, requestId: request.requestId }, 'Unhandled API error');

  return response.status(500).json({
    error: 'Internal server error',
    requestId: request.requestId
  });
}
