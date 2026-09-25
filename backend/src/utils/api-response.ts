import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static error(res: Response, code: string, message: string, statusCode = 400): Response {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}
