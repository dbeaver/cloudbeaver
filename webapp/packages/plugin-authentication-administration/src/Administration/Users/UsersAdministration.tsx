/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { s, ToolsPanel, useS, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, ITabData, Tab, TabList, TabPanel, TabsState, TabTitle, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { TeamsPage } from './Teams/TeamsPage';
import style from './UsersAdministration.m.css';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService';
import { UsersPage } from './UsersTable/UsersPage';

const tabsStyles = css`
  tab-inner {
    height: 100%;
  }

  tab-outer {
    height: 100%;
  }
`;

const tabStyle = [ADMINISTRATION_TOOLS_PANEL_STYLES, BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];

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

  return styled(useStyles(tabStyle))(
    <TabsState selectedId={subName} lazy onChange={openSub}>
      <ToolsPanel className={s(styles, { tabPanel: true })}>
        <TabList className={s(styles, { tabList: true })} aria-label="User Administration pages" style={tabStyle}>
          <Tab className={s(styles, { tab: true })} tabId={EUsersAdministrationSub.Users} style={tabStyle}>
            <TabTitle className={s(styles, { tabTitle: true })}>{translate('authentication_administration_item_users')}</TabTitle>
          </Tab>
          <Tab className={s(styles, { tab: true })} tabId={EUsersAdministrationSub.Teams} style={tabStyle}>
            <TabTitle className={s(styles, { tabTitle: true })}>{translate('administration_teams_tab_title')}</TabTitle>
          </Tab>
        </TabList>
      </ToolsPanel>
      <TabPanel className={s(styles, { tabPanel: true })} tabId={EUsersAdministrationSub.Users}>
        <UsersPage sub={sub} param={param} />
      </TabPanel>
      <TabPanel className={s(styles, { tabPanel: true })} tabId={EUsersAdministrationSub.Teams}>
        <TeamsPage sub={sub} param={param} />
      </TabPanel>
    </TabsState>,
  );
});
