const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Deep merges plain objects into a new object, without mutating the arguments (native replacement of lodash `merge`).
 * Nested plain objects are merged recursively, `undefined` values of a source are skipped,
 * every other value (arrays included) of a later source replaces the earlier one.
 */
export function deepMerge<T extends object>(target: T, ...sources: Array<object | null | undefined>): T {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  sources.forEach((source) => {
    if (!source) {
      return;
    }
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      const current = result[key];
      result[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
    });
  });

  return result as T;
}
