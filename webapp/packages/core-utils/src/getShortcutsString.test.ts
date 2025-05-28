/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { getShortcutsString } from './getShortcutsString.js';
import * as transformKeysModule from './transformKeys.js';

function mockTransformKeys(returnValue: string[]) {
  vi.spyOn(transformKeysModule, 'transformKeys').mockReturnValue(returnValue);
}

describe('getShortcutsString', () => {
  it('should return empty string if keys are not defined', () => {
    mockTransformKeys([]);
    expect(getShortcutsString({ id: 'test' })).toBe('');
  });

  it('should return shortcuts string', () => {
    mockTransformKeys(['Ctrl+S']);

    expect(getShortcutsString({ id: 'test', keys: 'Ctrl+S' })).toBe('(Ctrl+S)');
  });

  it('should return shortcuts string with divider and multiple keys', () => {
    mockTransformKeys(['Ctrl+S', 'Ctrl+Shift+S']);

    expect(getShortcutsString({ id: 'test', keys: ['Ctrl+S', 'Ctrl+Shift+S'] }, ' • ')).toBe('(Ctrl+S) • (Ctrl+Shift+S)');
  });

  it('should support another divider', () => {
    mockTransformKeys(['Ctrl+S', 'Ctrl+Shift+S']);

    expect(getShortcutsString({ id: 'test', keys: ['Ctrl+S', 'Ctrl+Shift+S'] }, ' | ')).toBe('(Ctrl+S) | (Ctrl+Shift+S)');
  });
});
