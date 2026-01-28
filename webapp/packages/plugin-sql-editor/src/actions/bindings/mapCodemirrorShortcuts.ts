/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { SHORTCUT_DIVIDER, type IKeyBinding } from '@cloudbeaver/core-view';
import { type KeyBinding } from '@cloudbeaver/plugin-codemirror6';

const CODEMIRROR_SHORTCUT_SPLITTER = '-';

export function mapCodemirrorShortcuts(keyBinding: KeyBinding | KeyBinding[]): Omit<IKeyBinding, 'id'> {
  const bindings = Array.isArray(keyBinding) ? keyBinding : [keyBinding];

  return {
    keys: bindings.map(kb => kb.key?.split(CODEMIRROR_SHORTCUT_SPLITTER).join(SHORTCUT_DIVIDER) ?? ''),
    keysMac: bindings.map(kb => kb.mac?.split(CODEMIRROR_SHORTCUT_SPLITTER).join(SHORTCUT_DIVIDER) ?? ''),
    keysWin: bindings.map(kb => kb.win?.split(CODEMIRROR_SHORTCUT_SPLITTER).join(SHORTCUT_DIVIDER) ?? ''),
    keysLinux: bindings.map(kb => kb.linux?.split(CODEMIRROR_SHORTCUT_SPLITTER).join(SHORTCUT_DIVIDER) ?? ''),
    preventDefault: bindings.some(kb => kb.preventDefault),
  };
}
