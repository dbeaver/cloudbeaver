/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';
import { getCommonAndOSSpecificKeys, IKeyBinding, KEY_BINDING_OPEN_IN_TAB, KEY_BINDING_REDO, KEY_BINDING_UNDO } from '@cloudbeaver/core-view';
import { KEY_BINDING_COLLAPSE_ALL, KEY_BINDING_ENABLE_FILTER, KEY_BINDING_LINK_OBJECT } from '@cloudbeaver/plugin-navigation-tree';
import {
  KEY_BINDING_SQL_EDITOR_EXECUTE,
  KEY_BINDING_SQL_EDITOR_EXECUTE_NEW,
  KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT,
  KEY_BINDING_SQL_EDITOR_FORMAT,
  KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN,
} from '@cloudbeaver/plugin-sql-editor';

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
    code: transformKeys(KEY_BINDING_SQL_EDITOR_EXECUTE),
  },
  {
    label: 'sql_editor_shortcut_execute_statement_new_tab',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_EXECUTE_NEW),
  },
  {
    label: 'sql_editor_shortcut_execute_script',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT),
  },
  {
    label: 'sql_editor_shortcut_show_execution_plan',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN),
  },
  {
    label: 'sql_editor_shortcut_format',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_FORMAT),
  },
  {
    label: 'sql_editor_shortcut_undo',
    code: transformKeys(KEY_BINDING_UNDO),
  },
  {
    label: 'sql_editor_shortcut_redo',
    code: transformKeys(KEY_BINDING_REDO),
  },
  {
    label: 'sql_editor_shortcut_open_editor_in_new_tab',
    code: transformKeys(KEY_BINDING_OPEN_IN_TAB),
  },
];

export const NAVIGATION_TREE_SHORTCUTS: IShortcut[] = [
  {
    label: 'navigation_tree_shortcut_enable_filter',
    code: transformKeys(KEY_BINDING_ENABLE_FILTER),
  },
  {
    label: 'app_navigationTree_action_collapse_all',
    code: transformKeys(KEY_BINDING_COLLAPSE_ALL),
  },
  {
    label: 'app_navigationTree_action_link_with_editor',
    code: transformKeys(KEY_BINDING_LINK_OBJECT),
  },
];

function transformKeys(keyBinding: IKeyBinding): string[] {
  const keys = getCommonAndOSSpecificKeys(keyBinding);

  return keys.map(key => transformModToDisplayKey(key.toLocaleUpperCase().replace(/\+/gi, ' + ')));
}

function transformModToDisplayKey(key: string): string {
  const OS = getOS();
  if (OS === OperatingSystem.windowsOS || OS === OperatingSystem.linuxOS) {
    return key.replace('MOD', 'CTRL');
  }

  if (OS === OperatingSystem.macOS) {
    return key.replace('MOD', 'CMD').replace('ALT', 'OPTION').replace('BACKSPACE', 'DELETE');
  }
  return key;
}
