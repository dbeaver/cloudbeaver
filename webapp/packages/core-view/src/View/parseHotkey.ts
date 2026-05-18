/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Hotkey } from '@cloudbeaver/core-blocks';
import type { KeyboardEvent } from 'react';

import { getCommonAndOSSpecificKeys } from '../Action/KeyBinding/getCommonAndOSSpecificKeys.js';
import type { IKeyBinding } from '../Action/KeyBinding/IKeyBinding.js';

const reservedModifierKeywords = ['shift', 'alt', 'meta', 'mod', 'ctrl'];

const mappedKeys: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  '.': 'period',
  ',': 'comma',
  '-': 'slash',
  ' ': 'space',
  '`': 'backquote',
  '#': 'backslash',
  '+': 'bracketright',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  AltLeft: 'alt',
  AltRight: 'alt',
  MetaLeft: 'meta',
  MetaRight: 'meta',
  OSLeft: 'meta',
  OSRight: 'meta',
  ControlLeft: 'ctrl',
  ControlRight: 'ctrl',
};

export function mapKey(key: string): string {
  return (mappedKeys[key] || key)
    .trim()
    .toLowerCase()
    .replace(/key|digit|numpad|arrow/, '');
}

export function isHotkeyModifier(key: string): boolean {
  return reservedModifierKeywords.includes(key);
}

export function parseKeysHookInput(keys: string, splitKey = ','): string[] {
  return keys.split(splitKey);
}

export function isBindingPressed<T extends HTMLElement>(event: KeyboardEvent<T>, binding: IKeyBinding, combinationKey = '+'): boolean {
  const keys = getCommonAndOSSpecificKeys(binding);

  return keys.some(hotkey => {
    const parsed = parseHotkey(hotkey, combinationKey);
    const mod = event.ctrlKey || event.metaKey;

    if (!!parsed.shift !== event.shiftKey) {
      return false;
    }
    if (!!parsed.alt !== event.altKey) {
      return false;
    }
    if (parsed.mod) {
      if (!mod) {
        return false;
      }
    } else {
      if (event.ctrlKey !== !!parsed.ctrl) {
        return false;
      }
      if (event.metaKey !== !!parsed.meta) {
        return false;
      }
    }

    return parsed.keys?.some(k => mapKey(event.key) === k) ?? false;
  });
}

export function parseHotkey(hotkey: string, combinationKey = '+'): Hotkey {
  const keys = hotkey
    .toLocaleLowerCase()
    .split(combinationKey)
    .map(k => mapKey(k));

  const modifiers: Record<string, boolean> = {
    alt: keys.includes('alt'),
    ctrl: keys.includes('ctrl') || keys.includes('control'),
    shift: keys.includes('shift'),
    meta: keys.includes('meta'),
    mod: keys.includes('mod'),
  };

  const singleCharKeys = keys.filter(k => !reservedModifierKeywords.includes(k));

  return {
    ...modifiers,
    keys: singleCharKeys,
    isSequence: false,
    useKey: false,
    description: undefined,
  };
}
