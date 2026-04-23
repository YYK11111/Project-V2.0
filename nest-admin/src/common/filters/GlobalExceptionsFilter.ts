import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status === HttpStatus.UNAUTHORIZED) {
      console.warn(
        `allExceptions.filter --> 401 ${request.method} ${request.url}`,
      );
    } else {
      console.error("allExceptions.filter -->", exception);
    }
    if (exception.code == "ER_DUP_ENTRY") {
      let match = exception.message.match(/Duplicate entry '(.+)' for/);
      exception.message = `${match[1]} 已存在`;
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const responseBody =
      exceptionResponse && typeof exceptionResponse === "object"
        ? (exceptionResponse as Record<string, unknown>)
        : null;
    const businessCode =
      responseBody && typeof responseBody.code === "string"
        ? responseBody.code
        : undefined;
    const message =
      responseBody && typeof responseBody.message === "string"
        ? responseBody.message
        : exception.message;

    response.status(200).json({
      code: status,
      errorCode: businessCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      msg: message,
    });
  }
}
