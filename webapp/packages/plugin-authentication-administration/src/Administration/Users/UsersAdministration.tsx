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
import { baseTabStyles, ITabData, Tab, TabList, TabPanel, tabPanelStyles, TabsState, TabTitle, underlineTabStyles } from '@cloudbeaver/core-ui';

import { TeamsPage } from './Teams/TeamsPage';
import style from './UsersAdministration.m.css';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService';
import { UsersPage } from './UsersTable/UsersPage';

const registry: StyleRegistry = [
  [baseTabStyles, { mode: 'append', styles: [underlineTabStyles, style] }],
  [tabPanelStyles, { mode: 'append', styles: [baseTabStyles, style] }],
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
    <SContext registry={registry}>
      <TabsState selectedId={subName} lazy onChange={openSub}>
        <ToolsPanel className={s(styles, { toolsPanel: true })} hasBottomBorder>
          <TabList className={s(styles, { tabList: true })} aria-label="User Administration pages">
            <Tab tabId={EUsersAdministrationSub.Users}>
              <TabTitle className={s(styles, { tabTitle: true })}>{translate('authentication_administration_item_users')}</TabTitle>
            </Tab>
            <Tab tabId={EUsersAdministrationSub.Teams}>
              <TabTitle className={s(styles, { tabTitle: true })}>{translate('administration_teams_tab_title')}</TabTitle>
            </Tab>
          </TabList>
        </ToolsPanel>
        <TabPanel className={s(styles, { tabPanel: true })} tabId={EUsersAdministrationSub.Users}>
          <UsersPage param={param} />
        </TabPanel>
        <TabPanel className={s(styles, { tabPanel: true })} tabId={EUsersAdministrationSub.Teams}>
          <TeamsPage param={param} />
        </TabPanel>
      </TabsState>
    </SContext>
  );
});
