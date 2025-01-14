/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';

import { UserInfoMetaParametersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import { ColoredContainer, Container, Group, GroupTitle, InputField, Loader, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { IUserProfileFormInfoState } from './IUserProfileFormInfoState.js';
import { UserActiveAuthMethods } from './UserActiveAuthMethods/UserActiveAuthMethods.js';
import { UserProfileFormInfoMetaParameters } from './UserProfileFormInfoMetaParameters.js';

export const UserProfileFormInfo: TabContainerPanelComponent = observer(function UserProfileFormInfo({ tabId }) {
  const translate = useTranslate();
  const userInfoResource = useResource(UserProfileFormInfo, UserInfoResource, undefined);
  const userInfoMetaParametersResource = useResource(UserProfileFormInfo, UserInfoMetaParametersResource, undefined);
  const disabled = userInfoResource.isLoading() || userInfoMetaParametersResource.isLoading();
  const tab = useTab(tabId);

  const state: IUserProfileFormInfoState = {
    userId: userInfoResource.data?.userId || '',
    displayName: userInfoResource.data?.displayName || '',
    authRole: userInfoResource.data?.authRole || '',
    metaParameters: toJS(userInfoMetaParametersResource.data || {}),
  };

  return (
    <ColoredContainer parent overflow compact vertical noWrap gap>
      <Container medium gap>
        <Group form gap>
          <Container wrap gap>
            <InputField type="text" name="userId" minLength={1} state={state} readOnly required tiny fill>
              {translate('plugin_user_profile_info_id')}
            </InputField>
            <InputField type="text" name="displayName" minLength={1} state={state} readOnly required tiny fill>
              {translate('plugin_user_profile_info_displayName')}
            </InputField>
            <InputField type="text" name="authRole" state={state} readOnly autoHide tiny fill>
              {translate('authentication_user_role')}
            </InputField>
          </Container>
          <Loader suspense inline>
            <UserProfileFormInfoMetaParameters state={state} tabSelected={tab.selected} disabled={disabled} />
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
