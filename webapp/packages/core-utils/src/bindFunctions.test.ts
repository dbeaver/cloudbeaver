/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { bindFunctions } from './bindFunctions.js';

describe('bindFunctions', () => {
  test('binds specified functions to the object', () => {
    const obj = {
      name: 'TestObject',
      greet: function () {
        return `Hello, I'm ${this.name}`;
      },
      farewell: function () {
        return `Goodbye from ${this.name}`;
      },
      notAFunction: 'This is not a function',
    };

    const originalGreet = obj.greet;
    const originalFarewell = obj.farewell;

    bindFunctions(obj, ['greet', 'farewell', 'notAFunction']);

    expect(obj.greet).not.toBe(originalGreet);
    expect(obj.farewell).not.toBe(originalFarewell);

    expect(obj.greet()).toBe("Hello, I'm TestObject");
    expect(obj.farewell()).toBe('Goodbye from TestObject');

    expect(obj.notAFunction).toBe('This is not a function');
  });

  test('does not modify object if no function keys are provided', () => {
    const obj = {
      name: 'TestObject',
      greet: function () {
        return `Hello, I'm ${this.name}`;
      },
    };

    const originalGreet = obj.greet;

    bindFunctions(obj, []);

    expect(obj.greet).toBe(originalGreet);
  });

  test('handles objects with no matching keys', () => {
    const obj = {
      name: 'TestObject',
    };

    expect(() => {
      bindFunctions(obj, ['nonexistentMethod' as never]);
    }).not.toThrow();
  });
});
