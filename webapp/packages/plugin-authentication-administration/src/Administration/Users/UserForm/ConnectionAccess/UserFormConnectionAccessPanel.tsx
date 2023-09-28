/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Group, TextPlaceholder, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from '../Info/DATA_CONTEXT_USER_FORM_INFO_PART';
import { UserFormConnectionAccess } from './UserFormConnectionAccess';

export const UserFormConnectionAccessPanel: TabContainerPanelComponent<UserFormProps> = observer(function UserFormConnectionAccessPanel({
  tabId,
  formState,
  ...rest
}) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const userFormInfoPart = formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);

  useAutoLoad(UserFormConnectionAccessPanel, userFormInfoPart, tab.selected);

  const isAdmin = userFormInfoPart.state.teams.includes('admin');

  if (isAdmin) {
    return (
      <ColoredContainer>
        <Group large>
          <TextPlaceholder>{translate('connections_connection_access_admin_info')}</TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  return <UserFormConnectionAccess tabId={tabId} formState={formState} {...rest} />;
});
