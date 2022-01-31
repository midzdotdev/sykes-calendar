class HttpError extends Error {
  constructor(public statusCode: number, message?: string) {
    super(message);
  }
}

export const httpError = (statusCode: number, message?: string): HttpError =>
  new HttpError(statusCode, message);

export const isHttpError = (err: unknown): err is HttpError =>
  err instanceof HttpError;
