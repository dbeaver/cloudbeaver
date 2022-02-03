/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

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
    code: ['Ctrl + Enter'],
  },
  {
    label: 'sql_editor_shortcut_execute_statement_new_tab',
    code: ['Ctrl + \\', 'Ctrl + Shift + Enter'],
  },
  {
    label: 'sql_editor_shortcut_execute_script',
    code: ['Alt + X'],
  },
  {
    label: 'sql_editor_shortcut_show_execution_plan',
    code: ['Shift + Ctrl + E'],
  },
  {
    label: 'sql_editor_shortcut_open_editor_in_new_tab',
    code: ['Alt + T'],
  },
];

export const NAVIGATION_TREE_SHORTCUTS: IShortcut[] = [
  {
    label: 'navigation_tree_shortcut_enable_filter',
    code: ['Ctrl + F'],
  },
];