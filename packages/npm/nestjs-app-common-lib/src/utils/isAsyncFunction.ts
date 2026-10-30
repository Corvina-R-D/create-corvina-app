/** whether fn is declared async (the decorators that wrap a promise need one) */
export const isAsyncFunction = (fn: unknown): boolean =>
  typeof fn === 'function' && (fn as { [Symbol.toStringTag]?: string })[Symbol.toStringTag] === 'AsyncFunction';
