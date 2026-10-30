export class CustomError extends Error {
  public readonly context?: any;

  public readonly code: number;

  constructor(code: number, message: string, context?: any) {
    super(message);
    this.context = context;
    this.code = code;
  }
}
