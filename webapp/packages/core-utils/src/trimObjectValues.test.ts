/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { trimObjectValues } from './trimObjectValues.js';

describe('trimObjectValues', () => {
  it('trims string values in place', () => {
    const values = { text: ' value ', number: 1, empty: ' ' };

    trimObjectValues(values);

    expect(values).toEqual({ text: 'value', number: 1, empty: '' });
  });

  it('does nothing when the object is undefined', () => {
    expect(() => trimObjectValues(undefined)).not.toThrow();
    expect(trimObjectValues(undefined)).toBeUndefined();
  });
});
