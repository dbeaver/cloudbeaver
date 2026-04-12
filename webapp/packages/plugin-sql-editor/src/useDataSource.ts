/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  ConnectionExecutionContextResource,
  ConnectionInfoResource,
  createConnectionParam,
  getRealExecutionContextId,
} from '@cloudbeaver/core-connections';
import { getComputed, useResource } from '@cloudbeaver/core-blocks';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource.js';
import { SqlEditorService } from './SqlEditorService.js';
import type { ISqlEditorTabState } from './ISqlEditorTabState.js';

export function useDataSource(state: ISqlEditorTabState, dataSource?: ISqlDataSource) {
  const sqlEditorService = useService(SqlEditorService);
  const notificationService = useService(NotificationService);

  // TODO: getComputed skips update somehow ...
  const outdated = dataSource && (dataSource.isOutdated() || !dataSource.isLoaded()) && !dataSource.isLoading();
  const executionContext = dataSource?.executionContext;

  const connection = useResource(
    useDataSource,
    ConnectionInfoResource,
    executionContext ? createConnectionParam(executionContext.projectId, executionContext.connectionId) : null,
  );

  const connected = getComputed(() => connection.tryGetData?.connected ?? false);
  const context = useResource(useDataSource, ConnectionExecutionContextResource, getRealExecutionContextId(executionContext?.id), {
    active: connected,
  });

  const initializingContext = getComputed(() => connection.isLoading() || context.isLoading());
  const initExecutionContext = getComputed(
    () => context.data === undefined && connection.tryGetData !== undefined && dataSource?.isLoading() === false && !initializingContext,
  );

  async function init() {
    try {
      await sqlEditorService.initEditorConnection(state);
    } catch (exception: any) {
      notificationService.logException(exception);
    }
  }

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

  useEffect(
    () => () => {
      if (executionContext?.id !== undefined && dataSource?.executionContext?.id !== executionContext.id) {
        sqlEditorService.destroyContext({ id: executionContext.id, connectionId: '', projectId: '' });
      }
    },
    [executionContext?.id, dataSource],
  );

  useEffect(() => {
    if (initExecutionContext && connected) {
      init();
    }
  }, [connected, initExecutionContext]);
}
