import { OrderedMap } from './OrderedMap';

describe('OrderedMap', () => {
  it('should add and get items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    expect(map.get(1)).toBe('one');
    expect(map.get(2)).toBe('two');
    expect(map.get(3)).toBe('three');
  });

  it('should addValue and get items', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.addValue('one');
    map.addValue('twoo');
    map.addValue('three');

    expect(map.get(3)).toBe('one');
    expect(map.get(4)).toBe('twoo');
    expect(map.get(5)).toBe('three');
  });

  it('should not override with addValue if it already exists', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.addValue('one');
    map.addValue('twoo');
    map.addValue('three');
    map.addValue('four');

    expect(map.get(4)).toBe('twoo');
  });

  it('should not addValue if no key fn', () => {
    const map = new OrderedMap<number, string>();
    expect(() => map.addValue('one')).toThrow();
  });

  it('should be ordered', () => {
    const map = new OrderedMap<number, string>();
    map.add(3, 'three');
    map.add(1, 'one');
    map.add(2, 'two');

    expect(map.keys).toEqual([3, 1, 2]);
    expect(map.values).toEqual(['three', 'one', 'two']);
  });

  it('should has items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    expect(map.has(1)).toBeTruthy();
    expect(map.has(2)).toBeTruthy();
    expect(map.has(3)).toBeTruthy();
  });

  it('should not override items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(1, 'two');

    expect(map.get(1)).toBe('one');
  });

  it('should remove items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    map.remove(2);

    expect(map.get(2)).toBeUndefined();
    expect(map.keys).toEqual([1, 3]);
    expect(map.values).toEqual(['one', 'three']);
  });

  it('should not remove non-existing items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    map.remove(4);

    expect(map.get(4)).toBeUndefined();
  });

  it('should remove all items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    map.removeAll();

    expect(map.keys).toEqual([]);
    expect(map.values).toEqual([]);
  });

  it('should throw bulk update items if no toKey fn', () => {
    const map = new OrderedMap<number, string>();

    expect(() => map.bulkUpdate(['one', 'two', 'three'])).toThrow();
  });

  it('should bulk update items', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.bulkUpdate(['o', 'tw', 'thr']);

    expect(map.keys).toEqual([1, 2, 3]);
    expect(map.values).toEqual(['o', 'tw', 'thr']);
  });

  it('should bulk rewrite items', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.bulkUpdate(['o', 'tw', 'thr']);
    map.bulkRewrite(['one', 'twoo', 'three']);

    expect(map.keys).toEqual([3, 4, 5]);
    expect(map.values).toEqual(['one', 'twoo', 'three']);
  });

  it('should sort items', () => {
    const map = new OrderedMap<number, string>();
    map.add(3, 'c');
    map.add(1, 'a');
    map.add(2, 'b');

    map.sort((a, b) => (a > b ? 1 : -1));

    expect(map.keys).toEqual([1, 2, 3]);
  });
});
