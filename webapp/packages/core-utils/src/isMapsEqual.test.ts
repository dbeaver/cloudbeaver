/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { isMapsEqual } from './isMapsEqual.js';

describe('Is maps equal', () => {
  test('should return "true" when equal Maps are passed', () => {
    const map = new Map([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(isMapsEqual(map, map)).toBe(true);
  });

  test('should return "false" when not equals Maps are passed', () => {
    const map1 = new Map([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    const map2 = new Map([
      [1, 'one'],
      [5, 'five'],
      [3, 'three'],
    ]);

    expect(isMapsEqual(map1, map2)).toBe(false);
  });
});
