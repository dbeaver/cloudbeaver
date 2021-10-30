/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { topMenuStyles } from '@cloudbeaver/core-app';
import { AuthInfoService, DATA_CONTEXT_USER } from '@cloudbeaver/core-authentication';
import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_USER_PROFILE } from './UserMenu/MENU_USER_PROFILE';
import { userMenuStyles } from './UserMenu/userMenuStyles';

const styles = css`
  user {
    height: 100%;
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
  const style = useStyles(styles, userMenuStyles);
  const menu = useMenu(MENU_USER_PROFILE);
  menu.context.set(DATA_CONTEXT_USER, authInfoService.userInfo);

  if (!authInfoService.userInfo) {
    return null;
  }

  return styled(style)(
    <ContextMenu menu={menu} style={[topMenuStyles]} rtl modal>
      <user>
        <user-icon>
          <IconOrImage icon='user' viewBox='0 0 28 28' />
        </user-icon>
        <user-name>{authInfoService.userInfo.displayName || authInfoService.userInfo.userId}</user-name>
      </user>
    </ContextMenu>
  );
});
