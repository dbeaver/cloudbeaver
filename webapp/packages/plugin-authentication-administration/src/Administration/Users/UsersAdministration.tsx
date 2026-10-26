/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import type { AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { Link, s, SContext, type StyleRegistry, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { useService } from '@cloudbeaver/core-di';
import {
  type ITabData,
  Tab,
  TabList,
  TabPanel,
  TabPanelList,
  TabPanelStyles,
  TabsState,
  TabStyles,
  TabTitle,
  TabTitleStyles,
} from '@cloudbeaver/core-ui';

import style from './shared/UsersAdministration.module.css';
import tabStyle from './shared/UsersAdministrationTab.module.css';
import tabPanelStyle from './shared/UsersAdministrationTabPanel.module.css';
import TabTitleModuleStyles from './shared/UsersAdministrationTabTitle.module.css';
import { TeamsPage } from './Teams/TeamsTable/TeamsPage.js';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService.js';
import { UsersPage } from './UsersTable/UsersPage.js';
import { UsersAdministrationService } from './UsersAdministrationService.js';
import { UsersAdministrationHeaderActionsContext } from './UsersAdministrationHeaderActionsContext.js';

const tabPanelRegistry: StyleRegistry = [[TabPanelStyles, { mode: 'append', styles: [tabPanelStyle] }]];

const mainTabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleModuleStyles] }],
];

export const UsersAdministration: AdministrationItemContentComponent = observer(function UsersAdministration({ sub, param }) {
  const translate = useTranslate();
  const usersAdministrationNavigationService = useService(UsersAdministrationNavigationService);
  const usersAdministrationService = useService(UsersAdministrationService);
  const subName = sub?.name || EUsersAdministrationSub.Users;
  const styles = useS(style, tabStyle);
  const [headerActionsContainer, setHeaderActionsContainer] = useState<HTMLElement | null>(null);

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }

    param = null;

    usersAdministrationNavigationService.navToSub(tabId as EUsersAdministrationSub, param || undefined);
  }

  return (
    <UsersAdministrationHeaderActionsContext.Provider value={headerActionsContainer}>
      <section className={s(styles, { administration: true })}>
        <header ref={setHeaderActionsContainer} className={s(styles, { header: true })}>
          <h1 className={s(styles, { title: true })}>
            <Link href={WEBSITE_LINKS.USERS_DOCUMENTATION_PAGE} target="_blank" rel="noreferrer" inline wrapper indicator>
              {translate('authentication_administration_item')}
            </Link>
          </h1>
        </header>
        <TabsState currentTabId={subName} autoSelect={false} container={usersAdministrationService.tabsContainer} lazy onChange={openSub}>
          <SContext registry={mainTabsRegistry}>
            <TabList
              className={s(styles, { tabList: true, administrationTabs: true })}
              aria-label={translate('authentication_administration_pages_label')}
              childrenFirst
              underline
            >
              <Tab tabId={EUsersAdministrationSub.Users}>
                <TabTitle>{translate('authentication_administration_item_users')}</TabTitle>
              </Tab>
              <Tab tabId={EUsersAdministrationSub.Teams}>
                <TabTitle>{translate('administration_teams_tab_title')}</TabTitle>
              </Tab>
            </TabList>
          </SContext>
          <SContext registry={tabPanelRegistry}>
            <TabPanel tabId={EUsersAdministrationSub.Users}>
              <UsersPage param={param} />
            </TabPanel>
            <TabPanel tabId={EUsersAdministrationSub.Teams}>
              <TeamsPage />
            </TabPanel>
            <TabPanelList />
          </SContext>
        </TabsState>
      </section>
    </UsersAdministrationHeaderActionsContext.Provider>
  );
});
