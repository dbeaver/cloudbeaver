/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { isIp } from './isIp.js';

describe('isIp', () => {
  it('should return true for correct IPv4', () => {
    expect(isIp('127.0.0.1')).toBe(true);
    expect(isIp('192.168.1.100')).toBe(true);
    expect(isIp('0.0.0.0')).toBe(true);
    expect(isIp('255.255.255.255')).toBe(true);
    expect(isIp('10.0.0.1')).toBe(true);
    expect(isIp('172.16.0.1')).toBe(true);
    expect(isIp('8.8.8.8')).toBe(true);
    expect(isIp('1.1.1.1')).toBe(true);
  });

  it('should return false for incorrect IPv4', () => {
    expect(isIp('256.0.0.1')).toBe(false);
    expect(isIp('192.168.1')).toBe(false);
    expect(isIp('192.168.1.256')).toBe(false);
    expect(isIp('192.168.-1.1')).toBe(false);
    expect(isIp('192.168.1.1.1')).toBe(false);
    expect(isIp('192.168.a.1')).toBe(false);
    expect(isIp('999.999.999.999')).toBe(false);
    expect(isIp('192.168.1.')).toBe(false);
    expect(isIp('.192.168.1.1')).toBe(false);
  });

  it('should return true for correct IPv6 with and without brackets', () => {
    expect(isIp('[2001:0db8::1]')).toBe(true);
    expect(isIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isIp('::1')).toBe(true);
    expect(isIp('[::]')).toBe(true);
    expect(isIp('[::1]')).toBe(true);
    expect(isIp('fe80::1')).toBe(true);
    expect(isIp('[fe80::1]')).toBe(true);
    expect(isIp('2001:db8::8a2e:370:7334')).toBe(true);
    expect(isIp('[2001:db8::8a2e:370:7334]')).toBe(true);
    expect(isIp('::ffff:192.0.2.1')).toBe(true);
    expect(isIp('2001:db8::')).toBe(true);
    expect(isIp('::2001:db8')).toBe(true);
  });

  it('should return false for incorrect IPv6 or host', () => {
    expect(isIp('[2001:::1::]')).toBe(false);
    expect(isIp('example.com')).toBe(false);
    expect(isIp('')).toBe(false);
    expect(isIp('::::')).toBe(false);
    expect(isIp('2001:db8::g')).toBe(false);
    expect(isIp('[2001:db8::2')).toBe(false);
    expect(isIp('2001:db8::2]')).toBe(false);
    expect(isIp('2001:db8::2[')).toBe(false);
    expect(isIp('gggg::1')).toBe(false);
    expect(isIp('2001:db8:85a3::8a2e:370k:7334')).toBe(false);
    expect(isIp('[2001:db8:::]')).toBe(false);
    expect(isIp('2001:db8:::1')).toBe(false);
  });

  it('should handle surrounding whitespace gracefully', () => {
    expect(isIp('  10.0.0.5 ')).toBe(true);
    expect(isIp('\t[2001:db8::2]\n')).toBe(true);
    expect(isIp(' 192.168.1.1 ')).toBe(true);
    expect(isIp('\n::1\t')).toBe(true);
  });

  it('should return false for non-IP strings', () => {
    expect(isIp('localhost')).toBe(false);
    expect(isIp('hostname')).toBe(false);
    expect(isIp('example.com')).toBe(false);
    expect(isIp('www.example.com')).toBe(false);
    expect(isIp('not-an-ip')).toBe(false);
    expect(isIp('123')).toBe(false);
    expect(isIp('abc.def.ghi.jkl')).toBe(false);
  });

  it('should return false for edge cases and special inputs', () => {
    expect(isIp('')).toBe(false);
    expect(isIp(' ')).toBe(false);
    expect(isIp('null')).toBe(false);
    expect(isIp('undefined')).toBe(false);
    expect(isIp('...')).toBe(false);
    expect(isIp(':::')).toBe(false);
  });
});
