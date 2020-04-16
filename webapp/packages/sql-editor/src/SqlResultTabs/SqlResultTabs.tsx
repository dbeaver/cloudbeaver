/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { useTabHandlerState } from '@dbeaver/core/app';
import {
  Tab, TabPanel, TabTitle, TabsBox, TextPlaceholder, Loader,
} from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles, composes } from '@dbeaver/core/theming';

import { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlEditorManagerService } from '../SqlEditorManagerService';
import { sqlEditorTabHandlerKey } from '../sqlEditorTabHandlerKey';
import { SqlResultPanel } from './SqlResultPanel/SqlResultPanel';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
    tabs {
      composes: theme-background-background theme-text-text-primary-on-light from global;
    }
  `,
  css`
    wrapper {
      display: flex;
      flex: 1;
      height: 100%;
      position: relative;
    }
    TabsBox {
      height: 100%;
    }
  `
);

type SqlDataResultProps = {
  tabId: string;
}

export const SqlResultTabs = observer(function SqlDataResult({ tabId: editorId }: SqlDataResultProps) {
  const sqlEditorManager = useService(SqlEditorManagerService);
  const handlerState = useTabHandlerState<ISqlEditorTabState>(editorId, sqlEditorTabHandlerKey);
  const handleOpen = useCallback(
    (resultId: string) => sqlEditorManager.openEditorResult(editorId, resultId),
    [editorId]
  );
  const handleClose = useCallback(
    (resultId: string) => sqlEditorManager.closeEditorResult(editorId, resultId),
    [editorId]
  );

  if (!handlerState?.resultTabs.length) {
    return <TextPlaceholder>Execute query with Ctrl+Enter to see results</TextPlaceholder>;
  }

  const currentId = handlerState.currentResultTabId || '';

  return styled(useStyles(styles))(
    <wrapper as="div">
      <TabsBox
        currentTabId={currentId}
        tabs={handlerState?.resultTabs.map(result => (
          <Tab key={result.resultTabId} tabId={result.resultTabId} onOpen={handleOpen} onClose={handleClose}>
            <TabTitle title={result.name}/>
          </Tab>
        ))}
        style={[styles]}
      >
        {handlerState?.resultTabs.map(result => (
          <TabPanel key={result.resultTabId} tabId={result.resultTabId}>
            <SqlResultPanel panelInit={result.panelParams}/>
          </TabPanel>
        ))}
      </TabsBox>
      <Loader
        loading={handlerState.sqlExecutionState.isSqlExecuting}
        cancelDisabled={!handlerState.sqlExecutionState.canCancel}
        onCancel={handlerState.sqlExecutionState.cancelSQlExecuting}
        overlay
      />
    </wrapper>
  );
});
