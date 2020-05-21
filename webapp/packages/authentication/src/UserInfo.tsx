/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { IconOrImage } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { composes, useStyles } from '@dbeaver/core/theming';

import { AuthInfoService } from './AuthInfoService';

const styles = composes(
  css`
    user {
      composes: theme-ripple from global;
    }
  `,
  css`
    user {
      height: 100%;
      padding: 0 16px;
      display: flex;
      align-items: center;
    }
    IconOrImage {
      display: block;
      width: 24px;
    }
    user-name {
      display: block;
      line-height: initial;
      margin-left: 8px;
    }
  `
);

export const UserInfo = observer(function UserInfo() {
  const authInfoService = useService(AuthInfoService);

  if (!authInfoService.userInfo) {
    return null;
  }

  return styled(useStyles(styles))(
    <user as='div'>
      <user-icon as="div">
        <IconOrImage icon='user' viewBox='0 0 28 28' />
      </user-icon>
      <user-name as='div'>{authInfoService.userInfo.displayName || authInfoService.userInfo.userId}</user-name>
    </user>
  );
});
