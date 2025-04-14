/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { getOS, OperatingSystem } from './getOS.js';

describe('getOS', () => {
  it('should return windowsOS', () => {
    vitest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Windows 11');
    expect(getOS()).toBe(OperatingSystem.windowsOS);
  });

  it('should return macOS', () => {
    vitest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('MacOS Sonoma');
    expect(getOS()).toBe(OperatingSystem.macOS);
  });

  it('should return linuxOS', () => {
    vitest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Linux Ubuntu');
    expect(getOS()).toBe(OperatingSystem.linuxOS);
  });

  it('should return unixOS', () => {
    vitest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('X11');
    expect(getOS()).toBe(OperatingSystem.unixOS);
  });

  it('should return iOS', () => {
    vitest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('like Mac');
    expect(getOS()).toBe(OperatingSystem.iOS);
  });

  it('should return Windows for unknown OS', () => {
    vitest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('zzzz');
    expect(getOS()).toBe(OperatingSystem.windowsOS);
  });
});
