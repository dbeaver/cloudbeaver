/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OperatingSystem, getOS } from '@cloudbeaver/core-utils';

import { getCommonAndOSSpecificKeys } from './getCommonAndOSSpecificKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

vi.mock('@cloudbeaver/core-utils', async () => {
  const actual = await vi.importActual('@cloudbeaver/core-utils');
  return {
    ...actual,
    getOS: vi.fn(),
  };
});

describe('getCommonAndOSSpecificKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when keyBinding is undefined', () => {
    const result = getCommonAndOSSpecificKeys(undefined);
    expect(result).toEqual([]);
  });

  describe('on macOS', () => {
    beforeEach(() => {
      vi.mocked(getOS).mockReturnValue(OperatingSystem.macOS);
    });

    it('should return only common keys when keysMac is not provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });

    it('should return only macOS keys when keys is not provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keysMac: 'Cmd+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Cmd+A']);
    });

    it('should return both common and macOS keys when both are provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysMac: 'Cmd+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Cmd+A', 'Ctrl+A']);
    });

    it('should handle array of keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: ['Ctrl+A', 'Ctrl+B'],
        keysMac: ['Cmd+A', 'Cmd+B'],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Cmd+A', 'Cmd+B', 'Ctrl+A', 'Ctrl+B']);
    });

    it('should handle mixed string and array keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysMac: ['Cmd+A', 'Cmd+B'],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Cmd+A', 'Cmd+B', 'Ctrl+A']);
    });

    it('should ignore keysWin on macOS', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysMac: 'Cmd+A',
        keysWin: 'Ctrl+Shift+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Cmd+A', 'Ctrl+A']);
    });

    it('should remove duplicates', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysMac: 'Ctrl+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });

    it('should handle empty keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: '',
        keysMac: '',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual([]);
    });

    it('should filter out empty strings', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: ['Ctrl+A', ''],
        keysMac: ['Cmd+A', ''],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Cmd+A', 'Ctrl+A']);
    });
  });

  describe('on Windows', () => {
    beforeEach(() => {
      vi.mocked(getOS).mockReturnValue(OperatingSystem.windowsOS);
    });

    it('should return only common keys, ignoring keysMac', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysMac: 'Cmd+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });

    it('should return only Windows keys when keys is not provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keysWin: 'Ctrl+Shift+A',
        keysMac: 'Mod+Shift+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+Shift+A']);
    });

    it('should return both common and Windows keys when both are provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysWin: 'Ctrl+Shift+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+Shift+A', 'Ctrl+A']);
    });

    it('should handle array of keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: ['Ctrl+A', 'Ctrl+B'],
        keysWin: ['Ctrl+Shift+A', 'Ctrl+Shift+B'],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+Shift+A', 'Ctrl+Shift+B', 'Ctrl+A', 'Ctrl+B']);
    });

    it('should handle mixed string and array keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysWin: ['Ctrl+Shift+A', 'Ctrl+Shift+B'],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+Shift+A', 'Ctrl+Shift+B', 'Ctrl+A']);
    });

    it('should return empty array when only keysMac is provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keysMac: 'Cmd+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual([]);
    });

    it('should remove duplicates', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysWin: 'Ctrl+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });

    it('should handle empty keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: '',
        keysWin: '',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual([]);
    });

    it('should filter out empty strings', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: ['Ctrl+A', ''],
        keysWin: ['Ctrl+Shift+A', ''],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+Shift+A', 'Ctrl+A']);
    });
  });

  describe('on Linux', () => {
    beforeEach(() => {
      vi.mocked(getOS).mockReturnValue(OperatingSystem.linuxOS);
    });

    it('should return only common keys, ignoring keysMac and keysWin', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
        keysMac: 'Cmd+A',
        keysWin: 'Ctrl+Shift+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });

    it('should return empty array when only keysMac is provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keysMac: 'Cmd+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual([]);
    });

    it('should return empty array when only keysWin is provided', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keysWin: 'Ctrl+Shift+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual([]);
    });

    it('should handle array of keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: ['Ctrl+A', 'Ctrl+B'],
        keysMac: ['Cmd+A', 'Cmd+B'],
        keysWin: ['Ctrl+Shift+A', 'Ctrl+Shift+B'],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A', 'Ctrl+B']);
    });

    it('should handle string keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: 'Ctrl+A',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });

    it('should filter out empty strings', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
        keys: ['Ctrl+A', ''],
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual(['Ctrl+A']);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined keys', () => {
      const keyBinding: IKeyBinding = {
        id: 'test',
      };
      const result = getCommonAndOSSpecificKeys(keyBinding);
      expect(result).toEqual([]);
    });
  });
});
