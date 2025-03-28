/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, FieldCheckbox, Group, GroupTitle, Placeholder, useAutoLoad, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import { AdministrationUsersManagementService } from '../../../../AdministrationUsersManagementService.js';
import type { UserFormProps } from '../AdministrationUserFormService.js';
import { UserFormInfoCredentials } from './UserFormInfoCredentials.js';
import { UserFormInfoMetaParameters } from './UserFormInfoMetaParameters.js';
import type { UserFormInfoPart } from './UserFormInfoPart.js';
import { UserFormInfoPartService } from './UserFormInfoPartService.js';
import { UserFormInfoTeams } from './UserFormInfoTeams.js';
import { UsersResource } from '@cloudbeaver/core-authentication';
import { constructUserEnabledCaption } from './constructUserEnabledCaption.js';

export const UserFormInfo: TabContainerPanelComponent<UserFormProps> = observer(function UserFormInfo({ tabId, formState }) {
  const translate = useTranslate();
  const tab = useTab(tabId);
  const tabState = useTabState<UserFormInfoPart>();
  const userFormInfoPartService = useService(UserFormInfoPartService);
  const administrationUsersManagementService = useService(AdministrationUsersManagementService);
  const userId = tabState.state.userId ?? formState.state.userId;
  const user = useResource(UserFormInfo, UsersResource, userId, {
    active: formState.mode === 'edit',
  });

  useAutoLoad(UserFormInfo, [tabState, ...administrationUsersManagementService.loaders], tab.selected);

  const disabled = tabState.isLoading();
  const userManagementDisabled = administrationUsersManagementService.externalUserProviderEnabled;

  return (
    <Container overflow>
      <Group small gap vertical overflow>
        <UserFormInfoCredentials formState={formState} tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
      </Group>
      <Group small gap overflow>
        <Placeholder container={userFormInfoPartService.placeholderContainer} formState={formState} />
        <GroupTitle>{translate('authentication_user_status')}</GroupTitle>
        <FieldCheckbox
          caption={constructUserEnabledCaption(user.data)}
          label={translate('authentication_user_enabled')}
          id={`${formState.id}_user_enabled`}
          name="enabled"
          state={tabState.state}
          disabled={disabled || userManagementDisabled}
        />
        <UserFormInfoTeams formState={formState} tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
      </Group>
      <UserFormInfoMetaParameters formState={formState} tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
    </Container>
  );
});
