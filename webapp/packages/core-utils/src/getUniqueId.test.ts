import { getUniqueId } from './getUniqueId';

describe('getUniqueId', () => {
  const uniqueIdsCount = 100;

  it('should return unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < uniqueIdsCount; i++) {
      ids.add(getUniqueId());
    }
    expect(ids.size).toBe(uniqueIdsCount);
  });

  it('should return unique ids in parallel', async () => {
    const ids = new Set();
    const promises = [];
    for (let i = 0; i < uniqueIdsCount; i++) {
      promises.push(
        new Promise(resolve => {
          setTimeout(() => {
            ids.add(getUniqueId());
            resolve(true);
          }, Math.random() * 100);
        }),
      );
    }
    await Promise.all(promises);
    expect(ids.size).toBe(uniqueIdsCount);
  });
});
