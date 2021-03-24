/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';
import { css } from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { PlaceholderComponent, StaticImage } from '@cloudbeaver/core-blocks';

import type { IUserDetailsInfoProps } from '../../UsersAdministrationService';

const USER_DETAILS_STYLES = css`
  StaticImage {
    width: 24px;
    height: 24px;
  }
`;

export const Origin: PlaceholderComponent<IUserDetailsInfoProps> = observer(function Origin({ user }) {
  const isLocal = user.origin.type === AUTH_PROVIDER_LOCAL_ID;
  const icon = isLocal ? '/icons/local_connection.svg' : user.origin.icon;
  const title = isLocal ? 'Local user' : user.origin.displayName;

  return styled(USER_DETAILS_STYLES)(
    <StaticImage icon={icon} title={title} />
  );
});
