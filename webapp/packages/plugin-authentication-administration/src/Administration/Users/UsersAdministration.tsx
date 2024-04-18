/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { s, SContext, StyleRegistry, ToolsPanel, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import {
  ITabData,
  Tab,
  TabList,
  TabPanel,
  TabPanelStyles,
  TabsState,
  TabStyles,
  TabTitle,
  TabTitleStyles,
  TabUnderlineStyleRegistry,
} from '@cloudbeaver/core-ui';

import style from './shared/UsersAdministration.m.css';
import tabStyle from './shared/UsersAdministrationTab.m.css';
import tabPanelStyle from './shared/UsersAdministrationTabPanel.m.css';
import TabTitleModuleStyles from './shared/UsersAdministrationTabTitle.m.css';
import { TeamsPage } from './Teams/TeamsPage';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService';
import { UsersPage } from './UsersTable/UsersPage';

const tabPanelRegistry: StyleRegistry = [[TabPanelStyles, { mode: 'append', styles: [tabPanelStyle] }]];

const mainTabsRegistry: StyleRegistry = [
  ...TabUnderlineStyleRegistry,
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleModuleStyles] }],
];

export const UsersAdministration: AdministrationItemContentComponent = observer(function UsersAdministration({ sub, param }) {
  const translate = useTranslate();
  const usersAdministrationNavigationService = useService(UsersAdministrationNavigationService);
  const subName = sub?.name || EUsersAdministrationSub.Users;
  const styles = useS(style);

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }

    param = null;

    usersAdministrationNavigationService.navToSub(tabId as EUsersAdministrationSub, param || undefined);
  }

  return (
    <TabsState selectedId={subName} lazy onChange={openSub}>
      <ToolsPanel bottomBorder>
        <TabList className={s(styles, { tabList: true })} aria-label="User Administration pages">
          <SContext registry={mainTabsRegistry}>
            <Tab tabId={EUsersAdministrationSub.Users}>
              <TabTitle>{translate('authentication_administration_item_users')}</TabTitle>
            </Tab>
            <Tab tabId={EUsersAdministrationSub.Teams}>
              <TabTitle>{translate('administration_teams_tab_title')}</TabTitle>
            </Tab>
          </SContext>
        </TabList>
      </ToolsPanel>
      <SContext registry={tabPanelRegistry}>
        <TabPanel tabId={EUsersAdministrationSub.Users}>
          <UsersPage param={param} />
        </TabPanel>
        <TabPanel tabId={EUsersAdministrationSub.Teams}>
          <TeamsPage param={param} />
        </TabPanel>
      </SContext>
    </TabsState>
  );
});
