/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AdministrationItemContentComponent, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { ToolsPanel, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, ITabData, Tab, TabList, TabPanel, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { MetaParameters } from './MetaParameters/MetaParameters';
import { TeamsPage } from './Teams/TeamsPage';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService';
import { UsersTable } from './UsersTable/UsersTable';

const tabsStyles = css`
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
    height: 33px;
  }
  Tab {
    height: 32px!important;
    text-transform: uppercase;
    font-weight: 500 !important;
  }
  TabPanel {
    flex-direction: column;
  }
`;

export const UsersAdministration: AdministrationItemContentComponent = observer(function UsersAdministration({
  sub, param,
}) {
  const translate = useTranslate();
  const usersAdministrationNavigationService = useService(UsersAdministrationNavigationService);
  const subName = sub?.name || EUsersAdministrationSub.Users;

  const tabStyle = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];
  const style = useStyles(ADMINISTRATION_TOOLS_PANEL_STYLES, tabStyle);

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }

    param = null;

    usersAdministrationNavigationService.navToSub(tabId as EUsersAdministrationSub, param || undefined);
  }

  return styled(style)(
    <TabsState selectedId={subName} lazy onChange={openSub}>
      <ToolsPanel>
        <TabList aria-label='User Administration pages' style={style}>
          <Tab tabId={EUsersAdministrationSub.Users} style={style}>{translate('authentication_administration_item_users')}</Tab>
          <Tab tabId={EUsersAdministrationSub.Teams} style={style}>{translate('administration_teams_tab_title')}</Tab>
          {/* <Tab
            tabId={EUsersAdministrationSub.MetaProperties}
            style={style}
          >
            {translate('authentication_administration_item_metaParameters')}
          </Tab> */}
        </TabList>
      </ToolsPanel>
      <TabPanel tabId={EUsersAdministrationSub.Users}>
        <UsersTable sub={sub} param={param} />
      </TabPanel>
      <TabPanel tabId={EUsersAdministrationSub.Teams}>
        <TeamsPage sub={sub} param={param} />
      </TabPanel>
      <TabPanel tabId={EUsersAdministrationSub.MetaProperties}>
        <MetaParameters />
      </TabPanel>
    </TabsState>
  );
});
