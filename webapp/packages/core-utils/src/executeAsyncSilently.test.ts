/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { executeAsyncSilently } from './executeAsyncSilently.js';

describe('executeAsyncSilently', () => {
  it('should return result when async function succeeds', async () => {
    const asyncFunction = () => Promise.resolve('success');

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBe('success');
    expect(error).toBeNull();
  });

  it('should return error when async function throws', async () => {
    const testError = new Error('test error');
    const asyncFunction = () => Promise.reject(testError);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeNull();
    expect(error).toBe(testError);
    expect(executeAsyncSilently).not.toThrow();
    expect(error?.message).toBe('test error');
  });

  it('should handle async function returning null', async () => {
    const asyncFunction = () => Promise.resolve(null);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeNull();
    expect(error).toBeNull();
  });

  it('should handle async function returning undefined', async () => {
    const asyncFunction = () => Promise.resolve(undefined);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeUndefined();
    expect(error).toBeNull();
  });

  it('should handle async function returning an object', async () => {
    const expectedObject = { key: 'value', nested: { data: 123 } };
    const asyncFunction = () => Promise.resolve(expectedObject);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBe(expectedObject);
    expect(error).toBeNull();
  });

  it('should handle async function returning an array', async () => {
    const expectedArray = [1, 2, 3, 4, 5];
    const asyncFunction = () => Promise.resolve(expectedArray);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBe(expectedArray);
    expect(error).toBeNull();
  });

  it('should handle async function returning a number', async () => {
    const asyncFunction = () => Promise.resolve(42);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBe(42);
    expect(error).toBeNull();
  });

  it('should handle async function returning a boolean', async () => {
    const asyncFunction = () => Promise.resolve(true);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBe(true);
    expect(error).toBeNull();
  });

  it('should handle custom error types', async () => {
    class CustomError extends Error {
      code: string;

      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    }

    const customError = new CustomError('custom error', 'ERR_CUSTOM');
    const asyncFunction = () => Promise.reject(customError);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeNull();
    expect(error).toBe(customError);
    expect(error).toBeInstanceOf(CustomError);
    expect((error as CustomError).code).toBe('ERR_CUSTOM');
  });

  it('should handle thrown non-Error objects', async () => {
    const thrownValue = { message: 'not an error instance' };
    const asyncFunction = () => Promise.reject(thrownValue);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeNull();
    expect(error).toBe(thrownValue);
  });

  it('should handle thrown strings', async () => {
    const asyncFunction = () => Promise.reject('string error');

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeNull();
    expect(error).toBe('string error');
  });

  it('should handle thrown primitives', async () => {
    const asyncFunction = () => Promise.reject(123);

    const { result, error } = await executeAsyncSilently(asyncFunction);

    expect(result).toBeNull();
    expect(error).toBe(123);
  });
});
