/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Connection } from '@cloudbeaver/core-connections';
import type { ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

export function getSqlEditorName(state: ISqlEditorTabState, connection?: Connection): string {
  if (state.name) {
    return state.name;
  }

  let name = `sql-${state.order}`;

  if (connection) {
    name += ` (${connection.name})`;
  }

  return name;
}