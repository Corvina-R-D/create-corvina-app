import { chunk, removeDuplicates } from './array';

describe('chunk', () => {
  it('splits an array into chunks of the given size, the last one shorter', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('returns a single chunk when the size is bigger than the array', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('returns no chunks for an empty array or a size lower than 1, like lodash', () => {
    expect(chunk([], 3)).toEqual([]);
    expect(chunk([1, 2], 0)).toEqual([]);
    expect(chunk([1, 2], -1)).toEqual([]);
  });

  it('truncates a decimal size, like lodash', () => {
    expect(chunk([1, 2, 3], 2.9)).toEqual([[1, 2], [3]]);
  });
});

describe('removeDuplicates', () => {
  it('keeps the first occurrence of each string', () => {
    expect(removeDuplicates(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  });
});
