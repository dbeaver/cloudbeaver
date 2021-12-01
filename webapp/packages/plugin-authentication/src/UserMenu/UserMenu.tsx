/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { topMenuStyles } from '@cloudbeaver/core-app';
import { AuthInfoService, DATA_CONTEXT_USER } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { MenuBaseItem, useMenu } from '@cloudbeaver/core-view';

import { UserInfo } from '../UserInfo';
import { MENU_USER_PROFILE } from './MENU_USER_PROFILE';
import { userMenuStyles } from './userMenuStyles';

export const UserMenu = observer(function UserMenu() {
  const style = useStyles(userMenuStyles);
  const authInfoService = useService(AuthInfoService);
  const menu = useMenu(MENU_USER_PROFILE);

  if (!authInfoService.userInfo) {
    return null;
  }

  const items = menu.getItems().filter(item => !item.hidden);

  if (items.length === 1 && items[0] instanceof MenuBaseItem) {
    const item = items[0];

    if (item.events?.onSelect) {
      return <UserInfo info={authInfoService.userInfo} tooltip={item.label} detached onClick={item.events.onSelect} />;
    }
  }

  menu.context.set(DATA_CONTEXT_USER, authInfoService.userInfo);

  return styled(style)(
    <ContextMenu menu={menu} style={[topMenuStyles]} rtl modal>
      <UserInfo info={authInfoService.userInfo} />
    </ContextMenu>
  );
});
