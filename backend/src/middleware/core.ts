import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export const requestId: RequestHandler = (_req, res, next) => {
  const id = randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};

/** One log line per request. Only method, route and status: never bodies, phone numbers or addresses. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.baseUrl + req.path,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
};

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError("NOT_FOUND", "This address does not exist.", 404));
};

interface BodyParserError {
  type?: string;
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const requestIdValue = res.locals.requestId as string | undefined;
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on our side. Please try again.";
  let details: unknown;

  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if ((error as BodyParserError)?.type === "entity.parse.failed") {
    status = 400;
    code = "VALIDATION_FAILED";
    message = "The request body is not valid JSON.";
  } else if ((error as BodyParserError)?.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "The request is too large.";
  }

  if (status >= 500) {
    logger.error("unhandled error", {
      requestId: requestIdValue,
      name: error instanceof Error ? error.name : "unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  if (res.headersSent) return;
  res.status(status).json({ error: { code, message, ...(details !== undefined ? { details } : {}), requestId: requestIdValue } });
};