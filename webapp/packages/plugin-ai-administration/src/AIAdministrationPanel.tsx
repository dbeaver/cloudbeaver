/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { s, SContext, type StyleRegistry, ToolsPanel, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabList, TabPanelList, TabPanelStyles, TabsState, TabStyles, TabTitleStyles } from '@cloudbeaver/core-ui';
import { observer } from 'mobx-react-lite';

import style from './shared/AIAdministrationPanel.module.css';
import tabStyle from './shared/AIAdministrationPanelTab.module.css';
import tabPanelStyle from './shared/AIAdministrationPanelTabPanel.module.css';
import TabTitleModuleStyles from './shared/AIAdministrationPanelTabTitle.module.css';
import { AIAdministrationTabsService } from './AIAdministrationTabsService.js';
import { AIAdministrationNavigationService, EAIAdministrationSub } from './AIAdministrationNavigationService.js';

const tabPanelRegistry: StyleRegistry = [[TabPanelStyles, { mode: 'append', styles: [tabPanelStyle] }]];

const mainTabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleModuleStyles] }],
];

export const AIAdministrationPanel = observer<AdministrationItemContentProps>(function AIAdministrationPanel({ sub }) {
  const aiAdministrationTabsService = useService(AIAdministrationTabsService);
  const aiAdministrationNavigationService = useService(AIAdministrationNavigationService);
  const styles = useS(style, tabStyle);
  const subName = sub?.name ?? EAIAdministrationSub.Settings;
  const hasOneTab = aiAdministrationTabsService.tabsContainer.getDisplayed().length === 1;

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }
    aiAdministrationNavigationService.navToSub(tabId);
  }

  return (
    <TabsState currentTabId={subName} autoSelect={false} container={aiAdministrationTabsService.tabsContainer} lazy onChange={openSub}>
      <ToolsPanel hidden={hasOneTab} bottomBorder>
        <SContext registry={mainTabsRegistry}>
          <TabList className={s(styles, { tabList: true, administrationTabs: true })} underline />
        </SContext>
      </ToolsPanel>
      <SContext registry={tabPanelRegistry}>
        <TabPanelList />
      </SContext>
    </TabsState>
  );
});
