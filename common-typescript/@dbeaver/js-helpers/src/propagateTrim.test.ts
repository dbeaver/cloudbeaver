import { describe, it, expect } from 'vitest';
import { propagateTrim } from './propagateTrim.js';

describe('propagateTrim', () => {
  it('trims strings in arrays', () => {
    const arr = ['  foo ', 'bar', ' baz '];
    propagateTrim(arr);
    expect(arr).toEqual(['foo', 'bar', 'baz']);
  });

  it('trims strings in plain objects', () => {
    const obj = { a: '  foo ', b: 'bar', c: ' baz ' };
    propagateTrim(obj);
    expect(obj).toEqual({ a: 'foo', b: 'bar', c: 'baz' });
  });

  it('trims strings in Map values', () => {
    const map = new Map([
      ['a', '  foo '],
      ['b', 'bar'],
      ['c', ' baz '],
    ]);
    propagateTrim(map);
    expect(map.get('a')).toBe('foo');
    expect(map.get('b')).toBe('bar');
    expect(map.get('c')).toBe('baz');
  });

  it('trims strings in Set values', () => {
    const set = new Set(['  foo ', 'bar', ' baz ']);
    propagateTrim(set);
    expect(Array.from(set)).toEqual(['foo', 'bar', 'baz']);
  });

  it('trims deeply nested structures', () => {
    const obj = {
      arr: ['  foo ', { x: ' bar ' }],
      map: new Map<string, unknown>([
        ['a', ' baz '],
        ['b', { y: ' qux ' }],
      ]),
      set: new Set(['  quux ', { z: ' corge ' }]),
      nested: {
        a: ' grault ',
        b: [' garply '],
      },
    };
    propagateTrim(obj);
    expect(obj.arr).toEqual(['foo', { x: 'bar' }]);
    expect(obj.map.get('a')).toBe('baz');
    expect(obj.map.get('b')).toEqual({ y: 'qux' });
    expect(Array.from(obj.set)).toContain('quux');
    expect(Array.from(obj.set).some(v => typeof v === 'object' && v.z === 'corge')).toBe(true);
    expect(obj.nested).toEqual({ a: 'grault', b: ['garply'] });
  });

  it('does not trim non-string values', () => {
    const obj = { a: 123, b: null, c: undefined, d: true };
    propagateTrim(obj);
    expect(obj).toEqual({ a: 123, b: null, c: undefined, d: true });
  });

  it('handles circular references', () => {
    const obj: any = { a: ' foo ' };
    obj.self = obj;
    propagateTrim(obj);
    expect(obj.a).toBe('foo');
    expect(obj.self).toBe(obj);
  });
});
