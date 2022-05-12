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

import { NodeManagerUtils } from '@cloudbeaver/core-app';
import { splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles, Overlay, OverlayMessage, OverlayActions, Button, useMapResource, getComputed, OverlayHeader, OverlayHeaderIcon, OverlayHeaderTitle, OverlayHeaderSubTitle, useSplitUserState } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextResource, ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { CaptureView } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader';
import { SqlEditorService } from './SqlEditorService';
import { SqlEditorView } from './SqlEditorView';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs';

const viewerStyles = css`
  CaptureView {
    flex: 1;
    display: flex;
    overflow: auto;
  }
  Pane {
    composes: theme-typography--body2 from global;
    display: flex;
  }
  SqlEditorLoader {
    composes: theme-typography--body1 from global;
  }
  OverlayActions {
    justify-content: space-between;
  }
`;

interface Props {
  state: ISqlEditorTabState;
}

export const SqlEditor = observer<Props>(function SqlEditor({ state }) {
  const translate = useTranslate();
  const sqlEditorView = useService(SqlEditorView);
  const sqlEditorService = useService(SqlEditorService);
  const styles = useStyles(splitStyles, splitHorizontalStyles, viewerStyles);
  const connection = useMapResource(SqlEditor, ConnectionInfoResource, state.executionContext?.connectionId ?? null);
  const driver = useMapResource(SqlEditor, DBDriverResource, connection.data?.driverId ?? null);
  const splitState = useSplitUserState('sql-editor');

  const connected = getComputed(() => connection.data?.connected ?? false);

  const context = useMapResource(
    SqlEditor,
    ConnectionExecutionContextResource,
    connected ? (state.executionContext?.id ?? null) : null
  );

  const initializingContext = getComputed(() => connection.isLoading() || context.isLoading());
  const initExecutionContext = getComputed(() => context.data === undefined && state.executionContext !== undefined);

  async function cancelConnection() {
    await sqlEditorService.resetExecutionContext(state);
  }

  async function init() {
    await sqlEditorService.initEditorConnection(state);
  }

  const dataContainer = getComputed(() => NodeManagerUtils.concatSchemaAndCatalog(
    state.executionContext?.defaultCatalog,
    state.executionContext?.defaultSchema
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
