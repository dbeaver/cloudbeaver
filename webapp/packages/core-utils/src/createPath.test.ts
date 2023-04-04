/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPath } from './createPath';

describe('Create path', () => {
  test('should return valid path when all arguments are valid', () => {
    expect(createPath('connection', 'folder', 'file')).toBe('connection/folder/file');
  });

  test('should return valid path when one of the arguments is "undefined"', () => {
    expect(createPath('connection', undefined, 'file')).toBe('connection/file');
  });

  test('should return valid path when only one argument is passed', () => {
    expect(createPath('connection')).toBe('connection');
  });
});
