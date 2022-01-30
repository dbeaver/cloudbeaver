/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISessionAction } from '@cloudbeaver/core-root';

import { SESSION_ACTION_OPEN_SQL_EDITOR } from './SESSION_ACTION_OPEN_SQL_EDITOR';

export interface ISessionActionOpenSQLEditor {
  action: typeof SESSION_ACTION_OPEN_SQL_EDITOR;
  'editor-name': string;
  'connection-id': string;
}

export function isSessionActionOpenSQLEditor(action: ISessionAction | null): action is ISessionActionOpenSQLEditor {
  return action?.action === SESSION_ACTION_OPEN_SQL_EDITOR;
}