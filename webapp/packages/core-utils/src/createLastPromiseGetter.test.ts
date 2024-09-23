/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from '@jest/globals';

import { createLastPromiseGetter } from './createLastPromiseGetter.js';

describe('createLastPromiseGetter', () => {
  const getter = createLastPromiseGetter<number>();

  it('should return the result of the given getter', async () => {
    const result = await getter([1, 2, 3], () => Promise.resolve(42));

    expect(result).toBe(42);
  });
});
