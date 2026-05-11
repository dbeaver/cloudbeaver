/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getCommonAndOSSpecificKeys } from './getCommonAndOSSpecificKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

// Overrides for keys where the display value in FORMAT_SHORTCUT_KEYS_MAP differs from event.key
const EVENT_KEY_OVERRIDES: Record<string, string> = {
  backspace: 'Backspace',
  enter: 'Enter',
  return: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  del: 'Delete',
  delete: 'Delete',
  tab: 'Tab',
  space: ' ',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

function resolveEventKey(keyPart: string): string {
  return EVENT_KEY_OVERRIDES[keyPart] ?? keyPart;
}

const MODIFIER_KEYS = new Set(['mod', 'ctrl', 'shift', 'alt', 'meta']);

function matchesCombo(event: KeyboardEvent | React.KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+');
  const keyParts = parts.filter(p => !MODIFIER_KEYS.has(p));

  const needsMod = parts.includes('mod');
  const needsCtrl = parts.includes('ctrl');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');
  const needsMeta = parts.includes('meta');

  if (needsMod && !(event.ctrlKey || event.metaKey)) {
    return false;
  }
  if (needsCtrl && !event.ctrlKey) {
    return false;
  }
  if (needsMeta && !event.metaKey) {
    return false;
  }
  if (needsShift && !event.shiftKey) {
    return false;
  }
  if (needsAlt && !event.altKey) {
    return false;
  }

  // Disallow unexpected modifiers
  if (!needsMod && !needsCtrl && !needsMeta && (event.ctrlKey || event.metaKey)) {
    return false;
  }
  if (!needsShift && event.shiftKey) {
    return false;
  }
  if (!needsAlt && event.altKey) {
    return false;
  }

  const eventKey = event.key.toLowerCase();
  return keyParts.some(k => resolveEventKey(k).toLowerCase() === eventKey);
}

export function matchesKeyBinding(event: KeyboardEvent | React.KeyboardEvent, binding: IKeyBinding): boolean {
  return getCommonAndOSSpecificKeys(binding).some(combo => matchesCombo(event, combo));
}
