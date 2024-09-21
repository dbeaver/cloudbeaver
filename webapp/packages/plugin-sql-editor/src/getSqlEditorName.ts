/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Connection } from '@cloudbeaver/core-connections';

import type { ISqlEditorTabState } from './ISqlEditorTabState.js';
import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource.js';

export function getSqlEditorName(state: ISqlEditorTabState, dataSource?: ISqlDataSource, connection?: Connection): string {
  if (dataSource?.name) {
    return dataSource.name;
  }

  let name = `sql-${state.order}`;

  if (connection) {
    name += ` (${connection.name})`;
  }

  return name;
}
