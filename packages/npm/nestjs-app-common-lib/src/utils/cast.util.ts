export interface IToNumberOptions {
  default?: number;
  min?: number;
  max?: number;
}

export function toArray(value: string | string[]): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  return value as string[];
}

export function toLowerCase(value: string): string {
  return value.toLowerCase();
}

export function trim(value: string): string {
  return value.trim();
}

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

/** integer of value (default when missing or not a number), clamped to min and max; 0 is a value, not a missing one */
export function toNumber(value: string | number | null | undefined, opts: IToNumberOptions & { default: number }): number;
export function toNumber(value: string | number | null | undefined, opts?: IToNumberOptions): number | undefined;
export function toNumber(value: string | number | null | undefined, opts: IToNumberOptions = {}): number | undefined {
  const isMissing = value === undefined || value === null || value === '';
  let newValue: number | undefined = isMissing ? Number.NaN : Number.parseInt(String(value), 10);

  if (Number.isNaN(newValue)) {
    newValue = opts.default;
  }

  if (newValue === undefined) {
    return newValue;
  }

  if (opts.min !== undefined && newValue < opts.min) {
    newValue = opts.min;
  }

  if (opts.max !== undefined && newValue > opts.max) {
    newValue = opts.max;
  }

  return newValue;
}
