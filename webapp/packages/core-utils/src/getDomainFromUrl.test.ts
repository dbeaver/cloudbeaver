/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getDomainFromUrl } from './getDomainFromUrl.js';

describe('getDomainFromUrl', () => {
  it('should return domain for a valid URL with http protocol', () => {
    const url = 'http://example.com/path';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('example.com');
  });

  it('should return domain for a valid URL with https protocol', () => {
    const url = 'https://example.com/path';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('example.com');
  });

  it('should return domain for a valid URL with www', () => {
    const url = 'https://www.example.com/path';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('www.example.com');
  });

  it('should return domain for a URL with a subdomain', () => {
    const url = 'https://blog.example.com';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('blog.example.com');
  });

  it('should return empty string for an invalid URL', () => {
    const url = 'not-a-valid-url';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('');
  });

  it('should return empty string for an empty string input', () => {
    const url = '';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('');
  });

  it('should return domain for a URL with query parameters', () => {
    const url = 'https://example.com/search?q=test';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('example.com');
  });

  it('should return domain for a URL with port number', () => {
    const url = 'https://example.com:8080/path';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('example.com');
  });

  it('should return domain for an IP address URL', () => {
    const url = 'http://127.0.0.1:3000';
    const domain = getDomainFromUrl(url);
    expect(domain).toBe('127.0.0.1');
  });
});
