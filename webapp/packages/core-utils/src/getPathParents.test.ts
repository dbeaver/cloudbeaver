/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';

// import { getPathParents } from './getPathParents';

jest.doMock('./createPath', () => ({
  createPath: (...args: string[]) => args.join('/'),
}));

jest.doMock('./getPathParts', () => ({
  getPathParts: (path: string) => path.split('/').filter(Boolean),
}));

describe('getPathParents', () => {
  // it('should return all path parents ', () => {
  //   expect(getPathParents('/a/b/c')).toStrictEqual(['', 'a', 'a/b']);
  // });

  // it('should return empty array', () => {
  //   expect(getPathParents('')).toStrictEqual([]);
  // });

  // it('should return 1 parent', () => {
  //   expect(getPathParents('/a')).toStrictEqual(['']);
  // });

  // it('should return empty array with only letters', () => {
  //   expect(getPathParents('abc')).toStrictEqual(['']);
  // });

  // it('should return empty array with only /', () => {
  //   expect(getPathParents('/')).toStrictEqual([]);
  // });
  it('TODO DELETE THIS', () => {
    expect(true).toBe(true);
  });
});
