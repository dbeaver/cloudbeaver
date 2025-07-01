/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import {
  Button,
  getComputed,
  Overlay,
  OverlayActions,
  OverlayHeader,
  OverlayHeaderIcon,
  OverlayHeaderSubTitle,
  OverlayHeaderTitle,
  OverlayMessage,
  s,
  useFocus,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import {
  ConnectionExecutionContextResource,
  ConnectionInfoResource,
  createConnectionParam,
  DBDriverResource,
  getRealExecutionContextId,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';

import type { ISqlEditorTabState } from './ISqlEditorTabState.js';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import style from './SqlEditorOverlay.module.css';
import { SqlEditorService } from './SqlEditorService.js';

interface Props {
  state: ISqlEditorTabState;
}

export const SqlEditorOverlay = observer<Props>(function SqlEditorOverlay({ state }) {
  const styles = useS(style);
  const translate = useTranslate();
  const sqlEditorService = useService(SqlEditorService);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const notificationService = useService(NotificationService);
  const dataSource = sqlDataSourceService.get(state.editorId);
  const executionContextId = dataSource?.executionContext?.id;
  const executionContext = dataSource?.executionContext;

  const connection = useResource(
    SqlEditorOverlay,
    ConnectionInfoResource,
    executionContext ? createConnectionParam(executionContext.projectId, executionContext.connectionId) : null,
  );
  const driver = useResource(SqlEditorOverlay, DBDriverResource, connection.tryGetData?.driverId ?? null);
  const [focusedRef, { updateFocus }] = useFocus<HTMLDivElement>({ focusFirstChild: true });

  const connected = getComputed(() => connection.tryGetData?.connected ?? false);

  const context = useResource(SqlEditorOverlay, ConnectionExecutionContextResource, getRealExecutionContextId(executionContextId), {
    active: connected,
  });

  const initializingContext = getComputed(() => connection.isLoading() || context.isLoading());
  const initExecutionContext = getComputed(
    () => context.tryGetData === undefined && connection.tryGetData !== undefined && dataSource?.isLoading() === false,
  );

  async function cancelConnection() {
    await sqlEditorService.resetExecutionContext(state);
  }

  async function init() {
    try {
      await sqlEditorService.initEditorConnection(state);
    } catch (exception: any) {
      notificationService.logException(exception);
    }
  }

  const dataContainer = getComputed(() =>
    NodeManagerUtils.concatSchemaAndCatalog(dataSource?.executionContext?.defaultCatalog, dataSource?.executionContext?.defaultSchema),
  );

  useEffect(() => {
    if (initExecutionContext && connected) {
      init();
    } else if (initExecutionContext && !connected) {
      updateFocus();
    }
  }, [connected, initExecutionContext]);

  return (
    <div ref={focusedRef}>
      <Overlay active={initExecutionContext && !connected}>
        <OverlayHeader>
          <OverlayHeaderIcon icon={driver.tryGetData?.icon} />
          <OverlayHeaderTitle>{connection.tryGetData?.name}</OverlayHeaderTitle>
          {dataContainer && <OverlayHeaderSubTitle>{dataContainer}</OverlayHeaderSubTitle>}
        </OverlayHeader>
        <OverlayMessage>{translate('sql_editor_restore_message')}</OverlayMessage>
        <OverlayActions className={s(styles, { overlayActions: true })}>
          <Button type="button" variant="secondary" loader onClick={cancelConnection}>
            {translate('ui_processing_cancel')}
          </Button>
          <Button type="button" loading={initializingContext} loader onClick={init}>
            {translate('sql_editor_restore')}
          </Button>
        </OverlayActions>
      </Overlay>
    </div>
  );
});
