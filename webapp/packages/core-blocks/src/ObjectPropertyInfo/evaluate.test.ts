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

  it.each([
    [false, false, false, false],
    [false, true, false, true],
    [true, false, false, true],
    [true, true, true, true],
  ])('evaluates AND and OR for flags %s and %s', (left, right, andResult, orResult) => {
    const object = { left, right };

    expect(evaluate('object.left && object.right', object)).toBe(andResult);
    expect(evaluate('object.left || object.right', object)).toBe(orResult);
  });

  it.each([
    ['true || false && false', true],
    ['(true || false) && false', false],
    ['!true || true && false', false],
    ['!(false || true) && true', false],
    ['!(false || false) && true', true],
    ['object.count > 2 && object.count <= 5 || object.enabled == true', true],
    ['object.count > 2 && (object.count <= 5 || object.enabled == true)', false],
    ['object.count + 2 * 3 == 7 && !false', true],
  ])('preserves operator precedence in %s', (expression, expected) => {
    expect(evaluate(expression, { count: 1, enabled: true })).toBe(expected);
  });

  it.each([
    ['false && object.unavailable', false],
    ['true || object.unavailable', true],
    ['object.enabled && object.unavailable', false],
    ['!object.enabled || object.unavailable', true],
  ])('does not read the skipped operand in %s', (expression, expected) => {
    const object = {
      enabled: false,
      get unavailable(): never {
        throw new Error('Skipped operand was evaluated');
      },
    };

    expect(evaluate(expression, object)).toBe(expected);
  });

  it.each([
    [undefined, true],
    [null, true],
    [false, true],
    [true, false],
    [0, true],
    [1, false],
    ['false', true],
    ['true', true],
  ])('preserves flag comparisons for a form value of %s', (enabled, hidden) => {
    expect(evaluate('object.enabled != true', { enabled })).toBe(hidden);
  });

  it.each([
    ['TOKEN', false],
    ['PASSWORD', false],
    ['OTHER', true],
    [undefined, true],
  ])('evaluates compound form conditions for mode %s', (mode, hidden) => {
    expect(evaluate("object.mode != 'TOKEN' && object.mode != 'PASSWORD'", { mode })).toBe(hidden);
  });

  it.each([
    [undefined, true],
    [null, true],
    [false, false],
    [0, false],
    ['', false],
    ['null', false],
    ['undefined', false],
  ])('distinguishes absent values from other falsy values: %s', (value, absent) => {
    expect(evaluate('object.value == null', { value })).toBe(absent);
    expect(evaluate('object.value == undefined', { value })).toBe(absent);
    expect(evaluate('object.value != null && object.value != undefined', { value })).toBe(!absent);
  });

  it('guards optional nested values with short-circuit evaluation', () => {
    const expression = 'object.config != null && object.config.enabled == true';

    expect(evaluate(expression, {})).toBe(false);
    expect(evaluate(expression, { config: null })).toBe(false);
    expect(evaluate(expression, { config: { enabled: false } })).toBe(false);
    expect(evaluate(expression, { config: { enabled: true } })).toBe(true);
  });

  it.each([
    ['null == undefined', true],
    ['null == object.missing', true],
    ['undefined == object.missing', true],
    ['null >= 0', false],
    ['null <= 0', false],
    ['null + 1 == 1', false],
    ['undefined >= 0', false],
  ])('preserves the legacy absent-value literal in %s', (expression, expected) => {
    expect(evaluate(expression, {})).toBe(expected);
  });

  it.each([
    ["object['mode'] == 'TOKEN'", { mode: 'TOKEN' }],
    ['object["mode"] == "TOKEN"', { mode: 'TOKEN' }],
    [String.raw`object.name == 'it\'s enabled'`, { name: "it's enabled" }],
    [String.raw`object.name == "say \"yes\""`, { name: 'say "yes"' }],
  ])('supports property access and escaped strings in %s', (expression, object) => {
    expect(evaluate(expression, object)).toBe(true);
  });

  it('continues evaluating valid conditions after a syntax error', () => {
    expect(() => evaluate('object.enabled &&', { enabled: true })).toThrowError();
    expect(evaluate('object.enabled == true', { enabled: true })).toBe(true);
    expect(evaluate('object.enabled == true', { enabled: false })).toBe(false);
  });

  it('keeps logical operands as values until the final boolean conversion', () => {
    expect(evaluate('(object.name || "fallback") == "fallback"', { name: '' })).toBe(true);
    expect(evaluate('(object.name || "fallback") == "selected"', { name: 'selected' })).toBe(true);
    expect(evaluate('(object.enabled && object.count) == 3', { enabled: true, count: 3 })).toBe(true);
    expect(evaluate('(object.enabled && object.count) == false', { enabled: false, count: 3 })).toBe(true);
  });

  it('does not interpret literal names inside property names or quoted strings', () => {
    const object = { trueValue: true, nullable: null, undefinedValue: undefined, label: 'false || true' };

    expect(evaluate('object.trueValue && object.nullable == null && object.undefinedValue == undefined', object)).toBe(true);
    expect(evaluate('object.label == "false || true"', object)).toBe(true);
  });

  it('reevaluates a condition with the current form values', () => {
    const object = { enabled: false };

    expect(evaluate('object.enabled == true', object)).toBe(false);
    object.enabled = true;
    expect(evaluate('object.enabled == true', object)).toBe(true);
    expect(evaluate('object.enabled == true', { enabled: false })).toBe(false);
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

  it('should throw for invalid expressions', () => {
    expect(() => evaluate('invalid syntax @@#', {})).toThrowError();
  });

  it('should coerce non-boolean results to boolean', () => {
    expect(evaluate('1', {})).toBe(true);
    expect(evaluate('0', {})).toBe(false);
    expect(evaluate('"text"', {})).toBe(true);
    expect(evaluate('""', {})).toBe(false);
  });
});
