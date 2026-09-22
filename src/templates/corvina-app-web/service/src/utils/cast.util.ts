export function toDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
}

export function toBoolean(value: string | boolean): boolean {
  // if value is boolean, just return it
  if (typeof value === 'boolean') {
    return value;
  }

  const valueLC = value.toLowerCase();

  return !!(valueLC === 'true' || valueLC === '1');
}
