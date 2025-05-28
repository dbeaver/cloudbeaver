/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { transformKeys } from './transformKeys.js';
import * as commonAndOSSpecificKeysModule from './getCommonAndOSSpecificKeys.js';
import * as formatKeyToDisplayKeyModule from './formatKeyToDisplayKey.js';

function mockFormatKeyToDisplayKey(keys: string[], displayKey: string) {
  return [
    vi.spyOn(commonAndOSSpecificKeysModule, 'getCommonAndOSSpecificKeys').mockReturnValue(keys),
    vi.spyOn(formatKeyToDisplayKeyModule, 'formatKeyToDisplayKey').mockReturnValue(displayKey),
  ];
}

describe('transformKeys', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty array if getCommonAndOSSpecificKeys returns empty array', () => {
    mockFormatKeyToDisplayKey([], '');
    const result = transformKeys({ id: 'test' });
    expect(result).toEqual([]);
  });

  it('should use os specific keys', () => {
    const [getCommonAndOSSpecificKeysSpy] = mockFormatKeyToDisplayKey(['Ctrl+S'], 'CTRL + S');
    const keyBinding = { id: 'test', keys: 'Ctrl+S', keysMac: 'Cmd+S' };

    transformKeys(keyBinding);

    expect(getCommonAndOSSpecificKeysSpy).toHaveBeenCalledWith(keyBinding);
  });

  it('should split keys by +', () => {
    const [getCommonAndOSSpecificKeysSpy] = mockFormatKeyToDisplayKey(['Ctrl+S'], 'CTRL + S');
    const keyBinding = { id: 'test', keys: 'Ctrl+S' };

    transformKeys(keyBinding);

    expect(getCommonAndOSSpecificKeysSpy).toHaveBeenCalledWith(keyBinding);
  });

  it('should format keys', () => {
    const [_, formatKeyToDisplayKeySpy] = mockFormatKeyToDisplayKey(['Ctrl+S', 'Cmd+S'], 'CTRL + S');
    const keyBinding = { id: 'test', keys: 'Ctrl+S+Cmd+S', keysMac: 'Cmd+S+Ctrl+S' };

    transformKeys(keyBinding);

    expect(formatKeyToDisplayKeySpy!.mock.calls[0]![0]).toBe('Ctrl');
    expect(formatKeyToDisplayKeySpy!.mock.calls[1]![0]).toBe('S');
    expect(formatKeyToDisplayKeySpy!.mock.calls[2]![0]).toBe('Cmd');
    expect(formatKeyToDisplayKeySpy!.mock.calls[3]![0]).toBe('S');
  });
});
