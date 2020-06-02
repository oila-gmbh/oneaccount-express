export class HttpError extends Error {
  status: number;
  statusCode: number;
  message: string;
  devMessage: string;
  constructor(status: number, message: string, devMessage?: string) {
    super(message);
    this.status = status;
    this.statusCode = status;
    this.message = message;
    this.devMessage = devMessage || message;
  }
}

export class BadRequest extends HttpError {
  constructor(message?: string, devMessage?: string) {
    super(400, message || 'wrong arguments supplied', devMessage);
  }
}

export class InternalServerError extends HttpError {
  constructor(message?: string, devMessage?: string) {
    super(500, message || 'internal server error', devMessage);
  }
}