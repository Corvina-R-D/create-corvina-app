import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

const DEFAULT_VALUE = 0;

const parseValue = (value: string | undefined | null) => {
  const parsedValue = parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return DEFAULT_VALUE;
  }

  return parsedValue;
};

@Injectable()
export class ParsePagePipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(value: any, metadata: ArgumentMetadata) {
    const { type } = metadata;

    if (type === 'query') {
      return parseValue(value);
    }

    if (type === 'body') {
      return { ...value, page: parseValue(value?.page) };
    }

    throw new Error('Invalid metadata type');
  }
}
