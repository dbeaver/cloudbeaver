/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { headersToText, textToHeaders } from './parseHeaders.js';

describe('textToHeaders', () => {
  test('should return undefined when text is undefined', () => {
    expect(textToHeaders(undefined)).toBeUndefined();
  });

  test('should return undefined when text is empty', () => {
    expect(textToHeaders('')).toBeUndefined();
  });

  test('should return undefined when text contains only whitespace', () => {
    expect(textToHeaders('   \n  \n  ')).toBeUndefined();
  });

  test('should parse a single key=value pair', () => {
    expect(textToHeaders('Content-Type=application/json')).toEqual({ 'Content-Type': 'application/json' });
  });

  test('should parse multiple key=value pairs', () => {
    expect(textToHeaders('Authorization=Bearer token\nX-API-Key=sk-abc123')).toEqual({
      Authorization: 'Bearer token',
      'X-API-Key': 'sk-abc123',
    });
  });

  test('should handle values containing "=" signs (e.g. base64 or JWT tokens)', () => {
    expect(textToHeaders('Authorization=Bearer eyJhbGciOiJIUzI1NiJ9.abc==')).toEqual({
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.abc==',
    });
  });

  test('should handle values with multiple "=" signs', () => {
    expect(textToHeaders('Token=a=b=c=')).toEqual({ Token: 'a=b=c=' });
  });

  test('should skip blank lines', () => {
    expect(textToHeaders('Authorization=Bearer token\n\nX-API-Key=sk-abc123\n')).toEqual({
      Authorization: 'Bearer token',
      'X-API-Key': 'sk-abc123',
    });
  });

  test('should trim whitespace around keys and values', () => {
    expect(textToHeaders('  Authorization  =  Bearer token  ')).toEqual({ Authorization: 'Bearer token' });
  });

  test('should skip lines without "="', () => {
    expect(textToHeaders('InvalidLine\nAuthorization=Bearer token')).toEqual({ Authorization: 'Bearer token' });
  });

  test('should skip lines where key is empty (starts with "=")', () => {
    expect(textToHeaders('=value\nAuthorization=Bearer token')).toEqual({ Authorization: 'Bearer token' });
  });

  test('should return undefined when no valid pairs are found', () => {
    expect(textToHeaders('InvalidLine\nAnotherInvalidLine')).toBeUndefined();
  });

  test('should allow empty values', () => {
    expect(textToHeaders('X-Empty=')).toEqual({ 'X-Empty': '' });
  });
});

describe('headersToText', () => {
  test('should return undefined when headers is undefined', () => {
    expect(headersToText(undefined)).toBeUndefined();
  });

  test('should return undefined when headers is an empty object', () => {
    expect(headersToText({})).toBeUndefined();
  });

  test('should serialize a single header', () => {
    expect(headersToText({ 'Content-Type': 'application/json' })).toBe('Content-Type=application/json');
  });

  test('should serialize multiple headers separated by newlines', () => {
    expect(headersToText({ Authorization: 'Bearer token', 'X-API-Key': 'sk-abc123' })).toBe(
      'Authorization=Bearer token\nX-API-Key=sk-abc123',
    );
  });

  test('should preserve "=" signs in values', () => {
    expect(headersToText({ Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.abc==' })).toBe(
      'Authorization=Bearer eyJhbGciOiJIUzI1NiJ9.abc==',
    );
  });
});

describe('textToHeaders and headersToText roundtrip', () => {
  test('should roundtrip simple headers', () => {
    const original = { Authorization: 'Bearer token', 'Content-Type': 'application/json' };
    expect(textToHeaders(headersToText(original))).toEqual(original);
  });

  test('should roundtrip headers with "=" in values', () => {
    const original = { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.abc==', Token: 'a=b=c' };
    expect(textToHeaders(headersToText(original))).toEqual(original);
  });
});
