import { cacheValue } from './cacheValue';

describe('cacheValue', () => {
  it('should return cached value', () => {
    const cache = cacheValue();
    const value = cache.value(() => 1);
    expect(value).toBe(1);
    expect(cache.invalid).toBe(false);
  });

  it('should invalidate cache', () => {
    const cache = cacheValue();
    cache.value(() => 1);
    cache.invalidate();
    expect(cache.invalid).toBe(true);
  });

  it('should calculate new value if invalidated', () => {
    const fn = jest.fn(() => 1);
    const cache = cacheValue();
    cache.value(fn);
    cache.invalidate();
    expect(cache.invalid).toBe(true);
    const value = cache.value(fn);
    expect(value).toBe(1);
    expect(cache.invalid).toBe(false);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not calculate new value if not invalidated', () => {
    const fn = jest.fn(() => 1);
    const cache = cacheValue();
    cache.value(fn);
    const value = cache.value(fn);
    expect(value).toBe(1);
    expect(cache.invalid).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
