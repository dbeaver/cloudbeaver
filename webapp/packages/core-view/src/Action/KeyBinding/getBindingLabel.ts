/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';
import { getCommonAndOSSpecificKeys } from './getCommonAndOSSpecificKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

const FORMAT_SHORTCUT_KEYS_MAP: Record<string, string> = {
  comma: ',',
  slash: '/',
  backslash: '\\',
  backspace: '⌫',
  tab: 'tab',
  clear: 'clear',
  enter: '↵',
  return: '↵',
  escape: 'escape',
  esc: 'escape',
  space: '␣',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  pageup: 'pageup',
  pagedown: 'pagedown',
  del: '⌦',
  delete: '⌦',
};
const SOURCE_DIVIDER_REGEXP = /\+/gi;
const APPLIED_DIVIDER = ' + ';

function transformKeys(keyBinding: IKeyBinding): string[] {
  return getCommonAndOSSpecificKeys(keyBinding).map(shortcut =>
    shortcut.split(SOURCE_DIVIDER_REGEXP).map(formatKeyToDisplayKey).join(APPLIED_DIVIDER).toLocaleUpperCase(),
  );
}

function formatKeyToDisplayKey(code: string): string {
  const lowerCaseCode = code.toLowerCase();
  const OS = getOS();

  switch (lowerCaseCode) {
    case 'mod':
      if (OS === OperatingSystem.windowsOS || OS === OperatingSystem.linuxOS) {
        return 'CTRL';
      }
      if (OS === OperatingSystem.macOS) {
        return 'CMD';
      }
      return code;
    case 'alt':
      if (OS === OperatingSystem.macOS) {
        return 'OPTION';
      }
      return 'ALT';
    default:
      return FORMAT_SHORTCUT_KEYS_MAP[lowerCaseCode] ?? code;
  }
}

export function getBindingLabel(binding: IKeyBinding): string | undefined {
  return transformKeys(binding)[0];
}
