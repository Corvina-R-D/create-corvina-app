import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { parsePageParam } from './parsePageParam';

const parseValue = (value: unknown) => parsePageParam(value, { name: 'page', defaultValue: 0, min: 0, minMessage: 'Page index must not be less than zero' });

/** page of a query param or body field: 0 when missing, 400 when not an integer or negative */
@Injectable()
export class ParsePagePipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(value: any, metadata: ArgumentMetadata): number | Record<string, unknown> {
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
