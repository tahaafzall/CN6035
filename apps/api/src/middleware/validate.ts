import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export function validate(schema: ZodTypeAny, source: 'body' | 'query' = 'body') {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request[source]);
    (request as Record<string, unknown>)[source] = parsed;
    next();
  };
}
