/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { bytesToSize } from './bytesToSize.js';

describe('Bytes to size', () => {
  test('should return "n/a" when "0" bytes are passed', () => {
    expect(bytesToSize(0)).toBe('n/a');
  });

  test('should return "1000 Bytes" when "1000" bytes are passed', () => {
    expect(bytesToSize(1000)).toBe('1000 Bytes');
  });

  test('should return "1.0 KB" when "1024" bytes are passed', () => {
    expect(bytesToSize(1024)).toBe('1.0 KB');
  });

  test('should return "1.4 KB" when "1433" bytes are passed', () => {
    expect(bytesToSize(1433)).toBe('1.4 KB');
  });

  test('should return "1.0 MB" when "1048576" bytes are passed', () => {
    expect(bytesToSize(1048576)).toBe('1.0 MB');
  });

  test('should return "1.6 MB" when "1629146" bytes are passed', () => {
    expect(bytesToSize(1629146)).toBe('1.6 MB');
  });

  test('should return "1.0 GB" when "1073741824" bytes are passed', () => {
    expect(bytesToSize(1073741824)).toBe('1.0 GB');
  });

  test('should return "1.8 GB" when "1932735283.2" bytes are passed', () => {
    expect(bytesToSize(1932735283.2)).toBe('1.8 GB');
  });

  test('should return "1.0 TB" when "1099511627776" bytes are passed', () => {
    expect(bytesToSize(1099511627776)).toBe('1.0 TB');
  });

  test('should return "1.1 TB" when "1209462790553.6" bytes are passed', () => {
    expect(bytesToSize(1209462790553.6)).toBe('1.1 TB');
  });
});
