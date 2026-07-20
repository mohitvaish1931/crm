import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responsePayload = exception.getResponse();

      if (typeof responsePayload === 'string') {
        detail = responsePayload;
      } else if (typeof responsePayload === 'object' && responsePayload !== null) {
        title = (responsePayload as any).error || title;
        detail = (responsePayload as any).message || detail;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    // RFC 7807 Problem Details
    const problemDetails = {
      type: 'about:blank',
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(problemDetails);
  }
}
