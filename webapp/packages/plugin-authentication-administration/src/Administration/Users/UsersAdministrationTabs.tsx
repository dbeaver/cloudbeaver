/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AdministrationTabList } from '@cloudbeaver/core-administration';
import { useTranslate } from '@cloudbeaver/core-blocks';
import { Tab, TabTitle } from '@cloudbeaver/core-ui';

import { EUsersAdministrationSub } from './UsersAdministrationNavigationService.js';

export const UsersAdministrationTabs = observer(function UsersAdministrationTabs() {
  const translate = useTranslate();

  return (
    <AdministrationTabList aria-label={translate('authentication_administration_pages_label')} childrenFirst>
      <Tab tabId={EUsersAdministrationSub.Users}>
        <TabTitle>{translate('authentication_administration_item_users')}</TabTitle>
      </Tab>
      <Tab tabId={EUsersAdministrationSub.Teams}>
        <TabTitle>{translate('administration_teams_tab_title')}</TabTitle>
      </Tab>
    </AdministrationTabList>
  );
});
