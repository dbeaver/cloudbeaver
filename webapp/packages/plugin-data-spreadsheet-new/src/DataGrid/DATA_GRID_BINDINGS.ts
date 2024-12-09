/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IKeyBinding } from '@cloudbeaver/core-view';

/* these consts are only used for the user interface in Shortcuts popup, actual bindings in DataGridTable.tsx */
export const KEY_BINDING_REVERT_INLINE_EDITOR_CHANGES: IKeyBinding = {
  id: 'data-viewer-revert-inline-editor-changes',
  keys: ['Escape'],
};

export const KEY_BINDING_ADD_NEW_ROW: IKeyBinding = {
  id: 'data-viewer-add-new-row',
  keys: ['Alt+R'],
};

export const KEY_BINDING_DUPLICATE_ROW: IKeyBinding = {
  id: 'data-viewer-duplicate-row',
  keys: ['Shift+Alt+R'],
};

export const KEY_BINDING_DELETE_ROW: IKeyBinding = {
  id: 'data-viewer-delete-row',
  keys: ['Delete'],
};
