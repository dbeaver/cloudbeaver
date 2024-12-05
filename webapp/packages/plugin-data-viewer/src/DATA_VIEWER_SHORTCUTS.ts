/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const KEY_BINDING_START_INLINE_EDITING = {
  id: 'data-viewer-start-inline-editing',
  keys: ['Enter', 'Backspace'],
  preventDefault: true,
};

export const KEY_BINDING_REVERT_INLINE_EDITOR_CHANGES = {
  id: 'data-viewer-revert-inline-editor-changes',
  keys: ['Escape'],
  preventDefault: true,
};

export const KEY_BINDING_ADD_NEW_ROW = {
  id: 'data-viewer-add-new-row',
  keys: ['Alt + Insert'],
  preventDefault: true,
};

export const KEY_BINDING_DUPLICATE_ROW = {
  id: 'data-viewer-duplicate-row',
  keys: ['Ctrl + Alt + Insert'],
  preventDefault: true,
};

export const KEY_BINDING_DELETE_ROW = {
  id: 'data-viewer-delete-row',
  keys: ['Delete'],
  preventDefault: true,
};

export const KEY_BINDING_PASTE_VALUE = {
  id: 'data-viewer-paste-value',
  keys: ['Mod + V'],
  preventDefault: true,
};

export const KEY_BINDING_COPY_VALUE = {
  id: 'data-viewer-copy-value',
  keys: ['Mod + C'],
  preventDefault: true,
};
