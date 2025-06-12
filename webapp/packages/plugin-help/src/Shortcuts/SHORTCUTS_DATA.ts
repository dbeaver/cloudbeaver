/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';
import { getCommonAndOSSpecificKeys, type IKeyBinding, KEY_BINDING_OPEN_IN_TAB, KEY_BINDING_REDO, KEY_BINDING_UNDO } from '@cloudbeaver/core-view';
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

const FORMAT_SHORTCUT_KEYS_MAP: Record<string, string> = {
  comma: ',',
  slash: '/',
  backslash: '\\',
  backspace: '⌫',
  tab: 'tab',
  clear: 'clear',
  enter: '↵',
  return: '↵',
  escape: 'escape',
  esc: 'escape',
  space: '␣',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  pageup: 'pageup',
  pagedown: 'pagedown',
  del: '⌦',
  delete: '⌦',
};
const SOURCE_DIVIDER_REGEXP = /\+/gi;
const APPLIED_DIVIDER = ' + ';

export const DATA_VIEWER_SHORTCUTS: IShortcut[] = [
  {
    label: 'data_viewer_shortcut_revert_inline_editor_changes',
    code: transformKeys(KEY_BINDING_REVERT_INLINE_EDITOR_CHANGES),
  },
  {
    label: 'data_viewer_shortcut_add_new_row',
    code: transformKeys(KEY_BINDING_ADD_NEW_ROW),
  },
  {
    label: 'data_viewer_shortcut_duplicate_row',
    code: transformKeys(KEY_BINDING_DUPLICATE_ROW),
  },
  // disabled
  // {
  //   label: 'data_viewer_shortcut_delete_row',
  //   code: transformKeys(KEY_BINDING_DELETE_ROW),
  // },
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
    label: 'sql_editor_shortcut_save_as_script',
    code: transformKeys(KEY_BINDING_SQL_EDITOR_SAVE_AS_SCRIPT),
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
  return getCommonAndOSSpecificKeys(keyBinding).map(shortcut =>
    shortcut.split(SOURCE_DIVIDER_REGEXP).map(formatKeyToDisplayKey).join(APPLIED_DIVIDER).toLocaleUpperCase(),
  );
}

function formatKeyToDisplayKey(code: string): string {
  const lowerCaseCode = code.toLowerCase();
  const OS = getOS();

  switch (lowerCaseCode) {
    case 'mod':
      if (OS === OperatingSystem.windowsOS || OS === OperatingSystem.linuxOS) {
        return 'CTRL';
      }
      if (OS === OperatingSystem.macOS) {
        return 'CMD';
      }
      return code;
    case 'alt':
      if (OS === OperatingSystem.macOS) {
        return 'OPTION';
      }
      return 'ALT';
    default:
      return FORMAT_SHORTCUT_KEYS_MAP[lowerCaseCode] ?? code;
  }
}
