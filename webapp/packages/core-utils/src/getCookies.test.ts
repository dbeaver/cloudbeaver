/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { getCookies } from './getCookies.js';

describe('getCookies', () => {
  beforeEach(() => {
    // mock the `document.cookie` property
    Object.defineProperty(document, 'cookie', {
      value: 'foo=bar; baz=qux',
      writable: true,
    });
  });

  it('should return an object with the cookies', () => {
    const cookies = getCookies();

    // assert that the `cookies` object has the correct keys and values
    expect(cookies).toEqual({
      foo: 'bar',
      baz: 'qux',
    });
  });

  it('should return an empty object if no cookies are present', () => {
    // set the `document.cookie` property to an empty string
    document.cookie = '';

    const cookies = getCookies();

    // assert that the `cookies` object is empty
    expect(cookies).toEqual({});
  });
});
