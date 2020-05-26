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

import { ITab as TabClass } from '@dbeaver/core/app';
import {
  Tab, TabPanel, TabTitle, TabsBox, TextPlaceholder, Loader
} from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles, composes } from '@dbeaver/core/theming';

import { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlEditorNavigatorService } from '../SqlEditorNavigatorService';
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
  tab: TabClass<ISqlEditorTabState>;
}

export const SqlResultTabs = observer(function SqlDataResult({ tab }: SqlDataResultProps) {
  const navigatorService = useService(SqlEditorNavigatorService);
  const handleOpen = useCallback(
    (resultId: string) => navigatorService.openEditorResult(tab.id, resultId),
    []
  );
  const handleClose = useCallback(
    (resultId: string) => navigatorService.closeEditorResult(tab.id, resultId),
    []
  );

  if (!tab.handlerState.resultTabs.length) {
    return <TextPlaceholder>Execute query with Ctrl+Enter to see results</TextPlaceholder>;
  }

  const currentId = tab.handlerState.currentResultTabId || '';

  return styled(useStyles(styles))(
    <wrapper as="div">
      <TabsBox
        currentTabId={currentId}
        tabs={tab.handlerState.resultTabs.map(result => (
          <Tab key={result.resultTabId} tabId={result.resultTabId} onOpen={handleOpen} onClose={handleClose}>
            <TabTitle>{result.name}</TabTitle>
          </Tab>
        ))}
        style={[styles]}
      >
        {tab.handlerState.resultTabs.map(result => (
          <TabPanel key={result.resultTabId} tabId={result.resultTabId}>
            <SqlResultPanel panelInit={result.panelParams}/>
          </TabPanel>
        ))}
      </TabsBox>
      <Loader
        loading={tab.handlerState.sqlExecutionState.isSqlExecuting}
        cancelDisabled={!tab.handlerState.sqlExecutionState.canCancel}
        onCancel={tab.handlerState.sqlExecutionState.cancelSQlExecuting}
        overlay
      />
    </wrapper>
  );
});
