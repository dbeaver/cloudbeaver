/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { errorOf } from './errorOf';

describe('errorOf', () => {
  it('returns error of the specified type', () => {
    class TestError extends Error {}

    const error = new TestError('test');
    const result = errorOf(error, TestError);

    expect(result).toBe(error);
    expect(result).toBeInstanceOf(TestError);
    expect(result?.message).toBe('test');
  });

  it('returns error of the specified type from the cause', () => {
    class TestError extends Error {}
    class AnotherError extends Error {
      cause: Error;

      constructor(message: string, cause: Error) {
        super(message);
        this.cause = cause;
      }
    }

    const error = new TestError('test');
    const testError = new AnotherError('another', error);
    const result = errorOf(testError, TestError);

    expect(result).toBeInstanceOf(TestError);
  });

  it('returns undefined if error is not of the specified type', () => {
    const error = new Error('test');
    const result = errorOf(error, TypeError);

    expect(result).toBeUndefined();
  });

  it('returns undefined if error is not an instance of Error', () => {
    const error = { message: 'test' };
    const result = errorOf(error, Error);

    expect(result).toBeUndefined();
  });
});
