/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { flat } from './flat.js';

describe('Flat array', () => {
  test('should return flatted array', () => {
    expect(flat([1, 2, [3, 4]])).toEqual([1, 2, 3, 4]);
  });
});
