/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { isIp } from './isIp.js';

describe('isIp', function isIpDescribe() {
  it('should return true for correct IPv4', function shouldReturnTrueForCorrectIPv4() {
    expect(isIp('127.0.0.1')).toBe(true);
    expect(isIp('192.168.1.100')).toBe(true);
  });

  it('should return false for incorrect IPv4', function isIpDescribe() {
    expect(isIp('256.0.0.1')).toBe(false);
    expect(isIp('192.168.1')).toBe(false);
  });

  it('should return true for correct IPv6 with and without brackets', function shouldReturnTrueForCorrectIPv6() {
    expect(isIp('[2001:0db8::1]')).toBe(true);
    expect(isIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
  });

  it('should return false for incorrect IPv6 or host', function shouldReturnFalseForIncorrectIPv6() {
    expect(isIp('[2001:::1::]')).toBe(false);
    expect(isIp('example.com')).toBe(false);
    expect(isIp('')).toBe(false);
    expect(isIp('::::')).toBe(false);
    expect(isIp('2001:db8::g')).toBe(false);
    expect(isIp('[2001:db8::2')).toBe(false);
    expect(isIp('2001:db8::2]')).toBe(false);
    expect(isIp('2001:db8::2[')).toBe(false);
  });

  it('should handle surrounding whitespace gracefully', function shouldHandleSurroundingWhitespaceGracefully() {
    expect(isIp('  10.0.0.5 ')).toBe(true);
    expect(isIp('\t[2001:db8::2]\n')).toBe(true);
  });
});
