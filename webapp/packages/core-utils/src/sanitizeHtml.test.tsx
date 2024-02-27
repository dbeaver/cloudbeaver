/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitize', () => {
  it('should sanitize input', () => {
    const input = '<script>alert("some unsafe action")</script>';
    const output = sanitizeHtml(input);
    expect(output).toBe('');
  });

  it('should sanitize input and keep safe tags', () => {
    const input = '<div>qwe</div><script>alert("some unsafe action")</script><div>asd</div>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<div>qwe</div><div>asd</div>');
  });

  it('should not sanitize safe input', () => {
    const input = 'Hello, world!';
    const output = sanitizeHtml(input);
    expect(output).toBe(input);
  });

  it('should sanitize unsafe input', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const output = sanitizeHtml(input);
    expect(output).toBe('<img src="x">');
  });

  it('should sanitize unsafe input with attributes', () => {
    const input = '<a href="javascript:alert(1)">click me</a>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<a>click me</a>');
  });

  it('should sanitize unsafe input with attributes', () => {});
});
