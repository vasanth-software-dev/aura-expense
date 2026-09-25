import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/api-response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Structured log without leaking credentials
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Something went wrong';

  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED');

  ApiResponse.error(res, code, message, statusCode);
}
