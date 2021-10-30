/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group, InputField, TabPanel } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

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
          </Group>
        </Container>
      </ColoredContainer>
    </TabPanel>
  );
});
