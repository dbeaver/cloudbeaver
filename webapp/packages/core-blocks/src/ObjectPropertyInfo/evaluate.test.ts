/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { evaluate } from './evaluate.js';

describe('evaluate', () => {
  it('should evaluate simple boolean expressions', () => {
    expect(evaluate('true', {})).toBe(true);
    expect(evaluate('false', {})).toBe(false);
  });

  it('should evaluate comparison operators', () => {
    expect(evaluate('1 == 1', {})).toBe(true);
    expect(evaluate('1 != 2', {})).toBe(true);
    expect(evaluate('2 > 1', {})).toBe(true);
    expect(evaluate('1 < 2', {})).toBe(true);
  });

  it('should evaluate logical operators', () => {
    expect(evaluate('true && true', {})).toBe(true);
    expect(evaluate('true || false', {})).toBe(true);
    expect(evaluate('!false', {})).toBe(true);
    expect(evaluate('false || false', {})).toBe(false);
    expect(evaluate('true && false', {})).toBe(false);
    expect(evaluate('!(true && false)', {})).toBe(true);
  });

  it('should access object properties', () => {
    const object = { enabled: true, value: 42, name: 'test' };
    expect(evaluate('object.enabled == true', object)).toBe(true);
    expect(evaluate('object.value > 40', object)).toBe(true);
    expect(evaluate('object.name == "test"', object)).toBe(true);
    expect(evaluate("object.name != 'other'", object)).toBe(true);
    expect(evaluate("object.name == 'test'", object)).toBe(true);
  });

  it('should handle nested object properties', () => {
    const obj = { config: { enabled: true, level: 5 } };
    expect(evaluate('object.config.enabled == true', obj)).toBe(true);
    expect(evaluate('object.config.level >= 5', obj)).toBe(true);
  });

  it('should handle undefined and null', () => {
    const obj = { value: undefined, empty: null };
    expect(evaluate('object.value == undefined', obj)).toBe(true);
    expect(evaluate('object.empty == null', obj)).toBe(true);
  });

  it('should handle missing properties as undefined', () => {
    const obj = { existing: 'value' };
    expect(evaluate('object.missing == undefined', obj)).toBe(true);
  });

  it('should return false for invalid expressions', () => {
    expect(() => evaluate('invalid syntax @@#', {})).toThrowError();
  });

  it('should coerce non-boolean results to boolean', () => {
    expect(evaluate('1', {})).toBe(true);
    expect(evaluate('0', {})).toBe(false);
    expect(evaluate('"text"', {})).toBe(true);
    expect(evaluate('""', {})).toBe(false);
  });
});
