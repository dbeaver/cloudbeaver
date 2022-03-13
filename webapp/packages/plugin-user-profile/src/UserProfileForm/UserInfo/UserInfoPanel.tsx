/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group, GroupTitle, InputField, Loader, ObjectPropertyInfoForm, useDataResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { BASE_TAB_STYLES, TabPanel } from '@cloudbeaver/core-ui';

import { AuthTokenList } from '../AuthTokens/AuthTokenList';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const UserInfoPanel = observer<Props>(function UserInfoPanel({
  user,
  className,
  style,
}) {
  const userMetaParameters = useDataResource(UserInfoPanel, UserMetaParametersResource, undefined);
  const styles = useStyles(BASE_TAB_STYLES, style, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  return styled(styles)(
    <TabPanel tabId='info' className={className}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
            <GroupTitle>{translate('plugin_user_profile_info')}</GroupTitle>
            <Container wrap gap>
              <InputField
                type="text"
                name="userId"
                minLength={1}
                state={user}
                mod='surface'
                readOnly
                required
                tiny
                fill
              >
                {translate('plugin_user_profile_info_id')}
              </InputField>
              <InputField
                type="text"
                name="displayName"
                minLength={1}
                state={user}
                mod='surface'
                readOnly
                required
                tiny
                fill
              >
                {translate('plugin_user_profile_info_displayName')}
              </InputField>
            </Container>
            <Loader state={userMetaParameters} inline>
              {() => userMetaParameters.data.length > 0 && styled(styles)(
                <Container wrap gap>
                  <ObjectPropertyInfoForm
                    state={user.metaParameters}
                    properties={userMetaParameters.data}
                    readOnly
                    tiny
                    fill
                  />
                </Container>
              )}
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
