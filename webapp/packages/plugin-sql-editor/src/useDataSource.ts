/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource.js';
import { SqlEditorService } from './SqlEditorService.js';

export function useDataSource(dataSource?: ISqlDataSource) {
  const sqlEditorService = useService(SqlEditorService);

  // TODO: getComputed skips update somehow ...
  const outdated = dataSource && (dataSource.isOutdated() || !dataSource.isLoaded()) && !dataSource.isLoading();

  useEffect(() => {
    if (!outdated) {
      return;
    }

    if (!dataSource.exception || (Array.isArray(dataSource.exception) && !dataSource.exception.some(Boolean))) {
      if (!dataSource?.isLoading()) {
        dataSource.load();
      }
    }
  });

  const executionContextId = dataSource?.executionContext?.id;

  useEffect(
    () => () => {
      if (executionContextId !== undefined && dataSource?.executionContext?.id !== executionContextId) {
        sqlEditorService.destroyContext({ id: executionContextId, connectionId: '', projectId: '' });
      }
    },
    [executionContextId, dataSource],
  );
}
