/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles, Overlay, OverlayMessage, OverlayActions, Button, useResource, getComputed, OverlayHeader, OverlayHeaderIcon, OverlayHeaderTitle, OverlayHeaderSubTitle, useSplitUserState, Loader, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextResource, ConnectionInfoResource, createConnectionParam, DBDriverResource, getRealExecutionContextId } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { CaptureView } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader';
import { SqlEditorService } from './SqlEditorService';
import { SqlEditorView } from './SqlEditorView';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs';
import { useDataSource } from './useDataSource';

const viewerStyles = css`
  CaptureView {
    flex: 1;
    display: flex;
    overflow: auto;
  }
  Pane {
    composes: theme-typography--body2 from global;
    display: flex;
    position: relative;
  }
  Pane:first-child {
    flex-direction: column;
  }
  SqlEditorLoader {
    composes: theme-typography--body1 from global;
  }
  OverlayActions {
    justify-content: space-between;
  }

  Loader {
    composes: theme-background-surface theme-border-color-background from global;

    position: absolute;
    bottom: 0px;

    border-top: 1px solid;
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
  }
`;

interface Props {
  state: ISqlEditorTabState;
}

export const SqlEditor = observer<Props>(function SqlEditor({ state }) {
  const translate = useTranslate();
  const sqlEditorView = useService(SqlEditorView);
  const sqlEditorService = useService(SqlEditorService);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const styles = useStyles(splitStyles, splitHorizontalStyles, viewerStyles);
  const dataSource = sqlDataSourceService.get(state.editorId);
  useDataSource(dataSource);
  const connection = useResource(
    SqlEditor,
    ConnectionInfoResource,
    dataSource?.executionContext
      ? createConnectionParam(dataSource.executionContext.projectId, dataSource.executionContext.connectionId)
      : null
  );
  const driver = useResource(SqlEditor, DBDriverResource, connection.data?.driverId ?? null);
  const splitState = useSplitUserState('sql-editor');

  const connected = getComputed(() => connection.data?.connected ?? false);

  const context = useResource(
    SqlEditor,
    ConnectionExecutionContextResource,
    connected ? getRealExecutionContextId(dataSource?.executionContext?.id) : null
  );

  const initializingContext = getComputed(() => connection.isLoading() || context.isLoading());
  const initExecutionContext = getComputed(() => (
    context.data === undefined
    && connection.data !== undefined
  ));

  async function cancelConnection() {
    await sqlEditorService.resetExecutionContext(state);
  }

  async function init() {
    await sqlEditorService.initEditorConnection(state);
  }

  const dataContainer = getComputed(() => NodeManagerUtils.concatSchemaAndCatalog(
    dataSource?.executionContext?.defaultCatalog,
    dataSource?.executionContext?.defaultSchema
  ));

  useEffect(() => {
    if (initExecutionContext && connected) {
      init();
    }
  }, [connected, initExecutionContext]);

  return styled(styles)(
    <CaptureView view={sqlEditorView}>
      <Split {...splitState} split="horizontal" sticky={30}>
        <Pane>
          <SqlEditorLoader state={state} />
          <Loader state={dataSource} message={dataSource?.message} small inline inlineException />
        </Pane>
        <ResizerControls />
        <Pane basis='50%' main>
          <SqlResultTabs state={state} />
        </Pane>
      </Split>
      <Overlay active={initExecutionContext}>
        <OverlayHeader>
          <OverlayHeaderIcon icon={driver.data?.icon} />
          <OverlayHeaderTitle>{connection.data?.name}</OverlayHeaderTitle>
          {dataContainer && <OverlayHeaderSubTitle>{dataContainer}</OverlayHeaderSubTitle>}
        </OverlayHeader>
        <OverlayMessage>{translate('sql_editor_restore_message')}</OverlayMessage>
        <OverlayActions>
          <Button
            type="button"
            mod={['outlined']}
            loader
            onClick={cancelConnection}
          >
            {translate('ui_processing_cancel')}
          </Button>
          <Button
            type="button"
            mod={['unelevated']}
            loading={initializingContext}
            loader
            onClick={init}
          >
            {translate('sql_editor_restore')}
          </Button>
        </OverlayActions>
      </Overlay>
    </CaptureView>
  );
});
