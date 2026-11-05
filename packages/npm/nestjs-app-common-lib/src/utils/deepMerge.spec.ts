import { deepMerge } from './deepMerge';

describe('deepMerge', () => {
  it('merges nested plain objects', () => {
    const target = { name: 'app', vendor: { name: 'Corvina', website: 'https://corvina.io' }, links: { self: '/v1/manifest.json' } };
    const source = { vendor: { name: 'Brand' }, hidden: true };

    expect(deepMerge(target, source)).toEqual({
      name: 'app',
      vendor: { name: 'Brand', website: 'https://corvina.io' },
      links: { self: '/v1/manifest.json' },
      hidden: true,
    });
  });

  it('does not mutate the arguments', () => {
    const target = { a: { b: 1 } };
    const source = { a: { c: 2 } };

    const result = deepMerge(target, source);

    expect(target).toEqual({ a: { b: 1 } });
    expect(source).toEqual({ a: { c: 2 } });
    expect(result.a).not.toBe(target.a);
  });

  it('skips undefined values but keeps null', () => {
    expect(deepMerge({ a: 1, b: 2 }, { a: undefined, b: null })).toEqual({ a: 1, b: null });
  });

  it('replaces arrays instead of merging them by index', () => {
    expect(deepMerge({ images: [{ url: '/a.jpeg' }, { url: '/b.jpeg' }] }, { images: [{ url: '/c.jpeg' }] })).toEqual({ images: [{ url: '/c.jpeg' }] });
  });

  it('replaces a plain object with a value of a different type', () => {
    expect(deepMerge({ a: { b: 1 } }, { a: 'x' })).toEqual({ a: 'x' });
    expect(deepMerge({ a: 'x' }, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
  });

  it('applies the sources in order and ignores missing ones', () => {
    expect(deepMerge({ a: 1 }, undefined, { a: 2, b: 1 }, null, { b: 2 })).toEqual({ a: 2, b: 2 });
  });

  it('keeps class instances as values', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(deepMerge({ a: { b: 1 } }, { a: date }).a).toBe(date);
  });
});
