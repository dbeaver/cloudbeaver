/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, GroupTitle, InputField, Loader, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { UserProfileFormProps } from '../UserProfileFormService';
import { UserActiveAuthMethods } from './UserActiveAuthMethods/UserActiveAuthMethods';
import { UserProfileFormInfoMetaParameters } from './UserProfileFormInfoMetaParameters';
import type { UserProfileFormInfoPart } from './UserProfileFormInfoPart';

export const UserProfileFormInfo: TabContainerPanelComponent<UserProfileFormProps> = observer(function UserProfileFormInfo({ tabId }) {
  const translate = useTranslate();
  const tab = useTab(tabId);
  const tabState = useTabState<UserProfileFormInfoPart>();

  useAutoLoad(UserProfileFormInfo, tabState, tab.selected);

  const disabled = tabState.isLoading();

  return (
    <ColoredContainer wrap overflow gap>
      <Container medium gap>
        <Group form gap>
          <GroupTitle>{translate('plugin_user_profile_info')}</GroupTitle>
          <Container wrap gap>
            <InputField type="text" name="userId" minLength={1} state={tabState.state} disabled={disabled} readOnly required tiny fill>
              {translate('plugin_user_profile_info_id')}
            </InputField>
            <InputField type="text" name="displayName" minLength={1} state={tabState.state} disabled={disabled} readOnly required tiny fill>
              {translate('plugin_user_profile_info_displayName')}
            </InputField>
            <InputField type="text" name="authRole" state={tabState.state} disabled={disabled} autoHide readOnly tiny fill>
              {translate('authentication_user_role')}
            </InputField>
          </Container>
          <Loader suspense inline>
            <UserProfileFormInfoMetaParameters tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
          </Loader>
        </Group>
        <Group box medium overflow>
          <GroupTitle>{translate('plugin_user_profile_auth_tokens')}</GroupTitle>
          <UserActiveAuthMethods />
        </Group>
      </Container>
    </ColoredContainer>
  );
});
