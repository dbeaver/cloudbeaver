/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createKeyBinding } from '@cloudbeaver/core-view';
import { EDITOR_ACCEPT_COMPLETION_ALTERNATIVE_KEYBINDING, EDITOR_ACCEPT_COMPLETION_KEYBINDING } from '@cloudbeaver/plugin-codemirror6';
import { mapCodemirrorShortcuts } from './mapCodemirrorShortcuts.js';

export const KEY_BINDING_SQL_EDITOR_ACCEPT_COMPLETION = createKeyBinding({
  id: 'sql-editor-accept-completion',
  ...mapCodemirrorShortcuts([EDITOR_ACCEPT_COMPLETION_KEYBINDING, EDITOR_ACCEPT_COMPLETION_ALTERNATIVE_KEYBINDING]),
});
