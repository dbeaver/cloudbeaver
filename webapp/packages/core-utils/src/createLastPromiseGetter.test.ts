import { createLastPromiseGetter } from './createLastPromiseGetter';

describe('createLastPromiseGetter', () => {
  const getter = createLastPromiseGetter<number>();

  it('should return the result of the given getter', async () => {
    const result = await getter([1, 2, 3], () => Promise.resolve(42));

    expect(result).toBe(42);
  });
});
