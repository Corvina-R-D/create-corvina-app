import { BadRequestException } from '@nestjs/common';
import { ParsePagePipe } from './parsePagePipe';
import { ParsePageSizePipe } from './parsePageSizePipe';

const query = { type: 'query' as const };
const body = { type: 'body' as const };

describe('ParsePagePipe', () => {
  const pipe = new ParsePagePipe();

  it.each([
    [undefined, 0],
    [null, 0],
    ['', 0],
    ['0', 0],
    ['3', 3],
    [' 3 ', 3],
    [3, 3],
  ])('parses %p as %p', (value, expected) => {
    expect(pipe.transform(value, query)).toBe(expected);
  });

  it.each(['abc', '1.5', 1.5, '10abc', '1e3', '0x10', '-1', -1, '99999999999999999999', true])('rejects %p', (value) => {
    expect(() => pipe.transform(value, query)).toThrow(BadRequestException);
  });

  it('parses the page of a body', () => {
    expect(pipe.transform({ name: 'a', page: '2' }, body)).toEqual({ name: 'a', page: 2 });
    expect(pipe.transform({ name: 'a' }, body)).toEqual({ name: 'a', page: 0 });
    expect(() => pipe.transform({ page: 'abc' }, body)).toThrow(BadRequestException);
  });
});

describe('ParsePageSizePipe', () => {
  const pipe = new ParsePageSizePipe();

  it.each([
    [undefined, 10],
    ['', 10],
    ['1', 1],
    [50, 50],
  ])('parses %p as %p', (value, expected) => {
    expect(pipe.transform(value, query)).toBe(expected);
  });

  it.each(['abc', '1.5', '10abc', '0', 0, '-5'])('rejects %p', (value) => {
    expect(() => pipe.transform(value, query)).toThrow(BadRequestException);
  });

  it('parses the page size of a body', () => {
    expect(pipe.transform({ pageSize: 20 }, body)).toEqual({ pageSize: 20 });
    expect(pipe.transform({}, body)).toEqual({ pageSize: 10 });
  });
});
