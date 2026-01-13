/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { SHORTCUT_DIVIDER, type IKeyBinding } from '@cloudbeaver/core-view';
import { CODEMIRROR_SHORTCUT_SPLITTER, type KeyBinding } from '@cloudbeaver/plugin-codemirror6';

export function mapCodemirrorShortcuts(keyBinding: KeyBinding): Omit<IKeyBinding, 'id'> {
  return {
    keys: keyBinding.key?.split(CODEMIRROR_SHORTCUT_SPLITTER).join(SHORTCUT_DIVIDER) ?? '',
    keysMac: keyBinding.key?.split(CODEMIRROR_SHORTCUT_SPLITTER).join(SHORTCUT_DIVIDER) ?? '',
    preventDefault: keyBinding.preventDefault,
  };
}
