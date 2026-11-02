import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { parsePageParam } from './parsePageParam';

const parseValue = (value: unknown) => parsePageParam(value, { name: 'pageSize', defaultValue: 10, min: 1, minMessage: 'Page size must not be less than one' });

/** page size of a query param or body field: 10 when missing, 400 when not an integer or less than 1 */
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
