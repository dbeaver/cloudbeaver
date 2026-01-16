/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IKeyBinding } from '@cloudbeaver/core-view';

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
  keys: ['mod+shift+backspace'],
  preventDefault: true,
};

export const KEY_BINDING_SAVE: IKeyBinding = {
  id: 'data-viewer-save',
  keys: ['mod+shift+s'],
};

export const KEY_BINDING_CANCEL: IKeyBinding = {
  id: 'data-viewer-cancel',
  keys: ['mod+period'],
};
