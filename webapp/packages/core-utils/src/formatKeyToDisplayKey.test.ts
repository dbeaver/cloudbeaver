/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { formatKeyToDisplayKey } from './formatKeyToDisplayKey.js';
import * as getOSModule from './getOS.js';

describe('formatKeyToDisplayKey', () => {
  it('should return CTRL for mod on Windows', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.windowsOS);
    expect(formatKeyToDisplayKey('mod')).toBe('CTRL');
  });

  it('should return CTRL for mod on Linux', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.linuxOS);
    expect(formatKeyToDisplayKey('mod')).toBe('CTRL');
  });

  it('should return CMD for mod on Mac', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.macOS);
    expect(formatKeyToDisplayKey('mod')).toBe('CMD');
  });

  it('should return OPTION for alt on Mac', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.macOS);
    expect(formatKeyToDisplayKey('alt')).toBe('OPTION');
  });

  it('should return ALT for alt on Windows', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.windowsOS);
    expect(formatKeyToDisplayKey('alt')).toBe('ALT');
  });

  it('should correctly format special keys', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.windowsOS);
    expect(formatKeyToDisplayKey('comma')).toBe(',');
    expect(formatKeyToDisplayKey('slash')).toBe('/');
    expect(formatKeyToDisplayKey('backspace')).toBe('⌫');
    expect(formatKeyToDisplayKey('tab')).toBe('tab');
    expect(formatKeyToDisplayKey('enter')).toBe('↵');
    expect(formatKeyToDisplayKey('esc')).toBe('escape');
    expect(formatKeyToDisplayKey('space')).toBe('␣');
    expect(formatKeyToDisplayKey('up')).toBe('↑');
    expect(formatKeyToDisplayKey('down')).toBe('↓');
    expect(formatKeyToDisplayKey('left')).toBe('←');
    expect(formatKeyToDisplayKey('right')).toBe('→');
    expect(formatKeyToDisplayKey('delete')).toBe('⌦');
  });

  it('should return the original code if it is not found in the map', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(getOSModule.OperatingSystem.windowsOS);
    expect(formatKeyToDisplayKey('A')).toBe('A');
    expect(formatKeyToDisplayKey('')).toBe('');
    expect(formatKeyToDisplayKey('unknownKey')).toBe('unknownKey');
  });
});
