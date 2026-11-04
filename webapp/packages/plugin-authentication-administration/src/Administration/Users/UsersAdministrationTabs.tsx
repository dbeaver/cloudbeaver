/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { Tab, TabList, TabStyles, TabTitle, TabTitleStyles } from '@cloudbeaver/core-ui';

import style from './shared/UsersAdministration.module.css';
import tabStyle from './shared/UsersAdministrationTab.module.css';
import tabTitleStyle from './shared/UsersAdministrationTabTitle.module.css';
import { EUsersAdministrationSub } from './UsersAdministrationNavigationService.js';

const registry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [tabTitleStyle] }],
];

export const UsersAdministrationTabs = observer(function UsersAdministrationTabs() {
  const translate = useTranslate();
  const styles = useS(style, tabStyle);

  return (
    <SContext registry={registry}>
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
  );
});
