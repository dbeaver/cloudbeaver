import { combineITerableIterators } from './combineITerableIterators';

describe('combineIterableIterators', () => {
  it('should return an iterator that combines the values of the given iterators', () => {
    const iterator1 = [1, 2, 3][Symbol.iterator]();
    const iterator2 = [4, 5, 6][Symbol.iterator]();
    const iterator3 = [7, 8, 9][Symbol.iterator]();

    const combinedIterator = combineITerableIterators(iterator1, iterator2, iterator3);

    expect(Array.from(combinedIterator)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should return an empty iterator if no iterators are given', () => {
    const combinedIterator = combineITerableIterators();

    expect(Array.from(combinedIterator)).toEqual([]);
  });

  it('should return an empty iterator if all iterators are empty', () => {
    const iterator1 = [][Symbol.iterator]();
    const iterator2 = [][Symbol.iterator]();
    const iterator3 = [][Symbol.iterator]();

    const combinedIterator = combineITerableIterators(iterator1, iterator2, iterator3);

    expect(Array.from(combinedIterator)).toEqual([]);
  });

  it('should return an iterator that combines the values of the given iterators, even if some are empty', () => {
    const iterator1 = [1, 2, 3][Symbol.iterator]();
    const iterator2 = [][Symbol.iterator]();
    const iterator3 = [7, 8, 9][Symbol.iterator]();

    const combinedIterator = combineITerableIterators(iterator1, iterator2, iterator3);

    expect(Array.from(combinedIterator)).toEqual([1, 2, 3, 7, 8, 9]);
  });
});
