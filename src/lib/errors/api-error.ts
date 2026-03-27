export type ApiErrorCode =
  | "bad_request"
  | "forbidden"
  | "internal_error"
  | "invalid_request"
  | "not_found"
  | "unauthenticated";

export type ApiErrorOptions = {
  cause?: unknown;
  details?: unknown;
};

export class ApiError extends Error {
  public readonly details?: unknown;

  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    options?: ApiErrorOptions,
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ApiError";
    this.details = options?.details;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("invalid_request", message, 400, { details });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("not_found", message, 404, { details });
    this.name = "NotFoundError";
  }
}

export class AuthorizationError extends ApiError {
  constructor(
    public readonly code: "forbidden" | "unauthenticated",
    message: string,
    status: number,
  ) {
    super(code, message, status);
    this.name = "AuthorizationError";
  }
}

export function apiErrorResponse(error: ApiError): Response {
  const errorPayload = {
    code: error.code,
    ...(error.details !== undefined ? { details: error.details } : {}),
    message: error.message,
  };

  return Response.json(
    {
      error: errorPayload,
    },
    { status: error.status },
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAuthorizationLikeError(error)) {
    return new ApiError(error.code, error.message, error.status);
  }

  if (error instanceof Error) {
    return new ApiError("bad_request", error.message, 400);
  }

  return new ApiError("internal_error", "حدث خطأ غير متوقع", 500);
}

export function badRequest(message: string, details?: unknown): ApiError {
  return new ApiError("bad_request", message, 400, { details });
}

export function invalidRequest(message: string, details?: unknown): ApiError {
  return new ApiError("invalid_request", message, 400, { details });
}

export function notFound(message: string, details?: unknown): ApiError {
  return new ApiError("not_found", message, 404, { details });
}

function isAuthorizationLikeError(
  error: unknown,
): error is { code: "forbidden" | "unauthenticated"; message: string; status: number } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error &&
      "status" in error &&
      (((error as { code?: string }).code === "forbidden") ||
        (error as { code?: string }).code === "unauthenticated"),
  );
}
