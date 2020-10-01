/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { useCallback, useMemo } from 'react';
import styled, { css } from 'reshadow';

import { ITab as TabClass } from '@cloudbeaver/core-app';
import {
  Tab, TabPanel, TabTitle, TabsBox, TextPlaceholder, Loader
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlEditorNavigatorService } from '../SqlEditorNavigatorService';
import { SqlResultPanel } from './SqlResultPanel/SqlResultPanel';
import { SqlResultTabsService } from './SqlResultTabsService';

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
  const style = useStyles(styles);
  const translate = useTranslate();
  const navigatorService = useService(SqlEditorNavigatorService);
  const sqlResultTabsService = useService(SqlResultTabsService);

  const orderedTabs = useMemo(
    () => computed(
      () => tab.handlerState.resultTabs
        .slice()
        .sort((tabA, tabB) => {
          if (tabA.groupId === tabB.groupId) {
            return tabA.order - tabB.order;
          }

          const groupA = tab.handlerState.queryTabGroups.find(group => group.groupId === tabA.groupId)!;
          const groupB = tab.handlerState.queryTabGroups.find(group => group.groupId === tabB.groupId)!;

          return groupA.order - groupB.order;
        })
    ),
    [tab]
  );

  const handleOpen = useCallback(
    (resultId: string) => navigatorService.openEditorResult(tab.id, resultId),
    []
  );
  const handleClose = useCallback(
    (resultId: string) => navigatorService.closeEditorResult(tab.id, resultId),
    []
  );

  if (!tab.handlerState.queryTabGroups.length) {
    return <TextPlaceholder>{translate('sql_editor_placeholder')}</TextPlaceholder>;
  }

  const currentId = tab.handlerState.currentResultTabId || '';

  const executionState = sqlResultTabsService.getTabExecutionContext(tab.id);

  return styled(style)(
    <wrapper as="div">
      <TabsBox
        currentTabId={currentId}
        tabs={orderedTabs.get().map(result => (
          <Tab key={result.resultTabId} tabId={result.resultTabId} onOpen={handleOpen} onClose={handleClose}>
            <TabTitle>{result.name}</TabTitle>
          </Tab>
        ))}
        style={[styles]}
      >
        {orderedTabs.get().map(result => (
          <TabPanel key={result.resultTabId} tabId={result.resultTabId}>
            <SqlResultPanel tab={tab} panelInit={result}/>
          </TabPanel>
        ))}
      </TabsBox>
      <Loader
        loading={executionState.isSqlExecuting}
        cancelDisabled={!executionState.canCancel}
        onCancel={executionState.cancelSQlExecuting}
        overlay
      />
    </wrapper>
  );
});
