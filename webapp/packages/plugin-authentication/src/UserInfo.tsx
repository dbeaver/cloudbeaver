/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
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
`;

export const UserInfo = observer(function UserInfo() {
  const authInfoService = useService(AuthInfoService);
  const style = useStyles(styles);

  if (!authInfoService.userInfo) {
    return null;
  }

  return styled(style)(
    <user>
      <user-icon>
        <IconOrImage icon='user' viewBox='0 0 28 28' />
      </user-icon>
      <user-name>{authInfoService.userInfo.displayName || authInfoService.userInfo.userId}</user-name>
    </user>
  );
});
