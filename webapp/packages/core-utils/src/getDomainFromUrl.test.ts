/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';

import { getDomainFromUrl } from './getDomainFromUrl.js';

describe('getDomainFromUrl', () => {
  it('should return domain from url', () => {
    expect(getDomainFromUrl('https://www.google.com')).toBe('www.google.com');
  });

  it('should return empty string on invalid url', () => {
    expect(getDomainFromUrl('invalid url')).toBe('');
  });

  it('should console.error on invalid url', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getDomainFromUrl('invalid url');

    expect(spy).toBeCalled();

    spy.mockRestore();
  });
});
