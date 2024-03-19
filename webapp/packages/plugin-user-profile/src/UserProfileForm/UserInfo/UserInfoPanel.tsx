/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Container,
  Group,
  GroupTitle,
  InputField,
  Loader,
  ObjectPropertyInfoForm,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { TabPanel } from '@cloudbeaver/core-ui';

import { AuthTokenList } from '../AuthTokens/AuthTokenList';

interface Props {
  user: UserInfo;
  className?: string;
}

export const UserInfoPanel = observer<Props>(function UserInfoPanel({ user, className }) {
  const userMetaParameters = useResource(UserInfoPanel, UserMetaParametersResource, undefined);
  const translate = useTranslate();

  return (
    <TabPanel tabId="info" className={className}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
            <GroupTitle>{translate('plugin_user_profile_info')}</GroupTitle>
            <Container wrap gap>
              <InputField type="text" name="userId" minLength={1} state={user} readOnly required tiny fill>
                {translate('plugin_user_profile_info_id')}
              </InputField>
              <InputField type="text" name="displayName" minLength={1} state={user} readOnly required tiny fill>
                {translate('plugin_user_profile_info_displayName')}
              </InputField>
              <InputField type="text" name="authRole" state={user} autoHide readOnly tiny fill>
                {translate('authentication_user_role')}
              </InputField>
            </Container>
            <Loader state={userMetaParameters} inline>
              {() =>
                userMetaParameters.data.length > 0 && (
                  <Container wrap gap>
                    <ObjectPropertyInfoForm state={user.metaParameters} properties={userMetaParameters.data} readOnly tiny fill />
                  </Container>
                )
              }
            </Loader>
          </Group>
          <Group box medium overflow>
            <GroupTitle>{translate('plugin_user_profile_auth_tokens')}</GroupTitle>
            <AuthTokenList user={user} />
          </Group>
        </Container>
      </ColoredContainer>
    </TabPanel>
  );
});
