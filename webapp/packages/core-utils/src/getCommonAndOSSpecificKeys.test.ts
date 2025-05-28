/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { getCommonAndOSSpecificKeys } from './getCommonAndOSSpecificKeys.js';
import * as getOSSpecificKeysModule from './getOSSpecificKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

function mockGetOSSpecificKeys(returnValue: string | string[] | undefined) {
  vi.spyOn(getOSSpecificKeysModule, 'getOSSpecificKeys').mockReturnValue(returnValue);
}

describe('getCommonAndOSSpecificKeys', () => {
  it('should return an empty array if keyBinding is undefined', () => {
    const result = getCommonAndOSSpecificKeys(undefined);
    expect(result).toEqual([]);
  });

  it('should return only common keys when OS-specific keys are undefined', () => {
    const keyBinding: IKeyBinding = { id: 'test', keys: 'Ctrl+S' };
    mockGetOSSpecificKeys(undefined);

    const result = getCommonAndOSSpecificKeys(keyBinding);
    expect(result).toEqual(['Ctrl+S']);
  });

  it('should return common and OS-specific keys (string)', () => {
    const keyBinding: IKeyBinding = { id: 'test', keys: 'Ctrl+S' };
    mockGetOSSpecificKeys('Cmd+S');

    const result = getCommonAndOSSpecificKeys(keyBinding);
    expect(result).toEqual(['Ctrl+S', 'Cmd+S']);
  });

  it('should return common and OS-specific keys (array)', () => {
    const keyBinding: IKeyBinding = { id: 'test', keys: ['Ctrl+S', 'Ctrl+Shift+S'] };
    mockGetOSSpecificKeys(['Cmd+S', 'Cmd+Shift+S']);

    const result = getCommonAndOSSpecificKeys(keyBinding);
    expect(result).toEqual(['Ctrl+S', 'Ctrl+Shift+S', 'Cmd+S', 'Cmd+Shift+S']);
  });

  it('should handle common keys as a single string and OS-specific keys as an array', () => {
    const keyBinding: IKeyBinding = { id: 'test', keys: 'Ctrl+S' };
    mockGetOSSpecificKeys(['Cmd+S', 'Cmd+Shift+S']);

    const result = getCommonAndOSSpecificKeys(keyBinding);
    expect(result).toEqual(['Ctrl+S', 'Cmd+S', 'Cmd+Shift+S']);
  });
});
