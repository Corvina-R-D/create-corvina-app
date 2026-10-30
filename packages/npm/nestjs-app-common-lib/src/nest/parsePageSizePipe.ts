import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

const DEFAULT_VALUE = 10;

const parseValue = (value: string | undefined | null) => {
  const parsedValue = parseInt(value ?? '', 10);

  if (Number.isNaN(parsedValue)) {
    return DEFAULT_VALUE;
  }

  if (!Number.isSafeInteger(parsedValue)) {
    throw new BadRequestException("Invalid type for parameter 'pageSize'");
  }

  if (parsedValue < 1) {
    throw new BadRequestException('Page size must not be less than one');
  }

  return parsedValue;
};

@Injectable()
export class ParsePageSizePipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(value: any, metadata: ArgumentMetadata): number | Record<string, unknown> {
    const { type } = metadata;

    if (type === 'query') {
      return parseValue(value);
    }

    if (type === 'body') {
      return { ...value, pageSize: parseValue(value?.pageSize) };
    }

    throw new Error('Invalid metadata type');
  }
}
