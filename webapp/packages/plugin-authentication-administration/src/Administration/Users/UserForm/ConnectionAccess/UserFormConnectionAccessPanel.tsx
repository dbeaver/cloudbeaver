/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import { getUserFormInfoPart } from '../Info/getUserFormInfoPart.js';
import { UserFormConnectionAccess } from './UserFormConnectionAccess.js';

export const UserFormConnectionAccessPanel: TabContainerPanelComponent<UserFormProps> = observer(function UserFormConnectionAccessPanel({
  tabId,
  formState,
  ...rest
}) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const userFormInfoPart = getUserFormInfoPart(formState);

  useAutoLoad(UserFormConnectionAccessPanel, userFormInfoPart, tab.selected);

  const isAdmin = userFormInfoPart.state.teams.includes('admin');

  if (isAdmin) {
    return (
      <Container>
        <Group large>{translate('connections_connection_access_admin_info')}</Group>
      </Container>
    );
  }

  return <UserFormConnectionAccess tabId={tabId} formState={formState} {...rest} />;
});
