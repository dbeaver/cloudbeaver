/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, getComputed, useResource, IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  ConnectionExecutionContextResource,
  ConnectionInfoResource,
  DBDriverResource,
  createConnectionParam,
  getRealExecutionContextId,
} from '@cloudbeaver/core-connections';

import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import { SqlEditorService } from './SqlEditorService.js';

import type { ISqlEditorTabState } from './ISqlEditorTabState.js';

interface Props {
  state: ISqlEditorTabState;
}

export const SqlEditorConnectionBar = observer<Props>(function SqlEditorConnectionBar({ state }) {
  const translate = useTranslate();

  const sqlDataSourceService = useService(SqlDataSourceService);
  const dataSource = sqlDataSourceService.get(state.editorId);

  const sqlEditorService = useService(SqlEditorService);
  const notificationService = useService(NotificationService);
  const executionContext = dataSource?.executionContext;

  const connection = useResource(
    SqlEditorConnectionBar,
    ConnectionInfoResource,
    executionContext ? createConnectionParam(executionContext.projectId, executionContext.connectionId) : null,
  );

  const connected = getComputed(() => connection.tryGetData?.connected ?? false);

  const driver = useResource(SqlEditorConnectionBar, DBDriverResource, connection.tryGetData?.driverId ?? null);
  const context = useResource(SqlEditorConnectionBar, ConnectionExecutionContextResource, getRealExecutionContextId(executionContext?.id), {
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
    if (initExecutionContext && connected) {
      init();
    }
  }, [connected, initExecutionContext]);

  if (!connection.data || connection.data.connected) {
    return null;
  }

  return (
    <div className="tw:px-2 tw:py-1 tw:border-b theme-border-color-background tw:flex tw:justify-between tw:items-center">
      <div className="tw:flex tw:gap-2 tw:items-center ">
        {driver.data?.icon && <IconOrImage className="tw:size-4" icon={driver.data.icon} />}
        <div>{connection.data.name}</div>
      </div>
      <Button loading={initializingContext} size="small" variant="secondary" onClick={init}>
        {translate('ui_reconnect')}
      </Button>
    </div>
  );
});
