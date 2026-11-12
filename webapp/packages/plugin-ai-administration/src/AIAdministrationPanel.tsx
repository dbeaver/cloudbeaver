/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  AdministrationPageLayout,
  AdministrationPageNavigation,
  AdministrationTabList,
  type AdministrationItemContentProps,
} from '@cloudbeaver/core-administration';
import { useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { observer } from 'mobx-react-lite';

import { AIAdministrationTabsService } from './AIAdministrationTabsService.js';
import { AIAdministrationNavigationService, EAIAdministrationSub } from './AIAdministrationNavigationService.js';

export const AIAdministrationPanel = observer<AdministrationItemContentProps>(function AIAdministrationPanel({ sub }) {
  const translate = useTranslate();
  const aiAdministrationTabsService = useService(AIAdministrationTabsService);
  const aiAdministrationNavigationService = useService(AIAdministrationNavigationService);
  const subName = sub?.name ?? EAIAdministrationSub.Settings;
  const hasOneTab = aiAdministrationTabsService.tabsContainer.getDisplayed().length === 1;

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }

    aiAdministrationNavigationService.navToSub(tabId);
  }

  return (
    <AdministrationPageLayout>
      <TabsState currentTabId={subName} autoSelect={false} container={aiAdministrationTabsService.tabsContainer} lazy onChange={openSub}>
        <AdministrationPageNavigation hidden={hasOneTab}>
          <AdministrationTabList aria-label={translate('ai_administration_tab_title')} />
        </AdministrationPageNavigation>
        <TabPanelList contents />
      </TabsState>
    </AdministrationPageLayout>
  );
});
