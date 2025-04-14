/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { pathJoin } from './pathJoin.js';

describe('pathJoin', () => {
  test('joins path segments', () => {
    expect(pathJoin('foo', 'bar')).toBe('foo/bar');
    expect(pathJoin('foo/', '/bar')).toBe('foo/bar');
  });

  test('removes "." segments', () => {
    expect(pathJoin('foo', '.', 'bar')).toBe('foo/bar');
    expect(pathJoin('foo', './bar')).toBe('foo/bar');
  });

  test('interprets ".." to pop the last segment', () => {
    expect(pathJoin('foo/bar', '../baz')).toBe('foo/baz');
    expect(pathJoin('foo/bar/baz', '../../qux')).toBe('foo/qux');
  });

  test('preserves the initial slash if there was one', () => {
    expect(pathJoin('foo', 'bar')).toBe('foo/bar');
    expect(pathJoin('/foo', 'bar')).toBe('/foo/bar');
  });

  test('returns "." if the input is empty', () => {
    expect(pathJoin()).toBe('.');
  });

  test('returns "/" if the input contains only slashes', () => {
    expect(pathJoin('/', '/')).toBe('/');
  });
});
