/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { KEY_BINDING_OPEN_IN_TAB, KEY_BINDING_REDO, KEY_BINDING_UNDO } from '@cloudbeaver/core-view';
import {
  KEY_BINDING_ADD_NEW_ROW,
  KEY_BINDING_DUPLICATE_ROW,
  KEY_BINDING_REVERT_INLINE_EDITOR_CHANGES,
} from '@cloudbeaver/plugin-data-spreadsheet-new';
import { KEY_BINDING_COLLAPSE_ALL, KEY_BINDING_ENABLE_FILTER } from '@cloudbeaver/plugin-navigation-tree';
import { KEY_BINDING_LINK_OBJECT } from '@cloudbeaver/plugin-object-viewer-nav-tree-link';
import {
  KEY_BINDING_SQL_EDITOR_EXECUTE,
  KEY_BINDING_SQL_EDITOR_EXECUTE_NEW,
  KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT,
  KEY_BINDING_SQL_EDITOR_FORMAT,
  KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN,
} from '@cloudbeaver/plugin-sql-editor';
import { KEY_BINDING_SQL_EDITOR_SAVE_AS_SCRIPT } from '@cloudbeaver/plugin-sql-editor-navigation-tab-script';

import type { IShortcut } from './IShortcut.js';

export const DATA_VIEWER_SHORTCUTS: IShortcut[] = [
  {
    label: 'data_viewer_shortcut_revert_inline_editor_changes',
    code: KEY_BINDING_REVERT_INLINE_EDITOR_CHANGES.transformedKeys,
  },
  {
    label: 'data_viewer_shortcut_add_new_row',
    code: KEY_BINDING_ADD_NEW_ROW.transformedKeys,
  },
  {
    label: 'data_viewer_shortcut_duplicate_row',
    code: KEY_BINDING_DUPLICATE_ROW.transformedKeys,
  },
  // disabled
  // {
  //   label: 'data_viewer_shortcut_delete_row',
  //   code: transformedKeys(KEY_BINDING_DELETE_ROW),
  // },
];

export const SQL_EDITOR_SHORTCUTS: IShortcut[] = [
  {
    label: 'sql_editor_shortcut_execute_statement',
    code: KEY_BINDING_SQL_EDITOR_EXECUTE.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_execute_statement_new_tab',
    code: KEY_BINDING_SQL_EDITOR_EXECUTE_NEW.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_execute_script',
    code: KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_show_execution_plan',
    code: KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_format',
    code: KEY_BINDING_SQL_EDITOR_FORMAT.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_save_as_script',
    code: KEY_BINDING_SQL_EDITOR_SAVE_AS_SCRIPT.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_undo',
    code: KEY_BINDING_UNDO.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_redo',
    code: KEY_BINDING_REDO.transformedKeys,
  },
  {
    label: 'sql_editor_shortcut_open_editor_in_new_tab',
    code: KEY_BINDING_OPEN_IN_TAB.transformedKeys,
  },
];

export const NAVIGATION_TREE_SHORTCUTS: IShortcut[] = [
  {
    label: 'navigation_tree_shortcut_enable_filter',
    code: KEY_BINDING_ENABLE_FILTER.transformedKeys,
  },
  {
    label: 'app_navigationTree_action_collapse_all',
    code: KEY_BINDING_COLLAPSE_ALL.transformedKeys,
  },
  {
    label: 'app_navigationTree_action_link_with_editor',
    code: KEY_BINDING_LINK_OBJECT.transformedKeys,
  },
];

