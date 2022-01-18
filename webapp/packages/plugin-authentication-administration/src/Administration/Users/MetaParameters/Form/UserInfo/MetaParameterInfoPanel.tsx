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
import { TabPanel } from '@cloudbeaver/core-ui';
import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group, InputField, Loader, ObjectPropertyInfoForm, useDataResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { AuthProvidersList } from '../AuthProviders/ConfigurationsList';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const MetaParameterInfoPanel = observer<Props>(function MetaParameterInfoPanel({
  user,
  className,
  style,
}) {
  const userMetaParameters = useDataResource(MetaParameterInfoPanel, UserMetaParametersResource, undefined);
  const styles = useStyles(style, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  return styled(styles)(
    <TabPanel tabId='info' className={className}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
            <Container wrap gap>
              <InputField
                type="text"
                name="userId"
                minLength={1}
                state={user}
                mod='surface'
                disabled
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
                disabled
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
                    category={null}
                    disabled
                    readOnly
                  />
                </Container>
              )}
            </Loader>
          </Group>
          <Group box medium overflow>
            <AuthProvidersList user={user} providers={user.linkedAuthProviders} />
          </Group>
        </Container>

      </ColoredContainer>
    </TabPanel>
  );
});
