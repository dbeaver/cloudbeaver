/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { getOSSpecificKeys } from './getOSSpecificKeys.js';
import * as getOSModule from './getOS.js';
import { OperatingSystem } from './getOS.js';

describe('getOSSpecificKeys', () => {
  it('should return keys if OS is windows', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(OperatingSystem.windowsOS);
    expect(getOSSpecificKeys({ id: 'test', keys: 'Ctrl+S', keysWin: 'Ctrl+S' })).toBe('Ctrl+S');
  });

  it('should return keys if OS is mac', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(OperatingSystem.macOS);
    expect(getOSSpecificKeys({ id: 'test', keys: 'Ctrl+S', keysMac: 'Cmd+S' })).toBe('Cmd+S');
  });

  it('should not return keys if OS is not windows or mac', () => {
    vi.spyOn(getOSModule, 'getOS').mockReturnValue(OperatingSystem.linuxOS);
    expect(getOSSpecificKeys({ id: 'test', keys: 'Ctrl+S', keysWin: 'Ctrl+S', keysMac: 'Cmd+S' })).toBeUndefined();
  });
});
