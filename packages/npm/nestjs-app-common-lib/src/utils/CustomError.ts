/** error with an app error code and context, 400 in GlobalExceptionFilter */
export class CustomError<TContext = unknown> extends Error {
  public readonly context?: TContext;

  public readonly code: number;

  constructor(code: number, message: string, context?: TContext) {
    super(message);
    this.context = context;
    this.code = code;
  }
}
