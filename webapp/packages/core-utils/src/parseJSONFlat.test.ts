/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { parseJSONFlat } from './parseJSONFlat.js';

describe('parseJSONFlat', () => {
  it('should parse null values', () => {
    const object = {
      key: null,
    };
    const setValue = vitest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).toHaveBeenCalledWith('key', null);
  });

  it('should parse empty object', () => {
    const object = {};
    const setValue = vitest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).not.toHaveBeenCalled();
  });

  it('should parse one level JSON', () => {
    const object = {
      test: 'test',
    };
    const setValue = vitest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('test', 'test');
  });

  it('should parse multi level JSON', () => {
    const object = {
      test: 'test',
      test2: {
        test3: 'test3',
      },
    };
    const setValue = vitest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).toHaveBeenCalledTimes(2);
    expect(setValue).toHaveBeenCalledWith('test', 'test');
    expect(setValue).toHaveBeenCalledWith('test2.test3', 'test3');
  });

  it('should set object value in scope', () => {
    const object = {
      test: 'test',
    };
    const setValue = vitest.fn();

    parseJSONFlat(object, setValue, 'scope');

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('scope.test', 'test');
  });

  it('should set array value in scope', () => {
    const object = ['test'];
    const setValue = vitest.fn();

    parseJSONFlat(object, setValue, 'scope');

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('scope', object);
  });
});
