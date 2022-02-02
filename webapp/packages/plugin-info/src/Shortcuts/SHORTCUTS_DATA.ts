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
    body: {
      code: 'Enter',
      or: {
        code: 'Backspace',
      },
    },
  },
  {
    label: 'data_viewer_shortcut_add_new_row',
    body: {
      code: 'Alt',
      and: {
        code: 'Insert',
      },
    },
  },
  {
    label: 'data_viewer_shortcut_duplicate_row',
    body: {
      code: 'Ctrl',
      and: {
        code: 'Alt',
        and: {
          code: 'Insert',
        },
      },
    },
  },
  {
    label: 'data_viewer_shortcut_delete_row',
    body: {
      code: 'Delete',
    },
  },
  {
    label: 'data_viewer_shortcut_revert_inline_editor_changes',
    body: {
      code: 'Escape',
    },
  },
  {
    label: 'data_viewer_shortcut_past_value',
    body: {
      code: 'Ctrl',
      and: {
        code: 'V',
      },
    },
  },
  {
    label: 'data_viewer_shortcut_copy_value',
    body: {
      code: 'Ctrl',
      and: {
        code: 'C',
      },
    },
  },
];

export const SQL_EDITOR_SHORTCUTS: IShortcut[] = [
  {
    label: 'sql_editor_shortcut_execute_statement',
    body: {
      code: 'Ctrl',
      and: {
        code: 'Enter',
      },
    },
  },
  {
    label: 'sql_editor_shortcut_execute_statement_new_tab',
    body: {
      code: 'Ctrl',
      and: {
        code: '\\',
      },
      or: {
        code: 'Ctrl',
        and: {
          code: 'Shift',
          and: {
            code: 'Enter',
          },
        },
      },
    },
  },
  {
    label: 'sql_editor_shortcut_execute_script',
    body: {
      code: 'Alt',
      and: {
        code: 'X',
      },
    },
  },
  {
    label: 'sql_editor_shortcut_show_execution_plan',
    body: {
      code: 'Shift',
      and: {
        code: 'Ctrl',
        and: {
          code: 'E',
        },
      },
    },
  },
  {
    label: 'sql_editor_shortcut_open_editor_in_new_tab',
    body: {
      code: 'Alt',
      and: {
        code: 'T',
      },
    },
  },
];