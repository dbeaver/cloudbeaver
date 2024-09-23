/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, s, SContext, type StyleRegistry, TextPlaceholder, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabIconStyles, TabList, TabListStyles, TabPanel, TabsState, TabStyles } from '@cloudbeaver/core-ui';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures.js';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService.js';
import styles from './shared/SqlResultTabs.module.css';
import SqlResultTabsTab from './shared/SqlResultTabsTab.module.css';
import TabIconModuleStyles from './shared/SqlResultTabsTabIcon.module.css';
import SqlResultTabsTabList from './shared/SqlResultTabsTabList.module.css';
import { SqlResultPanel } from './SqlResultPanel.js';
import { SqlResultTab } from './SqlResultTab.js';
import { SqlResultTabsService } from './SqlResultTabsService.js';

interface Props {
  state: ISqlEditorTabState;
  onTabSelect?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

const registry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [styles] }],
  [TabStyles, { mode: 'append', styles: [SqlResultTabsTab] }],
  [TabIconStyles, { mode: 'append', styles: [TabIconModuleStyles] }],
  [TabListStyles, { mode: 'append', styles: [SqlResultTabsTabList] }],
];

export const SqlResultTabs = observer<Props>(function SqlDataResult({ state, onTabSelect, onTabClose }) {
  const style = useS(styles);
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

  function handleClose(tab: ITabData) {
    const canClose = handleCanClose(tab);

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
    return (
      <TextPlaceholder className={s(style, { textPlaceholder: true })}>
        {translate(dataSource?.emptyPlaceholder ?? 'sql_editor_placeholder')}
      </TextPlaceholder>
    );
  }

  const executable = dataSource?.hasFeature(ESqlDataSourceFeatures.executable);
  const tabList = orderedTabs.map(tab => tab.id);

  return (
    <div className={s(style, { wrapper: true })}>
      <TabsState
        currentTabId={state.currentTabId}
        tabList={tabList}
        canClose={handleCanClose}
        enabledBaseActions
        onChange={handleSelect}
        onClose={handleClose}
      >
        <SContext registry={registry}>
          <TabList className={s(style, { tabListNotExecutable: !executable })} aria-label="SQL Results">
            {orderedTabs.map(result => (
              <SqlResultTab key={result.id} result={result} />
            ))}
          </TabList>
        </SContext>
        {orderedTabs.map(result => (
          <TabPanel key={result.id} tabId={result.id} lazy>
            <SqlResultPanel state={state} id={result.id} />
          </TabPanel>
        ))}
      </TabsState>
    </div>
  );
});
