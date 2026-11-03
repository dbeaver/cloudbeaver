/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdministrationPageLayout, AdministrationPageNavigation, type AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabPanel, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { UsersAdministrationTabs } from './UsersAdministrationTabs.js';
import { TeamsPage } from './Teams/TeamsTable/TeamsPage.js';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService.js';
import { UsersPage } from './UsersTable/UsersPage.js';
import { UsersAdministrationService } from './UsersAdministrationService.js';

export const UsersAdministration: AdministrationItemContentComponent = observer(function UsersAdministration({ sub, param }) {
  const usersAdministrationNavigationService = useService(UsersAdministrationNavigationService);
  const usersAdministrationService = useService(UsersAdministrationService);
  const subName = sub?.name || EUsersAdministrationSub.Users;

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }

    usersAdministrationNavigationService.navToSub(tabId);
  }

  return (
    <AdministrationPageLayout>
      <TabsState currentTabId={subName} autoSelect={false} container={usersAdministrationService.tabsContainer} lazy onChange={openSub}>
        <AdministrationPageNavigation>
          <UsersAdministrationTabs />
        </AdministrationPageNavigation>
        <TabPanel tabId={EUsersAdministrationSub.Users} contents>
          <UsersPage param={param} />
        </TabPanel>
        <TabPanel tabId={EUsersAdministrationSub.Teams} contents>
          <TeamsPage />
        </TabPanel>
        <TabPanelList contents />
      </TabsState>
    </AdministrationPageLayout>
  );
});
