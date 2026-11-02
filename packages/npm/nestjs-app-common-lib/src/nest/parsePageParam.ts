import { BadRequestException } from '@nestjs/common';

export interface IPageParamOptions {
  name: string;
  defaultValue: number;
  min: number;
  minMessage: string;
}

const INTEGER = /^-?\d+$/;

/** integer of a page query param or body field: the default when missing, 400 when not an integer or less than min */
export const parsePageParam = (value: unknown, { name, defaultValue, min, minMessage }: IPageParamOptions): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const text = typeof value === 'number' || typeof value === 'string' ? String(value).trim() : '';
  const parsedValue = INTEGER.test(text) ? Number(text) : Number.NaN;

  if (!Number.isSafeInteger(parsedValue)) {
    throw new BadRequestException(`Invalid type for parameter '${name}'`);
  }

  if (parsedValue < min) {
    throw new BadRequestException(minMessage);
  }

  return parsedValue;
};
