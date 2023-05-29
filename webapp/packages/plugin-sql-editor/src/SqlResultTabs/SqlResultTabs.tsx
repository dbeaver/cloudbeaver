/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { getComputed, TextPlaceholder, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, ITabData, TabList, TabPanel, TabsState } from '@cloudbeaver/core-ui';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService';
import { SqlResultPanel } from './SqlResultPanel';
import { SqlResultTab } from './SqlResultTab';
import { SqlResultTabsService } from './SqlResultTabsService';

const styles = css`
  Tab {
    composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
  }
  TabIcon {
    composes: theme-text-surface from global;
  }
  wrapper {
    overflow: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    position: relative;
  }
  TabsBox {
    height: 100%;
  }
  TabList {
    composes: theme-background-background theme-text-text-primary-on-light from global;
    display: flex;
    overflow: auto;
  }
  TabList:not([|executable]) tab-outer:only-child {
    display: none;
  }
  TextPlaceholder {
    padding: 24px;
  }
`;

interface Props {
  state: ISqlEditorTabState;
  onTabSelect?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export const SqlResultTabs = observer<Props>(function SqlDataResult({ state, onTabSelect, onTabClose }) {
  const style = useStyles(BASE_TAB_STYLES, styles);
  const translate = useTranslate();
  const sqlResultTabsService = useService(SqlResultTabsService);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const dataSource = getComputed(() => sqlDataSourceService.get(state.editorId));

  const orderedTabs = state.tabs.slice().sort((tabA, tabB) => {
    const resultTabA = state.resultTabs.find(tab => tab.tabId === tabA.id);
    const resultTabB = state.resultTabs.find(tab => tab.tabId === tabB.id);

    if (resultTabA && resultTabB && tabA.order === tabB.order) {
      return resultTabA.indexInResultSet - resultTabB.indexInResultSet;
    }

    return tabA.order - tabB.order;
  });

  function handleSelect(tab: ITabData) {
    sqlResultTabsService.selectResultTab(state, tab.tabId);
    onTabSelect?.(tab.tabId);
  }

  async function handleClose(tab: ITabData) {
    const canClose = await sqlResultTabsService.canCloseResultTab(state, tab.tabId);

    if (canClose) {
      sqlResultTabsService.removeResultTab(state, tab.tabId);
      onTabClose?.(tab.tabId);
    }
  }

  function handleCanClose(tab: ITabData): boolean {
    const resultTab = state.resultTabs.find(tabState => tabState.tabId === tab.tabId);

    if (resultTab) {
      const group = state.resultGroups.find(group => group.groupId === resultTab.groupId)!;

      return dataSource?.databaseModels.some(model => model.id === group.modelId) !== true;
    }
    return true;
  }

  if (!state.tabs.length) {
    return styled(style)(<TextPlaceholder>{translate(dataSource?.emptyPlaceholder ?? 'sql_editor_placeholder')}</TextPlaceholder>);
  }

  const executable = dataSource?.hasFeature(ESqlDataSourceFeatures.executable);
  const tabList = orderedTabs.map(tab => tab.id);

  return styled(style)(
    <wrapper>
      <TabsState
        currentTabId={state.currentTabId}
        tabList={tabList}
        canClose={handleCanClose}
        enabledBaseActions
        onChange={handleSelect}
        onClose={handleClose}
      >
        <TabList aria-label="SQL Results" {...use({ executable })} style={styles}>
          {orderedTabs.map(result => (
            <SqlResultTab key={result.id} result={result} style={styles} />
          ))}
        </TabList>
        {orderedTabs.map(result => (
          <TabPanel key={result.id} tabId={result.id} lazy>
            <SqlResultPanel state={state} id={result.id} />
          </TabPanel>
        ))}
      </TabsState>
    </wrapper>,
  );
});
