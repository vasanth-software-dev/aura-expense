import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/api-response';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace req with parsed values (for type casting & defaults)
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const field = firstIssue.path.join('.');
        const message = `${field ? `${field}: ` : ''}${firstIssue.message}`;
        ApiResponse.error(res, 'VALIDATION_ERROR', message, 422);
        return;
      }
      ApiResponse.error(res, 'BAD_REQUEST', 'Invalid request data', 400);
    }
  };
}
