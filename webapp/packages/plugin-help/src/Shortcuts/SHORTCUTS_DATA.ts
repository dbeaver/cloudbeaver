/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { KEY_BINDING_OPEN_IN_TAB, KEY_BINDING_REDO, KEY_BINDING_UNDO } from '@cloudbeaver/core-view';
import { KEY_BINDING_ENABLE_FILTER, KEY_BINDING_COLLAPSE_ALL, KEY_BINDING_LINK_OBJECT } from '@cloudbeaver/plugin-navigation-tree';
import { KEY_BINDING_SQL_EDITOR_EXECUTE, KEY_BINDING_SQL_EDITOR_EXECUTE_NEW, KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT, KEY_BINDING_SQL_EDITOR_FORMAT, KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN } from '@cloudbeaver/plugin-sql-editor';

import type { IShortcut } from './IShortcut';

export const DATA_VIEWER_SHORTCUTS: IShortcut[] = [
  {
    label: 'data_viewer_shortcut_start_inline_editing',
    code: ['Enter', 'Backspace'],
  },
  {
    label: 'data_viewer_shortcut_revert_inline_editor_changes',
    code: ['Escape'],
  },
  {
    label: 'data_viewer_shortcut_add_new_row',
    code: ['Alt + Insert'],
  },
  {
    label: 'data_viewer_shortcut_duplicate_row',
    code: ['Ctrl + Alt + Insert'],
  },
  {
    label: 'data_viewer_shortcut_delete_row',
    code: ['Delete'],
  },
  {
    label: 'data_viewer_shortcut_past_value',
    code: ['Ctrl + V'],
  },
  {
    label: 'data_viewer_shortcut_copy_value',
    code: ['Ctrl + C'],
  },
];

export const SQL_EDITOR_SHORTCUTS: IShortcut[] = [
  {
    label: 'sql_editor_shortcut_execute_statement',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_EXECUTE.keys),
  },
  {
    label: 'sql_editor_shortcut_execute_statement_new_tab',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_EXECUTE_NEW.keys),
  },
  {
    label: 'sql_editor_shortcut_execute_script',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT.keys),
  },
  {
    label: 'sql_editor_shortcut_show_execution_plan',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN.keys),
  },
  {
    label: 'sql_editor_shortcut_format',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_FORMAT.keys),
  },
  {
    label: 'sql_editor_shortcut_undo',
    code: transformKeys(KEY_BINDING_UNDO.keys),
  },
  {
    label: 'sql_editor_shortcut_redo',
    code: transformKeys(KEY_BINDING_REDO.keys),
  },
  {
    label: 'sql_editor_shortcut_open_editor_in_new_tab',
    code: transformKeys(KEY_BINDING_OPEN_IN_TAB.keys),
  },
];

export const NAVIGATION_TREE_SHORTCUTS: IShortcut[] = [
  {
    label: 'navigation_tree_shortcut_enable_filter',
    code: transformKeys(KEY_BINDING_ENABLE_FILTER.keys),
  },
  {
    label: 'app_navigationTree_action_collapse_all',
    code: transformKeys(KEY_BINDING_COLLAPSE_ALL.keys),
  },
  {
    label: 'app_navigationTree_action_link_with_editor',
    code: transformKeys(KEY_BINDING_LINK_OBJECT.keys),
  },
];

function transformKeys(keys: string | string[]): string[] {
  if (!Array.isArray(keys)) {
    keys = [keys];
  }

  return keys.map(key => key.toLocaleUpperCase().replace(/\+/ig, ' + '));
}