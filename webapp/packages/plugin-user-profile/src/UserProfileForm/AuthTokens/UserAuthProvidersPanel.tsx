/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group } from '@cloudbeaver/core-blocks';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { BASE_TAB_STYLES, TabPanel } from '@cloudbeaver/core-ui';

import { AuthProvidersList } from '../AuthProviders/AuthProvidersList';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const UserAuthProviderPanel = observer<Props>(function UserAuthProviderPanel({
  user,
  className,
  style,
}) {
  const styles = useStyles(BASE_TAB_STYLES, style, BASE_CONTAINERS_STYLES);

  return styled(styles)(
    <TabPanel tabId='auth-providers' className={className}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group box medium overflow>
            <AuthProvidersList user={user} providers={user.linkedAuthProviders} />
          </Group>
        </Container>
      </ColoredContainer>
    </TabPanel>
  );
});
