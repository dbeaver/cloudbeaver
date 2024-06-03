/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { z } from 'zod';

import { MetadataMap } from './MetadataMap';

describe('MetadataMap', () => {
  it('should sync items', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
      [Infinity, 'infinity'],
      [NaN, 'nan'],
    ];
    map.sync(data);

    data.forEach(([key, value]) => {
      expect(map.get(key)).toBe(value);
    });
  });

  it('should set items', () => {
    const map = new MetadataMap<number, string>();
    map.set(1, 'one');
    map.set(2, 'two');
    map.set(3, 'three');
    map.set(Infinity, 'infinity');
    map.set(NaN, 'nan');

    expect(map.get(1)).toBe('one');
    expect(map.get(2)).toBe('two');
    expect(map.get(3)).toBe('three');
    expect(map.get(Infinity)).toBe('infinity');
    expect(map.get(NaN)).toBe('nan');
  });

  it('should throw an error on invalidate with no default value getter', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    try {
      map.get(1, undefined, z.object({}));
      expect(true).toBeFalsy(); // should not be called
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }

    try {
      map.get(1);
      expect(true).toBeFalsy(); // should not be called
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('should get function default value', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(JSON.stringify(map.get(1, key => `default ${key}`, z.object({})))).toStrictEqual(JSON.stringify('default 1'));
  });

  it('should return default value', () => {
    const map = new MetadataMap<number, string>(key => `default ${key}`);

    expect(JSON.stringify(map.get(1))).toStrictEqual(JSON.stringify('default 1'));
    expect(JSON.stringify(map.get(Infinity))).toStrictEqual(JSON.stringify('default Infinity'));
    expect(JSON.stringify(map.get(NaN))).toStrictEqual(JSON.stringify('default NaN'));
  });

  it('should return size', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(map.size).toBe(3);
  });

  it('should iterate', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ];
    map.sync(data);

    const items = Array.from(map);
    expect(items).toStrictEqual([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);
  });

  it('should iterate keys', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    const keys = Array.from(map.keys());
    expect(keys).toStrictEqual([1, 2, 3]);
  });

  it('should iterate values', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    const values = Array.from(map.values());
    expect(values).toStrictEqual(['one', 'two', 'three']);
  });

  it('should iterate entries', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    const entries = Array.from(map.entries());
    expect(entries).toStrictEqual([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);
  });

  it('should check if key exists', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(map.has(1)).toBeTruthy();
    expect(map.has(2)).toBeTruthy();
    expect(map.has(3)).toBeTruthy();
    expect(map.has(4)).toBeFalsy();
  });

  it('should set value', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.set(4, 'four');

    expect(map.get(4)).toBe('four');
  });

  it('should clear', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.clear();

    expect(map.size).toBe(0);
  });

  it('should delete', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.delete(2);

    expect(map.has(2)).toBeFalsy();
  });

  it('should not delete not existing key', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.delete(4);

    expect(map.size).toBe(3);
  });

  it('should forEach', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.forEach((value, key) => {
      expect(map.get(key)).toBe(value);
    });
  });

  it('has to string tag', () => {
    const map = new MetadataMap<number, string>();

    expect(map[Symbol.toStringTag]).toBe('MetadataMap');
  });
});
